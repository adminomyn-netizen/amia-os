-- 0037 — KHO NÂNG CAO + KHOÁ KỲ (theo SOP kho MSC: FIN-PROC-08, COS-FIN-03, FIN-PROC-10).
--  * Chuyển kho: gửi → đang chuyển → kho nhận xác nhận (hạn 24 giờ) mới ghi tăng kho nhận; lệch thì chờ xử lý, không đóng.
--  * Kiểm kê có duyệt: chụp tồn sổ → đếm thực → gửi duyệt → người khác duyệt mới ghi chênh lệch vào sổ kho.
--  * Xử lý vật tư (huỷ, hao hụt, trả nhà cung cấp, điều chỉnh): chỉ ghi sổ sau khi duyệt, người duyệt khác người lập.
--  * Xuất khẩn cấp y tế: ghi sổ ngay, hậu kiểm trong 24 giờ.
--  * Lô và hạn dùng: tồn theo lô tính kiểu FEFO (hàng hết hạn sớm coi như xuất trước).
--  * Khoá kỳ kế toán theo tháng: chặn ghi thêm sổ quỹ và công nợ nhà cung cấp của tháng đã khoá; mở lại phải có lý do và để lại dấu vết.

alter table public.kho_so_cai drop constraint kho_so_cai_loai_check;
alter table public.kho_so_cai add constraint kho_so_cai_loai_check
  check (loai in ('nhap','xuat_ban','cap_ca','tra_ca','kiem_ke','dieu_chinh','chuyen_di','chuyen_den','hao_hut','xuat_khan','tra_ncc'));

-- ─── Chuyển kho ─────────────────────────────────────────────────────────────
create table public.phieu_chuyen_kho (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  tu_chi_nhanh_id uuid not null references public.chi_nhanh (id),
  den_chi_nhanh_id uuid not null references public.chi_nhanh (id),
  san_pham_id uuid not null references public.san_pham (id),
  so_luong_gui numeric(14,3) not null check (so_luong_gui > 0),
  so_lo text,
  han_dung date,
  so_luong_nhan numeric(14,3) check (so_luong_nhan is null or so_luong_nhan >= 0),
  trang_thai text not null default 'dang_chuyen' check (trang_thai in ('dang_chuyen','da_nhan','cho_xu_ly_chenh_lech','da_xu_ly','huy')),
  ghi_chu text,
  ly_do_lech text,
  cach_xu_ly text check (cach_xu_ly is null or cach_xu_ly in ('ghi_hao_hut','tra_ve_nguon')),
  nguoi_gui_id uuid not null references public.nhan_vien (id),
  gui_luc timestamptz not null default now(),
  han_nhan timestamptz not null default (now() + interval '24 hours'),
  nguoi_nhan_id uuid references public.nhan_vien (id),
  nhan_luc timestamptz,
  nguoi_xu_ly_id uuid references public.nhan_vien (id),
  check (tu_chi_nhanh_id <> den_chi_nhanh_id)
);
create index phieu_chuyen_kho_tt_idx on public.phieu_chuyen_kho (trang_thai, gui_luc desc);

create function public.gui_chuyen_kho(p_tu uuid, p_den uuid, p_sp uuid, p_sl numeric, p_lo text, p_han date, p_ghi_chu text, p_nguoi uuid) returns uuid
language plpgsql as $$
declare v_id uuid; v_ma text; v_ton numeric;
begin
  if p_tu = p_den then raise exception 'Kho đi và kho đến phải khác nhau.'; end if;
  if p_sl is null or p_sl <= 0 then raise exception 'Số lượng chuyển phải lớn hơn 0.'; end if;
  perform pg_advisory_xact_lock(hashtext(p_tu::text || p_sp::text));
  v_ton := public.ton_kho(p_tu, p_sp);
  if v_ton < p_sl then raise exception 'Kho đi chỉ còn % — không chuyển được %.', trim(to_char(v_ton, 'FM999999990.###')), trim(to_char(p_sl, 'FM999999990.###')); end if;
  v_ma := 'CK' || lpad(public.so_tiep_theo('chuyen_kho')::text, 6, '0');
  insert into public.phieu_chuyen_kho (ma, tu_chi_nhanh_id, den_chi_nhanh_id, san_pham_id, so_luong_gui, so_lo, han_dung, ghi_chu, nguoi_gui_id)
    values (v_ma, p_tu, p_den, p_sp, p_sl, nullif(p_lo, ''), p_han, nullif(p_ghi_chu, ''), p_nguoi) returning id into v_id;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
    values (p_tu, p_sp, 'chuyen_di', -p_sl, nullif(p_lo, ''), p_han, 'Chuyển kho ' || v_ma, p_nguoi);
  return v_id;
end $$;

create function public.nhan_chuyen_kho(p_phieu uuid, p_sl_thuc numeric, p_ly_do text, p_nguoi uuid) returns void
language plpgsql as $$
declare p public.phieu_chuyen_kho;
begin
  select * into p from public.phieu_chuyen_kho where id = p_phieu for update;
  if not found then raise exception 'Không tìm thấy phiếu chuyển.'; end if;
  if p.trang_thai <> 'dang_chuyen' then raise exception 'Phiếu không còn ở trạng thái đang chuyển.'; end if;
  if p_sl_thuc is null or p_sl_thuc < 0 or p_sl_thuc > p.so_luong_gui then raise exception 'Số thực nhận phải từ 0 đến % (số đã gửi).', trim(to_char(p.so_luong_gui, 'FM999999990.###')); end if;
  if p_sl_thuc <> p.so_luong_gui and coalesce(btrim(p_ly_do), '') = '' then raise exception 'Nhận lệch số lượng cần ghi lý do (thiếu, hỏng, sai lô…).'; end if;
  if p_sl_thuc > 0 then
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
      values (p.den_chi_nhanh_id, p.san_pham_id, 'chuyen_den', p_sl_thuc, p.so_lo, p.han_dung, 'Nhận chuyển kho ' || p.ma, p_nguoi);
  end if;
  update public.phieu_chuyen_kho set so_luong_nhan = p_sl_thuc, nguoi_nhan_id = p_nguoi, nhan_luc = now(), ly_do_lech = nullif(btrim(p_ly_do), ''),
    trang_thai = case when p_sl_thuc = so_luong_gui then 'da_nhan' else 'cho_xu_ly_chenh_lech' end where id = p.id;
end $$;

create function public.xu_ly_lech_chuyen_kho(p_phieu uuid, p_cach text, p_nguoi uuid) returns void
language plpgsql as $$
declare p public.phieu_chuyen_kho; v_lech numeric;
begin
  select * into p from public.phieu_chuyen_kho where id = p_phieu for update;
  if not found then raise exception 'Không tìm thấy phiếu chuyển.'; end if;
  if p.trang_thai <> 'cho_xu_ly_chenh_lech' then raise exception 'Phiếu không có chênh lệch chờ xử lý.'; end if;
  if p_cach not in ('ghi_hao_hut', 'tra_ve_nguon') then raise exception 'Chọn cách xử lý chênh lệch.'; end if;
  v_lech := p.so_luong_gui - coalesce(p.so_luong_nhan, 0);
  if p_cach = 'tra_ve_nguon' and v_lech > 0 then
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
      values (p.tu_chi_nhanh_id, p.san_pham_id, 'dieu_chinh', v_lech, p.so_lo, p.han_dung, 'Hoàn phần lệch phiếu chuyển ' || p.ma, p_nguoi);
  end if;
  update public.phieu_chuyen_kho set trang_thai = 'da_xu_ly', cach_xu_ly = p_cach, nguoi_xu_ly_id = p_nguoi where id = p.id;
end $$;

create function public.huy_chuyen_kho(p_phieu uuid, p_nguoi uuid) returns void
language plpgsql as $$
declare p public.phieu_chuyen_kho;
begin
  select * into p from public.phieu_chuyen_kho where id = p_phieu for update;
  if not found then raise exception 'Không tìm thấy phiếu chuyển.'; end if;
  if p.trang_thai <> 'dang_chuyen' then raise exception 'Chỉ huỷ được phiếu đang chuyển, chưa có kho nhận.'; end if;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
    values (p.tu_chi_nhanh_id, p.san_pham_id, 'dieu_chinh', p.so_luong_gui, p.so_lo, p.han_dung, 'Huỷ phiếu chuyển ' || p.ma, p_nguoi);
  update public.phieu_chuyen_kho set trang_thai = 'huy', nguoi_xu_ly_id = p_nguoi where id = p.id;
end $$;

-- ─── Kiểm kê có duyệt ───────────────────────────────────────────────────────
create table public.phieu_kiem_ke (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  ngay date not null,
  loai text not null default 'thang' check (loai in ('thang','dot_xuat')),
  trang_thai text not null default 'dang_dem' check (trang_thai in ('dang_dem','cho_duyet','da_duyet','tu_choi')),
  nguoi_lap_id uuid not null references public.nhan_vien (id),
  nguoi_dem_2_id uuid references public.nhan_vien (id),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  ly_do text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create unique index phieu_kiem_ke_mo_idx on public.phieu_kiem_ke (chi_nhanh_id) where trang_thai in ('dang_dem','cho_duyet');
create table public.phieu_kiem_ke_dong (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.phieu_kiem_ke (id) on delete cascade,
  san_pham_id uuid not null references public.san_pham (id),
  ton_so numeric(14,3) not null,
  ton_thuc numeric(14,3) check (ton_thuc is null or ton_thuc >= 0),
  ghi_chu text,
  unique (phieu_id, san_pham_id)
);

create function public.tao_phieu_kiem_ke(p_cn uuid, p_ngay date, p_loai text, p_nguoi uuid, p_nguoi_2 uuid, p_ghi_chu text) returns uuid
language plpgsql as $$
declare v_id uuid; v_ma text;
begin
  if p_nguoi_2 is not null and p_nguoi_2 = p_nguoi then raise exception 'Người đếm thứ hai phải khác người lập phiếu.'; end if;
  if exists (select 1 from public.phieu_kiem_ke where chi_nhanh_id = p_cn and trang_thai in ('dang_dem','cho_duyet')) then
    raise exception 'Chi nhánh này đang có một phiếu kiểm kê chưa xong. Hoàn tất hoặc từ chối phiếu đó trước.';
  end if;
  v_ma := 'KK' || lpad(public.so_tiep_theo('kiem_ke')::text, 6, '0');
  insert into public.phieu_kiem_ke (ma, chi_nhanh_id, ngay, loai, nguoi_lap_id, nguoi_dem_2_id, ghi_chu)
    values (v_ma, p_cn, p_ngay, p_loai, p_nguoi, p_nguoi_2, nullif(p_ghi_chu, '')) returning id into v_id;
  insert into public.phieu_kiem_ke_dong (phieu_id, san_pham_id, ton_so)
    select v_id, s.id, public.ton_kho(p_cn, s.id) from public.san_pham s where s.hoat_dong and s.theo_doi_kho;
  return v_id;
end $$;

create function public.duyet_phieu_kiem_ke(p_phieu uuid, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void
language plpgsql as $$
declare p public.phieu_kiem_ke; d record; v_lech numeric;
begin
  select * into p from public.phieu_kiem_ke where id = p_phieu for update;
  if not found then raise exception 'Không tìm thấy phiếu kiểm kê.'; end if;
  if p.trang_thai <> 'cho_duyet' then raise exception 'Phiếu chưa gửi duyệt hoặc đã xử lý.'; end if;
  if not p_bo_qua_kiem and (p.nguoi_lap_id = p_nguoi or p.nguoi_dem_2_id = p_nguoi) then raise exception 'Người duyệt phải khác người đếm.'; end if;
  for d in select * from public.phieu_kiem_ke_dong where phieu_id = p.id and ton_thuc is not null loop
    v_lech := d.ton_thuc - d.ton_so;
    if v_lech <> 0 then
      insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, ghi_chu, nguoi_id)
        values (p.chi_nhanh_id, d.san_pham_id, 'kiem_ke', v_lech, 'Kiểm kê ' || p.ma || ': sổ ' || trim(to_char(d.ton_so, 'FM999999990.###')) || ', thực tế ' || trim(to_char(d.ton_thuc, 'FM999999990.###')), p_nguoi);
    end if;
  end loop;
  update public.phieu_kiem_ke set trang_thai = 'da_duyet', nguoi_duyet_id = p_nguoi, duyet_luc = now() where id = p.id;
end $$;

-- ─── Xử lý vật tư ───────────────────────────────────────────────────────────
create table public.xu_ly_vat_tu (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  san_pham_id uuid not null references public.san_pham (id),
  loai text not null check (loai in ('huy','hao_hut','tra_ncc','dieu_chinh_giam','dieu_chinh_tang')),
  so_luong numeric(14,3) not null check (so_luong > 0),
  so_lo text,
  han_dung date,
  ncc_id uuid references public.nha_cung_cap (id),
  ly_do text not null,
  trang_thai text not null default 'cho_duyet' check (trang_thai in ('cho_duyet','da_duyet','tu_choi','huy')),
  nguoi_lap_id uuid not null references public.nhan_vien (id),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  ly_do_tu_choi text,
  tao_luc timestamptz not null default now(),
  check (loai <> 'tra_ncc' or ncc_id is not null)
);
create index xu_ly_vat_tu_tt_idx on public.xu_ly_vat_tu (trang_thai, tao_luc desc);

create function public.duyet_xu_ly_vat_tu(p_id uuid, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void
language plpgsql as $$
declare x public.xu_ly_vat_tu; v_loai text; v_dau int; v_ton numeric;
begin
  select * into x from public.xu_ly_vat_tu where id = p_id for update;
  if not found then raise exception 'Không tìm thấy phiếu xử lý.'; end if;
  if x.trang_thai <> 'cho_duyet' then raise exception 'Phiếu không còn chờ duyệt.'; end if;
  if not p_bo_qua_kiem and x.nguoi_lap_id = p_nguoi then raise exception 'Người duyệt phải khác người lập phiếu.'; end if;
  v_dau := case when x.loai = 'dieu_chinh_tang' then 1 else -1 end;
  v_loai := case x.loai when 'huy' then 'hao_hut' when 'hao_hut' then 'hao_hut' when 'tra_ncc' then 'tra_ncc' else 'dieu_chinh' end;
  perform pg_advisory_xact_lock(hashtext(x.chi_nhanh_id::text || x.san_pham_id::text));
  v_ton := public.ton_kho(x.chi_nhanh_id, x.san_pham_id);
  if v_dau < 0 and v_ton < x.so_luong then raise exception 'Kho chỉ còn % — không ghi giảm % được.', trim(to_char(v_ton, 'FM999999990.###')), trim(to_char(x.so_luong, 'FM999999990.###')); end if;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
    values (x.chi_nhanh_id, x.san_pham_id, v_loai, v_dau * x.so_luong, x.so_lo, x.han_dung, 'Xử lý vật tư ' || x.ma || ': ' || x.ly_do, p_nguoi);
  update public.xu_ly_vat_tu set trang_thai = 'da_duyet', nguoi_duyet_id = p_nguoi, duyet_luc = now() where id = x.id;
end $$;

-- ─── Xuất khẩn cấp y tế ─────────────────────────────────────────────────────
create table public.phieu_xuat_khan (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  san_pham_id uuid not null references public.san_pham (id),
  so_luong numeric(14,3) not null check (so_luong > 0),
  so_lo text,
  han_dung date,
  khach_id uuid references public.khach_hang (id),
  ly_do_lam_sang text not null,
  nguoi_quyet_dinh_id uuid not null references public.nhan_vien (id),
  nguoi_de_nghi text,
  nguoi_nhan text,
  trang_thai text not null default 'cho_hau_kiem' check (trang_thai in ('cho_hau_kiem','da_hau_kiem','vuot_tham_quyen')),
  xuat_luc timestamptz not null default now(),
  han_hau_kiem timestamptz not null default (now() + interval '24 hours'),
  hau_kiem_boi uuid references public.nhan_vien (id),
  hau_kiem_luc timestamptz,
  ket_luan text,
  nguoi_ghi_id uuid not null references public.nhan_vien (id)
);
create index phieu_xuat_khan_tt_idx on public.phieu_xuat_khan (trang_thai, xuat_luc desc);

create function public.xuat_khan_cap(p_cn uuid, p_sp uuid, p_sl numeric, p_lo text, p_han date, p_khach uuid, p_ly_do text, p_quyet_dinh uuid, p_de_nghi text, p_nhan text, p_nguoi uuid) returns uuid
language plpgsql as $$
declare v_id uuid; v_ma text; v_ton numeric;
begin
  if p_sl is null or p_sl <= 0 then raise exception 'Số lượng xuất phải lớn hơn 0.'; end if;
  if coalesce(btrim(p_ly_do), '') = '' then raise exception 'Cần ghi lý do lâm sàng.'; end if;
  perform pg_advisory_xact_lock(hashtext(p_cn::text || p_sp::text));
  v_ton := public.ton_kho(p_cn, p_sp);
  if v_ton < p_sl then raise exception 'Kho chỉ còn % — không xuất được %.', trim(to_char(v_ton, 'FM999999990.###')), trim(to_char(p_sl, 'FM999999990.###')); end if;
  v_ma := 'XK' || lpad(public.so_tiep_theo('xuat_khan')::text, 6, '0');
  insert into public.phieu_xuat_khan (ma, chi_nhanh_id, san_pham_id, so_luong, so_lo, han_dung, khach_id, ly_do_lam_sang, nguoi_quyet_dinh_id, nguoi_de_nghi, nguoi_nhan, nguoi_ghi_id)
    values (v_ma, p_cn, p_sp, p_sl, nullif(p_lo, ''), p_han, p_khach, btrim(p_ly_do), p_quyet_dinh, nullif(p_de_nghi, ''), nullif(p_nhan, ''), p_nguoi) returning id into v_id;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
    values (p_cn, p_sp, 'xuat_khan', -p_sl, nullif(p_lo, ''), p_han, 'Xuất khẩn cấp ' || v_ma || ': ' || btrim(p_ly_do), p_nguoi);
  return v_id;
end $$;

-- ─── Lô và hạn dùng (FEFO) ──────────────────────────────────────────────────
-- Mỗi lô có số nhập; tồn thực của mặt hàng được "đặt" vào các lô hết hạn muộn nhất trước (nghĩa là lô hết hạn sớm đã xuất trước).
create view public.v_ton_lo with (security_invoker = true) as
with lo as (
  select chi_nhanh_id, san_pham_id, coalesce(so_lo, '') as so_lo, han_dung, sum(so_luong) as nhap
    from public.kho_so_cai
   where so_luong > 0 and loai in ('nhap', 'chuyen_den') and (so_lo is not null or han_dung is not null)
   group by chi_nhanh_id, san_pham_id, coalesce(so_lo, ''), han_dung
), ton as (
  select chi_nhanh_id, san_pham_id, sum(so_luong) as t from public.kho_so_cai group by chi_nhanh_id, san_pham_id
), x as (
  select lo.*, ton.t,
         coalesce(sum(lo.nhap) over (partition by lo.chi_nhanh_id, lo.san_pham_id order by lo.han_dung desc nulls first, lo.so_lo rows between unbounded preceding and 1 preceding), 0) as truoc
    from lo join ton using (chi_nhanh_id, san_pham_id)
)
select chi_nhanh_id, san_pham_id, so_lo, han_dung, nhap, greatest(0, least(nhap, t - truoc)) as con_lai from x;

-- ─── Khoá kỳ kế toán ────────────────────────────────────────────────────────
create table public.ky_ke_toan (
  thang text primary key check (thang ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  trang_thai text not null default 'da_khoa' check (trang_thai in ('da_khoa','mo_lai')),
  khoa_boi uuid references public.nhan_vien (id),
  khoa_luc timestamptz,
  mo_lai_boi uuid references public.nhan_vien (id),
  mo_lai_luc timestamptz,
  ly_do_mo_lai text,
  ghi_chu text
);
create table public.ky_ke_toan_nhat_ky (
  id bigint generated always as identity primary key,
  thang text not null,
  hanh_dong text not null check (hanh_dong in ('khoa','mo_lai','khoa_lai')),
  nguoi_id uuid not null references public.nhan_vien (id),
  ly_do text,
  luc timestamptz not null default now()
);
create trigger ky_ke_toan_nhat_ky_chi_them before update or delete on public.ky_ke_toan_nhat_ky for each row execute function public.chi_them_dong();

create function public.khoa_ky(p_thang text, p_nguoi uuid, p_ghi_chu text) returns void language plpgsql as $$
declare v_nay text := to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM'); k public.ky_ke_toan;
begin
  if p_thang !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Tháng không hợp lệ.'; end if;
  if p_thang >= v_nay then raise exception 'Chỉ khoá được tháng đã kết thúc.'; end if;
  select * into k from public.ky_ke_toan where thang = p_thang for update;
  if found and k.trang_thai = 'da_khoa' then raise exception 'Tháng % đã khoá.', p_thang; end if;
  if found then
    update public.ky_ke_toan set trang_thai = 'da_khoa', khoa_boi = p_nguoi, khoa_luc = now(), ghi_chu = nullif(p_ghi_chu, '') where thang = p_thang;
    insert into public.ky_ke_toan_nhat_ky (thang, hanh_dong, nguoi_id, ly_do) values (p_thang, 'khoa_lai', p_nguoi, nullif(p_ghi_chu, ''));
  else
    insert into public.ky_ke_toan (thang, khoa_boi, khoa_luc, ghi_chu) values (p_thang, p_nguoi, now(), nullif(p_ghi_chu, ''));
    insert into public.ky_ke_toan_nhat_ky (thang, hanh_dong, nguoi_id, ly_do) values (p_thang, 'khoa', p_nguoi, nullif(p_ghi_chu, ''));
  end if;
end $$;

create function public.mo_lai_ky(p_thang text, p_nguoi uuid, p_ly_do text) returns void language plpgsql as $$
begin
  if coalesce(btrim(p_ly_do), '') = '' then raise exception 'Mở lại kỳ phải ghi lý do.'; end if;
  update public.ky_ke_toan set trang_thai = 'mo_lai', mo_lai_boi = p_nguoi, mo_lai_luc = now(), ly_do_mo_lai = btrim(p_ly_do) where thang = p_thang and trang_thai = 'da_khoa';
  if not found then raise exception 'Tháng % chưa khoá.', p_thang; end if;
  insert into public.ky_ke_toan_nhat_ky (thang, hanh_dong, nguoi_id, ly_do) values (p_thang, 'mo_lai', p_nguoi, btrim(p_ly_do));
end $$;

create function public.chan_ky_da_khoa() returns trigger language plpgsql as $$
declare v_ngay date;
begin
  v_ngay := new.ngay;
  if exists (select 1 from public.ky_ke_toan where thang = to_char(v_ngay, 'YYYY-MM') and trang_thai = 'da_khoa') then
    raise exception 'Tháng % đã khoá sổ — không ghi thêm. Ghi vào kỳ sau hoặc đề nghị mở lại kỳ.', to_char(v_ngay, 'MM/YYYY');
  end if;
  return new;
end $$;
create trigger so_quy_chan_ky before insert on public.so_quy for each row execute function public.chan_ky_da_khoa();
create trigger ncc_so_cai_chan_ky before insert on public.ncc_so_cai for each row execute function public.chan_ky_da_khoa();

revoke all on function
  public.gui_chuyen_kho(uuid, uuid, uuid, numeric, text, date, text, uuid), public.nhan_chuyen_kho(uuid, numeric, text, uuid), public.xu_ly_lech_chuyen_kho(uuid, text, uuid), public.huy_chuyen_kho(uuid, uuid),
  public.tao_phieu_kiem_ke(uuid, date, text, uuid, uuid, text), public.duyet_phieu_kiem_ke(uuid, uuid, boolean), public.duyet_xu_ly_vat_tu(uuid, uuid, boolean),
  public.xuat_khan_cap(uuid, uuid, numeric, text, date, uuid, text, uuid, text, text, uuid), public.khoa_ky(text, uuid, text), public.mo_lai_ky(text, uuid, text)
  from public, anon, authenticated;

select public.khoa_tat_ca_bang();

-- 0029 — MUA HÀNG & CÔNG NỢ NHÀ CUNG CẤP (theo BeDental "Kho & Mua sắm", rút gọn đề nghị + đơn mua thành MỘT phiếu có bước duyệt).
-- Luồng: nháp → chờ duyệt → đã duyệt → (đang nhận) → đã nhận; huỷ được trước khi nhận đủ. Nhận hàng ghi thẳng vào sổ kho (nhập) và tạo công nợ phải trả.
-- Công nợ NCC là sổ cái chỉ thêm dòng: Σ(hoá đơn) − Σ(thanh toán). Thanh toán NCC đồng thời ghi dòng chi vào sổ quỹ (cùng một giao dịch).
create table public.nha_cung_cap (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nguoi_lien_he text,
  dien_thoai text,
  email text,
  dia_chi text,
  ma_so_thue text,
  so_ngay_no int not null default 30 check (so_ngay_no between 0 and 365),
  ghi_chu text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.don_mua (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  ncc_id uuid not null references public.nha_cung_cap (id),
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'dang_nhan', 'da_nhan', 'huy')),
  ngay_dat date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  ngay_du_kien date,
  ghi_chu text,
  ly_do text,
  nguoi_tao_id uuid not null references public.nhan_vien (id),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create index don_mua_tt_idx on public.don_mua (trang_thai, tao_luc desc);

create table public.don_mua_dong (
  id uuid primary key default gen_random_uuid(),
  don_mua_id uuid not null references public.don_mua (id) on delete cascade,
  san_pham_id uuid not null references public.san_pham (id),
  so_luong numeric(14, 3) not null check (so_luong > 0),
  don_gia bigint not null default 0 check (don_gia >= 0),
  da_nhan numeric(14, 3) not null default 0 check (da_nhan >= 0),
  unique (don_mua_id, san_pham_id),
  check (da_nhan <= so_luong)
);

create table public.ncc_so_cai (
  id bigint generated always as identity primary key,
  ncc_id uuid not null references public.nha_cung_cap (id),
  ngay date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  loai text not null check (loai in ('hoa_don', 'thanh_toan', 'dieu_chinh')),
  so_tien bigint not null check (so_tien <> 0),  -- có dấu: + nợ thêm, − nợ giảm
  don_mua_id uuid references public.don_mua (id),
  so_quy_id uuid references public.so_quy (id),
  ghi_chu text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index ncc_so_cai_idx on public.ncc_so_cai (ncc_id, ngay);
create trigger ncc_so_cai_chi_them before update or delete on public.ncc_so_cai
  for each row execute function public.chi_them_dong();

create view public.v_cong_no_ncc with (security_invoker = true) as
  select n.id as ncc_id, n.ma, n.ten, n.so_ngay_no, n.hoat_dong,
         coalesce(sum(s.so_tien), 0)::bigint as con_no,
         coalesce(sum(s.so_tien) filter (where s.loai = 'hoa_don'), 0)::bigint as tong_hoa_don,
         max(s.ngay) filter (where s.loai = 'thanh_toan') as thanh_toan_cuoi
    from public.nha_cung_cap n left join public.ncc_so_cai s on s.ncc_id = n.id
   group by n.id;

-- Nhận hàng một phần hoặc đủ: p_dong = [{"dong_id","so_luong","so_lo","han_dung"}]. Một giao dịch: sổ kho + đã nhận + công nợ + trạng thái.
create function public.nhan_hang_don_mua(p_don uuid, p_nguoi uuid, p_dong jsonb) returns void language plpgsql as $$
declare d public.don_mua; x jsonb; l public.don_mua_dong; v_sl numeric; v_tong bigint := 0; v_con int;
begin
  select * into d from public.don_mua where id = p_don for update;
  if not found then raise exception 'Không tìm thấy đơn mua.'; end if;
  if d.trang_thai not in ('da_duyet', 'dang_nhan') then raise exception 'Đơn chưa duyệt hoặc đã đóng, không nhận hàng được.'; end if;
  for x in select * from jsonb_array_elements(p_dong) loop
    v_sl := coalesce((x ->> 'so_luong')::numeric, 0);
    if v_sl = 0 then continue; end if;
    if v_sl < 0 then raise exception 'Số lượng nhận phải lớn hơn 0.'; end if;
    select * into l from public.don_mua_dong where id = (x ->> 'dong_id')::uuid and don_mua_id = p_don for update;
    if not found then raise exception 'Dòng hàng không thuộc đơn này.'; end if;
    if l.da_nhan + v_sl > l.so_luong then raise exception 'Nhận quá số lượng đặt (còn % chưa nhận).', l.so_luong - l.da_nhan; end if;
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, so_lo, han_dung, ghi_chu, nguoi_id)
      values (d.chi_nhanh_id, l.san_pham_id, 'nhap', v_sl, nullif(l.don_gia, 0), nullif(x ->> 'so_lo', ''), nullif(x ->> 'han_dung', '')::date, 'Nhận hàng đơn ' || d.ma, p_nguoi);
    if l.don_gia > 0 then update public.san_pham set gia_nhap_don_vi = l.don_gia where id = l.san_pham_id; end if;
    update public.don_mua_dong set da_nhan = da_nhan + v_sl where id = l.id;
    v_tong := v_tong + round(v_sl * l.don_gia);
  end loop;
  if v_tong > 0 then
    insert into public.ncc_so_cai (ncc_id, loai, so_tien, don_mua_id, ghi_chu, nguoi_id) values (d.ncc_id, 'hoa_don', v_tong, d.id, 'Nhận hàng đơn ' || d.ma, p_nguoi);
  end if;
  select count(*) into v_con from public.don_mua_dong where don_mua_id = p_don and da_nhan < so_luong;
  update public.don_mua set trang_thai = case when v_con = 0 then 'da_nhan' else 'dang_nhan' end where id = p_don;
end $$;

-- Thanh toán nhà cung cấp: giảm công nợ + ghi một dòng chi vào sổ quỹ (cùng giao dịch). Không trả quá số đang nợ.
create function public.thanh_toan_ncc(p_ncc uuid, p_quy uuid, p_so_tien bigint, p_ngay date, p_ghi_chu text, p_nguoi uuid) returns void language plpgsql as $$
declare n public.nha_cung_cap; v_no bigint; v_lt uuid; v_quy uuid; v_ma text;
begin
  select * into n from public.nha_cung_cap where id = p_ncc for update;
  if not found then raise exception 'Không tìm thấy nhà cung cấp.'; end if;
  if p_so_tien <= 0 then raise exception 'Số tiền thanh toán phải lớn hơn 0.'; end if;
  select coalesce(sum(so_tien), 0) into v_no from public.ncc_so_cai where ncc_id = p_ncc;
  if p_so_tien > v_no then raise exception 'Số thanh toán lớn hơn công nợ hiện có (%).', v_no; end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong;
  if v_quy is null then raise exception 'Quỹ không hợp lệ.'; end if;
  select id into v_lt from public.loai_thu_chi where ten = 'Chi nhà cung cấp';
  v_ma := 'PC' || lpad(public.so_tiep_theo('so_quy_PC')::text, 6, '0');
  insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
    values (v_ma, p_ngay, v_quy, 'chi', p_so_tien, v_lt, 'Thanh toán nhà cung cấp' || coalesce(': ' || nullif(p_ghi_chu, ''), ''), n.ten, p_nguoi);
  insert into public.ncc_so_cai (ncc_id, ngay, loai, so_tien, so_quy_id, ghi_chu, nguoi_id)
    values (p_ncc, p_ngay, 'thanh_toan', -p_so_tien, (select id from public.so_quy where ma = v_ma), nullif(p_ghi_chu, ''), p_nguoi);
end $$;
revoke all on function public.nhan_hang_don_mua(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.thanh_toan_ncc(uuid, uuid, bigint, date, text, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();

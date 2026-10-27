-- 0034 — LƯƠNG: điều kiện lương theo ngày hiệu lực, kỳ lương, bảng lương lưu BẢN CHỤP từng dòng, khoản cộng/trừ, chi lương vào sổ quỹ.
-- Theo công thức bảng lương MSC (docs/msc-lark/nhan-su-ho-so-cong-luong.md mục 4 và 10.2). Thứ tự tính giữ như Lark, tham số (giảm trừ, BHXH, biểu thuế, ăn ca) nằm ở cau_hinh,
-- KHÔNG viết cứng. Các số lấy từ bản scan (85% thử việc, ăn ca 35.000, biểu thuế) đang chờ kế toán xác nhận — bảng lương là TẠM TÍNH cho tới khi chốt.
-- Tách nhiệm vụ: người lập ≠ người duyệt; người chi ≠ người duyệt (trừ Kỹ thuật, do tầng ứng dụng kiểm). Tạm ứng lương đã chi tự được trừ vào kỳ lương gần nhất, mỗi khoản đúng một lần.
alter table public.de_xuat
  add column loai_tam_ung text check (loai_tam_ung is null or loai_tam_ung in ('luong', 'chi_phi')),
  add column ky_luong_tru_id uuid;
update public.de_xuat set loai_tam_ung = 'chi_phi' where loai = 'tam_ung';
alter table public.de_xuat add constraint de_xuat_tam_ung_loai check ((loai = 'tam_ung') = (loai_tam_ung is not null));

create table public.dieu_kien_luong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  hieu_luc_tu date not null,
  tinh_trang text not null default 'chinh_thuc' check (tinh_trang in ('thu_viec', 'chinh_thuc', 'cong_tac_vien')),
  luong_co_ban bigint not null default 0 check (luong_co_ban >= 0),
  thu_nhap_chuc_danh bigint check (thu_nhap_chuc_danh is null or thu_nhap_chuc_danh >= 0),
  ty_le_thu_viec numeric(5, 2) not null default 85 check (ty_le_thu_viec between 0 and 100),
  dong_bh boolean not null default false,
  luong_dong_bh bigint not null default 0 check (luong_dong_bh >= 0),
  an_ca_ngay int not null default 0 check (an_ca_ngay >= 0),
  dong_phuc_cap bigint not null default 0 check (dong_phuc_cap >= 0),
  nha_o_cap bigint not null default 0 check (nha_o_cap >= 0),
  so_npt int not null default 0 check (so_npt >= 0),
  ghi_chu text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  unique (nhan_vien_id, hieu_luc_tu)
);

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('luong.giam_tru_ban_than', '15500000', 'Giảm trừ gia cảnh bản thân/tháng (đ). Chờ kế toán thuế xác nhận ngày hiệu lực.'),
  ('luong.giam_tru_npt', '6200000', 'Giảm trừ mỗi người phụ thuộc/tháng (đ).'),
  ('luong.bhxh_nld_pct', '10.5', 'BHXH người lao động trên lương đóng BH (%).'),
  ('luong.dong_phuc_toi_da', '150000', 'Trần phụ cấp đồng phục/tháng (đ).'),
  ('luong.he_so_ot', '1.5', 'Hệ số tăng ca ngoài giờ hành chính (khối chi nhánh). Khối văn phòng không trả tiền, bù nghỉ.'),
  ('luong.bieu_thue', '[[10000000,5],[30000000,10],[60000000,20],[100000000,30],[null,35]]', 'Biểu thuế TNCN luỹ tiến theo tháng: [trần phần thu nhập, thuế suất %]. Lấy từ công thức Lark, CHỜ kế toán thuế xác nhận.'),
  ('luong.thue_vang_lai_pct', '10', 'Thuế khấu trừ cho thử việc/cộng tác viên khi thu nhập từ ngưỡng (%).'),
  ('luong.thue_vang_lai_nguong', '5000000', 'Ngưỡng thu nhập áp thuế khấu trừ cho thử việc/cộng tác viên (đ).')
on conflict (khoa) do nothing;

create table public.ky_luong (
  id uuid primary key default gen_random_uuid(),
  nam int not null,
  thang int not null check (thang between 1 and 12),
  cong_chuan numeric(4, 1) not null default 26 check (cong_chuan > 0),
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'da_chi')),
  nguoi_lap_id uuid not null references public.nhan_vien (id),
  lap_luc timestamptz not null default now(),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  nguoi_chi_id uuid references public.nhan_vien (id),
  chi_luc timestamptz,
  so_quy_id uuid references public.so_quy (id),
  ghi_chu text,
  unique (nam, thang)
);
alter table public.de_xuat add constraint de_xuat_ky_luong_tru_fk foreign key (ky_luong_tru_id) references public.ky_luong (id) on delete set null;

create table public.luong_khoan (
  id uuid primary key default gen_random_uuid(),
  ky_id uuid not null references public.ky_luong (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id),
  loai text not null check (loai in ('cong', 'tru', 'tru_vi_pham')),
  tieu_de text not null,
  so_tien bigint not null check (so_tien > 0),
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);

create table public.bang_luong_dong (
  id uuid primary key default gen_random_uuid(),
  ky_id uuid not null references public.ky_luong (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id),
  tinh_trang text not null,
  luong_co_ban bigint not null,
  cong_chuan numeric(4, 1) not null,
  cong_tinh numeric(5, 1) not null,
  luong_cong bigint not null,
  ot_gio numeric(5, 1) not null default 0,
  luong_ot bigint not null default 0,
  an_ca bigint not null default 0,
  dong_phuc bigint not null default 0,
  nha_o bigint not null default 0,
  hoa_hong bigint not null default 0,
  cong_khac bigint not null default 0,
  gross bigint not null,
  bhxh_nld bigint not null default 0,
  giam_tru bigint not null default 0,
  thu_nhap_tinh_thue bigint not null default 0,
  thue_tncn bigint not null default 0,
  tru_khac bigint not null default 0,
  tru_vi_pham bigint not null default 0,
  tam_ung bigint not null default 0,
  thuc_tra bigint not null,
  unique (ky_id, nhan_vien_id)
);

create function public.thue_luy_tien(p_tntt bigint) returns bigint language plpgsql stable as $$
declare b jsonb; s jsonb; truoc numeric := 0; tran numeric; tong numeric := 0;
begin
  select gia_tri::jsonb into b from public.cau_hinh where khoa = 'luong.bieu_thue';
  for s in select * from jsonb_array_elements(b) loop
    tran := (s ->> 0)::numeric;
    if p_tntt <= truoc then exit; end if;
    tong := tong + (least(p_tntt, coalesce(tran, p_tntt)) - truoc) * (s ->> 1)::numeric / 100;
    if tran is null then exit; end if;
    truoc := tran;
  end loop;
  return round(tong)::bigint;
end $$;

-- Tính (hoặc tính lại) cả kỳ: chỉ khi kỳ còn ở trạng thái nháp. Mỗi dòng là bản chụp, sau khi duyệt không đổi.
create function public.tinh_ky_luong(p_ky uuid) returns int language plpgsql as $$
declare k public.ky_luong; cuoi date; dau date; r record; d public.dieu_kien_luong; cfg jsonb;
  v_cong numeric; v_luong_cong bigint; v_ot bigint; v_an bigint; v_dp bigint; v_no bigint; v_hh bigint; v_ck bigint; v_gross bigint; v_bh bigint; v_gt bigint; v_chiu bigint; v_tt bigint; v_thue bigint; v_tk bigint; v_vp bigint; v_tu bigint; v_n int := 0;
  g_bt numeric; g_npt numeric; g_bh numeric; g_dp numeric; g_ot numeric; g_vl numeric; g_vln numeric;
begin
  select * into k from public.ky_luong where id = p_ky for update;
  if not found then raise exception 'Không tìm thấy kỳ lương.'; end if;
  if k.trang_thai <> 'nhap' then raise exception 'Kỳ lương đã gửi duyệt, không tính lại được.'; end if;
  dau := make_date(k.nam, k.thang, 1); cuoi := (dau + interval '1 month - 1 day')::date;
  select jsonb_object_agg(khoa, gia_tri) into cfg from public.cau_hinh where khoa like 'luong.%';
  g_bt := (cfg ->> 'luong.giam_tru_ban_than')::numeric; g_npt := (cfg ->> 'luong.giam_tru_npt')::numeric; g_bh := (cfg ->> 'luong.bhxh_nld_pct')::numeric;
  g_dp := (cfg ->> 'luong.dong_phuc_toi_da')::numeric; g_ot := (cfg ->> 'luong.he_so_ot')::numeric; g_vl := (cfg ->> 'luong.thue_vang_lai_pct')::numeric; g_vln := (cfg ->> 'luong.thue_vang_lai_nguong')::numeric;
  update public.de_xuat set ky_luong_tru_id = null where ky_luong_tru_id = k.id;
  delete from public.bang_luong_dong where ky_id = k.id;
  for r in select * from public.tong_hop_cong(k.nam, k.thang, null) loop
    select * into d from public.dieu_kien_luong where nhan_vien_id = r.nhan_vien_id and hieu_luc_tu <= cuoi order by hieu_luc_tu desc limit 1;
    if not found or d.luong_co_ban = 0 then continue; end if;
    v_cong := least(r.cong_tinh_luong, k.cong_chuan);
    v_luong_cong := round(d.luong_co_ban * v_cong / k.cong_chuan * (case when d.tinh_trang = 'thu_viec' then d.ty_le_thu_viec / 100 else 1 end));
    v_ot := case when r.khung = 'chi_nhanh' then round(r.ot_gio / (k.cong_chuan * 8) * coalesce(d.thu_nhap_chuc_danh, d.luong_co_ban) * g_ot * (case when d.tinh_trang = 'thu_viec' then 0.85 else 1 end)) else 0 end;
    v_an := ceil(v_cong * d.an_ca_ngay / 1000.0) * 1000;
    v_dp := least(round(d.dong_phuc_cap / k.cong_chuan * v_cong), d.dong_phuc_cap, g_dp);
    v_no := round(d.nha_o_cap / k.cong_chuan * v_cong);
    select coalesce(sum(x.hoa_hong), 0) into v_hh from public.bc_nhan_vien(dau, cuoi, null) x where x.nhan_vien_id = r.nhan_vien_id;
    select coalesce(sum(case when loai = 'cong' then so_tien end), 0), coalesce(sum(case when loai = 'tru' then so_tien end), 0), coalesce(sum(case when loai = 'tru_vi_pham' then so_tien end), 0)
      into v_ck, v_tk, v_vp from public.luong_khoan where ky_id = k.id and nhan_vien_id = r.nhan_vien_id;
    select coalesce(sum(de.so_tien), 0) into v_tu from public.de_xuat de
     where de.loai = 'tam_ung' and de.loai_tam_ung = 'luong' and de.trang_thai = 'da_thuc_hien' and de.ky_luong_tru_id is null and de.nguoi_gui_id = r.nhan_vien_id
       and exists (select 1 from public.so_quy s where s.id = de.so_quy_id and s.ngay <= cuoi);
    update public.de_xuat de set ky_luong_tru_id = k.id
     where de.loai = 'tam_ung' and de.loai_tam_ung = 'luong' and de.trang_thai = 'da_thuc_hien' and de.ky_luong_tru_id is null and de.nguoi_gui_id = r.nhan_vien_id
       and exists (select 1 from public.so_quy s where s.id = de.so_quy_id and s.ngay <= cuoi);
    v_gross := v_luong_cong + v_ot + v_an + v_dp + v_no + v_hh + v_ck;
    v_bh := case when d.dong_bh then round(d.luong_dong_bh * g_bh / 100) else 0 end;
    v_gt := round(g_bt + d.so_npt * g_npt);
    v_chiu := v_gross - v_an - v_ot - v_dp;
    v_tt := greatest(0, v_chiu - v_gt - v_bh);
    v_thue := case d.tinh_trang when 'chinh_thuc' then public.thue_luy_tien(v_tt) else (case when v_gross >= g_vln then round(v_gross * g_vl / 100) else 0 end) end;
    insert into public.bang_luong_dong (ky_id, nhan_vien_id, tinh_trang, luong_co_ban, cong_chuan, cong_tinh, luong_cong, ot_gio, luong_ot, an_ca, dong_phuc, nha_o, hoa_hong, cong_khac, gross, bhxh_nld, giam_tru, thu_nhap_tinh_thue, thue_tncn, tru_khac, tru_vi_pham, tam_ung, thuc_tra)
    values (k.id, r.nhan_vien_id, d.tinh_trang, d.luong_co_ban, k.cong_chuan, round(v_cong, 1), v_luong_cong, r.ot_gio, v_ot, v_an, v_dp, v_no, v_hh, v_ck, v_gross, v_bh, v_gt, v_tt, v_thue, v_tk, v_vp, v_tu,
            round((v_gross - v_bh - v_thue - v_tk - v_vp - v_tu) / 1000.0) * 1000);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Chi lương: ghi MỘT dòng chi vào sổ quỹ bằng tổng thực trả + đánh dấu đã chi, cùng một giao dịch.
create function public.chi_ky_luong(p_ky uuid, p_quy uuid, p_ngay date, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void language plpgsql as $$
declare k public.ky_luong; v_tong bigint; v_quy uuid; v_lt uuid; v_id uuid; v_ma text;
begin
  select * into k from public.ky_luong where id = p_ky for update;
  if not found then raise exception 'Không tìm thấy kỳ lương.'; end if;
  if k.trang_thai <> 'da_duyet' then raise exception 'Kỳ lương chưa được duyệt hoặc đã chi.'; end if;
  if not p_bo_qua_kiem and k.nguoi_duyet_id = p_nguoi then raise exception 'Người duyệt không tự chi lương cùng kỳ.'; end if;
  select coalesce(sum(thuc_tra), 0) into v_tong from public.bang_luong_dong where ky_id = k.id;
  if v_tong <= 0 then raise exception 'Kỳ lương không có số phải chi.'; end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong;
  if v_quy is null then raise exception 'Quỹ không hợp lệ.'; end if;
  select id into v_lt from public.loai_thu_chi where ten like 'Chi phí nhân sự%' limit 1;
  v_ma := 'PC' || lpad(public.so_tiep_theo('so_quy_PC')::text, 6, '0');
  insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
    values (v_ma, p_ngay, v_quy, 'chi', v_tong, v_lt, 'Chi lương tháng ' || lpad(k.thang::text, 2, '0') || '/' || k.nam, 'Nhân viên', p_nguoi) returning id into v_id;
  update public.ky_luong set trang_thai = 'da_chi', nguoi_chi_id = p_nguoi, chi_luc = now(), so_quy_id = v_id where id = k.id;
end $$;

-- Hoàn ứng chỉ cho tạm ứng chi phí (tạm ứng lương thì trừ vào kỳ lương).
create or replace function public.chi_theo_de_xuat(p_de_xuat uuid, p_quy uuid, p_loai_thu_chi uuid, p_ngay date, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void language plpgsql as $$
declare d public.de_xuat; g public.de_xuat; v_quy uuid; v_lt uuid; v_ma text; v_id uuid; v_ten text; v_chenh bigint; v_tien bigint; v_huong text;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.loai = 'mua_sam' then raise exception 'Đề xuất mua sắm không chi trực tiếp — hãy lập đơn mua.'; end if;
  if d.trang_thai <> 'da_duyet' then raise exception 'Đề xuất chưa được duyệt hoặc đã thực hiện.'; end if;
  if not p_bo_qua_kiem and d.nguoi_duyet_id = p_nguoi then raise exception 'Người duyệt không tự thực hiện chi cùng đề xuất.'; end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong and chi_nhanh_id = d.chi_nhanh_id;
  if v_quy is null then raise exception 'Quỹ không hợp lệ cho chi nhánh của đề xuất.'; end if;
  select ho_ten into v_ten from public.nhan_vien where id = d.nguoi_gui_id;
  v_tien := d.so_tien; v_huong := 'chi';
  if d.loai = 'hoan_ung' then
    select * into g from public.de_xuat where id = d.de_xuat_goc_id;
    if g.trang_thai <> 'da_thuc_hien' or g.loai <> 'tam_ung' or g.loai_tam_ung <> 'chi_phi' then raise exception 'Chỉ hoàn ứng cho tạm ứng chi phí đã chi.'; end if;
    v_chenh := d.so_tien - g.so_tien;
    v_tien := abs(v_chenh);
    v_huong := case when v_chenh > 0 then 'chi' else 'thu' end;
  end if;
  if v_tien > 0 then
    if v_huong = 'chi' then
      if d.loai = 'hoan_khach' then select id into v_lt from public.loai_thu_chi where ten = 'Hoàn tiền khách';
      elsif d.loai = 'tam_ung' and d.loai_tam_ung = 'luong' then select id into v_lt from public.loai_thu_chi where ten like 'Chi phí nhân sự%' limit 1;
      else select id into v_lt from public.loai_thu_chi where id = p_loai_thu_chi and huong = 'chi' and hoat_dong and not he_thong; end if;
    else
      select id into v_lt from public.loai_thu_chi where ten = 'Thu khác';
    end if;
    if v_lt is null then raise exception 'Phân loại không hợp lệ.'; end if;
    v_ma := (case v_huong when 'chi' then 'PC' else 'PT' end) || lpad(public.so_tiep_theo('so_quy_' || (case v_huong when 'chi' then 'PC' else 'PT' end))::text, 6, '0');
    insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
      values (v_ma, p_ngay, v_quy, v_huong, v_tien, v_lt,
        (case d.loai when 'tam_ung' then (case d.loai_tam_ung when 'luong' then 'Tạm ứng lương: ' else 'Tạm ứng chi phí: ' end) when 'hoan_ung' then 'Hoàn ứng ' || d.ma || ': ' when 'hoan_khach' then 'Hoàn trả khách: ' else 'Thanh toán: ' end) || d.tieu_de,
        coalesce(d.doi_tuong, v_ten), p_nguoi)
      returning id into v_id;
  end if;
  update public.de_xuat set trang_thai = 'da_thuc_hien', so_quy_id = v_id where id = d.id;
end $$;

revoke all on function public.thue_luy_tien(bigint), public.tinh_ky_luong(uuid), public.chi_ky_luong(uuid, uuid, date, uuid, boolean) from public, anon, authenticated;

select public.khoa_tat_ca_bang();

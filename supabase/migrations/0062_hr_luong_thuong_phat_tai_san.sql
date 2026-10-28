-- 0062 — NHÂN SỰ (đợt Lark, phần 3): bảng lương các tháng đã chi (lưu đúng số của Lark), lương cộng tác viên, thuế TNCN lần 1, thưởng/phạt, ghi nhận hoa hồng-thưởng từ Kinh doanh, BSC, tài sản công ty cấp.
-- Số tiền = số nguyên đồng. Các bảng này chứa SỐ LIỆU LỊCH SỬ đã chốt ở Lark (không tính lại): kỳ lương mới của AMIA OS vẫn đi qua ky_luong/bang_luong_dong.
-- Đều khoá RLS (chỉ máy chủ đọc, ứng dụng kiểm quyền hr.hoso). Gỡ cả đợt bằng go_dot_hr (0060/0061 đã liệt kê các bảng này).
create table public.hr_luong_lark (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  nam int not null,
  thang int not null check (thang between 1 and 12),
  nguon text not null check (nguon in ('4.4', '4.1')),
  tinh_trang text,
  khung_lam_viec text,
  don_vi text,
  phong_ban text,
  luong_co_ban bigint,
  cong_chuan numeric(5, 1),
  tong_cong numeric(8, 3),
  thu_nhap_chuc_danh bigint,
  luong_ot bigint,
  thuong_hieu_suat bigint,
  an_ca bigint,
  dong_phuc bigint,
  nha_o bigint,
  cong_khac bigint,
  thuong_hoa_hong_dv bigint,
  gross bigint,
  bhxh_nld bigint,
  bhxh_cty bigint,
  tong_giam_tru bigint,
  thu_nhap_chiu_thue bigint,
  thu_nhap_tinh_thue bigint,
  thue_tncn bigint,
  tru_khac_tam_ung bigint,
  quy_nhan_vien bigint,
  tong_khau_tru bigint,
  thuc_tra bigint,
  thanh_toan_l1 bigint,
  nhap_dot text references public.nhap_dot (ma),
  unique (nhan_vien_id, nam, thang)
);

create table public.hr_luong_ctv (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  ho_ten text,
  ma_nv text,
  email text,
  nam int,
  thang int,
  ngay date,
  don_gia bigint,
  ngay_cong numeric(6, 2),
  thuong_khac bigint,
  tong_thu_nhap bigint,
  thue_tncn bigint,
  thuc_nhan bigint,
  ngan_hang text,
  so_tai_khoan text,
  chu_tai_khoan text,
  nhap_dot text references public.nhap_dot (ma)
);

create table public.hr_thue_lan1 (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date,
  so_tien bigint,
  nhap_dot text references public.nhap_dot (ma)
);

create table public.hr_thuong_phat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  ngay_lap date,
  nam int,
  thang int,
  noi_dung text,
  khoan_thu bigint,
  khoan_chi bigint,
  trang_thai text,
  ghi_chu text,
  ma_goc text,
  nhap_dot text references public.nhap_dot (ma)
);
comment on table public.hr_thuong_phat is 'Lark 5.4 Quản lý thưởng phạt. khoan_thu = nhân viên nộp phạt (thu), khoan_chi = thưởng chi cho nhân viên.';

create table public.hr_ghi_nhan_kd (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  ngay date,
  nam int,
  thang int,
  don_vi text,
  phong_ban text,
  doanh_so_dich_vu bigint,
  doanh_so_my_pham bigint,
  phi_tri_lieu bigint,
  hh_dich_vu bigint,
  hh_my_pham bigint,
  hh_ban_lanh_dao bigint,
  hh_gdcn bigint,
  thuong_ds_truong_bp bigint,
  thuong_vuot_dat_ca_nhan bigint,
  thuong_vuot_chi_nhanh bigint,
  tro_cap_truc_dem bigint,
  thuong bigint,
  tong_hh_ca_nhan bigint,
  tong_hh_thuc_nhan bigint,
  tong_cong bigint,
  ghi_chu text,
  ma_tham_chieu text,
  nhap_dot text references public.nhap_dot (ma)
);

create table public.hr_bsc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  nam int not null,
  thang int not null,
  hieu_qua numeric(8, 3),
  nhap_dot text references public.nhap_dot (ma)
);

create table public.hr_tai_san (
  id uuid primary key default gen_random_uuid(),
  ten_tai_san text not null,
  loai text,
  hang_model text,
  so_luong numeric(8, 2),
  don_vi_tinh text,
  tinh_trang text,
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  ngay_cap date,
  ngay_thu_hoi date,
  ghi_chu text,
  nhap_dot text references public.nhap_dot (ma)
);

select public.khoa_tat_ca_bang();

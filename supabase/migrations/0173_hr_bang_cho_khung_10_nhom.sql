-- 0173 — Nhân sự: bảng cho các mục còn thiếu của khung 10 nhóm (mục tiêu/đánh giá thử việc, đào tạo, KPI + thi đua, cấp bậc, thăng chức,
-- checklist bàn giao, chốt công–lương–BHXH, phỏng vấn thôi việc). Tài sản cấp phát dùng hr_tai_san, khen thưởng–kỷ luật dùng hr_thuong_phat (đã có từ đợt chuyển Lark).
-- Chỉ máy chủ (khoá service) đọc/ghi, FORCE RLS như các bảng khác (cuối tệp).

create table public.thu_viec_muc_tieu (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  moc int not null check (moc in (30, 60)),
  noi_dung text not null check (char_length(noi_dung) between 2 and 500),
  tieu_chi text check (tieu_chi is null or char_length(tieu_chi) <= 500),
  ket_qua text not null default 'chua' check (ket_qua in ('chua', 'dat', 'chua_dat')),
  nguoi_tao_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index thu_viec_muc_tieu_nv_idx on public.thu_viec_muc_tieu (nhan_vien_id, moc);

create table public.thu_viec_danh_gia (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  moc int not null check (moc in (30, 60)),
  vai text not null check (vai in ('mentor', 'quan_ly', 'nhan_su')),
  nguoi_danh_gia_id uuid references public.nhan_vien (id) on delete set null,
  diem int not null check (diem between 1 and 5),
  nhan_xet text check (nhan_xet is null or char_length(nhan_xet) <= 1000),
  quyet_dinh text check (quyet_dinh in ('len_chinh_thuc', 'gia_han', 'khong_dat')),
  tao_luc timestamptz not null default now(),
  unique (nhan_vien_id, moc, vai)
);

create table public.dao_tao_khoa (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (char_length(ten) between 2 and 200),
  chuc_danh text,
  thu_tu int not null default 0,
  so_gio numeric(5, 1) not null default 0 check (so_gio >= 0),
  bat_buoc boolean not null default true,
  mo_ta text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.dao_tao_ket_qua (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  khoa_id uuid not null references public.dao_tao_khoa (id) on delete cascade,
  ngay_hoc date,
  diem numeric(5, 1) check (diem is null or diem between 0 and 100),
  trang_thai text not null default 'chua_hoc' check (trang_thai in ('chua_hoc', 'dang_hoc', 'dat', 'chua_dat')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  unique (nhan_vien_id, khoa_id)
);

-- KPI: mỗi người một điểm mỗi tháng (0-100). Xếp hạng phòng/cá nhân/công ty tính từ đây; quý = trung bình 3 tháng.
create table public.kpi_diem (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  nam int not null check (nam between 2020 and 2100),
  thang int not null check (thang between 1 and 12),
  diem numeric(6, 2) not null check (diem between 0 and 200),
  nguon text not null default 'nhap_tay' check (nguon in ('nhap_tay', 'lark_bsc')),
  ghi_chu text,
  nguoi_nhap_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now(),
  unique (nhan_vien_id, nam, thang)
);
create table public.kpi_thuong (
  id uuid primary key default gen_random_uuid(),
  ky text not null check (ky in ('thang', 'quy')),
  doi_tuong text not null check (doi_tuong in ('phong', 'ca_nhan_phong', 'cong_ty')),
  hang int not null check (hang between 1 and 3),
  so_tien bigint not null default 0 check (so_tien >= 0),
  unique (ky, doi_tuong, hang)
);

create table public.cap_bac (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique check (char_length(ma) between 1 and 20),
  ten text not null check (char_length(ten) between 2 and 120),
  bac int not null check (bac between 1 and 99),
  luong_tu bigint check (luong_tu is null or luong_tu >= 0),
  luong_den bigint check (luong_den is null or luong_den >= 0),
  dieu_kien text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create table public.thang_chuc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  loai text not null check (loai in ('thang_chuc', 'dieu_chuyen', 'ha_bac', 'tang_luong')),
  tu_chuc_danh text,
  den_chuc_danh text,
  tu_phong_id uuid references public.phong_ban (id) on delete set null,
  den_phong_id uuid references public.phong_ban (id) on delete set null,
  cap_bac_id uuid references public.cap_bac (id) on delete set null,
  hieu_luc_tu date not null,
  so_quyet_dinh text,
  ly_do text,
  nguoi_tao_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index thang_chuc_nv_idx on public.thang_chuc (nhan_vien_id, hieu_luc_tu desc);

-- Offboarding: checklist bàn giao, chốt công–lương–BHXH, phỏng vấn thôi việc, đều gắn vào đơn nghỉ việc.
create table public.ban_giao_muc (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (char_length(ten) between 2 and 200),
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.ban_giao_muc (ten, thu_tu) values
  ('Bàn giao công việc đang làm cho người nhận', 1),
  ('Trả tài sản đã cấp (laptop, thẻ, đồng phục)', 2),
  ('Khoá tài khoản AMIA OS và các hệ thống khác', 3),
  ('Bàn giao khách hàng và dữ liệu phụ trách', 4),
  ('Ký biên bản thoả thuận và cam kết bảo mật', 5);
create table public.ban_giao_tien_do (
  nghi_viec_id uuid not null references public.nghi_viec (id) on delete cascade,
  muc_id uuid not null references public.ban_giao_muc (id),
  xong_luc timestamptz not null default now(),
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  primary key (nghi_viec_id, muc_id)
);
create table public.chot_nghi_viec (
  nghi_viec_id uuid primary key references public.nghi_viec (id) on delete cascade,
  cong_den_ngay date,
  luong_con_lai bigint check (luong_con_lai is null or luong_con_lai >= 0),
  tien_phep_con bigint check (tien_phep_con is null or tien_phep_con >= 0),
  bhxh_chot_den date,
  ghi_chu text,
  chot_boi_id uuid references public.nhan_vien (id) on delete set null,
  chot_luc timestamptz
);
create table public.phong_van_thoi_viec (
  id uuid primary key default gen_random_uuid(),
  nghi_viec_id uuid not null unique references public.nghi_viec (id) on delete cascade,
  ngay_pv date not null,
  nguoi_pv_id uuid references public.nhan_vien (id) on delete set null,
  ly_do_chinh text check (ly_do_chinh is null or char_length(ly_do_chinh) <= 1000),
  dieu_hai_long text check (dieu_hai_long is null or char_length(dieu_hai_long) <= 1000),
  dieu_chua_hai_long text check (dieu_chua_hai_long is null or char_length(dieu_chua_hai_long) <= 1000),
  de_xuat text check (de_xuat is null or char_length(de_xuat) <= 1000),
  co_the_quay_lai boolean,
  tao_luc timestamptz not null default now()
);

select public.khoa_tat_ca_bang();

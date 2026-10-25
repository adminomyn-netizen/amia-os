-- 0002 — KHÁCH HÀNG: 5 trường bắt buộc tách riêng (không dồn vào tag), hồ sơ điều trị, ảnh.
create table public.dich_vu_nhom (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  thu_tu int not null default 0
);

create table public.dich_vu (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  nhom_id uuid not null references public.dich_vu_nhom (id),
  ten text not null,
  don_vi_tinh text not null default 'buổi' check (don_vi_tinh in ('buổi','vùng','shot','line','lần','liệu trình')),
  thoi_luong_phut int not null default 60 check (thoi_luong_phut > 0),
  gia bigint not null default 0 check (gia >= 0),
  gia_von bigint not null default 0 check (gia_von >= 0),
  vat_pct numeric(5,2) not null default 0 check (vat_pct >= 0 and vat_pct <= 100),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create index dich_vu_nhom_idx on public.dich_vu (nhom_id);

create table public.khach_hang (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ho_ten text not null,
  dien_thoai text not null,
  zalo text,
  email text,
  gioi_tinh text check (gioi_tinh in ('nữ','nam','khác')),
  ngay_sinh date,
  dia_chi text,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  -- 5 trường bắt buộc (brief anh Nam 25/10): nguồn · trạng thái · dịch vụ quan tâm · hạng · người phụ trách
  nguon text not null check (nguon in ('mkt','telesale','tu_van','khach_cu_gioi_thieu','khac')),
  nguon_chi_tiet text,
  nguoi_gioi_thieu_id uuid references public.khach_hang (id),
  danh_dau_mat boolean not null default false,
  nguoi_phu_trach_id uuid not null references public.nhan_vien (id),
  ghi_chu text,
  dong_y_dung_hinh boolean not null default false,
  dong_y_dung_hinh_luc timestamptz,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
-- 1 số điện thoại = 1 khách (chuẩn hoá chỉ giữ chữ số ở tầng ứng dụng).
create unique index khach_hang_dien_thoai_uq on public.khach_hang (dien_thoai);
create index khach_hang_phu_trach_idx on public.khach_hang (nguoi_phu_trach_id);
create index khach_hang_chi_nhanh_idx on public.khach_hang (chi_nhanh_id);
create index khach_hang_ten_idx on public.khach_hang (lower(ho_ten));

create table public.khach_quan_tam (
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  dich_vu_id uuid not null references public.dich_vu (id),
  primary key (khach_id, dich_vu_id)
);

create table public.khach_nguoi_than (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  ho_ten text not null,
  quan_he text,
  dien_thoai text
);
create index khach_nguoi_than_idx on public.khach_nguoi_than (khach_id);

-- Ghi chú điều trị: tình trạng – yêu cầu – phương án – kết quả (có cấu trúc, không còn chữ tự do một cục).
create table public.khach_ghi_chu (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  tinh_trang text,
  yeu_cau text,
  phuong_an text,
  ket_qua text,
  bac_si_id uuid references public.nhan_vien (id),
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index khach_ghi_chu_idx on public.khach_ghi_chu (khach_id, tao_luc desc);

create table public.khach_anh (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  duong_dan text not null unique,
  loai text not null default 'khac' check (loai in ('truoc','sau','khac')),
  ngay_chup date not null default current_date,
  ghi_chu text,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index khach_anh_idx on public.khach_anh (khach_id, ngay_chup desc);

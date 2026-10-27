-- 0026 — CÀI ĐẶT cửa hàng (theo BeDental): thông tin chung (1 dòng duy nhất), tài khoản ngân hàng, bảng tin công ty.
-- Chỉ THÊM bảng mới, không đụng bảng đang chạy.
create table public.cua_hang (
  id smallint primary key default 1 check (id = 1),
  ten_thuong_hieu text not null default 'AMIA',
  ten_phap_nhan text,
  ma_so_thue text,
  dia_chi text,
  dien_thoai text,
  email text,
  website text,
  -- {"mo":"08:00","dong":"20:00","nghi":["cn"]}: giờ mở/đóng chung và các ngày nghỉ cố định (t2..t7, cn).
  gio_lam_viec jsonb not null default '{"mo":"08:00","dong":"20:00","nghi":[]}'::jsonb,
  cap_nhat_luc timestamptz not null default now()
);
insert into public.cua_hang (id) values (1);

create table public.tai_khoan_ngan_hang (
  id uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  ngan_hang text not null,
  so_tai_khoan text not null,
  chu_tai_khoan text not null,
  ghi_chu text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.bang_tin (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  noi_dung text not null,
  ghim boolean not null default false,
  hien_tu date not null default current_date,
  hien_den date,
  hoat_dong boolean not null default true,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index bang_tin_hien_idx on public.bang_tin (hoat_dong, hien_tu);

select public.khoa_tat_ca_bang();

-- 0004 — LỊCH HẸN.
create table public.lich_hen (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  bat_dau timestamptz not null,
  ket_thuc timestamptz not null,
  trang_thai text not null default 'chua_xac_nhan'
    check (trang_thai in ('chua_xac_nhan','da_xac_nhan','cho_phuc_vu','dang_phuc_vu','hoan_thanh','huy','khong_den')),
  nhan_vien_id uuid references public.nhan_vien (id),
  phong text,
  nguon text,
  ghi_chu text,
  ly_do_huy text,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now(),
  constraint lich_hen_gio_hop_le check (ket_thuc > bat_dau)
);
create index lich_hen_ngay_idx on public.lich_hen (chi_nhanh_id, bat_dau);
create index lich_hen_khach_idx on public.lich_hen (khach_id, bat_dau desc);
create index lich_hen_nv_idx on public.lich_hen (nhan_vien_id, bat_dau);

create table public.lich_hen_dich_vu (
  lich_id uuid not null references public.lich_hen (id) on delete cascade,
  dich_vu_id uuid not null references public.dich_vu (id),
  so_luong int not null default 1 check (so_luong > 0),
  primary key (lich_id, dich_vu_id)
);

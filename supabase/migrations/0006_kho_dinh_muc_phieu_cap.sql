-- 0006 — KHO (sổ cái), ĐỊNH MỨC, PHIẾU CẤP VẬT TƯ TRƯỚC CA.
-- Quy trình chị Lâm chốt 25/10: vật tư phải được CẤP RA trước khi làm dịch vụ; không có phiếu "Đã nhận" thì không mở ca.

create table public.kho_so_cai (
  id bigint generated always as identity primary key,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  san_pham_id uuid not null references public.san_pham (id),
  loai text not null check (loai in ('nhap','xuat_ban','cap_ca','tra_ca','kiem_ke','dieu_chinh','chuyen_di','chuyen_den','hao_hut')),
  so_luong numeric(14,3) not null check (so_luong <> 0),   -- có dấu: + vào kho, − ra khỏi kho
  don_gia numeric(18,4),
  so_lo text,
  han_dung date,
  phieu_cap_id uuid,
  hoa_don_id uuid references public.hoa_don (id),
  ghi_chu text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index kho_so_cai_idx on public.kho_so_cai (chi_nhanh_id, san_pham_id);
create trigger kho_so_cai_chi_them before update or delete on public.kho_so_cai
  for each row execute function public.chi_them_dong();

-- Định mức: mỗi dịch vụ gắn vật tư + số lượng.
--   chon_theo_chi_dinh = false : vật tư LUÔN cấp, đúng số định mức (tuýp kem tê, thuốc giảm đau...).
--   chon_theo_chi_dinh = true  : chỉ là PHƯƠNG ÁN; bác sĩ chọn đầu tip nào / bao nhiêu shot khi chỉ định (MFU Basic liệt kê đủ 7 đầu nhưng mỗi ca chỉ dùng vài đầu).
create table public.dinh_muc (
  id uuid primary key default gen_random_uuid(),
  dich_vu_id uuid not null references public.dich_vu (id) on delete cascade,
  san_pham_id uuid not null references public.san_pham (id),
  so_luong numeric(14,3) not null check (so_luong > 0),
  chon_theo_chi_dinh boolean not null default false,
  ghi_chu text,
  unique (dich_vu_id, san_pham_id)
);

create table public.phieu_cap (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  lich_hen_id uuid references public.lich_hen (id),
  khach_id uuid not null references public.khach_hang (id),
  dich_vu_id uuid not null references public.dich_vu (id),
  bac_si_id uuid not null references public.nhan_vien (id),
  ktv_id uuid references public.nhan_vien (id),
  trang_thai text not null default 'cho_cap'
    check (trang_thai in ('cho_cap','da_cap','da_nhan','da_lam','da_doi_chieu','huy')),
  dem_may_truoc int,
  dem_may_sau int,
  cap_boi uuid references public.nhan_vien (id), cap_luc timestamptz,
  nhan_boi uuid references public.nhan_vien (id), nhan_luc timestamptz,
  lam_xong_luc timestamptz,
  doi_chieu_boi uuid references public.nhan_vien (id), doi_chieu_luc timestamptz,
  ly_do_huy text,
  ghi_chu text,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index phieu_cap_ngay_idx on public.phieu_cap (chi_nhanh_id, tao_luc);
create index phieu_cap_lich_idx on public.phieu_cap (lich_hen_id);
alter table public.kho_so_cai add constraint kho_so_cai_phieu_fk foreign key (phieu_cap_id) references public.phieu_cap (id);

create table public.phieu_cap_dong (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.phieu_cap (id) on delete cascade,
  san_pham_id uuid not null references public.san_pham (id),
  nhom_cap text,
  dinh_muc numeric(14,3) not null,         -- định mức chuẩn của dịch vụ tại thời điểm ra phiếu
  so_cap numeric(14,3) not null check (so_cap > 0),
  so_tra numeric(14,3),
  don_gia numeric(18,4),
  cap_them boolean not null default false,
  ly_do_vuot text,
  bac_si_xac_nhan_id uuid references public.nhan_vien (id),
  unique (phieu_id, san_pham_id)
);

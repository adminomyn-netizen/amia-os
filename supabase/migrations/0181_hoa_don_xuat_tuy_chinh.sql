-- 0181 — Sửa tên trên hoá đơn xuất (chị Dung, kế toán, 30/10/2026, việc 61422): sửa tên từng dòng hàng/dịch vụ, tên người mua, MST, địa chỉ người mua
-- CHỈ cho bảng xuất Excel hoá đơn điện tử. Lưu RIÊNG: không đổi đơn bán (hoa_don, hoa_don_dong) và không đổi hồ sơ khách (khach_hang).
-- Chưa sửa thì Excel lấy tên trong đơn / hồ sơ khách. Xoá đơn (hoặc dòng) thì bản sửa đi theo.
create table public.hoa_don_xuat_tuy_chinh (
  hoa_don_id uuid primary key references public.hoa_don (id) on delete cascade,
  ten_nguoi_mua text check (ten_nguoi_mua is null or char_length(ten_nguoi_mua) between 1 and 200),
  -- 10 số, 13 số dạng 0123456789-001, hoặc 12 số (mã số thuế cá nhân = số căn cước)
  ma_so_thue text check (ma_so_thue is null or ma_so_thue ~ '^([0-9]{10}(-[0-9]{3})?|[0-9]{12})$'),
  dia_chi text check (dia_chi is null or char_length(dia_chi) between 1 and 300),
  sua_boi uuid references public.nhan_vien (id) on delete set null,
  sua_luc timestamptz not null default now()
);

create table public.hoa_don_xuat_dong (
  hoa_don_dong_id uuid primary key references public.hoa_don_dong (id) on delete cascade,
  ten_xuat text not null check (char_length(ten_xuat) between 1 and 300),
  sua_boi uuid references public.nhan_vien (id) on delete set null,
  sua_luc timestamptz not null default now()
);

select public.khoa_tat_ca_bang();

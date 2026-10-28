-- [G3] Tài khoản ngân hàng như SalonHero (#/bankInfoSetting): mỗi tài khoản có "Chức năng" (Quẹt thẻ / Chuyển khoản) và nút "Đặt mặc định".
-- Chỉ thêm 3 cột + 1 chỉ mục nhỏ; không đổi dữ liệu cũ (bảng đang trống). Mặc định như hộp "Thêm tài khoản": quẹt thẻ và chuyển khoản đều tích sẵn.
alter table public.tai_khoan_ngan_hang
  add column if not exists dung_quet_the boolean not null default true,
  add column if not exists dung_chuyen_khoan boolean not null default true,
  add column if not exists mac_dinh boolean not null default false;

-- Tối đa MỘT tài khoản mặc định (dùng chung mọi chi nhánh).
create unique index if not exists tai_khoan_ngan_hang_mac_dinh_duy_nhat on public.tai_khoan_ngan_hang ((true)) where mac_dinh;

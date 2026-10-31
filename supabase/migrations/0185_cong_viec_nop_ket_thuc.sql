-- 0185 — Kiểm soát công việc hằng ngày (chị Lâm 31/10/2026, việc 63927): mỗi việc có người làm, HẠN GIỜ nộp, tiêu chí xong (làm được / thấy được / đo được / dùng được),
-- nơi thấy sản phẩm, người giao chấm Đạt hoặc Chưa đạt, và báo "kẹt ở ai". Trễ quá 30 phút so với hạn giờ thì hiện cờ đỏ (tính khi xem, không lưu).
-- Việc cũ (chỉ có hạn ngày) giữ nguyên: han_gio để trống, mặc định coi hạn là 17:00 ngày đó khi tính trễ.
alter table public.cong_viec
  add column han_gio timestamptz,
  add column tieu_chi_xong text,
  add column san_pham text,
  add column tc_lam_duoc boolean not null default false,
  add column tc_thay_duoc boolean not null default false,
  add column tc_do_duoc boolean not null default false,
  add column tc_dung_duoc boolean not null default false,
  add column danh_gia text not null default 'cho' check (danh_gia in ('cho', 'dat', 'chua_dat')),
  add column danh_gia_ghi_chu text,
  add column danh_gia_boi uuid references public.nhan_vien (id),
  add column danh_gia_luc timestamptz,
  add column ket_nguoi_id uuid references public.nhan_vien (id),
  add column ket_ly_do text,
  add column ket_luc timestamptz;

create index cong_viec_han_gio_idx on public.cong_viec (han_gio) where trang_thai in ('moi', 'dang_lam');

select public.khoa_tat_ca_bang();

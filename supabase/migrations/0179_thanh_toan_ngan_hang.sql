-- 0179 — Ngân hàng nhận tiền của từng khoản thanh toán (chị Dung, kế toán, 30/10/2026: lọc hoá đơn điện tử theo khoản thu vào Techcombank / Vietcombank).
-- • thanh_toan.ngan_hang: tên ngắn ("Techcombank", "Vietcombank", "Sacombank"…). null = chưa rõ hoặc không phải chuyển khoản/quẹt thẻ.
-- • Chỉ THÊM CỘT: bảng thanh_toan vẫn chỉ-thêm (trigger chặn sửa/xoá). Dữ liệu SalonHero cũ được bù bằng script
--   scripts/chuyen-salonhero/bu-ngan-hang-thanh-toan.mjs (tắt trigger đúng một lệnh, có sao lưu trước).
alter table public.thanh_toan
  add column ngan_hang text check (ngan_hang is null or char_length(ngan_hang) between 1 and 60);

-- Lọc theo ngân hàng + ngày thu; chỉ lập chỉ mục cho dòng có ngân hàng (phần lớn dòng tiền mặt không cần).
create index thanh_toan_ngan_hang_idx on public.thanh_toan (ngan_hang, ngay) where ngan_hang is not null;

select public.khoa_tat_ca_bang();

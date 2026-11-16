-- Chị Lâm 16/11/2026 14:17: "khách họ sống ở đà lạt thì vẫn để chi nhánh đà lạt chứ" (lật một phần 0335/0336).
-- ĐÃ CHẠY BẰNG SCRIPT 16/11 14:19 (danh sách id lấy từ sao lưu, không viết lại được thành SQL thuần):
--   • 3.082 khách gán Đà Lạt trước 0335 (sao-luu/db-20261115-1429-bang-dong-cua-da-lat-15-11) → trả về AMIA Đà Lạt;
--     giữ Vinh 20 khách có hoá đơn gần nhất ở Vinh.
--   • 3.261 thẻ còn dùng (đã chuyển ở 0336) của các khách đó → trả Đà Lạt; 238 nhắc 'dang_nhac' (chuyển ở 0335/0336) → trả Đà Lạt.
--   • Tạm tắt trg_chan_chi_nhanh_ngung trong cùng giao dịch rồi bật lại. Đà Lạt vẫn hoat_dong=false: không gắn mới, không đặt lịch mới.
-- Nhân viên giữ ở Vinh. Sao lưu trước khi trả: sao-luu/db-20261116-1418-bang-tra-khach-da-lat-16-11.
select 1;

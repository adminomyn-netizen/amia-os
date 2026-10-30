# Cấp quyền để app MKT tự kéo số quảng cáo Meta

Cần 2 thứ: (1) mã truy cập (token) loại Người dùng hệ thống, quyền `ads_read` (chỉ đọc), (2) ID các tài khoản quảng cáo cần kéo. Người có quyền Admin của Business làm, khoảng 10 phút.

1. Vào business.facebook.com/settings, chọn đúng doanh nghiệp đang sở hữu tài khoản quảng cáo.
2. Người dùng → Người dùng hệ thống → Thêm. Tên: AMIA-OS-doc-so. Vai trò: Nhân viên.
3. Bấm người dùng vừa tạo → Thêm tài sản → Tài khoản quảng cáo → chọn tài khoản → bật quyền "Xem hiệu suất" (chỉ xem, không sửa được gì) → Lưu.
4. Cũng ở người dùng đó → Tạo mã truy cập → chọn ứng dụng (chưa có thì tạo ở developers.facebook.com, loại Business, rồi quay lại) → hết hạn: Không bao giờ → tick quyền `ads_read` → Tạo mã → sao chép ngay (chỉ hiện một lần).
5. ID tài khoản: Cài đặt doanh nghiệp → Tài khoản → Tài khoản quảng cáo → dãy số dưới tên tài khoản (hoặc đoạn `act=` trên thanh địa chỉ Ads Manager).

Lưu ý: gửi token riêng 1-1, KHÔNG đăng vào nhóm; ai có token đều xem được số quảng cáo. Không cần quyền sửa hay chi tiền.

Phía hệ thống (người triển khai): đặt trên Vercel `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_IDS` (cách nhau dấu phẩy), tuỳ chọn `META_GRAPH_VERSION`; lịch chạy 5:30 sáng, route `/api/cron/meta-ads`.

# Luồng AnyCross: số liệu MKT (AMIA OS) → Lark Base, gần thời gian thực

Mục tiêu: không phụ thuộc máy Mac và không tốn token AI. Luồng chạy hoàn toàn trong Lark AnyCross.
Dự án đã tạo sẵn: `AMIA-MKT` (https://anycross-jp.larksuite.com/console/integration/7702395072423153184), tài khoản Trợ lý CEO. Chưa có luồng nào.

## Luồng "MKT - AMIA OS sang Lark Base" (4 bước)
1. **Trigger**: Scheduler, lặp 15 phút (nhanh hơn nếu gói cho phép; Meta tự trễ vài giờ nên 15 phút là đủ).
2. **HTTP GET** `https://amia-os-neon.vercel.app/api/cron/meta-ads?ngay=2`, header `Authorization: Bearer <CRON_SECRET>`. Việc này kéo số Meta mới nhất về app. (Lấy CRON_SECRET ở Vercel hoặc hỏi chị Lâm; KHÔNG ghi vào tài liệu hay chat nhóm.)
3. **HTTP GET** `https://amia-os-neon.vercel.app/api/mkt/so-lieu-ngay?ngay=2`, cùng header. Trả JSON `{ dong: [ {Khoá, Ngày, Nguồn, "Mã chiến dịch", "Chiến dịch", "Chi phí", "Hiển thị", "Tiếp cận", Click, "Tin nhắn", Lead} ] }`, tên cột đúng như bảng Lark. Dùng `ngay=400` để đồng bộ lại toàn bộ lịch sử.
4. **Lặp trên `dong`** → Lark Base (base `PNVybJkEQacznGsDCryjZNnsp3e`, bảng `3.4. AMIA OS - Số liệu MKT theo ngày (tự động)`, id `tblzGKrZFuhOgxZL`): tìm bản ghi theo `Khoá`; có thì Cập nhật, chưa có thì Tạo mới. Cột `Ngày` kiểu ngày giờ, nhận chuỗi `YYYY-MM-DD 00:00`.

## Phần Pancake
Pancake chat chưa có connector trong AnyCross (chỉ có "Pancake POS"). Số hội thoại hiện do script trên máy Mac đọc Pancake và ghi vào app (06:00, 12:00, 20:30). Muốn thật sự theo thời gian thực: bật webhook của Pancake (Cài đặt trang → Webhook) trỏ vào một API mới của AMIA OS để cộng số ngay khi có hội thoại mới. Đó là bước sau, cần làm riêng.

## Giới hạn cần biết
- Meta không có sự kiện đẩy cho chi phí; chỉ hỏi theo chu kỳ.
- Token Meta (người dùng hệ thống AMIA-OS-doc-so) không hết hạn nhưng mất hiệu lực nếu anh Gia đổi quyền; cron sẽ trả lỗi 502 trong nhật ký Vercel.

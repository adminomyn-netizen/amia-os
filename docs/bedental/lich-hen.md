# Lịch hẹn (BeDental ERP, mục `booking`)

Nguồn: đọc trực tiếp bản demo (chỉ xem, không lưu gì) và mã giao diện. Không chép tên khách, số điện thoại; chỉ ghi cấu trúc.

Cập nhật 10/11/2026: đã đọc được các phần 27/10 ghi "chưa đọc được": form Đặt lịch (2 tab Đặt lịch trước / Đến trực tiếp), màn Báo cáo lịch hẹn (bảng + 5 bộ lọc + Xuất Excel), chi tiết một lịch (gắn CTV, lịch định kỳ "buổi x/y", tình trạng gửi tin, lịch sử thao tác, In lịch hẹn), danh mục trạng thái đầy đủ (thêm "Vào ghế khám", "Không đến"), 11 loại nhật ký thao tác (có luồng khách xin đổi lịch → duyệt / từ chối), trang công khai cho khách tra cứu / đổi / hủy lịch.

## 1. Mục đích
Quản lý đặt lịch theo tuần/tháng/ngày cho toàn chuỗi: ai hẹn, giờ nào, kênh nào, trạng thái nào; đầu vào cho hàng đợi "chờ phục vụ" rồi sang POS.

## 2. Màn hình con

### 2.1 Thanh KPI trên đầu
3 ô: Lịch hẹn hôm nay | Trong tuần này | Lịch hẹn chưa được xử lý trong 30 ngày gần đây.

### 2.2 Thanh công cụ
- Chọn chi nhánh: Tất cả + từng chi nhánh.
- Nút: Báo cáo lịch hẹn | Đặt lịch | Thu gọn (ẩn khung "Hôm nay").
- Chip lọc trạng thái: Chưa xác nhận, Đã xác nhận, Chờ phục vụ, Hoàn thành, Đã hủy, Định kỳ chưa xác nhận.
- Điều hướng: nhãn khoảng ngày, nút Hôm nay, Tháng | Tuần.

### 2.3 Lưới tuần
7 cột Thứ Hai → Chủ Nhật, trục 06:00–20:00. Ô nhiều lịch gom thành thẻ "N lịch từ 8:00" và liệt kê vài lịch lẻ (giờ · tên).

### 2.4 Khung "Hôm nay"
Tiêu đề "Thứ, ngày · x/y đã đến". Dòng: giờ hẹn, giờ tạo, tên khách (kèm "x2" nếu đi nhiều người), nguồn đặt, trạng thái, nhãn "Cần chọn hồ sơ" cho lịch web chưa ghép hồ sơ khách.

### 2.5 Form "Tạo lịch hẹn" (nút Đặt lịch) - ĐỌC ĐƯỢC
- Hai tab trên đầu: Đặt lịch trước | Đến trực tiếp (walk-in). Mã lịch "Tự sinh khi lưu".
- Khách: ô tìm "theo tên, email hoặc số điện thoại"; hoặc tạo nhanh: Họ và tên*, Giới tính (Nam/Nữ/Khác), mã quốc gia + Điện thoại.
- Ngày & giờ hẹn*; Lặp định kỳ: Không lặp / Theo tuần / Theo tháng (khi lặp: cách N tuần/tháng, số buổi, từ ngày).
- Ghi chú; Số khách + Chi nhánh.
- Bảng "Dịch vụ / Nhân viên" theo từng khách (KHÁCH 1, KHÁCH 2...): Dịch vụ | Nhân viên phục vụ | Phòng / Chỗ ngồi (danh mục ghế/phòng theo chi nhánh, ví dụ Ghế 1–4, Phòng VIP, Ghế phẫu thuật) | tổng thời lượng "⏱ N phút". Nút "⊕ Thêm khách".
- Trạng thái lúc tạo: Chưa xác nhận | Đã xác nhận.
- Đặt lịch từ (nguồn): Gọi điện, FB Messenger, Instagram, Zalo, WhatsApp, TikTok, Email, Website.
- Nút: Lưu thông tin.

### 2.6 Chi tiết một lịch (bấm "Xem" ở báo cáo hoặc thẻ lịch) - ĐỌC ĐƯỢC
- Đầu: Mã đặt lịch (dạng BK + ngày + mã ngắn), Tạo lúc, Bởi (nhân viên / "Hệ thống"), Sửa lần cuối.
- Thẻ khách: avatar, tên, nhóm, nhãn Khách mới / Khách quay lại, SĐT + quốc gia.
- Giờ hẹn (chọn giờ, phút theo bước 5', ngày); khung "Chọn tham khảo các khung giờ sau" (giờ trống - demo ghi chưa triển khai).
- Bảng Khách hàng / Dịch vụ / Nhân viên / Phòng-Chỗ ngồi; Số lượng khách; Tại chi nhánh; Ghi chú.
- Người giới thiệu (CTV): "Gắn CTV / người giới thiệu".
- Lặp định kỳ: "Thuộc lịch định kỳ · Buổi 1/10", N tháng/lần, số buổi, từ ngày.
- Tình trạng gửi tin: tin xác nhận, đổi lịch, hủy, nhắc lịch gửi tự động qua Zalo ZNS (số VN) hoặc WhatsApp (số nước ngoài) theo Trung tâm thông báo; email xác nhận khi chuyển "Đã xác nhận".
- "Xem lịch sử thao tác".
- Cột trạng thái (bấm chọn): Chưa xác nhận · Đã xác nhận · Chờ phục vụ · Vào ghế khám · Hoàn thành · Hủy lịch · Không đến. Đặt lịch từ; nút Định kỳ.
- Nút: In lịch hẹn | Lưu thông tin.

### 2.7 Báo cáo lịch hẹn (danh sách) - ĐỌC ĐƯỢC
- Nút: Trang đặt lịch (quay lại lưới) | Đặt lịch | Hôm nay (chọn khoảng ngày) | Xuất Excel.
- Bộ lọc: ô tìm "Tên, SĐT, mã đặt lịch"; Chi nhánh; Trạng thái (Chưa xác nhận, Đã xác nhận, Đang chờ, Đang thực hiện, Hoàn thành, Đã hủy, Không đến); Nguồn (~29 giá trị); Người tạo (kèm số lịch, phân biệt "nhân viên" / "dữ liệu cũ"); Loại khách (Khách mới / Khách quay lại).
- Cột: Mã đặt lịch | Giờ hẹn | Khách hàng (tên + SĐT) | Trạng thái | Nguồn | Dịch vụ | Kỹ thuật viên | Ghi chú | Được tạo bởi | Tạo lúc | Chi tiết (Xem). Phân trang Trước / số / Tiếp.

### 2.8 Nhật ký thao tác lịch hẹn
Loại sự kiện: Tạo lịch hẹn, Cập nhật thông tin, Thay đổi trạng thái, Hủy lịch, Đổi lịch, Xóa lịch hẹn, Khách xin đổi lịch, Duyệt đổi lịch, Từ chối đổi lịch, Yêu cầu đổi lịch tự đóng, Yêu cầu đổi lịch của khách đã hết hạn, Chưa gửi được tin từ chối.

### 2.9 Trang công khai cho khách (cấu hình ở Cài đặt > Web đặt lịch)
- Đặt lịch: chọn ngôn ngữ, chi nhánh, số khách ("Bạn đi cùng bạn bè?"), dịch vụ / bác sĩ, ngày + khung giờ còn chỗ (Buổi sáng/chiều/tối, "Kín"), họ tên, xưng hô, SĐT (kiểm mã vùng), email, ghi chú, "Mã nhân viên / Người giới thiệu" (mã NV hoặc SĐT người giới thiệu). Sau khi gửi: "Mã đặt lịch của bạn", trạng thái Chờ xác nhận.
- "Lịch hẹn của bạn": tra cứu bằng SĐT, email hoặc mã lịch; xem lịch sắp tới; đổi lịch (chọn ngày/giờ mới, "lịch cũ giữ nguyên tới khi phòng khám xác nhận"); hủy lịch (bắt buộc lý do 5–500 ký tự). Trang có thể "tạm khóa".

## 3. Quy tắc nghiệp vụ thấy được
1. Vòng đời: Chưa xác nhận → Đã xác nhận → Chờ phục vụ (đã đến) → Vào ghế khám (đang phục vụ) → Hoàn thành; nhánh Hủy lịch, Không đến. "Định kỳ chưa xác nhận" là trạng thái riêng cho lịch tự sinh.
2. Hai loại lịch: đặt trước và đến trực tiếp (walk-in) - chọn ngay trên form.
3. Một lịch có thể nhiều khách, mỗi khách nhiều dòng dịch vụ - nhân viên - chỗ ngồi; thời lượng cộng từ dịch vụ.
4. Lịch định kỳ sinh hàng loạt (đánh số buổi x/y) và cần nhân viên xác nhận lại.
5. Lịch có thể tạo khi chưa chọn dịch vụ / chưa gán nhân viên.
6. Lịch gắn được người giới thiệu (CTV) → nối hoa hồng giới thiệu.
7. Tin nhắn lịch tự động theo đầu số: VN → Zalo/ZNS, nước ngoài → WhatsApp; email khi xác nhận; tôn trọng "Khóa gửi Zalo" của khách.
8. Khách tự đổi lịch = yêu cầu chờ duyệt, có hết hạn và tự đóng; từ chối phải báo khách.
9. Mọi thao tác ghi nhật ký; người tạo phân biệt nhân viên thật và dữ liệu nhập cũ.
10. Lịch web chưa có hồ sơ phải ghép hồ sơ trước khi phục vụ.

## 4. Điểm riêng nha khoa
- [NHA KHOA] "Vào ghế khám", danh mục Ghế/Ghế phẫu thuật; lịch "Tái khám định kỳ" hàng loạt 6 tháng/lần đến nhiều năm.
- [NHA KHOA] Khách quốc tế đặt qua WhatsApp.

## 5. Đề xuất cho AMIA
AMIA đã có phần lớn (lưới ngày/tuần/tháng, 7 trạng thái, đặt trước / đến trực tiếp, nhiều khách, phòng/giường, lặp ngày/tuần/tháng, nguồn đặt, lịch sử lịch hẹn, sơ đồ chỗ, duyệt yêu cầu đặt online). Còn nên thêm:
1. Khách tự tra cứu / đổi / hủy lịch trên web đặt lịch (đổi = yêu cầu chờ duyệt, lịch cũ giữ tới khi duyệt; hủy bắt buộc lý do).
2. Nhật ký thao tác từng lịch hiện trong chi tiết lịch (các loại sự kiện như 2.8).
3. Khối "Tình trạng gửi tin" trên lịch: tin xác nhận / nhắc / đổi / hủy đã gửi chưa, qua kênh nào.
4. Gắn CTV / người giới thiệu ngay trên lịch hẹn.
5. Xuất Excel danh sách lịch; lọc theo người tạo và khách mới/quay lại (AMIA đã có lọc khách mới/quay lại và người tạo; kiểm lại nút xuất).
6. KPI "lịch chưa xử lý 30 ngày gần đây" trên đầu trang.

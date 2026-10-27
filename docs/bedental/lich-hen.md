# Lịch hẹn (BeDental ERP, mục `booking`)

Nguồn: chữ chụp từ bản demo. Không chép tên khách, số điện thoại; chỉ ghi cấu trúc. Chỉ có trang tổng quan mục (không có tệp con). Hộp "Đặt lịch", "Báo cáo lịch hẹn", chi tiết một lịch chưa đọc được (popup).

## 1. Mục đích
Quản lý đặt lịch theo tuần/tháng/ngày cho toàn chuỗi: ai hẹn ai, giờ nào, kênh nào, trạng thái nào; bắt đầu cho hàng đợi "chờ phục vụ" rồi chuyển sang POS.

## 2. Màn hình con

### 2.1 Thanh KPI trên đầu
- 3 ô số: "Lịch hẹn hôm nay" (6), "Trong tuần này" (16), "Lịch hẹn chưa được xử lý trong 30 ngày gần đây" (0). Chữ chụp xếp nhãn và số lệch nhau nên thứ tự số-nhãn có thể ngược; đừng sao nguyên.
- Lưu ý bất nhất của demo: số hôm nay hiện 6 (ô KPI), 9 (Dashboard), 34 (khung "2/34 đã đến"). Do khác bộ lọc chi nhánh/trạng thái. AMIA nên dùng một định nghĩa và một nguồn.

### 2.2 Thanh công cụ
- Bộ chọn chi nhánh: Tất cả + từng chi nhánh.
- Nút: Báo cáo lịch hẹn | Đặt lịch | Thu gọn.
- Bộ lọc trạng thái (chip): Chưa xác nhận, Đã xác nhận, Chờ phục vụ, Hoàn thành, Đã hủy, Định kỳ chưa xác nhận.
- Điều hướng thời gian: nhãn khoảng ngày (vd "26/10 - 1/11/2026"), nút Hôm nay, chọn chế độ Tháng | Tuần (và có Ngày theo khung "Hôm nay").

### 2.3 Lưới tuần
- 7 cột Thứ Hai đến Chủ Nhật có số ngày; trục giờ 06:00 đến 20:00.
- Khi một ô giờ có nhiều lịch, hệ thống gom thành thẻ "N lịch từ 8:00" (vd 25, 28, 33 lịch) thay vì xếp chồng; các lịch lẻ hiện giờ + tên khách. Nghĩa là mật độ lịch rất cao ở khung 8:00.
- Cột Chủ Nhật gần như trống.

### 2.4 Danh sách "Hôm nay" (khung bên cạnh)
- Tiêu đề: thứ + ngày + "x/y đã đến" (số khách đã check-in trên tổng).
- Mỗi dòng: giờ hẹn; "Tạo lúc" (ngày giờ tạo lịch); tên khách (có thể kèm số người, vd "x2"); nguồn đặt; trạng thái.
- Nguồn đặt thấy: Định kỳ (lịch tự sinh hàng loạt), Khách đặt lịch qua web, WhatsApp, Gọi điện. Nhãn riêng "Cần chọn hồ sơ" cho lịch web chưa gắn vào hồ sơ khách (khách chưa được nhận diện/ghép).
- Trạng thái dòng: Chưa xác nhận, Đã xác nhận, Chờ phục vụ, Hoàn thành, Đã hủy.
- Thẻ "TIẾP THEO" trên Dashboard thể hiện lịch gần nhất: giờ, tên, "Chưa chọn dịch vụ · Chưa gán nhân viên", trạng thái. Nghĩa là lịch có thể tạo khi CHƯA chọn dịch vụ và CHƯA gán nhân viên.

### 2.5 Đặt lịch / Báo cáo lịch hẹn
Chưa đọc được (popup). Từ dữ liệu suy ra form có: khách (hoặc hồ sơ), ngày giờ, dịch vụ, nhân viên/bác sĩ, ghế/phòng (chưa chắc), nguồn, ghi chú, lặp định kỳ.

## 3. Quy tắc nghiệp vụ thấy được
1. Vòng đời: Chưa xác nhận -> Đã xác nhận -> Chờ phục vụ (khách đã đến, chờ) -> Đang phục vụ -> Hoàn thành; nhánh Hủy và Không đến (Dashboard đếm "không đến").
2. Lịch định kỳ sinh hàng loạt cùng một thời điểm (hàng chục lịch 08:00 tạo cùng phút), mang trạng thái riêng "Định kỳ chưa xác nhận" và cần nhân viên xác nhận lại với khách.
3. Lịch có thể trùng nhiều dòng cho cùng một khách cùng giờ (khách bị hủy rồi tạo lại, hoặc đặt qua nhiều kênh): nhiều bản ghi hủy + một bản xác nhận. AMIA nên chặn trùng hoặc hợp nhất.
4. Lịch tạo từ web chưa có hồ sơ khách phải được gắn hồ sơ trước khi phục vụ.
5. Lịch không bắt buộc dịch vụ/nhân viên lúc tạo.
6. Số lịch cũ chưa xử lý trong 30 ngày là chỉ số nhắc việc.
7. Mọi lịch gắn một chi nhánh; xem theo chi nhánh hoặc toàn chuỗi.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Lịch định kỳ rất nhiều vì khách niềng răng tái khám đều (siết mắc cài, kiểm tra), cấy ghép nhiều lần hẹn.
- [NHA KHOA] Một khách nước ngoài đặt qua WhatsApp (du lịch nha khoa) nên nguồn có WhatsApp.
- [NHA KHOA] Giờ hẹn cao điểm 8:00 gom hàng chục khách: có thể vì lịch định kỳ gán mặc định 8:00 chứ không phải giờ thật; AMIA cần giờ thật theo ghế/KTV.
- Chưa thấy cột ghế/bác sĩ trong lưới (có thể ẩn ở chế độ khác).

## 5. Đề xuất cho AMIA
Làm theo thứ tự:
1. Lịch tuần/ngày/tháng + thanh trạng thái (Chưa xác nhận, Đã xác nhận, Chờ phục vụ, Đang phục vụ, Hoàn thành, Hủy, Không đến). Lọc chi nhánh.
2. Form đặt lịch: khách (tìm theo SĐT), ngày giờ, dịch vụ, nhân viên (có thể để trống), nguồn (Zalo OA, Facebook, TikTok, Gọi điện, Web), ghi chú. Chặn trùng khách + khung giờ.
3. Danh sách "Hôm nay" có nút chuyển trạng thái nhanh: Đến (check-in), Phục vụ, Hoàn thành, Hủy; bộ đếm "đã đến / tổng".
4. Gom lịch "N lịch từ giờ" khi mật độ cao, và tính cả công suất theo KTV/phòng (làm tốt hơn demo).
5. Lịch định kỳ cho liệu trình (đợt laser, tái khám sau tiêm) với trạng thái "Định kỳ chưa xác nhận" và nhắc Zalo trước 1 ngày.
6. Liên thông web/Zalo: lịch khách tự đặt vào hàng "Cần gắn hồ sơ".
7. Báo cáo lịch hẹn (tỷ lệ hủy, không đến, theo nguồn).

Bỏ: số liệu KPI mâu thuẫn giữa các khung, kênh WhatsApp (chỉ giữ khi có khách nước ngoài), nhãn nguồn "Định kỳ" như một nguồn (nên là cờ riêng).

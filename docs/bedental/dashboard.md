# Dashboard (BeDental ERP)

Nguồn: đọc trực tiếp bản demo (tài khoản Owner, chỉ xem) và mã giao diện. Không chép tên người thật; chỉ ghi cấu trúc.

Cập nhật 10/11/2026: đọc lại toàn trang. Bố cục giữ nguyên như 27/10; bổ sung: thanh trên cùng (trạng thái API, nút Hướng dẫn sử dụng, chọn chi nhánh, 2 chuông thông báo), mức cảnh báo thứ ba "CẢNH BÁO" (lead chưa nhận), hộp "Tùy biến truy cập nhanh" đọc được (ghim mọi chức năng của 12 mục), bấm cảnh báo đi thẳng tới màn xử lý (chờ duyệt → Trung tâm phê duyệt, kho thấp → Tồn kho, lead chưa nhận → Hộp Lead).

## 1. Mục đích
Trang đầu sau đăng nhập: "hôm nay có gì cần làm" cho quản lý/chủ: cảnh báo gấp, việc của tôi, lịch hôm nay, tiền thu, nợ, kho, phê duyệt, doanh thu 7 ngày, xếp hạng nhân viên, tỷ trọng theo chi nhánh. Nội dung lọc theo quyền tài khoản và chi nhánh được phân.

## 2. Khối và nút (theo thứ tự trên trang)
0. Thanh trên cùng (mọi trang): tên trang, đèn "API Online" (kiểm tra máy chủ 30 giây/lần), "Hướng dẫn sử dụng" (công thức số liệu nằm ở đây), chọn chi nhánh đang làm việc, 2 chuông thông báo (đếm 99+), avatar.
1. Bộ chọn chi nhánh của bảng: Tất cả các chi nhánh + từng chi nhánh.
2. Dải cảnh báo gấp: "N việc cần xử lý gấp hôm nay" + 3 số: khoản chờ duyệt, sản phẩm sắp hết hàng, lead chưa ai nhận; liên kết "Xem tất cả cảnh báo →".
3. Bảng tin công ty: thông báo nội bộ, "Xem tất cả". (Soạn ở Cài đặt > Bảng tin công ty.)
4. Top nhân viên tháng này: bục 3 người + danh sách 5 dòng. Dòng: hạng, tên, chi nhánh, vai trò (Bác sĩ / Nhân viên / Phụ tá), doanh thu tạo ra (triệu), số lịch hoàn thành, điểm. Số liệu khớp công thức điểm = doanh thu (triệu) + điểm theo lịch hoàn thành (công thức chi tiết ở nút Hướng dẫn).
5. Việc cần làm của tôi: danh sách việc quá hạn / cần xử lý (tiêu đề, loại, hạn, cờ Quá hạn, nút Mở); "Tất cả →". Rỗng: "Không có việc quá hạn hoặc việc cần xử lý trong phạm vi hiện tại."
6. Thẻ KPI (6 ô): Lịch hẹn hôm nay (hoàn thành, không đến); Đang chờ / phục vụ (chờ, đang phục vụ); Đã thu hôm nay (thu, hoàn); Nợ phát sinh hôm nay (số hóa đơn còn nợ); Cần phê duyệt (số quá hạn SLA); Kho thấp (theo tồn khả dụng).
7. Truy cập nhanh (theo quyền): mặc định Khách hàng, Lịch hẹn, POS, Báo cáo, Tính hoa hồng nhân viên, Kho & Mua sắm; nút "Tùy biến" mở hộp "Tùy biến truy cập nhanh": danh sách mọi chức năng theo 12 mục và nhóm con (ví dụ Marketing > LEAD > Hộp Lead...), tích để ghim. Ghi chú: "Quyền truy cập thật vẫn do hệ thống kiểm soát".
8. Doanh thu nhanh 7 ngày: biểu đồ cột theo ngày, 3 chuỗi Đã thu / Hoàn tiền / Nợ phát sinh.
9. Lịch hẹn hôm nay: tổng, đang phục vụ, chờ, hoàn thành; thẻ "TIẾP THEO" (giờ, tên, "Chưa chọn dịch vụ · Chưa gán nhân viên", trạng thái); "Xem tất cả".
10. Tỉ lệ doanh thu theo chi nhánh: tổng tháng này + % từng chi nhánh; ghi chú nguồn "sổ thanh toán theo chi nhánh được phân quyền".
11. Cảnh báo vận hành (4 thẻ, 3 mức KHẨN / CẢNH BÁO / THÔNG TIN): Việc cần duyệt, Kho sắp hết, Lead chưa nhận (CẢNH BÁO khi > 0), Nợ phát sinh.

## 3. Quy tắc nghiệp vụ thấy được
1. Mọi số tôn trọng quyền chi nhánh của người xem; doanh thu lấy từ sổ thanh toán, không tự cộng đơn.
2. Phê duyệt quá SLA tự thành cảnh báo KHẨN; mức thẻ cảnh báo đổi theo giá trị (0 = THÔNG TIN).
3. Lead chưa ai nhận là chỉ số bán hàng, bấm vào mở Hộp Lead.
4. Kho thấp tính theo tồn khả dụng (đã trừ phần giữ chỗ).
5. Xếp hạng nhân viên cộng doanh thu và lịch hoàn thành; bác sĩ, phụ tá, nhân viên xếp chung.
6. Truy cập nhanh do người dùng tự ghim nhưng vẫn lọc theo quyền.
7. Số liệu demo vẫn lệch giữa các khung do khác phạm vi lọc (ví dụ lịch hôm nay ở Dashboard khác số "x/y đã đến" ở Lịch hẹn). AMIA nên dùng một hàm đếm chung.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Vai trò "Bác sĩ", "Phụ tá" trên bảng xếp hạng.
- Còn lại trung tính (lịch, thu, nợ, kho, lead, phê duyệt), tái dùng được cho da liễu.

## 5. Đề xuất cho AMIA
1. Giữ các khối AMIA đã có; bổ sung khối "Lead chưa ai nhận" (đếm lead mới chưa có người phụ trách, bấm vào mở /marketing/lead lọc "Chưa nhận") trong dải cảnh báo và thẻ cảnh báo mức CẢNH BÁO.
2. Cảnh báo vận hành 3 mức (KHẨN / CẢNH BÁO / THÔNG TIN), mỗi thẻ có đường dẫn tới màn xử lý.
3. "Tùy biến" thật: hộp chọn chức năng để ghim, lưu theo người dùng, vẫn lọc theo quyền (AMIA hiện chỉ là nút dẫn sang Cài đặt).
4. Công khai công thức điểm xếp hạng (nút Hướng dẫn / chú thích).
5. Đèn trạng thái máy chủ và nút "Hướng dẫn sử dụng" ghi công thức từng số.

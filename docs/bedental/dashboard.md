# Dashboard (BeDental ERP)

Nguồn: chữ chụp từ bản demo. Không chép tên người thật; chỉ ghi cấu trúc. Biểu đồ chỉ có nhãn trục (21-10 đến 27-10), không có giá trị.

## 1. Mục đích
Trang đầu sau đăng nhập: "hôm nay có gì cần làm" cho người quản lý/chủ: cảnh báo gấp, việc của tôi, lịch hôm nay, tiền thu, nợ, kho, phê duyệt, doanh thu 7 ngày, xếp hạng nhân viên, tỷ trọng theo chi nhánh. Nội dung thay đổi theo quyền tài khoản.

## 2. Khối và nút (theo thứ tự trên trang)
1. Bộ chọn chi nhánh: Tất cả + từng chi nhánh.
2. Dải cảnh báo gấp: tiêu đề "N việc cần xử lý gấp hôm nay" kèm 3 con số: khoản chờ duyệt, sản phẩm sắp hết hàng, lead chưa ai nhận. Liên kết "Xem tất cả cảnh báo".
3. Bảng tin công ty: thông báo nội bộ, liên kết "Xem tất cả". Demo: "Chưa có thông báo công ty."
4. Top nhân viên tháng này: bảng xếp hạng (podium 3 người rồi danh sách 5 dòng). Mỗi dòng: hạng, tên, chi nhánh, vai trò (Bác sĩ / Nhân viên), doanh thu tạo ra, số lịch hoàn thành, điểm. Quan sát số liệu: điểm = doanh thu (triệu) + 2 điểm cho mỗi lịch hoàn thành (suy ra từ các dòng, cần xác nhận công thức).
5. Việc cần hoàn thành của tôi: danh sách có tiêu đề, loại, hạn, cờ "Quá hạn", nút "Mở"; liên kết "Tất cả". Việc là các phê duyệt giao cho mình.
6. Thẻ KPI (6 ô): Lịch hẹn hôm nay (tổng, hoàn thành, không đến); Đang chờ/phục vụ (số chờ, số đang phục vụ); Đã thu hôm nay (thu, hoàn); Nợ phát sinh hôm nay (số hóa đơn còn nợ); Cần phê duyệt (số quá hạn SLA); Kho thấp (theo tồn khả dụng).
7. Truy cập nhanh (theo quyền): Khách hàng, Lịch hẹn, POS, Báo cáo, Tính hoa hồng nhân viên, Kho & Mua sắm; nút "Tùy biến".
8. Doanh thu nhanh 7 ngày: biểu đồ theo ngày với 3 chuỗi: Đã thu, Hoàn tiền, Nợ phát sinh.
9. Lịch hẹn hôm nay: tổng lịch, đang phục vụ, chờ, hoàn thành; thẻ "TIẾP THEO" cho lịch gần nhất (giờ, tên, thiếu dịch vụ/nhân viên, trạng thái); liên kết "Xem tất cả".
10. Tỷ lệ doanh thu theo chi nhánh: tổng tháng này và phần trăm từng chi nhánh. Ghi chú nguồn dữ liệu: sổ thanh toán theo chi nhánh được phân quyền.
11. Cảnh báo vận hành (4 thẻ có mức): Việc cần duyệt (KHẨN), Kho sắp hết (THÔNG TIN), Lead chưa nhận (THÔNG TIN), Nợ phát sinh (THÔNG TIN).

## 3. Quy tắc nghiệp vụ thấy được
1. Mọi con số tôn trọng quyền chi nhánh của người xem; doanh thu lấy từ sổ thanh toán, không tự cộng đơn.
2. Phê duyệt quá hạn (SLA 24h) tự thành cảnh báo KHẨN.
3. Cảnh báo có hai mức: KHẨN và THÔNG TIN.
4. Lead chưa ai nhận là chỉ số bán hàng: lead mới phải có người phụ trách.
5. Kho thấp tính theo "tồn khả dụng" (đã trừ phần giữ chỗ), không phải tồn sổ sách.
6. Xếp hạng nhân viên cộng doanh thu và lịch hoàn thành; bác sĩ và nhân viên xếp chung.
7. Nợ phát sinh và đã thu tách khỏi nhau; hoàn tiền là chuỗi riêng.
8. Các ô số trong demo không nhất quán (phê duyệt chờ: 6 ở Dashboard, 8 ở Trung tâm phê duyệt; lịch hôm nay: 9 so với 6 và 34 ở mục Lịch hẹn) do khác phạm vi/bộ lọc. AMIA nên dùng một hàm đếm chung.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Vai trò "Bác sĩ" trên bảng xếp hạng; doanh thu gắn bác sĩ (chia công).
- Còn lại gần như trung tính (lịch, thu, nợ, kho, lead, phê duyệt) nên tái dùng được cho spa/da liễu.

## 5. Đề xuất cho AMIA
Làm theo thứ tự:
1. Dải 6 thẻ KPI (lịch hôm nay, đang chờ/phục vụ, đã thu, nợ phát sinh, cần phê duyệt, kho thấp) kèm bộ chọn chi nhánh. Đây là bản tối thiểu.
2. Khối "Việc của tôi" và "Lịch hôm nay" (thẻ TIẾP THEO).
3. Doanh thu 7 ngày (đã thu / hoàn / nợ) và tỷ trọng theo chi nhánh.
4. Cảnh báo vận hành 2 mức, bấm vào đi thẳng tới màn xử lý.
5. Truy cập nhanh theo quyền.
6. Bảng xếp hạng nhân viên (công khai công thức điểm).
7. Bảng tin công ty (có thể gắn Lark/Zalo sau).
Thêm cho AMIA: khối "lead chưa nhận" gắn Pancake/Zalo OA, khối "khách cần chăm sóc lại" (mốc 30/90 ngày), khối "lịch nhắc tái khám liệu trình".

Bỏ/hoãn: "Tùy biến" (làm sau), xếp hạng điểm nếu chưa có luật thưởng, các cảnh báo kho khi chưa có module kho.

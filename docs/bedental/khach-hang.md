# Khách hàng (BeDental ERP, mục `customers`)

Nguồn: chữ chụp từ bản demo. Không chép tên, số điện thoại, mã khách thật; chỉ ghi cấu trúc. Chỉ có trang tổng quan của mục; các tab con (Nhóm KH, Gần đây, Thống kê, Nhập Excel, Thêm mới) chưa đọc được (popup/khung ngoài vùng chính, không có tệp riêng).

## 1. Mục đích
Danh bạ khách trung tâm của chuỗi: tìm, lọc, phân nhóm, xem doanh thu trọn đời và lần đến gần nhất, làm nền cho lịch hẹn, POS, marketing. Demo có 13.443 khách, 269 trang.

## 2. Màn hình con

### 2.1 Danh sách khách hàng (trang chính)
- Tiêu đề kèm tổng: "N khách hàng" (cập nhật theo bộ lọc, đoán).
- Thanh nút trên cùng: Nhóm KH | Gần đây | Thống kê | Nhập Excel | Thêm mới.
- Bộ lọc (dạng ô chọn, có nút "Tắt bộ lọc" để xóa hết):
  1. Chi nhánh: Tất cả + từng chi nhánh (4 cơ sở và 1 Head Office).
  2. Nhóm khách (~28 nhóm): nhóm theo bảo hiểm (AIA, Bảo Việt, Fubon/Fulerton, Pacific Cross, MIC, VBI, PVI, Pjico), nhóm theo dịch vụ (Chỉnh nha, Răng sứ thẩm mỹ, Implant, Điều trị), nhóm theo kênh/đối tác (CTV, Cộng tác viên, Voucher, CTV voucher, telesale, zalo OA, google, ful, Hồ Chí Minh), nhóm theo đối tác nha khoa (Zenyum, SmileBeauty, Nha khoa HeRa), trạng thái (Khách vãng lai, Khách hàng nợ xấu).
  3. Hạng: Tất cả, Thường, Vàng, Bạc (có dòng trùng "Hạng Thường" 3 lần: dữ liệu cấu hình bẩn).
  4. Lần đến: Tất cả, đến trong 30 ngày, trong 3 tháng, chưa quay lại > 3 tháng, > 6 tháng, > 12 tháng, chưa đến lần nào.
  5. Nguồn giới thiệu: gần 60 giá trị, gồm kênh (Facebook, Google, Zalo, Telesale), tên CTV, tên nhân viên, tên khách cũ giới thiệu, nguồn phòng khám cũ.
- Bảng: Khách hàng | Điện thoại | Chi nhánh | Thẻ | Phân hạng | Nhóm | Nguồn giới thiệu | Lần đến gần nhất | Doanh thu | Thao tác.
  - Ô Khách hàng: avatar chữ cái đầu + tên + mã khách (hai kiểu tiền tố: kiểu nhập từ hệ thống cũ và kiểu tạo mới, kèm dãy số).
  - Ô Điện thoại: số có mã quốc gia + tên quốc gia (khách quốc tế là bình thường); có khách không có số ("—").
  - Thẻ: số thẻ dịch vụ/liệu trình khách đang giữ ("0 thẻ").
  - Lần đến gần nhất: ngày + diễn đạt tương đối ("12 ngày trước", "6 năm trước") hoặc "Chưa đến".
  - Doanh thu: tổng đã thu trọn đời (vd 0 ₫ với khách chưa phát sinh).
  - Thao tác: cột nút (nội dung chưa đọc được).
- Phân trang: "Hiển thị 1-50 / 13.443 khách", cỡ trang 50/100/200, chọn trang.

### 2.2 Các tab Nhóm KH, Gần đây, Thống kê, Nhập Excel, Thêm mới
Chưa đọc được (popup/khung ngoài vùng chính). Chỉ suy ra: Nhóm KH = quản lý danh mục nhóm; Gần đây = khách mở/tạo gần đây; Thống kê = số liệu tổng; Nhập Excel = nhập hàng loạt (nguồn dữ liệu cũ có thể từ đây); Thêm mới = form tạo khách (trường nhập chưa thấy).

## 3. Quy tắc nghiệp vụ thấy được
1. Một khách thuộc một chi nhánh gốc nhưng danh sách xem được toàn chuỗi (lọc theo chi nhánh).
2. Có phân hạng thành viên (Thường/Vàng/Bạc) hiển thị ngay trên danh sách.
3. "Lần đến" là bộ lọc chăm sóc lại: chia theo mốc 30 ngày, 3, 6, 12 tháng không quay lại. Dùng cho gọi nhắc.
4. Khách có thể ở nhiều "nhóm" để phân bổ quyền lợi/bảo hiểm/đối tác.
5. Doanh thu trọn đời nằm ngay danh sách (tính từ sổ thanh toán).
6. Nhập từ hệ thống cũ giữ mã cũ nên có hai kiểu mã song song.
7. Khách quốc tế phải hỗ trợ (mã quốc gia).
8. Bài học dữ liệu bẩn trong demo: nguồn giới thiệu trùng do khác hoa/thường hoặc sai chính tả (nhiều cách viết "facebook", "telesale", "kh cũ Tây Sơn"); nhóm/đối tác chèn vào đầu tên khách (kiểu "(Đối tác) tên"); nhiều khách có tên rỗng hoặc chỉ một ký tự; nhiều bản ghi trùng SĐT hoặc không có SĐT. AMIA phải ràng buộc ngay từ form.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Nhóm theo hãng bảo hiểm sức khỏe (nhiều hãng) và chương trình đối tác niềng răng. AMIA (da liễu/spa) không cần bảo hiểm.
- [NHA KHOA] Nhóm theo dịch vụ lớn (Chỉnh nha, Implant, Răng sứ) vì liệu trình dài tính theo đợt điều trị.
- [NHA KHOA] "Khách hàng nợ xấu" vì nha khoa hay trả góp/tạm ứng theo đợt.
- Hồ sơ y khoa (phiếu khám, sơ đồ răng, ảnh X-quang) không thấy ở danh sách; phần đó nằm ở hồ sơ bệnh án riêng, chưa chụp.

## 5. Đề xuất cho AMIA
Làm theo thứ tự:
1. Bảng khách: họ tên, SĐT (chuẩn hóa, bắt buộc, chống trùng), chi nhánh, nhóm, nguồn, lần đến gần nhất, tổng doanh thu, số thẻ/liệu trình, hạng. Phân trang 50/100/200, tìm nhanh theo tên/SĐT.
2. Bộ lọc: chi nhánh, nhóm, hạng, mốc "chưa quay lại" 30 ngày/3/6/12 tháng, nguồn. Nút "Tắt bộ lọc".
3. Danh mục NGUỒN chuẩn (Facebook, TikTok, Zalo OA, Google Map, Giới thiệu, CTV, Khách cũ, Event) và trường "người giới thiệu" tách riêng thay vì gộp vào cùng một danh sách. Đây là chỗ BeDental làm kém nhất.
4. Form Thêm mới + Nhập Excel có kiểm tra trùng SĐT. Tên chỉ là tên, không chèn đối tác vào tên.
5. Hạng thành viên và thẻ liệu trình (thay "Zenyum/Implant" bằng: gói liệu trình da, laser, tiêm; đối tác bán voucher).
6. Màn Thống kê khách (mới/cũ, theo nguồn) và danh sách "Gần đây".
7. Hồ sơ da/ảnh trước-sau, đồng ý chụp ảnh bằng văn bản (liên quan luật AMIA).

Bỏ: các nhóm bảo hiểm, hạng trùng lặp, mã khách hai kiểu, nhóm "nợ xấu" (thay bằng cờ công nợ).

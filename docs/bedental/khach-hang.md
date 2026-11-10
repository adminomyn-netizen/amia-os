# Khách hàng (BeDental ERP, mục `customers`)

Nguồn: đọc trực tiếp bản demo (chỉ xem; các hộp thoại mở ra rồi đóng, không lưu) và mã giao diện. Không chép tên, số điện thoại, mã khách thật; chỉ ghi cấu trúc.

Cập nhật 10/11/2026: đã đọc được mọi phần 27/10 ghi "chưa đọc được": form Thêm khách (19 trường), Nhóm KH, Gần đây, Thống kê, Nhập Excel, menu Thao tác (Sửa / Gộp hồ sơ / Lưu trữ) và TRANG HỒ SƠ KHÁCH 7 tab (Thông tin cá nhân, Lịch sử khám, Chăm sóc khách hàng, Ảnh bệnh nhân, Khách hàng liên quan, Thẻ dịch vụ, Thiết đặt thông báo). Mới thấy: phiếu khám có chữ ký bác sĩ + bệnh nhân, kê đơn thuốc từ mẫu, nhật ký điều trị kèm ảnh, tài liệu đính kèm, cây giới thiệu, liên hệ khẩn cấp, khóa gửi Zalo theo khách, điểm thưởng.

## 1. Mục đích
Danh bạ khách trung tâm của chuỗi (demo ~13.600 khách): tìm, lọc, phân nhóm, xem doanh thu trọn đời và lần đến gần nhất; hồ sơ khách là nơi khám, kê đơn, chăm sóc, ảnh, thẻ.

## 2. Màn hình con

### 2.1 Danh sách khách hàng
- Tiêu đề "N khách hàng". Nút: Nhóm KH | Gần đây | Thống kê | Nhập Excel | Thêm mới | Tắt bộ lọc.
- Ô tìm: "Tìm tên, mã KH, SĐT, email, mã thẻ, công ty…".
- Bộ lọc: Chi nhánh; Nhóm (~28); Hạng; Lần đến (đến trong 30 ngày / 3 tháng / chưa quay lại > 3, > 6, > 12 tháng / chưa đến lần nào); Nguồn giới thiệu (~51 giá trị, lẫn kênh, CTV, nhân viên, khách cũ).
- Cột: Khách hàng (avatar chữ, tên, mã) | Điện thoại (mã quốc gia + quốc gia) | Chi nhánh | Thẻ (số thẻ) | Phân hạng | Nhóm | Nguồn giới thiệu | Lần đến gần nhất (ngày + "N ngày/năm trước" / "Chưa đến") | Doanh thu | Thao tác.
- Thao tác (menu ⋯): Sửa thông tin | Gộp hồ sơ | Lưu trữ.
- Phân trang 50/100/200, ô nhập số trang.

### 2.2 Form "Thêm khách hàng mới"
Mã khách (hệ thống tự sinh) | Họ tên* | Giới tính (Nam/Nữ/Khác) | Số điện thoại (mã quốc gia) | Mã thẻ | Ngày sinh (ngày/tháng/năm) | Số ĐT Zalo | Email | Facebook (ID) | Căn cước/Passport | Nghề nghiệp | Công ty | Hạng (Thường/Bạc/Vàng/VIP) | Người giới thiệu (nhập SĐT người giới thiệu) | Nguồn khách hàng (Facebook, Google, Zalo, Website, Walk-in, Bạn bè giới thiệu, CTV, Khác) | Website | Nhóm khách hàng (tích nhiều nhóm + "Tạo nhóm mới…") | Địa chỉ (tỉnh → quận → số nhà) | Quốc gia | Ghi chú. Nút Đóng / Lưu thông tin.

### 2.3 Nhóm KH (hộp "Quản lý nhóm")
Tìm nhóm; Tạo mới (tên + màu nhóm); bảng Tên nhóm | Số khách | Sửa / Xóa.

### 2.4 Gần đây (hộp "Khách hàng gần đây")
Lọc khoảng thời gian; Xuất CSV; tìm theo tên/SĐT/mã; cột Khách hàng | Số điện thoại | Hoạt động gần nhất (ngày giờ); phân trang 10 dòng.

### 2.5 Thống kê (hộp "Thống kê khách hàng")
Tổng khách hàng; Khách mới tuần này; biểu đồ lượng khách theo ngày (30 ngày); "Khách hàng đến từ đâu?" (theo tỉnh); Giới tính; Phân nhóm khách hàng; Xếp hạng khách hàng.

### 2.6 Nhập Excel
Tải file mẫu; hướng dẫn số điện thoại dạng +quốc tế hoặc cột "Vùng điện thoại" mã ISO; kéo thả .csv/.xlsx/.xls; chọn nhóm khách (tùy chọn); "Ghi đè dữ liệu nếu trùng số điện thoại"; nút Nhập dữ liệu.

### 2.7 Hồ sơ khách (trang riêng `#/customers/<id>`)
- Đầu trang: ← | Thông tin khách hàng | mã | nút Lưu trữ, Gộp hồ sơ. Thanh dưới cố định: In phiếu | Tạo đơn hàng | Đặt lịch | Điểm | Khóa gửi Zalo.
- Thẻ tóm tắt: avatar, % hoàn thiện hồ sơ, tên, mã, "Khách từ <ngày>", hạng, chi nhánh, nhóm. Khối Thống kê: Chi nhánh, Điểm thưởng, Lần khám gần nhất, Ngày tạo hồ sơ, Tổng lịch hẹn, Hoàn thành, Sắp tới, Định kỳ sắp tới, Hủy / Vắng.
- Tab Thông tin cá nhân: các trường của form 2.2; Lịch sử giao dịch (số đơn, tổng; cột Đơn hàng | Ngày | Giá trị | Nợ | Gửi email "Gửi hóa đơn"); Tài liệu đính kèm (Hợp đồng, Cam kết, Thẻ bảo hành, Passport, Căn cước…; PDF/ảnh ≤ 20 MB; "+ Tải lên").
- Tab Lịch sử khám: "Phiếu khám & kê đơn thuốc" với bộ đếm Tất cả / Chưa gửi email / Nháp; nút Tạo phiếu khám, Kê đơn thuốc; bảng Ngày | Phiếu khám | Đơn thuốc. "Nhật ký điều trị" + Thêm nhật ký (nội dung + nhiều ảnh JPG/PNG/WebP); Xuất Excel; "Hóa đơn không ghi chú"; In nhật ký / PDF.
  - Form Tạo phiếu khám: Thông tin bệnh nhân (lấy từ hồ sơ, ô trống nhập được và cập nhật ngược hồ sơ) · Chi nhánh, Bác sĩ khám · Lý do khám / Triệu chứng (500), Chẩn đoán (500), Ghi chú (300) · Khám trong miệng (sơ đồ răng) · Tình trạng sức khỏe toàn thân (10 ô tích: huyết áp, tim mạch, tiểu đường, chảy máu lâu, gan, dị ứng thuốc, thần kinh, thai/kinh nguyệt, bệnh đang điều trị, khám chuyên khoa) · Cận lâm sàng (X-Quang, Xét nghiệm, Khác) · Kế hoạch điều trị (ô tích) · CHỮ KÝ bác sĩ và bệnh nhân vẽ tay (bắt buộc đủ 2 chữ ký mới phát hành) · Lưu nháp / Tạo phiếu khám. Phiếu có trạng thái Nháp / Đã phát hành / Hết hạn.
  - Kê đơn thuốc: "Kê đơn thuốc mới" (đơn trống) hoặc "Chọn từ đơn thuốc mẫu" (mẫu có thuốc, liều, lời dặn; tìm mẫu, sửa / xóa mẫu; tạo mẫu từ một đơn).
- Tab Chăm sóc khách hàng: Ghi chú nhanh + Lưu ghi chú; "+ Tạo ghi chú CSKH"; danh sách Lịch hẹn sắp đến (giờ, dịch vụ, trạng thái, nút "📞 Gọi khách", "+ Tạo ghi chú CSKH" cho từng lịch); "Timeline chăm sóc khách hàng".
- Tab Ảnh bệnh nhân: Tải ảnh lên (nhiều ảnh một lúc).
- Tab Khách hàng liên quan: Quan hệ gia đình / Liên hệ khẩn cấp (+ Thêm); Khách hàng liên quan (cây giới thiệu).
- Tab Thẻ dịch vụ: thẻ khách đang sở hữu.
- Tab Thiết đặt thông báo: kênh theo SĐT (VN → Zalo/ZNS, nước ngoài → WhatsApp, email song song); ghi nhận yêu cầu dừng tin tự động của khách; tin ưu đãi / sinh nhật chỉ gửi khi có đồng ý kèm bằng chứng; STOP/DỪNG qua WhatsApp chỉ dừng WhatsApp; thẻ kênh Zalo (Đang kích hoạt / nút Khóa gửi Zalo), WhatsApp (Không khả dụng với số VN).

## 3. Quy tắc nghiệp vụ thấy được
1. Khách thuộc một chi nhánh gốc, xem được toàn chuỗi theo quyền.
2. Hạng thành viên, nhóm (nhiều nhóm/khách), nguồn và người giới thiệu (theo SĐT) trên hồ sơ.
3. "Lần đến" là bộ lọc chăm sóc lại theo mốc 30 ngày / 3 / 6 / 12 tháng.
4. Gộp hồ sơ trùng và Lưu trữ (ẩn, không xóa) có sẵn trên danh sách và hồ sơ.
5. Phiếu khám chỉ phát hành khi đủ chữ ký 2 bên; hóa đơn không gắn phiếu khám trong ±3 ngày thì không tính hoa hồng (xem pos.md).
6. Đồng ý nhận tin quảng cáo phải có bằng chứng; khách có thể khóa từng kênh.
7. Nhập Excel chuẩn hóa SĐT quốc tế, tùy chọn ghi đè theo SĐT.
8. Dữ liệu demo vẫn bẩn (nguồn trùng do sai chính tả, tên đối tác chèn vào tên khách, hạng trùng) - bài học: danh mục nguồn chuẩn và ràng buộc ở form.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Sơ đồ răng FDI, kế hoạch điều trị nha (nhổ, chữa, nha chu, phục hình, chỉnh hình, implant), nhóm theo hãng bảo hiểm, nhóm đối tác niềng răng.
- Còn lại (phiếu khám có chữ ký, đơn thuốc mẫu, nhật ký điều trị có ảnh, tài liệu đính kèm, liên hệ khẩn cấp, cây giới thiệu, khóa kênh tin) dùng được cho da liễu.

## 5. Đề xuất cho AMIA
AMIA đã có: danh sách + bộ lọc rộng (nhiều hơn BeDental: sinh nhật, tuổi, doanh số, điểm, nợ, thẻ...), nhóm, gần đây, thống kê, nhập Excel có ghi đè, hồ sơ với ghi chú điều trị, ảnh, phiếu tư vấn, thẻ, điểm thưởng, người thân, nhắc nhở, khiếu nại/bảo hành, đồng ý dùng ảnh. Còn thiếu:
1. Gộp hồ sơ trùng (chọn hồ sơ giữ lại, chuyển hóa đơn/lịch/thẻ/ảnh/ghi chú, ghi nhật ký).
2. Lưu trữ khách (ẩn khỏi danh sách, không xóa; AMIA chỉ có xóa khách nhập nhầm).
3. Phiếu khám da liễu có chữ ký điện tử bác sĩ + khách và trạng thái Nháp / Đã phát hành.
4. Kê đơn thuốc + đơn thuốc mẫu (da liễu kê đơn thường xuyên), in đơn.
5. Tài liệu đính kèm theo khách (cam kết, phiếu đồng ý, CCCD; PDF/ảnh).
6. Thiết đặt thông báo theo khách: khóa gửi Zalo / dừng tin quảng cáo, lưu bằng chứng đồng ý.
7. Cây giới thiệu (khách nào giới thiệu khách nào) trong hồ sơ.
8. Gửi hóa đơn qua email từ lịch sử giao dịch; % hoàn thiện hồ sơ.

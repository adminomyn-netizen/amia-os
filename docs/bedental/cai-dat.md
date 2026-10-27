# BeDental ERP — Mục CÀI ĐẶT (đề bài cho AMIA OS)

Nguồn: bản chụp chữ demo BeDental ERP (nhóm C) và bản chụp bổ sung đọc được thêm: Thông tin chung, Chi nhánh, Web đặt lịch, Tài khoản ngân hàng, Bảng tin công ty, Danh mục dịch vụ / sản phẩm / thẻ, Hoa hồng, Chính sách phê duyệt, Trung tâm thông báo, Zalo Mini App. Không chép tên người, SĐT, số tài khoản, email, mã khách, số giấy phép. Chỗ nào vẫn không đọc được thì ghi "chưa đọc được". [NHA KHOA] = điểm riêng nha khoa.

## 1. Mục đích

"Thiết lập chính sách / master config": cửa hàng, sản phẩm / dịch vụ, hoa hồng, phê duyệt và kết nối. Đây là nơi đặt dữ liệu gốc mà các module khác (Nhân sự, POS, Marketing, Tài chính) đọc. Nguyên tắc nhắc nhiều lần: rule không hardcode, có version, thay đổi không ảnh hưởng dữ liệu đã ghi.

| Nhóm | Thẻ | Nhãn |
|---|---|---|
| CỬA HÀNG | Thông tin chung · Chi nhánh · Web đặt lịch · Tài khoản ngân hàng · Bảng tin công ty | Sẵn sàng |
| SẢN PHẨM / DỊCH VỤ | Danh mục dịch vụ · Danh mục sản phẩm · Loại thẻ dịch vụ / liệu trình | Sẵn sàng |
| HOA HỒNG | Cấu hình hoa hồng nhân viên · Cấu hình hoa hồng theo thực thu · Cấu hình hoa hồng giới thiệu 2 cấp | Sẵn sàng |
| | Cấu hình cap / kỳ khóa / rule version (trần chi, khóa kỳ, phiên bản rule) | Sắp có |
| PHÊ DUYỆT VÀ KIỂM SOÁT | Chính sách phê duyệt | Sẵn sàng |
| KẾT NỐI | Webhook và nhật ký tích hợp · Zalo Mini App · Trung tâm thông báo | Sẵn sàng |
| | API keys · Facebook | Sắp có |

## 2. Từng màn hình

### 2.1 Thông tin chung (store_info) - ĐỌC ĐƯỢC (các ô chưa có giá trị trong bản chụp)
Nút "Quay lại", "Lưu thông tin". Hai khối.
Khối 1 - hồ sơ cửa hàng:
- Tên cửa hàng * | Chủ cửa hàng * (bắt buộc).
- Nhóm kinh doanh (chọn một): Dental Clinic | Hair Salon | Spa | Nail | Barber | Beauty Clinic | Khác. Cho thấy hệ thống gốc là nền dùng chung cho nhiều ngành dịch vụ, nha khoa chỉ là một giá trị; AMIA chọn Beauty Clinic / Spa.
- Điện thoại | Email | Tên miền | Trang Facebook | Website.
- Link chat WhatsApp (có chú thích: hiện nút WhatsApp trong email gửi khách; để trống thì ẩn nút).
- "Đăng ký vào" (chỉ đọc, ngày giờ tạo cửa hàng).
- Logo công ty / cửa hàng: nút "Chọn ảnh", "Xóa logo".
Khối 2 - "Thông tin pháp lý trên văn bản": dùng cho văn bản nội bộ ở Văn bản & Hợp đồng. Khi bấm "Ban hành & cấp số", hệ thống cấp số theo mẫu 01/2026/QĐ-BE (số thứ tự / năm / loại văn bản - ký hiệu viết tắt công ty), đánh số CHUNG toàn công ty, mỗi loại văn bản một dãy số theo năm. Trường: Tên pháp lý công ty * | Mã số thuế * | Ký hiệu viết tắt * | Địa chỉ đăng ký * | nút "Lưu thông tin pháp lý". [NHA KHOA] không đặc thù: mọi doanh nghiệp đều cần.

### 2.1b Các thẻ Cửa hàng khác
Chi nhánh -> 2.9 · Web đặt lịch -> 2.10 · Tài khoản ngân hàng -> tai-chinh-ke-toan.md 3.11 · Bảng tin công ty -> 2.11 · Zalo Mini App -> 2.12 · Trung tâm thông báo -> 2.13 · Webhook và nhật ký tích hợp -> marketing.md 2.3.

### 2.2 Danh mục dịch vụ
- Cột trái "Phân nhóm dịch vụ": cây nhóm có số lượng. Demo: 117 dịch vụ, 13 nhóm: Chăm sóc răng miệng tại nhà · Chỉnh nha - niềng răng · Cấy ghép Implant · Khám và chẩn đoán · Khám chữa bệnh · Nha khoa dự phòng · Nha chu · Phục hồi · Thẩm mỹ · Phẫu thuật răng hàm mặt · Phục hình cố định (răng sứ, cầu răng) · Phục hình răng · Điều trị nội nha (tủy). [NHA KHOA]
- Nút: + Tạo nhóm dịch vụ · Chép từ chi nhánh · Nhập từ Excel · Xuất ra Excel · Hướng dẫn · Tạo dịch vụ mới.
- Bộ lọc: tình trạng (Sẵn sàng / Ẩn / Ngưng hoạt động) và "Tùy chọn nơi hiển thị" (Thu ngân và Đặt lịch / Chỉ Thu ngân / Chỉ Đặt lịch / Đã ẩn).
- Bảng: Ảnh · Mã dịch vụ · Tên dịch vụ (tên Việt + tên Anh) · Giá bán · VAT · Thời gian (ví dụ 30p, 1g) · Tình trạng · Nơi hiển thị. Có cờ "Sửa giá khi thanh toán" cho dịch vụ giá linh hoạt.
- Giá từ vài trăm nghìn đến hàng triệu đồng mỗi dịch vụ.

### 2.3 Danh mục sản phẩm
- Giống 2.2 nhưng có phân nhóm sản phẩm (demo 12 sản phẩm, 1 nhóm "Sản phẩm điều trị") và cột Đơn vị (Tuýp, Chai) thay cho Thời gian; cờ "Sửa giá". Nơi hiển thị có "Chỉ Thu ngân". [NHA KHOA]: sản phẩm là kem đánh răng, nước súc miệng điều trị.
- Mã sản phẩm dạng SP-xxxxxx; mã dịch vụ DVyymmxxxx.

### 2.4 Loại thẻ dịch vụ / liệu trình
- Nút: Xuất Excel · Nhập từ Excel · KH dùng thẻ · Tạo thẻ dịch vụ · Tạo nhóm thẻ · Sửa.
- Tab: Tất cả · Thẻ số lần · Thẻ số tiền (hai loại thẻ).
- Bảng: Mã · Tên thẻ · Loại thẻ · Giá bán thẻ · Số lần sử dụng · Tài khoản thẻ (số dư tiền) · Thời hạn thẻ (ví dụ 12 tháng) · Phân nhóm thẻ · Mô tả chức năng. Demo 1 thẻ số lần, 10 lần.

### 2.5 Cấu hình hoa hồng nhân viên (hr_commission, cũng mở từ Nhân sự)
- Cột trái: danh sách nhân viên; cột phải "Cài đặt chi tiết hoa hồng" với nút Sao chép cài đặt · Cài đặt đồng loạt · Lưu thiết lập; lọc Tất cả sản phẩm/dịch vụ/thẻ · Dịch vụ · Sản phẩm · Thẻ dịch vụ. Có nút "Thiết lập nâng cao". Khi chưa chọn nhân viên chưa hiện form chi tiết (chưa đọc được các trường nhập).

### 2.6 Cấu hình hoa hồng theo thực thu (cash_commission_settings)
Màn lớn nhất (chữ gần 2 MB do lặp). Đã đọc phần đầu và thống kê cấu trúc toàn tệp.
- Đầu trang: "Tỷ lệ dưới đây chỉ đọc và tham chiếu đúng policy đang hiệu lực." Nút: Làm mới cấu hình · Mở Thiết lập nâng cao. Nhãn phiên bản: "Policy r48" (policy có số revision, hiện là bản 48).
- Chế độ split (chia doanh số trước khi xét ngưỡng và tính hoa hồng): giá trị đang chọn "Không đánh giá: hưởng 100%" (không chia doanh số giữa các người).
- Bảng rule: cột Rule · Nhánh · Tỷ lệ. Khóa rule có cấu trúc `staff:<mã nhân viên>:<loại hàng: product hoặc service>:<mã hàng>:<vai trò>`. Số lượng đếm được: khoảng 19.500 rule cho 29 nhân viên x 100 dịch vụ + 11 sản phẩm x 3 vai trò.
- 3 vai trò hưởng hoa hồng trên mỗi dòng bán: `sales` (người bán / chốt), `service` (người thực hiện), `consultant` (người tư vấn).
- "Nhánh" = phạm vi áp dụng: `Fallback` (mặc định cho mọi chi nhánh) hoặc `branch-N` (ghi đè cho một chi nhánh).
- Tỷ lệ quan sát được (đếm theo dòng): đa số 0%; 10% (phần lớn rule người thực hiện); 1% (tư vấn); 15% (người bán sản phẩm, và một số dịch vụ); một số dịch vụ tính cố định 200.000 đ hoặc 300.000 đ trên mỗi đơn vị; ghi đè chi nhánh: tư vấn 5% hoặc 2% ở chi nhánh 1, 1% ở chi nhánh 2.
- Mẫu mặc định rút ra: sản phẩm người bán 15%; dịch vụ người thực hiện 10% hoặc số tiền cố định theo đơn vị; tư vấn 0-1% (có chi nhánh cao hơn); người bán dịch vụ 0%.
- Khối "Mô phỏng không ghi sổ" (chạy thử, không tạo bút toán): trường nhập Kỳ · Doanh số dòng · Số lượng · Các dòng cùng mặt hàng · Doanh số cá nhân sau chia · Doanh số chi nhánh · % giảm giá · Nguồn đối tác · Hệ số giờ (%) · Hệ số đánh giá k (%) · nút "Chạy mô phỏng". Các trường này cho thấy công thức hoa hồng có thể phụ thuộc: doanh số, số lượng, giảm giá, đối tác bảo hiểm, giờ làm, điểm đánh giá, ngưỡng doanh số cá nhân và chi nhánh.
- Cuối màn hiện "Not Found Exception" (lỗi khi tải phần mô phỏng/kỳ trong bản demo). Phần "quản lý trạng thái kỳ hoa hồng thực thu" (mở / khóa kỳ) nêu ở mô tả thẻ nhưng nội dung chưa đọc được.

### 2.7 Cấu hình hoa hồng giới thiệu 2 cấp
- Nút: "+ Chương trình 2 cấp". Bảng: Mã · Tên · Số cấp · Cấp 1 · Cấp 2 · Trạng thái · Version. Demo rỗng.
- Quy tắc ghi trên màn: admin nhập mức từng cấp (cấp 1 trực tiếp, cấp 2 tuyến trên), không hardcode; sửa cấu hình sinh version mới, không ảnh hưởng hoa hồng đã ghi; báo cáo và bút toán xem tại Báo cáo, Hoa hồng giới thiệu.

### 2.8 Chính sách phê duyệt (maker-checker)
Khác với "Quy trình phê duyệt" ở Nhân sự (cấu hình ai duyệt) và "Trung tâm phê duyệt" (hàng chờ hằng ngày): màn này quyết định THAO TÁC NÀO phải duyệt và ở chế độ kiểm soát nào.

Ba cấp độ kiểm soát (chọn một, hiện đang áp dụng Cấp độ 2):
1. Ghi nhận trực tiếp: đủ quyền là ghi ngay, không duyệt.
2. Khuyến nghị - Duyệt thao tác nhạy cảm: chỉ thao tác nhạy cảm vào hàng chờ duyệt.
3. Kiểm soát toàn phần (Maker-Checker): tạo, sửa, hủy quan trọng đều chờ duyệt.

Phạm vi áp dụng: Toàn hệ thống · Theo chi nhánh · Theo module · Theo vai trò.

Bảng "Thao tác cần duyệt" — cột: Thao tác · Cần duyệt (tích) · Yêu cầu lý do sửa · Yêu cầu chứng từ · Ngưỡng (đ). Mỗi thao tác có mức rủi ro (LOW / MEDIUM / HIGH / CRITICAL) và tình trạng triển khai (Sẵn sàng / Đang hoàn thiện / Future). Danh sách:

| Module | Thao tác (rủi ro; tình trạng triển khai ghi trong ngoặc, thiếu thì là Sẵn sàng) |
|---|---|
| Hóa đơn | Hủy hóa đơn (HIGH) · Xóa hóa đơn (CRITICAL; Đang hoàn thiện, executor chưa nối) · Sửa hóa đơn đã khóa, chỉ field an toàn như ghi chú / thu ngân (HIGH; field tài chính deferred) · Tạo hóa đơn lùi ngày, chỉ đổi ngày đơn chưa ghi sổ (HIGH) · Hoàn tiền (HIGH; Đang hoàn thiện, chưa có nghiệp vụ hoàn tiền) · Sửa thanh toán (HIGH; Future) · Giảm giá lớn theo ngưỡng (MEDIUM; Future) |
| Khách hàng | Sửa SĐT / email (MEDIUM) · Đổi tên khách (LOW; bật thì nhân viên đổi tên chờ chủ phòng khám duyệt, tắt thì đổi trực tiếp) · Xóa khách (CRITICAL; Đang hoàn thiện, executor deferred vì thiếu guard) · Gộp khách an toàn (HIGH) · Đổi hạng (MEDIUM; Đang hoàn thiện) · Đổi chi nhánh (MEDIUM) |
| Thẻ dịch vụ | Cấp thủ công (HIGH; Future) · Sửa số dư / số lần (HIGH) · Gia hạn vượt policy (MEDIUM; Đang hoàn thiện) · Thu hồi (HIGH) · Xóa (CRITICAL; Future) |
| Sổ quỹ | Lập phiếu thu thủ công · Lập phiếu chi thủ công · Chuyển / nạp / rút quỹ (đều HIGH) · Đảo phiếu đã ghi sổ (CRITICAL) · Thiết lập / điều chỉnh số dư ban đầu (CRITICAL) |
| Thu nợ khách hàng | Thu nợ lùi ngày (HIGH) · Hủy phiếu thu nợ (CRITICAL; đảo tiền, đảo công nợ và đảo hoa hồng, giữ nguyên lịch sử phiếu gốc) |
| Kho | Điều chỉnh tồn · Điều chỉnh giá vốn · Hủy phiếu (HIGH) · Chuyển kho giá trị lớn (MEDIUM) - tất cả Future |
| Mua hàng / Công nợ / Kế toán | Tạo bút toán (HIGH) · Đảo bút toán (CRITICAL) · Thanh toán NCC (HIGH) · Mở kỳ đã khóa (CRITICAL) - tất cả Future |

Cách đọc bảng: mỗi dòng thao tác có ô tích nhanh "Cần duyệt" và, ngay trên cùng dòng, ba ô cấu hình "Yêu cầu lý do sửa" | "Yêu cầu chứng từ" | "Ngưỡng (đ)" (dấu "-" ở cột Ngưỡng nghĩa là thao tác không áp ngưỡng tiền; ô để trống là có thể nhập ngưỡng - thấy ở Hoàn tiền, Giảm giá lớn, Sửa số dư / số lần của thẻ, toàn bộ thao tác Sổ quỹ và hai thao tác Thu nợ). Mỗi dòng ghi thêm cột trạng thái triển khai (Sẵn sàng / Đang hoàn thiện / Future) và ghi chú kỹ thuật (executor).
Bằng chứng dùng thật (từ Trung tâm phê duyệt, xem noi-lam-viec.md 2.2): thao tác Sổ quỹ (lập phiếu thu / chi thủ công, đảo phiếu) và thu nợ lùi ngày chiếm toàn bộ hàng chờ "thao tác nhạy cảm" của demo.

Cấu hình chung (cuối màn): Không cho tự duyệt (người tạo không được tự duyệt đơn của mình) · Cảnh báo kỳ đã chốt · SLA xử lý (giờ) · Thời hạn bổ sung nhân viên sau khi thanh toán (giờ). Nút "Lưu chính sách".
Chưa đọc được: giá trị đã tích ở cột "Cần duyệt" của từng dòng (bản chụp không giữ trạng thái tích); chỉ biết các dòng có ô nhập lý do / chứng từ / ngưỡng.

### 2.9 Chi nhánh (branches) - ĐỌC ĐƯỢC
- Tiêu đề "Quản lý chi nhánh", đếm "N chi nhánh" (demo 6). Nút "Quay lại", "Thêm chi nhánh". Bộ lọc trạng thái: Tất cả | Nháp | Hoạt động | Tạm ngưng | Đã đóng.
- Bảng 11 cột: Chi nhánh (tên + địa chỉ ngắn) | Mã (dạng chữ HOA gạch dưới, ví dụ mã theo địa chỉ hoặc "TRU_SO_CHINH" cho trụ sở) | Giấy phép hoạt động (số GPHĐ theo tỉnh, dạng .../HNO-GPHĐ hoặc .../HCM-GPHĐ; "-" nếu không phải cơ sở khám) [NHA KHOA] | Bác sĩ phụ trách chuyên môn (người đứng tên giấy phép) [NHA KHOA] | Thành phố | GPS (bán kính cho chấm công, hiện "50m" hoặc "Tắt") | Google Maps (nút "Mở bản đồ" hoặc "+ Thêm link") | Nhân viên (số nhân viên đang gán) | Trạng thái | Mặc định (đánh dấu một chi nhánh mặc định) | Thao tác.
- Demo: 3 cơ sở khám (có giấy phép, bác sĩ phụ trách, thành phố), 1 trụ sở chính (1 nhân viên, không giấy phép), 2 chi nhánh tạm ngưng (đặt trước, 0 nhân viên, GPS tắt).
- Quy tắc: chi nhánh dùng ở mọi bộ lọc (sổ quỹ, lịch hẹn, kỳ kế toán, báo cáo); chi nhánh "Tạm ngưng" không xuất hiện trong bộ chọn chi nhánh của Sổ quỹ / Khóa kỳ / Web đặt lịch (các bộ chọn đó chỉ liệt kê 4 chi nhánh đang hoạt động), dữ liệu cũ giữ; một chi nhánh mặc định; GPS có thể tắt theo chi nhánh. Ảnh bìa từng chi nhánh cho Zalo Mini App cũng chỉnh ở đây (xem 2.12). Form Thêm / Sửa chi nhánh chưa đọc được (suy luận: tên, mã, địa chỉ, giấy phép, bác sĩ phụ trách, tọa độ + bán kính, giờ mở cửa, ảnh bìa).

### 2.10 Web đặt lịch (booking_web) - ĐỌC ĐƯỢC
Nút "Quay lại", "Sửa web đặt lịch". Khối thông tin:
- Đường dẫn đặt lịch (nút "Sao chép", "Xem trang") và "Mã nhúng website" (nhúng vào web công ty).
- Giao diện: hộp tích "Hiển thị ô chọn buổi trong ngày"; "Dành cho khách hàng": Cả khách nam và nữ | Chỉ khách nam | Chỉ khách nữ [không liên quan nha khoa; hữu ích cho barber/spa].
- Nhận lịch: "Chi nhánh mở đặt lịch trực tuyến" (mỗi chi nhánh một công tắc, nút "Mở tất cả" / "Đóng tất cả").
- Cấu hình lịch: Thời gian của 1 khung giờ (15 / 30 / 45 / 60 phút; ví dụ khung 15 phút thì 8:15, 8:30, 8:45) | Cho phép đặt lịch trước giờ bắt đầu (Không hạn chế / 30 phút / 1 giờ / 2 giờ / 4 giờ / 12 giờ / 1 ngày) | Số lượt khách đặt tối đa cho 1 khung giờ | Giới hạn số ngày đặt lịch trước (Không giới hạn / 7 / 14 / 30 / 60 / 90 ngày) | Thời gian mặc định làm dịch vụ của 1 lịch hẹn (15 / 30 / 45 / 60 / 90 / 120 phút) | Trạng thái mặc định khi đặt lịch từ web và mobile apps (Đã xác nhận / Chưa xác nhận) | Hộp tích "Tạo lịch hẹn định kỳ sau khi hoàn thành hóa đơn" (tự đặt lịch tái khám) | Ngôn ngữ hiển thị (Tiếng Việt / English) | Đặt màu cho web đặt lịch (Mặc định + chọn màu) | Công tắc "Khóa trang web đặt lịch".
- "Trạng thái và thông báo": lịch từ web tự gắn nguồn "Khách đặt lịch qua web"; kênh gửi cho khách và nhân viên dùng chính sách chung; nút "Mở Trung tâm thông báo".
- "Quy tắc sức chứa theo khung giờ": quy tắc theo khoảng giờ, ưu tiên chi nhánh hơn mức chung; các khoảng cùng phạm vi không được chồng nhau; nút "Thêm quy tắc", "Lưu quy tắc sức chứa".
- "Cài đặt ngày nghỉ ở cửa hàng": nhập theo múi giờ Asia/Saigon, lưu mốc UTC; "Tất cả chi nhánh" dùng múi giờ trình duyệt. Trường: Từ ngày | Đến ngày | Chi nhánh (Tất cả hoặc từng chi nhánh) | nút "Tạo mới". Bảng ngày nghỉ: Từ ngày | Đến ngày | Chi nhánh | (thao tác). Demo "Chưa có ngày nghỉ nào".
- "Email nhận thông báo lịch hẹn": gửi email nội bộ khi có lịch mới, đổi lịch hoặc hủy (áp dụng toàn hệ thống; SĐT khách được che trong email). Hộp tích: Lịch hẹn mới | Lịch hẹn thay đổi (giờ, chi nhánh, người phụ trách) | Lịch hẹn bị hủy | Gửi cho nhân viên phụ trách lịch hẹn. Danh sách email nhận (ô nhập + nút "Thêm") và nút "Lưu email lịch hẹn".
- Ghi chú: không chọn bác sĩ / kỹ thuật viên ngay trên trang web đặt lịch; chọn dịch vụ và khung giờ (suy luận, không thấy trường chọn người).

### 2.11 Bảng tin công ty (company_announcements) - ĐỌC ĐƯỢC
- "Cài đặt > Bảng tin công ty"; mô tả "Thông báo áp dụng cho toàn bộ nhân viên trong công ty". Nút "Tạo thông báo" và liên kết quay lại "Cài đặt". Phân trang "Trước / 1 / 1 / Sau".
- Mỗi thông báo (thẻ): nhãn GHIM (ghim lên đầu), tiêu đề, đoạn trích nội dung (hiện khoảng 300 ký tự, cắt bằng "..."), người sửa cuối + thời điểm cập nhật, khung "Hiển thị từ ... đến ..." (lên lịch hiển thị theo ngày giờ), trạng thái ("Đang xuất bản"; suy luận còn trạng thái ẩn / hết hạn), nút "Sửa" | "Ẩn" | "Xóa". Form tạo (trường: tiêu đề, nội dung, ghim, thời gian hiển thị, đối tượng) chưa đọc được.
- [NHA KHOA] Nội dung demo: thông báo đối tác bảo hiểm mới chấp nhận bảo lãnh viện phí trực tiếp; thông báo chấn chỉnh giờ làm việc toàn cơ sở (giờ làm 08:30 đến 18:00, nghỉ trưa 12:00 đến 13:30; khớp với ca "Cả ngày" ở nhan-su.md 2.3).
- Dùng cho thông báo toàn công ty có thời hạn; khác Wiki công ty (tài liệu ban hành lâu dài, xem noi-lam-viec.md 2.6).

### 2.12 Zalo Mini App (miniapp_settings) - ĐỌC ĐƯỢC
Nút "Quay lại", "Lưu thay đổi". Hai khối.
- "Cấu hình chung" (nội dung public catalog cho khách; ảnh bìa từng chi nhánh chỉnh ở Cài đặt > Chi nhánh): hộp tích "Hiển thị bảng giá" | "Hiển thị danh sách chi nhánh" | "Giá bằng 0 hiển thị 'Liên hệ'"; ô nhập Tiêu đề tư vấn | Nhãn nút tư vấn | Zalo OA URL | Giới thiệu chi nhánh | Ảnh mặc định cho chi nhánh (URL).
- "Biên tập nội dung Mini App": tạo, sửa, xuất bản và ẩn nội dung hiển thị cho khách, chia 5 tab: Ưu đãi & mã | Bảo hiểm | Tuyển dụng | Tin tức sức khỏe | Đối tác. [NHA KHOA] riêng: tab Bảo hiểm và Đối tác.
- "Xem trước nội dung" mô phỏng giao diện điện thoại: câu hỏi "Không biết chọn dịch vụ nào?" với nút "Tư vấn khám", các mục "Bảng giá" (kèm một dịch vụ mẫu "Khám tổng quát"), "Liên hệ", "Chi nhánh" với tiêu đề "Hệ thống chi nhánh". Tức Mini App cho khách có các phần: bảng giá, chi nhánh, tư vấn (mở Zalo OA), nội dung (ưu đãi, bảo hiểm, tin).

### 2.13 Trung tâm thông báo (zalo_messaging) - ĐỌC ĐƯỢC
- 3 ô tóm tắt: số "Quy tắc đang bật" | "Bản nháp cấu hình" | "Email song song" (demo: 9 / 14 / 8).
- "Định tuyến khách hàng - Zalo + WhatsApp" theo quốc gia của số điện thoại nhận: số Việt Nam -> tin UID Zalo, nếu không được thì tin ZNS; số quốc tế -> tin WhatsApp; không chuyển chéo giữa hai nhóm. Email là nhánh độc lập, bật riêng từng loại tin. Dòng trạng thái: WhatsApp đã kết nối; SMS còn khóa đến khi tích hợp bộ gửi.
- Khối bộ gửi OA/ZNS ("sẵn sàng"): nhịp gửi gần nhất (mốc thời gian), hàng đợi (số đến hạn, độ trễ lớn nhất tính bằng giây, số lỗi, số "chưa rõ kết quả"). Demo: 0 đến hạn, 85 lỗi, 3 chưa rõ kết quả - tức hàng lỗi tồn đọng, cần màn xem lỗi và gửi lại.
- Danh sách quy tắc (suy luận: loại tin như nhắc lịch, xác nhận, cảm ơn; kênh; mẫu; bật / tắt) chưa đọc được trong bản chụp.

## 3. Quy tắc nghiệp vụ thấy được

Hoa hồng
- Hoa hồng tính trên THỰC THU (tiền khách đã trả), không phải doanh số hứa; hủy phiếu thu nợ thì đảo luôn hoa hồng.
- Rule cấp theo nhân viên x mặt hàng x vai trò (bán / thực hiện / tư vấn), kèm ghi đè theo chi nhánh; có mặc định "Fallback".
- Kiểu tính: phần trăm hoặc số tiền cố định trên đơn vị. Có hệ số giờ, hệ số đánh giá, ngưỡng doanh số, giảm giá, nguồn đối tác ảnh hưởng.
- Policy có số revision (r48), mọi cấu hình versioned, không hardcode, không sửa ngược dữ liệu đã ghi. Mô phỏng không ghi sổ để kiểm trước. Trần chi, khóa kỳ, rule version là phần "Sắp có".
- Hoa hồng giới thiệu 2 cấp tách riêng (xem marketing.md).

Phê duyệt maker-checker
- 3 cấp độ kiểm soát, áp theo phạm vi (hệ thống, chi nhánh, module, vai trò) và ngưỡng tiền.
- Phân biệt 3 thứ: Chính sách (thao tác nào cần duyệt) khác Quy trình (ai duyệt) khác Trung tâm phê duyệt (hàng chờ).
- Thao tác rủi ro CRITICAL thường là xóa hoặc đảo bút toán đã ghi sổ; ưu tiên "đảo bút toán giữ lịch sử" hơn xóa.
- Cấm tự duyệt; có SLA xử lý theo giờ; yêu cầu lý do và chứng từ tùy thao tác; cảnh báo khi đụng kỳ đã chốt.

Danh mục
- Dịch vụ / sản phẩm: nhóm, giá, VAT, thời lượng hoặc đơn vị, tình trạng 3 mức, nơi hiển thị (thu ngân / đặt lịch), cờ sửa giá khi thanh toán, nhập / xuất Excel, chép từ chi nhánh.
- Thẻ: loại theo số lần hoặc theo số tiền, có hạn dùng (tháng), có nhóm thẻ.
- Số tài khoản ngân hàng luôn che khi hiển thị.

Thông báo và kết nối
- Kênh theo quốc gia: Zalo/ZNS cho số Việt Nam, WhatsApp cho số nước ngoài, không chuyển chéo; email riêng; thông báo nhân viên riêng.

## 4. Điểm riêng nha khoa [NHA KHOA]
- Cây nhóm dịch vụ nha khoa (niềng, implant, nội nha, phục hình, nha chu...).
- Dịch vụ tính hoa hồng theo đơn vị (như mỗi răng) cho người thực hiện.
- Hoa hồng tính theo nguồn đối tác (hãng bảo hiểm, bảo lãnh viện phí).
- Sản phẩm bán kèm là sản phẩm chăm sóc răng miệng; bảo hành / thẻ liệu trình dài hạn cho niềng.

## 5. Đề xuất cho AMIA

Làm theo thứ tự:
1. Thông tin chung + Chi nhánh (master): bảng organizations / branches với Supabase; mọi module khác tham chiếu.
2. Danh mục dịch vụ và sản phẩm (nhóm, giá, VAT, thời lượng, hiển thị thu ngân / đặt lịch, sửa giá) + Loại thẻ liệu trình (số buổi, số tiền, hạn dùng). Nhóm dịch vụ AMIA: da liễu, laser, trị liệu, chăm sóc da, spa; thêm trường "liệu trình gồm N buổi" và "cần bác sĩ hay kỹ thuật viên".
3. Chính sách phê duyệt (maker-checker) làm sớm, vì ảnh hưởng thiết kế mọi thao tác nhạy cảm: bảng `approval_policies` (module, thao tác, rủi ro, cần duyệt, ngưỡng, yêu cầu lý do, chứng từ) + 3 cấp độ + cấm tự duyệt + SLA. Mọi thao tác sửa / hủy / đảo đều đi qua một hàm chung trả về "thực hiện ngay" hoặc "vào hàng chờ".
4. Hoa hồng nhân viên theo thực thu: khởi đầu gọn gàng hơn BeDental — bảng rule theo (vai trò, nhân viên hoặc nhóm, dịch vụ hoặc nhóm dịch vụ, % hoặc số tiền cố định, chi nhánh ghi đè) thay vì 19.500 dòng cho từng người x từng dịch vụ; cho phép đặt mặc định ở cấp NHÓM dịch vụ rồi ghi đè. Có version, mô phỏng không ghi sổ, đảo hoa hồng khi hủy thu.
5. Hoa hồng giới thiệu (1 cấp trước, 2 cấp sau), cùng cơ chế version.
6. Tài khoản ngân hàng (che số), Trung tâm thông báo (Zalo/ZNS, email; chỉ giữ WhatsApp nếu có khách quốc tế; kèm hàng đợi có màn lỗi / gửi lại), Zalo Mini App hoặc web đặt lịch. Web đặt lịch AMIA nên có đủ: khung giờ 15 - 60 phút, đặt trước tối thiểu, số khách tối đa mỗi khung, giới hạn số ngày đặt trước, thời lượng mặc định, trạng thái mặc định, quy tắc sức chứa theo khung giờ, ngày nghỉ theo chi nhánh, email báo lịch mới / đổi / hủy, tự tạo lịch tái khám sau hóa đơn (rất hợp liệu trình).
7. Danh mục chi nhánh: mã, giấy phép, người phụ trách chuyên môn (AMIA: số giấy phép hoạt động 1233/NA-GPHĐ phải hiển thị trên bài đăng và văn bản), bán kính GPS, link bản đồ, trạng thái 4 mức, đánh dấu mặc định. Thông tin chung chọn nhóm kinh doanh Beauty Clinic; khối pháp lý để cấp số văn bản.

Bỏ hoặc để sau: Bảng tin công ty (nếu cần thì rất nhẹ: tiêu đề, nội dung, ghim, lịch hiển thị, ẩn), API keys, Facebook, webhook / nhật ký tích hợp (dùng log của Supabase trước), cap / kỳ khóa / rule version (làm đơn giản bằng cột `effective_from`), các thao tác "Future" trong chính sách (kho, mua hàng, kế toán) cho tới khi có module tương ứng.
Lưu ý thiết kế rút từ lỗi demo: tránh nhân rule theo từng nhân viên x từng dịch vụ; tránh hardcode mức hoa hồng; cần có mặc định theo nhóm; tách rõ ba loại "chính sách / quy trình / hàng chờ" ngay từ đầu.

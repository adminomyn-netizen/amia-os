# POS / Bán hàng (BeDental ERP, mục `pos`)

Nguồn: đọc trực tiếp bản demo (mở một đơn đang chờ để xem; KHÔNG bấm Thanh toán / Lưu; mọi hộp thoại đóng bằng Hủy / Đóng) và mã giao diện. Không chép tên khách, mã đơn.

Cập nhật 10/11/2026: đã đọc được phần 27/10 ghi "chưa đọc được": danh sách "Các đơn hàng chờ đang thanh toán", màn đơn đã chọn (thông tin khách, điểm, nợ cũ + Thu nợ, giảm giá dòng, mã ưu đãi, lịch sử thanh toán, chế độ sửa), hộp Thanh toán (13 hình thức, gợi ý tiền khách đưa, ngày thu nhập bù, in hóa đơn song ngữ), hộp chọn nhân viên phục vụ / tư vấn theo dòng kèm mức hoa hồng. Mới: cảnh báo "chưa gắn phiếu khám thì hóa đơn không tính hoa hồng"; ô "Nhập mã ưu đãi" (Mã ưu đãi là chức năng Marketing mới).

## 1. Mục đích
Quầy thu ngân: chọn/tạo đơn của một khách, thêm dịch vụ / sản phẩm / thẻ dịch vụ, gán nhân viên từng dòng, giảm giá, thu tiền (thu nhiều lần), in hóa đơn.

## 2. Màn hình con

### 2.1 Cột trái: đơn hàng
- Thanh trên: "Chờ thanh toán (N)" | "Chọn đơn hàng" | Tạo đơn hàng mới / Tạo đơn hàng.
- Khi chọn đơn: mã đơn – tên khách, trạng thái (ví dụ "Thanh toán một phần"); khách: SĐT, mã, điểm thưởng.
- Dải cảnh báo: "Khách chưa có phiếu khám đã phát hành trong ±3 ngày quanh ngày hóa đơn. Chưa gắn phiếu khám — hóa đơn sẽ không tính hoa hồng."
- "Khách hàng đang còn nợ <số> đồng" + nút Thu nợ.
- Đầu hóa đơn: Ngày hóa đơn | Giờ vào/ra | Thu ngân. Nút "Sửa hóa đơn" bật "Chế độ sửa" (Hủy sửa ×), sửa được Ghi chú hóa đơn, Thu ngân, "Lưu thông tin hóa đơn".
- Bảng dòng: Sản phẩm & dịch vụ (tên, giá, "+ Giảm giá") | Số lượng (− / +) | Nhân viên (chip viết tắt, bấm mở hộp chọn) | Thành tiền; menu ⋯ từng dòng.
- Tổng: Thành tiền, Giảm giá dịch vụ, ô "Nhập mã ưu đãi" + Áp dụng (ghi chú "Không thể cộng dồn với giảm giá hoặc thanh toán hiện có"), Ưu đãi, Tổng tiền, Điểm thưởng, Đã thanh toán và lịch sử từng khoản (phương thức, số tiền, dòng đảo âm và nhãn "Đã sửa ngày").
- Nút cuối: Hủy | Hoa hồng ("phase sau") | Thêm phí | Thanh toán.

### 2.2 Cột phải: danh mục
- Tab: Dịch vụ | Sản phẩm | Thẻ dịch vụ. Tìm theo tên/mã. Sắp xếp: Tên A-Z, Giá thấp-cao, Giá cao-thấp, Mới nhất. Lọc theo nhóm dịch vụ.
- Thẻ hàng: tên, mã (DV + số, hoặc DVSH + số cho dịch vụ chuyển từ SalonHero), giá.

### 2.3 Hộp "Các đơn hàng chờ đang thanh toán"
Đầu: "N đơn · Đã thu: x / tổng". Tìm theo mã hóa đơn. Cột: Mã đơn | Khách hàng (tên + SĐT) | Giá trị | Trạng thái (Thanh toán một phần...) | Thời gian.

### 2.4 Hộp "Chọn nhân viên phục vụ" (bấm chip nhân viên của dòng)
Tên dòng; "Áp dụng lựa chọn cho toàn bộ đơn hàng"; danh sách đã chọn với vai Phục vụ (PV) / Tư vấn (TV); "Mức hoa hồng: Mặc định"; bảng Nhân viên | Trạng thái (Sẵn sàng...) | ô Phục vụ | ô Tư vấn; tìm nhân viên; Đóng / Lưu lựa chọn.

### 2.5 Hộp "Thanh toán"
- Đầu "Cần thanh toán: <số>"; nhắc phiếu khám; danh sách dòng.
- Hình thức: Tiền mặt, Quẹt thẻ, Chuyển khoản, Nhiều hình thức, Zalo Pay, Momo, Grab Pay, VN Pay, Samsung Pay, Shopee Pay, VinID, GotIt, Ship COD.
- Tiền khách đưa + gợi ý (số chẵn gần nhất), Trả lại khách.
- "Ngày thu tiền (nhập bù)": chọn đúng ngày giờ khách đã trả; mỗi lần thu là một khoản riêng; sổ quỹ, kế toán, hoa hồng ghi theo ngày này; không gửi tin cho khách.
- Ghi chú; "In hoá đơn sau khi thanh toán (mẫu song ngữ Việt – Anh)"; Huỷ / Thanh toán <số>.

## 3. Quy tắc nghiệp vụ thấy được
1. Đơn nhiều dòng; mỗi dòng nhiều nhân viên với vai Phục vụ / Tư vấn và mức hoa hồng.
2. Thu nhiều lần (thanh toán một phần), nợ còn lại theo khách; thu nợ ngay tại POS.
3. Sửa hóa đơn là chế độ riêng; sửa ngày thu tạo cặp dòng đảo + dòng mới (giữ vết), nhãn "Đã sửa ngày".
4. Thu tiền nhập bù theo ngày thực trả, ảnh hưởng sổ quỹ / hoa hồng theo ngày đó.
5. Hóa đơn không gắn phiếu khám đã phát hành (±3 ngày) thì không tính hoa hồng.
6. Mã ưu đãi không cộng dồn với giảm giá hoặc khi đã có thanh toán.
7. Điểm thưởng hiển thị trên đơn.

## 4. Điểm riêng nha khoa
- [NHA KHOA] 11 nhóm dịch vụ nha; giá theo vật liệu/hãng; gói giá trị lớn trả nhiều đợt; ràng buộc phiếu khám → hoa hồng.

## 5. Đề xuất cho AMIA
AMIA POS đã mạnh hơn ở nhiều điểm (nhiều đơn cùng lúc, voucher, đổi điểm, chia người hưởng theo %, người giới thiệu, thẻ tiền, ví điện tử, phụ phí và tip, in Việt/Anh, lùi ngày hóa đơn, mở lại hóa đơn để sửa có ghi đảo). Có thể thêm:
1. Thu tiền nhập bù cho từng khoản thu (ngày giờ thực trả khác ngày hóa đơn), có lọc "Thu tiền nhập bù" ở danh sách hóa đơn.
2. Nút "Thu nợ" ngay trên đơn khi khách còn nợ cũ.
3. Gợi ý tiền khách đưa (làm tròn) và "Trả lại khách".
4. (Tùy chọn) Ràng buộc "dịch vụ cần phiếu khám/tư vấn mới tính hoa hồng" nếu AMIA áp quy định tương tự.

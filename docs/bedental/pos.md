# POS / Bán hàng (BeDental ERP, mục `pos`)

Nguồn: chữ chụp từ bản demo. Danh sách dịch vụ dưới đây là danh mục giá niêm yết (không phải dữ liệu cá nhân) nhưng chỉ nêu mẫu. Không có tệp con; thanh toán, giảm giá, in hóa đơn chưa đọc được (popup/khung ngoài vùng chính).

## 1. Mục đích
Quầy thu ngân: tạo/chọn đơn hàng của một khách, thêm dịch vụ/sản phẩm/thẻ liệu trình, gán nhân viên thực hiện từng dòng, thu tiền. Chia đôi màn hình: trái là đơn đang làm, phải là danh mục để bấm thêm.

## 2. Màn hình con

### 2.1 Cột trái: đơn hàng
- Thanh trên: nhãn "Chờ thanh toán" kèm số đơn (9 đơn chờ) và "Chọn đơn hàng" (mở danh sách đơn để chọn).
- Khi chưa chọn: "Chưa có đơn hàng"; nút "Tạo đơn hàng mới" và "Tạo đơn hàng".
- Đầu hóa đơn: Ngày hóa đơn | Giờ vào/ra | Thu ngân.
- Bảng dòng hàng: SẢN PHẨM & DỊCH VỤ | SỐ LƯỢNG | NHÂN VIÊN | THÀNH TIỀN. Mỗi dòng có cột nhân viên thực hiện (phục vụ tính hoa hồng sau này).
- Tổng tiền, giảm giá, phương thức thanh toán, nút Thanh toán: chưa đọc được (không có trong chữ chụp vì chưa có đơn).

### 2.2 Cột phải: danh mục để thêm
- Ba tab: Dịch vụ | Sản phẩm | Thẻ dịch vụ.
- Sắp xếp: Tên A-Z | Giá thấp-cao | Giá cao-thấp | Mới nhất.
- Lọc theo nhóm: Tất cả + 10 nhóm (xem mục 4).
- Thẻ hàng: tên dịch vụ, mã (dịch vụ mới theo dạng `DV` + năm tháng + số thứ tự; dịch vụ nhập từ hệ thống cũ SalonHero theo dạng `DVSH` + số), giá niêm yết.
- Có khoảng 100 dịch vụ. Giá trải rộng từ 0 đ (nhổ răng sữa bôi tê) đến 150.000.000 đ (gói Invisalign Comprehensive). Có dòng "THU KHÁC" mã riêng 100.000 đ (khoản thu linh hoạt).
- Giá có số lẻ (vd chia lại từ gói) cho thấy dịch vụ tách từ gói cũ.

### 2.3 Danh sách đơn "Chờ thanh toán"
Chưa đọc được nội dung (chỉ có số 9). Suy ra: đơn mở nhưng chưa thu đủ, mỗi đơn có khách, giờ vào, thu ngân.

## 3. Quy tắc nghiệp vụ thấy được
1. Một đơn có nhiều dòng; mỗi dòng gán nhân viên riêng (hoa hồng/điểm xếp hạng nhân viên ở Dashboard dựa trên đây).
2. Đơn ở trạng thái chờ thanh toán có thể mở lại (9 đơn chờ) - thu nhiều lần (liên quan "nợ phát sinh" và "số hóa đơn còn nợ" trên Dashboard).
3. Có ghi giờ vào/ra của khách để tính thời gian phục vụ.
4. Có cả sản phẩm (bán lẻ), dịch vụ và thẻ dịch vụ (bán trước, dùng dần).
5. Dịch vụ cũ mang mã riêng để truy vết.
6. Có dịch vụ giá 0 đ (miễn phí để vẫn ghi nhận).
7. Chi nhánh theo tài khoản; sổ thanh toán là nguồn doanh thu (Dashboard ghi nguồn là sổ thanh toán theo đơn).

## 4. Điểm riêng nha khoa
- [NHA KHOA] 10 nhóm dịch vụ: Nha khoa dự phòng; Dịch vụ từ hệ thống cũ SalonHero; Nha khoa phục hồi; Chỉnh nha - Niềng răng; Nha khoa nha chu; Nha khoa thẩm mỹ; Cấy ghép Implant; Phục hình răng; Khám & Chẩn đoán; Phẫu thuật răng hàm mặt; Phục hình cố định (răng sứ, cầu răng).
- [NHA KHOA] Giá phân biệt theo vật liệu/hãng (răng sứ nhiều hãng, trụ Implant nhiều hãng), mức độ ca (nhẹ, trung bình, nặng; ca khó), loại tê, hàm trên/dưới. Không thấy chọn răng/vị trí ở màn này; có thể là bước trong hồ sơ điều trị.
- [NHA KHOA] Gói cao giá trị (Invisalign, niềng răng) cần trả góp theo đợt.
- Dịch vụ từ SalonHero cho thấy hệ thống này vốn chuyển từ phần mềm spa/salon sang nha khoa, nên cấu trúc POS chung.

## 5. Đề xuất cho AMIA
Làm theo thứ tự:
1. Đơn hàng: tạo từ lịch hẹn (khách đã check-in), danh sách "Chờ thanh toán", dòng hàng có số lượng và nhân viên thực hiện, tổng tiền.
2. Danh mục dịch vụ có nhóm, mã, giá, tìm/sắp xếp. Nhóm AMIA: Da liễu điều trị, Laser/công nghệ cao, Trẻ hóa, Chăm sóc da, Liệu trình, Sản phẩm, Thu khác.
3. Thu tiền: nhiều phương thức, thu từng phần, ghi công nợ, giờ vào/ra, thu ngân. Phát hành phiếu thu.
4. Thẻ liệu trình (mua gói N buổi, trừ dần theo buổi) và sản phẩm bán kèm, trừ kho.
5. Liên thông hoa hồng nhân viên: dòng nào gắn nhân viên nào.
6. Hoàn tiền/đảo phiếu bằng phê duyệt (xem noi-lam-viec.md).

Bỏ: nhóm dịch vụ theo chuyên khoa răng, mã dịch vụ hai kiểu (cũ/mới), dịch vụ giá lẻ do chia lại gói, nhãn "THU KHÁC" nên thay bằng khoản thu có loại rõ.

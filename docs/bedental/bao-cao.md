# BeDental ERP - Mục "Báo cáo" (đề bài cho AMIA OS)

Nguồn: chụp chữ demo BeDental. Mức đọc được: CHỈ trang tổng quan danh mục báo cáo (nhóm, tên báo cáo, nhãn trạng thái). Việc bấm vào từng báo cáo không mở ra màn đọc được (tệp `reports__*` chỉ lặp trang tổng quan). Vì vậy cột, bộ lọc, KPI của từng báo cáo là "chưa đọc được"; phần gợi ý cột đánh dấu (suy luận).

## 1. Mục đích
Một nơi gom toàn bộ báo cáo, chia 5 nhóm: Doanh thu, Khách hàng, Nhân viên, Kho & Mua hàng, Tài chính. (Mục Tài chính-Kế toán là nơi thao tác; báo cáo tài chính xem ở đây.)

## 2. Danh mục báo cáo (28 báo cáo, 5 nhóm)

| Nhóm | Báo cáo | Trạng thái |
|---|---|---|
| DOANH THU | Danh sách hóa đơn | có |
| | Doanh thu theo ngày | có |
| | Theo chi nhánh | có |
| | Theo khách hàng | có |
| | Theo nhân viên | có |
| | Theo thu ngân | có |
| | Theo sản phẩm / dịch vụ | có |
| KHÁCH HÀNG | Thống kê khách hàng | có |
| | Thống kê đặt lịch | có |
| | Khách hàng nợ | có |
| | Thống kê sử dụng dịch vụ | có |
| | Danh sách phiếu khám | có [NHA KHOA] |
| | Báo cáo thẻ dịch vụ / liệu trình | có |
| NHÂN VIÊN | Báo cáo hoa hồng nhân viên | có |
| | Báo cáo hoa hồng theo thực thu | có |
| | Báo cáo hoa hồng giới thiệu | có |
| | Bảng lương | Sắp có |
| | Báo cáo giờ làm nhân viên | có |
| | Đánh giá nhân viên | Sắp có |
| KHO & MUA HÀNG | Nhập xuất kho hàng | có |
| | Bán sản phẩm | có |
| | Báo cáo nhập kho | Sắp có |
| | Tồn theo lô hàng | Sắp có |
| | Chi phí dịch vụ | Sắp có |
| TÀI CHÍNH | Báo cáo sổ quỹ thu/chi | có |
| | Báo cáo hóa đơn đầu vào | Sắp có |
| | Báo cáo công nợ NCC | Sắp có |
| | Báo cáo quyết toán hoa hồng CTV | Đang hoàn thiện |

Nhãn "có" nghĩa là không kèm chữ "Sắp có"/"Đang hoàn thiện", tức coi như dùng được. Đếm 7 + 6 + 6 + 5 + 4 = 28; trong đó 7 báo cáo chưa xong.

## 3. Từng báo cáo: chưa đọc được nội dung
Không có tệp nào chụp được bảng/bộ lọc của báo cáo. Gợi ý (suy luận, đội dựng tự chốt) cho các báo cáo quan trọng:
- Doanh thu (các cách cắt): bộ lọc chung khoảng ngày + chi nhánh; KPI tổng doanh thu, số hóa đơn, trung bình/hóa đơn; bảng theo chiều cắt (ngày/chi nhánh/khách/nhân viên/thu ngân/sản phẩm-dịch vụ); xuất Excel.
- Khách hàng nợ: khách | tổng nợ | hạn | số ngày quá hạn (là nơi duy nhất xem phải thu vì mục Tài chính chưa có màn công nợ khách).
- Báo cáo thẻ dịch vụ / liệu trình: số buổi đã dùng / còn lại / hết hạn theo thẻ.
- Hoa hồng nhân viên: hai cách tính được tách thành hai báo cáo - theo doanh số và theo THỰC THU; thêm hoa hồng GIỚI THIỆU. Chưa đọc được công thức.
- Báo cáo sổ quỹ thu/chi: xem `tai-chinh-ke-toan.md` (sổ quỹ).

## 4. Quy tắc/nhận xét thấy được
1. Mọi báo cáo dựng từ dữ liệu giao dịch có sẵn (hóa đơn, thanh toán, kho); báo cáo tài chính tách khỏi màn thao tác.
2. Doanh thu nhìn được theo 6 chiều (ngày, chi nhánh, khách, nhân viên, thu ngân, sản phẩm/dịch vụ).
3. Hoa hồng tách "theo thực thu" khỏi "theo doanh số" - phản ánh nghiệp vụ hoa hồng chỉ tính khi khách đã trả tiền.
4. Nhiều báo cáo liên quan kho/tài chính còn "Sắp có" - hệ thống tham chiếu chưa hoàn chỉnh, đừng coi là chuẩn đầy đủ.

## 5. Điểm riêng nha khoa [NHA KHOA]
- [NHA KHOA] "Danh sách phiếu khám" (hồ sơ khám/bệnh án): AMIA tương đương là phiếu tư vấn/da liễu; chỉ giữ nếu có hồ sơ khám da liễu.
- [NHA KHOA] "Báo cáo thẻ dịch vụ / liệu trình" vốn dùng cho điều trị dài (niềng, implant); với AMIA lại rất hợp (gói liệu trình spa).

## 6. Đề xuất cho AMIA
Làm theo thứ tự:
1. Doanh thu: danh sách hóa đơn, theo ngày, theo chi nhánh, theo sản phẩm/dịch vụ, theo nhân viên/thu ngân (dùng chung một bộ lọc khoảng ngày + chi nhánh, xuất Excel).
2. Báo cáo sổ quỹ thu/chi (cùng nguồn với Sổ quỹ).
3. Khách hàng nợ + báo cáo thẻ dịch vụ/liệu trình (số buổi còn lại, sắp hết hạn) - quan trọng với spa.
4. Thống kê khách hàng (mới/quay lại), thống kê đặt lịch (tỷ lệ no-show, hủy), thống kê sử dụng dịch vụ.
5. Hoa hồng nhân viên theo thực thu + hoa hồng giới thiệu (nếu có CTV).
6. Nhập xuất kho, bán sản phẩm.
Để sau/bỏ: Bảng lương, đánh giá nhân viên, giờ làm (thuộc Nhân sự); báo cáo nhập kho, tồn theo lô, chi phí dịch vụ (làm khi kho có lô/định mức); hóa đơn đầu vào, công nợ NCC, quyết toán CTV (chờ phần Tài chính); phiếu khám [NHA KHOA]: bỏ hoặc thay bằng báo cáo hồ sơ da liễu.

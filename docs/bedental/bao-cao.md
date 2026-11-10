# BeDental ERP - Mục "Báo cáo" (đề bài cho AMIA OS)

Nguồn: đọc trực tiếp bản demo (mở từng báo cáo, chỉ xem) và mã giao diện. Không chép tên người, SĐT, mã khách.

Cập nhật 10/11/2026: 27/10 chỉ đọc được danh mục; nay đã mở và đọc được bộ lọc, KPI, cột của 20/21 báo cáo "có" (riêng "Báo cáo hoa hồng giới thiệu" thực chất mở khu Giới thiệu & CTV - xem marketing.md). Danh mục vẫn 28 báo cáo / 5 nhóm, trạng thái không đổi. Mới thấy: trong mỗi báo cáo có ô chọn để nhảy sang báo cáo khác, "Xuất nhanh Excel" và "Xuất Excel", chu kỳ Ngày/Tuần/Tháng/Quý; báo cáo Khách hàng nợ có tuổi nợ 4 nhóm và thu nợ hàng loạt; Thống kê đặt lịch có khung giờ cao điểm; Bán sản phẩm có lãi gộp.

## 1. Mục đích
Một nơi gom toàn bộ báo cáo, 5 nhóm: Doanh thu, Khách hàng, Nhân viên, Kho & Mua hàng, Tài chính. Bấm một báo cáo mở màn riêng (nút "Báo cáo" / "Quay lại" để về danh mục). Mọi báo cáo có chọn khoảng ngày (mặc định Hôm nay) và chi nhánh.

## 2. Danh mục (28 báo cáo) và nội dung từng báo cáo

| Nhóm | Báo cáo | TT | Nội dung đọc được |
|---|---|---|---|
| DOANH THU | Danh sách hóa đơn | có | Nút Tạo hóa đơn, Xóa bộ lọc, Tìm kiếm, Xuất Excel. Lọc: chi nhánh, mã HĐ (tìm chính xác/tương đối), khách (tên/email/ĐT), người lập, nhân viên phục vụ, tình trạng trả tiền (Chưa thanh toán/Thanh toán đủ/Còn nợ), tình trạng nợ, HĐ VAT (chưa hỗ trợ), tổng tiền (=, >, >=, <, <=), sử dụng thẻ (thẻ tiền/thẻ lần/không), phí dịch vụ, tiền tip, voucher, thu tiền nhập bù, hình thức trả tiền (~15), ghi chú. KPI: Hoàn thành (số đơn, tiền), Còn nợ, Đang xử lý, Bị hủy. Tab Tất cả/Hoàn thành/Đang xử lý/Bị hủy. Cột: Mã HĐ, Khách hàng, Ngày hóa đơn, Người lập, Số tiền, Còn nợ, Trạng thái, HĐ VAT. Hiển thị 10/20/50/100. |
| | Doanh thu theo ngày | có | Chu kỳ Ngày/Tuần/Tháng/Quý. KPI: Tổng tiền đã thu (bán mới, thu nợ), tổng số đơn; thu theo Tiền mặt / Quẹt thẻ / Chuyển khoản / Ví điện tử / Khác (mỗi loại tách bán mới - thu nợ); Tình trạng nợ (nợ mới chưa thu, thu nợ đơn trong kỳ, ngoài kỳ); Trừ thẻ tiền; Trừ voucher (số lượng); Tổng tip; Tổng thuế VAT; Tổng khoản chi. Bảng: Thời gian, Số đơn mới, Tổng giá trị đơn mới, Thu đơn mới, Thu nợ cũ, Tổng thực thu, Nợ mới, Trừ thẻ tiền. |
| | Theo chi nhánh | có | KPI: Tổng doanh thu, Nợ phải thu, Thu tiền mặt (bán/thu nợ), Quẹt thẻ & chuyển khoản. Biểu đồ theo chi nhánh. Bảng: Chi nhánh, Số nhân viên, Số đơn, Đã thu, Còn nợ, Doanh thu. |
| | Theo khách hàng | có | Lọc hạng KH, nhóm KH, chi nhánh, tìm. KPI: Hóa đơn, Tiền đã nhận, Thu nợ cũ, Doanh số TB/khách, Khách mới (số, doanh số), Khách quay lại (số, doanh số). Top 10. Bảng: Khách hàng, Loại khách, Số đơn, Doanh thu hóa đơn, Tổng thực thu, Thu nợ cũ, Nợ mới. |
| | Theo nhân viên | có | Ghi chú: doanh số theo vai trò đóng góp, một đơn ghi nhiều vai nên tổng có thể lớn hơn doanh thu kế toán; không dùng thay bảng lương. KPI: số NV, DS dịch vụ, sản phẩm, bán thẻ, tư vấn. Biểu đồ chồng 4 loại. Bảng: Nhân viên, Số lần phục vụ, DS dịch vụ, SP đã bán, DS sản phẩm, Số thẻ đã bán, DS bán thẻ, Số lần tư vấn, DS tư vấn, Tổng doanh số. |
| | Theo thu ngân | có | Ghi chú: theo người lập đơn, "Đã thu" không nhất thiết do chính người đó thu. KPI + bảng: Thu ngân, Số đơn mới, Tổng tiền đơn mới, Còn nợ, Đã thu. |
| | Theo sản phẩm / dịch vụ | có | KPI: Tổng DT, Trừ thẻ tiền, Tổng thực nhận, DT dịch vụ, DT sản phẩm, DT bán thẻ. Top 10. Tab Tất cả/Dịch vụ/Sản phẩm/Bán thẻ/Dùng thẻ. Bảng: Tên, Số lượng, Trước giảm giá, Sau giảm giá, Trừ thẻ tiền, Thực nhận (không tính giảm giá hóa đơn và thuế). |
| KHÁCH HÀNG | Thống kê khách hàng | có | KPI tổng khách, khách mới trong kỳ; biểu đồ ngày: khách phát sinh / mới / quay lại / lẻ; theo tỉnh; giới tính; phân nhóm (1 khách nhiều nhóm); xếp hạng. |
| | Thống kê đặt lịch | có | Lọc chi nhánh, người tạo. KPI tổng khách, tổng đặt lịch (khách distinct). Biểu đồ: theo nguồn, theo trạng thái, theo khung giờ trong ngày. |
| | Khách hàng nợ | có | "Công nợ hiện tại tại thời điểm truy vấn". KPI: Tổng công nợ, Số khách còn nợ, Số HĐ còn nợ, Nợ > 30 ngày, Nợ > 90 ngày, Khoản nợ lâu nhất. Lọc: tìm, chi nhánh phát sinh, tuổi nợ (<30, 31–60, 61–90, >90), sắp xếp (lâu nhất / nhiều nhất), nợ từ–đến, có/chưa thu nợ gần đây. Cột: Khách, ĐT, Chi nhánh phát sinh, Số HĐ, Tổng HĐ, Còn nợ, Nợ cũ nhất, Tuổi nợ, Thu nợ gần nhất; nút Xem chi tiết, Thu nợ. |
| | Thống kê sử dụng dịch vụ | có | Lọc dịch vụ/sản phẩm, tìm mã/tên. Bảng: Mã, Phân loại, Tên, Số lượng; tổng item, SL, số khách, tiền. |
| | Danh sách phiếu khám | có [NHA KHOA] | Lọc: chi nhánh, mã phiếu, khách, bác sĩ, gắn hóa đơn (đã/chưa), đơn thuốc (có/không), chẩn đoán; mặc định Tháng này. KPI: Đã phát hành, Đã gắn HĐ, Phát hành chưa gắn HĐ, Có đơn thuốc, Nháp/Hết hạn. Tab Tất cả/Đã phát hành/Nháp/Hết hạn. Cột: Mã phiếu, Khách, Ngày khám, Bác sĩ, Chi nhánh, Chẩn đoán, Hóa đơn (mã đơn thuốc/HĐ), Trạng thái. |
| | Báo cáo thẻ dịch vụ / liệu trình | có | "Danh sách khách hàng dùng thẻ"; nút Cấp thẻ mới, Các loại thẻ, Xuất Excel. Lọc: mã/tên thẻ, khách, chi nhánh, ngày cấp, loại (Thẻ lần/Thẻ tiền), tình trạng (Sử dụng, Hết hạn sau 1 tháng, sau 1 tuần, Hết hạn, Hoàn thành, Thu hồi, Khóa). KPI: số khách dùng thẻ, tổng giá trị trong thẻ tiền, trong thẻ lần (giá trị thẻ ≠ tiền thu). |
| NHÂN VIÊN | Báo cáo hoa hồng nhân viên | có | Nút Tính lại hoa hồng, Xuất Excel; KPI "Hóa đơn chưa gắn phiếu khám", Tổng hoa hồng. Cột: Nhân viên, Chấm điểm d.vụ, DS/HH tư vấn, DS/HH dịch vụ, DS/HH sản phẩm, DS/HH bán thẻ, Tổng hoa hồng. |
| | Báo cáo hoa hồng theo thực thu | có | Chọn nhân viên; ghi chú "mục tiêu đã chốt và số dư phải thu không đồng nghĩa duyệt lương / chi tiền". Cột: Kỳ, Kỳ gốc, Vai trò, DS hóa đơn, Thực thu cá nhân sau chia, Thực thu chi nhánh, Dự kiến bất biến khi xuất HĐ, Entitlement hiện tại, Provisional đã cấp vốn, Mục tiêu đã chốt, Delta chốt, Adjusted, Hoàn/thu hồi, Phát sinh kỳ, Số dư phải thu, Trạng thái, Source. |
| | Báo cáo hoa hồng giới thiệu | có | Mở thẳng khu "Hoa hồng người giới thiệu" của Marketing (xem marketing.md). |
| | Bảng lương | Sắp có | |
| | Báo cáo giờ làm nhân viên | có | Tab Bảng chấm công / Lịch làm việc nhân viên. Cột: Mã NV, NV, Chi nhánh, Số ca được phân, Đủ công, Nửa công, Không công, Đi muộn, Về sớm, Thiếu chấm, Nghỉ/Lễ, Tổng công; chi tiết: Ngày, Ca, Giờ vào, Giờ ra, Muộn (phút), Về sớm (phút), Vi phạm, Công. |
| | Đánh giá nhân viên | Sắp có | |
| KHO & MUA HÀNG | Nhập xuất kho hàng | có | Tab Tổng quan / Chi tiết (sổ kho). Lọc chi nhánh, kho, nhóm SP, tìm SP/SKU/mã vạch/lô. KPI: tồn đầu, tồn cuối, tổng nhập, tổng xuất, dòng lệch tồn. Cột: SP, SKU, Giá bán, Giá vốn CB, Giá nhập BQ, Tồn đầu, Tổng nhập, Tổng xuất, Nhập CK, Xuất CK, Bán ra, Tồn cuối, Đối chiếu (Khớp/Lệch). |
| | Bán sản phẩm | có | Tab Tổng quan / Chi tiết. KPI: Tổng DT, Tổng giá vốn (ước tính), Lợi nhuận gộp, Biên LN %, LN gộp (đã có giá vốn), Thiếu giá vốn. Cột: SP, SKU, SL bán, Số đơn, DT, Giá vốn, Lợi nhuận, Biên LN %, Nguồn giá vốn. |
| | Báo cáo nhập kho | Sắp có | |
| | Tồn theo lô hàng | Sắp có | |
| | Chi phí dịch vụ | Sắp có | |
| TÀI CHÍNH | Báo cáo sổ quỹ thu/chi | có | Lọc chi nhánh, khoảng ngày, Đặt lại, Xuất Excel. KPI: Số dư đầu, Tổng thu, Tổng chi, Thu - Chi, Số dư cuối. Cột: Ngày, Mã, Loại, Quỹ, Đối tượng, Diễn giải, PT, Thu, Chi, Số dư. |
| | Báo cáo hóa đơn đầu vào | Sắp có | |
| | Báo cáo công nợ NCC | Sắp có | |
| | Báo cáo quyết toán hoa hồng CTV | Đang hoàn thiện | |

Đếm 7 + 6 + 6 + 5 + 4 = 28; 7 chưa xong (6 Sắp có, 1 Đang hoàn thiện).

## 3. Quy tắc / nhận xét
1. Báo cáo dựng từ sổ hóa đơn, sổ thanh toán, sổ thẻ, sổ kho; luôn tách "bán mới" và "thu nợ", "doanh thu" và "thực thu".
2. Doanh số nhân viên theo vai (phục vụ, tư vấn, bán sản phẩm, bán thẻ), có cảnh báo không dùng thay bảng lương.
3. Hoa hồng có 2 cách tính tách biệt (doanh số và thực thu) + hoa hồng giới thiệu; nút "Tính lại hoa hồng".
4. Công nợ khách theo tuổi nợ và thu nợ ngay từ báo cáo.
5. Mỗi báo cáo có Xuất Excel; một số có "Xuất nhanh Excel" (theo trang đang xem).

## 4. Điểm riêng nha khoa [NHA KHOA]
- Danh sách phiếu khám, "Hóa đơn chưa gắn phiếu khám" trong hoa hồng.

## 5. Đề xuất cho AMIA
AMIA /bao-cao đã có 23 tab phủ gần đủ (doanh thu ngày/chi nhánh/khách/thu ngân/nhân viên/dịch vụ-sản phẩm, dùng dịch vụ, hiệu quả voucher, lịch sử dùng thẻ, đặt lịch, khách còn nợ, thẻ còn dư, hoa hồng thực thu, hoa hồng giới thiệu, đánh giá NV, tỉ lệ chốt tư vấn, nhập xuất kho, nhập kho, xuất kho bởi NV, SP đã bán, tồn theo lô, chi phí dịch vụ). Còn nên bổ sung:
1. Khách hàng nợ: tuổi nợ 4 nhóm + KPI nợ > 30 / > 90 ngày, khoản nợ lâu nhất, lọc "có / chưa thu nợ gần đây" ngay trong tab "Khách còn nợ" (AMIA có tuổi nợ ở Tài chính > Công nợ khách - nên dùng chung).
2. Thống kê đặt lịch: thêm lọc theo người tạo (khung giờ AMIA đã có).
3. Theo khách hàng: tách khách mới / quay lại (số khách, doanh số) và doanh số TB/khách.
4. Chu kỳ Ngày/Tuần/Tháng/Quý cho Doanh thu theo ngày.
5. Bán sản phẩm: cờ "thiếu giá vốn" + nguồn giá vốn (giá vốn, lợi nhuận, % AMIA đã có).
6. Danh sách phiếu khám (khi AMIA có phiếu khám da liễu).

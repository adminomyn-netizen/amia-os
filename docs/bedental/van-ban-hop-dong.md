# BeDental ERP - Mục "Văn bản & Hợp đồng" (đề bài cho AMIA OS)

Nguồn: chụp chữ demo BeDental. Đã đọc được màn danh sách (trang 1/2: 20 trong 34 hồ sơ). Không thấy màn "Tạo hồ sơ" và "Xem nhanh" (chưa đọc được). Không chép tên người, số điện thoại, số hợp đồng; chỉ ghi cấu trúc.

## 1. Mục đích
Tiêu đề: "Quản trị doanh nghiệp". Quản lý xuyên suốt vòng đời văn bản/hợp đồng: dự thảo -> ký -> hiệu lực -> nghiệm thu -> hết hạn.

## 2. Màn hình: Danh sách hồ sơ
- Nút đầu trang: "Tạo hồ sơ" (chưa đọc được form).
- Thẻ KPI (4): Tổng hồ sơ (34) | Sắp hết hiệu lực (1) | Hết hiệu lực (11) | Công khai trên Wiki (0).
- Tab phân loại: Tất cả | Văn bản đến | Văn bản đi | Hợp đồng | Đối tác (tab "Đối tác" chưa đọc được nội dung).
- Bộ lọc:
  - Loại văn bản: Biên bản, Công văn, Giấy ủy quyền, Hợp đồng, Kế hoạch, Phụ lục, Quy định, Quyết định, Thông báo, Tờ trình, Đề xuất (11 loại).
  - Trạng thái: Còn hiệu lực | Sắp hết hiệu lực (<= 90 ngày) | Hết hiệu lực.
  - Chi nhánh: "Tất cả chi nhánh được xem" + từng chi nhánh (phân quyền xem theo chi nhánh).
  - Hiệu lực từ ngày / Đến ngày; ô Tìm kiếm.
- Bảng cột: Tên văn bản / Số | Đối tác | Hiệu lực (từ -> đến hoặc "không thời hạn") | Giá trị (VND hoặc "-") | Phạm vi (Toàn công ty / Trụ sở chính / theo chi nhánh) | Trạng thái | thao tác "Xem nhanh".
- Dòng bảng: dòng 1 là tên văn bản (in hoa), dòng 2 là "Loại · Số: <số hiệu>". Phân trang "1-20 / 34 hồ sơ" với Trước/Sau.

## 3. Quy tắc nghiệp vụ thấy được
1. Trạng thái hiệu lực TỰ TÍNH từ ngày hiệu lực: không thời hạn = còn hiệu lực; ngày đến đã qua = Hết hiệu lực; còn <= 90 ngày = Sắp hết hiệu lực.
2. Mỗi hồ sơ có: loại, số hiệu, đối tác, hiệu lực, giá trị (tùy chọn), phạm vi (toàn công ty / cơ sở).
3. Có cờ "công khai trên Wiki" (đẩy văn bản quy định/nội quy ra wiki nội bộ).
4. Quyền xem theo chi nhánh.
5. Một số hợp đồng có ngày bắt đầu = ngày kết thúc (hợp đồng mua bán một lần) và được tính "Hết hiệu lực" - quy tắc này đáng nghi, đội dựng nên phân biệt hợp đồng mua bán một lần (đã hoàn tất) với hợp đồng định kỳ.
6. Chưa thấy luồng ký/duyệt/nghiệm thu dù mô tả nêu vòng đời; chưa đọc được trạng thái dự thảo/chờ ký.

## 4. Nhóm nội dung hồ sơ thấy trong demo (chỉ cấu trúc)
Thuê/mượn trụ sở; hồ sơ phòng cháy chữa cháy; dịch vụ marketing/giới thiệu khách; quảng cáo báo chí; hợp tác voucher/quà tặng; hợp tác chuyên môn với bác sĩ; thu gom xử lý chất thải y tế nguy hại (có hạn 1 năm); lắp hệ thống xử lý nước thải; bổ nhiệm kế toán trưởng; mua bán thiết bị (ghế, máy laser, implant, sứ); bảo lãnh viện phí / thanh toán trực tiếp chi phí y tế với hãng bảo hiểm; bảo trì thang máy; dịch vụ POS. Giá trị hợp đồng từ vài triệu đến hàng trăm triệu đồng.

## 5. Điểm riêng nha khoa [NHA KHOA]
- [NHA KHOA] Hợp đồng xử lý chất thải y tế nguy hại, hệ thống xử lý nước thải, hồ sơ PCCC: yêu cầu pháp lý phòng khám; cần nhắc gia hạn.
- [NHA KHOA] Hợp đồng bảo lãnh viện phí/thanh toán trực tiếp với bảo hiểm, hợp tác chuyên môn bác sĩ, mua implant/sứ/ghế nha.

## 6. Đề xuất cho AMIA
Làm theo thứ tự:
1. Kho hồ sơ: bảng + loại văn bản + đối tác + hiệu lực + giá trị + phạm vi chi nhánh + tệp đính kèm.
2. Trạng thái hiệu lực tự tính và cảnh báo sắp hết hạn (<= 90 ngày; nên thêm mốc 30 ngày) qua thông báo/Zalo cho người phụ trách.
3. Bộ lọc/tìm kiếm như demo + thẻ KPI.
4. Gắn loại hồ sơ đặc thù spa/da liễu: giấy phép hoạt động, giấy phép quảng cáo, hợp đồng thuê mặt bằng, hợp đồng bác sĩ cộng tác, hợp đồng bảo trì máy (laser...), hợp đồng KOL/quảng cáo. Nhắc hạn là giá trị lớn nhất.
5. Cờ "công khai wiki" cho quy định nội bộ - làm sau.
Bỏ/để sau: tab "Đối tác" riêng (dùng chung danh bạ NCC/đối tác); quy trình ký/duyệt điện tử (demo cũng chưa thấy); các hợp đồng nha khoa (bảo lãnh viện phí...): bỏ.

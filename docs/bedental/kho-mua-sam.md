# BeDental ERP - Mục "Kho & Mua sắm" (đề bài cho AMIA OS)

Nguồn: chụp chữ demo BeDental (nha khoa). Mức đọc được: trang tổng quan, trang Hướng dẫn (rất đầy đủ), và khung/bảng của từng màn con. Bản chụp bổ sung (11 tệp inventory_ops theo từng tab) KHÔNG đổi được tab: cả 11 tệp đều chụp đúng một màn là bảng Tồn kho (các tab Tổng quan, Kho hàng, Nhập kho, Ledger, Nhà cung cấp, Mua hàng, Công nợ NCC, Điều chuyển, Điều chỉnh, Kiểm kê, Hướng dẫn vẫn phải dựa vào nguồn đọc trước, không đọc thêm được ở lần này). Dữ liệu trong demo gần như trống (chưa có PR, kiểm kê, chuyển kho, điều chỉnh, công nợ). Tên người/số điện thoại không chép; nhà cung cấp chỉ ghi dạng loại.

## 1. Mục đích
Quản lý kho, nhập hàng, mua hàng, điều chuyển, điều chỉnh và kiểm kê. Phục vụ nhân viên bán hàng, kho, kế toán, quản lý với cùng một bộ thuật ngữ.

## 2. Bản đồ màn hình (12 thẻ, thanh tab ngang cùng thứ tự)
Nhóm KHO & TỒN KHO: Tổng quan tồn kho · Kho hàng · Tồn kho · Ledger kho.
Nhóm NHẬP & MUA HÀNG: Nhập kho (QR/Barcode) · Nhà cung cấp · Mua hàng (PR/PO) · Công nợ NCC.
Nhóm ĐIỀU CHỈNH & KIỂM SOÁT: Điều chuyển kho · Điều chỉnh tồn · Kiểm kê kho.
Nhóm HƯỚNG DẪN: Hướng dẫn Kho & Mua sắm.
Tất cả đều nhãn "Sẵn sàng". Thanh tab con: Tổng quan tồn kho | Kho hàng | Nhập kho | Tồn kho | Ledger | Nhà cung cấp | Mua hàng | Công nợ NCC | Điều chuyển kho | Điều chỉnh tồn | Kiểm kê kho | Hướng dẫn.

## 3. Từng màn hình con

### 3.1 Tổng quan tồn kho - chưa đọc được riêng (chỉ thấy mô tả "Tổng quan kho, tồn và cảnh báo"). Suy luận: KPI tổng giá trị tồn, số mặt hàng dưới định mức, cảnh báo hết hạn. Lưu ý: chưa phân biệt được khối KPI 3 ô ở 3.3 thuộc tab Tổng quan hay tab Tồn kho vì mọi lần chụp đều ra cùng một màn.
### 3.2 Kho hàng - chưa đọc được. Mô tả: "Danh mục kho và thiết lập". Loại kho xem mục 4. Biết thêm: demo có 2 kho đang hoạt động (KPI "Số kho hoạt động").
### 3.3 Tồn kho - ĐỌC ĐƯỢC khung (demo chưa có tồn)
- Thanh tab ngang cố định phía trên (thứ tự): Tổng quan tồn kho | Kho hàng | Nhập kho | Tồn kho | Ledger | Nhà cung cấp | Mua hàng | Công nợ NCC | Điều chuyển kho | Điều chỉnh tồn | Kiểm kê kho | Hướng dẫn.
- 3 KPI: Số kho hoạt động | Dòng tồn (SP x kho) (số cặp sản phẩm - kho đang có tồn) | Giá trị tồn (avg cost) (giá trị theo giá vốn bình quân).
- Bảng: Sản phẩm | SKU | Kho | Tồn | Giá trị. Tồn kho theo CẶP (sản phẩm, kho): cùng một sản phẩm ở hai kho là hai dòng.
- Rỗng hiện: "Chưa có tồn kho. Hãy tạo phiếu nhập kho." (tồn chỉ sinh ra từ phiếu nhập đã ghi sổ, không nhập tay số tồn).
- Bộ lọc kho / tìm sản phẩm / cảnh báo tồn tối thiểu: chưa thấy trên màn (chưa đọc được). Thuật ngữ đi kèm: tồn thực tế, tồn giữ chỗ, tồn khả dụng (mục 5) - bảng chụp chỉ có một cột "Tồn", chưa tách ba loại.
### 3.4 Ledger kho - chưa đọc được bảng (mô tả: sổ cái biến động nhập/xuất kho, bất biến).

### 3.5 Nhập kho (QR/Barcode)
- Nút: "Tạo phiếu nhập". Mô tả: phiếu nhập, quét QR/Barcode, ghi sổ.
- Bảng: Mã phiếu | Kho | NCC | Trạng thái | Ngày tạo.
- Quy ước mã: phiếu mới dạng `NK` + 2 số năm + 1 chữ cái + số thứ tự (ví dụ NK26A004); phiếu cũ dạng `GR-` + 6 số. Có dòng thấy được với trạng thái "Nháp" (nhiều dòng, cùng kho nội bộ chi nhánh) và "Đã hủy". Cột NCC để trống ("-") khi nhập thủ công không qua PO.
- Luồng: Nháp -> (post/ghi sổ) -> tăng tồn + ghi ledger; có thể Hủy. GR có thể tạo từ PO hoặc nhập tay.

### 3.6 Nhà cung cấp
- Nút: "Thêm NCC"; mỗi dòng có "Sửa".
- Bảng: Mã (NCC-000x) | Tên | SĐT | MST | Công nợ | thao tác.
- Demo có 8 NCC: các công ty vật tư nha khoa, thiết bị, implant, dược phẩm, 1 dòng "Đối tác khác" làm NCC mặc định/dự phòng. SĐT và MST để trống; công nợ 0 đ.

### 3.7 Mua hàng (PR / PO)
- Hai sub-tab: "Yêu cầu mua (PR)" và "Đơn mua hàng (PO)". Nút "Tạo yêu cầu mua".
- Bảng PR: Mã | Ưu tiên | Trạng thái | Ngày tạo | Thao tác (demo: chưa có).
- Bảng PO: chưa đọc được (cần mở sub-tab). Theo Hướng dẫn, PO có: số lượng đặt, giá mua, VAT, chiết khấu, ngày dự kiến nhận.

### 3.8 Công nợ NCC
- KPI: Tổng công nợ NCC (đ) | Số NCC còn nợ.
- Nút: "Tạo hóa đơn từ PO".
- Bảng hóa đơn NCC: Mã HĐ | NCC | Tổng | Đã trả | Còn nợ | Trạng thái | Thao tác (thanh toán).
- Bảng "Tuổi nợ": Mã HĐ | NCC | Còn nợ | Hạn | Quá hạn (ngày) | Nhóm (nhóm tuổi nợ).
- Quy tắc: NCC phát sinh công nợ khi hóa đơn đầu vào đã POST (ghi sổ).

### 3.9 Điều chuyển kho
- Nút "Tạo phiếu chuyển kho". Bảng: Mã phiếu | Kho nguồn | Kho đích | Trạng thái | Ngày tạo. Có kho "trung chuyển" (transit) để tách hàng đã rời kho gửi nhưng chưa nhập kho nhận. (Demo: chưa có phiếu.)

### 3.10 Điều chỉnh tồn
- Nút "Tạo phiếu điều chỉnh". Bảng: Mã | Kho | Loại | Trạng thái | Ngày tạo. Loại điều chỉnh theo mô tả thẻ: tăng / giảm / đặt lại số lượng. Chưa có phiếu.

### 3.11 Kiểm kê kho
- Nút "Tạo phiếu kiểm kê". Bảng: Mã | Kho | Loại | Trạng thái | Ngày tạo. Mục đích: kiểm kê và soát lệch tồn. Chưa có phiếu. Chưa đọc được các loại và trạng thái cụ thể.

### 3.12 Hướng dẫn & thuật ngữ - đọc được đầy đủ (mục 4-6).

## 4. Loại kho (6 loại)
| Mã | Tên | Dùng cho | Ảnh hưởng |
|---|---|---|---|
| retail | Kho hàng bán | Mỹ phẩm, sản phẩm chăm sóc bán qua POS | Bán thì giảm tồn, ra doanh thu, giá vốn, lợi nhuận sản phẩm |
| internal | Kho nội bộ | Vật tư tiêu hao dùng cho dịch vụ | Không bán; dùng cho dịch vụ thì giảm tồn và tạo chi phí dịch vụ |
| quarantine | Kho chờ kiểm | Hàng mới nhận / nghi vấn, chờ QC | Đạt QC mới chuyển kho dùng được; lỗi thì chuyển kho hỏng hoặc trả NCC |
| damaged | Kho hỏng/hủy | Hàng lỗi, hết hạn, chờ hủy | Không bán/dùng; kiểm soát thất thoát và biên bản hủy |
| return_supplier | Kho trả NCC | Hàng sai/thừa/không đạt chờ trả | Xuất trả giảm công nợ/đối soát |
| transit | Kho trung chuyển | Hàng đang đi đường giữa hai kho/chi nhánh | Tách đã xuất - chưa nhận |
Mỗi chi nhánh có kho riêng (ví dụ "Kho nội bộ - <chi nhánh>").

## 5. Thuật ngữ & quy tắc tồn
- Tồn thực tế; tồn giữ chỗ (đã giữ cho đơn/lịch/phiếu chưa xuất); TỒN KHẢ DỤNG = thực tế - giữ chỗ.
- Lô hàng: mã lô, NSX, hạn dùng, giá vốn riêng. Serial: mã từng đơn vị (thiết bị, truy xuất).
- Giá vốn BÌNH QUÂN gia quyền, tính lại sau mỗi lần nhập: tổng giá trị tồn / tổng số lượng tồn.
- Xuất kho: FEFO (hết hạn trước xuất trước) ưu tiên cho hàng có hạn; FIFO cho còn lại.
- Ledger kho bất biến: không sửa/xóa; sai thì tạo dòng đảo hoặc điều chỉnh để giữ lịch sử kiểm toán.
- Chứng từ: PR (yêu cầu mua, nhu cầu nội bộ, CHƯA gửi NCC) -> PO (đơn mua chính thức gửi NCC, sau khi PR được duyệt hoặc mua trực tiếp) -> GR (phiếu nhập kho; post thì tăng tồn + ghi ledger) -> hóa đơn NCC (post thì sinh công nợ phải trả) -> thanh toán NCC.

## 6. Luồng chính (ví dụ từ Hướng dẫn)
- Bán lẻ: nhập 100 chai, bán 2 tại POS -> tồn 98 + doanh thu sản phẩm.
- Dịch vụ: nhập 500 đôi găng, dùng 2 -> tồn 498 + chi phí vật tư dịch vụ (định mức tiêu hao theo dịch vụ).
- PR -> PO -> GR: chi nhánh tạo PR -> QUẢN LÝ duyệt và tạo PO gửi NCC -> hàng về, tạo GR -> tăng tồn + ledger.
Người duyệt: theo ví dụ là "quản lý"; chưa thấy ma trận hạn mức duyệt hay danh sách trạng thái PR/PO chi tiết (chưa đọc được).

## 7. Điểm riêng nha khoa [NHA KHOA]
- [NHA KHOA] Vật tư ví dụ: găng tay, bông gạc, thuốc tê, gel, vật tư nha khoa; NCC gồm implant, thiết bị, dược.
- [NHA KHOA] Thuộc tính serial cho thiết bị/implant để truy xuất theo bệnh nhân (suy luận từ mô tả serial).
- [NHA KHOA] Kho hàng bán nhỏ (bàn chải, dầu gội, chăm sóc sau điều trị) - nhỏ so với kho vật tư nội bộ.

## 8. Đề xuất cho AMIA
Làm theo thứ tự:
1. Danh mục kho (3 loại đủ dùng ban đầu: bán lẻ, nội bộ/vật tư, hỏng/hủy) theo chi nhánh + Nhà cung cấp.
2. Tồn kho theo cặp (sản phẩm, kho) với 3 KPI đầu mục (số kho hoạt động, số dòng tồn, giá trị tồn theo giá vốn bình quân), cột Sản phẩm / SKU / Kho / Tồn / Giá trị, tách tồn thực tế - giữ chỗ - khả dụng + Ledger kho BẤT BIẾN (làm nền cho mọi thứ sau). Tồn chỉ sinh từ phiếu nhập, không cho sửa số tay.
3. Phiếu nhập kho (nháp -> ghi sổ -> hủy), giá vốn bình quân; lô + hạn dùng (FEFO) vì mỹ phẩm/mesotherapy/filler có hạn.
4. Trừ kho tự động: bán sản phẩm ở POS và trừ vật tư theo định mức khi hoàn tất buổi dịch vụ spa/da liễu.
5. Điều chỉnh tồn và kiểm kê (phiếu kiểm -> lệch -> điều chỉnh có lý do), mọi thay đổi đi qua ledger.
6. PR -> PO -> GR với một cấp duyệt (quản lý), rồi Công nợ NCC (hóa đơn từ PO, thanh toán, tuổi nợ).
Làm sau/bỏ: kho trung chuyển và điều chuyển nhiều kho (chỉ làm khi mở chi nhánh thứ hai); kho chờ kiểm (QC) và kho trả NCC (gộp vào "hỏng/hủy" lúc đầu); serial (chỉ cho thiết bị cao cấp); quét QR/Barcode (làm sau, nhập tay trước); vật tư implant [NHA KHOA]: bỏ. Cần trang Hướng dẫn thuật ngữ tiếng Việt như BeDental vì rất hữu ích cho nhân viên.

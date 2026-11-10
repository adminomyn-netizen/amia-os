# BeDental ERP - Mục "Kho & Mua sắm" (đề bài cho AMIA OS)

Nguồn: demo BeDental (nha khoa), đọc trực tiếp giao diện + mã giao diện (bundle `InventoryPage`) ngày 10/11/2026; bản 27/10 đọc từ ảnh chụp chữ (khi đó 11 tab không đổi được, chỉ thấy bảng Tồn kho). Tên người / SĐT / tên nhà cung cấp không chép; chỉ ghi cấu trúc. [NHA KHOA] = điểm riêng nha khoa.

Cập nhật 10/11/2026: đã đọc được TẤT CẢ 12 tab, mọi form tạo phiếu, màn chi tiết phiếu nhập / kiểm kê, toàn bộ bảng trạng thái và nút thao tác (trước đây phần lớn "chưa đọc được"). Mới so với 27/10: bảng Tồn kho thêm cột Lô và đổi "Giá trị" thành "Giá vốn (avg)", có bộ lọc chi nhánh + kho; demo đã có phiếu nhập đầu tiên được ghi sổ (29/10), dòng ledger đầu tiên, 2 phiếu kiểm kê (đã hủy). Known gap do chính demo ghi: "POS chưa tự sinh xuất kho khi bán sản phẩm (sale_out)" và "lô/serial cần chạy thử với sản phẩm thật".

## 1. Mục đích
"Quản lý kho và mua sắm: kho hàng bán và kho nội bộ, nhập/xuất/điều chuyển/kiểm kê/điều chỉnh tồn, mua hàng (PR/PO) và theo dõi sổ kho." Liên quan: POS / Bán hàng, Tài chính - Kế toán, Báo cáo.

## 2. Bản đồ màn hình (12 thẻ, cùng thứ tự với thanh tab, tất cả "Sẵn sàng")
- KHO & TỒN KHO: Tổng quan tồn kho · Kho hàng · Tồn kho · Ledger kho.
- NHẬP & MUA HÀNG: Nhập kho (QR/Barcode) · Nhà cung cấp · Mua hàng (PR / PO) · Công nợ NCC.
- ĐIỀU CHỈNH & KIỂM SOÁT: Điều chuyển kho · Điều chỉnh tồn · Kiểm kê kho.
- HƯỚNG DẪN: Hướng dẫn Kho & Mua sắm.
Thanh tab trên màn: Tổng quan tồn kho | Kho hàng | Nhập kho | Tồn kho | Ledger | Nhà cung cấp | Mua hàng | Công nợ NCC | Điều chuyển kho | Điều chỉnh tồn | Kiểm kê kho | Hướng dẫn (tab đang mở nhớ trong phiên). Đường dẫn: `#/inventory_ops/<overview|warehouses|receipts|balances|ledger|suppliers|procurement|payables|transfers|adjustments|counts|info>`.

## 3. Từng màn hình con

### 3.1 Tổng quan tồn kho
3 KPI: Số kho hoạt động | Dòng tồn (SP × kho) | Giá trị tồn (avg cost). Bảng: Sản phẩm | SKU | Kho | Tồn | Giá trị. Rỗng: "Chưa có tồn kho. Hãy tạo phiếu nhập kho."

### 3.2 Kho hàng
- Nút "Thêm kho". Bảng: Mã (vd WH-RETAIL-<chi nhánh>, WH-INTERNAL-<chi nhánh>) | Tên kho | Loại (mã loại) | Chi nhánh | Bán (Có / —) | Trạng thái (Hoạt động / Ngừng) | Sửa (và Ngừng).
- Form "Thêm kho": Tên kho · Mã kho (bỏ trống = tự sinh) · Loại kho (retail | internal | quarantine | damaged | return_supplier | transit) · ☐ Cho phép bán trực tiếp · ☐ Hoạt động · Hủy / Lưu.
- Demo: mỗi chi nhánh 1 kho bán lẻ (bán = Có) + 1 kho nội bộ.

### 3.3 Tồn kho
- Lọc: chi nhánh (Tất cả / từng chi nhánh) · kho (Tất cả kho / từng kho) · "Tải lại".
- Bảng: Sản phẩm | SKU | Kho | Lô | Tồn | Giá vốn (avg). Một dòng cho mỗi (sản phẩm, kho, lô). Rỗng: "Không có tồn."
- Chưa có cột tồn giữ chỗ / khả dụng / tồn tối thiểu trên bảng (thuật ngữ có ở Hướng dẫn).

### 3.4 Ledger kho
- Lọc: chi nhánh · kho · "Tải lại".
- Bảng: Mã GD (INV-000001…) | Loại (mã nghiệp vụ, vd `purchase_receive`) | Sản phẩm | Kho | Nhập | Xuất | Trước | Sau | Thời gian. Rỗng: "Chưa có giao dịch tồn."

### 3.5 Nhập kho (QR/Barcode)
- Nút "Tạo phiếu nhập" → hộp "Tạo phiếu nhập kho": chỉ chọn Kho nhận → Tạo (phiếu nháp), rồi thêm dòng trong màn chi tiết.
- Bảng: Mã phiếu | Kho | NCC | Trạng thái | Ngày tạo. Mã mới `NK` + năm 2 số + chữ + 3 số (vd NK26A006); mã cũ `GR-000001`.
- Trạng thái phiếu nhập: Nháp · Đang nhận · Kiểm QC · Đã ghi sổ · Đã hủy.
- Màn chi tiết: ← Quay lại · Mã phiếu · Kho nhận · Trạng thái; bảng dòng: Sản phẩm | Barcode | Lô | HSD | Nhận | Đạt | Lỗi | Giá nhập. Ô tìm "Tìm sản phẩm theo tên / SKU" + quét mã: nếu mã vạch lạ, chọn sản phẩm thì hệ thống GẮN mã vạch đó vào sản phẩm ("— sẽ gắn mã … vào sản phẩm được chọn"); dòng mới mặc định Nhận 1 / Đạt 1, giá nhập = giá vốn sản phẩm. Nút "Ghi sổ (Post)" (tăng tồn + ghi ledger) · "Hủy phiếu".
- Phiếu nhập cũng tạo được từ PO ("Đã tạo phiếu nhập … (nháp) — sang tab Nhập kho để ghi sổ").

### 3.6 Nhà cung cấp
- Nút "Thêm NCC". Bảng: Mã (NCC-0001…) | Tên | SĐT | MST | Công nợ | Sửa.
- Form "Thêm NCC": Tên NCC · Mã (bỏ trống = tự sinh) · SĐT · Mã số thuế · Hủy / Lưu.
- Demo 8 NCC (vật tư nha khoa, implant, thiết bị, dược, 1 "Đối tác khác") [NHA KHOA].

### 3.7 Mua hàng (PR / PO)
- Sub-tab "Yêu cầu mua (PR)" | "Đơn mua hàng (PO)".
- PR: nút "Tạo yêu cầu mua" → hộp có ô "Tìm sản phẩm (tên / SKU)" để thêm dòng → Tạo. Bảng PR: Mã | Ưu tiên | Trạng thái | Ngày tạo | Thao tác. Trạng thái PR: Nháp · Chờ duyệt · Đã duyệt · Từ chối · Đã tạo PO · Đã hủy. Nút: Gửi duyệt · Duyệt · Từ chối · Tạo PO (hộp "Tạo PO từ <mã PR>": chọn NCC).
- PO: bảng Mã PO | NCC | Tổng tiền | Trạng thái | Thao tác; rỗng "Chưa có đơn mua. Tạo từ yêu cầu mua đã duyệt." Trạng thái PO: Nháp · Chờ duyệt · Đã duyệt · Đã gửi NCC · Nhận một phần · Đã nhận đủ · Đã đóng · Đã hủy. Nút: Gửi NCC · Tạo phiếu nhập · Đóng thủ công.
- Hướng dẫn: PO có SL đặt, giá mua, VAT, chiết khấu, ngày dự kiến nhận.

### 3.8 Công nợ NCC
- KPI: Tổng công nợ NCC | Số NCC còn nợ.
- Nút "Tạo hóa đơn từ PO" → hộp "Tạo hóa đơn NCC từ đơn mua" (chỉ PO đã duyệt / đã gửi; demo: "Chưa có PO phù hợp (cần approved/sent)").
- Bảng hóa đơn NCC: Mã HĐ | NCC | Tổng | Đã trả | Còn nợ | Trạng thái | Thao tác (Ghi sổ · Thanh toán). Trạng thái: Nháp · Chưa trả · Trả một phần · Đã trả · Quá hạn.
- Hộp "Thanh toán <mã HĐ>": số tiền + hình thức (Tiền mặt / Chuyển khoản / Thẻ / Khác).
- Bảng "Tuổi nợ": Mã HĐ | NCC | Còn nợ | Hạn | Quá hạn (ngày) | Nhóm. Rỗng: "Không có công nợ quá hạn."
- Quy tắc: công nợ chỉ phát sinh khi hóa đơn NCC đã ghi sổ.

### 3.9 Điều chuyển kho
- Nút "Tạo phiếu chuyển kho" → Kho nguồn · Kho đích · Loại chuyển (Nội bộ (cùng chi nhánh) | Liên chi nhánh) → Tạo.
- Bảng: Mã phiếu | Kho nguồn | Kho đích | Trạng thái | Ngày tạo.
- Chi tiết: ô "Thêm sản phẩm khả dụng tại kho nguồn (tên / SKU / mã vạch)" (chỉ hiện hàng có tồn khả dụng, kèm mã vạch, lô) · Số lượng chuyển · Thêm dòng. Bảng dòng: Sản phẩm | Lô / Serial | Yêu cầu | Duyệt | Soạn | Xuất | Nhận | Lệch. Chặn khi số lượng vượt tồn khả dụng.
- Trạng thái: Nháp · Chờ duyệt · Đã duyệt · Đã soạn · Đang chuyển · Đã nhận · Nhận lệch · Đã hủy. Nút theo bước: Gửi duyệt · Duyệt · Soạn hàng (Pick) · Xuất chuyển (Ship) · Nhận hàng (Receive) · Đóng phiếu · Hủy phiếu.

### 3.10 Điều chỉnh tồn
- Nút "Tạo phiếu điều chỉnh" → Kho · Loại điều chỉnh (Tăng tồn | Giảm tồn | Đặt số lượng) · Lý do → Tạo.
- Bảng: Mã | Kho | Loại | Trạng thái | Ngày tạo. Dòng chi tiết: SL tăng / SL giảm / Số lượng đặt. Nút: Gửi duyệt · Duyệt · Ghi sổ.

### 3.11 Kiểm kê kho
- Nút "Tạo phiếu kiểm kê" → Kho · Loại kiểm kê (Toàn kho | Một phần) → Tạo.
- Bảng: Mã (KK + năm + chữ + số) | Kho | Loại | Trạng thái | Ngày tạo.
- Chi tiết: Mã · Kho · Loại · Trạng thái · (nếu có) "Điều chỉnh sinh ra: Đã tạo phiếu ADJ". Nháp: "Bấm Bắt đầu kiểm để chụp ảnh tồn hệ thống rồi nhập số đếm thực tế". Bảng: Sản phẩm | Lô | Tồn hệ thống | Đếm thực tế | Lệch | Giá trị lệch. Nút: Bắt đầu kiểm (snapshot tồn) · Ghi sổ (tạo điều chỉnh) · Hủy.
- Trạng thái: Nháp · Đang kiểm · Soát lệch · Đã ghi sổ · Đã hủy.

### 3.12 Hướng dẫn & thuật ngữ
Đọc đủ (mục 4–6). Ngoài ra nút "Hướng dẫn" chung của mục có: thuật ngữ (PR, PO, nhập/xuất, điều chuyển, kiểm kê, điều chỉnh, ledger, lô/HSD, serial, QR/Barcode, tồn khả dụng), 4 bước thao tác, lưu ý (không sửa dữ liệu đã ghi sổ; chỉ xuất/chuyển trong tồn KHẢ DỤNG; lô/serial phải đúng sản phẩm, đúng kho), lỗi hay gặp (nhầm kho nguồn/đích, vượt tồn khả dụng, chọn lô sai).

## 4. Loại kho (6 loại)
| Mã | Tên | Dùng cho | Ảnh hưởng |
|---|---|---|---|
| retail | Kho hàng bán | Mỹ phẩm, sản phẩm chăm sóc bán qua POS | Bán thì giảm tồn, ra doanh thu, giá vốn, lợi nhuận |
| internal | Kho nội bộ | Vật tư tiêu hao dùng cho dịch vụ | Không bán; dùng cho dịch vụ thì giảm tồn và tạo chi phí dịch vụ |
| quarantine | Kho chờ kiểm | Hàng mới nhận / nghi vấn chờ QC | Đạt QC mới chuyển kho dùng được |
| damaged | Kho hỏng/hủy | Hàng lỗi, hết hạn, chờ hủy | Kiểm soát thất thoát, biên bản hủy |
| return_supplier | Kho trả NCC | Hàng sai/thừa/không đạt chờ trả | Xuất trả giảm công nợ |
| transit | Kho trung chuyển | Hàng đang đi đường | Tách đã xuất - chưa nhận |

## 5. Thuật ngữ & quy tắc tồn
- Tồn thực tế; tồn giữ chỗ; TỒN KHẢ DỤNG = thực tế − giữ chỗ.
- Lô (mã lô, NSX, HSD, giá vốn riêng); serial cho từng đơn vị.
- Giá vốn bình quân gia quyền tính lại sau mỗi lần nhập.
- FEFO cho hàng có hạn, FIFO còn lại.
- Ledger bất biến; sai thì tạo dòng đảo / điều chỉnh.
- PR → PO → GR (post: tăng tồn + ledger) → hóa đơn NCC (post: sinh công nợ) → thanh toán.

## 6. Luồng chính
- Bán lẻ: nhập 100, bán 2 → tồn 98 + doanh thu (nhưng demo chưa tự trừ kho khi bán — known gap).
- Dịch vụ: nhập 500 găng, dùng 2 → tồn 498 + chi phí vật tư.
- PR → duyệt → PO gửi NCC → GR → ghi sổ → hóa đơn NCC → thanh toán.
- Kiểm kê: tạo → bắt đầu (snapshot) → nhập đếm → soát lệch → ghi sổ sinh phiếu điều chỉnh.

## 7. Điểm riêng nha khoa [NHA KHOA]
- Vật tư nha khoa, implant (serial theo bệnh nhân), NCC nha khoa.

## 8. Đề xuất cho AMIA
(Đối chiếu đủ: DOI-CHIEU-10-11.md.) AMIA đã có tồn, sổ kho, lô & hạn dùng, phiếu nhập, chuyển kho có xác nhận nhận + xử lý lệch, kiểm kê 2 người đếm có duyệt, xử lý vật tư có duyệt, xuất khẩn cấp hậu kiểm, đơn mua có báo giá, công nợ NCC — nhiều chỗ chặt hơn demo. Nên học thêm: danh mục kho có loại (ít nhất bán lẻ / nội bộ / hỏng) thay vì cố định theo chi nhánh; dòng nhập có Nhận / Đạt / Lỗi; quét mã vạch khi nhập và tự gắn mã vạch lạ vào sản phẩm; PR tách khỏi PO với trạng thái "Đã tạo PO"; điều chỉnh "Đặt số lượng"; kiểm kê "Một phần"; hóa đơn NCC từ PO + bảng tuổi nợ theo nhóm; trang Hướng dẫn thuật ngữ. Bỏ: kho chờ kiểm, trung chuyển, serial (để sau).

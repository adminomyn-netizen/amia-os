# BeDental ERP - Mục "Tài chính - Kế toán" (đề bài cho AMIA OS)

Nguồn: demo BeDental (nha khoa), đọc trực tiếp giao diện + mã giao diện (bundle JS) ngày 10/11/2026; bản 27/10 đọc từ ảnh chụp chữ. Không chép tên người, số điện thoại, số tài khoản, email, mã khách; chỉ ghi cấu trúc. [NHA KHOA] = điểm riêng nha khoa.

Cập nhật 10/11/2026: đọc được hết những chỗ 27/10 ghi "chưa đọc được": 12 cột bảng Sổ quỹ, form "Thêm khoản thu/chi" (có loại "Thiết lập số dư ban đầu"), chi tiết chứng từ, luồng Xóa phiếu = phiếu đảo có lý do, in phiếu 2 liên A4, bộ lọc Hình thức / Quỹ, tab Danh sách loại thu/chi (tạo / sửa / ngừng dùng), danh sách "cần đối soát", hộp Khóa kỳ (lý do bắt buộc), form Thêm tài khoản ngân hàng, bộ chọn khoảng ngày, và trang "Hướng dẫn" của mục (thuật ngữ, quy trình, lỗi hay gặp, known gaps). Trạng thái 13 thẻ KHÔNG đổi so với 27/10 (vẫn chỉ 3 thẻ "Sẵn sàng").

## 1. Mục đích
"Sổ quỹ thu/chi, công nợ, hóa đơn và quyết toán (báo cáo tài chính ở mục Báo cáo)". Mục này là nơi THAO TÁC / GHI SỔ; báo cáo xem ở mục Báo cáo. Trang Hướng dẫn của mục ghi mục đích: "Theo dõi dòng tiền và công nợ: sổ quỹ thu/chi, công nợ khách hàng và nhà cung cấp, hóa đơn đầu vào và quyết toán."

## 2. Cấu trúc mục (5 nhóm, 13 thẻ) và trạng thái của chính demo

| Nhóm | Thẻ | Trạng thái demo | Mô tả gốc |
|---|---|---|---|
| THU / CHI | Sổ quỹ / Cashbook | Sẵn sàng | Sổ quỹ thu/chi từ `order_payment_ledger` — lọc, KPI, số dư chạy, xuất Excel |
| THU / CHI | Khoản thu | Sắp có | Ghi nhận khoản thu ngoài đơn hàng (thực tế đã làm qua nút trong Sổ quỹ) |
| THU / CHI | Khoản chi | Sắp có | Ghi nhận khoản chi/chi phí (như trên) |
| CÔNG NỢ | Công nợ khách hàng | Sắp có | Hiện xem ở Báo cáo → Khách hàng nợ |
| CÔNG NỢ | Công nợ phải trả (NCC) | Đang hoàn thiện | Thao tác ở Kho & Mua sắm → Công nợ NCC |
| HÓA ĐƠN | Hóa đơn đầu vào | Sắp có | Hóa đơn mua vào từ NCC |
| HÓA ĐƠN | Hóa đơn điện tử | Sắp có | Kết nối / phát hành hóa đơn điện tử |
| QUYẾT TOÁN | Quyết toán hoa hồng CTV | Đang hoàn thiện | Đợt quyết toán CTV — nền API có, UI đang hoàn thiện |
| QUYẾT TOÁN | Payroll posting / Quyết toán lương | Sắp có | Ghi sổ / hạch toán bảng lương |
| KẾ TOÁN | Bút toán kế toán | Đang hoàn thiện | Tạo, duyệt, ghi sổ và đảo bút toán |
| KẾ TOÁN | Đối soát bán hàng (net) | Sẵn sàng | SL / giá vốn / doanh thu net sau hoàn-trả theo sản phẩm; xuất Excel |
| KẾ TOÁN | Khóa kỳ kế toán | Sẵn sàng | Khóa/mở kỳ theo tháng + chi nhánh; chặn ghi nhận kỳ đã khóa; nhật ký |
| ĐỀ XUẤT & HỒ SƠ | Đề xuất thanh toán | Sẵn sàng | Thẻ dùng chung với Nơi làm việc (xem noi-lam-viec.md 2.3) |

Tài khoản ngân hàng nằm ở Cài đặt → Cửa hàng (xem 3.11) nhưng chính là danh sách quỹ ngân hàng của Sổ quỹ.

Known gaps do chính demo tự ghi (trang Hướng dẫn): "AR/AP/thuế (VAT) mới ở mức FOUNDATION (đã có tài khoản + bút toán chuẩn, chưa nối vào luồng bán/mua live); chưa có tờ khai thuế, aging." · "Bút toán kế toán thủ công (tạo/đảo bằng tay) vẫn đang hoàn thiện; hiện tự động sinh khi thu tiền/hoàn tiền."

## 3. Từng màn hình con

### 3.1 Sổ quỹ / Cashbook (Sẵn sàng) — màn quan trọng nhất
Nguồn: sổ cái thanh toán đơn (`order_payment_ledger`) + phiếu thu/chi thủ công.

**Thanh tiêu đề**: "Sổ quỹ thu chi" · bộ chọn khoảng ngày (Hôm nay | Hôm qua | 7 ngày trước | 30 ngày trước | Tháng này | Tháng trước | 3 tháng trước | 6 tháng trước | Năm nay | Năm trước | Lựa chọn khác → nút Chọn) · bộ chọn chi nhánh (Tất cả các chi nhánh / từng chi nhánh) · "Xuất Excel" · "Thêm khoản thu/chi".

**Hai dải cảnh báo** (chỉ hiện khi có vấn đề):
- "Cần đối soát: N khoản thanh toán (tổng X đ) chưa vào Sổ quỹ" + "Xem danh sách" → bảng gập/mở: Ngày | Hóa đơn | Chi nhánh | Loại (Thu tiền / Hoàn tiền) | Hình thức | Số tiền | Tình trạng (vd "Không có trong hàng đợi — cần người xem"). Demo: 5 khoản.
- "N khoản thu 1 đ giữ chỗ (ghi nợ khi chưa cho thu 0 đ) — có thể hủy để hóa đơn về đúng số nợ" + "Xem & hủy" → hộp "Hủy khoản thu 1 đ giữ chỗ": Ngày | Hóa đơn | Chi nhánh | Hình thức | Tổng hóa đơn | Nợ sau khi hủy, ô Lý do; mỗi khoản hủy bằng một phiếu đảo đúng ngày giờ, đúng quỹ; hóa đơn tự tính lại công nợ. Demo: 21 khoản. Đây là mẹo tạm vì POS không cho thu 0 đ — AMIA không bắt chước.

**3 tab**: Sổ quỹ tiền mặt | Sổ quỹ ngân hàng | Danh sách loại thu/chi.

**KPI hàng 1**: TỒN QUỸ ĐẦU KỲ | THU CHI TRONG KỲ | TỒN QUỸ CUỐI KỲ | TỒN QUỸ HIỆN TẠI. Dòng cảnh báo: "Tồn quỹ đang tính từ 0 vì mới có a / b quỹ được nhập số dư ban đầu — có thể lệch với tiền thực tế" + nút "Nhập số dư ban đầu" (demo: 0/1 quỹ tiền mặt, 0/5 quỹ ngân hàng). Hướng dẫn nói rõ: số dư chạy là số dư TƯƠNG ĐỐI khi chưa có số dư đầu kỳ.

**Bộ lọc**:
- Loại: Tất cả loại thu/chi | Thu vào | Chi ra | Nạp tiền | Rút tiền.
- Phân loại (danh mục ở tab 3): chi — Chi phí khác (điện, nước, cúng kiếng, ship…) · Chi phí nhân sự fulltime · Chi phí bác sĩ thuê ngoài [NHA KHOA] · Tiền marketing (facebook, google ads, quảng cáo, tờ rơi, in ấn) · Tiền mặt bằng / thuê văn phòng · Tiền vật tư / nguyên vật liệu / hàng hóa · Hoàn tiền khách · Chi nhà cung cấp · Chi vận hành; thu — Bán hàng · Thu khác; hệ thống — Số dư ban đầu · Đảo phiếu · Chuyển quỹ.
- Hình thức: Tất cả hình thức / tiền mặt / chuyển khoản / thẻ…
- Quỹ / tài khoản: tab tiền mặt "Tất cả quỹ" / từng quỹ; tab ngân hàng "Tất cả tài khoản" / từng tài khoản.
- Hộp tích "Hiện phiếu đã xóa / đã hoàn" — mặc định ẩn phiếu đã xóa (đã đảo) VÀ cặp thu ↔ hoàn tiền của cùng hóa đơn, ẩn khỏi cả bảng và ô tổng. Nút "Xóa bộ lọc".

**KPI hàng 2**: TỔNG THU | TỔNG CHI | NẠP TIỀN | RÚT TIỀN. Nạp tiền (nguồn ngoài) KHÔNG tính vào Tổng thu; Rút tiền (ra ngoài) KHÔNG tính vào Tổng chi.

**Bảng giao dịch (12 cột)**: Ngày chứng từ | Chi nhánh | Mã phiếu / HĐ (mã phiếu + dòng phụ mã hóa đơn) | Khách hàng | Người thu/chi | Loại (Thu vào / Chi ra / Nạp / Rút; nhãn phụ "Tự động" khi sinh từ thanh toán đơn) | Phân loại | Hình thức | Nội dung | Người nhận tiền | Số tiền (+ xanh / − đỏ) | Hành động (menu: Xem chi tiết · In phiếu · Xóa phiếu).
Mã chứng từ: PT + năm 2 số + chữ + số (phiếu thu tay), PC… (phiếu chi tay), TD… (thu theo đơn, kèm "HĐ DH…").

**Hộp "Chi tiết chứng từ Sổ quỹ"**: Mã phiếu · Loại chứng từ (Phiếu thu / Phiếu chi) · Ngày chứng từ · Chi nhánh · Phân loại · Người nộp / nhận · Nội dung · khối "Bút toán" (quỹ + chiều + số tiền) · nút Xóa phiếu · In 2 liên (A4: liên 1 lưu sổ, liên 2 giao người nộp/nhận) · In phiếu · Đóng. Phiếu theo đơn có liên kết "Chi tiết hóa đơn gốc".

**Xóa phiếu**: hộp nhập "Lý do xóa" (vd "Ghi nhầm số tiền"); "Phiếu không bị xóa hẳn: hệ thống ghi một phiếu đảo cùng số tiền, rồi ẩn cả hai khỏi Sổ quỹ và ô tổng"; xóa đi qua phê duyệt (loại `cashbook.reverse`, mức Nghiêm trọng), có link "Xem hồ sơ phê duyệt".

**Form "Thêm khoản thu/chi"** (tiêu đề phụ: tên sổ + chi nhánh):
- Loại phiếu: Thu vào | Chi ra | Nạp tiền | Rút tiền | Thiết lập số dư ban đầu.
- Mã phiếu (tự sinh khi lưu, vd PT26A001) · Ngày chứng từ (date) · Chi nhánh (theo chi nhánh đang làm việc, khóa) · Quỹ (tiền mặt) hoặc Tài khoản ngân hàng (tab ngân hàng) · Phân loại (lọc theo loại thu/chi) · Số tiền · Người thu / người chi (trống = người lập) · Nội dung · hộp tích "In phiếu sau khi lưu" · nút Đóng / Ghi sổ.
- Lập phiếu thu/chi thủ công đi qua Trung tâm phê duyệt (Rủi ro cao), chỉ vào sổ khi "Đã thực thi".

**Tab "Danh sách loại thu/chi"**: "Dùng chung toàn công ty — mọi chi nhánh thấy cùng một danh sách." Hai khối Loại thu / Loại chi, mỗi khối nút "Tạo loại mới"; loại hệ thống gắn nhãn "Mặc định hệ thống" (không sửa); loại tự tạo có Sửa / Ngừng sử dụng.

Quy tắc:
- Sổ bất biến: sai thì xóa = phiếu đảo có lý do, có duyệt; xem lại bằng hộp tích.
- Mỗi quỹ có số dư ban đầu (là một loại phiếu, cũng qua duyệt).
- Đối soát hai chiều: thanh toán đơn chưa vào sổ quỹ → cảnh báo.
- Đa chi nhánh, đa quỹ (1 quỹ tiền mặt / chi nhánh + mỗi tài khoản ngân hàng 1 quỹ).

### 3.2 Khoản thu / Khoản chi (thẻ riêng: Sắp có)
Thẻ riêng chưa có; thực tế làm qua "Thêm khoản thu/chi" ở 3.1.

### 3.3 Công nợ khách hàng (Sắp có)
Chỉ có báo cáo "Khách hàng nợ" (bao-cao.md). Hướng dẫn: chưa có aging.

### 3.4 Công nợ phải trả NCC (Đang hoàn thiện)
Màn thực ở Kho & Mua sắm → Công nợ NCC (kho-mua-sam.md 3.8).

### 3.5 Hóa đơn đầu vào / Hóa đơn điện tử (Sắp có)
Chưa có màn.

### 3.6 Quyết toán hoa hồng CTV (Đang hoàn thiện)
Chưa có UI ở mục này. Trong mã có chuỗi của luồng duyệt rút hoa hồng từ cổng CTV ("Đối tác thấy lý do trong cổng. Hoa hồng quay về số dư, đối tác gửi lại được") — thuộc Marketing (xem marketing.md).

### 3.7 Payroll posting / Quyết toán lương (Sắp có)
Chưa có.

### 3.8 Bút toán kế toán (Đang hoàn thiện)
Vẫn là trang giới thiệu: dùng chung "Approval & Controlled Posting Framework" cho 7 thao tác: Tạo bút toán thủ công · Sửa · Duyệt · Ghi sổ / Post · Đảo · Hủy · Mở/khóa kỳ. Nút duy nhất "Xem việc cần duyệt". Hướng dẫn: bút toán (Nợ/Có, Dr=Cr) KHÁC sổ quỹ (dòng tiền); hiện bút toán tự sinh khi thu/hoàn tiền; trả hàng ghi Dr Kho / Cr Giá vốn.

### 3.9 Đối soát bán hàng (net) (Sẵn sàng)
- Tiêu đề "Đối soát bán hàng (net sau hoàn/trả)". Lọc chi nhánh + khoảng ngày; "Xuất Excel".
- 5 KPI: SL bán net | Doanh thu net | Giá vốn net | Lợi nhuận net | Biên LN net.
- Bảng 11 cột: Sản phẩm | SL bán | SL trả | SL net | Giá vốn net | DT gộp | DT trả | DT net | LN net | Biên LN | Đối soát.
- Công thức in dưới bảng: SL net = bán − trả; giá vốn net = giá vốn bán − giá vốn trả; DT net = gộp − trả; LN net = DT net − giá vốn net. Nguồn SL / giá vốn: `inventory_ledger` (bất biến); doanh thu phân bổ theo dòng đơn; nút Hướng dẫn nêu known gap.
- Lưu ý: chính demo ghi known gap "POS chưa tự sinh xuất kho khi bán sản phẩm (sale_out)" → cột Đối soát dễ lệch.

### 3.10 Khóa kỳ kế toán (Sẵn sàng)
- Phạm vi: "Tất cả chi nhánh + hệ thống" hoặc từng chi nhánh.
- Banner: sau khi khóa, mọi thanh toán / hoàn tiền / bút toán có ngày trong kỳ bị chặn; muốn sửa phải mở lại (chỉ owner) hoặc bút toán điều chỉnh kỳ sau.
- Bảng 7 cột: Kỳ (YYYY-MM) | Phạm vi | Trạng thái (Đang mở / Đã khóa) | Số bút toán | Khóa lúc | Lý do | Thao tác ("Khóa kỳ").
- Hộp "Khóa kỳ YYYY-MM": "Phạm vi: <chi nhánh>. Sau khi khóa, thanh toán/hoàn/bút toán trong kỳ sẽ bị chặn." · ô Lý do (bắt buộc) · Hủy / Xác nhận khóa.
- Khối "Nhật ký khóa/mở kỳ": Thời gian | Kỳ | Phạm vi | Hành động | Lý do. Demo vẫn chưa khóa kỳ nào (mọi kỳ từ 2018 "Đang mở").

### 3.11 Tài khoản ngân hàng (Cài đặt → Cửa hàng)
- Lọc chi nhánh; nút "Thêm tài khoản". Số tài khoản luôn che (4 số cuối); tài khoản "Ngừng sử dụng" không dùng lập phiếu mới, lịch sử giữ nguyên.
- Form "Thêm tài khoản ngân hàng": Tên tài khoản · Ngân hàng · Chủ tài khoản · Số tài khoản (khi sửa: "Để trống nếu giữ nguyên") · Hủy / Lưu.

## 4. Quy tắc nghiệp vụ thấy được
1. Sổ quỹ tự sinh từ thanh toán đơn (nhãn "Tự động") + phiếu tay; cảnh báo khoản thanh toán chưa vào sổ.
2. Phiếu tay (thu, chi, nạp, rút, số dư ban đầu) và xóa phiếu đều qua Trung tâm phê duyệt (Rủi ro cao / Nghiêm trọng), "Chờ ghi sổ" → "Đã thực thi".
3. Sổ bất biến: xóa = phiếu đảo + lý do; mặc định ẩn cặp đảo và cặp thu ↔ hoàn của cùng hóa đơn.
4. Nạp/Rút không vào Tổng thu/Tổng chi.
5. Mỗi quỹ cần số dư ban đầu; thiếu thì cảnh báo tồn quỹ có thể sai.
6. Danh mục loại thu/chi dùng chung toàn công ty; loại hệ thống khóa; loại tự tạo ngừng dùng chứ không xóa.
7. In phiếu thu/chi, có bản 2 liên A4.
8. Khóa kỳ theo tháng × chi nhánh, lý do bắt buộc, có nhật ký; mở lại chỉ owner.
9. Đối soát net cho sản phẩm, nguồn ledger kho.
10. Số tài khoản che, ngừng dùng thay xóa.

## 5. Điểm riêng nha khoa [NHA KHOA]
- Phân loại chi "bác sĩ thuê ngoài (implant, chỉnh nha)", đề xuất trả lab/xưởng răng, công cắm implant.
- Tài khoản ngân hàng "chờ thanh toán bảo hiểm" (bảo lãnh viện phí), công nợ phải thu từ hãng bảo hiểm.

## 6. Đề xuất cho AMIA
(Đối chiếu chi tiết với AMIA OS: xem DOI-CHIEU-10-11.md.) AMIA đã có sổ quỹ, phân loại, chuyển quỹ, đảo, khóa kỳ, đối soát, công nợ khách 6 nhóm tuổi nợ, ngân sách, hóa đơn đầu vào/điện tử — phần lớn đã vượt demo. Còn nên học: số dư ban đầu từng quỹ + cảnh báo; cảnh báo "thanh toán chưa vào sổ quỹ"; bộ lọc Hình thức / từng quỹ; ẩn cặp thu ↔ hoàn; in phiếu thu/chi 2 liên; khóa kỳ theo chi nhánh + lý do khi khóa; hộp chi tiết chứng từ có khối bút toán. Bỏ: mẹo thu 1 đ, mọi điểm [NHA KHOA].

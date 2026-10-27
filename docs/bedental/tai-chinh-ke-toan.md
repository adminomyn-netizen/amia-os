# BeDental ERP - Mục "Tài chính - Kế toán" (đề bài cho AMIA OS)

Nguồn: chụp chữ demo BeDental (nha khoa). Hai lần chụp: (a) trang tổng quan của mục (danh sách thẻ + mô tả + nhãn trạng thái); (b) bản chụp bổ sung đọc được màn con của Sổ quỹ, Bút toán kế toán, Khóa kỳ kế toán, Đối soát bán hàng (net), Tài khoản ngân hàng (nằm ở Cài đặt) và các Đề xuất thanh toán / Trung tâm phê duyệt liên quan. Chỗ nào vẫn không đọc được thì ghi "chưa đọc được"; phần suy luận ghi rõ "(suy luận)". Không chép tên người, số điện thoại, số tài khoản, email, mã khách; chỉ ghi cấu trúc.

## 1. Mục đích
Sổ quỹ thu/chi, công nợ, hóa đơn, quyết toán và kế toán. Dòng mô tả gốc: "Sổ quỹ thu/chi, công nợ, hóa đơn và quyết toán (báo cáo tài chính ở mục Báo cáo)". Tức mục này là nơi THAO TÁC/GHI SỔ; còn báo cáo xem ở mục Báo cáo.

## 2. Cấu trúc mục (4 nhóm, 14 thẻ) và trạng thái hoàn thiện của chính demo

| Nhóm | Thẻ | Trạng thái trong demo | Mô tả gốc |
|---|---|---|---|
| THU / CHI | Sổ quỹ / Cashbook | Sẵn sàng | Sổ quỹ thu/chi lấy từ bảng `order_payment_ledger`; có lọc, KPI, số dư chạy, xuất Excel |
| THU / CHI | Khoản thu | Sắp có | Ghi nhận khoản thu ngoài đơn hàng |
| THU / CHI | Khoản chi | Sắp có | Ghi nhận khoản chi/chi phí |
| CÔNG NỢ | Công nợ khách hàng | Sắp có | Phải thu khách; hiện xem ở Báo cáo -> Khách hàng nợ |
| CÔNG NỢ | Công nợ phải trả (NCC) | Đang hoàn thiện | Thao tác nằm ở Kho & Mua sắm -> Công nợ NCC |
| HÓA ĐƠN | Hóa đơn đầu vào | Sắp có | Hóa đơn mua vào từ NCC |
| HÓA ĐƠN | Hóa đơn điện tử | Sắp có | Kết nối/phát hành hóa đơn điện tử |
| QUYẾT TOÁN | Quyết toán hoa hồng CTV | Đang hoàn thiện | Đợt quyết toán cộng tác viên; "nền API có, UI đang hoàn thiện" |
| QUYẾT TOÁN | Payroll posting / Quyết toán lương | Sắp có | Ghi sổ/hạch toán bảng lương |
| KẾ TOÁN | Bút toán kế toán | Đang hoàn thiện | Tạo, duyệt, ghi sổ và đảo bút toán |
| KẾ TOÁN | Đối soát bán hàng (net) | Sẵn sàng | Đối soát số lượng / giá vốn / doanh thu NET sau hoàn-trả, theo sản phẩm; xuất Excel |
| KẾ TOÁN | Khóa kỳ kế toán | Sẵn sàng | Khóa/mở kỳ theo THÁNG + CHI NHÁNH; chặn ghi nhận trong kỳ đã khóa; có nhật ký khóa/mở |

Cập nhật sau bản chụp bổ sung: màn Sổ quỹ đã có nút "Thêm khoản thu/chi" (thu/chi thủ công đi qua phê duyệt, xem 3.1 và 3.2), nên thẻ "Khoản thu / Khoản chi" rời rạc chỉ còn là lối tắt chưa làm. Bút toán kế toán đã mở được: vẫn chỉ là trang giới thiệu (xem 3.8).

Nhận xét: chỉ 3 thẻ "Sẵn sàng" (Sổ quỹ, Đối soát net, Khóa kỳ). Phần lớn còn "Sắp có" - nghĩa là ngay cả hệ thống tham chiếu cũng chưa xong; không cần coi đây là chuẩn đầy đủ.

## 3. Từng màn hình con

### 3.1 Sổ quỹ / Cashbook (Sẵn sàng) - màn quan trọng nhất
Nguồn dữ liệu: sổ cái thanh toán của đơn hàng (`order_payment_ledger`) cộng các phiếu thu/chi thủ công. Cấu trúc đọc được từ trên xuống:

Thanh tiêu đề: tên "Sổ quỹ thu chi"; bộ chọn khoảng thời gian (mặc định "Hôm nay"); bộ chọn chi nhánh (Tất cả các chi nhánh hoặc từng chi nhánh); nút "Xuất Excel"; nút "Thêm khoản thu/chi".

Hai dải cảnh báo (chỉ hiện khi có vấn đề), mỗi dải có nút hành động:
- "Cần đối soát: N khoản thanh toán (tổng X đ) chưa vào Sổ quỹ" + nút "Xem danh sách" (thanh toán trên đơn đã ghi nhận nhưng chưa có dòng sổ quỹ tương ứng).
- "N khoản thu 1 đ giữ chỗ (ghi nợ khi chưa cho thu 0 đ) - có thể hủy để hóa đơn về đúng số nợ" + nút "Xem & hủy". Nghĩa: POS không cho thu 0 đ nên khi khách ghi nợ hệ thống tạo khoản thu 1 đ giữ chỗ; sổ quỹ có công cụ dọn các khoản này. Đây là mẹo tạm của demo, AMIA không nên bắt chước (cho phép thanh toán 0 đ/ghi nợ thẳng).

Ba tab (chia sổ theo quỹ):
1. Sổ quỹ tiền mặt
2. Sổ quỹ ngân hàng (mỗi tài khoản ngân hàng khai ở Cài đặt, xem 3.11, là một quỹ)
3. Danh sách loại thu/chi (danh mục phân loại, xem dưới)

Hàng KPI 1 (số dư): TỒN QUỸ ĐẦU KỲ | THU CHI TRONG KỲ (chênh lệch ròng) | TỒN QUỸ CUỐI KỲ | TỒN QUỸ HIỆN TẠI. Dòng cảnh báo dưới KPI: "Tồn quỹ đang tính từ 0 vì mới có a / b quỹ được nhập số dư ban đầu - có thể lệch với tiền thực tế" + nút "Nhập số dư ban đầu". Tức mỗi quỹ cần một số dư ban đầu; quỹ chưa nhập thì không tính vào tồn.

Bộ lọc (hàng dưới KPI):
- Loại giao dịch: Tất cả loại thu/chi | Thu vào | Chi ra | Nạp tiền | Rút tiền. ("Nạp tiền / Rút tiền" (suy luận) là chuyển tiền vào/ra quỹ, như giữa tiền mặt và ngân hàng, không phải thu/chi thật; có phân loại "Chuyển quỹ" đi kèm.)
- Phân loại (14 giá trị + "Tất cả phân loại"):
  - Chi: Chi phí khác (điện, nước, cúng kiếng, ship...) | Chi phí nhân sự fulltime (lương, thưởng, BHXH...) | Chi phí bác sĩ thuê ngoài (implant, chỉnh nha...) [NHA KHOA] | Tiền marketing (facebook, google ads, quảng cáo, tờ rơi, in ấn) | Tiền mặt bằng / thuê văn phòng | Tiền vật tư / nguyên vật liệu / hàng hóa | Hoàn tiền khách | Chi nhà cung cấp | Chi vận hành.
  - Thu: Bán hàng | Thu khác.
  - Hệ thống: Số dư ban đầu | Đảo phiếu | Chuyển quỹ.
- Hộp tích "Hiện phiếu đã xóa / đã hoàn" (suy luận: mặc định ẩn các phiếu đã đảo/hoàn, phiếu không mất hẳn mà chỉ bị ẩn khỏi sổ).

Hàng KPI 2 (dòng tiền trong bộ lọc): TỔNG THU | TỔNG CHI | NẠP TIỀN | RÚT TIỀN.

Bảng giao dịch: khi không có dữ liệu hiện "Chưa có giao dịch nào trong bộ lọc này." nên tên cột thật vẫn chưa đọc được. Suy luận để dựng (đội dựng tự chốt): Ngày giờ | Số chứng từ / mã đơn | Diễn giải | Quỹ / phương thức (tiền mặt, chuyển khoản, thẻ, ví) | Phân loại | Thu | Chi | Số dư chạy | Chi nhánh | Người lập | Trạng thái (bình thường / đã đảo). Số dư chạy = số dư đầu kỳ + cộng dồn (thu - chi) theo thời gian trong bộ lọc.

Quy tắc đọc được:
- Thu/chi thủ công, đảo phiếu đã ghi sổ, chuyển/nạp/rút quỹ và thiết lập số dư ban đầu đều là "thao tác nhạy cảm" nên đi qua Trung tâm phê duyệt (rủi ro HIGH hoặc CRITICAL, xem cai-dat.md mục 2.8). Trong hàng chờ thấy các loại: Lập phiếu chi thủ công, Lập phiếu thu thủ công, Đảo phiếu đã ghi sổ (mức Nghiêm trọng); mã đề xuất dạng DX + năm + chữ cái + số thứ tự. Phiếu chỉ vào sổ quỹ sau khi duyệt xong (Chờ ghi sổ -> Đã thực thi).
- Sổ bất biến: sai thì "Đảo phiếu" (tạo phiếu ngược), không xóa; có hộp tích để xem lại phiếu đã đảo.
- Mỗi quỹ có số dư ban đầu; tồn quỹ hiện tại tính từ số dư đó. Cảnh báo lệch khi thiếu.
- Có công cụ đối soát hai chiều: thanh toán đơn chưa vào sổ quỹ.
- Đa chi nhánh, đa quỹ (tiền mặt và từng tài khoản ngân hàng).

### 3.2 Khoản thu / Khoản chi (thẻ riêng: Sắp có)
Thẻ riêng trên trang tổng quan chưa có. Trong thực tế demo, việc nhập khoản thu/chi ngoài đơn hàng nằm ở nút "Thêm khoản thu/chi" của Sổ quỹ và buộc qua phê duyệt (xem 3.1). Form nhập (trường cụ thể) chưa đọc được; suy luận gồm: loại (thu/chi), phân loại (14 giá trị trên), số tiền, quỹ (tiền mặt hoặc tài khoản ngân hàng), ngày, diễn giải, chứng từ đính kèm.

### 3.3 Công nợ khách hàng (Sắp có)
Chưa có màn riêng. Hiện chỉ có báo cáo "Khách hàng nợ" ở mục Báo cáo (xem `bao-cao.md`).

### 3.4 Công nợ phải trả NCC (Đang hoàn thiện)
Màn thao tác thực nằm ở Kho & Mua sắm -> Công nợ NCC (xem `kho-mua-sam.md`, đã đọc được: hai KPI Tổng công nợ NCC / Số NCC còn nợ, bảng hóa đơn NCC, bảng tuổi nợ). Ở mục Tài chính chỉ là cửa ngõ.

### 3.5 Hóa đơn đầu vào / Hóa đơn điện tử (Sắp có)
Chưa có.

### 3.6 Quyết toán hoa hồng CTV (Đang hoàn thiện)
Chưa đọc được UI. Biết: có khái niệm "đợt quyết toán" cho cộng tác viên (CTV) giới thiệu khách; tầng API đã có. Báo cáo tương ứng ở mục Báo cáo cũng ghi "Đang hoàn thiện". Hệ thống còn có báo cáo hoa hồng nhân viên / theo thực thu / giới thiệu (xem `bao-cao.md`).

### 3.7 Payroll posting / Quyết toán lương (Sắp có)
Chưa có. Mục đích: hạch toán bảng lương vào sổ (bảng lương nằm ở mục Nhân sự).

### 3.8 Bút toán kế toán (Đang hoàn thiện)
Đã mở được nhưng chỉ là TRANG GIỚI THIỆU, chưa có bảng hay form. Nội dung: tiêu đề "Bút toán kế toán", mô tả "Tạo, duyệt, ghi sổ và đảo bút toán kế toán", nhãn "Đang hoàn thiện", và đoạn nói phân hệ sẽ dùng chung "Approval & Controlled Posting Framework" để xử lý 7 thao tác: Tạo bút toán thủ công · Sửa bút toán · Duyệt bút toán · Ghi sổ (Post) · Đảo bút toán · Hủy bút toán · Mở/khóa kỳ kế toán. Hiện chỉ framework phê duyệt sẵn sàng, domain bút toán chưa triển khai; thao tác kế toán sẽ nối "executor" ở phase sau. Một nút duy nhất: "Xem việc cần duyệt" (sang Trung tâm phê duyệt).
Kết luận: vòng đời TẠO -> DUYỆT -> GHI SỔ -> ĐẢO được xác nhận; mọi thao tác ghi sổ đi qua engine phê duyệt chung rồi mới có "executor" thực thi. Trong chính sách phê duyệt, Tạo/Đảo bút toán và Mở kỳ đã khóa đều là "Future".

### 3.9 Đối soát bán hàng (net) (Sẵn sàng)
Đọc được đầy đủ khung (demo không có dữ liệu trong kỳ nên bảng rỗng).
- Bộ lọc: chi nhánh (Tất cả hoặc từng chi nhánh), khoảng thời gian (mặc định "Hôm nay"). Nút "Xuất Excel".
- KPI (5): SL bán net | Doanh thu net | Giá vốn net | Lợi nhuận net | Biên LN net (%).
- Bảng theo SẢN PHẨM, 11 cột: Sản phẩm | SL bán | SL trả | SL net | Giá vốn net | DT gộp | DT trả | DT net | LN net | Biên LN | Đối soát. Rỗng hiện "Không có dữ liệu bán/trả trong khoảng thời gian đã chọn".
- Công thức in ngay dưới bảng: net_sales_qty = SL bán - SL trả; net_cogs = giá vốn bán - giá vốn trả; net_revenue = DT gộp - DT trả; net_profit = net_revenue - net_cogs.
- Nguồn số lượng và giá vốn: sổ cái kho (`inventory_ledger`, bất biến). Doanh thu phân bổ theo dòng đơn hàng; có nút "Hướng dẫn" nêu "known gap" (chỗ phân bổ doanh thu chưa chính xác tuyệt đối; nội dung chưa đọc được).
- Cột "Đối soát" (chưa có dữ liệu để thấy giá trị): suy luận là cờ khớp / lệch giữa số lượng ledger và số lượng trên đơn.
- Chỉ áp cho SẢN PHẨM bán lẻ, không áp cho dịch vụ.

### 3.10 Khóa kỳ kế toán (Sẵn sàng)
- Bộ lọc phạm vi: "Tất cả chi nhánh + hệ thống" hoặc từng chi nhánh (kể cả Head Office).
- Banner quy tắc: sau khi khóa kỳ, mọi thanh toán / hoàn tiền / bút toán có NGÀY thuộc kỳ đó bị chặn; muốn sửa phải mở lại kỳ (chỉ chủ / owner) hoặc tạo bút toán điều chỉnh ở kỳ sau.
- Bảng chính, 7 cột: Kỳ (tháng, dạng YYYY-MM) | Phạm vi (chi nhánh) | Trạng thái (nhãn "Đang mở" / dự kiến "Đã khóa") | Số bút toán (số dòng sổ trong kỳ đó) | Khóa lúc | Lý do | Thao tác (nút "Khóa kỳ"; kỳ đã khóa chắc đổi thành "Mở lại", chưa thấy).
- Một dòng cho mỗi cặp (tháng, chi nhánh) có phát sinh; kỳ nào chi nhánh không có sổ thì không có dòng. Demo có khoảng 187 dòng trải từ 2018 đến tháng hiện tại, TẤT CẢ đang "Đang mở" và chưa từng khóa. Bài học: hệ thống không tự khóa theo lịch, phải có người bấm; nên đặt mặc định cảnh báo kỳ cũ chưa khóa.
- Khối "Nhật ký khóa/mở kỳ": Thời gian | Kỳ | Phạm vi | Hành động | Lý do. Demo "Chưa có nhật ký".
- Khi bấm "Khóa kỳ" có thể phải nhập lý do (suy luận từ cột Lý do).

### 3.11 Tài khoản ngân hàng (nằm ở Cài đặt > Cửa hàng, nhưng là danh sách quỹ ngân hàng của Sổ quỹ)
- Bộ lọc chi nhánh; nút "Thêm tài khoản".
- Ghi chú trên màn: số tài khoản luôn hiển thị dạng che (chỉ 4 số cuối); tài khoản đã "Ngừng sử dụng" không dùng để lập phiếu mới nhưng lịch sử chứng từ giữ nguyên tên và số đã che tại thời điểm ghi sổ.
- Mỗi tài khoản (dạng thẻ): tên gọi nội bộ (có thể kèm mục đích, ví dụ tài khoản chờ thanh toán bảo hiểm), tên ngân hàng, số che, nút "Sửa", nút "Ngừng sử dụng". Demo có 4 tài khoản của các ngân hàng, gắn với chi nhánh; một tài khoản nước ngoài (ngân hàng bảo hiểm) không có số hiển thị.
- Form thêm/sửa (trường: tên, ngân hàng, số, chủ tài khoản, chi nhánh, có thể QR) chưa đọc được.

## 4. Quy tắc nghiệp vụ thấy được
1. Sổ quỹ lấy từ sổ cái thanh toán đơn hàng, không nhập tay (với phần đã làm).
2. Số dư chạy + xuất Excel là chuẩn tối thiểu của sổ quỹ.
3. Sổ cái bất biến: sai thì tạo dòng/bút toán ĐẢO, không sửa xóa (nguyên tắc nêu rõ ở phần Hướng dẫn Kho cho "Ledger"; bút toán kế toán cũng có bước "đảo").
4. Khóa kỳ theo tháng + chi nhánh, có nhật ký; kỳ khóa chặn ghi.
5. Doanh thu/giá vốn báo cáo theo NET sau hoàn-trả.
6. Công nợ phải trả phát sinh từ hóa đơn NCC (xem kho-mua-sam.md); công nợ phải thu của khách chỉ có báo cáo.
7. Đa chi nhánh: mọi sổ/kỳ phân theo chi nhánh.
8. Thu/chi thủ công, đảo phiếu, chuyển quỹ và số dư ban đầu đều qua phê duyệt (maker-checker) rồi mới ghi sổ quỹ; mã đề xuất DX + năm + chữ cái + số.
9. Sổ quỹ chia quỹ: một quỹ tiền mặt + mỗi tài khoản ngân hàng một quỹ, mỗi quỹ có số dư ban đầu riêng; chuyển giữa quỹ gọi là Nạp tiền / Rút tiền và có phân loại "Chuyển quỹ".
10. Có dòng cảnh báo đối soát hai chiều (thanh toán đơn chưa vào sổ quỹ) thay vì để lệch âm thầm.
11. Số tài khoản ngân hàng luôn che; tài khoản ngừng dùng không xóa.
12. Đối soát net chỉ cho sản phẩm bán lẻ, nguồn là ledger kho bất biến.

## 5. Điểm riêng nha khoa [NHA KHOA]
- [NHA KHOA] Hợp đồng thanh toán trực tiếp với bảo hiểm (bảo lãnh viện phí) và hoa hồng giới thiệu CTV ảnh hưởng thu/công nợ: có tệp hợp đồng bảo lãnh viện phí cho thấy phòng khám thu một phần từ hãng bảo hiểm, tức có công nợ phải thu từ bên thứ ba (màn công nợ khách hàng demo chưa làm).
- [NHA KHOA] Phân loại chi "bác sĩ thuê ngoài (implant, chỉnh nha)" và các đề xuất thanh toán công nợ lab / xưởng răng theo tháng là dòng tiền riêng của nha khoa; một tài khoản ngân hàng riêng "chờ thanh toán bảo hiểm" cho bảo lãnh viện phí.
- [NHA KHOA] Tiền cọc/trả góp điều trị dài (implant, niềng) - không thấy trong mục này, chỉ suy luận; AMIA tương đương là thẻ liệu trình.

## 6. Đề xuất cho AMIA
Làm theo thứ tự:
1. Sổ quỹ (thu/chi từ thanh toán đơn POS) chia theo quỹ (tiền mặt, từng tài khoản ngân hàng), 2 hàng KPI (tồn đầu kỳ / thu chi trong kỳ / tồn cuối kỳ / tồn hiện tại và tổng thu / tổng chi / nạp / rút), số dư chạy, lọc ngày / chi nhánh / loại / phân loại, hộp tích xem phiếu đã đảo, xuất Excel, nhập số dư ban đầu cho từng quỹ. Đây là lõi, làm trước. Danh mục phân loại AMIA: thu (bán hàng/liệu trình, thu khác), chi (nhân sự, bác sĩ/kỹ thuật viên thuê ngoài, marketing, mặt bằng, vật tư/mỹ phẩm, hoàn tiền khách, chi NCC, vận hành), hệ thống (số dư ban đầu, đảo phiếu, chuyển quỹ). Không bắt chước thủ thuật "thu 1 đ giữ chỗ": cho ghi nợ thẳng.
2. Khoản thu / khoản chi ngoài đơn (nút "Thêm khoản thu/chi" ngay trong sổ quỹ; có phân loại, quỹ, chứng từ) đi qua hàng chờ duyệt như BeDental, dùng chung bảng sổ cái với bước 1. Cảnh báo đối soát "thanh toán đơn chưa vào sổ quỹ" cũng làm luôn ở bước này.
3. Khóa kỳ theo tháng + chi nhánh kèm nhật ký (rẻ, giá trị kiểm soát cao); đảo bút toán thay vì sửa. Học lỗi demo: tự gợi ý/nhắc khóa kỳ cũ (demo để mọi kỳ từ 2018 vẫn mở), chỉ chủ mới mở lại kỳ, chỉ liệt kê kỳ có phát sinh.
4. Công nợ khách hàng (phải thu) và liên kết thẻ liệu trình trả trước/trả góp của spa.
5. Công nợ phải trả NCC (chung với mục Kho).
6. Đối soát bán hàng net theo sản phẩm (cột: SL bán / SL trả / SL net / giá vốn net / DT gộp / DT trả / DT net / LN net / biên LN) lấy giá vốn từ ledger kho bất biến; 5 KPI đầu bảng.
7. Danh sách tài khoản ngân hàng che số (4 số cuối) + ngừng dùng thay xóa, làm cùng lúc với quỹ ngân hàng của sổ quỹ.
Làm sau / có thể bỏ:
- Bút toán kế toán đầy đủ (duyệt/ghi sổ/đảo), hóa đơn đầu vào, hóa đơn điện tử, payroll posting: chính BeDental cũng chưa xong; AMIA dùng kế toán/phần mềm ngoài thì chỉ cần xuất Excel/CSV từ sổ quỹ.
- Quyết toán hoa hồng CTV: chỉ làm nếu AMIA có chương trình CTV/giới thiệu thật; nếu có thì tách thành "đợt quyết toán" (chọn kỳ -> tính -> duyệt -> chi).
- Mọi điểm [NHA KHOA] về bảo hiểm bảo lãnh: bỏ.

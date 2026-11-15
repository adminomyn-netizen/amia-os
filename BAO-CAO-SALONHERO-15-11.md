# Rà SalonHero ↔ AMIA OS — 15/11/2026 (đợt 1, 07:50)

Nguồn đối chiếu: đọc thẳng SalonHero (chỉ gọi hàm đọc `getSettings`, đọc mẫu in trong mã trang), không bấm Lưu/Xoá/Thanh toán. Lưu ý: **SalonHero hết hạn hôm nay** (màn chính báo "còn 0 ngày"), nên rà trước khi mất quyền đọc.

## 1. Khổ in SalonHero đang dùng (đọc từ cài đặt thật)
| Tờ in | SalonHero (chi nhánh Vinh) | AMIA OS | Kết luận |
|---|---|---|---|
| Hoá đơn | **A5**, 0 bản sao, có logo, thông tin cửa hàng, nhân viên phục vụ, SĐT khách, chữ ký, thu ngân, giờ vào/ra, ghi chú; chân trang "Số tiền thanh toán hoá đơn sẽ KHÔNG HOÀN LẠI…" | Mặc định A5, cùng các ô bật/tắt, cùng câu chân trang | Khớp |
| Lịch hẹn | **80mm**, chân trang "Xin cảm ơn quý khách!…" | Nút In lịch hẹn in theo Thiết lập in (80mm, logo, câu cuối) | Đã làm |

## 2. Nút In cuối hoá đơn (anh Nam báo đã có) — đã kiểm
- Có: Danh sách hoá đơn › mở hoá đơn › nút **In** → trang `/in/hoa-don/<id>`, khổ theo Cài đặt › Thiết lập in.
- **Lỗi tìm thấy:** khung tờ in rộng hơn vùng in thật (A5 khung 560px, vùng in thật ≈ 469px; 80mm khung 302px, vùng in ≈ 287px) → trình duyệt tự thu nhỏ cả tờ, chữ bé, lề trái/phải không đều.
- **Đã sửa:** khi in, tờ phủ đúng vùng in, lề do khổ giấy lo (A5 lề 12mm, giấy cuộn 2mm). Áp cho hoá đơn, in nhiều hoá đơn, tạm tính, phiếu làm dịch vụ.

## 3. Các loại tờ in SalonHero có (35 mẫu) ↔ AMIA
| SalonHero | AMIA OS |
|---|---|
| In hoá đơn (57/58/80mm, A4/A5) | Có |
| In tạm tính ở Thu ngân | Có |
| In phiếu thu nợ (payment debt) | Có (`/in/phieu-thu`, A5) — chưa theo khổ Thiết lập in |
| In phiếu lịch hẹn (58/80mm/A4) | Có, theo khổ Thiết lập in |
| In mã vạch khách hàng | Có (In mã khách) |
| In mã vạch sản phẩm | Có (Danh mục › In mã vạch) |
| In thông tin khách hàng (customer print) | Có trang in hồ sơ khách — cần so lại cột |
| In ghi chú khách hàng (customer notes) | Cần kiểm |
| In sổ quỹ / doanh thu (print revenue) | Cần kiểm |
| In phiếu chuyển kho nội bộ (transfer order) | Cần kiểm |
| In phiếu nhập kho còn nợ NCC (transfer order debt) | Cần kiểm |
| Cài đặt mẫu in (khổ, logo, cỡ logo, chân trang, số bản sao, QR, ngôn ngữ) | Có: Cài đặt › Thiết lập in |

## 4. Nút ở màn khác (đang rà tiếp)
| Màn | Nút SalonHero | AMIA OS |
|---|---|---|
| Khách hàng dùng thẻ | Tích chọn nhiều thẻ → **Gia hạn thẻ** (đặt ngày hết hạn mới cho cả loạt), Khoá thẻ, Mở khoá thẻ | **Đã làm 08:0x:** tích chọn thẻ (hoặc "Chọn cả trang") → nhập ngày hết hạn mới → **Gia hạn thẻ**. Khoá/mở khoá vẫn trong hồ sơ thẻ |

## (A) Nút/menu SalonHero có mà AMIA THIẾU hoặc KHÁC — theo từng màn (08:20)
Cách rà: bóc toàn bộ 322 mẫu màn hình trong mã SalonHero (nút, menu, hộp thoại), dịch nhãn bằng chính bộ dịch của SalonHero, rồi dò từng nhãn và từ đồng nghĩa trong mã AMIA. Nút chung (Lưu, Huỷ, Đóng, Sửa, Xoá…) bỏ qua. Mục ghi "cần soi tay" là dò máy chưa chắc.

**Khách hàng**
- Thiếu: **In phiếu thông tin khách** (SalonHero có mẫu in 58/80mm/A4) — AMIA chỉ có In mã khách.
- Thiếu: **In ghi chú khách** (mẫu print notes).
- Thiếu: **Xem lịch hẹn cũ 6 tháng** trong hồ sơ khách (AMIA hồ sơ không có tab Lịch hẹn; xem ở màn Lịch hẹn).
- Thiếu: **Liên kết tài khoản Zalo / Gửi tin Zalo** từ hồ sơ khách và từ lịch hẹn.
- Thiếu: Lọc **"Hoá đơn không ghi chú"**.
- Không làm (của app khách SalonHero): Mật khẩu app, Xem SĐT đăng nhập app, Xem Survey.
- Có: Thêm/Nhập từ tệp/Xuất Excel, Nhóm khách, Sinh nhật hôm nay/7 ngày/tháng, Tăng số lần đã gọi (Nhắc nhở), Ảnh khách, Người thân, Ghi chú, Điểm, Lịch sử giao dịch, Thẻ dịch vụ, Tạo đơn từ hồ sơ.

**Lịch hẹn**
- Thiếu: **Gửi tin Zalo** trong lịch hẹn.
- Có: Đặt lịch, Trang đặt lịch, Lịch sử, Sơ đồ chỗ, Xem lịch theo thời gian/nhân viên/vị trí, Xuất Excel, Tạo khách mới, Thêm khách, In lịch hẹn (đã sửa 80mm).

**Thu ngân**
- Thiếu: **Sắp xếp danh mục theo tên / theo mã**.
- Cần soi tay: **Đổi khách khác** ngay trong đơn đang lên (AMIA chọn lại khách), **Áp nhân viên cho toàn bộ đơn**, **Ship COD / Bắt đầu vận chuyển** (AMIA không bán giao hàng, có thể bỏ).
- Có: Tiền mặt/Quẹt thẻ/Chuyển khoản/Nhiều hình thức, Thêm phí dịch vụ, VAT, Tip, Voucher, Chọn thẻ, Điểm, Màn hình khách, In tiếng Việt/tiếng Anh, In hoá đơn, Điều chỉnh nợ/Trả nợ, Lịch sử thanh toán.

**Hoá đơn**
- Có: danh sách lọc Hoàn thành/Đang xử lý/Bị huỷ, Tìm tương đối/chính xác, In, In nhiều, Lịch sử thanh toán, Trả nợ, Huỷ.

**Thẻ**
- Thiếu: **Xoá thẻ** (SalonHero có; AMIA chỉ Thu hồi — chủ ý giữ lịch sử, đề xuất giữ như vậy).
- Thiếu: **Khoá / Mở khoá HÀNG LOẠT** ở Khách dùng thẻ (AMIA khoá từng thẻ trong hồ sơ thẻ).
- Đã làm 08:0x: **Gia hạn thẻ** hàng loạt + từng thẻ.
- Thiếu (voucher): **Gia hạn voucher, Khoá/Mở khoá voucher, Lịch sử sử dụng, Xuất mã voucher, Gửi tin Zalo cho khách đã chọn**. AMIA Cài đặt › Voucher mới có Tạo voucher + Sửa.

**Kho**
- Thiếu: **In phiếu nhập kho / phiếu xuất kho / phiếu chuyển kho** (SalonHero có nút In phiếu ở các phiếu).
- Thiếu: **Chép danh mục sản phẩm từ chi nhánh khác** (chỉ có 1 chi nhánh hoạt động → ưu tiên thấp).
- Cần soi tay: **Chọn lô / Tạo lô hàng** khi nhập (AMIA có báo cáo tồn theo lô), **Lưu nháp / Huỷ phiếu** nhập-xuất.
- Có: Tạo phiếu nhập/xuất, Xuất sang kho nội bộ, Nhập từ Excel, Kiểm kê/Cân bằng, Tổng giá trị kho theo giá vốn/giá bán, Công thức (định mức), Nhân bản sản phẩm, Chuyển nhóm, In mã vạch, Trả nợ nhà cung cấp (Công nợ).

**Báo cáo / Sổ quỹ**
- Thiếu: **In sổ quỹ / doanh thu** (mẫu print revenue).
- Thiếu: **Hoa hồng: "Chi tiết toàn bộ nhân viên" / "Chi tiết nhân viên được chọn"** (2 nút tải chi tiết) — cần soi tay với Báo cáo hoa hồng AMIA.
- Không làm: Xuất báo cáo toà nhà (của SalonHero cho TTTM).
- Có: Thu vào/Chi ra, Nạp/Rút tiền, Loại thu chi, Xuất Excel, Khách nợ + Các lần trả nợ, các báo cáo theo ngày/tuần/tháng/quý.

**Cài đặt**
- Thiếu: Chi nhánh **Đóng tạm thời / Đóng vĩnh viễn** (AMIA chỉ bật/tắt hoạt động).
- Thiếu: Điểm khách hàng **Cập nhật hạng / Xoá điểm toàn bộ / Công thức quy đổi theo hạng**.
- Thiếu: Hoa hồng **Cài đặt nhanh / Cài đặt cho toàn bộ**.
- Thiếu: Hoá đơn điện tử **Kiểm tra kết nối / Xoá kết nối**.
- Thiếu: Dịch vụ/Sản phẩm **Chép từ chi nhánh** (ưu tiên thấp).
- Không làm: Nâng cấp gói, Đổi mật khẩu kiểu SalonHero (AMIA có Quên/Đổi mật khẩu riêng).

## (B) Kiểm 5 mẫu in còn lại (08:20)
| Mẫu in SalonHero | Khổ SalonHero | AMIA OS | Trạng thái |
|---|---|---|---|
| In ghi chú khách | 58/80mm/A4 theo Thiết lập in | Không có | **Thiếu** |
| In sổ quỹ / doanh thu | 58/80mm/A4 | Không có | **Thiếu** |
| In phiếu chuyển kho nội bộ | 58/80mm/A4 | Không có | **Thiếu** |
| In phiếu nhập kho còn nợ NCC | 58/80mm/A4/A5 | Không có | **Thiếu** |
| In phiếu thu nợ | Theo khổ hoá đơn (A5 ở Vinh) | Có `/in/phieu-thu` nhưng khoá cứng A5, không theo Thiết lập in | **Khác** — đang sửa |
Thứ tự làm tiếp: phiếu thu nợ theo khổ → phiếu nhập kho còn nợ NCC → phiếu chuyển kho → sổ quỹ → ghi chú khách.

## Link in thử cho chị Thuý
- Hoá đơn: vào https://lammec.mscvn.com/hoa-don → mở một hoá đơn bất kỳ → nút **In** (chỉ in, không đổi dữ liệu).
- Cài đặt mẫu in: https://lammec.mscvn.com/cai-dat/thiet-lap-in

## Nhật ký việc xong
- 07:50 Sửa tờ in bị thu nhỏ/lệch lề khi in (hoá đơn, tạm tính, phiếu làm).
- 08:0x Nút **Gia hạn thẻ**: hàng loạt ở Khách hàng › Khách dùng thẻ (tích chọn như SalonHero); từng thẻ ở hồ sơ thẻ, tab Thẻ dịch vụ của khách, danh sách Thẻ. Chỉ đổi hạn, ghi Lịch sử thẻ, không đụng buổi/tiền (chị Lâm hỏi 07:4x).
- 08:1x Nút **In** có bước **Kết nối máy in** lần đầu trên mỗi máy quầy: hướng dẫn chọn máy in quầy, khổ giấy, lề mặc định, tỉ lệ 100%; ghi tên máy in, lần sau bấm In ra hộp in ngay; nút "Máy in: … · Đổi". Muốn bấm là ra giấy không hiện hộp in: Chrome máy quầy chạy --kiosk-printing (cần cài 1 lần tại máy) (chị Lâm 07:4x).
- 07:55 Đã lên hosting (bản d56a3e09) và kiểm trên trang thật (tài khoản Kỹ thuật, chỉ xem): Khách dùng thẻ có 50 ô tích + nút Gia hạn thẻ; hồ sơ thẻ có Gia hạn thẻ; trang in hoá đơn hiện "Kết nối máy in & In", khổ A5. In thử ra PDF: đúng trang A5 (148×210mm), lề trái/phải đều, chữ không bị thu nhỏ.
- 08:0x **In lịch hẹn** theo mẫu SalonHero: khổ 80mm (theo Cài đặt › Thiết lập in › Lịch hẹn), logo, câu cuối "Xin cảm ơn quý khách! Hân hạnh được phục vụ quý khách!".

## CHÉP DỮ LIỆU SalonHero → AMIA OS (ưu tiên số 1, từ 08:10 — SalonHero hết hạn 14:57 hôm nay)
Cách làm: (1) chạy lại đồng bộ tăng dần SalonHero → AMIA (script đồng bộ đã chạy 2 lượt/ngày từ 28/10, đối chiếu tự động, chỉ ghi khi lệch 0; sao lưu 16 bảng trước khi ghi); (2) song song chép THÔ toàn bộ dữ liệu SalonHero (chỉ gọi hàm đọc) vào `amia-os/du-phong-salonhero-15-11/` làm bản dự phòng sau khi mất quyền.

### Đợt 0 — lượt đồng bộ 07:00 sáng nay (đã ghi thật, đối chiếu tự động)
| Mục | SalonHero | AMIA OS | Lệch |
|---|---|---|---|
| Khách có ở SalonHero mà thiếu ở AMIA | 0 | 0 | 0 |
| Số hoá đơn hoàn thành 10/10 → 15/11 | 847 | 847 | 0 |
| Tổng tiền hoá đơn (sau trừ thẻ) 10/10 → 15/11 | 1.699.744.000 | 1.699.744.000 | 0 |
| Ngày lệch (số HĐ / huỷ / tiền / nợ) 01/11 → 14/11 | 0 | 0 | 0 |
| Lịch hẹn (tháng × trạng thái) lệch | 0 | 0 | 0 |
| Thẻ lệch số dư | 0 | 0 | 0 |
| Thẻ mới thiếu gói/khách | 0 | 0 | 0 |
| Khách thiếu chi tiết | 0 | 0 | 0 |

### Số bản ghi gốc SalonHero đang có trong AMIA OS (08:15)
| Mục | AMIA OS (dòng mang mã SalonHero) |
|---|---|
| Khách hàng | 13.686 |
| Thẻ khách | 21.456 |
| Hoá đơn / dòng hoá đơn | 82.697 / 127.005 |
| Lịch hẹn | 82.236 |
| Nhắc chăm sóc | 60.236 |
| Ghi chú khách (ghi chú riêng CS) | 141.731 |
| Điểm thưởng (sổ điểm) | 39.183 |
| Nhóm khách / khách trong nhóm | 26 / 4.555 |
| Sổ quỹ thu chi | 4.296 |
| Kho: dòng nhập / xuất lịch sử | 2.182 / 474 (SalonHero 498; 24 dòng của sản phẩm đã xoá bên SalonHero, liệt kê riêng) |
| Dịch vụ / sản phẩm / gói thẻ | 247 / 423 / 584 |
| Nhân viên | 23 |
| Đối tác giới thiệu | 78 |

### Đợt 1 — lượt đồng bộ 08:10 (đã ghi thật, kết thúc 08:12)
Sao lưu trước khi ghi: 16 bảng (695.042 dòng) → `sao-luu/db-20261115-0810-…-sang-a`, `…0811-…-sang-b`.
| Mục | SalonHero | AMIA OS | Lệch |
|---|---|---|---|
| Khách có ở SalonHero mà thiếu ở AMIA | 0 | 0 | 0 |
| Số hoá đơn hoàn thành 11/10 → 15/11 | 798 | 798 | 0 |
| Tổng tiền hoá đơn (sau trừ thẻ) 11/10 → 15/11 | 1.447.904.000 | 1.447.904.000 | 0 |
| Ngày lệch (HĐ / huỷ / tiền / nợ) | 0 | 0 | 0 |
| Lịch hẹn (tháng × trạng thái) lệch | 0 | 0 | 0 |
| Thẻ lệch số dư / thẻ mới thiếu gói | 0 / 0 | 0 / 0 | 0 |
| Số dư thẻ tính sẵn phải sửa | — | 0 | 0 |
| Xung đột với dữ liệu nhập trong app | 0 | 0 | 0 |
Ghi chú: thẻ M24820 có ở AMIA nhưng không còn trên SalonHero (đã biết, đang chờ kế toán xem).
- 08:13 đang chạy: làm mới TOÀN BỘ ghi chú khách SalonHero (bình thường chỉ chạy đêm).
- 08:13 đang chạy: chép thô toàn bộ SalonHero ra `du-phong-salonhero-15-11/` (kho, voucher, hoa hồng, nhân viên, cài đặt, mẫu in…), xong sẽ so số với AMIA.
- 08:2x XONG ghi chú khách (ghi chú riêng CS): SalonHero 13.686 khách / 141.731 ghi chú — AMIA thiếu 0, lệch 0, khách lấy lỗi 0 → **khớp 100%**.

### ĐỢT 1 SỐ ĐÃ CHÉP (09:09) — file Excel: `amia-os/du-phong-salonhero-15-11/DOI-CHIEU-DOT-1.xlsx`
Dự phòng thô SalonHero (897MB JSON, chỉ đọc): `amia-os/du-phong-salonhero-15-11/` · bản Excel từng mục: `amia-os/du-phong-salonhero-15-11/excel/` (đang gộp JSON → xlsx, mỗi mảng 1 tệp).

| Mục | SalonHero | AMIA OS | Lệch | Ghi chú |
|---|---|---|---|---|
| Khách hàng | 13.589 | 13.776 | 0 | **xong**: mọi mã khách SH có trong AMIA (thêm 187 hồ sơ khách đã xoá trên SH nhưng còn đơn/lịch/nhắc, để ẩn) |
| Ghi chú riêng CS | 141.731 | 141.731 | 0 | **xong** |
| Thẻ thành viên | 12.788 | 12.788 | 0 | **xong** (AMIA giữ thêm thẻ đã xoá/hết) |
| Loại thẻ | 348 | 348 | 0 | **xong** |
| Hoá đơn (thanh toán + huỷ) | 82.697 | 82.697 | 0 | **xong**, khớp từng năm; 2.162 phiếu NHÁP không chép |
| Dịch vụ / Người giới thiệu / Voucher / Chi nhánh | 247 / 78 / 0 / 2 | 247 / 78 / 0 / 2 | 0 | **xong** |
| Lịch hẹn | 83.410 | 83.410 | 0 | **xong 09:06**: chép bù 1.174 lịch 2020–2025 (107 lịch của 90 khách đã xoá trên SH → dựng lại hồ sơ khách) |
| Nhắc chăm sóc | 60.292 | 60.292 | 0 | **xong 09:06**: chép bù 56 |
| Nhóm khách / khách thuộc nhóm | 27 / 4.604 | 26 / 4.555 | 0 | **xong**: SH có LUXURY và Luxury trùng tên, AMIA gộp 1 nhóm (49 khách gắn cả hai) |
| Nhân viên | 25 | 25 | 0 | **xong 09:04**: nối Bích Ngọc (NV0113); thêm BS partime Nguyễn Trọng Nhân (Đà Lạt, trạng thái nghỉ) |
| Sản phẩm | 427 | 427 | 0 | **xong 09:04**: thêm 4 SP tạo trên SH 11/11 (đơn vị tạm 'Chai', kho xem lại) |
| Công nợ khách (tiền) | 1.401.142.500 | 1.407.142.500 | 6.000.000 | 142/143 khách khớp từng đồng. Lệch 1: Hà Thị Mỹ Anh (AVI26006336), HĐ SH 26060591 ngày 20/06/2026 — SH đã trả đủ 6.000.000, AMIA còn ghi nợ 6.000.000. **Chờ chị duyệt, chưa sửa (tiền)** |
| Kho nhập / xuất thủ công | 646 / 257 phiếu | 2.182 / 474 dòng | 0 | đã chép 29/10; SH không có phiếu nhập/xuất thủ công mới sau 29/10; 24 dòng xuất của SP đã xoá trên SH không chép |
| Tồn kho, sổ quỹ, điểm, hoa hồng, cài đặt in, đặt lịch online, ảnh khách | xem Excel | | đang soát | cập nhật đợt 2 lúc 09:40 |
Sao lưu trước khi ghi: `sao-luu/db-20261115-0900-bang-truoc-bu-lich-15-11`, `…0901…-truoc-bu-nhac-15-11`, `…0903…-truoc-bu-nhom-sp-nv-15-11`, `…0905…-truoc-kh-xoa-15-11`.
Excel dự phòng: 81 tệp trong `amia-os/du-phong-salonhero-15-11/excel/` (99MB, mỗi mảng 1 tệp: khách, thẻ, hoá đơn từng năm, lịch hẹn từng năm, nhắc, kho, nhân viên, cài đặt in…).

### ĐỢT 2 (09:25)
**Công nợ lệch 6.000.000 — ĐÃ SỬA (chị Flora duyệt 09:2x)**
- Hoá đơn SH 26060591 (20/06/2026), khách Hà Thị Mỹ Anh (AVI26006336). **Gốc lỗi:** ngày 14/11 SalonHero SỬA giảm giá dòng "Radiant Booster" (12.500.000 → 18.500.000, thành tiền 7.500.000 → 1.500.000), hoá đơn từ 12.000.000 còn 6.000.000. Lúc đó hoá đơn đã chuyển sang AMIA (25/10), mà đồng bộ đêm chỉ lấy hoá đơn theo ngày tạo, nên không thấy bản sửa → AMIA vẫn ghi 12.000.000, đã thu 6.000.000, còn nợ 6.000.000. Không phải lỗi "trả nhiều lần".
- Đã sửa AMIA đúng SalonHero: dòng Radiant Booster giảm 18.500.000 / thành tiền 1.500.000; hoá đơn 6.000.000, đã thu 6.000.000, nợ 0. Lần thu 6.000.000 chuyển khoản giữ nguyên, sổ quỹ không đổi.
- Sao lưu dòng trước khi sửa: `sao-luu/sua-hd-26060591-truoc-15-11.json`. Ảnh chứng cứ: `anh-nut-moi-15-11/cong-no-myanh-1-salonhero-phieu.png`, `…-2-amia-truoc-sua.png`, `…-3-amia-sau-sua.png`.
- **Quét TOÀN BỘ 82.697 hoá đơn** (tổng, nợ, từng dòng thành tiền, số đã thu):
  - Hoá đơn trả nhiều lần: 543/543 khớp.
  - 4.254 hoá đơn "lệch tổng" chỉ do cách tính: SalonHero không cộng phần trừ thẻ vào tổng, AMIA có cộng. Đã kiểm từng cái: tổng SH = tổng AMIA − tiền trừ thẻ; dòng hàng và nợ khớp.
  - 38 hoá đơn SH ghi "khách trả" lớn hơn tổng (tiền khách đưa, đã trả lại tiền thừa); AMIA ghi đúng số thu, nợ khớp.
  - **Số hoá đơn bị ảnh hưởng như vụ Mỹ Anh: 1 (chính hoá đơn 26060591).** Sau sửa: tổng nợ AMIA 1.401.142.500 = SalonHero 1.401.142.500, khớp từng khách.

| Mục | SalonHero | AMIA OS | Lệch | Ghi chú |
|---|---|---|---|---|
| Công nợ khách (tiền) | 1.401.142.500 | 1.401.142.500 | 0 | **xong 09:19** |
| Điểm thưởng (số dư từng khách) | 13.589 khách | 13.589 | 0 | **xong 09:10**: 45 khách có điểm từ HĐ tháng 11 chưa vào sổ → thêm dòng điều chỉnh (+7.444 điểm). Hạng + ngưỡng điểm khớp (200/350/500/1.000; 100.000đ = 1 điểm) |
| Tồn kho từng SP × cơ sở | 782 cặp | 782 | 0 | 647 khớp; 135 theo luật đã chốt (67 SP đã xoá trên SH, 67 tồn âm trên SH không ghi, 1 quy đổi đơn vị) |
| Cài đặt hoa hồng | 7 tuỳ chọn | 7 | 0 | khớp từng cái; SH không có hoa hồng riêng theo NV/SP |
| Cài đặt in hoá đơn + lịch hẹn | 36 ô | 36 | 0 | mặc định AMIA = ô tích SH (A5 / 80mm) |
| Sổ quỹ (dòng thu chi tay, gộp mã) | 3.228 | 3.227 | 1 | thiếu 1 dòng (mã SH 616168, tiền mặt Vinh) → đang lấy chi tiết để chép |
| Ảnh đại diện khách | 3.486 | 3.485 tải về máy | 1 | ảnh nằm trên S3 của SalonHero, sắp mất quyền → đã tải về `du-phong-salonhero-15-11/anh-khach/` (264MB); 1 ảnh lỗi |
| Ảnh liệu trình (album khách) | ? | 259.990 (tới 11/08/2026) | đang soát | đã có ở máy + Lark; đang kiểm ảnh SH chụp sau 11/08 |

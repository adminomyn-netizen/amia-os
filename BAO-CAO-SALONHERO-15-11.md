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

# Rà SalonHero ↔ AMIA OS — 15/11/2026 (đợt 1, 07:50)

Nguồn đối chiếu: đọc thẳng SalonHero (chỉ gọi hàm đọc `getSettings`, đọc mẫu in trong mã trang), không bấm Lưu/Xoá/Thanh toán. Lưu ý: **SalonHero hết hạn hôm nay** (màn chính báo "còn 0 ngày"), nên rà trước khi mất quyền đọc.

## 1. Khổ in SalonHero đang dùng (đọc từ cài đặt thật)
| Tờ in | SalonHero (chi nhánh Vinh) | AMIA OS | Kết luận |
|---|---|---|---|
| Hoá đơn | **A5**, 0 bản sao, có logo, thông tin cửa hàng, nhân viên phục vụ, SĐT khách, chữ ký, thu ngân, giờ vào/ra, ghi chú; chân trang "Số tiền thanh toán hoá đơn sẽ KHÔNG HOÀN LẠI…" | Mặc định A5, cùng các ô bật/tắt, cùng câu chân trang | Khớp |
| Lịch hẹn | **80mm**, chân trang "Xin cảm ơn quý khách!…" | Có cấu hình 80mm, **chưa có nút in phiếu lịch hẹn** | Thiếu nút (đang làm) |

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
| In phiếu lịch hẹn (58/80mm/A4) | **Thiếu** |
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

## Link in thử cho chị Thuý
- Hoá đơn: vào https://lammec.mscvn.com/hoa-don → mở một hoá đơn bất kỳ → nút **In** (chỉ in, không đổi dữ liệu).
- Cài đặt mẫu in: https://lammec.mscvn.com/cai-dat/thiet-lap-in

## Nhật ký việc xong
- 07:50 Sửa tờ in bị thu nhỏ/lệch lề khi in (hoá đơn, tạm tính, phiếu làm).
- 08:0x Nút **Gia hạn thẻ**: hàng loạt ở Khách hàng › Khách dùng thẻ (tích chọn như SalonHero); từng thẻ ở hồ sơ thẻ, tab Thẻ dịch vụ của khách, danh sách Thẻ. Chỉ đổi hạn, ghi Lịch sử thẻ, không đụng buổi/tiền (chị Lâm hỏi 07:4x).
- 08:1x Nút **In** có bước **Kết nối máy in** lần đầu trên mỗi máy quầy: hướng dẫn chọn máy in quầy, khổ giấy, lề mặc định, tỉ lệ 100%; ghi tên máy in, lần sau bấm In ra hộp in ngay; nút "Máy in: … · Đổi". Muốn bấm là ra giấy không hiện hộp in: Chrome máy quầy chạy --kiosk-printing (cần cài 1 lần tại máy) (chị Lâm 07:4x).

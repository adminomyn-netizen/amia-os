# Các giả định đang dùng, cần chị Lâm chốt

Mỗi mục là điều em tự đặt để chạy được; chưa có chữ chốt của chị.

| # | Giả định | Ở đâu | Đổi thế nào |
|---|---|---|---|
| 1 | Ngưỡng lệch báo vật tư: 5% | bảng `cau_hinh.nguong_lech_pct` | sửa 1 dòng |
| 2 | Hạng khách theo chi 12 tháng: Bạc ≥ 10tr, Vàng ≥ 30tr, Bạch kim ≥ 100tr, Kim cương ≥ 300tr | bảng `hang_khach` | sửa bảng |
| 3 | Khách "mất" nếu 180 ngày không phát sinh; thẻ "sắp hết" khi còn ≤ 2 buổi | `cau_hinh` | sửa |
| 4 | Doanh thu mỗi buổi = giá thực trả ÷ số buổi, đã chia phần giảm giá cả đơn; thẻ cấp tay tính 0 | hàm `chot_hoa_don` | cần chị xác nhận cách ghi nhận |
| 5 | Phiếu cấp chỉ gồm vật tư nhóm A; nhóm B (theo ngày) và C (theo tuần) chưa có phiếu riêng | hàm `tao_phieu_cap` | làm tiếp giai đoạn sau |
| 6 | Vật tư "bác sĩ chọn theo ca" (đầu tip, filler...) chỉ là phương án trong định mức; số thật do bác sĩ chỉ định lúc ra phiếu | bảng `dinh_muc.chon_theo_chi_dinh` | nhập định mức theo đúng quy ước này |
| 7 | Ma trận quyền 11 vai trò (ai thấy tiền, giá vốn, ảnh da, kho...) | `src/lib/quyen.ts` | sửa 1 file |
| 8 | Khách mua lần đầu bắt buộc có ngày sinh trước khi chốt đơn | `chotDonBanHang` | bỏ nếu không muốn |
| 9 | Bảng màu = Mallard Green #006F62 + vàng đồng #BA9551 theo logo guideline; font Playfair Display + Roboto | `src/app/globals.css` | anh Gia chốt màu khác thì đổi các biến |
| 10 | Hoa hồng: tỉ lệ theo loại × vai, riêng được cho từng mục; chưa cài tỉ lệ nào (đang 0) | màn Hoa hồng | chị cho bảng tỉ lệ thật |
| 11 | File định mức Flora gửi còn lỗi (Thermage gắn sai đầu tip 11tr thay vì 22,27tr, dòng trùng, đơn vị shot/line lệch, 98/140 vật tư chưa có trong danh mục): CHƯA nhập vào hệ thống | — | sửa file rồi dùng "Dán từ bảng tính" ở màn Định mức |
| 12 | Quy ước MÃ sản phẩm: chữ in hoa + số, không dấu cách, 3–24 ký tự; mã mới tự sinh theo nhóm `MP-0001` (mỹ phẩm), `VT` (vật tư), `TH` (thuốc), `QT` (quà), `DC` (dụng cụ), `SP` (khác); mã vạch tách riêng 8–14 chữ số | `src/lib/san-pham.ts`, tab Danh mục > Rà soát sản phẩm | chị/Dung chốt tiền tố; mã cũ (456 sản phẩm) giữ nguyên, sửa dần |
| 13 | Quy ước TÊN: loại hàng + thương hiệu + tên + quy cách, 6–120 ký tự, không viết hoa toàn bộ, không trùng tên khác (không phân biệt hoa thường/dấu) | `src/lib/san-pham.ts` | sửa quy ước trong file |
| 14 | Bán/cấp hàng đã HẾT HẠN bị chặn (phần còn hạn không đủ); chặn bán khi hết tồn mặc định TẮT vì kho mới có 65 dòng sổ cái | cấu hình `kho.chan_ban_khi_het_ton` (0/1) | bật 1 khi kho đã nhập đủ tồn đầu |
| 15 | Nhập kho/nhận hàng bắt buộc hạn dùng cho mọi sản phẩm trừ Quà tặng | cột `san_pham.bat_buoc_han_dung` | tắt từng sản phẩm trong form |


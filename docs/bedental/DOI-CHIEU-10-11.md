# Đối chiếu BeDental ERP ↔ AMIA OS — 10/11/2026

Mục đích: liệt kê MỌI tính năng BeDental (demo.bedental.vn, đọc lại trực tiếp 10/11/2026, chỉ xem) mà AMIA OS chưa có, để giao dev làm. Chi tiết từng màn BeDental nằm ở các file cùng thư mục (`marketing.md`, `cai-dat.md`, …). Nguồn AMIA: `src/lib/module.ts`, `src/lib/nav.tsx`, `src/app/(app)/**`, `supabase/migrations`. Nhân sự đã chuyển MSC OS (31/10) nên để riêng, ưu tiên thấp. Phòng khám da liễu: mục [NHA KHOA] chỉ ghi chú, không tính gap.

Mức: **thiếu hẳn** / **thiếu một phần** / **đủ**. "BeDental cũng chưa xong" = thẻ Sắp có / Đang hoàn thiện hoặc chỉ có API bên BeDental — tách riêng, không xếp hạng như gap thật.

## 0. Tổng số gap theo module

| Module | Thiếu hẳn | Thiếu một phần | Cộng | BeDental cũng chưa xong | Ghi chú |
|---|---|---|---|---|---|
| **Marketing — Hộp Lead** | 12 | 7 | 19 | 0 | gồm Phụ trách lead theo chi nhánh |
| **Marketing — Hộp chat đa kênh** | 21 | 2 | 23 | 0 | gốc: AMIA chưa nhận/gửi tin thật |
| **Marketing — Kết nối kênh / thông báo / gửi hàng loạt** | 7 | 4 | 11 | 2 | |
| **Marketing — Giới thiệu & CTV + cổng CTV** | 10 | 4 | 14 | 2 | |
| **Marketing — Mã ưu đãi / nội dung** | 2 | 1 | 3 | 0 | voucher AMIA đã hơn BeDental |
| Dashboard | 1 | 4 | 5 | 0 | |
| Lịch hẹn | 3 | 3 | 6 | 0 | |
| Khách hàng | 4 | 4 | 8 | 0 | |
| POS / Bán hàng | 0 | 2 | 2 | 0 | |
| Báo cáo | 0 | 5 | 5 | 0 | +1 [NHA KHOA] |
| Văn bản & Hợp đồng | 2 | 5 | 7 | 0 | |
| Tài chính - Kế toán | xem mục 4 | | 13 | 2 | |
| Kho & Mua sắm | xem mục 4 | | 12 | 0 | |
| Nơi làm việc | xem mục 4 | | 8 | 0 | 2 thuộc MSC OS |
| Cài đặt (ngoài Marketing) | 3 | 10 | 13 | 2 | Phụ trách lead đã tính ở Marketing |
| Nhân sự (MSC OS, ưu tiên thấp) | 0 | 7 | 7 | 0 | + 3 mục nên kiểm lại |

Marketing cộng: 52 thiếu hẳn + 18 thiếu một phần = 70 gap (+4 mục BeDental cũng chưa xong).

## 0b. Thứ tự làm đề xuất (toàn hệ thống)
1. Marketing M1 → M3 (kênh chat chạy thật, Hộp chat làm việc nhóm, Hộp Lead pipeline) — xem 1.7.
2. Marketing M4 → M5 (CTV: REF=SĐT trên trang đặt lịch, chi trả hoa hồng, cổng CTV).
3. Marketing M6 (bộ gửi ZNS + thông báo khách + chiến dịch gửi hàng loạt) và Lịch hẹn (khách tự đổi/hủy, trạng thái gửi tin) — hai việc dùng chung bộ gửi.
4. Khách hàng (tài liệu đính kèm, khóa gửi Zalo/consent, gộp hồ sơ), Cài đặt (chính sách duyệt theo thao tác, tài khoản nhiều chi nhánh).
5. Tài chính, Kho, Văn bản, Dashboard, POS, Báo cáo theo danh sách từng mục.
6. Nhân sự ở MSC OS.

## 1. MARKETING (ưu tiên cao nhất)

Nguồn BeDental: `marketing.md` (đọc lại trực tiếp 10/11). Nguồn AMIA: `src/lib/module.ts:153-174`, `src/lib/nav.tsx:23`, `src/app/(app)/marketing/*`, `src/app/(app)/cai-dat/{zalo-sms,voucher,web-dat-lich}`, `src/app/l/[ma]/route.ts`, `src/app/dat-lich/*`, migration `0036_marketing.sql`, `0176`, `0184`, `0206/0215/0253`.

Sidebar: AMIA đã có đủ 12 mục cùng tên, cùng thứ tự (`src/lib/nav.tsx:11-24`). Còn thiếu: huy hiệu số "lịch hẹn hôm nay" trên mục Lịch hẹn, mega menu bay ra khi di chuột, nút ghim thu gọn menu (kiểm lại UI khi làm).

### 1.1 Hộp Lead

| BeDental có | AMIA có chưa (route/file hoặc "thiếu") | Mức | Ghi chú |
|---|---|---|---|
| Kanban 6 cột, kéo thả đổi giai đoạn, đếm lead mỗi cột | `/marketing/lead` chỉ có bảng | thiếu hẳn | |
| Cột tự cấu hình: tên, màu, thứ tự, SLA phút, ngừng dùng (chặn khi còn lead), version, Thắng/Thua cố định | thiếu (trạng thái là CHECK enum 12 giá trị trong `0036`) | thiếu hẳn | cần bảng `lead_giai_doan` |
| Chế độ Bảng có dòng nhập nhanh + sửa tại ô | thiếu | thiếu hẳn | |
| Tìm theo tên/SĐT/mã | thiếu | thiếu hẳn | |
| Lọc: giai đoạn, chi nhánh, phụ trách, hỗ trợ, nguồn giới thiệu, kênh, tác vụ mở, nhắc việc (quá hạn/hôm nay/sắp tới), mức chăm sóc (0–7/8–14/15–29/30+ ngày) | 4 tab Của tôi / Chưa nhận / Tất cả / Đóng, giới hạn 300 dòng | thiếu một phần | |
| Form Thêm lead: tên, SĐT, email, nguồn/kênh, chi nhánh, giá trị dự kiến, ghi chú | có `lead/page.tsx` (tên, SĐT, nguồn, chiến dịch, người giới thiệu, chi nhánh, dịch vụ quan tâm, ghi chú, tự nhận) | thiếu một phần | AMIA thiếu email, giá trị dự kiến; AMIA hơn ở chiến dịch + dịch vụ |
| Thẻ lead: giá trị, "cập nhật N ngày trước", số tệp, avatar phụ trách / "Chưa nhận", số nhắc | bảng có phụ trách + cảnh báo 5 phút | thiếu một phần | |
| Người hỗ trợ (nhiều người) bên cạnh người phụ trách | thiếu | thiếu hẳn | |
| Khung chi tiết lead 5 tab (Thông tin, Hoạt động, Tác vụ, Nhắc việc, Tệp) | thiếu (chỉ có nút hành động trên dòng) | thiếu hẳn | |
| Dòng thời gian hoạt động tự ghi + ghi tay Ghi chú/Gọi/Nhắn tin | `lead_lien_he` có ghi (Ghi liên hệ) nhưng **không hiển thị** ở đâu | thiếu một phần | |
| Tác vụ theo lead (giao cho phụ trách/hỗ trợ, hoàn thành/hủy, hiện ở Việc cần làm) | thiếu | thiếu hẳn | |
| Nhắc việc theo lead (nội dung, thời điểm, nhắc ai, phát thông báo) | `han_tiep` lưu ngày hẹn liên hệ nhưng không nhắc | thiếu một phần | |
| Tệp theo lead (≤5 tải tay, tệp chat tự lưu, nhãn trước/sau điều trị) | thiếu | thiếu hẳn | |
| Hồ sơ khách khớp SĐT: gợi ý, xác nhận tay, hiện số lần đến/hủy/còn nợ | "Thành khách" tự gắn khách cùng SĐT, không có khung | thiếu một phần | |
| Đóng thua theo danh mục lý do, mở lại lead | lý do tự do bắt buộc khi đóng; không mở lại | thiếu một phần | |
| Giá trị dự kiến + trạng thái open/won/lost | thiếu | thiếu hẳn | |
| Nhận lead / giao lead | có (`nhanLead`, `giaoLead`, SLA 5 phút) | đủ | AMIA hơn: SLA 5 phút hiển thị |
| Chống trùng theo SĐT | có (index `lead_sdt_dang_mo`) | đủ | |
| Phụ trách lead theo chi nhánh (tự giao khách mới, nhận cảnh báo) | thiếu | thiếu hẳn | xem thêm gaps Cài đặt |
| Cảnh báo Dashboard "N lead chưa ai nhận" | thiếu ở `/trang-chu`, `/tong-quan` | thiếu hẳn | |
| Tác vụ do AI tạo ("AI tạo · cần xử lý") | thiếu | thiếu hẳn | phụ thuộc AI chat |

### 1.2 Hộp chat đa kênh

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Nhận/gửi tin thật qua webhook (Zalo OA, Messenger…) | `/marketing/hop-thu` có giao diện; `nhanTinDen()` không có webhook gọi; tin trả lời nằm `cho_gui` mãi | thiếu hẳn | gốc rễ, phải làm trước mọi thứ khác của chat |
| Kênh: Zalo OA, Messenger (nhiều trang), WhatsApp, Instagram, LINE, TikTok, Telegram | chỉ khai báo zalo_oa, messenger | thiếu hẳn | AMIA nên làm Zalo OA + Messenger + Instagram trước; TikTok sau |
| Trạng thái nhân viên Sẵn sàng/Tạm vắng/Ngoại tuyến + "Nhận hội thoại mới" | thiếu | thiếu hẳn | |
| Tab Của tôi / Chưa giao / Nhóm / Tất cả, tìm tên/SĐT, lọc chi nhánh, chưa đọc theo từng người | danh sách 200 hội thoại, không tab, không tìm | thiếu hẳn | |
| Nhận xử lý / bỏ nhận, đóng có lý do, mở lại | thiếu | thiếu hẳn | |
| Tag hội thoại (tạo tại chỗ) + nhãn CN/DV/NV/TT trên dòng | thiếu | thiếu hẳn | |
| SLA nhận xử lý / phản hồi theo giờ làm việc, gia hạn | thiếu | thiếu hẳn | |
| Câu trả lời mẫu: phím tắt "/", từ khóa gợi ý, biến, đa ngôn ngữ, phạm vi cá nhân/toàn phòng khám, đếm số lần dùng, "lưu tin này làm mẫu" | `tin_nhan_mau` chỉ cho ZNS nhắc lịch (4 mẫu, tắt) | thiếu hẳn | |
| Gửi/nhận ảnh, tệp, hiển thị ghi âm, vị trí, cảm xúc; trạng thái Đã nhận/Đã xem/lỗi | chỉ chữ, trạng thái Chờ gửi/Đã gửi/Gửi lỗi | thiếu một phần | |
| Luật khung trả lời từng kênh (Zalo 48h, Meta 24h…), tin mẫu trả phí ngoài khung | thiếu | thiếu hẳn | |
| Đặt hẹn ngay trong chat + gửi link lịch hẹn | thiếu | thiếu hẳn | |
| Cột phải: lead của hội thoại (giai đoạn, đánh dấu thua, thêm vào lead / mở lead riêng) | thiếu (có `khach_id` trong schema, chưa dùng) | thiếu hẳn | |
| Liên kết bệnh nhân + quan hệ người nhắn (chính khách/con/vợ chồng/bố mẹ/đại diện) | thiếu | thiếu hẳn | |
| Chi nhánh chính + chi nhánh cùng chăm sóc + chuyển giao chi nhánh có ghi chú | thiếu | thiếu hẳn | AMIA chỉ còn Vinh: ưu tiên thấp |
| Ghi chú nội bộ có @nhắc tên | thiếu | thiếu hẳn | |
| Xuất / xóa dữ liệu chat của khách | thiếu | thiếu hẳn | |
| Quy tắc tự động (sự kiện + điều kiện + hành động, chạy thử, version, thống kê) | thiếu | thiếu hẳn | |
| Phân công & SLA: chia vòng, khách cũ về người cũ, giao lại khi offline, giờ làm việc, ngày lễ, trần tin mẫu/ngày, giữ tin N tháng | thiếu | thiếu hẳn | |
| Việc chủ động: nhắc khách im lặng chưa đặt lịch, mẫu tin có biến, đo khách đặt lịch sau nhắc | thiếu | thiếu hẳn | |
| Nhân viên AI theo kênh (mức 1 hỏi đáp, mức 2 đặt lịch), Tiếp quản, nháp AI, AI đọc nhu cầu/ngân sách/mức khẩn | thiếu (AMIA chỉ có chat AI nội bộ `api/chat-agent`) | thiếu hẳn | |
| Duyệt mẫu AI (chọn ngẫu nhiên 20%/5%, chấm Đạt/Không đạt) + Kịch bản trả lời học từ nhân viên | thiếu | thiếu hẳn | |
| Báo cáo Inbox: được giao, đã đóng, phản hồi đầu trung vị/p90, đạt SLA, lead tạo ra, theo nhân viên/kênh, phân bố | `/marketing/hoi-thoai` (số Pancake đẩy vào: hội thoại, có SĐT, phản hồi đầu trung vị, bỏ lỡ; theo tag/nguồn/giai đoạn/nhân viên) | thiếu một phần | AMIA đang dựa Pancake; khi có Inbox thật thì tính từ dữ liệu thật |
| Phân quyền theo kênh (Xem/Trả lời/Quản lý), sao chép phân quyền | thiếu | thiếu hẳn | |

### 1.3 Kết nối kênh / webhook / thông báo

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Danh sách kênh + trạng thái (Đang hoạt động / Gián đoạn / Tạm dừng / Cần kết nối lại), tạm dừng/tiếp tục/kết nối lại/hủy | `/cai-dat/zalo-sms` tab Kết nối: lưu khóa mã hóa; "Gửi thử" luôn báo chưa gửi được | thiếu một phần | |
| Zalo OA: hạn token, tự gia hạn, cấp quyền lại, kiểm tra kết nối | lưu Access token tay | thiếu một phần | cần OAuth + refresh token tự động |
| Webhook Events (thời gian, kênh, loại, external ID, trạng thái, lỗi, thử lại) | thiếu (không có route webhook, không có bảng sự kiện) | thiếu hẳn | |
| Integration Logs (level, action, message) | thiếu | thiếu hẳn | |
| Đồng bộ bù tin bị lỡ khi kênh gián đoạn | thiếu | thiếu hẳn | |
| Bộ gửi OA/ZNS + hàng đợi (nhịp, đến hạn, lỗi, chưa rõ kết quả) | `tin_nhan_hang_doi` chỉ xem/hủy, không có bộ gửi | thiếu hẳn | |
| Nhóm Zalo nhân viên nhận báo lịch hẹn mới/đổi/hủy (che SĐT) | thiếu | thiếu hẳn | AMIA đang báo qua Lark/Zalo ngoài app |
| Trung tâm thông báo: 11 loại tin khách (lịch mới, định kỳ, đổi, hủy, nhắc lịch, nhắc tái khám, từ chối đổi lịch, sinh nhật, hoàn tất đơn, biên nhận thu nợ, hóa đơn GTGT) mỗi loại có nháp/version, kênh ưu tiên, mẫu ZNS gắn, email song song, xuất bản | `tin_nhan_mau` 4 mẫu (nhac_lich, cam_on, sinh_nhat, tai_kham), tắt; biến {{ten}} {{ngay_hen}}… | thiếu một phần | |
| Lịch sử gửi (15 trạng thái, lọc loại/kênh/ngày/chi nhánh, gửi lại tin lỗi có lý do) | tab Hàng đợi xem/hủy | thiếu một phần | |
| Chiến dịch truyền thông gửi hàng loạt 5 bước (tên → nhóm người nhận → mẫu đã duyệt → thời gian → kiểm tra số người + chi phí), loại khách chưa đồng ý + trùng, maker-checker, đóng băng danh sách | thiếu (có nhóm khách `/khach-hang/nhom` và cờ `khong_gui_zns`) | thiếu hẳn | |
| Mẫu email HTML có version theo nhóm | thiếu | thiếu hẳn | ưu tiên thấp |
| Website form / Facebook-Zalo-Google form / Landing page / Automation CSKH | thiếu (web đặt lịch không tạo lead, không ghi nguồn/UTM) | thiếu hẳn | BeDental cũng chưa xong |
| Facebook (thẻ cài đặt), API keys | thiếu | thiếu hẳn | BeDental cũng chưa xong |

### 1.4 Giới thiệu & CTV

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Bảng nguồn: tên + tên hiển thị + "tự đăng ký · ngày", Mã REF (SĐT), Loại, Số khách, Số đơn, Doanh thu, Hoa hồng, **Chưa thanh toán**, Link/QR, Sửa, Chi tiết; lọc chi nhánh + kỳ; Xuất Excel; KPI tổng hoa hồng | `/marketing/doi-tac`: mã GT+5 ký tự, loại, mức HH mặc định, số lead, đã thành khách, trạng thái; số tiền ở `/hoa-hong?tab=nguon` | thiếu một phần | gom số khách/đơn/doanh thu/HH/chưa trả vào cùng bảng |
| Form nguồn: SĐT di động làm mã REF, tên hiển thị trên trang đặt hẹn, email + công tắc gửi email, loại Đối tác/Nhân viên/Khách | tên, loại (ctv/khach_cu/kol/khac), SĐT, trạng thái, kiểu HH (%/tiền/điểm), giá trị, ghi chú | thiếu một phần | |
| Hoa hồng riêng từng dịch vụ/sản phẩm/thẻ cho mỗi nguồn | chỉnh tay theo dòng ở POS (`hoa_don_dong.gt_*`) | thiếu một phần | |
| Trang chi tiết bút toán của nguồn (HĐ, chi nhánh, DV, DT tính HH, tỷ lệ, HH, loại BT) | RPC `bc_hoa_hong_gioi_thieu_ct` | đủ | kiểm UI có đủ cột |
| Link đặt hẹn có REF=SĐT + QR PNG/SVG tải về + 10 mẫu poster QR | link theo dõi `/l/{ma}` + QR SVG hiện tại chỗ, không tải về, không gắn trang đặt lịch | thiếu một phần | |
| Trang đặt lịch nhận `ref`, lịch hẹn mang người giới thiệu; POS gợi ý người giới thiệu | `/dat-lich` không ghi nguồn; `lead.link_id` không ai ghi | thiếu hẳn | |
| Tracking link chọn nguồn, mã tự sinh | có `/marketing/link` (tên, mã, đích, nguồn, chiến dịch, đối tác, đếm click) | đủ | AMIA hơn: đếm click; thiếu log từng lượt + UTM |
| Chiến dịch giới thiệu (Nháp/Đang chạy/Tạm dừng/Kết thúc, ngày) + báo cáo khách theo chiến dịch | `/marketing/chien-dich` (mục tiêu, ngân sách, duyệt, đã chi) | đủ | AMIA hơn; thiếu báo cáo khách/đơn theo chiến dịch giới thiệu |
| Cây CTV & khách hàng (sắp xếp, chỉ CTV có khách, mở/thu) | thiếu | thiếu hẳn | |
| Quan hệ tuyến trên (hiệu lực từ, kết thúc, chặn vòng lặp/chồng thời gian, cờ đã dùng ledger) | thiếu | thiếu hẳn | |
| Chương trình hoa hồng 1–2 cấp có version, cap/đơn, hiệu lực từ; bút toán theo cấp | 1 cấp, không version (đổi mức chỉ ghi nhật ký) | thiếu hẳn | |
| Cài đặt hoa hồng đối tác tự đăng ký (cấp 1, cấp 2, mức tối thiểu rút) | thiếu | thiếu hẳn | |
| Chi trả hoa hồng: yêu cầu rút (Cần xử lý / Đã chi / Từ chối), xử lý → đã chi / từ chối | thiếu (chỉ báo cáo) | thiếu hẳn | |
| Thông báo email cho CTV (10 loại, bật/tắt, nhật ký gửi) | thiếu | thiếu hẳn | |
| Khiếu nại đối soát | thiếu | thiếu hẳn | |
| Lọc "Mới đăng ký 7 ngày" để rà trước chi trả | thiếu | thiếu hẳn | |
| Cảnh báo gian lận / cảnh báo cây | thiếu | thiếu hẳn | BeDental chỉ có API |
| Duyệt hoa hồng CTV theo đợt / quyết toán | thiếu | thiếu hẳn | BeDental cũng chưa xong |
| Cổng CTV công khai `/ctv`: đăng ký có OTP email, đăng nhập mã email, Tổng quan (HH/đặt hẹn/lượt quét), chiến dịch riêng có link+QR, poster riêng kéo thả QR, e-voucher tặng khách, Tôi đã giới thiệu, Đối soát + yêu cầu rút + khiếu nại, Tuyến dưới (mời, chia %), Hồ sơ | thiếu (`/dang-ky` là đăng ký nhân viên, đang tắt) | thiếu hẳn | |

### 1.5 Mã ưu đãi / nội dung

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Mã ưu đãi: dùng chung / riêng từng khách (sinh, nhập), %/tiền, phạm vi toàn đơn/nhóm DV/DV, đơn tối thiểu, giảm tối đa, tổng lượt, lượt/khách, ngày, chi nhánh; áp ở POS | `/cai-dat/voucher` (đủ và nhiều điều kiện hơn: hạng, nhóm khách, khách mới/cũ, nguồn đặt lịch, khung giờ, thứ) | đủ | AMIA hơn. Nên thêm lối vào từ Marketing |
| Ưu đãi gắn bài đăng (Content Studio: tiêu đề, tóm tắt, ảnh, nội dung, nút hành động, lịch xuất bản/hết hạn, trạng thái Nháp/Đã lên lịch/Đang hiển thị/Hết hạn/Đã ẩn) | thiếu (có `/cai-dat/blog` cho bài viết) | thiếu một phần | |
| Cờ "hiển thị trên app CTV để tặng khách" + ảnh e-voucher có mã vạch | thiếu | thiếu hẳn | đi cùng cổng CTV |
| Zalo Mini App (bảng giá, chi nhánh, tư vấn, ưu đãi, đối tác, tin tức) | thiếu | thiếu hẳn | ưu tiên thấp |

### 1.6 AMIA có mà BeDental không có (giữ lại, đừng bỏ)
Quảng cáo theo ngày (chi phí Meta tự kéo 05:30, giá/tin nhắn, giá/lead) · Báo cáo phễu marketing theo nguồn (lead → liên hệ → đặt lịch → đến → hóa đơn → thực thu, CPL, ROAS) · Nội dung (việc làm content có duyệt, hạn, link bài) · Chiến dịch có mục tiêu 1-trong-4, ngân sách, duyệt · Hội thoại theo ngày từ Pancake · Voucher nhiều điều kiện hơn · SLA 5 phút xác nhận lead.

### 1.7 Danh sách việc cần làm — Marketing (theo thứ tự ưu tiên)

**M1. Kênh chat chạy thật (Zalo OA + Messenger) — nền của mọi thứ.**
- Route webhook công khai `POST /api/webhook/zalo-oa`, `/api/webhook/meta` (xác minh chữ ký, GET verify cho Meta).
- Bảng `su_kien_webhook` (id, kenh, loai, external_id UNIQUE theo kênh để chống ghi trùng, payload jsonb, trang_thai: moi/da_xu_ly/loi/bo_qua, loi, so_lan_thu, tao_luc) + màn "Webhook Events" (lọc kênh; cột Thời gian · Kênh · Loại · External ID · Trạng thái · Lỗi; nút Thử lại) và "Integration Logs" (Thời gian · Kênh · Level · Action · Message).
- Bộ gửi: cron/worker đọc `hop_thu_tin` trạng thái `cho_gui` → gọi API kênh → `da_gui`/`loi` + mã lỗi (khách chặn, hết hạn mức, quá nhanh). Zalo OA: OAuth + tự gia hạn token, hiện "hết hạn lúc / tự gia hạn gần nhất", nút Cấp quyền lại / Kiểm tra kết nối.
- Luật khung trả lời: Zalo 48h, Messenger 24h (+Human Agent 7 ngày); ngoài khung khóa ô soạn và báo rõ.
- Gửi/nhận ảnh + tệp (JPG/PNG/PDF, giới hạn dung lượng theo kênh), hiển thị ghi âm/vị trí/sticker thay vì "tin chưa hỗ trợ".
- Đồng bộ bù khi kênh gián đoạn; trạng thái kênh Đang hoạt động / Gián đoạn / Tạm dừng / Cần kết nối lại.

**M2. Hộp chat làm việc nhóm.**
- Bảng `hop_thu_hoi_thoai` thêm: nguoi_nhan_id, trang_thai (mo/dong), ly_do_dong_id, han_nhan_xu_ly, han_phan_hoi, chi_nhanh_id; bảng `hop_thu_tag`, `hop_thu_ghi_chu` (có @nhắc).
- Cột trái: tab Của tôi / Chưa giao / Tất cả (Nhóm để sau), tìm tên/SĐT, chưa đọc theo từng người, nhãn DV/NV/TT dưới dòng.
- Trạng thái nhân viên Sẵn sàng/Tạm vắng/Ngoại tuyến; nút "Nhận hội thoại mới" (khóa hàng, lấy hội thoại chờ lâu nhất); cài đặt chia vòng cho người Sẵn sàng, khách quay lại về người cũ 30 ngày.
- SLA nhận xử lý / phản hồi (phút) tính trong giờ làm việc lấy từ `/cai-dat/gio-lam-viec`; hiện "Phản hồi trước hh:mm" / "Quá hạn".
- Đóng hội thoại có lý do (danh mục), khách nhắn lại tự mở.
- Câu trả lời mẫu: bảng `cau_tra_loi_mau` (pham_vi ca_nhan/toan_phong_kham, phim_tat, ten, tu_khoa[], noi_dung theo ngôn ngữ, so_lan_dung); gõ "/" trong ô soạn; gợi ý theo từ khóa; biến {ten_khach} {ho_ten_khach} {ten_kenh} {ten_nhan_vien} {ten_phong_kham}; nút "Lưu tin này làm mẫu".
- Cột phải: khách (SĐT ẩn theo quyền), lead (giai đoạn, thêm vào lead / mở lead riêng, đánh dấu thua + lý do), liên kết khách hàng (gợi ý theo SĐT, xác nhận tay, quan hệ người nhắn), ghi chú nội bộ, nút **Đặt hẹn** mở form lịch hẹn điền sẵn khách.
- Phân quyền theo kênh: Xem / Trả lời / Quản lý.
- Báo cáo Inbox tính từ dữ liệu thật: được giao, đã đóng, phản hồi đầu trung vị/p90, % đạt SLA, lead tạo ra, theo nhân viên, theo kênh, phân bố thời gian phản hồi đầu (<1', 1–5', 5–15', 15–60', 1–4h, ≥4h). Giữ `/marketing/hoi-thoai` (Pancake) đến khi thay được.

**M3. Hộp Lead dạng pipeline.**
- Bảng `lead_giai_doan` (ten, mau, thu_tu, sla_phut, la_thang, la_thua, dang_dung, phien_ban); map 12 trạng thái liên hệ hiện có vào 6 cột mặc định (Mới, Đang liên hệ, Tiềm năng, Đã đặt lịch, Thắng, Thua/Đóng) — giữ `trang_thai_lien_he` làm "kết quả liên hệ".
- Kanban kéo thả + chế độ Bảng (cột Mã · Họ tên · SĐT · Email · Chi nhánh · Giai đoạn · Phụ trách · Giá trị dự kiến · Nguồn · Trạng thái open/won/lost · Cập nhật) có dòng nhập nhanh.
- Màn "Cấu hình cột & nguồn": sửa tên/màu/SLA, ↑↓, ngừng dùng (chặn khi còn lead, không ngừng Thắng/Thua), version chống sửa đồng thời; nguồn lead (đã có `nguon_lead`) thêm loại Nguồn ngoài / Đối tác.
- Tìm + lọc: giai đoạn, chi nhánh, phụ trách, người hỗ trợ, nguồn giới thiệu, kênh, còn tác vụ mở, nhắc việc (quá hạn/hôm nay/sắp tới/không có), mức chăm sóc theo ngày từ lần cập nhật (0–7 "Mới cập nhật", 8–14 "Cần chú ý", 15–29 "Lâu chưa chăm sóc", ≥30 "Bỏ quên"). Bỏ giới hạn 300 dòng, phân trang.
- Thêm cột lead: email, gia_tri_du_kien, ket_qua (open/won/lost), cap_nhat_luc; bảng `lead_nguoi_ho_tro` (nhiều người).
- Khung chi tiết lead 5 tab: Thông tin (giai đoạn, email, phụ trách, hỗ trợ, nguồn giới thiệu, hồ sơ khách khớp SĐT có xác nhận + số lần đến/hủy/còn nợ) · Hoạt động (hiển thị `lead_lien_he` + sự kiện hệ thống: tạo, nhận, đổi giai đoạn; ghi tay Ghi chú/Gọi/Nhắn tin) · Tác vụ (`lead_tac_vu`: tên, giao cho người phụ trách/hỗ trợ, hoàn thành/hủy, đẩy sang Nơi làm việc) · Nhắc việc (`lead_nhac`: nội dung, thời điểm, nhắc ai → thông báo đúng giờ; dùng luôn `han_tiep`) · Tệp (≤5 tệp/lead, nhãn Trước/Sau điều trị/Khác; sau này tệp từ chat tự vào).
- Danh mục lý do thua `lead_ly_do_thua` thay cho chữ tự do; cho phép Mở lại lead.
- Cảnh báo "N lead chưa ai nhận" trên Dashboard (`/trang-chu`) + **Phụ trách lead theo chi nhánh** (cài đặt 1 người/chi nhánh: tự nhận lead mới, nhận báo khi tin chưa ai nhận).

**M4. CTV / giới thiệu đầy đủ (AMIA đã có 78 nguồn từ SalonHero).**
- Mã REF = SĐT di động (giữ mã GT cũ làm mã phụ); khi đổi SĐT, mã cũ còn hiệu lực 90 ngày.
- Trang đặt lịch `/dat-lich?ref=<SĐT>` (và `/dat-lich/ref=<SĐT>`): ghi `yeu_cau_dat_lich.nguoi_gioi_thieu_id` + lượt ghé; lịch hẹn và hóa đơn nhận người giới thiệu tự động; POS gợi ý người giới thiệu theo lịch hẹn/khách. Đồng thời tạo lead (nguồn = giới thiệu) — hiện web đặt lịch chưa tạo lead.
- Màn Link/QR theo nguồn: link đặt hẹn có REF, Sao chép, Tải QR PNG/SVG, poster QR theo mẫu AMIA (logo + 3 từ khóa vàng) — làm 2–3 mẫu.
- Bảng nguồn gộp số: Số khách giới thiệu · Số đơn · Doanh thu · Hoa hồng · Chưa thanh toán; lọc kỳ + chi nhánh; Xuất Excel; lọc "Mới đăng ký 7 ngày".
- Form nguồn thêm: tên hiển thị trên trang đặt hẹn, email + công tắc gửi email; tab "Hoa hồng theo dịch vụ" (mức riêng từng DV/SP/thẻ, mặc định lấy mức chung).
- Chi trả hoa hồng: bảng `yeu_cau_rut_hh` (doi_tac_id, so_tien, hinh_thuc chuyen_khoan/tien_mat, ngan_hang, so_tk, ten_chu_tk, trang_thai cho_xu_ly/dang_duyet_chi/da_chi/tu_choi, ly_do_tu_choi); tab Cần xử lý / Đã chi / Từ chối / Tất cả; "đã chi" sinh phiếu chi ở Sổ quỹ; mức tối thiểu được rút (cài đặt), mỗi lúc 1 yêu cầu; từ chối thì tiền quay về số dư.
- Đảo hoa hồng khi hóa đơn hủy/hoàn (bút toán âm), có cột "Loại BT".
- 2 cấp (để sau, khi có CTV thật): `quan_he_tuyen_tren` (child, parent, hieu_luc_tu, ket_thuc_luc; chặn tự làm tuyến trên, vòng lặp, chồng thời gian), `chuong_trinh_hh` (so_cap 1/2, cap1 %/cố định + cap/đơn, cap2, hieu_luc_tu, phien_ban) — sửa sinh version mới, không đổi bút toán cũ.

**M5. Cổng CTV công khai.**
- `/ctv/dang-ky`: họ tên, SĐT (10 số, đầu 03/05/07/08/09), email, đồng ý điều khoản + bảo mật, OTP 6 số qua email (hoặc Zalo ZNS), chặn SĐT đã là CTV; xong hiện mã REF, link, QR, nút chia sẻ. Mức hoa hồng mặc định cho người tự đăng ký lấy từ cài đặt (cấp 1, cấp 2, mức tối thiểu rút).
- `/ctv` đăng nhập bằng mã OTP; mục Tổng quan (hoa hồng, đặt hẹn, lượt quét theo kỳ; link + QR + poster), Tôi đã giới thiệu (lọc Đã đến/Không đến/Đã hủy/Đã có hóa đơn; SĐT che; trạng thái thanh toán HH), Đối soát (kỳ, Xuất Excel, khiếu nại sai lệch, Yêu cầu thanh toán), Hồ sơ (tên hiển thị, email thông báo). Tuyến dưới + chia % + chiến dịch riêng + poster riêng để giai đoạn sau.
- Email/Zalo thông báo CTV: người được giới thiệu đã đặt hẹn / đã dùng dịch vụ / đã hủy, đã thanh toán hoa hồng, tổng hợp hằng ngày 20:00, chào mừng; có bật/tắt từng loại + nhật ký gửi; che tên khách, không ghi dịch vụ.
- Bảng khiếu nại đối soát (CTV, kỳ/dòng, nội dung, trạng thái, xử lý).

**M6. Gửi tin tự động + chiến dịch gửi hàng loạt (sau M1).**
- Bộ gửi ZNS thật cho `tin_nhan_hang_doi`; gắn mẫu ZNS đã duyệt cho từng loại tin; mở rộng loại tin: lịch hẹn mới, đổi, hủy, nhắc lịch, nhắc tái khám (đã có `khach_nhac`), sinh nhật, hoàn tất đơn, biên nhận thu nợ; mỗi loại có nháp/xuất bản và xem trước dữ liệu mẫu.
- Lịch sử gửi: lọc trạng thái (chờ, đang xử lý, đã giao, thất bại, bị chặn, hết hạn, không đủ điều kiện…), loại tin, kênh, ngày; gửi lại tin lỗi có lý do.
- Chiến dịch truyền thông 5 bước: tên → nhóm người nhận (dùng `/khach-hang/nhom`, tự loại `khong_gui_zns` + trùng SĐT) → mẫu khuyến mại đã duyệt → gửi ngay/lên lịch → kiểm tra (số người đủ điều kiện, số tin tính phí) → gửi duyệt; người tạo không tự duyệt (dùng `chinh-sach-duyet`); đóng băng danh sách khi gửi duyệt; theo dõi tiến độ.

**M7. Tự động hóa + AI trong chat (sau M2).**
- Quy tắc tự động: sự kiện (khách nhắn tin / hội thoại mới / lead đổi giai đoạn) + điều kiện (từ khóa, kênh, ngôn ngữ, đã/chưa có người nhận, giai đoạn) + hành động (tạo lead kèm dịch vụ, giao nhân viên, gắn tag, gửi câu trả lời mẫu); mặc định tắt, chạy thử trên hội thoại có sẵn, version, đếm lần chạy/bị chặn/lỗi 30 ngày.
- Việc chủ động: tìm khách đã hỏi mà im lặng N giờ (≤22) chưa đặt lịch → soạn tin nhắc theo mẫu {ten} {nhu_cau} để người bấm Gửi; đo "khách đặt lịch sau khi nhận tin".
- Nhân viên AI theo kênh (mức 1 hỏi đáp giờ/địa chỉ/giá theo bảng giá/giờ trống; mức 2 đặt lịch khi khách đồng ý; chỉ ngoài giờ hoặc mọi lúc), luôn chuyển người ca khẩn/đổi-hủy lịch/giá ngoài bảng/chuyên môn; nút Tiếp quản; nháp AI cho nhân viên duyệt; AI trích Nhu cầu/Muốn đến/Ngân sách/Mức khẩn vào cột phải; duyệt mẫu ngẫu nhiên (20%→5%) Đạt/Không đạt; kịch bản trả lời học từ câu nhân viên sửa. Lưu ý luật AMIA: không hứa quá, không "nhất/100%".

**M8. Để sau / không làm.** Website form, form FB/Zalo/Google, landing page (BeDental cũng chưa xong; AMIA có thể dùng Meta Lead Ads → webhook tạo lead khi làm M1). Zalo Mini App + Content Studio ưu đãi (chỉ làm khi có Mini App). Kênh WhatsApp, LINE, Telegram (khách AMIA là phụ nữ Vinh, ít khách nước ngoài) — để sau; Instagram, TikTok xét sau M1. Nhóm Zalo nhân viên nhận báo lịch hẹn: làm khi đã có OA (tận dụng nếu đang báo qua kênh khác). Chi nhánh cùng chăm sóc / chuyển giao chi nhánh: không cần khi chỉ còn cơ sở Vinh.


## 2. Cài đặt (phần không phải Marketing) và Nhân sự


Nguồn BeDental: cai-dat.md, nhan-su.md (đọc lại trực tiếp 10/11). Nguồn AMIA: `src/lib/module.ts`, `src/app/(app)/cai-dat/*`, `danh-muc`, `nhan-vien`, `hoa-hong`, `the`; HR: `mscgroup-os/src/app/(app)/nhan-su/*` (AMIA `/nhan-su/*` redirect về `/da-chuyen-msc` từ 31/10).
Mức: **thiếu hẳn** / **thiếu một phần** / **có** (đủ tương đương). "BeDental cũng chưa xong" = thẻ Sắp có / Đang hoàn thiện bên BeDental.

### A. Cài đặt (phần không phải Marketing)

| BeDental có | AMIA có chưa (route/file hoặc "thiếu") | Mức | Ghi chú |
|---|---|---|---|
| Thông tin chung: tên, chủ, nhóm kinh doanh, ĐT, email, tên miền, Facebook, website, link WhatsApp, logo | `/cai-dat/thong-tin-chung` (tên thương hiệu, pháp nhân, MST, địa chỉ, ĐT, email, website, giờ mở/đóng cửa, ngày nghỉ tuần, điểm thưởng) | thiếu một phần | thiếu upload logo (dùng trên hóa đơn/email/web đặt lịch), link Facebook / Zalo OA, chủ cửa hàng |
| Khối pháp lý + cấp số văn bản (01/2026/QĐ-BE: số/năm/loại-ký hiệu, đánh số chung toàn công ty) | thiếu (không thấy `ky_hieu`/cấp số trong cai-dat; Văn bản là cụm nội bộ đã chuyển MSC) | thiếu hẳn | ưu tiên thấp cho AMIA; thuộc MSC OS nếu văn bản đi MSC |
| Chi nhánh: bảng 11 cột, lọc 4 trạng thái (Nháp/Hoạt động/Tạm ngưng/Đã đóng), mặc định | `/cai-dat/chi-nhanh` (tên, mã, địa chỉ, phường, TP, quốc gia, mô tả, thứ tự, hoạt động, ẩn/hiện web đặt lịch, giờ làm) | thiếu một phần | thiếu: giấy phép hoạt động, người phụ trách chuyên môn, link Google Maps (có "Xem bản đồ" theo địa chỉ), lat/long, chi nhánh mặc định, trạng thái 4 mức (AMIA chỉ bật/tắt), "Ghi chú địa điểm" hiện ở web đặt lịch |
| Chi nhánh: GPS chấm công (bán kính, bật GPS, cho chấm ngoài bán kính, ngoài bán kính cần duyệt) | thiếu ở AMIA; MSC OS có chấm công GPS (`nhan-su/cham-cong`) | thiếu một phần | thuộc HR → MSC OS (mục C) |
| Web đặt lịch: link, mã nhúng, khung giờ, đặt trước tối thiểu, tối đa / khung, giới hạn ngày, thời lượng mặc định, trạng thái mặc định, ngôn ngữ, màu, khóa trang, sức chứa theo khung, ngày nghỉ theo chi nhánh, email báo lịch mới/đổi/hủy, lịch định kỳ sau hóa đơn | `/cai-dat/web-dat-lich` + `components/cai-dat/WebDatLich.tsx` + `lib/web-dat-lich.ts` (có gần đủ: khung giờ, giới hạn, ngày nghỉ, ngôn ngữ, màu, ảnh bìa, đối tượng nam/nữ, email nhận, `ref=`) | có (gần đủ) | cần kiểm 2 ý: "Tạo lịch hẹn định kỳ sau khi hoàn thành hóa đơn" và "Địa chỉ trang đặt hẹn trên website cho link CTV `/ref=<SĐT>`" (AMIA có chữ `ref=` trong WebDatLich, xác nhận lại luồng gắn CTV vào lịch) |
| Tài khoản ngân hàng: số che, Ngừng sử dụng (không xóa), chứng từ cũ giữ tên+số che; quyền xem/sửa riêng | `/cai-dat/ngan-hang` (che 4 số cuối, mặc định, chức năng chuyển khoản/quẹt thẻ, ẩn, **Xóa**) | thiếu một phần | đổi nút Xóa thành "Ngừng sử dụng" (giữ bản ghi); chứng từ lưu bản sao tên+số che lúc ghi sổ; tách quyền xem / sửa tài khoản ngân hàng |
| Bảng tin công ty: tiêu đề, soạn thảo Trực quan/HTML, hiển thị từ-đến, ghim, Lưu nháp/Xuất bản, Ẩn | `/cai-dat/bang-tin` (tiêu đề, nội dung, ghim, hiển thị từ-đến, trạng thái Chờ/Đang/Hết hạn/Ẩn) | thiếu một phần | thiếu trạng thái Nháp + trình soạn thảo định dạng; email báo bảng tin (mẫu "Nhân viên: bảng tin công ty"). Cụm nội bộ → có thể để MSC OS |
| Danh mục dịch vụ: nhóm cây + đếm, chép từ chi nhánh, nhập/xuất Excel, hướng dẫn; lọc tình trạng 3 mức + nơi hiển thị 4 mức; form 3 tab (giá vốn, đơn vị tính, in giờ phục vụ, sửa giá tại thu ngân, giá theo nhân viên, tùy chọn khác, địa điểm cung cấp) | `/danh-muc?tab=dich-vu` (`danh-muc/page.tsx`, `components/danh-muc/NutTuyChonGia.tsx`, nhập Excel, tên tiếng Anh, giá vốn, VAT, nơi hiển thị, in giờ phục vụ, chi nhánh) | có (gần đủ) | thiếu "Chép từ chi nhánh" (copy danh mục/giá sang chi nhánh khác) |
| Danh mục sản phẩm: nhãn hiệu, quốc gia, dung tích + đơn vị, VAT có "Không chịu thuế/Không kê khai", Mua đứt/Ký gửi, khu vực kho, vật tư tiêu hao chung danh mục | `/danh-muc?tab=san-pham` (nhãn hiệu, dung tích, quy đổi đơn vị mua/dùng, nhóm cấp A/B/C, mã vạch, hạn dùng bắt buộc, hình thức nhập hàng) | có | AMIA còn sâu hơn ở vật tư (định mức, nhóm cấp). Thiếu "Quốc gia" xuất xứ (nhỏ) |
| Loại thẻ dịch vụ: thẻ số lần / số tiền, màu, không giới hạn lần, thời hạn tháng/ngày, nhóm thẻ, thời gian 1 lần, giá trị 1 lần tính hoa hồng, tự tính theo giá/số lần, tự giảm hoa hồng theo giảm giá, chi nhánh áp dụng, nơi hiển thị | `/danh-muc?tab=goi-the` + `/the` (màu thẻ, loại, không giới hạn, giá trị/buổi, giá trị 1 lần tính HH, dịch vụ được dùng thẻ, giá trị nạp) | có | kiểm cờ "Tự động giảm hoa hồng theo tỉ lệ giảm giá khi bán thẻ" (có chữ trong danh-muc/page.tsx; xác nhận đã áp vào tính HH) |
| Cấu hình hoa hồng nhân viên: người x mặt hàng x 3 loại (tư vấn / bán / làm) x %/VND/tùy chỉnh x "khi lập HĐ / theo tiền đã thu"; sao chép, cài đồng loạt | `/hoa-hong/chinh-sach/cai-dat` (chính sách AMIA từ 11/2026: theo nhóm gói, giá KM, giá sàn, mốc doanh số nhân viên/quản lý, gián tiếp, khách mới tự khai thác, trần chi phí QC) + `/hoa-hong` (đến 10/2026) | có (mô hình khác, theo chính sách AMIA) | không cần chép mô hình từng người x từng mặt hàng của BeDental (đã ghi là lỗi thiết kế). Có thể thêm: chọn thời điểm tính "khi lập HĐ / theo thực thu" nếu chính sách cần |
| Thiết lập nâng cao hoa hồng: chia đều khi nhiều người làm, trước/sau giảm giá, giảm dòng vs giảm tổng HĐ, hệ số theo giờ phục vụ, hệ số theo đánh giá khách | `lib/hoa-hong.ts` có xử lý chia (grep "chia đều"); không có màn cấu hình | thiếu một phần | thêm 3 công tắc cấu hình: chia đều / giữ nguyên theo loại; tính trên giá trước/sau giảm; loại giảm giá tính. Hệ số giờ / đánh giá: bỏ (không cần cho AMIA) |
| Cấu hình hoa hồng theo thực thu: xem rule hiệu lực, policy revision (r65), mô phỏng không ghi sổ, trạng thái kỳ | `/hoa-hong/thang`, `/tai-chinh/quyet-toan-hoa-hong` (bảng tính tháng, quyết toán) | thiếu một phần | thiếu: số phiên bản chính sách + lịch sử phiên bản; "Mô phỏng không ghi sổ" (nhập dòng bán → ra hoa hồng từng người). BeDental màn này còn lỗi "Not Found Exception" |
| Cấu hình cap / kỳ khóa / rule version | — | BeDental cũng chưa xong | bỏ qua |
| Chính sách phê duyệt: 3 cấp độ, phạm vi (hệ thống/chi nhánh/module/vai trò), ~33 thao tác x (cần duyệt, lý do, chứng từ, ngưỡng), mức rủi ro, cấm tự duyệt, cảnh báo kỳ đã chốt, SLA giờ, hạn bổ sung nhân viên sau thanh toán | `/cai-dat/chinh-sach-duyet` (ngưỡng tiền theo quy trình MSC + hạn mức duyệt từng người, cấm tự duyệt) | thiếu một phần | thiếu bảng "thao tác nào cần duyệt" theo module (hủy hóa đơn, sửa hóa đơn đã khóa, lùi ngày, sửa SĐT khách, gộp khách, sửa số buổi thẻ, thu hồi thẻ, phiếu thu/chi tay, đảo phiếu, số dư đầu, thu nợ lùi ngày, hủy phiếu thu nợ), cờ bắt lý do / chứng từ, SLA, cảnh báo kỳ đã chốt |
| Tài khoản & phân quyền: liên kết nhân viên 1-1, NHIỀU chi nhánh/tài khoản, 9 cờ quyền mỗi chi nhánh, mẫu vai trò, ~150 quyền / 18 nhóm có nhãn "nhạy cảm" / "theo chính sách phê duyệt", Khóa/Mở, Reset MK, liên kết Zalo | `/nhan-vien`, `/cai-dat/tai-khoan-dang-nhap`, `/cai-dat/vai-tro` (15 vai trò, ma trận vai trò x quyền ~57 quyền, chỉnh quyền riêng từng người, đặt lại mật khẩu, trạng thái làm việc khóa đăng nhập) | thiếu một phần | thiếu: 1 tài khoản nhiều chi nhánh (AMIA: 1 chi nhánh hoặc "Mọi chi nhánh") và cờ quyền theo từng chi nhánh; quyền nhạy cảm tách riêng (xem SĐT, xem email, xem thông tin tài chính, xuất dữ liệu, xem ghi chú y khoa); ô tìm quyền; cột liên kết Zalo |
| Phụ trách lead theo chi nhánh (tự giao khách mới + nhận thông báo tin nhắn chưa ai nhận + lịch mới/đổi/hủy của chi nhánh) | thiếu (không thấy `phu_trach_lead`) | thiếu hẳn | MỚI; nằm ở màn Nhân sự nhưng là luật Marketing/Lịch hẹn — giữ ở AMIA |
| Cấu hình gửi email (Gmail OAuth, lịch sử gửi, 27 nhóm mẫu email có phiên bản + biến, thông báo nhân viên, email gửi lỗi + thử lại) | thiếu cho khách (AMIA chỉ có email tuyển dụng trong `nhan-su/tuyen-dung/email`, đã chuyển MSC); có `/cai-dat/zalo-sms` (mẫu, kênh, gửi tới, trạng thái, hủy chờ gửi) | thiếu hẳn (kênh email) | MỚI. AMIA khách chủ yếu Zalo; email làm sau: hóa đơn, xác nhận/nhắc lịch, sinh nhật |
| Zalo Mini App: cấu hình chung (bảng giá, chi nhánh, giá 0 = Liên hệ, nút tư vấn, OA URL) + CMS nội dung 5 nhóm có trạng thái/lịch/thứ tự | thiếu Mini App; có `/cai-dat/blog` (bài viết) | thiếu hẳn | Mini App để sau; phần CMS ưu đãi xem marketing (fork khác) |
| API keys, Facebook | — | BeDental cũng chưa xong | bỏ qua |
| (AMIA hơn) Giờ làm việc, thiết lập in, ngày-tiền-thuế, voucher, điểm khách, quy tắc kho & hạn dùng, rà soát danh mục, nhân viên phục vụ | `/cai-dat/*` | AMIA có, BeDental không có màn riêng | không phải gap |

Đếm Cài đặt (không gồm Marketing): thiếu hẳn 4 (pháp lý cấp số, phụ trách lead, email Gmail, Mini App) · thiếu một phần 10 · BeDental cũng chưa xong 2.

### B. Nhân sự — phần AMIA giữ (dùng chung bán hàng)
Đã tính trong bảng A: tài khoản / phân quyền / chi nhánh nhiều, hoa hồng nâng cao, phụ trách lead.

### C. Nhân sự — chuyển MSC Group OS (ưu tiên thấp, làm ở `mscgroup-os`)

| BeDental có | MSC OS có chưa | Mức | Ghi chú |
|---|---|---|---|
| Hồ sơ NV: form 5 tab (cá nhân + liên hệ khẩn cấp; công việc nhiều chi nhánh, cờ chấm công từng chi nhánh, phòng ban, chức danh; chuyên môn: chuyên khoa, cấp độ tay nghề, năm KN; phúc lợi: lương CB, phụ cấp, NH, BHXH, BHYT, BHTN, MST, người phụ thuộc, BH nhân thọ/sức khỏe; tài khoản) | `nhan-su/ho-so`, `ho-so/[id]`, `ho-so/nhap`, `giay-to`, bảng `ho_so_nhay_cam` (CCCD, ngân hàng), lương có BHXH + người phụ thuộc (`cong-luong/cau-hinh`) | thiếu một phần | kiểm đủ trường: liên hệ khẩn cấp, cấp độ tay nghề, BHYT nơi KCB/hạn thẻ, BHTN, BH nhân thọ/sức khỏe |
| Trang chi tiết: cảnh báo tuân thủ (thiếu MST/BHXH/BHYT/HĐLĐ), % hồ sơ, 7 tab, nhật ký | không thấy "tuân thủ" / MST | thiếu một phần | thêm khối cảnh báo + % hoàn thiện + nhật ký thay đổi |
| Hồ sơ của tôi (xuất PDF, phân quyền của tôi, danh bạ công ty) | `/tai-khoan`, `nhan-su/ho-so-cua-toi` (AMIA cũ) | thiếu một phần | thêm danh bạ, xuất PDF |
| Ca kíp: tạo ca (giờ, dung sai trễ, nghỉ giữa ca), ngừng sử dụng; phân ca theo khoảng ngày + thứ + danh sách NV, "đối chiếu"; lịch tuần | `nhan-su/ca-kip`, `nhan-su/lich` | có / kiểm | xác nhận phân ca hàng loạt theo thứ trong tuần |
| Chấm công: log (ca sáng/chiều, khoảng cách, phương thức, đối chiếu, OT), nhập công thủ công, OT, chính sách Mini App (GPS / selfie / QR, ngoại lệ có duyệt, bằng chứng) | `nhan-su/cham-cong` (GPS, bán kính, dung sai, OT, theo giờ) | thiếu một phần | thiếu đơn "ngoại lệ chấm công" + "điều chỉnh chấm công" + "đổi ca" có duyệt |
| Đơn nghỉ: 8 loại (có thai sản, thai sản nam, nghỉ bù), 4 kiểu (cả ngày / nửa sáng / nửa chiều / theo giờ), nháp / gửi duyệt, 9 trạng thái; tổng hợp tháng Tính lại / Khoá tháng | `don-tu`, `nhan-su/cham-cong` (Tính lại / Khoá tháng có) | thiếu một phần | không thấy loại "thai sản" → kiểm danh mục loại nghỉ + kiểu nửa ngày/theo giờ |
| Quy trình phê duyệt no-code: điều kiện AND, nhiều bước ↑↓, một người / tất cả, loại người duyệt (cụ thể / chức danh / quản lý trực tiếp / trưởng chi nhánh / trưởng bộ phận / người gửi chọn), ủy quyền, hết hạn giờ, mặc định, 7 nghiệp vụ | `phieu-duyet/cau-hinh`, `don-tu/cau-hinh`, `don-tu/uy-quyen` | có / kiểm | kiểm "hết hạn sau N giờ" và "tất cả phải duyệt" |
| Lương cơ bản theo giờ/ngày/tháng; tạo bảng lương (tháng, chi nhánh, 3 kiểu: lương+HH / chỉ lương / chỉ HH); chi tiết 10 cột + ghi chú tự sinh; trạng thái Đang xử lý / Bị hủy; gửi phiếu lương qua email có duyệt | `nhan-su/cong-luong` (+ `phieu`, `cau-hinh`, `thuong`, `bao-cao`) | có / kiểm | kiểm kiểu "chỉ hoa hồng" và luật chia N/30 khi nghỉ giữa tháng; gửi phiếu lương email có duyệt |
| Email HR: thư hội nhập (nháp → duyệt → gửi, chỉ email đã xác minh), chúc sinh nhật NV 09:00 | `nhan-su/onboarding`, tuyển dụng email | thiếu một phần | thêm chúc sinh nhật tự động + thư hội nhập qua bản nháp |
| Hợp đồng & pháp lý (7 tab, 14 trạng thái, 7 loại HĐ, ký điện tử) | `nhan-su/mau-van-ban`, `giay-to` | thiếu một phần | ký điện tử chưa có |

Đếm HR (MSC OS): thiếu một phần 7 · có/cần kiểm 3 · thiếu hẳn 0.

### D. Danh sách gap ưu tiên (cho developer)

AMIA OS:
1. **Phụ trách lead theo chi nhánh** (thiếu hẳn, MỚI — đã tính ở Marketing 1.1/M3, không đếm lại ở đây). Bảng `chi_nhanh.phu_trach_lead_id` (FK nhan_vien, null). Màn: nút "Phụ trách lead" trên `/nhan-vien` hoặc `/marketing/lead` → hộp mỗi chi nhánh một ô chọn nhân viên ("Chưa chọn"). Luật: lead/hội thoại mới của chi nhánh tự gán người này; thông báo "tin nhắn khách chưa ai nhận" + lịch hẹn mới/đổi/hủy của chi nhánh chỉ gửi người này (+ người được xếp lịch); Chủ/Quản lý tổng luôn nhận; chưa chọn thì gửi tất cả như cũ.
2. **Chính sách phê duyệt theo thao tác** (thiếu một phần). Bảng `chinh_sach_thao_tac(module, ma_thao_tac, muc_rui_ro LOW|MEDIUM|HIGH|CRITICAL, can_duyet bool, bat_ly_do bool, bat_chung_tu bool, nguong_tien numeric null, trang_thai_trien_khai)` + cấu hình chung (`cap_do` 1-3, `cam_tu_duyet`, `canh_bao_ky_chot`, `sla_gio`, `han_bo_sung_nv_gio`). Một hàm `canDuyet(maThaoTac, soTien)` trả "làm ngay" / "vào hàng chờ" dùng ở: hủy hóa đơn, sửa hóa đơn đã khóa, lùi ngày, sửa SĐT/email khách, gộp khách, đổi chi nhánh khách, sửa số buổi/số dư thẻ, thu hồi thẻ, phiếu thu/chi tay, chuyển quỹ, đảo phiếu, số dư đầu, thu nợ lùi ngày, hủy phiếu thu nợ. Giữ bảng ngưỡng tiền + hạn mức người duyệt hiện có.
3. **Tài khoản nhiều chi nhánh + cờ quyền theo chi nhánh + quyền nhạy cảm** (thiếu một phần). Bảng `tai_khoan_chi_nhanh(nhan_vien_id, chi_nhanh_id, mac_dinh, xem, quan_ly, ban_hang, xuat_excel, duyet, bao_cao, tai_chinh, kho, khach_hang)`. Thêm quyền: `khach.xem_sdt`, `khach.xem_email`, `khach.xem_tai_chinh`, `khach.xuat`, `nganhang.xem`, `nganhang.sua`; khi thiếu quyền xem SĐT thì che số ở mọi danh sách. Ô tìm quyền trong màn phân quyền.
4. **Tài khoản ngân hàng: Ngừng sử dụng thay Xóa** (thiếu một phần). Cột `ngung_su_dung_luc`; tài khoản đã ngừng không chọn được khi lập phiếu; phiếu lưu `ten_tk_luc_ghi`, `so_tk_che_luc_ghi`.
5. **Chi nhánh đủ trường** (thiếu một phần): `giay_phep_hoat_dong`, `nguoi_phu_trach_chuyen_mon`, `google_maps_url`, `vi_do`, `kinh_do`, `ghi_chu_dia_diem` (hiện dưới địa chỉ ở web đặt lịch), `mac_dinh` (duy nhất), `trang_thai` (nhap / hoat_dong / tam_ngung / da_dong; tạm ngưng thì ẩn khỏi bộ chọn nhưng giữ dữ liệu). Giấy phép AMIA 1233/NA-GPHĐ in trên hóa đơn / web đặt lịch.
6. **Hoa hồng: cấu hình nâng cao + mô phỏng + phiên bản** (thiếu một phần): 3 công tắc (chia đều khi nhiều người làm theo loại dịch vụ/bán/tư vấn; tính trên giá trước/sau giảm; giảm dòng hay cả giảm tổng HĐ); số phiên bản chính sách + lịch sử; màn "Mô phỏng không ghi sổ" (nhập dịch vụ, giá, giảm giá, người làm/bán/tư vấn → ra hoa hồng từng người theo chính sách hiện hành).
7. **Thông tin chung**: upload logo (dùng ở hóa đơn, web đặt lịch, email), link Facebook / Zalo OA.
8. **Danh mục: "Chép từ chi nhánh"** (copy dịch vụ / giá / nơi hiển thị từ chi nhánh A sang B; chọn ghi đè hay bỏ qua mã trùng).
9. **Bảng tin**: thêm trạng thái Nháp + nút Xuất bản, soạn thảo có định dạng (hoặc chuyển hẳn sang MSC OS vì là nội bộ).
10. **Email giao dịch** (thiếu hẳn, làm sau Zalo): kết nối 1 Gmail công ty (OAuth, token mã hóa), hàng đợi + thử lại + nhật ký (Thời gian, Loại thư, Người nhận che, Trạng thái, Số lần), mẫu email theo nhóm mục đích có phiên bản + danh sách biến được phép + kiểm biến, màn "Email gửi lỗi" (đang chờ / chờ thử lại / đã xếp hàng / hỏng hẳn / chờ lâu nhất).
11. Zalo Mini App (để sau). Pháp lý cấp số văn bản (để MSC OS).

MSC Group OS (ưu tiên thấp): 1) cảnh báo tuân thủ + % hồ sơ + nhật ký; 2) đủ trường phúc lợi/BH/liên hệ khẩn cấp/tay nghề; 3) đơn ngoại lệ chấm công, điều chỉnh công, đổi ca có duyệt; 4) loại nghỉ thai sản / nghỉ bù + kiểu nửa ngày / theo giờ; 5) chúc sinh nhật NV + thư hội nhập qua bản nháp; 6) ký điện tử HĐ.


## 3. Dashboard · Lịch hẹn · Khách hàng · POS · Báo cáo · Văn bản & Hợp đồng


Nguồn BeDental: đọc trực tiếp demo 10/11/2026 (chỉ xem). Nguồn AMIA: mã nguồn `/Users/phamtunglam/project___1140/amia-os` (src/lib/module.ts, src/lib/nav.tsx, src/app/(app)/*, src/components/*). Mức: thiếu hẳn / thiếu một phần / đủ. [NHA KHOA] = riêng nha khoa, không tính là thiếu. "BeDental cũng chưa xong" = demo ghi Sắp có / Đang hoàn thiện.

### 1. Dashboard

| BeDental có | AMIA có chưa (route/file hoặc 'thiếu') | Mức | Ghi chú |
|---|---|---|---|
| Chọn chi nhánh cho bảng | /tong-quan, /trang-chu (src/components/trang-chu/BangDieuHanh.tsx) | đủ | |
| Dải cảnh báo gấp: chờ duyệt, SP sắp hết, lead chưa ai nhận | cảnh báo ở tong-quan (lịch chưa xác nhận, kho dưới tối thiểu, phiếu chờ) | thiếu một phần | thiếu "lead chưa ai nhận" |
| Cảnh báo vận hành 3 mức KHẨN / CẢNH BÁO / THÔNG TIN, bấm tới màn xử lý | danh sách "Cần xử lý" có link | thiếu một phần | chưa có mức độ |
| Bảng tin công ty | BangDieuHanh (tin) + /cai-dat/bang-tin | đủ | |
| Top nhân viên tháng (bục 3 + 5 dòng, điểm) | BangXepHangDep "Top nhân viên tháng này" | thiếu một phần | AMIA xếp theo doanh số; chưa có điểm và lịch hoàn thành |
| Việc cần làm của tôi | /trang-chu, /noi-lam-viec/viec | đủ | |
| 6 KPI (lịch hôm nay, chờ/phục vụ, đã thu, nợ phát sinh, cần duyệt quá SLA, kho thấp) | tong-quan: doanh thu/thực thu hôm nay, lịch hôm nay, công nợ, kho | thiếu một phần | thiếu "cần phê duyệt + quá SLA" dạng KPI |
| Truy cập nhanh + hộp "Tùy biến" ghim chức năng theo người | "Lối tắt" + nút "Tuỳ biến" chỉ dẫn sang /cai-dat | thiếu một phần | chưa lưu ghim theo người |
| Doanh thu 7 ngày (đã thu / hoàn / nợ phát sinh) | biểu đồ 14/30 ngày doanh thu, thực thu | đủ | AMIA chưa tách chuỗi Hoàn tiền |
| Lịch hẹn hôm nay + thẻ TIẾP THEO | "Lịch hôm nay" | đủ | |
| Tỉ lệ doanh thu theo chi nhánh | thiếu (AMIA chủ yếu 1 cơ sở Vinh) | thiếu hẳn | ưu tiên thấp |
| Đèn API Online, nút Hướng dẫn sử dụng (công thức số liệu) | /huong-dan có; đèn trạng thái thiếu | thiếu một phần | |

Gap ưu tiên:
1. Khối "Lead chưa ai nhận": đếm lead trạng thái mới, `nguoi_phu_trach` rỗng; hiện trong dải cảnh báo + thẻ cảnh báo mức CẢNH BÁO khi > 0; bấm → `/marketing/lead?phu_trach=chua_nhan`.
2. Mức cảnh báo: mỗi thẻ có `muc ∈ {khan, canh_bao, thong_tin}`; quy tắc: phê duyệt quá SLA 24h → KHẨN; lead chưa nhận > 0 → CẢNH BÁO; còn lại THÔNG TIN.
3. KPI "Cần phê duyệt" kèm số quá SLA (lấy từ Trung tâm phê duyệt).
4. Tùy biến truy cập nhanh: hộp liệt kê mọi thẻ chức năng trong MODULE (theo nhóm), tích để ghim, lưu bảng `nguoi_dung_ghim(nguoi_dung_id, duong_dan, thu_tu)`, lọc lại theo quyền khi hiển thị.
5. Bảng xếp hạng: thêm cột số lịch hoàn thành, điểm = doanh số (triệu) + hệ số × lịch hoàn thành, ghi công thức trong chú thích.

### 2. Lịch hẹn

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Lưới Ngày/Tuần/Tháng, gom "N lịch từ giờ" | /lich-hen (XemLich, DieuKhienLich) | đủ | |
| KPI hôm nay / tuần / chưa xử lý 30 ngày | KPI hôm nay có; "chưa xử lý 30 ngày" thiếu | thiếu một phần | |
| 7 trạng thái + "Định kỳ chưa xác nhận" | src/lib/lich-hen.ts NHAN_TRANG_THAI (7 trạng thái) | thiếu một phần | thiếu trạng thái riêng cho lịch định kỳ chưa xác nhận |
| Đặt lịch trước / Đến trực tiếp | FormLichHen ("Loại đặt lịch") | đủ | |
| Nhiều khách / lịch, mỗi khách dịch vụ-nhân viên-chỗ | FormLichHen, KhachDiCung, "Phòng / giường" | đủ | |
| Lặp tuần/tháng, buổi x/y | KIEU_LAP ngày/tuần/tháng, lap_thu_tu/lap_tong | đủ | |
| Nguồn đặt (Gọi điện, Messenger, IG, Zalo, WhatsApp, TikTok, Email, Website) | NGUON_DAT (~30 mã SalonHero) | đủ | |
| Gắn CTV / người giới thiệu trên lịch | thiếu trên lịch (có ở POS và hồ sơ khách) | thiếu hẳn | |
| Tình trạng gửi tin (ZNS/WhatsApp/email) trên lịch | thiếu (có hàng đợi tin src/lib/tin-nhan-hang-doi.ts) | thiếu hẳn | |
| Nhật ký thao tác từng lịch (11 loại sự kiện) | /lich-hen/lich-su là danh sách lịch, không phải nhật ký sự kiện | thiếu một phần | |
| Báo cáo lịch hẹn: lọc chi nhánh, trạng thái, nguồn, người tạo, loại khách; Xuất Excel | /lich-hen/lich-su + /api/xuat/lich-hen | đủ | |
| Khách tự tra cứu / đổi / hủy lịch trên web (đổi = chờ duyệt) | /dat-lich chỉ đặt mới; duyệt yêu cầu đặt online có | thiếu hẳn | |
| Giờ trống gợi ý | FormLichHen ("Đang tìm giờ trống…") | đủ | AMIA làm tốt hơn demo |
| In lịch hẹn | NutInLich | đủ | |
| "Vào ghế khám" | [NHA KHOA] | — | AMIA "Đang phục vụ" |

Gap ưu tiên:
1. Khách tự quản lý lịch trên /dat-lich: trang "Lịch hẹn của quý khách" tra bằng SĐT + mã lịch (hoặc OTP Zalo); hiện lịch sắp tới; "Đổi lịch" tạo bản ghi `yeu_cau_doi_lich(lich_id, ngay_gio_moi, trang_thai: cho_duyet|da_duyet|tu_choi|tu_dong|het_han, han)` — lịch cũ giữ tới khi lễ tân duyệt; "Hủy lịch" bắt buộc lý do 5–500 ký tự; lễ tân thấy hàng chờ duyệt cạnh "Yêu cầu đặt lịch online chờ duyệt".
2. Nhật ký sự kiện lịch hẹn: bảng `lich_hen_nhat_ky(lich_id, loai, truoc, sau, nguoi, luc)`, loại: tao, sua, doi_trang_thai, huy, doi_lich, xoa, khach_xin_doi, duyet_doi, tu_choi_doi, yeu_cau_tu_dong, yeu_cau_het_han; nút "Xem lịch sử thao tác" trong form sửa lịch.
3. Khối "Tình trạng gửi tin" trong chi tiết lịch: tin xác nhận / nhắc / đổi / hủy — kênh (Zalo ZNS, SMS, email), lúc gửi, trạng thái (đã gửi / lỗi / khách đã khóa nhận tin).
4. Trường "Người giới thiệu (CTV)" trên lịch (chọn từ /marketing/doi-tac), tự mang sang đơn POS khi mở ca.
5. KPI "Lịch chưa xử lý trong 30 ngày" (lịch quá giờ hẹn vẫn Chưa xác nhận/Đã xác nhận, chưa có kết cục).
6. Trạng thái/cờ "Định kỳ chưa xác nhận" cho buổi lặp tự sinh, chip lọc riêng.

### 3. Khách hàng

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Danh sách + tìm (tên, mã, SĐT, email, mã thẻ, công ty) | /khach-hang (DanhSachKhach.tsx) | đủ | AMIA nhiều bộ lọc hơn |
| Lọc chi nhánh, nhóm, hạng, lần đến, nguồn | DanhSachKhach | đủ | |
| Cột thẻ, hạng, nhóm, nguồn, lần đến, doanh thu | DanhSachKhach | đủ | |
| Menu Thao tác: Sửa / Gộp hồ sơ / Lưu trữ | Sửa có; Gộp thiếu; Lưu trữ thiếu (chỉ Xoá khách nhập nhầm) | thiếu một phần | |
| Form thêm khách 19 trường (Zalo, Facebook, CCCD, nghề, công ty, hạng, người giới thiệu theo SĐT, nguồn, nhóm, địa chỉ 3 cấp, quốc gia) | form hồ sơ (/khach-hang/[id], TaoKhachNhanh) | đủ | kiểm thêm Facebook ID, CCCD |
| Nhóm KH (tên + màu, số khách) | /khach-hang/nhom | đủ | |
| Gần đây + Xuất CSV | /khach-hang/gan-day | thiếu một phần | kiểm nút xuất |
| Thống kê (khách mới, theo ngày, tỉnh, giới tính, nhóm, hạng) | /khach-hang/thong-ke | đủ | |
| Nhập Excel, ghi đè theo SĐT, chọn nhóm | NhapExcelKhach.tsx | đủ | |
| Hồ sơ: thống kê lịch (tổng, hoàn thành, sắp tới, định kỳ, hủy/vắng) | /khach-hang/[id] ("Tổng số lần đặt trước", "hủy/không đến") | đủ | |
| Lịch sử giao dịch + "Gửi hóa đơn" email | Lịch sử giao dịch có; gửi email thiếu | thiếu một phần | |
| Tài liệu đính kèm theo khách (PDF/ảnh ≤ 20MB) | thiếu (ảnh có, tài liệu không) | thiếu hẳn | |
| Phiếu khám có chữ ký điện tử 2 bên, Nháp/Đã phát hành | Phiếu tư vấn (PhieuTuVan.tsx) không chữ ký | thiếu một phần | phần sơ đồ răng [NHA KHOA] |
| Kê đơn thuốc + đơn thuốc mẫu | thiếu | thiếu hẳn | da liễu cần |
| Nhật ký điều trị kèm ảnh, in PDF | "Ghi chú điều trị" + ảnh | đủ | kiểm in PDF |
| CSKH: ghi chú nhanh, ghi chú theo lịch, nút gọi, timeline | /khach-hang/cham-soc, nhắc nhở trong hồ sơ | đủ | |
| Ảnh bệnh nhân | LuoiAnh, TaiAnh, HopCamera | đủ | |
| Liên hệ khẩn cấp / quan hệ gia đình | "Người thân" | đủ | |
| Cây giới thiệu (khách giới thiệu khách) | chỉ hiện người giới thiệu trực tiếp | thiếu một phần | |
| Thẻ dịch vụ trong hồ sơ | "Thẻ liệu trình" | đủ | |
| Thiết đặt thông báo: khóa gửi Zalo, ghi nhận dừng tin, đồng ý quảng cáo có bằng chứng | thiếu | thiếu hẳn | |
| Điểm thưởng | "Điểm thưởng", "Ghi điểm" | đủ | |
| % hoàn thiện hồ sơ | thiếu | thiếu hẳn | nhỏ |

Gap ưu tiên:
1. Gộp hồ sơ trùng: chọn hồ sơ chính + hồ sơ phụ (gợi ý theo trùng SĐT/tên), xem trước số hóa đơn/lịch/thẻ/ảnh/ghi chú/điểm sẽ chuyển; chuyển toàn bộ khóa ngoại sang hồ sơ chính, hồ sơ phụ thành `da_gop_vao = <id>` (không xóa), ghi nhật ký; quyền riêng `khach.gop`.
2. Lưu trữ khách: cờ `luu_tru_luc`, ẩn khỏi danh sách mặc định, lọc "Đã lưu trữ", khôi phục được.
3. Kê đơn thuốc: bảng `don_thuoc(khach_id, lan_kham, bac_si, ngay, loi_dan)` + `don_thuoc_dong(thuoc, ham_luong, so_luong, don_vi, cach_dung, so_ngay)`; mẫu đơn (`don_thuoc_mau`) tạo từ một đơn, tìm theo tên mẫu/thuốc; in đơn A5; mã đơn tự sinh.
4. Phiếu khám/tư vấn có chữ ký: ô vẽ chữ ký bác sĩ + khách (canvas → ảnh), trạng thái Nháp / Đã phát hành / Hết hạn; phát hành khi đủ 2 chữ ký; khối "Tiền sử" dạng ô tích (dị ứng thuốc, thai kỳ, bệnh nền, đang dùng thuốc…) thay sơ đồ răng.
5. Tài liệu đính kèm theo khách: tải PDF/ảnh ≤ 20MB, loại (Cam kết, Phiếu đồng ý, CCCD/Passport, Bảo hành, Khác), xem/tải/xóa có lý do.
6. Thiết đặt thông báo theo khách: công tắc khóa Zalo/ZNS, SMS, email; ghi nhận "khách yêu cầu dừng" (ngày, người ghi, kênh); đồng ý nhận tin ưu đãi/sinh nhật kèm bằng chứng (ảnh/tin nhắn); hàng đợi tin phải kiểm cờ trước khi gửi.
7. Cây giới thiệu: tab "Khách liên quan" hiển thị khách do người này giới thiệu (đệ quy 2 cấp) kèm doanh thu.
8. Gửi hóa đơn qua email từ lịch sử giao dịch; % hoàn thiện hồ sơ.

### 4. POS / Bán hàng

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Danh sách "Chờ thanh toán" (mã, khách, giá trị, trạng thái, thời gian, tổng đã thu) | /ban-hang (Pos.tsx "Chờ thanh toán", "Các đơn đang mở") | đủ | |
| Dòng hàng: SL, giảm giá dòng, nhân viên | Pos.tsx (giảm % / tiền dòng, sửa đơn giá) | đủ | |
| Nhân viên theo vai Phục vụ / Tư vấn + mức hoa hồng | Pos.tsx (VAI, chia %) | đủ | AMIA chia % người hưởng |
| Mã ưu đãi (không cộng dồn) | HopVoucher.tsx | đủ | |
| Điểm thưởng | đổi điểm trong Pos | đủ | |
| Nợ cũ + nút Thu nợ ngay trên đơn | thu nợ ở /hoa-don và báo cáo nợ; POS thiếu | thiếu một phần | |
| 13 hình thức thanh toán + Nhiều hình thức | tiền mặt, chuyển khoản (chọn TK), quẹt thẻ, ví điện tử (chọn ví), thẻ tiền | đủ | |
| Tiền khách đưa + gợi ý + trả lại | "Tiền khách đưa", "Vừa đủ", "Thu thừa" | đủ | |
| Ngày thu tiền nhập bù (mỗi khoản một ngày thực trả) | "Lùi ngày hoá đơn" (cả đơn) | thiếu một phần | |
| Thêm phí | "Phụ phí và tip" | đủ | |
| In song ngữ Việt – Anh | "Ngôn ngữ bản in" | đủ | |
| Chế độ sửa hóa đơn có giữ vết (dòng đảo + "Đã sửa ngày") | "Mở lại để sửa" (ghi đảo) | đủ | |
| Ràng buộc phiếu khám → tính hoa hồng | [NHA KHOA]/quy định riêng | — | |

Gap ưu tiên:
1. Ngày thu nhập bù theo khoản: trong hộp thu tiền thêm `ngay_thu` (datetime, ≤ hiện tại, ≥ ngày hóa đơn, không vào kỳ đã khóa); sổ quỹ / hoa hồng thực thu ghi theo ngày này; cờ "nhập bù" để lọc ở danh sách hóa đơn; không gửi tin cho khách.
2. Thu nợ ngay tại POS: khi chọn khách còn nợ, hiện "Khách còn nợ X" + nút Thu nợ mở hộp chọn hóa đơn nợ (dùng lại hộp thu nợ của /hoa-don).

### 5. Báo cáo

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Danh sách hóa đơn + 15 bộ lọc | /hoa-don (LocHoaDon.tsx) | đủ | thiếu lọc "thu tiền nhập bù" |
| Doanh thu theo ngày (chu kỳ Ngày/Tuần/Tháng/Quý; thu theo hình thức tách bán mới/thu nợ; nợ; thẻ; voucher; tip; VAT; chi) | /bao-cao tab doanh-thu | thiếu một phần | thiếu chọn Tuần/Quý |
| Theo chi nhánh | tab chi-nhanh | đủ | |
| Theo khách hàng (khách mới / quay lại, DS TB/khách) | tab khach-hang | thiếu một phần | thiếu tách mới/quay lại |
| Theo nhân viên (4 vai) | tab nhan-vien | đủ | |
| Theo thu ngân | tab thu-ngan | đủ | |
| Theo SP/DV (Tất cả/Dịch vụ/SP/Bán thẻ/Dùng thẻ) | tab "Theo dịch vụ, sản phẩm" | đủ | |
| Thống kê khách hàng | /khach-hang/thong-ke | đủ | |
| Thống kê đặt lịch (nguồn, trạng thái, khung giờ, người tạo) | tab "Đặt lịch" (BaoCaoMoi) | thiếu một phần | thiếu lọc người tạo |
| Khách hàng nợ (tuổi nợ 4 nhóm, KPI >30/>90, thu nợ) | tab "Khách còn nợ" + /tai-chinh/cong-no-khach (6 nhóm tuổi nợ) | đủ | nên nối 2 màn |
| Thống kê sử dụng dịch vụ | tab "Thống kê sử dụng d.vụ" | đủ | |
| Danh sách phiếu khám | thiếu | [NHA KHOA] / thiếu hẳn | làm khi có phiếu khám da liễu |
| Báo cáo thẻ dịch vụ (lọc loại, tình trạng 7 mức, KPI giá trị thẻ) | tab "Thẻ còn dư", /khach-hang/dung-the, /the | đủ | |
| Hoa hồng nhân viên (theo vai, Tính lại) | /hoa-hong/thang | đủ | |
| Hoa hồng thực thu | tab "Hoa hồng thực thu" | đủ | |
| Hoa hồng giới thiệu | tab "Hoa hồng giới thiệu" | đủ | chi tiết ở marketing |
| Giờ làm nhân viên | MSC OS | — (HR) | |
| Nhập xuất kho | tab "Nhập xuất kho hàng" | đủ | |
| Bán sản phẩm (giá vốn, LN, biên, thiếu giá vốn) | tab "Sản phẩm đã bán" (BaoCaoKho có giá vốn, lợi nhuận %) | đủ | thiếu cờ "thiếu giá vốn" |
| Sổ quỹ thu/chi | /tai-chinh/so-quy | đủ | |
| Bảng lương, Đánh giá NV, Nhập kho, Tồn theo lô, Chi phí dịch vụ, HĐ đầu vào, Công nợ NCC, Quyết toán CTV | BeDental cũng chưa xong | — | AMIA đã có đa số (nhập kho, tồn lô, chi phí DV, đánh giá NV, HĐ đầu vào) |

Gap ưu tiên:
1. Theo khách hàng: KPI "Số khách mới" / "Số khách quay lại" (khách mới = hóa đơn đầu tiên trong kỳ) kèm doanh số, "Doanh số TB / khách"; cột Loại khách.
2. Doanh thu theo ngày: nút chu kỳ Ngày / Tuần / Tháng / Quý (gom nhóm theo date_trunc).
3. Thống kê đặt lịch: lọc người tạo; số khách distinct.
4. Lọc "Thu tiền nhập bù / sửa ngày thu" ở danh sách hóa đơn (sau khi có gap POS 1).
5. Cờ "Thiếu giá vốn" + cột "Nguồn giá vốn" ở Sản phẩm đã bán.

### 6. Văn bản & Hợp đồng

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| KPI: Tổng, Sắp hết hiệu lực, Hết hiệu lực, Công khai Wiki | /van-ban (tab Cần xử lý) | thiếu một phần | thiếu thẻ KPI bấm lọc |
| Tab Văn bản đến / đi / Hợp đồng / Đối tác | NHOM_VB khách/đối tác/nội bộ/chính sách (src/lib/van-ban.ts) | thiếu một phần | phân loại khác |
| 12 loại văn bản có mã | "Loại văn bản" có | thiếu một phần | kiểm danh mục mã |
| Lọc loại, trạng thái, chi nhánh, hiệu lực từ–đến, tìm theo MST | /van-ban/danh-sach | thiếu một phần | thiếu lọc khoảng ngày, MST |
| Tải bản scan PDF (nhiều tệp, 40MB, tự nén, kiểm an toàn, xem trước) | chỉ "Link bản điện tử (https://…)" + vị trí bản giấy | thiếu hẳn | |
| Ban hành & cấp số tự động, khóa nội dung | luồng duyệt + "Ghi nhận đã ký"; cấp số thiếu | thiếu một phần | |
| Gia hạn hiệu lực bắt buộc phụ lục + lịch sử gia hạn | "Tạo phiên bản mới", "dùng tạm" | thiếu một phần | |
| Đối tác có MST/CCCD, địa chỉ, email | dùng /kho-mua-sam/nha-cung-cap | thiếu một phần | |
| Giá trị + tiền tệ (VND/USD/EUR) | "Giá trị (nếu có)" | thiếu một phần | thiếu tiền tệ |
| Nơi lưu trữ | "Vị trí lưu bản giấy" | đủ | |
| Phạm vi xem chi nhánh + mức bảo mật (Thường/Nội bộ/Mật/Hạn chế) | Chi nhánh có; mức bảo mật thiếu | thiếu một phần | |
| Công khai lên Wiki (tự ẩn khi hết hạn) | /noi-lam-viec/wiki riêng | thiếu hẳn | |
| Xóa tệp/hồ sơ bắt buộc lý do, giữ vết | "Huỷ văn bản" có lý do | đủ | |
| Duyệt văn bản (nháp → chờ duyệt → duyệt → ký) | có (TT_VB) | đủ | AMIA hơn demo |
| Đồng ý dùng ảnh khách | /van-ban/dong-y-anh | đủ | AMIA riêng, demo không có |

Gap ưu tiên:
1. Tải tệp PDF lên kho (Supabase Storage): nhiều tệp/hồ sơ, ≤ 40MB/tệp, xem trước trong trang, tải về, xóa tệp có lý do; trường "Bản scan" bắt buộc khi chuyển sang "Đã ký".
2. Cấp số tự động khi ban hành văn bản đi: mẫu `{stt:02}/{năm}/{mã loại}-AMIA`, đếm riêng theo loại + năm, sau khi cấp khóa nội dung (chỉ sửa qua phiên bản mới / phụ lục).
3. Gia hạn hiệu lực: hộp "Gia hạn" (ngày hết hạn mới hoặc không thời hạn, tệp phụ lục PDF bắt buộc, ghi chú) → bảng `van_ban_gia_han`; hiển thị "Lịch sử gia hạn".
4. Phân nhóm Văn bản đến / đi / Hợp đồng (thêm trường `chieu ∈ {den, di, hop_dong}`), văn bản đến có "Số đến" + "giao xử lý cho".
5. Danh mục đối tác dùng chung có MST/CCCD (kiểm 10/13/12 số), địa chỉ, email, trạng thái; liên kết NCC.
6. Mức bảo mật hồ sơ: `muc_mat ∈ {thuong, noi_bo, mat, han_che}`; Hạn chế = chỉ người được cấp; Mật = quản lý trở lên.
7. Thẻ KPI bấm lọc; lọc khoảng ngày hiệu lực; tiền tệ cho giá trị; công tắc "Công khai trên Wiki" (chỉ khi đã ban hành, tự ẩn khi hết hiệu lực).

### Đếm gap (không tính [NHA KHOA], không tính mục BeDental cũng chưa xong)
- Dashboard: 5 (1 thiếu hẳn nhỏ: tỉ lệ theo chi nhánh; còn lại một phần)
- Lịch hẹn: 6 (3 thiếu hẳn: khách tự đổi/hủy, tình trạng gửi tin, CTV trên lịch)
- Khách hàng: 8 (4 thiếu hẳn: kê đơn thuốc, tài liệu đính kèm, thiết đặt thông báo/khóa Zalo, % hoàn thiện; + gộp hồ sơ, lưu trữ, phiếu có chữ ký, cây giới thiệu một phần)
- POS: 2 (thiếu một phần)
- Báo cáo: 5 (thiếu một phần) + 1 [NHA KHOA]/chờ phiếu khám
- Văn bản & Hợp đồng: 7 (2 thiếu hẳn: tải PDF, công khai Wiki)


## 4. Tài chính - Kế toán · Kho & Mua sắm · Nơi làm việc


Quy ước Mức: **thiếu hẳn** / **thiếu một phần** / **đủ** (AMIA bằng hoặc hơn). "BeDental cũng chưa xong" = thẻ demo nhãn Sắp có / Đang hoàn thiện. [NHA KHOA] = bỏ. Đường dẫn AMIA tính từ `src/app/(app)/`.

### A. Tài chính - Kế toán

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Sổ quỹ 3 tab (tiền mặt / ngân hàng / loại thu-chi), KPI 2 hàng, số dư chạy, xuất Excel | `tai-chinh/so-quy` (3 tab, KPI tồn đầu/cuối/hiện tại + tổng thu/chi/nạp/rút, số dư chạy, `/api/xuat/so-quy`) | đủ | |
| Bảng sổ quỹ 12 cột (có Hình thức, Người nhận tiền) | so-quy có Ngày, Chi nhánh, Mã HĐ, Khách, Người thu/chi, Loại, Phân loại, Nội dung, Người nhận, Số tiền, Số dư | thiếu một phần | Thiếu cột + lọc **Hình thức** (tiền mặt/CK/thẻ/ví) |
| Lọc theo từng quỹ / từng tài khoản ngân hàng | Có tách quỹ ngân hàng (`TachQuyNganHang`) | thiếu một phần | Kiểm lại: cần select "Tất cả quỹ / từng quỹ" |
| Loại phiếu "Thiết lập số dư ban đầu" + cảnh báo "a/b quỹ đã nhập số dư ban đầu" | thiếu | thiếu hẳn | Tồn quỹ đầu kỳ AMIA tính từ sổ, không có mốc số dư ban đầu |
| Cảnh báo "N khoản thanh toán chưa vào Sổ quỹ" + danh sách | thiếu | thiếu hẳn | Đối soát thanh toán hoá đơn ↔ dòng sổ quỹ |
| Mặc định ẩn phiếu đảo + cặp thu↔hoàn cùng hoá đơn, hộp tích "Hiện phiếu đã xóa / đã hoàn" | Có đảo phiếu (nhãn "· đã đảo"), lọc `da` | thiếu một phần | Thêm luật ẩn cặp thu↔hoàn khỏi tổng |
| Xóa phiếu = phiếu đảo + Lý do, qua phê duyệt (Nghiêm trọng) | Đảo phiếu có xác nhận, không qua duyệt | thiếu một phần | Xem gap "thao tác nhạy cảm" ở mục C |
| Phiếu thu/chi tay đi qua duyệt trước khi ghi sổ | Chi theo đề xuất đã duyệt + ngưỡng tiền (`cai-dat/chinh-sach-duyet`); phiếu tay ghi thẳng | thiếu một phần | |
| Hộp "Chi tiết chứng từ Sổ quỹ" (khối bút toán, link hoá đơn gốc, hồ sơ duyệt) | thiếu (chỉ dòng bảng) | thiếu hẳn | |
| In phiếu thu/chi; In 2 liên A4; "In phiếu sau khi lưu" | thiếu (in chỉ có ở hoá đơn) | thiếu hẳn | |
| Mã phiếu tự sinh PT/PC + năm + chữ + số | so-quy có `r.ma` | đủ | Kiểm định dạng mã |
| Danh mục loại thu/chi dùng chung, loại hệ thống khoá, tạo / sửa / ngừng dùng | tab Phân loại (thêm, "Đang dùng", "Hệ thống tự ghi, không sửa") | đủ | |
| Chuyển quỹ / Nạp / Rút (không tính vào tổng thu/chi) | Có cả 3 | đủ | |
| Khoá kỳ theo tháng | `tai-chinh/khoa-ky` (rà việc treo trước khi khoá, nhật ký, mở lại có lý do) | thiếu một phần | Thiếu phạm vi **theo chi nhánh**, thiếu cột Số bút toán; AMIA hơn ở phần rà việc treo |
| Đối soát bán hàng net theo sản phẩm (5 KPI, 11 cột: SL bán/trả/net, giá vốn net, DT gộp/trả/net, LN net, biên LN, đối soát) | `tai-chinh/doi-soat` (Bán, Doanh thu, Đã huỷ, Xuất kho, Giá vốn, Chênh lệch; KPI 4) | thiếu một phần | Thiếu **SL trả / DT trả** (trả hàng), LN net, Biên LN %, Xuất Excel |
| Công nợ khách hàng (BeDental: Sắp có) | `tai-chinh/cong-no-khach` (6 nhóm tuổi nợ, trạng thái nhắc/cam kết/tranh chấp) | đủ | AMIA hơn demo |
| Công nợ NCC (BeDental: Đang hoàn thiện) | `kho-mua-sam/cong-no` | đủ | |
| Hoá đơn đầu vào, Hoá đơn điện tử (BeDental: Sắp có) | `tai-chinh/hoa-don-dau-vao`, `tai-chinh/hoa-don-dien-tu` | đủ | AMIA hơn |
| Quyết toán hoa hồng CTV (BeDental: Đang hoàn thiện) | `tai-chinh/quyet-toan-hoa-hong` (hoa hồng NV theo tháng) | thiếu một phần | Phần CTV/giới thiệu thuộc Marketing; BeDental cũng chưa xong |
| Payroll posting (Sắp có) | — (lương ở MSC OS) | BeDental cũng chưa xong | Bỏ |
| Bút toán kế toán Nợ/Có (Đang hoàn thiện) | thiếu | BeDental cũng chưa xong | Để sau |
| Tài khoản ngân hàng che số, ngừng dùng | `cai-dat/ngan-hang` | đủ | |
| Trang Hướng dẫn mục (thuật ngữ, quy trình, lỗi hay gặp, known gaps) | `huong-dan` chung | thiếu một phần | Thêm nút Hướng dẫn theo từng mục |
| Ngân sách tháng theo phân loại chi | `tai-chinh/ngan-sach` | AMIA có, BeDental không | |

Số gap: 13 (4 thiếu hẳn, 9 thiếu một phần) + 2 "BeDental cũng chưa xong".

Ưu tiên:
1. **Số dư ban đầu từng quỹ** — thêm loại phiếu `so_du_ban_dau` (1 lần/quỹ, ngày chứng từ, số tiền, ghi chú; người có `quy.ghi` + duyệt). Tồn đầu kỳ = số dư ban đầu + phát sinh trước kỳ. Banner trên KPI: "Mới có a/b quỹ nhập số dư ban đầu — tồn quỹ có thể lệch" + nút mở form.
2. **Cảnh báo thanh toán chưa vào sổ quỹ** — truy vấn thanh toán hoá đơn (thu/hoàn) không có dòng sổ quỹ tương ứng; banner "Cần đối soát: N khoản (X đ)" + bảng gập: Ngày | Hoá đơn | Chi nhánh | Loại (Thu/Hoàn) | Hình thức | Số tiền | Tình trạng; nút ghi bù.
3. **In phiếu thu/chi** — mẫu A5/A4, tuỳ chọn 2 liên (lưu sổ / giao người nộp-nhận), ô tích "In sau khi lưu"; dùng chung khung in hoá đơn (`components/hoa-don/NutIn`).
4. **Hộp chi tiết chứng từ** — Mã, Loại (Phiếu thu/chi/nạp/rút/chuyển), Ngày, Chi nhánh, Phân loại, Người nộp/nhận, Nội dung, khối "Bút toán" (quỹ, chiều, số tiền), link hoá đơn gốc, nút In / Đảo.
5. **Lọc + cột Hình thức** trên sổ quỹ; lọc từng quỹ/tài khoản.
6. **Đối soát net**: thêm SL trả, DT trả, LN net, Biên LN %, nút Xuất Excel; công thức in dưới bảng.
7. **Khoá kỳ theo chi nhánh**: khoá (tháng × chi nhánh) + "toàn hệ thống"; lý do khi khoá; cột "Số chứng từ trong kỳ".
8. **Ẩn cặp thu↔hoàn cùng hoá đơn** khỏi bảng và tổng khi chưa tích "Hiện phiếu đã xóa / đã hoàn".
9. Hướng dẫn theo mục (ngăn kéo bên phải: mục đích, thuật ngữ, các bước, lưu ý, lỗi hay gặp).

### B. Kho & Mua sắm

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Danh mục kho: mã, tên, 6 loại (retail/internal/quarantine/damaged/return_supplier/transit), chi nhánh, cờ "cho phép bán", hoạt động | Kho cố định theo chi nhánh: hàng bán (`kho/hang-ban`) + nội bộ (`kho/noi-bo`) | thiếu một phần | Không có bảng kho/loại kho; thiếu kho hỏng/hủy, trả NCC |
| Tổng quan: 3 KPI (số kho, dòng tồn, giá trị tồn avg) | `kho` + `kho/hang-ban` (tổng giá trị kho theo giá nhập TB) | đủ | |
| Tồn kho theo (SP, kho, lô), lọc chi nhánh + kho, giá vốn avg | `kho` (Mã, Vật tư, Nhóm cấp, Tồn, Tối thiểu, Giá trị), tab Lô & hạn dùng | đủ | AMIA có thêm tồn tối thiểu, hạn dùng |
| Tồn giữ chỗ / tồn khả dụng; chặn chuyển/xuất vượt khả dụng | thiếu | thiếu hẳn | Chỉ có một số tồn |
| Ledger: Mã GD, Loại nghiệp vụ, SP, Kho, Nhập, Xuất, **Trước, Sau**, Thời gian; lọc chi nhánh + kho | `kho?tab=so` (Lúc, Việc, Vật tư, Lô/hạn, Người ghi, Ghi chú, Số lượng) | thiếu một phần | Thiếu cột Trước/Sau (tồn trước-sau), mã GD, lọc kho |
| Phiếu nhập: Nháp → Đang nhận → Kiểm QC → Đã ghi sổ / Hủy; dòng Barcode, Lô, HSD, **Nhận / Đạt / Lỗi**, Giá nhập | `kho/phieu-nhap` (SL, tổng tiền nhập, lô, hạn, ngoại lệ hạn <90 ngày) ghi thẳng | thiếu một phần | Thiếu trạng thái nháp, Đạt/Lỗi (QC), nhiều dòng một phiếu |
| Quét mã vạch khi nhập/chuyển; tự gắn mã vạch lạ vào sản phẩm | In mã vạch (`danh-muc/in-ma-vach`), quét ở POS | thiếu một phần | Chưa quét ở nhập kho |
| NCC: Mã, Tên, SĐT, MST, Công nợ | `kho-mua-sam/nha-cung-cap` (+ người liên hệ, địa chỉ, hạn thanh toán) | đủ | AMIA hơn |
| PR tách PO: PR (ưu tiên, Nháp/Chờ duyệt/Đã duyệt/Từ chối/Đã tạo PO/Hủy) → "Tạo PO từ PR" chọn NCC | Đề xuất mua sắm (`noi-lam-viec/de-xuat?tab=mua-sam`) → "Lập đơn mua" từ trung tâm duyệt | đủ | Thiếu trường **Ưu tiên** trên PR, dòng sản phẩm trong PR |
| PO: Nháp/Chờ duyệt/Đã duyệt/Đã gửi NCC/Nhận một phần/Đã nhận đủ/Đã đóng/Hủy; Gửi NCC; Đóng thủ công | `kho-mua-sam/mua-hang` (Nháp/Chờ duyệt/Đã duyệt/Đang nhận hàng/Đã nhận đủ/Đã huỷ, báo giá) | thiếu một phần | Thiếu "Đã gửi NCC", "Đóng thủ công" (đóng khi nhận thiếu), VAT/chiết khấu dòng |
| Hoá đơn NCC tạo từ PO, ghi sổ mới phát sinh nợ; thanh toán có hình thức; bảng **Tuổi nợ** (hạn, quá hạn ngày, nhóm) | Công nợ NCC ghi khi nhận hàng; `hoa-don-dau-vao` đối chiếu; cột số ngày nợ | thiếu một phần | Thiếu bảng tuổi nợ theo nhóm (0-30/31-60/…) |
| Điều chuyển: Nội bộ / Liên chi nhánh; Nháp → Chờ duyệt → Đã duyệt → Đã soạn → Đang chuyển → Đã nhận / Nhận lệch; cột Yêu cầu/Duyệt/Soạn/Xuất/Nhận/Lệch | `kho/chuyen-kho` (Đang chuyển → Đã nhận / Chờ xử lý chênh lệch → Đã xử lý; ghi hao hụt / trả về) | thiếu một phần | Thiếu bước duyệt + soạn trước khi xuất; AMIA hơn ở xử lý lệch |
| Điều chỉnh tồn: Tăng / Giảm / **Đặt số lượng**, lý do, duyệt, ghi sổ | `kho/xu-ly` (Huỷ, Hao hụt, Trả NCC, Điều chỉnh tăng/giảm; có duyệt) | thiếu một phần | Thiếu "Đặt số lượng" |
| Kiểm kê Toàn kho / **Một phần**; snapshot; Tồn HT / Đếm / Lệch / **Giá trị lệch**; ghi sổ sinh phiếu điều chỉnh | `kho/kiem-ke` (Hằng tháng / Đột xuất, 2 người đếm, duyệt) | thiếu một phần | Thiếu kiểm một phần (chọn nhóm/sp), cột giá trị lệch |
| Trang Hướng dẫn & thuật ngữ kho (6 loại kho, tồn thực tế/giữ chỗ/khả dụng, lô, serial, FEFO/FIFO, ledger, PR/PO/GR) | thiếu | thiếu hẳn | |
| Serial từng đơn vị | thiếu | thiếu hẳn | Để sau (thiết bị) |
| Trừ kho khi bán ở POS (BeDental known gap: chưa làm) | AMIA có (đối soát xuất kho theo hoá đơn) | AMIA hơn | |
| — | AMIA có thêm: định mức vật tư, phiếu cấp vật tư theo ca, xuất khẩn cấp hậu kiểm 24h, chuẩn hoá vật tư, quy tắc kho & hạn dùng | AMIA hơn | |

Số gap: 12 (3 thiếu hẳn, 9 thiếu một phần).

Ưu tiên:
1. **Phiếu nhập nhiều dòng có trạng thái**: Nháp → Ghi sổ / Huỷ; dòng: sản phẩm, mã vạch, lô, HSD, SL nhận, SL đạt, SL lỗi (lỗi tự sang kho hỏng hoặc trả NCC), đơn giá nhập; chỉ SL đạt vào tồn; mã phiếu NK+năm+chữ+số.
2. **Tồn giữ chỗ / khả dụng**: giữ chỗ khi phiếu cấp vật tư / chuyển kho / đơn chưa xuất; khả dụng = thực tế − giữ chỗ; chặn xuất/chuyển vượt khả dụng; hiện 3 cột.
3. **Ledger thêm Trước / Sau + mã GD + loại nghiệp vụ**, lọc chi nhánh / kho / loại.
4. **Quét mã vạch ở phiếu nhập và chuyển kho**; mã lạ → chọn sản phẩm → gắn mã vạch.
5. **Danh mục kho có loại** (bảng `kho`: mã, tên, loại bán lẻ / nội bộ / hỏng-huỷ / trả NCC, chi nhánh, cho phép bán, hoạt động) — nền cho các mục trên.
6. **Tuổi nợ NCC** theo nhóm (chưa đến hạn, 1-30, 31-60, 61-90, >90) với hạn = ngày nhận + hạn thanh toán NCC.
7. **Điều chỉnh "Đặt số lượng"** (nhập số đúng, hệ thống tự tính chênh).
8. **Kiểm kê một phần** (chọn nhóm cấp / danh sách sản phẩm) + cột Giá trị lệch (lệch × giá vốn).
9. **PO**: trạng thái "Đã gửi NCC", "Đóng thủ công" khi nhận thiếu, VAT % và chiết khấu theo dòng; PR có Ưu tiên (Thấp/Thường/Cao/Khẩn).
10. Chuyển kho thêm bước duyệt/soạn cho liên chi nhánh (tuỳ chọn).
11. Trang Hướng dẫn thuật ngữ kho (tĩnh).
12. Serial (để sau).

### C. Nơi làm việc
Lưu ý: từ 31/10 HR + quản lý công việc chuyển sang **MSC OS** (mscgroup-os). AMIA còn giữ (không xoá) việc cần hoàn thành / bảng chốt / báo cáo ngày; phần **phê duyệt + đề xuất dính tiền/hàng** vẫn thuộc AMIA. Gap phần việc → ghi "MSC OS".

| BeDental có | AMIA có chưa | Mức | Ghi chú |
|---|---|---|---|
| Lưới thẻ Nơi làm việc | `noi-lam-viec` (module.ts) | đủ | |
| Việc cần làm: 7 bộ đếm, tìm, lọc thời gian, giao việc (ưu tiên 4 mức, hạn nhanh, đính kèm, người theo dõi) | `noi-lam-viec/viec` (Giao cho tôi / Tôi giao / Quá hạn / Tất cả; tiêu chí xong, nộp, chấm Đạt, báo kẹt; ưu tiên 3 mức) | thiếu một phần — MSC OS | Thiếu đính kèm, CC/người theo dõi, mức Khẩn, đếm "Đến hạn hôm nay" |
| Chi tiết việc: Hồ sơ xử lý theo bước, Nhận xét @nhắc + tệp, Cuộc trò chuyện nhóm | thiếu | thiếu hẳn — MSC OS | |
| Đo lường hiệu suất (tỉ lệ hoàn thành, đúng hạn %, quá hạn %, theo trạng thái) | `noi-lam-viec/chot-ngay` (đạt, trễ, kẹt theo người) | đủ — MSC OS | AMIA hơn (chốt 12h/17h) |
| Báo cáo ngày 3 ô, nộp thay, 1/người/ngày | `noi-lam-viec/bao-cao-ngay` | đủ — MSC OS | |
| Trung tâm phê duyệt: tab nguồn, lọc trạng thái, bộ đếm vai | `noi-lam-viec/phe-duyet` (Tất cả, Nghỉ phép·OT·HR, Chờ tôi duyệt, Chờ thực hiện, Tôi đã gửi, Đã xử lý, Bị từ chối; Duyệt / Từ chối có lý do / Thực hiện chi / lập đơn mua) | thiếu một phần | Thiếu tab **Đã CC/Theo dõi**, ô tìm |
| Trạng thái **Cần bổ sung** + gửi lại "lần N" | thiếu (TT_DX: Chờ duyệt / Đã duyệt / Đã thực hiện / Từ chối / Huỷ) | thiếu hẳn | |
| Mức rủi ro (Rủi ro cao / Nghiêm trọng) + ô xác nhận "đã kiểm tra chứng từ" | thiếu | thiếu hẳn | |
| Nhóm "Thao tác nhạy cảm" (phiếu thu/chi tay, đảo phiếu, ghi lùi ngày) chờ duyệt rồi mới ghi sổ; "Lỗi thực thi" | thiếu (chỉ duyệt đề xuất + đơn mua + phiếu nghỉ) | thiếu hẳn | |
| SLA 24h, "Quá hạn" | có "Hạn duyệt · quá hạn" | đủ | |
| Khung chi tiết 4 tab: Chi tiết / Hồ sơ phê duyệt (các bước, diễn tiến) / Nhận xét & tệp / Nhật ký hệ thống | Bảng một dòng, không có khung chi tiết | thiếu hẳn | |
| Form đề xuất: Số tiền*, Cần trước ngày, Tạo thay NV, Tiêu đề*, Lý do*, **Người duyệt*** (chọn, 1 người là xong), **Người theo dõi**, **Tệp đính kèm** (≤5; ảnh 10MB, tài liệu 25MB) | `noi-lam-viec/de-xuat` (5 loại: mua sắm, thanh toán, tạm ứng lương/chi phí, hoàn ứng, hoàn trả khách; dự toán, NCC, trả cho, chi nhánh, hạn) | thiếu một phần | Thiếu chọn người duyệt, người theo dõi, đính kèm chứng từ, tạo thay NV; AMIA hơn về loại |
| Wiki chỉ đọc lấy từ văn bản đã ban hành + công khai | `noi-lam-viec/wiki` (viết bài trực tiếp, ghim, công khai) | đủ — MSC OS | Cách làm khác, đủ dùng |
| Trình duyệt hợp đồng | `van-ban` | ngoài phạm vi fork B | |
| Đề xuất mua sắm (PR/PO) | có | đủ | |

Số gap: 8 (5 thiếu hẳn, 3 thiếu một phần; trong đó 2 thuộc MSC OS).

Ưu tiên (phần AMIA giữ):
1. **Đính kèm chứng từ** ở đề xuất (≤5 tệp, ảnh/PDF/DOCX/XLSX, lưu riêng tư, xem nhanh) và khi duyệt/thực hiện chi.
2. **Trạng thái "Cần bổ sung"**: người duyệt bấm "Yêu cầu bổ sung" (nội dung bắt buộc) → người gửi thêm tệp + ghi chú → "Gửi lại để duyệt (lần N)"; lưu `vong_gui`.
3. **Thao tác nhạy cảm qua duyệt**: phiếu thu/chi tay, đảo phiếu sổ quỹ, ghi lùi ngày, xoá thanh toán → tạo yêu cầu (mã DX+năm+chữ+số, mức rủi ro), trạng thái Chờ duyệt → Đã duyệt / Chờ ghi sổ → Đã thực thi / Lỗi thực thi; cấu hình bật/tắt theo loại ở `cai-dat/chinh-sach-duyet`.
4. **Khung chi tiết yêu cầu** 4 tab (Chi tiết, Hồ sơ phê duyệt, Nhận xét & tệp, Nhật ký); mức rủi ro + ô xác nhận đã kiểm chứng từ với rủi ro cao.
5. **Chọn người duyệt + người theo dõi** trong form đề xuất; tab "Đã CC/Theo dõi"; ô tìm theo mã/tiêu đề.
6. (MSC OS) Bình luận @nhắc + tệp, hồ sơ xử lý theo bước, CC, ưu tiên Khẩn, đếm "Đến hạn hôm nay".

### Tổng
- Tài chính: 13 gap (+2 BeDental cũng chưa xong).
- Kho & Mua sắm: 12 gap.
- Nơi làm việc: 8 gap (2 thuộc MSC OS).


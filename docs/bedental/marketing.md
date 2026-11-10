# BeDental ERP — Mục MARKETING và CTV (đề bài cho AMIA OS)

Nguồn: đọc trực tiếp demo BeDental ERP (tài khoản Owner, chỉ xem, không bấm Lưu/Tạo/Gửi) + chuỗi chữ trong mã giao diện (bundle JS). Không chép tên người, SĐT, email, mã khách. [NHA KHOA] = điểm riêng nha khoa.

**Cập nhật 10/11/2026** (so với bản 27/10): Marketing lớn lên rất nhiều.
- "Inbox đa kênh" đổi tên thành **Hộp chat đa kênh** và thành một sản phẩm riêng: 10+ kênh (Zalo OA, Messenger nhiều trang, WhatsApp Cloud + WhatsApp Business app, Instagram, LINE, TikTok, Telegram, Viber sắp có), **Nhân viên AI** tự trả lời khách (mức 1 hỏi đáp, mức 2 đặt lịch), quy tắc tự động, phân công + SLA, câu trả lời mẫu đa ngôn ngữ, việc chủ động (nhắc khách im lặng), báo cáo Inbox, liên kết bệnh nhân, chuyển giao chi nhánh.
- Thẻ "Hộp Lead" bị ẩn khỏi trang tổng quan Marketing với người có quyền trả lời chat (đã gộp vào Hộp chat qua nút LEADS), nhưng màn `#/marketing_leads` vẫn chạy. Hộp Lead có thêm: cột kanban tự cấu hình có SLA theo phút + version, chế độ Bảng nhập nhanh như Excel, khung chi tiết lead 5 tab (Thông tin, Hoạt động, Tác vụ, Nhắc việc, Tệp), lọc "mức chăm sóc", kênh mới line/tiktok/telegram, tác vụ do AI tạo.
- Thẻ mới **Mã ưu đãi** (nằm trong Zalo Mini App → Ưu đãi): Content Studio soạn bài ưu đãi + quy tắc mã giảm giá, mã dùng chung / mã riêng, cho CTV tặng khách.
- Khu Giới thiệu & CTV có 9 tab (trước 4): thêm **Cây CTV & khách hàng, Chi trả hoa hồng, Thông báo email, Khiếu nại đối soát, Mới đăng ký 7 ngày**; nút **Cài đặt hoa hồng đối tác tự đăng ký**; mỗi nguồn có **Link đặt hẹn REF=SĐT + QR PNG/SVG + 10 mẫu poster**; hoa hồng riêng theo từng dịch vụ/sản phẩm/thẻ.
- **Cổng CTV công khai** `/ctv` (đăng nhập bằng mã email), trang **đăng ký CTV** `/ctv/dang-ky` (xác thực mã 6 số), trang **hướng dẫn CTV** `/ctv/huong-dan`. CTV tự tạo chiến dịch riêng có link/QR, tải poster riêng, mời tuyến dưới, chia % cho tuyến dưới, yêu cầu rút tiền, khiếu nại đối soát, tặng e-voucher.
- Cài đặt → Trung tâm thông báo có thêm tab **Chiến dịch** (= "Chiến dịch truyền thông" gửi hàng loạt 5 bước có duyệt maker-checker) và **Lịch sử gửi** có gửi lại.
- Demo nay có dữ liệu thật: 38 lead, 15 nguồn giới thiệu (11 CTV tự đăng ký qua web), 3 quan hệ tuyến trên, 8 kênh chat đang hoạt động.

## 0. Thanh bên trái (sidebar) — 12 mục, đúng thứ tự

| # | Mục | Biểu tượng (lucide, đoán theo hình) | Huy hiệu / ghi chú |
|---|---|---|---|
| 1 | Dashboard | LayoutDashboard (4 ô chữ nhật) | |
| 2 | Lịch hẹn | Calendar | Số đỏ = lịch hẹn hôm nay của chi nhánh đang làm việc (title "Lịch hẹn hôm nay của chi nhánh đang làm việc") |
| 3 | Nơi làm việc | 4 ô vuông bo tròn nhiều màu (xanh dương, tím, xanh ngọc), riêng của BeDental | |
| 4 | Khách hàng | Users | |
| 5 | POS / Bán hàng | ShoppingCart | |
| 6 | Tài chính - Kế toán | Banknote | |
| 7 | Kho & Mua sắm | Warehouse/Package | |
| 8 | Nhân sự | UserCheck | |
| 9 | Văn bản & Hợp đồng | FileText | |
| 10 | Báo cáo | BarChart | |
| 11 | Marketing | Megaphone | |
| 12 | Cài đặt | Settings (bánh răng) | tách riêng khỏi danh sách 11 mục trên trong mã |

- Thanh thu gọn được (chỉ icon), nút "Ghim mở rộng menu". Di chuột vào một mục hiện **mega menu** (khung bay ra) liệt kê các thẻ của module theo nhóm (Marketing: LEAD / CHIẾN DỊCH / CTV / REFERRAL), thẻ chưa xong có nhãn "Sắp có" / "Đang hoàn thiện".
- Chân thanh: avatar chữ cái, tên tài khoản, huy hiệu vai trò "Tài khoản Chủ phòng khám", dòng "Owner · <mã phòng khám>", nút Đăng xuất.
- Thanh trên: ô tìm toàn cục "Tìm khách hàng, lịch hẹn...", trạng thái "API Online", nút "Hướng dẫn sử dụng" (mỗi module có trang Mục đích / Thuật ngữ / Các bước / Lưu ý / Lỗi hay gặp / Module liên quan / Điểm còn thiếu), chọn chi nhánh đang làm việc, 2 chuông thông báo (99+), avatar.

## 1. Trang tổng quan Marketing (`#/marketing`, tiêu đề "Marketing & CTV")

Mô tả: "Quản lý lead, kết nối kênh, chiến dịch, cộng tác viên/giới thiệu và tracking." 3 nhóm thẻ, mỗi thẻ có nhãn trạng thái:

| Nhóm | Thẻ (đích) | Nhãn |
|---|---|---|
| LEAD | Hộp Lead (`marketing_leads/inbox`) — ẩn với người có quyền trả lời chat, thay bằng Hộp chat | Sẵn sàng |
| | Hộp chat đa kênh (`inbox`) "Trả lời khách qua WhatsApp, Zalo OA và Messenger trong một nơi" | Sẵn sàng |
| | Kết nối kênh (`integrations`) "Kết nối Zalo OA, WhatsApp, Messenger, Email ở một chỗ; theo dõi webhook" | Sẵn sàng |
| | Website form | Sắp có |
| | Facebook / Zalo / Google form | Sắp có |
| CHIẾN DỊCH | Chiến dịch giới thiệu (`referral/campaigns`) "có cửa sổ thời gian và trần thưởng" | Sẵn sàng |
| | Tracking link / QR (`referral/links`) | Sẵn sàng |
| | **Mã ưu đãi** (`miniapp_settings/promotion`) "Tạo mã giảm giá cho đơn hàng, nhập ở ô Nhập mã ưu đãi khi thu tiền" — MỚI | Sẵn sàng |
| | Landing page | Sắp có |
| | Automation CSKH | Sắp có |
| CTV / REFERRAL | Danh sách nguồn giới thiệu / CTV (`referral/sources`) | Sẵn sàng |
| | Tuyến trên - tuyến dưới (`referral/hierarchy`) | Sẵn sàng |
| | Link / QR giới thiệu (`referral/links`) | Sẵn sàng |
| | Duyệt hoa hồng CTV | Đang hoàn thiện (API đợt duyệt có: submit/approve/reject, UI chưa) |

Hướng dẫn module (Marketing): thuật ngữ Hộp Lead, Kết nối kênh, Website booking form, Facebook Lead Ads, Zalo OA, **Dedupe lead (chống trùng theo SĐT)**, **Consent (đồng ý nhận tin)**; lỗi hay gặp "bỏ sót consent", "tạo trùng lead". Điểm còn thiếu tự khai: website form, Facebook/Zalo form, SMS/Email, call center, automation.

Liên quan Marketing ở module khác: Dashboard có cảnh báo "N lead chưa ai nhận" (mức CẢNH BÁO, bấm sang Hộp Lead); Nhân sự có **Phụ trách lead theo chi nhánh** (mỗi chi nhánh 1 người tự nhận khách mới + cảnh báo tin chưa ai nhận, xem cai-dat.md / nhan-su.md); Báo cáo có "Báo cáo hoa hồng giới thiệu" (net 2 cấp: gộp / đã hoàn / thực nhận); Tài chính có "Quyết toán hoa hồng CTV" (Đang hoàn thiện); Web đặt lịch có ô "Địa chỉ trang đặt hẹn trên website" dùng cho link REF.

## 2. Hộp Lead (`#/marketing_leads`)

### 2.1 Thanh công cụ và bộ lọc
- Ô tìm "Tìm kiếm Lead" (Tên, SĐT, mã…).
- Lọc (dropdown): Giai đoạn (Mọi giai đoạn + các cột) · Chi nhánh · Người phụ trách · Người hỗ trợ · Nguồn giới thiệu (nhóm Đối tác / Nguồn ngoài) · Kênh nhận: manual, web_form, facebook, zalo, whatsapp, email, walk_in, phone, messenger, instagram, zalo_oa, **line, tiktok, telegram** · Tác vụ (tất cả / Còn tác vụ mở / Không có tác vụ mở) · Nhắc việc (tất cả / Quá hạn / Hôm nay / Sắp tới / Không có) · **Mức chăm sóc** theo tuổi cập nhật: 0–7 ngày "Mới cập nhật", 8–14 "Cần chú ý", 15–29 "Lâu chưa chăm sóc", từ 30 "Bỏ quên".
- Nút "Bộ lọc" (đếm số lọc đang bật) + "Xóa lọc (N)" trên màn hẹp.
- Công tắc "Cách xem": Kanban | Bảng. Nút "Cấu hình cột & nguồn", "Thêm lead".

### 2.2 Kanban
- Cột mặc định (đếm số lead): Mới · Đang liên hệ · Tiềm năng · Đã đặt lịch · Thắng · Thua/Đóng. Kéo thả để đổi giai đoạn.
- Thẻ lead: tên · mã (lead tạo tay `LD-YYMM-xxxxxx`; lead đến từ chat mang mã khách KHxxxxxx) · SĐT (kèm mã quốc gia) · giá trị dự kiến (đ) · "Cập nhật hôm nay / N ngày trước" · số tệp ("2 tệp") · người phụ trách (avatar chữ cái) hoặc "Chưa nhận" · số nhắc việc.
- Demo 10/11: 38 lead (Mới 5, Đang liên hệ 9, Tiềm năng 3, Đã đặt lịch 6, Thắng 7, Thua/Đóng 8); phần lớn đến từ chat (khách nước ngoài nhiều), đa số "Chưa nhận".

### 2.3 Chế độ Bảng (nhập liệu như Excel)
- Cột: Mã · Họ tên · SĐT · Email · Chi nhánh · Giai đoạn (ô chọn đổi ngay) · Phụ trách · Giá trị dự kiến · Nguồn · Trạng thái (open / won / lost) · Cập nhật.
- "Dòng xanh" nhập nhanh ở đầu bảng: gõ rồi Enter để tạo lead (cần ít nhất tên, SĐT hoặc email); sửa ô và rời ô là lưu.

### 2.4 Form "Thêm lead"
Họ tên · Số điện thoại · Email · Nguồn (Nhập tay, Web form, Facebook, Zalo, WhatsApp, Email, Khách vãng lai, Điện thoại, Messenger, Instagram, Zalo OA; mặc định Điện thoại) · Chi nhánh (— Chưa gán — / từng chi nhánh) · Giá trị dự kiến (đ) · Ghi chú. Nút Tạo lead / Huỷ.

### 2.5 "Cấu hình cột & nguồn" (khung mở ngay trên bảng)
- **Cột Kanban** (có số "phiên bản N", sửa đồng thời bị chặn: "Cấu hình cột vừa được người khác thay đổi"): mỗi cột có Tên, **SLA (phút)** (mặc định Mới 15, Đang liên hệ 1440, Tiềm năng 4320, các cột sau trống), nút ↑ ↓ đổi thứ tự, "Ngừng dùng" (chặn khi cột còn lead: "Cột còn N Lead — hãy chuyển hết trước"; không ngừng được cột Thắng/Thua). Thêm cột: Tên + Màu. Tên cột không trùng.
- **Nguồn giới thiệu** của lead: danh sách nguồn, thêm nguồn (Tên + Loại: Nguồn ngoài / Đối tác), "Dùng lại" nguồn đã ngừng.

### 2.6 Khung chi tiết lead (bấm thẻ) — "Bảng làm việc Lead"
Đầu khung: tên, mã · SĐT, "Cập nhật N ngày trước", nút mở hồ sơ khách (nếu đã gắn), Đóng. 5 tab:
1. **Thông tin**: Giai đoạn · Email · Người phụ trách · Người hỗ trợ (nhiều người, chọn nhân viên + Thêm) · Nguồn giới thiệu (Đối tác · tên) · **Hồ sơ khách** (tự gợi ý khách khớp SĐT, xác nhận đúng khách; hiện số lần đến, lần gần nhất, hủy/không đến, còn nợ; "Lead chưa gắn hồ sơ khách — xác nhận đúng khách ở tab Thông tin để mở hồ sơ").
2. **Hoạt động**: ghi tay loại Ghi chú / Gọi / Nhắn tin + nội dung; dòng thời gian tự ghi (Tạo Lead, Nhận Lead, Đổi giai đoạn, Ghi chú…), "Tải thêm".
3. **Tác vụ**: tên tác vụ + giao cho (chỉ người phụ trách/hỗ trợ lead), hoàn thành / hủy; tác vụ do AI tạo có nhãn "AI tự làm" / "AI tạo · cần xử lý", hiện cả ở Nơi làm việc → Việc cần làm.
4. **Nhắc việc**: nội dung + thời điểm (datetime) + nhắc cho ai (chỉ người phụ trách/hỗ trợ); nhắc đã phát/đóng thì không đổi lịch được.
5. **Tệp**: tải tệp (tối đa 5 tệp tải tay/lead, giới hạn dung lượng + định dạng); ảnh, PDF, link trong hội thoại chat tự lưu vào đây (không tính 5), lọc ảnh theo nhãn (Trước điều trị / Sau điều trị / Khác), gắn nhãn cả nhóm, đổi tên, tải về, xóa; tách "Ảnh mẫu tư vấn" (ảnh phòng khám gửi nhiều khách, không tính là ảnh của khách).
- API thấy thêm: nhận lead (claim), giao (assign), đóng thua (close-lost với lý do theo danh mục `lead-lost-reasons`), mở lại (reopen), chuyển thành khách (convert-to-customer / tạo nhanh khách / gắn khách khớp), gắn nguồn giới thiệu, link hội thoại, hạn mức chat.
- Lỗi/quy tắc: "Bạn không phụ trách Lead này", "Người này còn tác vụ hoặc nhắc việc chưa xử lý — hãy chuyển hoặc hủy trước" (khi gỡ người hỗ trợ), "Nguồn giới thiệu không thuộc chi nhánh của Lead", "Nguồn giới thiệu đã ngừng sử dụng".

## 3. Hộp chat đa kênh (`#/inbox`)

### 3.1 Cột trái
- Thanh trên: nút **Cài đặt chat** (menu), nút **LEADS** (mở Hộp Lead ngay trong Hộp chat), trạng thái của tôi **Sẵn sàng / Tạm vắng / Ngoại tuyến** (chia tự động chỉ giao cho người Sẵn sàng), nút **Nhận hội thoại mới** (lấy hội thoại chưa ai nhận mà khách chờ lâu nhất, chống hai người nhận trùng).
- Tab: Của tôi · Chưa giao · Nhóm · Tất cả. Ô tìm theo tên hoặc SĐT. Lọc chi nhánh.
- Mỗi dòng: ảnh, tên, giờ tin cuối (Hôm nay/Hôm qua/thứ/ngày), trích đoạn tin cuối, số tin chưa đọc (riêng từng người), nhãn "AI chuyển" (AI đã chuyển cho người), "Chờ xử lý câu khó", và các tag nhỏ: CN: chi nhánh · DV: dịch vụ quan tâm · NV: nhân viên phụ trách · TT: giai đoạn lead. "Xem thêm" để tải cũ hơn.

### 3.2 Cột giữa (hội thoại)
- Nút đầu: Đóng hội thoại (chọn **lý do đóng**, không bắt buộc: Hỏi giá / Đặt lịch / Đổi hoặc hủy lịch / Hậu điều trị / Khiếu nại / Khác; khách nhắn lại tự mở) / Mở lại · Thêm vào lead · **Tiếp quản** (khi Nhân viên AI đang trả lời; AI dừng ngay khi người gửi tin) · Nhận xử lý / Bỏ nhận · Gắn tag (tạo tag mới tại chỗ).
- Hạn SLA hiển thị: "Nhận xử lý trước hh:mm" / "Quá hạn nhận xử lý", "Phản hồi trước …" / "Quá hạn phản hồi"; gia hạn SLA.
- Tin: chữ, ảnh, tệp, ghi âm, vị trí, thả cảm xúc, tin OA đặc biệt; trạng thái gửi Đang gửi / Đã nhận / Đã xem / Không gửi được (khách chặn, hết hạn mức gói, gửi quá nhanh) / Chưa xác định (đang đối soát); tệp nguy hiểm bị ẩn. Mỗi tin có nút "Lưu tin này làm câu trả lời mẫu", "Tải về".
- **Gợi ý trả lời của AI**: nháp AI "Dùng gợi ý / Bỏ qua", phản hồi chất lượng nháp; câu khó AI chuyển người.
- Ô soạn: "/" + phím tắt gọi câu trả lời mẫu, gợi ý câu mẫu theo từ khóa trong tin khách, dấu "+" gồm Đính kèm tệp · Tin nhắn mẫu (có phí, Zalo ZBS / WhatsApp template, giới hạn 1 tin mẫu/24h/hội thoại + trần/ngày) · **Đặt hẹn** (tạo lịch + gửi liên kết lịch hẹn ngay trong chat). Cảnh báo "Hội thoại này đang giao cho người khác. Bạn vẫn muốn gửi?".
- Luật khung trả lời theo kênh: Zalo 48h (ngoài khung dùng hạn mức gói OA rồi tính phí/tin), Messenger 24h (ngoài 24h dùng thẻ Human Agent 7 ngày), WhatsApp 24h (ngoài khung chỉ tin mẫu có phí), Instagram 24h ~1.000 ký tự, TikTok 48h tối đa 10 tin, LINE / Telegram không giới hạn.

### 3.3 Cột phải (Khách hàng)
- Tên, "Số điện thoại ẩn" (theo quyền), giờ địa phương của khách.
- **Chi nhánh**: chi nhánh chính + "chi nhánh cùng chăm sóc" (thêm/bỏ), hoặc "Chưa gắn chi nhánh (hàng chờ chung)"; **Chuyển giao chi nhánh** (người nhận + ghi chú chuyển giao).
- **Lead**: mã lead, người phụ trách (có thể là "Nhân viên AI"), nút giai đoạn (Mới → Thắng), **Đánh dấu thua** (lý do thua), "Mở lead mới riêng (không gộp vào lead đang mở)", Thêm vào lead (dịch vụ quan tâm). Khách đã có lead mở thì ghi vào lead đó.
- **Bệnh nhân liên kết**: gợi ý theo SĐT (chọn đúng người, không tự gộp), tìm theo tên/mã/số, Liên kết / Bỏ liên kết, quan hệ người nhắn: Chính khách / Con / Vợ/chồng / Bố/mẹ / Người đại diện / Khác; cảnh báo "Kênh chưa xác minh danh tính: chỉ trao đổi thông tin điều trị, công nợ khi chắc chắn đúng khách".
- **AI đọc được** (tóm tắt + trường do AI trích, "có thể sai"): Nhu cầu · Muốn đến · Tên · Quốc gia · Ngôn ngữ · Ngân sách · Mức khẩn (Thường / Khẩn cấp).
- **Dữ liệu khách**: Xuất dữ liệu · Xóa dữ liệu khách (xóa toàn bộ tin/tệp/ghi chú Inbox, không đụng hồ sơ bệnh nhân).
- **Ghi chú nội bộ** (nhắc tên đồng nghiệp bằng @), ghi chú tự động "Nhân viên AI chuyển cho nhân viên: <lý do>".
- Bỏ chặn khách (khách bị chặn: AI không trả lời, không báo tin mới).

### 3.4 Cài đặt chat (menu, mỗi người chỉ thấy mục mình có quyền)
1. **Câu trả lời mẫu**: danh sách (phím tắt · tên · nội dung · phạm vi · số lần dùng · số ngôn ngữ), Thêm/Sửa/Xóa. Form: Phạm vi (Của tôi / Toàn phòng khám; có cả Nhóm), Phím tắt (chữ thường, số, -, _; ≤30), Tên, Từ khóa gợi ý (phẩy), nội dung theo tab ngôn ngữ (Tiếng Việt bắt buộc, Tiếng Anh…), chèn biến: Tên khách, Họ tên khách, Tên kênh, Tên nhân viên, Tên phòng khám.
2. **Báo cáo Inbox** (7/30/90 ngày, tối đa 93 ngày): Được giao · Đã đóng · Phản hồi đầu (trung vị) · Đạt SLA phản hồi (%) · Lead tạo ra · Quá hạn SLA; bảng Theo nhân viên (được giao, bị giao lại, phản hồi đầu trung vị/p90, đạt SLA), Theo kênh; biểu đồ phân bố phản hồi đầu (<1', 1–5', 5–15', 15–60', 1–4h, ≥4h).
3. **Kênh và phân quyền**: mỗi kênh có quyền Xem / Trả lời / Quản lý theo người, nhóm hoặc cả chi nhánh; "Sao chép phân quyền từ kênh"; chế độ "Chỉ người được cấp mới thấy" / "Mọi nhân viên có quyền Inbox được trả lời".
4. **Quy tắc tự động**: mỗi quy tắc = 1 sự kiện + điều kiện (AND) + 1 hành động, có version, mặc định tắt, **Chạy thử** trên một hội thoại có sẵn trước khi bật, thống kê 30 ngày (lần chạy, bị chặn, lỗi). Sự kiện: Khi khách nhắn tin / Khi có hội thoại mới / Khi lead đổi giai đoạn. Điều kiện: Tin nhắn có chứa (từ khóa) · Kênh là · Ngôn ngữ của khách là (Việt/Anh/Trung/Hàn/Nhật) · Hội thoại đã có / chưa có người nhận · Lead chuyển sang giai đoạn. Hành động: Tạo lead (kèm dịch vụ) · Giao cho nhân viên · Gắn tag · Gửi câu trả lời tự động. Chặn khi quá khung trả lời kênh hoặc kênh chưa bật. Demo có 2 quy tắc mẫu: "Khách hỏi giá thì tạo lead", "Chào khách khi mở hội thoại mới".
5. **Phân công và SLA**: Tự động giao (Tắt / Chia vòng cho người đang sẵn sàng) · Khách quay lại giao cho người đã xử lý (30 ngày) · Giao lại hội thoại khi người phụ trách ngoại tuyến · SLA nhận xử lý (phút) · SLA phản hồi (phút, 1–10080) · Tin mẫu trả phí tối đa/ngày (0 = tắt) · Múi giờ · Giờ làm việc theo từng thứ (mở/đóng) · Ngày nghỉ lễ · Giữ tin nhắn trong N tháng · "Không dùng dữ liệu phòng khám để huấn luyện AI". SLA chỉ tính trong giờ làm việc.
6. **Việc chủ động**: tìm khách đã hỏi dịch vụ, phòng khám đã trả lời nhưng khách im lặng chưa đặt lịch → soạn sẵn tin nhắc để nhân viên đọc và bấm Gửi. Cài đặt: bật/tắt, nhắc sau N giờ im lặng (≤22 để còn trong khung 24h), mẫu tin Việt / Anh với biến {ten} {nhu_cau}, "Tự gửi không cần bấm" (chỉ kênh bật AI, 08:00–20:00). Thống kê 30 ngày: số việc · đã gửi · khách đặt lịch sau khi nhận tin. Tab Chờ gửi / Đã xử lý.
7. **Nhân viên AI theo kênh**: bật AI từng kênh; Mức 1 (giờ mở cửa, địa chỉ, giá theo bảng giá, tìm giờ trống, ghi nhận khách) / Mức 2 (thêm đặt lịch khi khách bấm hoặc nhắn "Đồng ý"); thời gian AI nhận hội thoại: chỉ ngoài giờ làm việc / mọi lúc. Luôn chuyển người: khách khẩn cấp, đổi/hủy lịch, báo giá ngoài bảng giá, câu hỏi chuyên môn; bộ lọc chặn câu AI (ví dụ giá không có nguồn) thì để ở "Nháp AI" chờ duyệt.
8. **Duyệt mẫu Nhân viên AI**: hệ thống chọn ngẫu nhiên hội thoại AI tự trả lời (20% tuần đầu, 5% sau) để quản lý "Đọc và chấm" Đạt / Không đạt (+ ghi chú, bắt buộc lý do khi không đạt); hiện tỉ lệ đạt; nhãn kết cục (Chuyển nhân viên / Đặt lịch).
9. **Kịch bản trả lời** (bộ nhớ AI): "Quét hội thoại mới" đề xuất kịch bản từ câu nhân viên đã trả lời thay AI; tab Đề xuất mới / Đang dùng / Đã bỏ; Thêm kịch bản (Khách hỏi ≤1.000 ký tự, Phòng khám trả lời ≤2.000), Duyệt cho AI dùng / Ngừng dùng / Bỏ, mở hội thoại gốc. Nguồn đề xuất: nhân viên trả lời sau khi AI chuyển, nhân viên sửa nhiều nháp AI, hội thoại bị chấm Không đạt, quản lý tự thêm.

## 4. Kết nối kênh (`#/integrations`)

3 tab: **Kết nối · Webhook Events · Integration Logs**.

### 4.1 Tab Kết nối — danh sách kênh (trạng thái trong ngoặc)
Zalo · Nhóm Zalo nhân viên · Messenger · WhatsApp · Viber (Chưa bật) · TikTok · Instagram · SMS (Chưa bật) · Email · Line · Telegram.
- **Zalo OA / UID**: tên OA (che), mã OA (che), mã truy cập hết hạn lúc, tự gia hạn gần nhất; Ngắt kết nối · Cấp quyền lại · Kiểm tra kết nối. ZNS: Sẵn sàng, người nhận = SĐT đã xác minh, mẫu tin gắn ở từng loại tin trong Thông báo khách hàng. **Bộ gửi OA/ZNS**: trạng thái, nhịp gần nhất, hàng đợi đến hạn, chậm nhất, số lỗi, chưa rõ kết quả.
- **Nhóm Zalo nhân viên** (GMF): báo lịch hẹn mới / đổi / hủy vào nhóm Zalo nội bộ (SĐT khách che, không gửi tiền/bệnh án); chọn nhóm từ danh sách, chọn sự kiện, khung giờ không gửi (gom gửi sau), Gửi tin thử, Tắt/Lưu; tình trạng gửi (gần nhất, đang chờ, lỗi 7 ngày); hướng dẫn chuẩn bị phía Zalo.
- **Kênh chat (Inbox)**: "8 kênh · 8 đang hoạt động"; nút Kết nối Messenger / Instagram / WhatsApp / LINE / TikTok / Telegram / Viber (có số kênh đã nối), "Hướng dẫn kết nối từng kênh"; mỗi kênh: tên trang, loại · mã, **Đồng bộ bù** (lấy lại tin bị lỡ khi kênh gián đoạn: đang chờ / đang chạy / đã lấp đủ), trạng thái (Đang hoạt động / Gián đoạn / Tạm dừng / Cần kết nối lại), Phân quyền, Tạm dừng / Tiếp tục / Kết nối lại / Hủy kết nối (giữ lịch sử). Tìm theo tên kênh / mã, lọc kênh.
- **WhatsApp Business (Cloud API)**: tình trạng "Sẵn sàng gửi", số mẫu đã duyệt dùng được, giờ đồng bộ mẫu, checklist 6 mục Đạt/Không (cấu hình nền tảng, tài khoản xác minh Meta, số đăng ký Cloud API, webhook đã đăng ký, đã nhận webhook hợp lệ, mẫu còn mới); Đồng bộ mẫu · Kiểm tra lại · Xem mẫu · Ngắt. Thêm cách nối "Số đang dùng app WhatsApp Business" (coexistence, kéo 6 tháng lịch sử).
- **Email (Gmail)**: hộp thư gửi (che), mẫu email quản lý ở mục Mẫu email, Gửi thư thử, Kết nối lại.
- **SMS**: "Chưa được tích hợp gửi" — không chọn được trong quy tắc.

### 4.2 Webhook Events
Lọc Kênh, nút Tải lại. Bảng: Thời gian · Kênh · Loại · External ID · Trạng thái · Lỗi · (Thao tác: xem chi tiết, Thử lại sự kiện lỗi). Demo rỗng.

### 4.3 Integration Logs
Lọc Kênh. Bảng: Thời gian · Kênh · Level · Action · Message. Demo rỗng.

## 5. Giới thiệu & CTV (`#/referral`, tiêu đề "Giới thiệu & CTV")

Thanh trên: breadcrumb Báo cáo › Hoa hồng người giới thiệu; nút **Cài đặt hoa hồng đối tác tự đăng ký**; lọc chi nhánh; khoảng thời gian (mặc định Hôm nay); Xuất Excel; Thêm nguồn giới thiệu. 9 tab:

### 5.1 Nguồn giới thiệu
- Tìm "nguồn / mã / SĐT"; ô tích **Mới đăng ký 7 ngày** ("CTV tự đăng ký qua website/Zalo/lời mời — rà trước mỗi đợt chi trả").
- KPI: TỔNG HOA HỒNG.
- Bảng: Nguồn giới thiệu (tên + "Tên hiển thị: …" + "Tự đăng ký qua website · ngày") · Mã REF (SĐT) · Loại (Đối tác / Nhân viên / Khách hàng) · Số khách giới thiệu · Tổng số đơn hàng · Tổng doanh thu · Tổng hoa hồng · **Chưa thanh toán** · Thao tác (Link / QR · Sửa · Chi tiết). Phân trang 10 dòng.
- **Form Thêm / sửa** (2 tab):
  - Thông tin: Tên nguồn giới thiệu* · Mã nguồn giới thiệu · Điện thoại di động (dùng làm mã REF; link đặt hẹn dạng …/dat-lich/ref=<SĐT>, SĐT hiện công khai trên link/QR; đổi SĐT thì link/QR cũ còn dùng thêm 90 ngày) · Tên hiển thị trên trang đặt hẹn · Email nhận thông báo · ☑ Gửi email thông báo hoa hồng cho nguồn này · Phân loại (Đối tác / Nhân viên / Khách hàng) · Mức hoa hồng mặc định (Theo phần trăm / Số tiền cố định + giá trị).
  - **Hoa hồng nguồn giới thiệu**: bảng mọi dịch vụ / sản phẩm / thẻ, mỗi dòng ô % riêng (ghi đè mức mặc định).
- **Link / QR** (theo nguồn): link đặt hẹn có REF (Sao chép), "Khách sẽ thấy ở ô người giới thiệu: <tên hiển thị>", Tải QR (PNG) · Tải QR (SVG), **Poster QR đặt hẹn** 10 mẫu (Mẫu 01 "Một chạm đặt hẹn" … Mẫu 10 "Chỉ logo và mã QR") tạo ảnh có QR gắn REF. Nguồn chưa có SĐT di động hợp lệ thì chưa có link.
- **Chi tiết**: trang "Chi tiết hoa hồng giới thiệu: <nguồn>", KPI tổng hoa hồng, bảng Thời gian · Mã HĐ · Chi nhánh · Dịch vụ/SP · Doanh thu tính HH · Tỷ lệ · Hoa hồng · Loại BT (bút toán: ghi nhận / đảo khi hoàn) · TT.

### 5.2 Cây CTV & khách hàng
Tìm CTV (tên/SĐT); sắp xếp: Ngày phát sinh mới nhất / Giá trị hóa đơn / Giá trị hoa hồng; ☐ Chỉ CTV đã có khách; Mở tất cả / Thu gọn. Tổng "N CTV · N khách · N đ". Cây: CTV (tên, SĐT, "N khách", "N tuyến dưới") → khách & tuyến dưới lồng nhau; cột PHÁT SINH (ngày) · GIÁ TRỊ HÓA ĐƠN · HOA HỒNG.

### 5.3 Chiến dịch
"+ Chiến dịch". Bảng: Mã · Tên · Trạng thái · Bắt đầu · Kết thúc. Form: Tên chiến dịch · Trạng thái (Nháp / Đang chạy / Tạm dừng / Kết thúc) · Ngày bắt đầu (bắt buộc nếu đang chạy) · Ngày kết thúc. Báo cáo chiến dịch theo khoảng ngày (API `campaigns/report`, khách theo chiến dịch). Demo rỗng.

### 5.4 Link / QR (tracking)
"+ Link theo dõi". Bảng: Mã tracking · URL · Trạng thái · Thao tác (QR). Form: Nguồn giới thiệu (chọn) · Mã tracking (bỏ trống = tự sinh, dạng REFLINK-…). "Link tạo ra là link đặt hẹn có REF = SĐT của nguồn". Demo rỗng.

### 5.5 Tuyến trên & BC 2 cấp
Ghi chú: mức 2 cấp cấu hình ở Cài đặt → Hoa hồng & Đối tác kinh doanh → Cấu hình hoa hồng 2 cấp. KPI: HOA HỒNG CẤP 1 · CẤP 2 · TỔNG.
- Quan hệ tuyến trên: "+ Gán tuyến trên" (Tuyến dưới · Tuyến trên · Hiệu lực từ; hệ thống chặn tự làm tuyến trên, vòng lặp A→B→A, chồng thời gian nhiều tuyến trên). Bảng: Tuyến dưới (child) · Tuyến trên (parent) · Hiệu lực từ · Đã dùng ledger · Thao tác (Kết thúc quan hệ). Demo 3 quan hệ.
- Bút toán hoa hồng theo cấp: lọc Tất cả / Chỉ cấp 1 / Chỉ cấp 2; bảng Thời gian · Cấp · Người giới thiệu trực tiếp · Người hưởng · DT tính HH · Hoa hồng. API có thêm cảnh báo cây (hierarchy-warnings) và cảnh báo gian lận (fraud-warnings).

### 5.6 Chi trả hoa hồng (yêu cầu rút tiền của CTV)
Tab: Cần xử lý (N) · Đã chi (N) · Từ chối (N) · Tất cả. Bảng: Ngày gửi · Đối tác · Số tiền · Nhận qua (chuyển khoản / tiền mặt) · Trạng thái · Thao tác (Xử lý → Đang duyệt chi · Đánh dấu đã chi · Từ chối có lý do, hoa hồng quay về số dư). Demo rỗng.

### 5.7 Thông báo email
10 loại thư gửi CTV, mỗi loại có công tắc: Người bạn giới thiệu đã đặt hẹn · Đã thanh toán hoa hồng · Cập nhật hoa hồng (gộp, gửi 20:00) · Chào mừng đối tác kinh doanh mới · Thay đổi quan hệ tuyến trên · Lời mời làm tuyến dưới · Khách bạn giới thiệu đã đăng ký Đối tác kinh doanh (demo tắt) · Người bạn giới thiệu đã hủy dịch vụ · Người bạn giới thiệu đã sử dụng dịch vụ · Mã đăng nhập cổng CTV. Thư không ghi tên dịch vụ, tên khách được che; nội dung sửa ở Mẫu email nhóm "Đối tác kinh doanh". Nhật ký: Thời gian · CTV · Loại thư · Trạng thái (Đã gửi / "Bỏ qua · Loại thư đang tắt").

### 5.8 Khiếu nại đối soát
Bảng: Ngày gửi · CTV · Kỳ / dòng · Nội dung · Trạng thái · Thao tác. CTV gửi từ cổng ("Nội dung sai lệch"). Demo rỗng.

### 5.9 Cài đặt hoa hồng đối tác tự đăng ký (hộp thoại)
Áp dụng cho CTV đăng ký qua /ctv/dang-ky, Zalo Mini App hoặc lời mời tuyến dưới; % tính trên tiền khách thực trả mỗi hóa đơn.
- Cấp 1 — khách đối tác giới thiệu: % / số tiền cố định (demo 10%). Áp cho người đăng ký mới; người cũ giữ mức đã ghi.
- Cấp 2 — khách của tuyến dưới: % / cố định (demo 5%), dùng khi chưa bật chương trình 2 cấp.
- Tối thiểu để đối tác yêu cầu thanh toán (demo 500.000 đ).

### 5.10 Duyệt hoa hồng CTV / Quyết toán (Đang hoàn thiện)
API có đợt duyệt (approval-batches: submit / approve / reject), quyết toán (settlements: approve / mark-paid), ghi nhận theo chương trình khi thanh toán (accrue-program), đảo khi hoàn tiền (refund-reverse), xuất Excel. Chưa có màn.

## 6. Cổng CTV công khai (`/ctv`, MỚI)

- **Đăng ký `/ctv/dang-ky?salon=<mã>`**: ảnh bìa "Trở thành đối tác kinh doanh cùng <phòng khám>", mức hoa hồng hiển thị ("x% cho mỗi hóa đơn, cho lịch hẹn đặt qua link/QR (hoặc ghi SĐT) của bạn"). Trường: Họ tên · SĐT di động (10 số, đầu 03/05/07/08/09) · Email (nhận thông báo hoa hồng) · ☑ đồng ý Điều khoản chương trình + Chính sách bảo mật · kênh nhận mã · Gửi mã xác thực (6 số qua email, đếm ngược gửi lại). Xong: "Đăng ký thành công! Bạn đã là Đối tác kinh doanh", hiện mã giới thiệu, link đặt hẹn, QR, nút chia sẻ. Chặn SĐT đã là đối tác; hỗ trợ link mời có sẵn SĐT.
- **Cổng `/ctv`** (đăng nhập bằng mã 6 số gửi email, "Đăng xuất mọi thiết bị"). 5 mục: **Tổng quan · Tôi đã giới thiệu · Đối soát · Tuyến dưới · Hồ sơ**.
  - Tổng quan: KPI Hoa hồng · Đặt hẹn · Lượt quét, kỳ Tháng này / Tháng trước / 3 tháng / Tùy chọn; số tuyến dưới cấp 1 / cấp 2; link đặt hẹn (sao chép/chia sẻ), mẫu poster QR; **chiến dịch riêng của CTV** (tạo, đặt tên + ghi chú, mỗi chiến dịch có link + QR riêng, lưu trữ / khôi phục, báo cáo theo chiến dịch, sắp xếp); **poster riêng** (tải ảnh JPG/PNG/WebP ≤10 MB, kéo thả khung QR và đổi cỡ, lưu vị trí, giới hạn số poster); **ưu đãi để tặng khách** (e-voucher có mã + mã vạch, tạo ảnh ưu đãi chia sẻ, điều kiện + hạn dùng).
  - Tôi đã giới thiệu: lọc trạng thái (Đã đến / Không đến / Đã hủy / Đã phát sinh hóa đơn), cột SĐT (che) · Ngày đặt hẹn · Tình trạng hẹn · hoa hồng · Chưa thanh toán / Thanh toán một phần.
  - Đối soát: kỳ đối soát, Xuất Excel, gửi khiếu nại "Nội dung sai lệch"; **Yêu cầu thanh toán** khi đạt mức tối thiểu (mỗi lúc 1 yêu cầu), hình thức Chuyển khoản (ngân hàng, số TK, tên chủ TK) / Tiền mặt tại phòng khám, xác thực mã 5 phút; nhận email khi đã chi.
  - Tuyến dưới: mời CTV (link mời, SĐT, tên gọi, email, gửi lời mời qua email; trạng thái Đang chờ / Đã chấp nhận / Hết hạn / Bị từ chối), danh sách CTV đang hoạt động / đang mời, cây tuyến dưới (cấp 1 · N khách · N CTV cấp 2), **chia % cho từng tuyến dưới** (0..mức của mình) và mức chia chung, tạm ngưng / mở lại, gỡ khỏi tuyến dưới (hoa hồng đã ghi giữ nguyên).
  - Hồ sơ: tên hiển thị (phòng khám có thể khóa), bật/tắt email thông báo, đổi email (xác nhận mã ở email mới); đổi SĐT / mức hoa hồng / họ tên phải liên hệ phòng khám.
- **Hướng dẫn `/ctv/huong-dan`**: Các bước đăng ký (ảnh minh họa) + Câu hỏi thường gặp.
- Trang đặt lịch công khai nhận `ref=<SĐT>` (kiểm tra REF, ghi lượt ghé), lịch hẹn mang nguồn giới thiệu; POS gợi ý người giới thiệu cho đơn (`orders/{id}/referral-suggestion`).

## 7. Mã ưu đãi (Cài đặt → Zalo Mini App → tab "Ưu đãi · Đối tác · Tin tức")

- Thẻ nhóm nội dung Mini App: Ưu đãi ("Quản lý chiến dịch và mã ưu đãi") · Bảo hiểm (đối tác bảo lãnh viện phí) [NHA KHOA] · Tuyển dụng · Tin tức sức khỏe · Đối tác; mỗi thẻ đếm hiển thị / nháp / lịch.
- Quản trị nội dung: lọc trạng thái (Nháp / Đã lên lịch / Đang hiển thị / Hết hạn / Đã ẩn), sắp xếp (Mới cập nhật / Ngày xuất bản / Thứ tự hiển thị / Tên A–Z), KPI tổng / đang hiển thị / nháp / đã lên lịch; bảng Nội dung (tiêu đề + slug) · Trạng thái · Lịch hiển thị · Thứ tự · (Chỉnh sửa / Ẩn / Xóa).
- **Content Studio** — Chỉnh sửa nhanh (Tiêu đề, Tóm tắt, Ảnh thumbnail, Thứ tự, Thời gian xuất bản, Thời gian hết hạn) hoặc **trình biên tập đầy đủ**: Phân loại · Tiêu đề · Tóm tắt · Liên kết hành động (đường dẫn trong Mini App / website HTTPS; bắt buộc khi xuất bản ưu đãi) · Nội dung bài (Trực quan / HTML / Văn bản, thư viện ảnh JPEG/PNG/WebP/GIF ≤5 MiB) · Thông tin ưu đãi (Nhãn hành động, Nhãn nổi bật, Thời hạn hiển thị).
- **Mã và quy tắc ưu đãi**: Loại mã (Mã dùng chung / Mã riêng từng khách — sinh mã hàng loạt hoặc nhập mã) · Kiểu giảm (Phần trăm / Số tiền cố định) · Phạm vi (Toàn đơn / Nhóm dịch vụ đã chọn / Dịch vụ đã chọn) · Mức giảm · Đơn tối thiểu · Giảm tối đa · Tổng lượt dùng · Lượt mỗi khách · Bắt đầu / Kết thúc (hoặc không xác định ngày kết thúc) · Chi nhánh áp dụng · ☑ **Hiển thị trên app cộng tác viên tặng khách**. Ảnh thumbnail bắt buộc khi xuất bản. Bài ưu đãi tự hiện/ẩn theo ngày.
- Xem trước "Doctor UI" (thẻ nội dung / chi tiết; điện thoại / máy tính bảng). Nút Lưu nháp · Lên lịch xuất bản · Xuất bản ngay.
- Áp dụng ở POS: ô "Nhập mã ưu đãi" khi thu tiền (`orders/{id}/promotion/apply`).

## 8. Cài đặt liên quan Marketing

- **Cấu hình hoa hồng giới thiệu 2 cấp** (`#/referral_program`): bảng chương trình Mã · Tên · Số cấp · Cấp 1 · Cấp 2 · Trạng thái · Version; "+ Chương trình 2 cấp": Tên · Số cấp (1 cấp chỉ trực tiếp / 2 cấp trực tiếp + tuyến trên) · Hiệu lực từ · Cấp 1 (% / Cố định, Mức, Cap/đơn tùy chọn) · ☑ Cấp 2 (% / Cố định, Mức, Cap/đơn). Sửa sinh version mới, không đổi hoa hồng đã ghi.
- **Cấu hình cap / kỳ khóa / rule version**: Sắp có.
- **Trung tâm thông báo** (`#/zalo_messaging`), 7 tab: Tổng quan (số quy tắc đang bật, bản nháp, email song song; định tuyến: số VN → UID Zalo → ZNS, số quốc tế → WhatsApp, không chuyển chéo; Email nhánh độc lập; bộ gửi + hàng đợi) · Kênh & tài khoản · **Thông báo khách hàng** (Lịch hẹn mới, Lịch hẹn định kỳ, Đổi lịch, Hủy lịch, Nhắc lịch, Nhắc tái khám định kỳ, Từ chối đổi lịch, Chúc mừng sinh nhật, Hoàn tất đơn hàng, Biên nhận thu nợ, Phát hành hóa đơn GTGT, nhóm ƯU ĐÃI; mỗi loại: nháp có version/revision, Thời điểm gửi, Kênh gửi theo thứ tự ưu tiên, Mẫu ZNS/WhatsApp đã duyệt, email HTML song song, xem trước với dữ liệu mẫu, Lưu nháp / Xuất bản) · Thông báo nhân viên · Mẫu email (Khách hàng / Nhân viên / Email nội bộ, nhóm, version, Nhân bản) · **Chiến dịch** · **Lịch sử gửi** (lọc trạng thái 15 giá trị, loại tin, kênh Zalo UID/ZNS/WhatsApp/SMS/Email, ngày, chi nhánh; bảng Người nhận · Loại tin · Đối tượng · Trạng thái · Đặt gửi · Cập nhật · Chi nhánh; chọn tin lỗi để gửi lại với lý do Đã sửa cấu hình / Dịch vụ đã phục hồi).
- **Chiến dịch truyền thông** (gửi hàng loạt): danh sách + tìm, "Tạo chiến dịch" 5 bước: 1 Thông tin (tên nội bộ) → 2 Người nhận (nhóm khách đã lưu / tạo nhóm: tên nhóm, chi nhánh, tìm và tích khách; tự loại khách chưa đồng ý nhận tin và số trùng) → 3 Nội dung (mẫu khuyến mại đã được Zalo/Meta duyệt) → 4 Thời gian (gửi ngay sau duyệt / lên lịch) → 5 Kiểm tra (số người đủ điều kiện, số tin dự kiến tính phí, Lưu nháp, Gửi duyệt). Người tạo không tự duyệt; người nhận + nội dung đóng băng khi gửi duyệt; theo dõi tiến độ.
- **Webhook & nhật ký tích hợp**: = Kết nối kênh tab 2–3.
- **Facebook** (Sắp có), **API keys** (Sắp có).
- **Web đặt lịch**: ô "Địa chỉ trang đặt hẹn trên website" để link REF ngắn (xem cai-dat.md).
- **Phụ trách lead theo chi nhánh** (Nhân sự): xem nhan-su.md / cai-dat.md.

## 9. Quy tắc nghiệp vụ thấy được
- Lead: chủ rõ ràng (phụ trách + nhiều người hỗ trợ), tác vụ/nhắc việc chỉ giao cho người trong lead, SLA theo cột (phút), cột có version và khóa khi còn lead, Thắng/Thua là cột cố định, mức chăm sóc theo tuổi cập nhật, chống trùng theo SĐT, gắn hồ sơ khách phải xác nhận tay (không tự gộp).
- Chat: hội thoại có người nhận + SLA nhận/phản hồi tính trong giờ làm việc; chia vòng cho người Sẵn sàng; khách quay lại về người cũ; tôn trọng khung trả lời từng kênh và chi phí tin mẫu; AI chỉ làm việc trong phạm vi đã bật và luôn chuyển người các ca nhạy cảm; quản lý chấm mẫu AI.
- CTV: REF = SĐT di động; link/QR cũ còn 90 ngày khi đổi SĐT; hoa hồng % trên tiền thực trả; hoa hồng riêng từng dịch vụ; 2 cấp có version, cap/đơn; chặn vòng lặp tuyến trên; rút tiền khi đạt mức tối thiểu, 1 yêu cầu một lúc; đảo hoa hồng khi hoàn tiền; email CTV che tên khách, không ghi dịch vụ.
- Gửi tin hàng loạt: phải có đồng ý nhận tin, loại trùng, mẫu đã duyệt, maker-checker, đóng băng danh sách khi gửi duyệt.

## 10. Điểm riêng nha khoa [NHA KHOA]
- Nguồn "Đối tác" là hãng bảo hiểm / TPA bảo lãnh viện phí; nhóm nội dung Mini App "Bảo hiểm".
- Nhiều khách nước ngoài: WhatsApp, LINE, Telegram, AI trả lời đa ngôn ngữ, "Giờ của khách".
- Poster QR mẫu chủ đề nụ cười / nha khoa; e-voucher "dịch vụ nha khoa".
- Còn lại (lead, chat, CTV, ưu đãi, chiến dịch) dùng chung cho mọi ngành dịch vụ.

## 11. Chưa đọc được / chỉ đọc từ mã giao diện
- Báo cáo Inbox: chỉ đọc từ mã (bấm "Báo cáo" trong menu Cài đặt chat bị trùng mục Báo cáo ở sidebar).
- "Kênh và phân quyền" trong Cài đặt chat: không hiện nội dung khi mở; mô tả lấy từ mã + tab Kết nối kênh.
- Danh mục lý do thua của lead (`lead-lost-reasons`): không đọc được giá trị (nút "Đánh dấu thua" không mở hộp chọn khi thử).
- Chiến dịch truyền thông bước 3–5: lấy từ hướng dẫn trên màn (chỉ đi tới bước 2, không lưu).
- Duyệt hoa hồng CTV / quyết toán: chưa có màn, chỉ có API.
- Nội dung trang hướng dẫn CTV là ảnh.
- Mega menu sidebar: suy ra từ cấu hình trong mã (giả lập di chuột không hiện khung bay ra).
- Báo cáo "Hoa hồng giới thiệu" chi tiết: xem bao-cao.md.

## 12. Đề xuất cho AMIA
Xem bảng đối chiếu và danh sách ưu tiên ở `DOI-CHIEU-10-11.md` (mục Marketing).

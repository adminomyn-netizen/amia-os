# BeDental ERP — Mục MARKETING và CTV (đề bài cho AMIA OS)

Nguồn: bản chụp chữ demo BeDental ERP (nhóm C). Không chép tên người, SĐT, email, mã khách. Chỗ nào chỉ có trang tổng quan thì ghi "chưa đọc được". [NHA KHOA] = điểm riêng nha khoa.

## 1. Mục đích

"Marketing và CTV": quản lý lead, kết nối kênh nhắn tin, chiến dịch giới thiệu, cộng tác viên / người giới thiệu (hoa hồng 2 cấp) và tracking link / QR. Trang tổng quan chia 3 nhóm, mỗi thẻ có nhãn trạng thái phát triển:

| Nhóm | Thẻ | Trạng thái nhãn |
|---|---|---|
| LEAD | Hộp Lead (pipeline chăm sóc) | Sẵn sàng |
| | Inbox đa kênh (WhatsApp, Zalo OA, Messenger trong một nơi) | Sẵn sàng |
| | Kết nối kênh (website, Zalo, Facebook, webhook) | Sẵn sàng |
| | Website form (nhúng form thu lead) | Sắp có |
| | Facebook / Zalo / Google form | Sắp có |
| CHIẾN DỊCH | Chiến dịch giới thiệu (có cửa sổ thời gian và trần thưởng) | Sẵn sàng |
| | Tracking link / QR | Sẵn sàng |
| | Landing page chiến dịch | Sắp có |
| | Automation CSKH (kịch bản chăm sóc tự động theo hành vi) | Sắp có |
| CTV / REFERRAL | Danh sách nguồn giới thiệu / CTV | Sẵn sàng |
| | Tuyến trên - tuyến dưới (2 cấp) | Sẵn sàng |
| | Link / QR giới thiệu | Sẵn sàng |
| | Duyệt hoa hồng CTV | Đang hoàn thiện (API có, giao diện chưa xong) |

Cập nhật: bản chụp bổ sung đã đọc được màn bên trong của Hộp Lead, Inbox đa kênh và Kết nối kênh (mục 2.1 - 2.3). Bốn tab của khu referral khi chụp lại đều ra cùng bảng Nguồn giới thiệu, nên nội dung Chiến dịch / Link / Tuyến trên ở 2.5 - 2.7 vẫn dựa vào nguồn đọc trước.

## 2. Từng màn hình

### 2.1 Hộp Lead (marketing_leads) - ĐỌC ĐƯỢC
Pipeline chăm sóc dạng kanban (có thể chuyển sang dạng bảng).
- Thanh trên: nút "Kết nối kênh" (sang 2.3), nút "Cấu hình cột & nguồn" (tự chỉnh cột pipeline và danh sách nguồn/kênh), nút "Thêm lead", công tắc chế độ xem "Kanban | Bảng".
- 6 giai đoạn (cột kanban, mỗi cột có đếm số lead): Mới | Đang liên hệ | Tiềm năng | Đã đặt lịch | Thắng | Thua / Đóng. Cột rỗng hiện "-".
- Hàng bộ lọc (tất cả dạng chọn thả xuống):
  - Giai đoạn (Mọi giai đoạn).
  - Chi nhánh (Mọi chi nhánh).
  - Người phụ trách và Người hỗ trợ (hai vai trò khác nhau trên một lead; danh sách là nhân viên).
  - Nguồn giới thiệu (liên kết với bảng Nguồn giới thiệu / CTV ở 2.4).
  - Kênh: manual | web_form | facebook | zalo | whatsapp | email | walk_in | phone | messenger | instagram | zalo_oa.
  - Tác vụ: tất cả | Còn tác vụ mở | Không có tác vụ mở.
  - Nhắc việc: tất cả | Quá hạn | Hôm nay | Sắp tới | Không có.
  - Tuổi lead (từ lần cập nhật): 0-7 ngày | 8-14 ngày | 15-29 ngày | Từ 30 ngày.
- Thẻ lead trong cột: tên lead (chữ đậm) | mã lead dạng LD-YYMM-xxxxxx (năm, tháng, số thứ tự 6 chữ số) | SĐT (hiện cả đầu số quốc tế khi là khách nước ngoài) | giá trị cơ hội (đ, nếu có) | "Cập nhật N ngày trước" | người phụ trách (hình chữ cái) hoặc nhãn "Chưa nhận" khi chưa ai nhận. Một số thẻ gắn mã KHÁCH HÀNG (lead đã khớp hồ sơ khách có sẵn) và nhãn "Cập nhật hôm nay".
- Quy tắc thấy được: lead có chủ rõ ràng (người phụ trách + hỗ trợ), có tác vụ và nhắc việc đi kèm, tuổi lead để dọn lead nguội, lead có thể liên kết hồ sơ khách. Tìm theo tên/SĐT và form "Thêm lead" (trường nhập) chưa đọc được.
- Dữ liệu demo: 8 lead ở 3 giai đoạn (Mới 5, Thắng 1, Thua / Đóng 2; ba giai đoạn giữa trống) - phần lớn là lead thử nghiệm, nhiều lead chưa có người nhận ("Chưa nhận"), nhiều lead không được cập nhật 70 - 80 ngày, chỉ một lead có giá trị cơ hội.
- Chưa đọc được: giai đoạn "Đang liên hệ / Tiềm năng / Đã đặt lịch" không có lead nên không thấy quy tắc chuyển giai đoạn (kéo thả, bắt buộc lý do khi Thua?), khung chi tiết lead, lịch sử tương tác.

### 2.2 Inbox đa kênh (inbox) - ĐỌC ĐƯỢC KHUNG
Bố cục hai cột kiểu hộp thư chat: danh sách hội thoại trái, khung chat phải ("Chọn một hội thoại để xem" khi chưa chọn).
- Trạng thái nhân viên trực: Sẵn sàng | Tạm vắng | Ngoại tuyến, và nút "Nhận hội thoại mới" (bật thì hệ thống chia hội thoại mới cho mình).
- 4 tab lọc: Của tôi | Chưa giao | Nhóm | Tất cả.
- Mỗi dòng hội thoại: tên người gửi | giờ tin cuối | trích đoạn tin cuối | huy hiệu số tin chưa đọc. Có nút "Xem thêm" (tải thêm).
- Các tin không hiển thị được ghi "Tin chưa hỗ trợ hiển thị"; tin tệp / ảnh hiện nhãn "Tệp đính kèm", "Hình ảnh" (tức vẫn thiếu hỗ trợ sticker, voice, v.v.).
- Hội thoại gắn khách/lead: suy luận vì khung phải chưa đọc được (chưa thấy nút "tạo lead", "gắn khách", "đặt lịch").
- Quy tắc kênh gửi: số Việt Nam -> Zalo; số quốc tế -> WhatsApp (xem cai-dat.md 2.1).
- Chưa đọc được: khung chat bên phải (nút trả lời nhanh, mẫu câu, gán người xử lý, ghi chú nội bộ).

### 2.3 Kết nối kênh (integrations) - ĐỌC ĐƯỢC KHUNG
Màn "Tích hợp kênh" có 3 tab: Kênh | Webhook Events | Integration Logs. Nút "Tải lại".
- Bảng nhật ký sự kiện: Thời gian | Kênh | Loại | External ID | Trạng thái | Lỗi. Demo rỗng ("Chưa có webhook event").
- Tab "Kênh" (danh sách kênh đã kết nối: Facebook, Zalo OA, website, WhatsApp; nút Kết nối / Ngắt) không hiện trong bản chụp (chưa đọc được).
- Quy tắc: mọi tin/lead vào qua webhook đều được ghi vết (kênh, loại, mã ngoài, trạng thái, lỗi) để dò lỗi tích hợp; "External ID" cho phép chống ghi trùng.

### 2.4 Nguồn giới thiệu / CTV (đường dẫn referral)
Cả khu referral dùng chung một thanh tab: Nguồn giới thiệu · Chiến dịch · Link / QR · Tuyến trên và báo cáo 2 cấp. Phía trên có thêm nút "Hoa hồng người giới thiệu" (báo cáo).
- Bộ lọc: chi nhánh (tất cả hoặc từng chi nhánh), khoảng thời gian (mặc định "Hôm nay"). Nút: Xuất Excel · Thêm nguồn giới thiệu.
- KPI: TỔNG HOA HỒNG (tổng đ trong kỳ lọc).
- Bảng: Nguồn giới thiệu (tên + mã) · Loại (ví dụ "Đối tác"; ngoài ra mô tả nói có nhân viên và khách) · Số khách giới thiệu · Tổng số đơn hàng · Tổng doanh thu · Tổng hoa hồng · Thao tác (Sửa, Chi tiết). Có phân trang "Hiện 1 đến N của N kết quả".
- Dữ liệu demo: 4 nguồn đều loại Đối tác (hãng bảo hiểm và đơn vị bảo lãnh viện phí TPA), chưa phát sinh khách, đơn hay hoa hồng. [NHA KHOA]: đối tác bảo hiểm là một loại nguồn giới thiệu.

### 2.5 Chiến dịch giới thiệu
- Nút: "+ Chiến dịch". Bảng: Mã · Tên · Trạng thái · Bắt đầu · Kết thúc. Demo rỗng ("Chưa có chiến dịch").
- Mô tả: chiến dịch referral có cửa sổ thời gian (bắt đầu - kết thúc) và trần thưởng (giới hạn tổng chi). Form tạo chiến dịch chưa đọc được.

### 2.6 Link / QR giới thiệu và Tracking link / QR
Hai thẻ cùng mở một màn (tab "Link / QR").
- Nút: "+ Link theo dõi". Bảng: Mã tracking · URL · Trạng thái · Thao tác. Demo rỗng ("Chưa có link theo dõi").
- Mục đích: link + QR theo nguồn / CTV / chiến dịch để biết khách đến từ đâu. Không thấy bảng thống kê lượt bấm hay quét; chưa đọc được.

### 2.7 Tuyến trên - tuyến dưới và báo cáo 2 cấp
- Ghi chú trên màn: mức hoa hồng 2 cấp được cấu hình ở Cài đặt (Hoa hồng và Cộng tác viên, Cấu hình hoa hồng 2 cấp); màn này chỉ để quản lý tuyến trên và xem báo cáo bút toán 2 cấp.
- KPI: HOA HỒNG CẤP 1 · HOA HỒNG CẤP 2 · TỔNG.
- Khối "Quan hệ tuyến trên": nút "+ Gán tuyến trên". Bảng: Tuyến dưới (child) · Tuyến trên (parent) · Hiệu lực từ · Đã dùng ledger (cờ đã phát sinh bút toán thì không đổi tuyến) · Thao tác.
- Khối "Bút toán hoa hồng theo cấp": lọc Tất cả cấp / Chỉ cấp 1 / Chỉ cấp 2. Bảng: Thời gian · Cấp · Người giới thiệu trực tiếp · Người hưởng · DT tính HH (doanh thu tính hoa hồng) · Hoa hồng. Demo rỗng.

### 2.8 Duyệt hoa hồng CTV
Nhãn "Đang hoàn thiện": nền API có, giao diện chưa xong. Hình dung: một đợt duyệt (batch) gom bút toán hoa hồng CTV của kỳ, người có quyền duyệt rồi mới chi. Chưa đọc được màn.

## 3. Quy tắc nghiệp vụ thấy được
- Hoa hồng giới thiệu 2 cấp: cấp 1 cho người giới thiệu trực tiếp, cấp 2 cho tuyến trên của người đó. Mức từng cấp do admin nhập, KHÔNG hardcode, versioned: sửa cấu hình sinh version mới và không ảnh hưởng hoa hồng đã ghi (xem cai-dat.md).
- Sổ cái (ledger) bút toán hoa hồng ghi cấp, người giới thiệu trực tiếp, người hưởng, doanh thu tính hoa hồng. Quan hệ tuyến trên có ngày hiệu lực và khóa khi đã dùng.
- Chiến dịch có cửa sổ thời gian và trần thưởng; tracking link/QR gắn nguồn để quy doanh thu về đúng người.
- Nguồn giới thiệu có loại: Đối tác, nhân viên, khách; mã định danh riêng.
- Duyệt hoa hồng CTV qua đợt duyệt riêng (đang hoàn thiện), liên quan chính sách phê duyệt maker-checker.
- Kênh nhắn tin: tách theo đầu số (Việt Nam dùng Zalo/ZNS, quốc tế WhatsApp).

## 4. Điểm riêng nha khoa [NHA KHOA]
- Nguồn giới thiệu loại "Đối tác" là hãng bảo hiểm / đơn vị bảo lãnh viện phí; doanh thu từ bảo lãnh được tính theo nguồn.
- Kênh WhatsApp cho khách quốc tế (khách nước ngoài chữa răng).
- Phần còn lại (lead, chiến dịch, CTV, tracking) là chung cho mọi ngành dịch vụ, không đặc thù nha khoa.

## 5. Đề xuất cho AMIA

Làm theo thứ tự:
1. Nguồn giới thiệu / CTV + tracking link / QR (đơn giản, đo được ngay): bảng nguồn (loại: CTV, nhân viên, khách, đối tác, KOL), mã tracking sinh QR, ghi lại nguồn vào lead / khách / đơn.
2. Hộp Lead (pipeline): đây là lõi cho spa/da liễu. Kanban 6 giai đoạn (Mới, Đang liên hệ, Tiềm năng, Đã đặt lịch, Thắng, Thua/Đóng) + chế độ bảng; thẻ lead: tên, mã lead (LD-YYMM-số), SĐT, giá trị cơ hội, tuổi lead, người phụ trách / "Chưa nhận"; bộ lọc: giai đoạn, chi nhánh, người phụ trách, người hỗ trợ, nguồn giới thiệu, kênh, tác vụ mở, nhắc việc, tuổi lead; cấu hình cột và nguồn tùy chỉnh. Thêm cột dịch vụ quan tâm và lịch hẹn. Nối thẳng sang module Lịch hẹn và Khách hàng (khớp lead với hồ sơ khách). Học lỗi demo: có quy tắc "lead không có người nhận quá N giờ thì nhắc quản lý" và dọn lead nguội, vì demo để nhiều lead 70 - 80 ngày không đụng tới.
3. Hoa hồng giới thiệu 1 cấp, có version, bút toán sổ cái (cấp 1 làm trước; cấp 2 thêm sau vì AMIA có thể chưa cần đa cấp).
4. Chiến dịch giới thiệu có thời hạn + trần thưởng.
5. Duyệt hoa hồng CTV theo đợt, dùng chung engine phê duyệt maker-checker.
6. Inbox đa kênh (Zalo OA, Messenger; bỏ WhatsApp nếu không có khách quốc tế) sau khi pipeline chạy ổn: hai cột, trạng thái trực Sẵn sàng / Tạm vắng / Ngoại tuyến, nhận hội thoại mới tự động, tab Của tôi / Chưa giao / Nhóm / Tất cả, huy hiệu chưa đọc, hiển thị đủ loại tin (đừng để "tin chưa hỗ trợ hiển thị" như demo). Kết nối kênh kèm nhật ký webhook (thời gian, kênh, loại, external id, trạng thái, lỗi) để dò lỗi.

Bỏ hoặc để sau: Website form, form Facebook/Zalo/Google (chính là "Sắp có" ở bản gốc), Landing page, Automation CSKH (đáng làm sau khi có dữ liệu hành vi; AMIA có thể ưu tiên nhắc lịch tái khám / hết liệu trình).
Cần thêm so với bản gốc: bảng điểm quy đổi lead -> khách đến -> doanh thu theo nguồn (bản gốc chỉ có theo nguồn giới thiệu), chi phí quảng cáo để tính CPL / ROAS.

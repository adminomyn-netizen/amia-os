# Nơi làm việc (BeDental ERP, mục `tasks`)

Nguồn: demo BeDental, đọc trực tiếp giao diện + mã giao diện ngày 10/11/2026 (bản 27/10 đọc từ ảnh chụp chữ). Không chép tên người, số điện thoại, mã khách; chỉ ghi cấu trúc. [NHA KHOA] = điểm riêng nha khoa.

Cập nhật 10/11/2026: màn "Việc cần làm" đã làm lại hẳn (trước 27/10 chỉ là khung rỗng): 4 tab (Việc cần làm của tôi · Đo lường hiệu suất · Quản lý dữ liệu · nhãn "Bảng điều khiển dành cho quản trị viên"), nút "Giao việc" với form đầy đủ, 7 bộ đếm, khung chi tiết 3 tab (Chi tiết · Hồ sơ xử lý · Nhận xét có @nhắc), nút Bắt đầu / Hoàn thành / Từ chối-Hủy / Cuộc trò chuyện nhóm / CC. Đọc được form "Tạo đề xuất" (thanh toán và tạm ứng lương: chọn người duyệt, người theo dõi, đính kèm), khung chi tiết của Trung tâm phê duyệt (4 tab, nút Phê duyệt / Từ chối / Yêu cầu bổ sung / Thực thi ghi sổ, xác nhận rủi ro cao), luồng "Cần bổ sung → Gửi lại để duyệt (lần N)". Tên thẻ "Việc cần hoàn thành" đổi thành "Việc cần làm". Các thẻ, nhãn trạng thái còn lại không đổi.

## 1. Mục đích
"Cổng làm việc hằng ngày: việc cần làm, chấm công, hợp đồng và các đề xuất." Lưới thẻ 3 nhóm:

| Nhóm | Thẻ | Nhãn | Mô tả |
|---|---|---|---|
| CÔNG VIỆC & CHẤM CÔNG | Việc cần làm | Sẵn sàng | Việc được giao cho tôi, việc tôi giao và việc quá hạn. Không dùng cho phê duyệt tài chính/kế toán |
| | Xem bảng chấm công | Sẵn sàng | Bảng chấm công và giờ làm thực tế (mở màn Chấm công của Nhân sự) |
| | Tạo Báo cáo ngày | Sẵn sàng | Báo cáo công việc cuối ngày (khác báo cáo doanh thu) |
| KIẾN THỨC NỘI BỘ | Wiki công ty | Sẵn sàng | Quy định, quy trình, tài liệu đã ban hành, công khai nội bộ |
| ĐỀ XUẤT & HỒ SƠ | Trình duyệt hợp đồng | Sẵn sàng | Tra cứu hợp đồng và hồ sơ pháp lý |
| | Trung tâm phê duyệt | Đang hoàn thiện | Một nơi duy nhất duyệt nghỉ phép/OT, đề xuất nội bộ, thao tác nhạy cảm |
| | Đề xuất mua sắm | Sẵn sàng | PR / PO (mở Kho & Mua sắm → Mua hàng) |
| | Đề xuất thanh toán | Sẵn sàng | Đề xuất chi/thanh toán, gửi quản lý duyệt |
| | Đề xuất tạm ứng lương | Sẵn sàng | Xin tạm ứng lương, gửi quản lý duyệt |

Nguyên tắc: làm việc của tôi tách khỏi duyệt; duyệt chỉ ở Trung tâm phê duyệt.

## 2. Các màn hình con

### 2.1 Việc cần làm (`tasks_todo`) — ĐỌC ĐƯỢC ĐỦ
- Tab trên: Việc cần làm của tôi | Đo lường hiệu suất | Quản lý dữ liệu; bên phải nhãn "Bảng điều khiển dành cho quản trị viên" và nút "+ Giao việc" (người có quyền).
- 7 bộ đếm (cũng là bộ lọc): Việc cần làm · Đến hạn hôm nay · Việc quá hạn · Tôi đã giao · Đang theo dõi · Tất cả việc của tôi · Xong. Ghi chú: "Nơi làm việc gom việc cần làm, phê duyệt, CC và dữ liệu vận hành. Các mục CC/nhận xét sâu sẽ nối ở phase sau."
- Lọc thời gian "Mọi thời điểm ⌄", ô "Tìm công việc". Ngoài việc giao tay, danh sách còn gom việc từ nơi khác: "Cần bổ sung chứng từ", "Chờ tôi xử lý", với link "Mở lịch hẹn để duyệt →" / "Mở trong Trung tâm phê duyệt →".
- Dòng việc: tiêu đề · Hạn · người phụ trách (chữ cái đầu + tên) · trạng thái.
- Khung chi tiết: số việc (mã) · tiêu đề · trạng thái · người phụ trách · chi nhánh · "Đã tạo: giờ ngày". 3 tab:
  - Chi tiết: Nội dung cần xử lý · Mô tả · Người phụ trách · Chi nhánh · Hạn xử lý · Mức ưu tiên.
  - Hồ sơ xử lý: bảng Tên bước | Người xử lý | Kết quả | Thời gian (Giao việc → Xử lý → Kết thúc; kết quả Đã giao / Chờ xử lý / Hoàn thành / Chưa hoàn thành).
  - Nhận xét: luồng bình luận, ô "@ Nhắc ai đó…" (chọn nhân viên), nút Gửi, đính kèm tệp (tối đa 5 tệp/nhận xét).
  - Nút: Bắt đầu · Hoàn thành · Từ chối / Hủy · Cuộc trò chuyện nhóm · CC.
- Trạng thái việc: Chờ xử lý · Đang làm · Hoàn thành · Đã hủy; cờ "Đã đến hạn" / quá hạn.
- Form "Giao việc": Tên nhiệm vụ ("Thêm nhiệm vụ") · Mô tả · Người được giao (danh sách nhân viên kèm chức danh; người chưa có tài khoản ghi "(chưa có tài khoản)") · Hạn (Hôm nay | Ngày mai | Khác) · Ưu tiên (Thấp | Bình thường | Cao | Khẩn) · "Thêm vào Danh sách tác vụ" · tệp đính kèm (PDF hoặc ảnh, ≤ 20MB/tệp) · "Thêm người đăng ký" (người theo dõi / CC) · Hủy / nút lưu.
- Tab "Đo lường hiệu suất" (theo phạm vi bộ đếm đang chọn): Tổng công việc (đang mở · hoàn thành) · Tỉ lệ hoàn thành % · Xử lý ĐÚNG HẠN % (trên việc hoàn thành có hạn) · Đang QUÁ HẠN % (trên việc đang mở có hạn) · "Tiến độ theo trạng thái" (Chờ xử lý / Đang làm / Hoàn thành / Đã hủy) · ghi chú số việc chưa đặt hạn không tính.
- Tab "Quản lý dữ liệu": danh sách dạng thẻ (Nội dung · Hạn · người · trạng thái) cùng khung chi tiết.

### 2.2 Xem bảng chấm công
Mở màn Chấm công của Nhân sự (xem nhan-su.md).

### 2.3 Tạo Báo cáo ngày (`wp_daily_report`)
Không đổi: Ngày báo cáo · Nộp thay nhân viên (mặc định "Chính tôi") · Đã làm hôm nay * ("Liệt kê công việc đã hoàn thành…") · Vướng mắc · Kế hoạch hôm sau · "Nộp báo cáo"; danh sách tab Của tôi | Tất cả. 1 báo cáo / người / ngày, nộp lại cùng ngày thì cập nhật.

### 2.4 Trung tâm phê duyệt (`approval_center`)
- Tiêu đề + nút "Tải lại"; ghi chú màn cấu hình (Quy trình phê duyệt HR, Chính sách phê duyệt) không dùng để duyệt.
- Tab nguồn: Tất cả | Nghỉ phép / OT / HR | Thao tác nhạy cảm | Đề xuất nội bộ. Lọc trạng thái: Mọi trạng thái · Chờ duyệt · Đang duyệt · Cần bổ sung · Đã duyệt · Chờ ghi sổ · Đã thực thi · Lỗi thực thi · Từ chối · Đã hủy. Ô "Tìm yêu cầu" (tiêu đề, mã, mô tả). Danh sách giới hạn 100 dòng ("Danh sách vượt ngưỡng hiển thị — hãy lọc…").
- Bộ đếm theo vai: Tất cả · Chờ tôi duyệt · Tôi đã gửi · Đã CC/Theo dõi · Đã xử lý · Bị từ chối.
- Dòng: loại · trạng thái · "mã · tên thao tác" (vd "DX26A0xx · Lập phiếu chi thủ công") · chi nhánh · người gửi · giờ gửi · mức rủi ro (Rủi ro cao / Nghiêm trọng) · "Hạn …" hoặc "Quá hạn · …" · "Lần N" (vòng gửi lại).
- Khung chi tiết: Module · Loại (mã, vd `cashbook.reverse`) · Chi nhánh · Người gửi · Gửi lúc · Hạn SLA (= 24h sau khi gửi). 4 tab:
  - Chi tiết: Nội dung · "Thông tin phiếu" (Nội dung, Số tiền, Quỹ, Ngày chứng từ, Loại / Kiểu sổ quỹ) · "Thông tin" (Mã yêu cầu, Loại, Module, Chi nhánh, Người gửi, Gửi lúc, Hạn SLA, Trạng thái).
  - Hồ sơ phê duyệt: Các bước duyệt · Diễn tiến quyết định.
  - Nhận xét & tệp đính kèm: nhận xét bắt buộc nội dung, ≤ 5 tệp; xem nhanh ảnh (thu nhỏ / phóng to / xoay / tải gốc).
  - Nhật ký hệ thống.
- Nút xử lý: Phê duyệt · Từ chối đề nghị (Lý do từ chối bắt buộc) · Yêu cầu bổ sung (Nội dung cần bổ sung bắt buộc) · Thực thi ghi sổ (Ghi chú khi ghi sổ). Thao tác rủi ro cao: hộp cảnh báo "có thể ảnh hưởng đến tiền, doanh thu, công nợ, kho hoặc bút toán…" + ô tích bắt buộc "Tôi đã kiểm tra chứng từ và xác nhận cho phép xử lý thao tác rủi ro cao" + đính kèm chứng từ (ảnh/PDF/DOCX/XLSX, lưu riêng tư, tải qua link ký số). Không có quyền thì hiện "Bạn không có quyền xử lý việc này (chỉ xem)".
- Người gửi khi bị "Cần bổ sung": đính kèm chứng từ (≤ 25MB/tệp), "Ghi chú cho người duyệt", nút "Gửi lại để duyệt (lần N)".
- Loại thao tác nhạy cảm thấy trong dữ liệu: Lập phiếu chi thủ công, Lập phiếu thu thủ công, Đảo phiếu đã ghi sổ (Nghiêm trọng), thu nợ ghi lùi ngày. Demo nay ~100 việc, phần lớn đã thực thi; nhiều chi nhánh gửi phiếu chi tay hằng ngày.
- Hai route cũ (`approval_inbox`, `approval_console`) vẫn mở cùng màn này.

### 2.5 Đề xuất thanh toán / Đề xuất tạm ứng lương (`wp_requests`)
- Hai tab; nút "Tạo đề xuất"; lọc Của tôi | Tất cả; nút "Mở Trung tâm phê duyệt".
- Form "Tạo đề xuất" (hai loại cùng form): Số tiền (đ) * · Cần trước ngày · Tạo thay nhân viên (mặc định "Chính tôi") · Tiêu đề * · Lý do * · Người duyệt * (chọn một hoặc nhiều; "một người duyệt là hoàn tất") · Người theo dõi (không bắt buộc) · Tệp đính kèm (tối đa 5 tệp; ảnh 10MB, tài liệu 25MB) · Hủy / Gửi đề xuất.
- Bảng: Nhân viên | Số tiền | Tiêu đề / Lý do | Cần trước | Trạng thái | Thao tác (+ "N tệp").

### 2.6 Đề xuất mua sắm
Mở Kho & Mua sắm → Mua hàng (PR/PO), xem kho-mua-sam.md 3.7.

### 2.7 Trình duyệt hợp đồng (`hr_contracts`)
Không đổi so với 27/10 (8 tab, 13 trạng thái ký, 7 loại hợp đồng; vẫn lỗi phân trang thô "limit must not be greater than 200…"). Chi tiết ở nhan-su.md / van-ban-hop-dong.md.

### 2.8 Wiki công ty (`company_wiki`)
Không đổi: ô tìm "Tìm theo tên, số văn bản hoặc nội dung tóm tắt…", lọc "Tất cả tài liệu", khung "Nguồn tài liệu chính thức" (chỉ văn bản đã ban hành + còn hiệu lực + bật "Công khai trên Wiki công ty"; không sao chép hồ sơ gốc; không sửa tại Wiki; tự ẩn khi hết hiệu lực). Demo trống.

## 3. Quy tắc nghiệp vụ thấy được
1. Duyệt chỉ một nơi; các màn khác chỉ gửi/theo dõi.
2. Thao tác nhạy cảm (thu/chi tay, đảo phiếu, ghi lùi ngày) bắt buộc qua duyệt, có mức rủi ro, xác nhận đã kiểm chứng từ; thực thi sau duyệt (Chờ ghi sổ → Đã thực thi / Lỗi thực thi).
3. SLA 24 giờ; quá hạn hiện "Quá hạn" và lên Dashboard.
4. Có vòng "Cần bổ sung" → gửi lại (đếm lần).
5. Đề xuất chọn người duyệt cụ thể, một người duyệt là xong; có người theo dõi.
6. Việc có hồ sơ xử lý theo bước, bình luận @nhắc, CC, đo đúng hạn / quá hạn.
7. Báo cáo ngày 1 / người / ngày.
8. Wiki chỉ đọc, lấy từ văn bản đã ban hành.

## 4. Điểm riêng nha khoa [NHA KHOA]
- Đề xuất thanh toán lab/xưởng răng, công cắm implant; bác sĩ trong danh sách giao việc.

## 5. Đề xuất cho AMIA
(Đối chiếu đủ: DOI-CHIEU-10-11.md.) Từ 31/10, việc cần làm / báo cáo ngày / HR thuộc MSC OS; AMIA chỉ giữ phần dính tiền-hàng: Trung tâm phê duyệt và các đề xuất chi / mua sắm / tạm ứng. Nên học cho AMIA: trạng thái "Cần bổ sung" + gửi lại có đếm lần; mức rủi ro + ô xác nhận đã kiểm chứng từ; đính kèm chứng từ ở đề xuất và khi duyệt; chọn người duyệt + người theo dõi ngay trong form; tab "Đã CC/Theo dõi"; hồ sơ phê duyệt và nhật ký hệ thống trong khung chi tiết; đưa thu/chi tay và xóa phiếu sổ quỹ vào hàng duyệt "Thao tác nhạy cảm". Phần việc (giao việc, @nhắc, CC, đo hiệu suất): chuyển cho MSC OS.

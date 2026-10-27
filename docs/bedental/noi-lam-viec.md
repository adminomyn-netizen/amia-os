# Nơi làm việc (BeDental ERP, mục `tasks`)

Nguồn: chữ chụp từ bản demo BeDental, gồm cả bản chụp bổ sung đọc được màn con của Việc cần hoàn thành, Báo cáo ngày, Trung tâm phê duyệt (và hai màn "legacy"), Đề xuất thanh toán / tạm ứng lương, Wiki công ty. Không có tên người, số điện thoại, mã khách nào được chép lại; chỉ ghi cấu trúc.

## 1. Mục đích
Cổng làm việc hằng ngày của mọi nhân viên. Màn gốc là một lưới thẻ chia 3 nhóm, mỗi thẻ có nhãn trạng thái ("Sẵn sàng" hoặc "Đang hoàn thiện"):

| Nhóm | Thẻ | Nhãn | Mô tả của chính hệ thống |
|---|---|---|---|
| CÔNG VIỆC & CHẤM CÔNG | Việc cần hoàn thành | Sẵn sàng | Việc giao cho tôi, việc tôi giao, việc quá hạn. Không dùng cho phê duyệt tài chính/kế toán |
| | Xem bảng chấm công | Sẵn sàng | Bảng chấm công và giờ làm thực tế |
| | Tạo Báo cáo ngày | Sẵn sàng | Nhân viên nộp báo cáo công việc cuối ngày (khác báo cáo doanh thu theo ngày ở mục Báo cáo) |
| KIẾN THỨC NỘI BỘ | Wiki công ty | Sẵn sàng | Tra cứu quy định, quy trình, tài liệu đã ban hành, công khai nội bộ |
| ĐỀ XUẤT & HỒ SƠ | Trình duyệt hợp đồng | Sẵn sàng | Tra cứu hợp đồng và hồ sơ pháp lý |
| | Trung tâm phê duyệt | Đang hoàn thiện | Một nơi duy nhất duyệt nghỉ phép/OT, đề xuất nội bộ, thao tác nhạy cảm trước khi ghi nhận |
| | Đề xuất mua sắm | Sẵn sàng | Phiếu đề nghị mua hàng (PR) và đơn mua hàng (PO) |
| | Đề xuất thanh toán | Sẵn sàng | Đề xuất chi/thanh toán một khoản, gửi quản lý duyệt |
| | Đề xuất tạm ứng lương | Sẵn sàng | Nhân viên xin tạm ứng lương, gửi quản lý duyệt |

Nguyên tắc thiết kế thấy rõ: **làm việc của tôi** (việc, chấm công, báo cáo) tách khỏi **duyệt** (chỉ ở Trung tâm phê duyệt). Các màn "Đề xuất ..." chỉ để gửi và theo dõi, nút "Mở Trung tâm phê duyệt" dẫn sang nơi duyệt.

## 2. Các màn hình con

### 2.1 Việc cần hoàn thành / Xem bảng chấm công / Tạo Báo cáo ngày

**Việc cần hoàn thành (`tasks_todo`)** - đọc được khung, danh sách rỗng
- Bố cục tách đôi: danh sách việc bên trái, khung chi tiết bên phải với dòng "Chọn một việc để xem chi tiết." Bản chụp không có dòng việc nào nên các tab (giao cho tôi / tôi giao / quá hạn), cột và nút trong danh sách chưa đọc được.
- Cấu trúc một dòng việc xem được ở khối "Việc cần hoàn thành của tôi" trên Dashboard: tiêu đề (loại + mã), nhãn loại (vd "approval"), hạn (ngày giờ), cờ "Quá hạn", nút "Mở". Nguồn việc gồm cả phê duyệt được giao cho mình.

**Xem bảng chấm công**: (suy luận) dẫn sang màn Chấm công của Nhân sự (xem nhan-su.md 2.2 - 2.4); bản chụp bổ sung không có tệp riêng.

**Tạo Báo cáo ngày (`wp_daily_report`)** - ĐỌC ĐƯỢC
- Mô tả: "Nộp báo cáo công việc cuối ngày. Mỗi nhân viên một báo cáo cho mỗi ngày - nộp lại cùng ngày sẽ cập nhật bản cũ."
- Form: Ngày báo cáo | "Nộp thay nhân viên" (thả xuống liệt kê toàn bộ nhân viên, mặc định "Chính tôi"; bỏ trống = nộp cho chính mình; quản lý nộp hộ được) | Đã làm hôm nay * (bắt buộc) | Vướng mắc | Kế hoạch hôm sau | nút "Nộp báo cáo".
- Danh sách báo cáo bên dưới: hai tab "Của tôi" | "Tất cả" (Tất cả dành cho người có quyền xem); rỗng hiện "Chưa có báo cáo nào." Cột/chi tiết khi có dữ liệu chưa đọc được.
- Quy tắc: 1 báo cáo / người / ngày (upsert); 3 trường cố định (đã làm, vướng, kế hoạch) đúng với đề xuất "đã xong - vướng - mai làm" của AMIA.

### 2.2 Trung tâm phê duyệt (`approval_center`)
- Tiêu đề: "Một nơi duy nhất xử lý phê duyệt — hợp nhất HR, thao tác nhạy cảm và đề xuất nội bộ qua adapter thống nhất". Nút "Tải lại".
- Ghi chú: các màn cấu hình quy trình/chính sách (Nhân sự → Quy trình phê duyệt HR, Cài đặt → Chính sách phê duyệt) KHÔNG dùng để duyệt trực tiếp.
- Bộ lọc loại (tab): Tất cả / Nghỉ phép - OT - HR / Thao tác nhạy cảm / Đề xuất nội bộ.
- Bộ lọc trạng thái: Mọi trạng thái, Chờ duyệt, Đang duyệt, Cần bổ sung, Đã duyệt, Chờ ghi sổ, Đã thực thi, Lỗi thực thi, Từ chối, Đã hủy.
- Bộ đếm theo vai trò của người xem: Tất cả (49), Chờ tôi duyệt (8), Tôi đã gửi (0), Đã CC/Theo dõi (0), Đã xử lý (32), Bị từ chối (2).
- Danh sách (bên trái) mỗi dòng gồm: loại (Thao tác nhạy cảm / Đề xuất nội bộ), trạng thái, tiêu đề (mã + tên thao tác, hoặc nội dung đề xuất do người gửi gõ), chi nhánh, người gửi, thời điểm gửi, mức rủi ro (Rủi ro cao / Nghiêm trọng), hạn duyệt (SLA) hoặc "Quá hạn".
- Khung chi tiết (bên phải): "Chọn một việc để xem chi tiết và xử lý." Nội dung chi tiết/nút Duyệt-Từ chối chưa đọc được vì bản chụp chưa chọn dòng nào.
- Nguồn dữ liệu hợp nhất ("adapter"): demo 49 việc = 19 "Thao tác nhạy cảm" + 30 "Đề xuất nội bộ" + 0 việc "Nghỉ phép / OT / HR" (chưa có quy trình HR nào, xem nhan-su.md 2.7). Thao tác nhạy cảm có mã (DX + năm + chữ cái + số thứ tự chạy liên tục; mã AP-YYMM-nnnnnn là bộ đếm cũ hơn của cùng loại việc); đề xuất nội bộ không mã, tiêu đề là câu người gửi gõ.
- Số liệu minh họa: trong 19 thao tác nhạy cảm, 12 "Đã thực thi", 1 "Chờ ghi sổ" (đã duyệt, chờ thực thi), 6 "Chờ duyệt" (nhiều việc "Quá hạn" do sang ngày hôm sau chưa ai duyệt); các việc chờ nhiều nhất là phiếu chi thủ công và thu nợ lùi ngày của một chi nhánh.
- Mỗi dòng danh sách có 3 phần: dòng loại + trạng thái, dòng tiêu đề + chi nhánh + người gửi + giờ gửi, dòng mức rủi ro (Rủi ro cao / Nghiêm trọng) và hạn (đang chờ thì hiện "Hạn HH:mm dd-mm", quá hạn thì "Quá hạn - HH:mm dd-mm").
- Hai màn "legacy" cùng giao diện và cùng tên "Trung tâm phê duyệt" nhưng đã bị lọc sẵn: "Việc cần duyệt kiểm soát ghi nhận" chỉ hiện loại Thao tác nhạy cảm (19 việc: Chờ tôi duyệt 6, Đã xử lý 12), "Việc cần duyệt HR" chỉ hiện loại HR (0 việc). Cả ba lối vào đều là cùng một hàng chờ. AMIA chỉ cần MỘT màn và các tab lọc loại.
- Các loại "thao tác nhạy cảm" thấy trong dữ liệu: lập phiếu chi thủ công, lập phiếu thu thủ công, đảo phiếu đã ghi sổ (mức Nghiêm trọng), thu hồi công nợ ghi lùi ngày (`debt_collection.backdate`), `cashbook.manual_expense`.
- Mã chứng từ: đề xuất có dạng `DX` + năm + chữ cái + số thứ tự; phiếu phê duyệt có dạng `AP-` + năm tháng + 6 chữ số.
- [NHA KHOA] Nội dung đề xuất thanh toán thực tế toàn là: công nợ với lab/xưởng răng (theo tháng), công cắm Implant trả cho bác sĩ theo bệnh nhân, nhà cung cấp vật tư, quảng cáo. Nghĩa là "chi trả cho lab và công bác sĩ" là dòng tiền riêng của nha khoa.

### 2.3 Đề xuất thanh toán / Đề xuất tạm ứng lương (`wp_requests`)
- Hai tab cùng một màn: Đề xuất thanh toán | Đề xuất tạm ứng lương. Nút "Tạo đề xuất". Bộ lọc: Của tôi | Tất cả.
- Câu giải thích: màn này để gửi và theo dõi; duyệt/từ chối xử lý tập trung tại Trung tâm phê duyệt (nút "Mở Trung tâm phê duyệt").
- Bản chụp bổ sung: cả hai tab đều ra cùng một màn (câu mô tả "Đề xuất chi/thanh toán một khoản, gửi quản lý duyệt") với nút "Tạo đề xuất", hai tab, bộ lọc "Của tôi | Tất cả", khung giải thích và nút "Mở Trung tâm phê duyệt"; danh sách rỗng "Chưa có đề xuất nào." (đề xuất đã gửi nằm ở Trung tâm phê duyệt, không hiện ở đây).
- Trường nhập (form tạo) vẫn chưa thấy; từ danh sách đã duyệt suy ra đề xuất có: nội dung tự do (tiêu đề), chi nhánh, người gửi, số tiền (suy ra, chưa thấy), có thể đính kèm chứng từ.
- Demo trống: "Chưa có đề xuất nào."

### 2.4 Đề xuất mua sắm (`inventory_ops`, thuộc mục Kho & Mua sắm)
- Mở ra thanh menu của Kho & Mua sắm: Tổng quan tồn kho, Kho hàng, Nhập kho, Tồn kho, Ledger, Nhà cung cấp, Mua hàng, Công nợ NCC, Điều chuyển kho, Điều chỉnh tồn, Kiểm kê kho, Hướng dẫn.
- (Bản chụp bổ sung của các tab Kho không đổi được tab, xem kho-mua-sam.md.) Hai tab: Yêu cầu mua (PR) | Đơn mua hàng (PO). Nút "Tạo yêu cầu mua".
- Bảng PR: Mã | Ưu tiên | Trạng thái | Ngày tạo | Thao tác. Demo trống: "Chưa có yêu cầu mua."
- Luồng ngầm: PR (nhân viên) -> duyệt -> PO (gửi nhà cung cấp) -> nhập kho -> công nợ NCC.

### 2.5 Trình duyệt hợp đồng (`hr_contracts`, thuộc Nhân sự > Hợp đồng & Pháp lý)
- Tab (theo chữ chụp, "Mẫu hợp đồng" xuất hiện hai lần: một là nút nhanh, một là tab): Hướng dẫn | Mẫu hợp đồng | Tạo hợp đồng | Danh sách hợp đồng | Mẫu hợp đồng | Hồ sơ pháp lý | Ký điện tử | Hướng dẫn quy trình. Đường dẫn vào màn: Nhân sự > Hợp đồng & Pháp lý.
- Bộ lọc trạng thái hợp đồng: Nháp, Chờ duyệt, Đã duyệt, Từ chối, Đã gửi ký, NV đã xem, NV đã ký, Công ty đã ký, Hoàn tất ký, Đang hiệu lực, Sắp hết hạn, Hết hạn, Chấm dứt.
- Bộ lọc loại: Thử việc, Xác định thời hạn, Không xác định thời hạn, Cộng tác viên, Phụ lục hợp đồng, Quyết định bổ nhiệm, Quyết định chấm dứt.
- Có lỗi hiển thị phân trang thô (limit/offset không hợp lệ) trên bản demo; AMIA cần tránh.
- Demo trống: "Chưa có hợp đồng nào — Bấm + Tạo hợp đồng để bắt đầu."

### 2.6 Wiki công ty (`company_wiki`)
- Tiêu đề phụ "NƠI LÀM VIỆC · KIẾN THỨC NỘI BỘ"; mô tả "Tra cứu quy định, quy trình và tài liệu đã ban hành và công khai nội bộ". Có ô Tìm kiếm, bộ lọc "Tất cả tài liệu" (lọc theo loại văn bản), khung "Nguồn tài liệu chính thức". Trạng thái rỗng: "Chưa có tài liệu công khai - Tài liệu sẽ xuất hiện tại đây sau khi được ban hành và công khai nội bộ từ module Văn bản & Hợp đồng."
- Quy tắc: chỉ hiện văn bản đã ban hành, còn hiệu lực, và được bật "Công khai trên Wiki công ty"; không sao chép hồ sơ gốc; không chỉnh sửa tại Wiki; tự ẩn khi hết hiệu lực hoặc tắt công khai. Tài liệu đi từ module Văn bản & Hợp đồng.

## 3. Quy tắc nghiệp vụ thấy được
1. Duyệt chỉ một nơi (Trung tâm phê duyệt); các màn khác chỉ gửi/theo dõi.
2. Thao tác nhạy cảm (thu/chi thủ công, đảo phiếu đã ghi sổ, ghi lùi ngày) bắt buộc đi qua phê duyệt, có mức rủi ro; thực thi chỉ xảy ra sau duyệt (trạng thái Chờ ghi sổ -> Đã thực thi, có nhánh Lỗi thực thi).
3. Mỗi phê duyệt có hạn (SLA). Từ các cặp ngày giờ trong dữ liệu, hạn = 24 giờ sau khi gửi; sau đó hiện "Quá hạn" và đẩy lên cảnh báo Dashboard.
4. Người xem thấy 5 góc nhìn: Chờ tôi duyệt, Tôi đã gửi, CC/Theo dõi, Đã xử lý, Bị từ chối.
5. Phê duyệt theo chi nhánh (mỗi dòng gắn chi nhánh người gửi).
6. Báo cáo ngày của nhân viên khác báo cáo doanh thu.
7. Tài liệu Wiki lấy từ kho văn bản đã ban hành, chỉ đọc.

## 4. Điểm riêng nha khoa
- [NHA KHOA] Chi trả lab/xưởng răng theo tháng và công bác sĩ cắm Implant theo từng bệnh nhân: dùng làm đề xuất thanh toán nội bộ.
- [NHA KHOA] Bác sĩ nằm trong bảng xếp hạng nhân viên và chia chi nhánh; công bác sĩ tính riêng.
- Ngoài ra màn này gần như chung cho mọi doanh nghiệp dịch vụ.

## 5. Đề xuất cho AMIA
Làm theo thứ tự:
1. Một "Hộp việc của tôi" duy nhất (việc giao cho tôi, việc tôi giao, quá hạn) và nhúng vào Dashboard. Đây là lõi. Bố cục tách đôi: danh sách trái, chi tiết phải; dòng việc gồm loại + mã, hạn, cờ quá hạn, nút Mở.
2. Trung tâm phê duyệt: bảng trạng thái thống nhất (Chờ duyệt, Cần bổ sung, Đã duyệt, Từ chối, Đã hủy, Chờ ghi sổ, Đã thực thi), SLA 24h, mức rủi ro, 4 góc nhìn (chờ tôi, tôi gửi, theo dõi, đã xử lý). Làm kiểu adapter: mỗi loại việc cần duyệt khai báo nguồn và hành động thực thi.
3. Đề xuất thanh toán và tạm ứng lương dùng chung một form có "loại", chuyển hết sang duyệt ở trung tâm.
4. Báo cáo ngày (form 3 ô: đã làm hôm nay *, vướng mắc, kế hoạch hôm sau; ngày báo cáo; quản lý nộp thay được; 1 báo cáo / người / ngày, nộp lại thì cập nhật; tab Của tôi / Tất cả) và chấm công.
5. Đề xuất mua sắm PR/PO: làm sau, khi có module kho.
6. Wiki nội bộ: gắn với mục tài liệu, làm sau cùng (hoặc dùng Lark/Docs sẵn có); nếu làm thì chỉ đọc, chỉ hiện văn bản đã ban hành + còn hiệu lực + bật công khai, tự ẩn khi hết hiệu lực. Bảng tin toàn công ty xem cai-dat.md 2.11.

Bỏ/hoãn: hợp đồng lao động với 13 trạng thái ký điện tử (AMIA dùng Lark/giấy trước), trình duyệt hợp đồng, lỗi phân trang thô, thẻ gắn nhãn "Đang hoàn thiện" ngoài giao diện.
Đổi cho AMIA: chi trả "lab" thay bằng chi cho nhà cung cấp vật tư/thiết bị công nghệ cao; công bác sĩ thay bằng công kỹ thuật viên/bác sĩ theo ca điều trị.

# BeDental ERP — Mục NHÂN SỰ (đề bài cho AMIA OS)

Nguồn: bản chụp chữ demo BeDental ERP (nhóm C). Không chép tên người, SĐT, email, mã khách. Chỗ nào màn hình chỉ có trang tổng quan mà không có nội dung riêng thì ghi "chưa đọc được". Đánh dấu [NHA KHOA] là điểm riêng của nha khoa.

## 1. Mục đích

Một chỗ duy nhất để quản lý vòng đời nhân viên: hồ sơ, hợp đồng, phân công theo chi nhánh, chấm công và ca, nghỉ phép, tính hoa hồng, bảng lương, luồng phê duyệt đơn HR, tài khoản đăng nhập và phân quyền. Trang tổng quan chia thành 4 nhóm thẻ, mỗi thẻ có trạng thái "Sẵn sàng":

| Nhóm | Thẻ |
|---|---|
| HỒ SƠ | Hồ sơ nhân viên · Hợp đồng và pháp lý · Phân công nhân viên theo chi nhánh (master chi nhánh nằm ở Cài đặt) |
| CHẤM CÔNG | Chấm công / Giờ làm · Quản lý ca kíp · Quản lý ngày nghỉ |
| LƯƠNG VÀ HOA HỒNG | Tính hoa hồng nhân viên theo kỳ (rule cấu hình ở Cài đặt) · Bảng lương tổng hợp |
| PHÊ DUYỆT VÀ PHÂN QUYỀN | Quy trình phê duyệt HR (là cấu hình, không phải inbox) · Tài khoản và phân quyền |

Thanh bên toàn hệ thống: có bộ chọn chi nhánh, nhãn "API Online", vai trò người đăng nhập hiển thị dưới tên.

## 2. Từng màn hình

### 2.1 Hồ sơ nhân viên (staff) - đọc được danh sách; form chi tiết chưa đọc được
- Tiêu đề "Nhân sự", đếm "N nhân viên" (demo 25). Nút "Thêm nhân viên".
- Bộ lọc: trạng thái (Đang làm việc / Tạm nghỉ / Nghỉ việc / Khóa / Tất cả trạng thái); vai trò chuyên môn (Bác sĩ / Phụ tá / Lễ tân / Thu ngân / Tư vấn / Kỹ thuật viên / Quản lý / Tất cả vai trò); nút "Tắt bộ lọc". Chưa thấy ô tìm theo tên.
- Bảng 9 cột: Nhân viên (ảnh chữ cái đầu + họ tên + mã dạng #NVxxxx) | Liên hệ (SĐT, email; thiếu thì "-") | Công việc (chức danh + nhãn nhóm như "Chuyên môn" hoặc "Phòng khám") | Chi nhánh (một chi nhánh chính, hoặc "Chưa gán chi nhánh", hoặc "Trụ sở chính") | Ngày bắt đầu làm việc (kèm thâm niên tự tính như "8 năm 1 tháng", "1 tháng", nhãn "Mới vào" cho người mới) | HĐLĐ (trạng thái hợp đồng lao động, demo toàn "Chưa có") | Vai trò chuyên môn (một hoặc NHIỀU nhãn, ví dụ Thu ngân + Tư vấn + Lễ tân cho một người) | Trạng thái (Đang làm...) | Thao tác (menu ba chấm).
- Phân trang 20 dòng / trang ("Hiện 1 đến 20 của 25 nhân viên", Đầu / 1 / 2 / Cuối).
- Quan sát dữ liệu demo: nhiều hồ sơ thiếu ngày bắt đầu, email, chi nhánh hoặc vai trò chuyên môn; "Công việc" (nhãn tự do) và "Vai trò chuyên môn" (danh mục cố định; suy luận là dùng để chia hoa hồng và phân ca) là hai trường khác nhau và đôi chỗ không khớp nhau. Vai trò chuyên môn khác với vai trò hệ thống (13 vai trò ở 2.8).
- Trường của form Thêm / Sửa nhân viên (suy luận, chưa đọc được): họ tên, SĐT, email, ngày sinh, ngày bắt đầu, chi nhánh chính + các chi nhánh phụ, chức danh, vai trò chuyên môn (nhiều giá trị), trạng thái, liên kết tài khoản đăng nhập, ảnh.
- Hợp đồng và pháp lý (hr_contracts): màn có các tab Hướng dẫn | Mẫu hợp đồng | Tạo hợp đồng | Danh sách hợp đồng | Hồ sơ pháp lý | Ký điện tử | Hướng dẫn quy trình; lọc trạng thái (13 giá trị từ Nháp tới Hoàn tất ký, Đang hiệu lực, Sắp hết hạn, Hết hạn, Chấm dứt) và loại (Thử việc, Xác định thời hạn, Không xác định thời hạn, Cộng tác viên, Phụ lục, Quyết định bổ nhiệm, Quyết định chấm dứt). Demo rỗng ("Chưa có hợp đồng nào") và hiện lỗi phân trang thô (limit / offset không hợp lệ). Chi tiết tương ứng xem noi-lam-viec.md mục 2.5.
- Phân công theo chi nhánh: chi nhánh được lấy từ danh mục chi nhánh ở Cài đặt (xem cai-dat.md 2.9); màn phân công riêng chưa đọc được. Số "Nhân viên" của từng chi nhánh trong danh mục chi nhánh là số đếm từ đây.
- Suy ra: mã NV tự sinh dạng NV + 4 số, mỗi nhân viên có thể liên kết tài khoản đăng nhập và Zalo (xem 2.8).

### 2.2 Chấm công / Giờ làm (hr_attendance)
Thanh công cụ (nhóm nút): Phân ca nhân viên · Tạo yêu cầu OT · Nhập công thủ công · Quản lý ca kíp · Giờ làm nhân viên · Quản lý ngày nghỉ · Chính sách Mini App.
- Dòng ghi chú: nhân viên thường chỉ xem bảng công của chính mình; muốn xem người khác phải vào Báo cáo, mục Giờ làm nhân viên (phân quyền xem).
- Bộ lọc: nút "Lọc" (tiêu chí chưa hiện, dự kiến chi nhánh, nhân viên, khoảng ngày).
- Cách chấm công: check-in GPS qua Zalo Mini App, nhân viên phải ở trong bán kính 20 m quanh chi nhánh. Quản lý có thể nhập công thủ công khi cần.
- Bảng "Log chấm công" (có đếm số bản ghi). Cột: Nhân viên · Chi nhánh · Ngày · Ca sáng · Ca chiều · Khoảng cách (so với chi nhánh) · Phương thức (GPS hoặc thủ công) · Đối chiếu · Tăng ca · Ghi chú. Dữ liệu demo rỗng ("Không có dữ liệu chấm công").
- Tăng ca (OT) là đơn riêng ("Tạo yêu cầu OT") và đi qua luồng duyệt.

Bản chụp bổ sung: ba mục Chấm công / Giờ làm, Quản lý ca kíp, Quản lý ngày nghỉ khi chụp lại đều ra CÙNG một màn (Danh sách ca + Lịch tuần, xem 2.3), tức là chuyển tab không được ghi lại; vì vậy bảng Log chấm công và đơn nghỉ ở 2.2 và 2.4 dựa vào nguồn đọc trước. Thanh nút của màn gộp này: Phân ca nhân viên | Tạo ca mới | Quản lý ca kíp | Giờ làm nhân viên | Quản lý ngày nghỉ | Chính sách Mini App. "Chính sách Mini App" là một mục riêng của chấm công (cấu hình GPS/bán kính/ngoại lệ cho check-in Zalo Mini App, nội dung chưa đọc được). Bán kính check-in cũng có cột "GPS" theo từng chi nhánh trong danh mục chi nhánh (hiện 50 m), có thể khác con số 20 m ghi trên màn chấm công: chưa xác minh con số nào đang áp dụng, nên cho cấu hình theo chi nhánh.

### 2.3 Quản lý ca kíp
- Bộ lọc chi nhánh: Tất cả các chi nhánh hoặc từng chi nhánh.
- Nút: Phân ca nhân viên · Tạo ca mới.
- Khối "Danh sách ca": lọc Đang sử dụng / Đã ngừng / Tất cả. Mỗi ca có: tên, giờ bắt đầu - kết thúc, thời gian nghỉ giữa ca, dung sai trễ (phút), số giờ chuẩn; nút Sửa, Ngừng sử dụng (không xóa, chỉ ngừng).
- Dữ liệu demo có 3 ca:
  - "Cả ngày" 08:30-18:00, nghỉ 90 phút, dung sai trễ 15 phút, chuẩn 8,00 giờ.
  - "Ca sáng" 08:30-12:00, dung sai 15 phút, chuẩn 3,50 giờ.
  - "Ca chiều" 13:30-18:00, dung sai 0 phút, chuẩn 4,50 giờ.
- Khối "Lịch tuần": tiêu đề dạng khoảng ngày (ví dụ 2026-10-26 tới 2026-11-01), bảng nhân viên (tên + mã NV) theo cột T2, T3, T4, T5, T6, T7, CN. Mỗi ô là ca đã phân; demo để trống, và chỉ liệt kê 9 nhân viên (người được xếp lịch ở chi nhánh đang chọn / vai trò cần lịch), ít hơn 25 hồ sơ. Cột nhân viên chỉ lọc theo người có vai trò chuyên môn cần phân ca (suy luận).
- Danh sách ca có ba dòng trạng thái lọc (Đang sử dụng / Đã ngừng / Tất cả) và mỗi ca hiện dạng "dung sai trễ N phút - Chuẩn X giờ".

### 2.4 Quản lý ngày nghỉ
- Nút: Tạo đơn nghỉ.
- Khối "Đơn xin nghỉ" (đếm số đơn). Bộ lọc trạng thái: Nháp · Chờ duyệt · Đang duyệt · Chờ manager · Manager duyệt · Chờ HR duyệt · Đã duyệt · Từ chối · Đã huỷ.
- Bộ lọc loại nghỉ: Nghỉ bù · Nghỉ phép năm · Nghỉ lễ/Tết · Nghỉ ốm · Nghỉ thai sản · Nghỉ thai sản (nam) · Nghỉ việc riêng có lương · Nghỉ không lương.
- Bộ lọc thời gian: Hôm nay · 7 ngày tới · 30 ngày tới · Tháng này · Tất cả tương lai · Lịch sử.
- Khối "Bảng tổng hợp tháng": chọn năm (2025/2026/2027) và tháng 1-12; nút Mở · Tính lại · Khoá tháng. Cột: Nhân viên · Ngày thực tế · Giờ thực tế · OT (h) · Phép có lương · Phép không lương · Nghỉ lễ · Vắng · Trễ · Về sớm · TT (trạng thái). Chưa có dữ liệu cho tới khi bấm "Tính lại".

### 2.5 Tính hoa hồng nhân viên (hr_commission)
Màn "Thiết lập hoa hồng nhân viên" (cũng xuất hiện trong Cài đặt, xem cai-dat.md):
- Cột trái: danh sách nhân viên (tìm theo chữ cái đầu), chọn 1 người để chỉnh.
- Cột phải "Cài đặt chi tiết hoa hồng": nút Sao chép cài đặt · Cài đặt đồng loạt · Lưu thiết lập; tab lọc Tất cả sản phẩm/dịch vụ/thẻ · Dịch vụ · Sản phẩm · Thẻ dịch vụ. Chưa chọn nhân viên thì chỉ hiện "Chọn một nhân viên ở danh sách bên trái".
- Có nút "Thiết lập nâng cao" (rule theo thực thu, kỳ, split).
- Bản chụp bổ sung xác nhận: cột trái liệt kê toàn bộ nhân viên (kể cả tài khoản test), mỗi dòng một chữ cái đầu; bản chụp vẫn chưa chọn người nào nên form chi tiết bên phải (trường tỷ lệ / số tiền, vai trò bán / thực hiện / tư vấn theo từng mặt hàng) chưa đọc được. Cấu trúc quy tắc thật xem cai-dat.md 2.6.
- Chưa đọc được: màn "kết quả hoa hồng theo kỳ" (bảng hoa hồng đã tính cho từng nhân viên); thẻ nói "Tính hoa hồng theo kỳ" nhưng bản chụp chỉ có màn thiết lập.

### 2.6 Bảng lương tổng hợp (hr_payroll)
- Nút: Cài đặt lương cơ bản · Tạo bảng lương.
- Bảng: Bảng lương (tên kỳ) · Chi nhánh (hoặc "Toàn hệ thống") · Ngày bắt đầu · Ngày kết thúc · Ngày tạo · Người tạo · Số NV · Tổng thực lĩnh · Trạng thái · nút Chi tiết. Có phân trang.
- Dữ liệu demo: 1 bảng lương "THÁNG 9 - 2026", toàn hệ thống, 30 nhân viên, tổng thực lĩnh cỡ 213 triệu đồng, trạng thái "Đang xử lý".
- Mô tả thẻ: tổng hợp lương, phụ cấp, khoản khấu trừ. Chi tiết từng dòng lương (nút "Chi tiết") và form "Tạo bảng lương" / "Cài đặt lương cơ bản" chưa đọc được. Lưu ý số liệu: bảng lương ghi 30 nhân viên trong khi danh sách hồ sơ chỉ có 25; chênh lệch có thể do bảng lương chốt theo danh sách tại thời điểm tạo (suy luận); đáng học: bảng lương nên LƯU BẢN SAO (snapshot) từng dòng lương, không tính lại từ hồ sơ hiện tại.

### 2.7 Quy trình phê duyệt HR (approval_workflows)
- Đây là màn cấu hình luồng duyệt no-code, không phải hàng chờ duyệt. Nút: "← Quay lại", "+ Tạo quy trình", đếm số quy trình.
- Lọc theo nghiệp vụ: Đơn xin nghỉ · Đơn tăng ca (OT) · Điều chỉnh chấm công · Ngoại lệ chấm công Mini App · Đổi ca · Chốt bảng công tháng · Hợp đồng.
- Luồng: nhân viên gửi đơn, hệ thống tự tìm quy trình phù hợp rồi gửi đến người duyệt. Demo chưa có quy trình nào (trạng thái rỗng, mời tạo quy trình đầu tiên).
- Các trạng thái đơn nghỉ cho thấy chuỗi bước: Nháp, Chờ duyệt, Chờ manager, Manager duyệt, Chờ HR duyệt, Đã duyệt (hoặc Từ chối, Đã huỷ). Tức tối đa hai bước duyệt: trưởng bộ phận rồi HR.
- Bản chụp bổ sung xác nhận: màn có nút "Quay lại", "+ Tạo quy trình" (hai chỗ), bộ lọc "Tất cả nghiệp vụ" với 7 loại như trên, câu mô tả "Tạo quy trình phê duyệt no-code cho từng loại đơn HR. Nhân viên gửi đơn -> hệ thống tự tìm quy trình phù hợp -> gửi đến người duyệt", và trạng thái rỗng "Chưa có quy trình phê duyệt nào". Chưa có quy trình nên trong thực tế đơn nghỉ đi theo Trung tâm phê duyệt chung (xem noi-lam-viec.md 2.2).
- Chi tiết form tạo quy trình (chọn người duyệt, điều kiện, số bước) chưa đọc được.

### 2.8 Tài khoản và phân quyền (accounts)
- Mô tả: quản lý tài khoản đăng nhập, vai trò theo vị trí và quyền truy cập chi nhánh. Ghi rõ "Backend enforce mọi quyền" (kiểm quyền ở máy chủ, không tin giao diện).
- Bộ lọc: Vai trò (13 giá trị bên dưới) và Trạng thái (Đang hoạt động / Đã khóa). Nút: "Tạo người dùng mới".
- 13 vai trò: Chủ sở hữu · Quản lý tổng · Quản lý chi nhánh · Thu ngân · Bác sĩ / Kỹ thuật viên · Tư vấn bán hàng · Marketing / CSKH · Kế toán · Thủ kho · Nhân sự · Cộng tác viên / Người giới thiệu · Nhà đầu tư / Chỉ xem · API / Tài khoản tích hợp.
- Bảng: Tên tài khoản · Email · SĐT · Nhân viên (liên kết hồ sơ, có thể trống) · Vai trò · Chi nhánh (hiển thị bằng SỐ lượng chi nhánh được vào, ví dụ 0/1/2/3) · Trạng thái · Liên kết Zalo (Đã liên kết / Chưa liên kết) · Thao tác: Sửa, Khóa (hoặc Mở khi đang khóa), Reset MK.
- Quan sát dữ liệu demo: khoảng 25 tài khoản; vai trò phổ biến nhất là Bác sĩ / Kỹ thuật viên; có nhiều tài khoản Chủ sở hữu (kể cả tài khoản test); có người chưa liên kết hồ sơ nhân viên; tài khoản nghỉ việc bị Khóa chứ không xóa.
- Bản chụp bổ sung: bảng 9 cột đúng như trên; 25 dòng, 4 tài khoản đang Khóa (nút đổi thành "Mở"), 3 tài khoản chưa liên kết Zalo, 1 tài khoản không gắn nhân viên (hiện "-"); mô tả đầu màn nhắc lại "Backend enforce mọi quyền". Tài khoản dùng chung hộp thư cá nhân của người dùng (nên AMIA dùng email công ty hoặc đăng nhập bằng SĐT/Zalo).
- Ma trận quyền (vai trò x chức năng x chi nhánh): chưa đọc được; màn "Sửa" tài khoản không có trong bản chụp.

## 3. Quy tắc nghiệp vụ thấy được

Chấm công và ca
- Chấm công chính là check-in GPS qua Zalo Mini App, bán kính 20 m; có log khoảng cách và cột "Đối chiếu" (so với ca đã phân). Ngoại lệ (ngoài vùng, quên check-in) đi qua đơn "Ngoại lệ chấm công Mini App" và "Điều chỉnh chấm công", có người duyệt.
- Nhập công thủ công chỉ dành cho quản lý.
- Ca có: giờ vào - ra, nghỉ giữa ca, dung sai đi trễ theo phút (khác nhau từng ca, có ca 0 phút), số giờ chuẩn. Số giờ chuẩn = (giờ ra - giờ vào) - nghỉ. Ca sai thì Ngừng sử dụng, không xóa để giữ lịch sử.
- Phân ca theo tuần, theo chi nhánh; đổi ca là đơn có duyệt.
- Cuối tháng: Tính lại để tổng hợp từ log, rồi "Khoá tháng" (chốt bảng công; chốt cũng là một nghiệp vụ có quy trình duyệt). Các chỉ số tổng hợp: ngày/giờ thực tế, OT, phép có lương, phép không lương, nghỉ lễ, vắng, trễ, về sớm.

Nghỉ phép
- 8 loại nghỉ (xem 2.4), gồm cả thai sản nam và nghỉ bù. Có phân biệt phép có lương / không lương khi tổng hợp tháng.
- Vòng đời đơn: Nháp, Chờ duyệt, Đang duyệt, Chờ manager, Manager duyệt, Chờ HR duyệt, Đã duyệt / Từ chối / Đã huỷ.

Lương và hoa hồng
- Bảng lương tạo theo kỳ (từ ngày - đến ngày), theo chi nhánh hoặc toàn hệ thống, trạng thái "Đang xử lý" trước khi chốt. Có "Cài đặt lương cơ bản" riêng cho từng người.
- Hoa hồng nhân viên cài theo từng nhân viên x từng dịch vụ / sản phẩm / thẻ dịch vụ, có thể sao chép từ người khác hoặc cài đồng loạt. Chi tiết cấu hình (theo thực thu, vai trò bán / thực hiện / tư vấn, ngoại lệ theo chi nhánh) ghi ở cai-dat.md.

Phân quyền
- Quyền gắn với vai trò và chi nhánh; backend kiểm quyền. Khóa tài khoản thay cho xóa. Reset mật khẩu do quản trị thực hiện. Liên kết Zalo cần thiết cho check-in và thông báo nhân viên.

## 4. Điểm riêng nha khoa [NHA KHOA]
- Vai trò "Bác sĩ / Kỹ thuật viên" gộp một nhóm; hoa hồng bác sĩ tính theo người THỰC HIỆN dịch vụ (xem cai-dat.md).
- Dịch vụ tính hoa hồng theo "đơn vị" (ví dụ 200.000 đ hoặc 300.000 đ mỗi đơn vị, như mỗi răng) thay vì chỉ theo phần trăm.
- Ca làm có ca sáng / ca chiều tách riêng (nghỉ trưa 90 phút) phù hợp lịch bác sĩ.
- Vai trò "Nhà đầu tư / Chỉ xem" và nhiều "Chủ sở hữu" phản ánh mô hình phòng khám nhiều chủ góp vốn.

## 5. Đề xuất cho AMIA

Làm theo thứ tự:
1. Tài khoản và phân quyền (nền cho mọi thứ): bảng người dùng, vai trò, phạm vi chi nhánh (Supabase Auth + bảng vai trò + RLS). Vai trò AMIA đề xuất: Chủ sở hữu, Quản lý chi nhánh, Lễ tân/Thu ngân, Kỹ thuật viên spa, Bác sĩ da liễu, Tư vấn, Marketing/CSKH, Kế toán, Thủ kho, Nhân sự, CTV, Chỉ xem. Khóa thay xóa, reset mật khẩu, backend (RLS) kiểm quyền.
2. Hồ sơ nhân viên + phân công chi nhánh: mã NV tự sinh (NV + 4 số), trạng thái 4 mức (Đang làm / Tạm nghỉ / Nghỉ việc / Khóa), cột chi nhánh, ngày bắt đầu + thâm niên tự tính, vai trò chuyên môn NHIỀU giá trị (bác sĩ da liễu, kỹ thuật viên, tư vấn, lễ tân, thu ngân, quản lý), bộ lọc trạng thái + vai trò, phân trang; liên kết 1-1 với tài khoản; hợp đồng đính kèm tệp. Tách "chức danh" (nhãn tự do) khỏi "vai trò chuyên môn" (danh mục cố định); bắt buộc chi nhánh và ngày vào làm (demo để trống nhiều).
3. Ca kíp + chấm công: tạo ca (giờ vào/ra, nghỉ, dung sai, giờ chuẩn), lịch tuần, check-in. Phiên bản đầu dùng web/PWA định vị GPS bán kính cấu hình; Zalo Mini App để sau. Có nhập công thủ công cho quản lý.
4. Nghỉ phép: 8 loại nghỉ, số dư phép năm, đơn nghỉ với vòng đời trạng thái ở trên; bảng tổng hợp tháng với "Tính lại" và "Khoá tháng".
5. Quy trình phê duyệt HR dùng chung với maker-checker ở Cài đặt (một engine duyệt: loại đơn, bước, người duyệt, SLA).
6. Hoa hồng nhân viên (theo dịch vụ/sản phẩm/gói liệu trình, vai trò bán / thực hiện / tư vấn) rồi bảng lương theo kỳ.

Làm sau hoặc bỏ:
- Bỏ: Zalo Mini App ở giai đoạn 1, vai trò "API / Tài khoản tích hợp" tách riêng (dùng service key), nghỉ thai sản nam nếu không cần.
- Sau: bảng lương đầy đủ (phụ cấp, khấu trừ, thuế); màn "Giờ làm nhân viên" ở Báo cáo.
- Đổi cho AMIA: thay "Bác sĩ / Kỹ thuật viên" thành hai vai trò (bác sĩ da liễu, kỹ thuật viên spa); đơn vị tính hoa hồng theo "buổi liệu trình" thay vì "răng".
- Tránh lặp lỗi demo: vai trò Chủ sở hữu quá nhiều; cột Chi nhánh hiển thị số thay vì tên; không có liên kết tài khoản - hồ sơ bắt buộc.

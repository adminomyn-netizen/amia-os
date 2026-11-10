# BeDental ERP — Mục NHÂN SỰ (đề bài cho AMIA OS / MSC Group OS)

Nguồn: bản chụp chữ demo BeDental ERP (27/10/2026) + đọc lại trực tiếp demo ngày 10/11/2026 (mở form chỉ để đọc trường, không lưu). Không chép tên người, SĐT, email, mã khách, số tiền lương của từng người. [NHA KHOA] = điểm riêng nha khoa.

Cập nhật 10/11/2026: đọc được hết các phần trước đây "chưa đọc được": form Thêm nhân viên (5 tab, gồm BHXH/BHYT/thuế/bảo hiểm), trang chi tiết nhân viên (cảnh báo tuân thủ, % hồ sơ, 7 tab, nhật ký), form tạo ca / phân ca / OT / nhập công / đơn nghỉ, "Chính sách Mini App" chấm công, màn hoa hồng sau khi chọn người (3 loại hoa hồng x %/VND x thời điểm tính), "Thiết lập nâng cao" hoa hồng, chi tiết bảng lương và form tạo bảng lương / lương cơ bản, form tạo quy trình phê duyệt 4 tab, form tài khoản với ma trận quyền 18 nhóm module. MỚI so với 27/10: nút "Phụ trách lead" theo chi nhánh trên màn Nhân sự; trạng thái bảng lương "Bị hủy"; trang "Hồ sơ của tôi"; email nghiệp vụ cho HR (thư hội nhập, chúc mừng sinh nhật nhân viên, gửi bảng lương) qua Gmail (xem cai-dat.md 2.14).

Lưu ý AMIA: từ 31/10/2026 phần HR của AMIA đã chuyển sang MSC Group OS (`project___1140/mscgroup-os`). Mục này giữ làm đề bài cho MSC Group OS; AMIA chỉ giữ tài khoản, vai trò, chi nhánh và hoa hồng (dùng chung bán hàng).

## 1. Mục đích

Một chỗ duy nhất cho vòng đời nhân viên: hồ sơ, hợp đồng, phân công chi nhánh, chấm công và ca, nghỉ phép, hoa hồng, bảng lương, luồng phê duyệt đơn HR, tài khoản đăng nhập và phân quyền. Trang tổng quan 4 nhóm thẻ (tất cả "Sẵn sàng"):

| Nhóm | Thẻ |
|---|---|
| HỒ SƠ | Hồ sơ nhân viên · Hợp đồng & Pháp lý · Phân công nhân viên theo chi nhánh (master chi nhánh ở Cài đặt) |
| CHẤM CÔNG | Chấm công / Giờ làm · Quản lý ca kíp · Quản lý ngày nghỉ |
| LƯƠNG & HOA HỒNG | Tính hoa hồng nhân viên (rule ở Cài đặt) · Bảng lương tổng hợp |
| PHÊ DUYỆT & PHÂN QUYỀN | Quy trình phê duyệt HR (cấu hình, không phải hộp duyệt) · Tài khoản & phân quyền · 2 route cũ "Việc cần duyệt HR (legacy)", "Việc cần duyệt kiểm soát ghi nhận (legacy)" đã gộp về Nơi làm việc → Trung tâm phê duyệt |

## 2. Từng màn hình

### 2.1 Hồ sơ nhân viên (`#/staff`)
- Tiêu đề "Nhân sự", đếm "N nhân viên" (demo 23). Nút: **Phụ trách lead** (MỚI) · Thêm nhân viên.
- Bộ lọc: trạng thái (Đang làm việc / Tạm nghỉ / Nghỉ việc / Khóa / Tất cả); vai trò chuyên môn (Bác sĩ / Phụ tá / Lễ tân / Thu ngân / Tư vấn / Kỹ thuật viên / Quản lý / Tất cả); "Tắt bộ lọc". Không có ô tìm tên.
- Bảng 9 cột: Nhân viên (chữ cái đầu + họ tên + mã #NVxxxx) | Liên hệ (SĐT, email) | Công việc (chức danh + phòng ban) | Chi nhánh | Ngày bắt đầu làm việc (thâm niên tự tính, nhãn "Mới vào") | HĐLĐ (trạng thái HĐ, demo "Chưa có") | Vai trò chuyên môn (nhiều nhãn) | Trạng thái | Thao tác ⋮.
- Menu ⋮ mỗi dòng: Xem chi tiết · Sửa thông tin · Tài khoản · Khóa · Ngừng làm việc.
- **Hộp "Phụ trách lead theo chi nhánh" (MỚI)**: mỗi chi nhánh chọn 1 nhân viên (hoặc "Chưa chọn"). Người phụ trách được TỰ GIAO khách mới của chi nhánh, nhận thông báo tin nhắn khách chưa ai nhận và thông báo lịch hẹn mới / đổi / hủy của chi nhánh. Bác sĩ / nhân viên được xếp lịch vẫn nhận thông báo lịch của mình; chủ sở hữu và quản lý tổng luôn nhận mọi thông báo. Chi nhánh chưa chọn thì mọi người cùng nhận như cũ. Nút "Xong". (Liên quan Marketing: chia lead / hội thoại.)

**Form "Thêm nhân viên mới"** (5 tab):
- Cá nhân: Ảnh đại diện · HỌ TÊN* · MÃ NHÂN VIÊN (tự sinh nếu trống) · SỐ ĐIỆN THOẠI* · EMAIL · GIỚI TÍNH (Nam/Nữ/Khác) · NGÀY SINH · ĐỊA CHỈ · Liên hệ khẩn cấp: HỌ TÊN, ĐIỆN THOẠI, QUAN HỆ.
- Công việc: CHI NHÁNH LÀM VIỆC (nhiều dòng, nút "Thêm chi nhánh"; mỗi dòng có radio "Chi nhánh chính" và ô tích "Chấm công") · PHÒNG BAN · CHỨC DANH · NGÀY VÀO LÀM · TRẠNG THÁI (Đang làm / Tạm nghỉ / Nghỉ việc / Khóa) · Vai trò chuyên môn (nút chọn nhiều: Bác sĩ, Phụ tá, Lễ tân, Thu ngân, Tư vấn, Kỹ thuật viên, Quản lý).
- Chuyên môn: CHUYÊN KHOA · CẤP ĐỘ TAY NGHỀ (Junior / Intermediate / Senior / Expert) · SỐ NĂM KINH NGHIỆM · GHI CHÚ CHUYÊN MÔN (chứng chỉ).
- Phúc lợi: LƯƠNG CƠ BẢN · PHỤ CẤP CỐ ĐỊNH (+ Thêm phụ cấp) · SỐ TÀI KHOẢN NGÂN HÀNG · TÊN NGÂN HÀNG · GHI CHÚ LƯƠNG · BHXH: số sổ, nơi đăng ký KCB ban đầu, ngày bắt đầu tham gia, mức lương đóng BHXH · BHYT: số thẻ, nơi KCB ban đầu, ngày hết hạn · BHTN (ô tích "Đang tham gia") · Thuế TNCN: MST cá nhân, số người phụ thuộc giảm trừ, giấy tờ giảm trừ (+ Thêm người phụ thuộc) · Bảo hiểm nhân thọ (công ty, số HĐ) · Bảo hiểm sức khỏe bổ sung (công ty, số HĐ) · Ghi chú chung.
- Tài khoản: ô tích "Tạo tài khoản đăng nhập cho nhân viên này".
- Nút: Đóng · Tạo nhân viên.

**Trang chi tiết nhân viên** ("Thông tin nhân viên #NVxxxx", nút Sửa hồ sơ):
- Khối **CẢNH BÁO TUÂN THỦ** tự sinh: chưa có MST cá nhân · chưa có số sổ BHXH · chưa có số thẻ BHYT · không có HĐLĐ đang hiệu lực.
- Vòng % hoàn thiện hồ sơ (ví dụ 21%), trạng thái, SĐT; THỐNG KÊ: "DV được phép" (số dịch vụ nhân viên được làm), Lương cơ bản.
- 7 tab: Thông tin cá nhân (kèm "HỒ SƠ & GIẤY TỜ": Thêm tài liệu, upload giấy tờ/chứng chỉ/HĐLĐ) · Công việc (ngày vào, ngày kết thúc, trạng thái, chi nhánh làm việc, chuyên môn, lương & ngân hàng) · Phúc lợi (phụ cấp bổ sung, BHXH, BHYT & BHTN, thuế TNCN) · Lịch làm việc ("Phase 2", chưa làm) · Bảng lương (chọn tháng/năm 2022-2026; "Dùng Xem trước để ước tính lương tháng này") · Tài khoản (tên, email, SĐT, vai trò; sửa quyền ở Tài khoản & phân quyền) · Lịch sử (nhật ký hoạt động: ai, lúc nào, làm gì).

**Hồ sơ của tôi (`#/my_profile`, MỚI)**: không gian cá nhân: cảnh báo thiếu thông tin / thiếu HĐ, đổi ảnh, vị trí, phòng ban, chi nhánh, nút "Xuất hồ sơ PDF"; tab Tổng quan · Thông tin cá nhân · Phân quyền của tôi · Bảo mật & mật khẩu · Danh bạ Công ty · Lịch sử cập nhật.

Hợp đồng & Pháp lý (`#/hr_contracts`): không đổi so với 27/10 (7 tab, 14 trạng thái từ Nháp tới Chấm dứt, 7 loại HĐ); demo vẫn rỗng và vẫn hiện lỗi thô "limit must not be greater than 200..." (xem noi-lam-viec.md 2.5).

### 2.2 Chấm công / Giờ làm (`#/hr_attendance/attendance`, nút "Giờ làm nhân viên")
- Ba thẻ Chấm công / Ca kíp / Ngày nghỉ cùng một route; chuyển bằng nút trên thanh: Phân ca nhân viên · Tạo yêu cầu OT · Nhập công thủ công · Quản lý ca kíp · Giờ làm nhân viên · Quản lý ngày nghỉ · Chính sách Mini App. Bộ chọn chi nhánh trên cùng.
- "Chỉ xem bảng công của tôi · Muốn xem nhân viên khác: Báo cáo → Giờ làm nhân viên". Nút "Lọc".
- Ghi chú: check-in GPS Zalo Mini App bán kính 20 m; manager nhập thủ công khi cần.
- Bảng "Log chấm công": Nhân viên · Chi nhánh · Ngày · Ca sáng (giờ ca) · Ca chiều (giờ ca) · Khoảng cách · Phương thức · Đối chiếu · Tăng ca · Ghi chú. Demo 0 bản ghi.
- **Form "Tạo yêu cầu tăng ca (OT)"**: Nhân viên (tìm tên/mã/SĐT) · Ngày làm · Giờ bắt đầu OT · Giờ kết thúc OT (ngày-giờ) · Lý do tăng ca · Tạo yêu cầu / Huỷ.
- **Form "Nhập công thủ công"**: Nhân viên · Ngày làm · Giờ vào · Giờ ra · Ghi chú · Lưu / Huỷ.
- **Chính sách Mini App** (theo chi nhánh đang chọn hoặc "Mặc định toàn công ty"): "Chỉ các phương thức có bộ xác minh trên máy chủ mới có thể bật". Phương thức xác minh: GPS · Ảnh selfie (chưa có bộ xác minh máy chủ) · Mã QR (chưa có) · "Bắt buộc tất cả phương thức" · "Cho phép gửi ngoại lệ" (cần quy trình `attendance_exception` đang hoạt động, link sang Cấu hình quy trình phê duyệt) · Bằng chứng bắt buộc: Ghi chú của nhân viên · Ảnh tại địa điểm (chưa hỗ trợ ảnh có chữ ký) · nút Lưu chính sách.
- Bán kính thật lấy theo chi nhánh (Cài đặt → Chi nhánh → "Bán kính chấm công (mét)", demo 50 m; ghi chú 20 m trên màn là chữ cứng), kèm 3 cờ "Bật chấm công GPS", "Cho phép chấm ngoài bán kính", "Chấm ngoài bán kính cần duyệt".

### 2.3 Quản lý ca kíp
- Danh sách ca: lọc Đang sử dụng / Đã ngừng / Tất cả; mỗi ca: tên, giờ bắt đầu - kết thúc (nghỉ N phút), "Dung sai trễ: N phút • Chuẩn: X h"; nút Sửa, Ngừng sử dụng. Demo 3 ca (Cả ngày 8,0 h nghỉ 90'; Ca sáng 3,5 h; Ca chiều 4,5 h, dung sai 0').
- **Form "Tạo ca mới"**: Tên ca · Giờ bắt đầu · Giờ kết thúc · Dung sai trễ (phút) · Nghỉ giữa ca (phút) · Tạo ca / Huỷ. (Giờ chuẩn tự tính.)
- **Form "Phân ca nhân viên"**: Ca làm (chọn 1 ca) · Từ ngày · Đến ngày · Thứ trong tuần (T2…CN, ô tích) · Danh sách nhân viên (ô tích, "Chọn tất cả"; hiện kèm vai trò chuyên môn) · nút **"Phân ca và đối chiếu"**.
- Lịch tuần (khoảng ngày T2→CN): bảng nhân viên x 7 ngày; demo 8 người, ô trống.

### 2.4 Quản lý ngày nghỉ
- Nút "Tạo đơn nghỉ". Khối "ĐƠN XIN NGHỈ" (đếm), ô tìm "Tìm nhân viên / mã đơn", lọc trạng thái (Nháp, Chờ duyệt, Đang duyệt, Chờ manager, Manager duyệt, Chờ HR duyệt, Đã duyệt, Từ chối, Đã huỷ), lọc loại nghỉ (8 loại: Nghỉ bù, Phép năm, Lễ/Tết, Ốm, Thai sản, Thai sản (nam), Việc riêng có lương, Không lương), khoảng: Hôm nay / 7 ngày tới / 30 ngày tới / Tháng này / Tất cả tương lai / Lịch sử.
- **Form "Tạo đơn nghỉ"**: Nhân viên · Loại nghỉ · Từ ngày · Đến ngày · Kiểu nghỉ (Cả ngày / Nửa ngày sáng / Nửa ngày chiều / Theo giờ) · Lý do · nút Lưu nháp / **Gửi duyệt** / Đóng.
- "BẢNG TỔNG HỢP THÁNG": năm + tháng, nút Mở · Tính lại · Khoá tháng; cột Nhân viên · Ngày thực tế · Giờ thực tế · OT (h) · Phép có lương · Phép không lương · Nghỉ lễ · Vắng · Trễ · Về sớm · TT.

### 2.5 Tính hoa hồng nhân viên (`#/hr_commission`) — ĐỌC ĐỦ
- Cột trái: danh sách nhân viên (chữ cái đầu). Chọn một người → bảng "CÀI ĐẶT CHI TIẾT HOA HỒNG — <TÊN>": nút Sao chép cài đặt · Cài đặt đồng loạt · Lưu thiết lập; lọc Tất cả / Dịch vụ / Sản phẩm / Thẻ dịch vụ.
- Bảng: Tên sản phẩm / dịch vụ / thẻ (kèm giá) | **Hoa hồng tư vấn dịch vụ** | **Hoa hồng bán sản phẩm** | **Hoa hồng làm dịch vụ**. Mỗi ô: số + đơn vị `%` / `VND` / `Tùy chỉnh` + thời điểm tính `Khi lập HĐ` / `Theo tiền đã thu`. Dịch vụ không có ô "bán sản phẩm" (—), sản phẩm không có ô "làm dịch vụ".
- **Thiết lập nâng cao** (cấp công ty):
  - Khi nhiều nhân viên cùng tham gia, cho từng loại (dịch vụ / bán sản phẩm-thẻ / tư vấn): "Giữ nguyên hoa hồng" hoặc "Chia đều doanh số trước khi tính hoa hồng".
  - Tính trên giá trước / sau giảm giá; loại giảm giá áp dụng: chỉ giảm trên từng dòng, hoặc cả giảm trên tổng hóa đơn.
  - Tăng / giảm hoa hồng theo GIỜ phục vụ (mỗi giờ 8h…22h một ô %).
  - Tăng / giảm hoa hồng theo PHẢN HỒI KHÁCH (Rất kém / Kém / Trung bình / Tốt / Rất tốt, mỗi mức một ô %).
- Kết quả hoa hồng theo kỳ: không có màn riêng ở đây; xem Báo cáo → Báo cáo hoa hồng nhân viên / theo thực thu.

### 2.6 Bảng lương tổng hợp (`#/hr_payroll`)
- "QUẢN LÝ LƯƠNG": nút Cài đặt lương cơ bản · Tạo bảng lương. Bảng: Bảng lương · Chi nhánh (hoặc Toàn hệ thống) · Ngày bắt đầu · Ngày kết thúc · Ngày tạo · Người tạo · NV · Tổng thực lĩnh · Trạng thái · Chi tiết. Demo 3 bảng (T9, T10, T11), trạng thái "Đang xử lý" và **"Bị hủy"** (MỚI).
- **Form "Tạo bảng lương"**: Tháng · Năm · Tên bảng lương · Chi nhánh (Tất cả / từng chi nhánh) · Kiểu tính: Tổng lương cơ bản và hoa hồng / Chỉ lương cơ bản / Chỉ hoa hồng.
- **"Cài đặt lương cơ bản"**: lọc chi nhánh; mỗi nhân viên chọn kiểu Lương theo giờ / theo ngày / theo tháng + số tiền; nút Lưu và đóng.
- **Chi tiết bảng lương**: cột Nhân viên · Lương cơ bản · Phụ cấp · Công chuẩn · Công thực tế · OT (h) · Phép có lương · Không lương · Tổng lương · Thực lĩnh; dưới tên có ghi chú tự sinh ("Chưa đủ dữ liệu công — dùng lương cơ bản trọn tháng", "lương cơ bản tính theo 2/30 ngày làm; Nghỉ việc ngày …"). Chân: tổng NV, tổng lương, thực lĩnh. KHÔNG có nút chốt / duyệt / gửi phiếu trong màn chi tiết (gửi bảng lương qua email nằm ở quyền "Email nghiệp vụ").
- Quy tắc rút ra: thiếu dữ liệu công thì mặc định trả trọn lương cơ bản; nghỉ việc giữa tháng thì chia theo ngày lịch (N/30); tổng lương = lương cơ bản + phụ cấp + hoa hồng.

### 2.7 Quy trình phê duyệt HR (`#/approval_workflows`)
- Danh sách (demo 0 quy trình), lọc 7 nghiệp vụ: Đơn xin nghỉ · Đơn tăng ca (OT) · Điều chỉnh chấm công · Ngoại lệ chấm công Mini App · Đổi ca · Chốt bảng công tháng · Hợp đồng.
- **Form "Tạo quy trình phê duyệt"** (4 tab):
  - Thông tin: Tên quy trình* · Loại nghiệp vụ* · Mô tả · Độ ưu tiên (số) · Đang hoạt động · "Workflow mặc định (dùng khi không có workflow nào match)".
  - Điều kiện: "+ Thêm điều kiện", tất cả điều kiện AND; để trống = áp cho mọi đơn của loại; có dòng Preview.
  - Bước duyệt (nhiều bước, nút ↑ ↓ Xoá, "+ Thêm bước duyệt"): Tên bước* · Kiểu duyệt (Một người là đủ / Tất cả phải duyệt) · Loại người duyệt (Người cụ thể / Theo chức danh / Quản lý trực tiếp / Trưởng chi nhánh / Trưởng bộ phận / Người gửi chọn) · User ID người duyệt (UUID, cách dấu phẩy — giao diện thô) · Cho phép ủy quyền · Hết hạn sau (giờ).
  - Hành động (cố định): Duyệt → cập nhật trạng thái approved, ghi audit, gửi thông báo nội bộ; Từ chối → trạng thái rejected, ghi lý do vào audit, báo người gửi.

### 2.8 Tài khoản & phân quyền (`#/accounts`)
- Mô tả "Backend enforce mọi quyền". Lọc Vai trò (13) và Trạng thái (Đang hoạt động / Đã khóa). Nút "Tạo người dùng mới". Bảng: Tên tài khoản · Email · SĐT · Nhân viên · Vai trò · Chi nhánh (số) · Trạng thái · Liên kết Zalo · Thao tác (Sửa, Khóa/Mở, Reset MK).
- 13 vai trò mẫu: Chủ sở hữu · Quản lý tổng · Quản lý chi nhánh · Thu ngân · Bác sĩ / Kỹ thuật viên · Tư vấn bán hàng · Marketing / CSKH · Kế toán · Thủ kho · Nhân sự · Cộng tác viên / Người giới thiệu · Nhà đầu tư / Chỉ xem · API / Tài khoản tích hợp. Mỗi mẫu có câu mô tả (ví dụ Tư vấn bán hàng: "Tư vấn, chăm sóc khách, hỗ trợ bán hàng tại chi nhánh được gán").
- **Form Tạo / Sửa tài khoản** — ĐỌC ĐỦ:
  - Thông tin: Liên kết nhân viên (tìm; chỉ hiện nhân viên thuộc chi nhánh mình quản lý và CHƯA có tài khoản; 1 nhân viên ↔ 1 tài khoản) · Tên tài khoản · Email đăng nhập · SĐT · Mật khẩu (≥ 8 ký tự).
  - **Chi nhánh được phép truy cập**: tích từng chi nhánh; một chi nhánh "Mặc định"; MỖI chi nhánh có 9 cờ quyền: Xem · Quản lý · Bán hàng · Xuất Excel · Duyệt · Báo cáo · Tài chính · Kho · Khách hàng.
  - **Quyền theo module**: chọn "Mẫu vai trò" để nạp sẵn, ô tìm "module hoặc tính năng", rồi tích từng quyền; mỗi nhóm có "Toàn quyền module" và đếm a/b. Mỗi quyền gắn nhãn "Quyền nhạy cảm" hoặc "Theo chính sách phê duyệt". 18 nhóm: Phê duyệt (6) · Chi nhánh (2) · Hoa hồng (7: cấu hình, chốt kỳ HH tiền mặt, duyệt, tạo đề nghị, thao tác, tính lại, xem kỳ) · Khách hàng (21: duyệt/đề nghị đổi tên, gộp, sửa dữ liệu nhạy cảm, xóa; gửi hóa đơn/phiếu khám qua email; kê đơn thuốc; quản lý/xem nhóm KH; xem email, SĐT, ghi chú y khoa, thông tin tài chính; xuất dữ liệu…) · Dashboard (1: quản lý bảng tin) · Email nghiệp vụ (8: lập đề nghị / duyệt / thực thi / từ chối gửi bảng lương và thư hội nhập) · Tài chính và kế toán (29) · Nhân sự (11: gửi bảng lương riêng tư, soạn/gửi email hội nhập, quản lý/xem mẫu email nhân sự, xem giờ làm người khác, xem dữ liệu sinh trắc học, xem hồ sơ người khác, xuất báo cáo giờ làm) · Tích hợp kênh (1) · Kho và mua sắm (5) · Đơn hàng (20: hoàn tiền, hủy, lùi ngày, sửa/mở khóa hóa đơn đã khóa, tạo HĐ sau khóa kỳ…) · Nghiệp vụ khác (1) · Lương (1: khóa kỳ) · Mua hàng và NCC (1) · Phân quyền (1) · Báo cáo (2) · Thẻ dịch vụ (7: thêm, sửa, xem, xóa…) · Cài đặt (4: kết nối/ngắt/gửi thử Gmail, thêm-sửa-ngừng TK ngân hàng, xem TK ngân hàng, xem nhật ký Gmail).
- Dữ liệu demo: ~25 tài khoản, nhiều Chủ sở hữu, có tài khoản Khóa thay vì xóa.

## 3. Quy tắc nghiệp vụ thấy được

Chấm công và ca
- Chấm công chính = check-in GPS qua Zalo Mini App; bán kính, bật/tắt GPS, cho phép chấm ngoài bán kính, chấm ngoài bán kính cần duyệt: cấu hình THEO CHI NHÁNH. Phương thức chỉ bật được khi máy chủ có bộ xác minh (selfie, QR chưa có). Ngoại lệ chấm công cần quy trình duyệt `attendance_exception` đang bật.
- Nhập công thủ công chỉ cho quản lý. OT là đơn riêng có giờ bắt đầu/kết thúc + lý do.
- Ca: giờ vào/ra, nghỉ giữa ca, dung sai trễ, giờ chuẩn tự tính; ca sai thì Ngừng sử dụng, không xóa. Phân ca theo khoảng ngày + thứ trong tuần + danh sách nhân viên, kèm "đối chiếu".
- Cuối tháng: Tính lại → Khoá tháng.

Nghỉ phép
- 8 loại nghỉ; 4 kiểu (cả ngày, nửa sáng, nửa chiều, theo giờ); đơn có Lưu nháp hoặc Gửi duyệt; vòng đời Nháp → Chờ duyệt → Chờ manager → Manager duyệt → Chờ HR duyệt → Đã duyệt / Từ chối / Đã huỷ.

Lương và hoa hồng
- Lương cơ bản theo giờ / ngày / tháng từng người. Bảng lương theo tháng + chi nhánh, chọn tính cả lương + hoa hồng hoặc riêng từng phần; có trạng thái Đang xử lý / Bị hủy. Thiếu công → trả trọn lương cơ bản; nghỉ việc giữa tháng → chia N/30.
- Hoa hồng 3 loại (tư vấn dịch vụ, bán sản phẩm/thẻ, làm dịch vụ) x đơn vị (%, VND, tùy chỉnh) x thời điểm (khi lập hóa đơn hoặc theo tiền đã thu); chia đều khi nhiều người cùng làm; tính trước/sau giảm giá; hệ số theo giờ phục vụ và theo đánh giá của khách.

Phê duyệt và phân quyền
- Quy trình phê duyệt no-code: điều kiện AND, nhiều bước, kiểu "một người / tất cả", người duyệt theo vai trò quan hệ (quản lý trực tiếp, trưởng chi nhánh, trưởng bộ phận…), ủy quyền, hết hạn theo giờ, quy trình mặc định khi không khớp.
- Quyền = (chi nhánh x 9 cờ) + (module x quyền chi tiết); quyền nhạy cảm tách riêng (xem SĐT, email, tài chính, xuất dữ liệu, ghi chú y khoa). Khóa thay xóa; reset mật khẩu do quản trị; liên kết Zalo cho chấm công / thông báo.

Tuân thủ hồ sơ
- Hồ sơ có % hoàn thiện và cảnh báo thiếu MST / BHXH / BHYT / HĐLĐ hiệu lực; nhật ký mọi thay đổi hồ sơ.

## 4. Điểm riêng nha khoa [NHA KHOA]
- Vai trò "Bác sĩ / Kỹ thuật viên" gộp; quyền "Kê đơn thuốc", "Xem ghi chú y khoa", "Gửi phiếu khám qua email".
- Hoa hồng dịch vụ tính theo đơn vị (mỗi răng) bên cạnh %.
- Chi nhánh có "Bác sĩ phụ trách chuyên môn" + số giấy phép hoạt động (AMIA cũng cần: giấy phép 1233/NA-GPHĐ).

## 5. Đề xuất (cho MSC Group OS; AMIA giữ phần dùng chung)

AMIA OS giữ: tài khoản + vai trò + quyền chi nhánh, hoa hồng (bán hàng), "Phụ trách lead theo chi nhánh" (thuộc Marketing/Lịch hẹn). MSC Group OS làm phần còn lại theo thứ tự:
1. Hồ sơ nhân viên đủ 5 nhóm trường (cá nhân + liên hệ khẩn cấp, công việc nhiều chi nhánh có cờ chấm công, chuyên môn, phúc lợi BHXH/BHYT/BHTN/thuế/người phụ thuộc, tài khoản) + cảnh báo tuân thủ + % hồ sơ + nhật ký.
2. Ca kíp + phân ca theo khoảng ngày/thứ + chấm công GPS theo chi nhánh (bán kính, chấm ngoài vùng cần duyệt) + nhập công thủ công + OT.
3. Đơn nghỉ 8 loại, 4 kiểu, nháp/gửi duyệt; tổng hợp tháng Tính lại / Khoá tháng.
4. Quy trình phê duyệt no-code (điều kiện, bước, kiểu duyệt, loại người duyệt, ủy quyền, hết hạn, mặc định) — chọn người duyệt bằng danh sách, KHÔNG bắt nhập UUID như demo.
5. Lương cơ bản giờ/ngày/tháng + bảng lương tháng (3 kiểu tính, Bị hủy) + gửi phiếu lương qua email có duyệt.
6. Email HR: thư hội nhập (bản nháp, duyệt rồi gửi), chúc mừng sinh nhật nhân viên 09:00.
Tránh lỗi demo: tab "Lịch làm việc"/"Bảng lương" trong hồ sơ còn "Phase 2"; lỗi phân trang thô ở Hợp đồng; nhập UUID người duyệt; nhiều tài khoản Chủ sở hữu.

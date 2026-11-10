# BeDental ERP - Mục "Văn bản & Hợp đồng" (đề bài cho AMIA OS)

Nguồn: đọc trực tiếp bản demo (mở form Tạo hồ sơ 3 loại rồi Hủy, mở Xem nhanh, không lưu) và mã giao diện. Không chép tên người, SĐT, email, số hợp đồng.

Cập nhật 10/11/2026: đã đọc được form "Tạo hồ sơ" (chọn nhóm: Văn bản đi / Văn bản đến / Hợp đồng, rồi form riêng từng nhóm), "Xem nhanh", tab "Đối tác". Mới so với 27/10: loại văn bản thứ 12 "Báo cáo"; mã loại (BB, BC, CV, GUQ, HD, KH, PL, QDH, QD, TB, TT, DX); "Ban hành & cấp số" tự động; Gia hạn hiệu lực bắt buộc kèm phụ lục PDF + lịch sử gia hạn; mức bảo mật hồ sơ; công khai lên Wiki; tải bản scan PDF nhiều tệp (tự nén > 15 MB, kiểm tra an toàn tệp); xóa tệp/hồ sơ phải ghi lý do. Demo nay 48 hồ sơ (3 sắp hết, 14 hết hiệu lực).

## 1. Mục đích
"Quản trị doanh nghiệp - Văn bản & Hợp đồng: quản lý xuyên suốt từ dự thảo, ký, hiệu lực, nghiệm thu đến hết hạn."

## 2. Màn hình

### 2.1 Danh sách hồ sơ
- Nút "Tạo hồ sơ". Thẻ KPI (bấm lọc): Tổng hồ sơ | Sắp hết hiệu lực | Hết hiệu lực | Công khai trên Wiki.
- Tab: Tất cả | Văn bản đến | Văn bản đi | Hợp đồng | Đối tác.
- Bộ lọc: ô tìm "Tên văn bản, mã hiệu, tên hoặc mã số doanh nghiệp…"; Loại văn bản (12: Biên bản, Báo cáo, Công văn, Giấy ủy quyền, Hợp đồng, Kế hoạch, Phụ lục, Quy định, Quyết định, Thông báo, Tờ trình, Đề xuất); Trạng thái (Còn hiệu lực / Sắp hết hiệu lực ≤ 90 ngày / Hết hiệu lực); Chi nhánh ("Tất cả chi nhánh được xem" + từng chi nhánh); Hiệu lực từ ngày / Đến ngày; nút Tìm kiếm.
- Cột: Tên văn bản / Số (dòng 2: "Loại · Số: …") | Đối tác | Hiệu lực (từ → đến / "không thời hạn") | Giá trị | Phạm vi (Toàn công ty / chi nhánh) | Trạng thái | Xem nhanh. Phân trang Trước / Sau.

### 2.2 Tạo hồ sơ - bước 1: chọn nhóm
Văn bản đi ("Dự thảo, lấy số và ban hành") | Văn bản đến ("Đăng ký số đến và giao xử lý") | Hợp đồng ("Theo dõi giá trị và hiệu lực"). Nút Hủy / Tiếp tục.

### 2.3 Tạo hồ sơ - bước 2: form theo nhóm
- Khối Đối tác: Mã số thuế / CCCD đối tác (MST 10 hoặc 13 số, hoặc CCCD 12 số), Tên doanh nghiệp đối tác, Địa chỉ, Email. Bắt buộc với Hợp đồng và Văn bản đến ("Cơ quan / đơn vị gửi"); không bắt buộc với Văn bản đi ("Đối tác / nơi nhận").
- Khối Thông tin hồ sơ: Loại văn bản* (Hợp đồng chỉ có HD; Văn bản đi/đến có 11 loại có mã) | Số: "Số hợp đồng*" / "Số văn bản đến*" / Văn bản đi: "Cấp tự động khi Ban hành & cấp số" (mẫu 01/2026/QĐ-BE) | Tên văn bản* | Ngày hiệu lực* | Ngày hết hiệu lực* hoặc "Không xác định ngày hết hiệu lực" | Tóm tắt nội dung* | Giá trị hợp đồng + Tiền tệ (VND/USD/EUR) hoặc "Không xác định giá trị" | Nơi lưu trữ (bắt buộc với HĐ và VB đến) | Chi nhánh (Toàn công ty / từng chi nhánh) | Bản scan PDF* (nhiều tệp, mỗi tệp ≤ 40 MB, tệp > 15 MB tự nén; chọn từ máy hoặc iCloud/Google Drive/OneDrive/Dropbox).
- Nút: Quay lại | Lưu hồ sơ.

### 2.4 Xem nhanh một hồ sơ
Nhóm · loại; tên; nút Sửa | Xóa | Tải về; trạng thái hiệu lực; mức bảo mật (Thường...); Phiên bản; Số hợp đồng; Hiệu lực; Giá trị; Nơi lưu trữ; Phạm vi xem; Tạo lúc; Tóm tắt nội dung; Đối tác (tên, MST, địa chỉ, email); Tệp đính kèm (tên, "Bản scan", dung lượng, ngày; xem trước / tải về / xóa tệp có lý do).

### 2.5 Tab Đối tác
Tìm "Tên hoặc mã số doanh nghiệp…". Cột: Doanh nghiệp đối tác | Mã số doanh nghiệp | Địa chỉ | Email | Trạng thái (đang dùng / ngừng).

### 2.6 Chức năng khác (từ mã giao diện)
- "Ban hành & cấp số" (văn bản đi): hệ thống cấp số kế tiếp theo năm + mã loại và KHÓA nội dung, không sửa được nữa; phải ban hành trước khi công khai.
- "Gia hạn hiệu lực": ngày hết hiệu lực mới (hoặc không xác định) + bắt buộc tải "Phụ lục / Thỏa thuận gia hạn (PDF)" + ghi chú; có "Lịch sử gia hạn".
- Hồ sơ đã gửi duyệt / ban hành không sửa trực tiếp - dùng Gia hạn hoặc phụ lục; không đổi loại văn bản sau khi tạo.
- "Công khai trên Wiki công ty": toàn bộ nhân viên xem được, tự ẩn khi hết hiệu lực.
- Mức bảo mật / phạm vi xem: Thường, Nội bộ, Mật, Hạn chế ("Chỉ người được cấp quyền").
- Tệp: kiểm tra an toàn (Chờ kiểm tra / Bị chặn), phát hiện tệp trùng, nén PDF; xóa tệp / hồ sơ cần lý do (≥ 3 ký tự), tệp vẫn giữ để truy vết.
- Chống ghi đè: "Hồ sơ vừa được người khác sửa. Đóng và mở lại."

## 3. Quy tắc nghiệp vụ thấy được
1. Trạng thái hiệu lực tự tính từ ngày: không thời hạn = còn hiệu lực; đã qua = Hết; ≤ 90 ngày = Sắp hết.
2. Ba nhóm hồ sơ với trường bắt buộc khác nhau; văn bản đi được cấp số tự động khi ban hành.
3. Đối tác là danh mục dùng chung, định danh bằng MST/CCCD.
4. Bản scan PDF là bắt buộc; gia hạn bắt buộc có văn bản gia hạn.
5. Phạm vi xem theo chi nhánh và mức bảo mật; công khai wiki có điều kiện.
6. Không xóa cứng: xóa có lý do, giữ vết.

## 4. Điểm riêng nha khoa [NHA KHOA]
- Hợp đồng chất thải y tế, xử lý nước thải, PCCC (chung cho phòng khám), bảo lãnh viện phí với bảo hiểm, mua implant/sứ/ghế nha (riêng nha).

## 5. Đề xuất cho AMIA
AMIA /van-ban đã có: sổ văn bản, nhóm (khách/đối tác/nội bộ/chính sách), luồng nháp → chờ duyệt → đã duyệt → đã ký, phiên bản, "Cần xử lý" (sắp hết hạn, thiếu bản điện tử, dùng tạm), đồng ý dùng ảnh. Còn thiếu:
1. Tải bản scan PDF lên hệ thống (AMIA chỉ lưu link https), xem trước, nhiều tệp, giới hạn dung lượng.
2. Phân Văn bản đến / Văn bản đi / Hợp đồng; văn bản đi "Ban hành & cấp số" tự động theo mã loại + năm, khóa nội dung.
3. Gia hạn hiệu lực có phụ lục bắt buộc + lịch sử gia hạn.
4. Danh mục đối tác riêng có MST/CCCD, địa chỉ, email (AMIA dùng nhà cung cấp).
5. Mức bảo mật hồ sơ (Thường / Nội bộ / Mật / Hạn chế) và phạm vi xem theo chi nhánh.
6. Công khai lên Wiki (tự ẩn khi hết hiệu lực); KPI cards; lọc theo khoảng hiệu lực, giá trị + tiền tệ.

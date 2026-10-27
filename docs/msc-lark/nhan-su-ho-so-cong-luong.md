# MSC Lark: hồ sơ nhân sự, chấm công, bảng lương, onboarding, tuyển dụng, vai trò tài chính

Ngày đọc: 27/10/2026. Người đọc: Tula (tài khoản Trợ Lý CEO), CHỈ ĐỌC, không sửa gì trên Lark.
Mục đích: cho lập trình viên AMIA OS áp dụng vào module Nhân sự / Lương theo nghiệp vụ thật của MSC.

Quy ước trong tệp này:
- Không có tên người, SĐT, CCCD, số tài khoản, địa chỉ, mức lương/thưởng cá nhân, tổng quỹ lương thật. Chỉ có cấu trúc, công thức, danh mục, hằng số quy định chung.
- "[OCR]" = số lấy từ bản scan PDF qua OCR, chưa đối chiếu mắt với trang gốc.
- "Chưa đọc được" = không mở được hoặc công thức nguồn bị hỏng. Không suy đoán.
- Công thức viết lại dạng ký hiệu; tên trường giữ đúng nhãn tiếng Việt trên Lark để dễ đối chiếu.

---

## 1. Nguồn

| # | Tài liệu | Loại | Link / mã | Trạng thái đọc |
|---|---|---|---|---|
| 1 | HRM-HRIS-01-2025 Hồ sơ nhân sự_Công lương_MSC | Bitable (51 bảng, 20 workflow, 1 dashboard) | https://mscgroupvn.jp.larksuite.com/base/V0pVbwdzsaS6VisuvNwjSkWhpIg | Đọc đủ bảng, trường, công thức, workflow. Dashboard chỉ biết tên "7.1 Tổng quan chấm công" (chưa đọc khối). |
| 2 | Bảng lương tháng 9.2026 | Sheet, 6 tab | https://mscgroupvn.jp.larksuite.com/sheets/IUKkseL4Oh2Z5stB3HtjD4Mmpvg | Đọc tiêu đề + công thức hàng mẫu mọi tab. Bỏ qua giá trị cá nhân. |
| 3 | MSC25_BNL&PT_Bảng dự thảo lương t2.2026.fix | Sheet, 7 tab (4 tab hiện, 3 tab ẩn) | https://mscgroupvn.jp.larksuite.com/sheets/PnP5sIPBthlYktttXuDjH3IAp5c | Đọc tiêu đề + công thức tab LCB, Tổng hợp quỹ, Tổng trợ cấp, Tổng thu nhập. Tab "Dự chi T2" và "Lương trị liệu" chỉ thấy tổng SUM. |
| 4a | HRM-ONB-01-2026-SOP Quy trình Onboarding cho nhân sự mới | Docx | https://mscgroupvn.jp.larksuite.com/docx/ISqMdXshloUCkWxP1fJjUCRuplc | Đọc chữ. 2 sơ đồ whiteboard + 7 sơ đồ con: chưa đọc được (chỉ còn mô tả ảnh mẫu tin nhắn). |
| 4b | HRM-ONB-05-2025 Hệ thống Onboarding cho nhân sự thử việc | Bitable (13 bảng) | https://mscgroupvn.jp.larksuite.com/base/N83ebZyzAaWGWPsJQPQjp66Kpob | Đọc bảng, trường, công thức hạn. |
| 4c | Thư mục "3.1. ONB_Đào tạo nhân sự ban đầu" | Folder | https://mscgroupvn.jp.larksuite.com/drive/folder/XfXIf13gClgk2kdy95BjvG2apWe | Chỉ liệt kê: chứa 4a, 4b và thư mục con "Tài liệu quy định - quy chế" (PDF mô tả công việc, quy chế làm việc, quy định trị liệu/tư vấn, định mức tiếp khách/công tác phí, sheet CCTC & phân quyền). Các tài liệu này do tác nhân khác đọc, KHÔNG đọc ở đây. |
| 5 | COS-FIN-02 Vai trò và trách nhiệm công việc | Docx (wiki) | https://mscgroupvn.jp.larksuite.com/wiki/LWl7wobtfiFsATk60GQjp1UOpVd | Đọc đủ. Sơ đồ whiteboard đầu trang chưa đọc được. |
| 6 | Wiki "MSC_BNLPT_Nhân lực" (space 7592492512036523539, gốc AODdwuH2ViIHfwkuQ6ij98HypRd) | Wiki | node 5 "Thu nhập" QWnhw2PGNi7ZkxksTV1jxjOHphH và con 5.1 JzHFwLqDcijlygks4WujcbeXpTe, 5.2 C7iwwRCzHidE9Lk9hU0jYjWypIg, 5.3 QtzYwoeoGi8KpqkAFkJjvlrcpde, 5.4 NmN1w25G1iiw3qk4eRxjiSk7pse; node 6 "Tuyển dụng" LauBwwwZbi2FSIkSPbKjcwZSpbc và con 6.1 Y1wfwfNUdixvFVkTYPsjJQY8pMc, 6.2 ZQLIw2DdeiBR45k1bKbjCrN7pnf, 6.3 VruAwiF9TiT6zLkKJltjWSAkpCd, 6.4 ED9WwZIWViti8YkHG9ijGu5cpwc; node 2 UVzZw5KyJiy5pJkMpfej7OhHp5e; node 3.4 JUuMw2yeSiD6vxkyfq1j3w9vpdd; node 4 GJZdwVGTCijm1UkxrTVjKPA3pZe | Các trang này gần như TRỐNG: chỉ có tiêu đề hoặc vài gạch đầu dòng (xem mục 5). Nội dung thật nằm ở 2 PDF bên dưới. |
| 7 | PDF "MSC_BNLPT_Quyết định ban hành chính sách lương, thưởng số 002.2026" (node Z66hwqFnTit1r5kggbOjZpTBpLf, 4 trang, scan) | PDF scan | tải bằng `drive +download --wiki-token`, OCR bằng Vision | Đọc đủ qua OCR. |
| 8 | PDF "MSC_PNLPT.QĐ_Quy định trả lương thưởng_2601002" (node KeLMwVBHuicfitkK1eGjpn46poc, 60 trang, scan) | PDF scan | như trên | Đọc OCR các mục 1-5, 6.1-6.7, 7. Bảng biểu bị OCR vỡ, nhiều giá trị bảng (hệ số chức danh, mức trợ cấp theo vùng, tỷ lệ BSC theo nhóm) chưa trích được. |
| 9 | Bitable MSC.BNL&PT_Tuyển dụng | Bitable (26 bảng) | https://mscgroupvn.jp.larksuite.com/base/JypXbgmiUawsARsQEfej3PLYpNb | Đọc bảng, trường, các trạng thái lựa chọn. |
| 10 | Bitable TC-OPS-01-2026 Quản lý Tài chính - Cung ứng (bổ sung, tìm qua search) | Bitable | https://mscgroupvn.jp.larksuite.com/base/ORqxbZM68aE6oEsGuAjjkWv8pqe | Đọc bảng "2.2 Hạn mức phê duyệt", "3.2 Đề nghị chi", "3.3 Tạm ứng - hoàn ứng". |
| 11 | Tìm thêm bằng `docs +search` (hợp đồng lao động, thử việc, BHXH, KPI, chấm công, tạm ứng, thưởng, hoa hồng) | - | - | Chỉ ra kết quả trùng bộ trên + các file KPI/kế hoạch theo chức danh (docx "8 - Mô tả công việc & Chương trình thử việc" chứa 9 file xlsx "Kế hoạch & KPI" theo chức danh, chưa mở) + sheet "Kế toán trưởng/viên/tổng hợp - Kế hoạch & KPI" + sheet BSC Q2 (MSC26_BKD...). Chưa đọc. |

---

## 2. Cấu trúc hồ sơ nhân sự (bitable HRM-HRIS-01)

### 2.1 Các nhóm bảng (51 bảng)
- 1.x Hồ sơ: 1.1 Quản lý nhân sự (hồ sơ gốc, 1 dòng/nhân sự), 1.2 Thông tin gia đình, 1.3 Theo dõi ký hợp đồng CNV, 1.4 Theo dõi ký hợp đồng khác (cộng tác viên), 1.5 Đánh giá tái ký hợp đồng, 1.6 Theo dõi lộ trình thăng tiến (lịch sử có hiệu lực theo ngày), 1.7 Thông tin lương, phúc lợi (bảng tra cứu), 1.8 Xin nghỉ việc, 1.9 Khảo sát nghỉ việc, 1.10 Phiếu đề xuất điều chỉnh nhân sự.
- 2.x Chấm công: 2.1 Employee_Info, 2.2 Department_Info (đồng bộ từ Lark), 2.3 Attendance_Results (kết quả theo ngày/người, 73 trường), 2.4 Attendance_Records (từng lượt chấm), 2.5 Bảng tổng hợp công theo ngày (ma trận ngày trong tháng), 2.6 Điều chỉnh sai sót chấm công.
- 3.x Đơn từ: 3.1 Phép làm online, 3.2 Phiếu xin nghỉ phép (gộp nghỉ phép, đi trễ/về sớm, nghỉ không lương, nghỉ chế độ, xin ra ngoài), 3.3 Quỹ phép năm, 3.4 Đăng ký ra ngoài, 3.5 Phiếu xác nhận làm thêm giờ, 3.6 Đăng ký nghỉ tháng, 3.7-3.8 Đăng ký/danh sách nghỉ lễ.
- 4.x Lương: 4.1 Bảng lương (sổ tính tháng), 4.2 Bảng lương khác (cộng tác viên/thời vụ), 4.3 Báo cáo lương theo tháng (theo phòng ban), 4.4 Lưu trữ bảng lương (snapshot), 4.5 Thuế TNCN lần 1, 4.6 Ghi nhận chi tiêu quỹ.
- 5.x Hiệu quả: 5.1 Hiệu quả làm việc BSC (theo tháng/năm), 5.2 Hỗ trợ KPI, 5.3 Ghi nhận lương đồng bộ từ Kinh doanh (hoa hồng/thưởng), 5.4 Quản lý thưởng phạt (khoản thu/khoản chi theo người).
- 6.x Khác: 6.1 Tài sản công ty cấp, 6.2 eNPS, 6.3 Khảo sát tín nhiệm.
- 7.x Thống kê: 7.2 Phân nhóm hợp đồng, 7.3-7.4 Thống kê dashboard (theo phòng ban/chức vụ), 7.5 Cơ cấu lương.
- 9.x Danh mục: 9.1 Tháng/năm, 9.2 Phòng ban (+ chức vụ, chi nhánh, phân nhóm), 9.3 Ngày nghỉ lễ.
- 10.x: bản sao "BOD" của 2.x và vài đơn từ dành cho Ban Giám đốc (xin phép online, hậu cần công tác, xin nghỉ việc).

### 2.2 Bảng 1.1 Quản lý nhân sự: các trường nhập tay (68 trường, gồm cả công thức)
Nhóm nhập:
- Định danh: *Mã nhân viên (auto number), STT, *Họ và tên, *Tk Lark NS (người dùng Lark, là khoá nối với mọi bảng khác), Email, Hình ảnh.
- Cá nhân: Giới tính {Nữ, Nam}; Ngày sinh; Nơi sinh; Quê quán; Dân tộc; Tôn giáo; Quốc tịch {Việt Nam}; Tình trạng hôn nhân {Độc thân, Đã lập gia đình, Đã lập gia đình có con, Khác}; Địa chỉ hiện tại.
- Giấy tờ: Căn cước công dân (số, ngày cấp, nơi cấp, ảnh 2 mặt), Mã số thuế TNCN, Số sổ BHXH, Số thẻ BHYT, Nơi đăng ký BHYT, tệp NDA/cam kết bảo mật.
- Liên hệ khẩn: Họ tên người thân, Mối quan hệ, SĐT người thân.
- Học vấn: Trường, Ngành học.
- Lương nhận: Hình thức {Chuyển khoản, Tiền mặt}, Ngân hàng, Số tài khoản (+ cột "Số tài khoản VCB" để so khớp, cờ "Cần điều chỉnh" nếu lệch).
- Mốc thời gian: Ngày vào làm (= ngày bắt đầu thử việc), Ngày lên chính thức, Ngày nghỉ việc.
- Chức vụ: danh mục chức danh (xem 2.5).

Nhóm công thức (suy ra, không nhập):
- Trạng thái = "Trạng thái(*)" của dòng 1.6 mới nhất của nhân sự đó. Tình trạng = "Tình trạng(*)" của dòng 1.6 mới nhất. Phòng ban, Nơi làm việc cũng lấy từ dòng 1.6 mới nhất theo Tk Lark NS.
- Quản lý trực tiếp = tra 9.2 theo phòng ban.
- Tuổi, Nhóm độ tuổi {<25, 25-29, 30-34, 35-39, 40+}, Số tháng làm việc = DATEDIF(Ngày vào làm, hôm nay, "m"), Phân loại thâm niên {<1 năm, 1-2, 2-3, 3-5, 5+}.
- Số ngày lên chính thức = |Ngày lên chính thức - Ngày vào làm|; Nhân sự mới trong năm; Tháng/Năm vào làm, lên chính thức, nghỉ việc (tra 9.1).
- Chỉ số HR trong năm: nhân sự đầu kỳ (vào làm <= 01/01 và chưa nghỉ hoặc nghỉ >= 01/01), nhân sự cuối kỳ (vào làm <= 31/12 và chưa nghỉ hoặc nghỉ > 31/12), nhân sự bình quân = (đầu + cuối)/2, biến động nghỉ việc = số nghỉ trong năm / bình quân, tỷ lệ giữ chân = (tổng - mới trong năm)/(tổng - mới + số nghỉ).
- Nhắc sinh nhật (so tháng sinh với tháng hiện tại và ngày = 1: dấu hiệu công thức nguồn chưa đúng ý, xem mục 7).

### 2.3 Bảng 1.6 Theo dõi lộ trình thăng tiến = lịch sử điều kiện lương/chức danh (có hiệu lực theo ngày)
Mỗi lần điều chỉnh là một dòng mới (chức danh, tình trạng, lương...). Hồ sơ hiện hành = dòng có "Ngày cập nhật" lớn nhất của nhân sự ("Check ngày mới nhất"). Trường:
- Khoá: Mã nhân viên (link tới 1.1), Ngày áp dụng, Ngày cập nhật, tệp Quyết định điều chỉnh.
- Phân loại: Trạng thái(*) {Đang làm, Đã nghỉ (nguồn gõ sai "Đã nghĩ")}; Tình trạng(*) {Chính thức, Thử việc, Remote, Cộng tác viên}; Vị trí(*) {Giám đốc, Nhân viên, Trưởng phòng, Trưởng bộ phận}; Chức danh(*) (danh mục 2.5); Phòng ban (danh mục 2.4); Làm việc (đơn vị) {AVI, MSC, ADL, Văn Phòng}; Khung làm việc {Văn Phòng, Chi Nhánh, Không chấm công}.
- Lương và phụ cấp (số tiền): Lương CB (BHXH), Hệ số lương, Lương thỏa thuận, Thu nhập chức danh, Thưởng hiệu quả công việc, Phụ cấp trực ca, Hỗ trợ nhà ở, Ăn ca, Hỗ trợ đồng phục, Tập sự, Phụ cấp khác, Quỹ nhân viên (công đoàn).
- Cờ: Đóng BH {Đóng BH, Không đóng BH, Đóng ở cty khác}; Cam kết 08 - TTNCN {Có, Không}.
- Ngày thông báo review lương = Ngày áp dụng + 1 năm - 15 ngày (workflow nhắc "review lương").

### 2.4 Danh mục phòng ban / chi nhánh (9.2)
- Phòng ban (12 giá trị): Hành chính - Nhân sự; Tài chính & Cung ứng; Tiếp thị; Kinh doanh; Chuyên môn & Phát triển; Tư vấn AVI; Trị liệu AVI; DVKH AVI; Trị liệu ADL; DVKH ADL; Tư vấn ADL; BOD.
- Chi nhánh/đơn vị: MSC (tổng công ty), AVI (Vinh), ADL (Đà Lạt).
- Văn phòng: Hà Nội, Hồ Chí Minh, Đà Nẵng (danh mục có trong bảng, dùng chưa rõ).
- Vị trí: Giám đốc, Nhân viên, Trưởng phòng, Trưởng bộ phận.
- Phân nhóm hợp đồng: Chính thức, Thử việc, Cộng tác viên.
- Thời gian làm việc (lịch): T2-T6; T2-nửa T7; T2-T7; T2-Chủ nhật; T2-T7 lẻ; T2-T7 chẵn.
- Mốc thời gian chấm công: Vào ca sáng, Tan ca sáng, Vào ca chiều, Tan ca chiều, Nghỉ trưa, Tổng số phút trễ cho phép.
- Phân nhóm thâm niên: <3 tháng; 3-6 tháng; 6 tháng-1 năm; 1-3 năm; 3-7 năm; >7 năm. Phân nhóm tuổi: <25; 25-30; 30-35; 35-45; >45. Giới tính: Nam, Nữ, Khác.

### 2.5 Danh mục chức danh (trong 1.1 / 1.6 / 9.2, đã gộp bỏ trùng)
Giám đốc; Trợ lý Giám đốc; Trưởng ban Kiểm soát nội bộ; Trưởng Phòng Nhân lực Phát triển; Trưởng Phòng Hành chính - Nhân sự; Hành chính Nhân sự; Hành chính (kiêm Thủ quỹ); Chuyên viên Tuyển dụng kiêm đào tạo; Cộng tác viên tuyển dụng; Kế toán trưởng; Kế toán Tổng hợp; Kế toán viên; Trưởng phòng Tiếp thị (Tiếp Thị); Chuyên viên/Nhân viên Sáng tạo Nội dung; Nhân viên Sáng tạo Nội dung kiêm Tổ chức Sự kiện; Chuyên viên/Nhân viên Biên tập Video; Nhân viên Thiết kế; Chuyên viên Công nghệ thông tin; Trưởng Phòng Kinh doanh; Trưởng Nhóm Telesales; Nhân viên Telesales; Nhân viên CSKH; Trưởng bộ phận Tư vấn; Chuyên viên Tư vấn; Nhân viên Tư vấn; Trưởng bộ phận Trị liệu; Chuyên viên Trị liệu; Nhân viên Trị liệu (xuất hiện 2 lần, cần gộp); Bác sĩ; Nhân viên Thu ngân; Nhân viên tạp vụ; Quản lý chi nhánh ADL; Quản lý chi nhánh AVI; Trợ lý chi nhánh; Cộng tác viên.
(Danh sách có thể bị cắt ở cuối do độ dài hiển thị; chưa chắc đã đủ.)

### 2.6 Hợp đồng (1.3, 1.4, 1.5) và vòng đời thử việc
- Chuỗi hợp đồng của chính thức (nhân viên) tính tự động từ 1.1 và 1.3:
  - Thử việc: Từ "Ngày vào làm" đến +59 ngày (công thức "Đến ngày(*)" = Từ ngày +59, tức 60 ngày). Có thêm các mốc 7 / 30 / 60 ngày thử việc.
  - Lần 1: từ "Ngày lên chính thức", dài 1 năm (đến ngày = +1 năm -1).
  - Lần 2: dài đến mốc +2 năm -1 kể từ lần 1.
  - Sau lần 2: hợp đồng không xác định thời hạn (KXĐ). Các trường số hợp đồng: Số HĐTV (thử việc), Số HĐLĐ lần 1, Số HĐLĐ lần 2, Số HĐ KXĐ; có tệp hợp đồng đính kèm cho từng giai đoạn.
  - "Loại hợp đồng" tự suy: Hợp đồng thử việc / Hợp đồng 1-12 tháng / Hợp đồng 12-36 tháng / Hết hạn hợp đồng (so với hôm nay).
  - "Ngày đến hạn" = mốc kết thúc gần nhất chưa qua, hoặc "vô thời hạn". "Ngày đến hạn - 45" (nhắc trước 45 ngày). Cột "Cảnh báo" = "cảnh báo" khi còn <= 7 ngày tới hạn hoặc đã quá hạn mà chưa ký kỳ kế (và chưa có HĐ KXĐ).
- 1.4 Hợp đồng khác (cộng tác viên): tạo tự động từ 1.6 khi có cập nhật (workflow 8.1). Không có quy tắc thời hạn tự tính.
- 1.5 Đánh giá tái ký: Đề xuất {Tái ký hợp đồng, Dừng hợp tác}, Mức độ phù hợp 1-5, Điểm TB, Nhận xét. (Hiện 0 bản ghi.)
- 1.10 Phiếu đề xuất điều chỉnh nhân sự (qua Approval): Loại điều chỉnh {Luân chuyển, Thăng chức, Tăng lương}, Phòng ban cũ/mới, Chức vụ cũ/mới, Lương cũ/mới (VND), Thời gian áp dụng, Nội dung, tệp quyết định. Duyệt xong thì chúc mừng (workflow 8.7).

### 2.7 Nghỉ việc (1.8 / 10.7) và khảo sát (1.9)
Phiếu xin nghỉ việc (Approval): Loại nghỉ {Đúng hạn, Trước hạn}; Lý do (danh mục: Lương thưởng không phù hợp, Không có cơ hội thăng tiến, Công việc không đúng định hướng, Muốn đổi môi trường, Áp lực cao, Khối lượng không hợp lý, Không phù hợp văn hoá, Khác); Ngày làm việc cuối cùng; Người nhận bàn giao; Đã/Chưa hoàn thành bàn giao; Biên bản thỏa thuận nghỉ việc {Đã ký, Chưa ký}; Cam kết bảo mật chống cạnh tranh {Đã ký, Chưa ký}; Cam kết hoàn thành trách nhiệm; Khảo sát nghỉ việc (link). Trạng thái phiếu chuẩn của Lark Approval: Under Review, Processing, Approved, Rejected, Canceled, Terminated, Recalled, Deleted.
Theo COS-FIN-02: khóa tài khoản người nghỉ trong tối đa 24 giờ.

### 2.8 Phép năm (3.3) và đơn từ
- Phép năm trong năm = nếu lên chính thức từ năm trước: số tháng của tháng hiện tại (mỗi tháng 1 ngày); nếu lên chính thức trong năm: tháng hiện tại - tháng lên chính thức + (1 nếu ngày lên chính thức <= 15, nếu không +0). Tối thiểu 0.
- Tổng phép = phép năm + phép tồn. Đã dùng = tổng "Ngày phép" của phiếu Nghỉ Phép Có Lương đã Approved trong năm + số đã dùng nhập tay trước đó. Khả dụng = tổng phép - đã dùng. Cảnh báo "Hết phép" (=0) / "Âm phép" (<0; lưu ý thứ tự IF trong nguồn làm "Âm phép" không bao giờ hiện, xem mục 7).
- Phiếu 3.2: Leave type {Nghỉ Phép Có Lương; Đi trễ/về sớm; Nghỉ không lương; Nghỉ chế độ (cưới, ma chay...); Xin đi ra ngoài; Xin đi ra ngoài việc công ty}. Leave unit {day, hour}; Ngày phép = Duration/8 nếu đơn vị giờ, nếu không = Duration. Có trường đi trễ/về sớm theo bước 15 phút (0-120).
- 3.5 Làm thêm giờ (Approval): Khung giờ {Giờ hành chính, Ngoài giờ hành chính}; Hệ số tăng ca = 1.5 nếu ngoài giờ hành chính, ngược lại 1; Khoảng thời gian (giờ) = (End - Start) * 24, làm tròn 2 số; gắn mã khách hàng, tên dịch vụ (OT theo ca khách).
- 3.6 Đăng ký nghỉ tháng (workflow 8.11 gửi duyệt ngày nghỉ); 3.8 Danh sách nhân sự nghỉ lễ (sinh từ 3.7 bằng nút, workflow 8.12). 9.3 ngày lễ.
- Quyền xin nghỉ/nghỉ lễ theo quyết định 002.2026 (xem mục 4.5).

---

## 3. Chấm công (bảng 2.x) và cách ra "công thực tế"

- Dữ liệu gốc: máy chấm công/Lark Attendance → 2.4 (mỗi lượt) và 2.3 (kết quả theo ngày/người). Mỗi ngày có tối đa 2 ca (ca 1 và ca 2) với: giờ vào/ra, giờ ca, kết quả {NoNeedCheck, SystemCheck, Normal, Early, Late, Lack, Todo}, loại chấm (User attendance, Administrator modification, User correction, Automatically generated by the system, Clock-out is not required, Attendance machine, Express attendance, Imports...), bổ sung {None, ManagerModification, CardReplacement, ShiftChange, Travel, Leave, GoOut, CardReplacementApplication, FieldPunch}, cờ ngoài văn phòng, tên địa điểm.
- Trạng thái trong ngày (suy ra theo từng ngày, KHÔNG theo trạng thái hiện tại của nhân sự): "Thử việc" nếu ngày >= ngày bắt đầu thử việc và ngày <= (ngày lên chính thức - 1) hoặc chưa có ngày lên chính thức; còn lại "Chính thức". Vì vậy một tháng có thể có cả công thử việc và công chính thức của cùng một người.
- Công thực tế mỗi ca: cả vào và ra hợp lệ (khác Lack/NoNeedCheck) → ca = 0.5 công (4 giờ); chỉ 1 trong 2 → 0.25 công; không có → 0. Công thực tế ngày = ca 1 + ca 2 - (ngày công đi trễ/về sớm / 60 / 8).
- Đi trễ / về sớm: số phút trễ = (giờ vào - giờ ca vào) tính phút cho từng ca; ngày công đi trễ-về sớm = (phút trễ + phút sớm) / 480; nếu có phiếu "Đi trễ/về sớm" đã duyệt thì lấy theo phiếu / 480.
- Cộng thêm: Nghỉ phép năm, Nghỉ phép khác (chế độ), Nghỉ không lương (mỗi loại tối đa 1 ngày; nếu start = end thì 0.5), Công tác (phiếu hậu cần công tác đã duyệt), Ghi nhận nghỉ lễ (từ 3.8), Hiển thị công (ký hiệu: L = lễ, CT = công tác, P, P/2, PK, KL, ...).
- Giờ tăng ca/ngày = tổng khoảng thời gian của phiếu OT đã duyệt phủ ngày đó; Hệ số lương tăng ca = "150%" nếu khung "Ngoài giờ hành chính", "100%" nếu trong giờ.
- Phụ cấp ăn trưa/ngày = ăn trưa/ngày nếu công thực tế > 0.
- Quên chấm công: tính 0.5 cho mỗi lần vào/ra thiếu (trừ Chủ nhật, công tác, nghỉ phép).
- Phạt đi trễ: có công thức luỹ tiến theo số lần (khởi điểm 5.000 đ, nhân đôi mỗi lần) nhưng tham chiếu trường đã bị xoá → "chưa đọc được", không dùng làm căn cứ.
- 2.6 Điều chỉnh sai sót chấm công (Approval): Loại lỗi {Đi muộn, Quên chấm công, Lý do công việc, Lý do khác}, Loại {check-in / check-out}, thời điểm bù, minh chứng.

---

## 4. Công thức bảng lương từng bước

Có hai hiện thực: (A) bitable 4.1 Bảng lương (tính tự động, nguồn sự thật nội bộ) và (B) sheet "Bảng lương tháng 9.2026" (bản chi trả, nhập kết quả từ A và thêm cột chi trả). Mô tả theo A, ghi điểm khác của B.

### 4.1 Kỳ lương và ngày công
- Kỳ lương = tháng dương lịch (1 → cuối tháng). Quy định: chốt chấm công vào ngày cuối tháng dương lịch, trả lương muộn nhất trước ngày 10 tháng kế tiếp [OCR, mục 3.4.1]. Bảng 4.1 tạo 1 dòng/nhân sự/tháng bằng workflow hằng tháng (8.13) cho nhân sự "Đang làm" có mã; trường "Ngày tạo" quyết định Tháng/Năm của dòng.
- Công chuẩn (4.1) = MIN( số ngày trong tháng - số ngày nghỉ hằng tuần theo công thức (đếm một ngày trong tuần theo thứ của ngày 1), 26 ). Tức tối đa 26.
- Sheet B dùng cột "Ngày công / Công chuẩn" nhập số (26).
- Bản dự thảo T2.2026 dùng ngày công tiêu chuẩn: 24 cho đơn vị MSC (văn phòng), 26 cho các đơn vị khác (IF đơn vị="MSC",24,26).
- Quy định: công chuẩn hằng tháng "công bố hàng năm" (chưa tìm thấy bảng công bố).

### 4.2 Ba khối công
- Công chấm công = ROUNDUP(tổng "Công thực tế" của mọi dòng 2.3 trong tháng, 3 số lẻ); riêng khung "Không chấm công" thì = Công chuẩn.
- Công CT thực tế (chính thức) = ROUNDUP( MAX(0, Σ công thực tế các ngày trạng thái Chính thức + Nghỉ lễ CT + Bổ sung công (CT) [nhập tay] + Nghỉ phép tính lương [nhập tay] + Σ "Nghỉ phép có lương" các ngày Chính thức), 3 ); khung "Không chấm công" thì = Công chuẩn.
- Công TV thực tế (thử việc) = ROUNDUP( MAX(0, Σ công thực tế ngày Thử việc + Bổ sung công (TV) + Nghỉ lễ TV + Nghỉ phép tính lương [nhập tay]), 3 ). (Nguồn cộng "Nghỉ phép tính lương nhập tay" ở cả CT và TV: có thể bị tính hai lần, xem mục 7.)
- Tổng công = Công CT thực tế + Công TV thực tế.
- Nghỉ lễ CT/TV = số ngày lễ được ghi nhận trong tháng của nhân sự theo trạng thái ngày đó (CT hoặc TV).
- Sheet B: các cột L/O nhập số kết quả; Tổng công = công CT (Q = L); cột Công TV tồn tại nhưng không vào công thức R.

### 4.3 Lương cơ bản, thưởng hiệu suất, thu nhập chức danh
- Lương thỏa thuận (E, từ 1.6) = tổng lương hợp đồng. Lương cơ bản (I) = "Lương BHXH" (1.6: "Lương CB (BHXH)"), là mức đóng bảo hiểm. Thưởng hiệu suất CT (J) = Lương thỏa thuận - Lương cơ bản (đối chiếu các hàng mẫu của sheet B, chênh nhất quán; trong bitable là trường nhập "Thưởng hiệu quả công việc").
- Thu nhập chức danh = (Lương cơ bản + Thưởng hiệu suất CT) × Hệ số. (Dùng làm đơn giá giờ OT và cho báo cáo cơ cấu lương.)
- Hệ số (1.6 "Hệ số lương") dùng cho lương thử việc.
- Lương ngày công chính thức thực tế = Lương cơ bản × Công CT thực tế / Công chuẩn. (Bitable.)
- Lương ngày công thử việc thực tế = Lương cơ bản / Công chuẩn × Công TV thực tế × Hệ số. (Bitable.)
- Sheet B: Lương ngày công thực tế (R) = ((Lương cơ bản × % lương thử việc) / Công chuẩn) × Tổng công. Cột "% lương thử việc" (F) đang 100%. Lương thử việc H = Lương thỏa thuận × % lương thử việc (cột tham chiếu).
- % hiệu suất (bitable) = (Công TV thực tế × Hệ số + Công CT thực tế) / Công chuẩn. Thưởng hiệu suất (bitable) = Công TV/Công chuẩn × Thưởng hiệu suất TV + Công CT/Công chuẩn × Thưởng hiệu suất CT; với Thưởng hiệu suất TV = Thưởng hiệu suất CT × Hệ số. Sheet B: % hiệu suất (S) nhập tay (tỷ lệ), Thưởng hiệu suất T = J × S.

### 4.4 Làm thêm giờ (OT)
- Tổng lương OT = ( OT_CT150 + OT_TV150 × 0.85 ) / (Công chuẩn × 8) × Thu nhập chức danh × 1.5 + ( OT_CT100 + OT_TV100 × 0.85 ) / (Công chuẩn × 8) × Thu nhập chức danh × 1.0.
- OT_xx = Σ giờ tăng ca theo hệ số lương tăng ca ("150%": ngoài giờ hành chính; "100%": trong giờ) và theo trạng thái ngày (CT/TV), của tháng. Giờ OT thử việc nhân 0.85.
- Làm tròn: không làm tròn riêng; vào Tổng thu nhập Gross.

### 4.5 Phụ cấp và hỗ trợ
- Ăn ca tháng = MAX(0, ROUNDUP( Công chấm công × Ăn ca/ngày , -3 )) → làm tròn LÊN tới hàng nghìn. Mức ăn ca/ngày lấy từ 1.6 "Ăn ca". Mức theo quyết định 002.2026: 35.000 đ/ngày cho chi nhánh (tăng từ 30.000) [OCR + khớp "Ăn ca 35" × 1000 trong dự thảo T2], áp dụng khi làm >= 2 buổi/ngày [OCR].
- Trợ cấp đồng phục theo công = nếu Công chuẩn = 0 thì 0, ngược lại MIN( 150.000 , đồng phục/Công chuẩn × Tổng công , đồng phục ).
- Hỗ trợ nhà ở theo ngày công = Nhà ở / Công chuẩn × Tổng công, nhưng không vượt mức Nhà ở cao nhất đang có; công thức nguồn lấy MAX toàn bảng 1.7 làm trần (cần hỏi).
- Các trợ cấp khác trong dữ liệu 1.6 chưa đưa vào 4.1: phụ cấp trực ca, tập sự, phụ cấp khác (chưa thấy cột tính ở 4.1; chưa rõ cách tính).
- Quyết định 002.2026 [OCR]: ngừng trợ cấp điện thoại, điện/nước/internet, gửi xe/làm việc từ xa, huấn luyện, máy tính; trợ cấp làm đẹp chỉ cho khối trực tiếp ở chi nhánh, ngừng cho văn phòng. Dự thảo T2.2026 vẫn có các cột: Ăn ca, Làm đẹp, Gửi xe, Điện thoại, Máy tính, Nhà ở, Huấn luyện, Tập sự, Kiêm nhiệm; Tổng trợ cấp quy đổi tháng = Ăn ca/ngày × ngày chuẩn + Σ các khoản còn lại (đơn vị nghìn đồng).

### 4.6 Hoa hồng, dịch vụ, content, BSC
- Tổng thưởng hoa hồng + dịch vụ = Σ "Tổng cộng" của 5.3 cùng tháng/năm/nhân sự (đồng bộ từ Kinh doanh).
- 5.3 các thành phần (tên trường): Doanh số dịch vụ; Doanh số mỹ phẩm; Hoa hồng bán dịch vụ; Hoa hồng bán mỹ phẩm; Tổng hoa hồng DS cá nhân (mỹ phẩm + dịch vụ); Phí trị liệu; Trợ cấp tư vấn trực tuyến (trực đêm); Thưởng vượt + đạt doanh số cá nhân; Thưởng doanh số trưởng bộ phận; Hoa hồng TBP TV (0.3%); Hoa hồng GĐCN; Hoa hồng Ban lãnh đạo; Thưởng đạt doanh số chi nhánh - quản lý; Thưởng vượt doanh số chi nhánh >110%; Thưởng; Tổng hoa hồng thực nhận; Tổng cộng; Đơn vị; Chức danh; Ghi chú. Tỷ lệ cụ thể theo chức danh: chưa trích được (nằm trong Phụ lục 04/05 bản scan).
- Thưởng content kênh vệ tinh: nhập tay (cột riêng).
- Thưởng BSC (sheet B): = SUMIF(tab BSC theo mã nhân viên) của "Thưởng BSC thực đạt". Tab BSC: Thưởng BSC thực đạt = Tỉ lệ đạt BSC thực đạt × Quỹ thưởng BSC; Thực nhận = Thưởng BSC thực đạt (cột Thuế TNCN riêng nhập). Quyết định 002.2026 đặt BSC bằng 10% lương cơ bản với khối MSC Group (trước đó 30%) [OCR].
- Bitable chưa có cột "Thưởng BSC" trong 4.1 (có trong báo cáo 4.3 nhưng tham chiếu hỏng).

### 4.7 Tổng thu nhập Gross
- Bitable: Gross = Lương ngày công CT + Lương ngày công TV + Thưởng hiệu suất + Ăn ca tháng + Trợ cấp đồng phục + Hỗ trợ nhà ở + Cộng khác + Tổng lương OT + Tổng thưởng hoa hồng + dịch vụ + Thưởng content.
- Sheet B: Gross = R + T (thưởng hiệu suất) + V (tiền OT) + W (ăn ca) + X (đồng phục) + Y (nhà ở) + Z (hoa hồng + dịch vụ) + AA (content) + AB (BSC).

### 4.8 Bảo hiểm, giảm trừ, thuế TNCN (theo thứ tự trong bảng)
1. BHXH người lao động = Lương đóng BH × 10.5% (Lương đóng BH = Lương BHXH, chỉ khi "Đóng BH" = "Đóng BH" trong bitable; sheet B áp cho mọi dòng). BHXH công ty = Lương đóng BH × 21.5%.
2. Giảm trừ bản thân = 15.500.000 (khi có mã nhân viên). Giảm trừ người phụ thuộc = Số NPT × 6.200.000. Tổng giảm trừ = hai khoản trên.
3. Thu nhập chịu thuế = ROUND( Gross - Ăn ca - Tổng lương OT - Trợ cấp đồng phục ). Lưu ý: trừ toàn bộ tiền OT, không chỉ phần chênh lệch ngoài giờ (xem mục 7).
4. Thu nhập tính thuế = nếu Thu nhập chịu thuế < Tổng giảm trừ thì 0, ngược lại Chịu thuế - Tổng giảm trừ - BHXH NLĐ. (Kiểm thứ tự: có thể ra số âm, nên kẹp tối thiểu 0.)
5. Thuế TNCN, theo nhóm:
   - Nhân sự chính thức (có ngày lên chính thức <= cuối tháng và đóng BH): biểu luỹ tiến từng phần dạng "tính nhanh": <= 0 → 0; <= 10tr → 5%; <= 30tr → 10% - 0,5tr; <= 60tr → 20% - 3,5tr; <= 100tr → 30% - 9,5tr; > 100tr → 35% - 14,5tr (5 bậc theo biểu thuế mới: 5% / 10% / 20% / 30% / 35% với ngưỡng 10 / 30 / 60 / 100 triệu).
   - Nếu nhân sự cam kết 08 ("Cam kết 08 - TNCN" = Có) và thu nhập tính thuế <= 186.000.000 → 0.
   - Chính thức nhưng "Không đóng BH": thuế = 10% × Thu nhập chịu thuế.
   - Chưa chính thức (thử việc/hợp đồng ngắn): nếu Thu nhập chịu thuế > 5.000.000 thì 10% × Thu nhập chịu thuế, ngược lại 0. (Sheet B dùng >= 5.000.000.)
   - Có 1 ngoại lệ hard-code theo tên một nhân sự trong công thức 4.1: [1 nhân sự được hardcode ngoại lệ, cần hỏi].
   - Sheet B (cột AL): nếu Tình trạng = "CT" thì MAX(0, 5% × TNTT, 10% × TNTT - 0,5tr, 20% × TNTT - 3,5tr, 30% × TNTT - 9,5tr, 35% × TNTT - 14,5tr); ngược lại 10% × Thu nhập chịu thuế khi >= 5tr. (Sheet này cho thuế một lần cuối tháng.)
6. Thuế lần 1 / lần 2: 4.5 lưu "Số tiền thuế lần 1 đã khấu trừ" (workflow 8.17 khi lưu bảng lương). Thuế lần 2 = Thuế TNCN - Thuế lần 1. (Dùng khi lương trả hai lần.)

### 4.9 Khấu trừ và thực lĩnh
- Công đoàn / Quỹ nhân viên: số tiền cố định theo nhân sự (1.6 "Quỹ nhân viên"). Báo cáo 4.3 gọi là "Công đoàn".
- Trừ khác / tạm ứng: nhập tay (4.3 gán tên "Lỗi tuân thủ" cho tổng cột này). Sheet ADL có thêm cột "Trừ vi phạm" riêng, trừ sau cùng.
- Tổng khấu trừ (bitable) = ROUND( BHXH NLĐ + Thuế TNCN + Quỹ nhân viên + Trừ khác/tạm ứng, 0 ). Sheet B: BHXH + Thuế + Công đoàn.
- Tổng thực trả (bitable) = ROUND( Gross - Tổng khấu trừ , -3 ) → làm tròn tới hàng nghìn (sheet B: Thực lĩnh = Gross - Tổng khấu trừ, không làm tròn nghìn).
- Chia đợt chi trả (sheet B):
  - Thanh toán lương lần 1 (L1) = Thực lĩnh - (Hoa hồng+dịch vụ) - Content - BSC.
  - Thanh toán lương lần 2 = Thực lĩnh - L1 (gồm hoa hồng/dịch vụ/content/BSC).
  - Cột "Chỉ gồm hoa hồng, dịch vụ, không tính BSC" = Lần 2 - BSC.
  - Bitable: "Thanh toán lương L1" nhập tay; Thực trả còn lại = ROUND(Tổng thực trả - L1, 0).
- Tab STK: tên chủ tài khoản viết hoa không dấu bằng công thức chuẩn hoá (thay nguyên âm có dấu); STK tra bằng XLOOKUP theo mã nhân viên. Tab "Bảng tổng theo Phòng ban": tổng Thực lĩnh, L1, L2 theo phòng ban/đơn vị.
- Tab "Bảng lương dịch vụ" (cộng tác viên/bảo vệ/thời vụ): đơn giá × ngày công thực tế + thưởng khác = Tổng thu nhập; thuế TNCN = 10% nếu Tổng thu nhập >= 5.000.000 (bảng 4.2 trong bitable, cùng quy tắc); Thực nhận = Tổng thu nhập - Thuế. Có kỳ lương dạng text "MM/YYYY".

### 4.10 Lưu trữ, báo cáo, gửi phiếu lương
- Lưu trữ bảng lương (4.4): khi 4.1 tích "Lưu trữ bảng lương", sao chép các khoản (Thu nhập chức danh, Tổng công, OT, Thưởng hiệu suất, Ăn ca, Đồng phục, Nhà ở, Cộng khác, Hoa hồng+dịch vụ, BHXH NLĐ, Tổng giảm trừ, Thu nhập chịu thuế, Thu nhập tính thuế, Thuế TNCN, Tổng thực trả) thành snapshot không đổi (workflow 8.16).
- 4.3 Báo cáo lương theo tháng/phòng ban và 7.5 Cơ cấu lương {Lương chức danh, Phụ cấp, Thưởng hoa hồng+dịch vụ, Lương OT, Thưởng hiệu suất, Cộng khác} tổng hợp từ 4.1 / 4.4. 4.3 có nhiều cột tham chiếu hỏng (Lương OT, Doanh số, Thưởng BSC, Trừ đi trễ...): "chưa đọc được".
- Gửi phiếu lương: nút "Gửi thông tin lương" (có bản xem trước) và "Gửi phiếu thưởng" trên 4.1; workflow 8.15 "Gửi bảng lương". 
- Dự thảo T2.2026 (tab "Thông tin lương_LCB"): cấu trúc thang bảng lương mới theo 43 cột: mã chấm công, đơn vị, nơi làm việc, tình trạng, loại HĐ, ngày vào/kết thúc, chức năng, cấp bậc, mã chức danh, tên chức danh, mã bậc lương, "P1 - Lương cố định (Lương BH)", hệ số công việc, bậc lương, "Lương CD" (lương chức danh), trợ cấp (ăn ca, làm đẹp, gửi xe, điện thoại, máy tính, nhà ở, huấn luyện, tập sự, kiêm nhiệm), "P3 - DV trị liệu", "P3 - HQLV BSC", "P3 - hoa hồng DT", thưởng doanh số tháng, tổng lương; phần điều chỉnh từ T2/2026: Tổng lương mới = Lương CD + BSC 10% + trợ cấp cơm + trợ cấp làm đẹp + kiêm nhiệm; Lương đóng BH = P1. Tab "Tổng hợp lương MSC" có khối quỹ lương 2025 và 2026 theo (LCB, Trợ cấp, BSC 20%/15%/10%) cho MSC và AVI (số tổng thật: bỏ qua theo quy định). Tab "Tổng thu nhập": thu nhập theo tháng, Lương tháng 13 = (Tổng thu nhập 12 tháng / số tháng) / 12 × số tháng làm việc (bản dự thảo tính theo thu nhập; quyết định 002.2026 tính theo lương cơ bản: xem mục 7).

---

## 5. Chính sách thu nhập (PDF quy định trả lương thưởng, hiệu lực 01/02/2026) và các trang wiki "5. Thu nhập"

### 5.0 Trang wiki 5.x và 6.x (chỉ là trang gom thảo luận, không có quy trình chi tiết)
- 5.1 Chính sách - Thủ tục - Thẩm quyền trả thu nhập: "Cập nhật các thông tin về chính sách, quy chế áp dụng".
- 5.2 Áp dụng - Điều chỉnh thu nhập: trao đổi quyết định áp dụng lương khi Tuyển dụng, Tăng lương, Giảm lương, Lương cộng tác viên.
- 5.3 Báo cáo chi trả thu nhập: trống.
- 5.4 Chi trả thu nhập: trao đổi thanh toán Trả lương tháng, Trả thưởng quý, Trả thưởng tết, Trả lương tháng 13, Thanh toán nghỉ việc, Thanh toán cộng tác viên.
- 6, 6.1-6.4, 2 (Kế hoạch - Định biên), 3.4 (BHXH bắt buộc), 4 (Quan hệ lao động): chỉ có tiêu đề (trang rỗng hoặc danh mục con). Quy trình thật nằm trong bitable Tuyển dụng (mục 8).

### 5.1 Loại thu nhập (mục 2.1, 3.2) [OCR]
| Loại | Ký hiệu | Tính chất | Căn cứ tính | Kỳ trả |
|---|---|---|---|---|
| Lương cơ bản | Lcb | Cố định theo chức danh, trả theo ngày công thực tế; làm lương đóng bảo hiểm | Hệ số giá trị công việc (chuyên môn, cấp bậc, thu hút) × bậc lương 1-5 | Hàng tháng |
| Trợ cấp | TC | Cố định theo chức danh, theo ngày công thực tế | Phụ lục 03 danh mục trợ cấp | Hàng tháng |
| Lương hiệu quả làm việc | Lhq | Biến động theo mục tiêu/BSC/doanh số/khối lượng trị liệu; theo nhóm công việc (lãnh đạo, gián tiếp, tư vấn, trị liệu, tiếp thị, CSKH) | Phụ lục 04 | Hàng tháng |
| Thưởng | TG | Linh hoạt theo kết quả | Phụ lục 05, 06 | Xem 5.4 |
| Khấu trừ | KT | BHXH, công đoàn, quỹ phòng chống thiên tai, TNCN, hoàn tạm ứng, bồi thường vật chất, khoản khác | Phụ lục 07 | Hàng tháng / khi phát sinh |
| Khác | K | Trợ cấp bảo hiểm, bồi thường tai nạn, phép năm... | Pháp luật / thỏa thuận | Khi phát sinh |

Cơ cấu lương hiện tại trong bảng lương: Lương chức danh (ngày công) + Phụ cấp (ăn ca, đồng phục, nhà ở) + Thưởng hoa hồng/dịch vụ + OT + Thưởng hiệu suất + Cộng khác (khớp bảng 7.5).

### 5.2 Mức lương theo loại hợp đồng (mục 3.6) [OCR, công thức đọc rõ]
- Thử việc: Ltv = (Mtv × Htv) / Ntc × (Ntv + Nlt + Ncđ); Htv = 85% ("có thể áp dụng 85%", tức không bắt buộc 85% mọi trường hợp); thời hạn theo luật và thỏa thuận, có thể rút ngắn/kéo dài.
- Tập sự: Lts = (Mts × Hts) / Ntc × (Nts + Nlt + Ncđ); Hts = 85%.
- Học việc: Lhv = (Mhv × Hhv) / Ntc × (Nhv + Nlt + Ncđ); Hhv = 85%; có thể không trả lương.
- Thời vụ (<12 tháng): thỏa thuận theo khoán hoặc tháng, trả chuyển khoản; người lao động tự đóng thuế.
- Ký hiệu: Ntc ngày công tiêu chuẩn; Ntv/Nts/Nhv ngày công thực tế; Nlt ngày làm thêm ngoài công tiêu chuẩn; Ncđ ngày nghỉ vẫn hưởng lương.

### 5.3 Ngày nghỉ hưởng lương (mục 3.4.3, 7.2) [OCR]
- Phép năm: tính theo lương cơ bản. Lễ, Tết: lương cơ bản + phúc lợi khác. Việc riêng (cưới, tang...): lương cơ bản. Công ty bố trí nghỉ/huấn luyện/công tác: (lương cơ bản + lương chức danh + trợ cấp bổ sung) / công tiêu chuẩn. Ốm/thai sản: Quỹ BHXH chi.
- Ngày lễ hưởng nguyên lương: Tết Dương lịch 1, Tết Âm lịch 5, 30/4 (1), 1/5 (1), 2/9 (1), Giỗ Tổ (10/3 âm, 1). Nghỉ việc riêng: kết hôn 3 ngày, con kết hôn 1 ngày, tang bố/mẹ/vợ/chồng/con 3 ngày.

### 5.4 Thưởng và kỳ thưởng [OCR, nguồn tự mâu thuẫn nhẹ, xem mục 7]
- Hiệu quả làm việc tháng: BSC xuất sắc (>= 100%), vượt chỉ tiêu doanh số, thành tích đặc biệt (trả cùng kỳ lương).
- Thưởng theo kỳ: 2 lần/năm (30/4 và Tết Dương lịch), xét theo kết quả các tháng, doanh số/lợi nhuận, quỹ dư; điều kiện kết quả thấp nhất các tháng trong kỳ >= 80%, còn làm việc lúc xét chi, không vi phạm tuân thủ/kỷ luật, đã qua thử việc >= 1 tháng.
- Cuối năm (khi đạt 100% doanh số/lợi nhuận): Lương tháng 13 = (Lương cơ bản / 12) × số tháng làm việc; tháng lẻ >= 16 ngày làm tròn thành 1 tháng, <= 15 ngày bỏ; Thưởng xếp loại nhân viên = Quỹ thưởng / Σ điểm xếp hạng × điểm xếp hạng cá nhân, chỉ cho nhân sự có điểm BSC trung bình năm >= 80%; thưởng thâm niên = mức × số tháng (tháng tính nếu >= 20 công). Quỹ thưởng 100% khi công ty/chi nhánh đạt chỉ tiêu >= 100%, 50% khi 91-99% (chi tiết bậc: OCR có thể sai).
- Thưởng dịp: 8/3, 30/4 & 1/5, 1/6 (con NLĐ), 2/9, 20/10, Trung thu, Tết Dương lịch, sinh nhật; mức do Giám đốc quyết định theo tài chính và đánh giá. Hỗ trợ hiếu hỉ: cưới của bản thân 1.000.000; hiếu của vợ/chồng/bố mẹ 500.000; ốm nằm viện từ 3 ngày: số tiền bị OCR vỡ ("5.00.000"), cần xem trang gốc. Tri ân thôi việc: làm đủ 3 năm trở lên, quà 1.000.000.

### 5.5 Tính, duyệt, chi trả (mục 3.4.1 và Phụ lục 01) [OCR]
1. Dữ liệu đầu vào Phòng NLPT thu thập: danh sách lao động tháng; bảng chấm công có xác nhận của người lao động và quản lý; bảng tổng kết hiệu quả có chữ ký xác nhận; các quyết định/phụ lục hợp lệ về điều chỉnh/khấu trừ.
2. Phòng NLPT (Nhân lực & Phát triển) kiểm tra dữ liệu, lập bảng tính lương.
3. Trình Giám đốc (hoặc người được uỷ quyền) và Phòng TC-CU (Tài chính - Cung ứng) duyệt bảng chi.
4. Phòng TC-CU kiểm tổng chi phí lương, cảnh báo sai sót, duyệt xác nhận và làm thủ tục chuyển khoản.
5. Chuyên viên CS.QHLĐ thuộc NLPT gửi Phiếu lương (chi nhánh: Bộ phận HC-NS).
6. Người lao động ký xác nhận và phản hồi/khiếu nại trong 01 ngày làm việc kể từ khi nhận phiếu (tự khiếu nại, không nhờ người khác).
- Khiếu nại đúng: trả thiếu thì bổ sung vào kỳ sau; trả thừa thì khấu trừ kỳ sau; nếu đã nghỉ thì xử lý khi làm thủ tục nghỉ việc.
- Trả chậm: có văn bản của người có thẩm quyền nêu lý do và kế hoạch.
- Hình thức trả: chuyển khoản (hoặc tiền mặt); ngày trả trùng ngày nghỉ thì trả trước hoặc ngay ngày làm việc kế tiếp. Không nhận thay/nhận hộ.
- Nghỉ việc: chi cùng kỳ trả hoặc sau khi đủ thủ tục (biên bản bàn giao đúng quy định, hoàn tạm ứng/nghĩa vụ tài chính); lập Phiếu thanh toán nghỉ việc, TC-CU và Ban lãnh đạo duyệt.
- Khấu trừ: BHXH, công đoàn, TNCN, bồi thường vật chất, tạm ứng/vay/chi nhầm; một lần hoặc nhiều lần nếu lớn hơn 35% tổng thu nhập [OCR]. Công ty không áp dụng tạm ứng lương, trường hợp đặc biệt làm đơn trình duyệt.

### 5.6 Thẩm quyền quyết định thu nhập (mục 3.5, 2.6) [OCR, bảng vỡ]
- Giám đốc / người đại diện pháp luật: duyệt chính sách, quỹ lương, thu nhập nhóm lãnh đạo - quản lý, giảm/tăng lương theo năm, thưởng đặc cách.
- Phòng NLPT: đề xuất, thương lượng; duyệt các chức danh chuyên viên - giám sát - nhân viên chuyên trách - thừa hành (theo cơ chế lương); công bố và cập nhật thu nhập mới.
- Cấp quản lý trực tiếp / Giám đốc chi nhánh: đề xuất, góp ý, duyệt nhóm trực thuộc trong phạm vi.
- Phòng TC-CU: góp ý ngân sách và hạch toán; kiểm soát chi.
- Các sự kiện điều chỉnh thu nhập: tuyển dụng/thời vụ, học việc/tập sự, xét tăng định kỳ hằng năm vào tháng 12 (cần kết quả cả năm loại Tốt trở lên, tăng trưởng hoàn thành tháng ổn định hoặc tăng từ 9 tháng/năm, đạt tiêu chuẩn năng lực, không vi phạm tuân thủ), điều chỉnh công việc (bổ nhiệm, bãi nhiệm, kiêm nhiệm), thay đổi chính sách, thỏa thuận theo đề xuất.
- Quỹ lương: Phòng NLPT dự thảo tháng 12 cho năm sau, trình Ban lãnh đạo duyệt chậm nhất tháng 01; chi nhánh/dự án lập dự thảo cơ chế lương phối hợp NLPT.
- Thang bảng lương: 5 ngạch (lãnh đạo - chuyên gia cao cấp; quản lý - chuyên gia; chuyên viên - giám sát; nhân viên chuyên trách; nhân viên thừa hành), bậc lương 1-5, dải lương min-max. Phụ lục 02A (nhóm chức năng và tỷ lệ hệ số chia thưởng) và 02B (điểm giá trị công việc theo chức danh) có bảng hệ số: GIÁ TRỊ KHÔNG TRÍCH ở đây.

### 5.7 Bổ sung phúc lợi, đào tạo [OCR]
- Công ty trả 100% học phí đào tạo nghiệp vụ bắt buộc hoặc nâng cao theo yêu cầu chức danh (thanh toán theo hoá đơn).
- Chế độ tham quan nghỉ mát cuối năm do Giám đốc quyết định hằng năm.

---

## 6. Onboarding (HRM-ONB-01-2026-SOP và HRM-ONB-05-2025)

### 6.1 Người phụ trách (SOP)
- Phòng ban: Hành chính - Nhân sự. Vị trí thực hiện: Nhân sự Đào tạo + Trưởng bộ phận trực tiếp. Giám sát: Giám đốc Hành chính nhân sự.
- Phân quyền: nhân viên không truy cập; HCNS được sửa/theo dõi/cập nhật đào tạo thử việc; trưởng bộ phận xem báo cáo tiến độ học; Ban Giám đốc xem/sửa/cập nhật khung quy trình.

### 6.2 Các bước (7 workflow tin nhắn + 4 thao tác SOP)
1. Thông báo nhân sự thử việc mới (chào mừng) → tin chào mừng gửi trong Lark.
2. Gửi link form điền thông tin cá nhân (nút "Đã điền thông tin" → trạng thái điền form {Đã điền, Chưa điền}).
3. Gửi tài liệu: Cam kết nhân viên, Kế hoạch hội nhập, Quy định văn phòng (link nội bộ).
4. Gửi thông tin tài khoản/nền tảng đã tạo (Lark, Google, Facebook, Zalo, TikTok...).
5. Thông báo cho HCNS khi nhân sự báo cáo tiến độ đào tạo (mã khoá, tên khoá, hoàn thành hay chưa).
6. Đến hạn đánh giá 60 ngày: nhắc quản lý trực tiếp điền form đánh giá thử việc.
7. Gửi khảo sát nhân sự thử việc sau 2 tháng.
- SOP thao tác: (a) Theo dõi gửi thông tin (tài khoản Lark, form cá nhân, biên bản bàn giao, cam kết, hướng dẫn, link nội bộ); (b) Xây khung đào tạo thử việc (bảng "3.1 Khung quy trình ONB"); (c) Theo dõi nhân sự thử việc (bảng "3.2 Theo dõi ONB nhân sự"); (d) Đánh giá sau 60 ngày bằng bảng chấm điểm (bảng "3.5 Đánh giá sau 60 ngày").

### 6.3 Mốc thời gian tự tính (bitable ONB-05)
- Ngày bắt đầu thử việc, Thời gian kết thúc thử việc lấy từ 1.3 (hợp đồng): thử việc 60 ngày.
- Hạn đánh giá Mentor 30 ngày = Ngày bắt đầu + 30. Ngày thông báo làm review 60 ngày = Ngày bắt đầu + 55 (nhắc trước 5 ngày); workflow nhắc Mentor 30 ngày, Mentor 60 ngày, HCNS 60 ngày, khảo sát trải nghiệm thử việc, bài test onboarding đều chạy theo ngày của dòng 1.3.
- Trạng thái hoàn thành thử việc: so ngày kết thúc dự kiến với ngày hoàn tất thực tế ("Thiếu mốc thử việc" nếu thiếu).
- Tiến độ đánh giá Mentor 30/60 và HR 60: "Thiếu mốc hoặc tài khoản" / "Đã có bản đánh giá" / quá hạn nếu hôm nay > hạn mà chưa có.
- Đủ/thiếu thông tin hồ sơ: kiểm các trường bắt buộc (mã ứng viên, họ tên, email, SĐT, tài khoản Lark, phòng ban, vị trí, nơi làm việc, đã điền form).

### 6.4 Bảng ONB-05 (13 bảng)
- 1.1 Dữ liệu Offer từ Tuyển dụng (nguồn: bảng offer): mã ứng viên, họ tên, email, vị trí ứng tuyển, phòng ban, nơi làm việc {AVI, ADL, MSC}, ngày nhận việc, lương cố định, lương hoàn thành công việc, lương thử việc, trợ cấp cơm, offer letter, gửi thư mời, ứng viên xác nhận, Chốt {Xác nhận, Không xác nhận}.
- 1.2 Theo dõi ONB (54 trường): ngày gửi / hoàn thành form cá nhân, trạng thái điền form, link tài liệu theo phòng ban, JD, tài khoản/nền tảng, kết quả 3 bộ test, kết quả thử việc 30/60 ngày, đánh giá HR, ngày bắt đầu/kết thúc thử việc, trạng thái hoàn thành.
- 2.1 Mentor đánh giá 30 ngày: ưu điểm, điểm cần cải thiện, lời nhắn, kết quả.
- 2.2 Mentor đánh giá 60 ngày: Kết quả công việc, Năng lực, Thái độ, Mức độ phù hợp (mỗi tiêu chí thang 1-5), Điểm TB, Đề xuất {Chính thức, Gia hạn thử việc, Không tiếp nhận}; chuỗi duyệt bằng ô tích: Trưởng BNL duyệt / không duyệt; Quản lý chi nhánh duyệt / không duyệt; Giám đốc duyệt / không duyệt.
- 2.3 HR đánh giá 60 ngày: checklist {Đủ, Thiếu} (gửi đủ tài liệu, điền form đầy đủ, gửi đủ giấy tờ, hồ sơ nhân sự đầy đủ), Ký hợp đồng đúng hạn {Đúng hạn, Trễ hạn}, Bắt đầu chấm công đúng quy trình {Có, Không}, Đã cập nhật trạng thái "Onboard" {Có, Không}, Tham gia đầy đủ training {Có, Không}, Đề xuất {Ký hợp đồng, Cân nhắc gia hạn thử việc, Hủy}, Nhân sự tiếp nhận chính thức (tích).
- 2.4 Nhân sự đánh giá sau thử việc (khảo sát người thử việc).
- 2.5-2.7 Ba bộ test: Bộ 1 Quy định và Chính sách (trắc nghiệm A-D; kết quả = số câu đúng, tỷ lệ %, điểm thang 10), Bộ 2 Kỹ năng làm việc chung và sử dụng Lark, Bộ 3 Kỹ năng tư vấn bán hàng và CSKH. Nơi làm bài {AMIA Đà Lạt, Trụ sở MSC Group, Khác}.
- 3.1-3.4 bảng tra cứu liên kết sang HRM-HRIS (1.1, 1.3).
- Khung đào tạo ban đầu: bảng "Khung quy trình ONB" (3.1 trong SOP) chưa mở được ra nội dung (ảnh).

---

## 7. Tuyển dụng (bitable MSC.BNL&PT_Tuyển dụng, wiki "6. Tuyển dụng")

Chuỗi: Kế hoạch định biên → Yêu cầu tuyển dụng → Đề xuất tuyển dụng (Approval) → Đề xuất ngân sách tuyển dụng (Approval) → Kênh tuyển dụng → Hồ sơ ứng viên → Lịch phỏng vấn → Đánh giá phỏng vấn → Đề xuất offer (Approval) → Offer → Onboarding (chuyển sang ONB-05 bảng 1.1).

Bảng chính và danh mục:
- 1.1 Quản lý mục tiêu tuyển dụng (theo tuần/tháng/quý/năm), 1.2 Ngân sách - chi phí, 1.3 Kênh tuyển dụng, 1.4 Hiệu suất kênh.
- 2.1 Mô tả công việc; 2.2 Yêu cầu tuyển dụng: Trạng thái {Đang tuyển, Chưa bắt đầu, Đã hoàn thành}; Lý do {Tuyển thay thế, Tuyển trong kế hoạch định biên, Tuyển ngoài kế hoạch định biên, Mới, Thay thế}; Bộ phận đề nghị; Vị trí yêu cầu.
- 3.1 Hồ sơ ứng viên (39 trường): Tình trạng {Chưa liên hệ được, CV Fail, PV, Fail PV, Pass PV, Đã gửi offer, Từ chối offer, Đã xác nhận offer}; Nguồn {Facebook, Website, Nội bộ, TopCV, LinkedIn, VietnamWorks}; vị trí, phòng ban, giới tính.
- 3.2 Lịch phỏng vấn: kết quả {Đạt, Không đạt}; ngôn ngữ phỏng vấn; link form đánh giá. 3.5 Đánh giá ứng viên phỏng vấn.
- 3.4 Offer: nơi làm việc {AVI, ADL, MSC}, lương, trạng thái gửi/xác nhận, offer letter.
- 4.1 Đề xuất tuyển dụng (Approval): loại hình {Mới, Thay thế, Thời vụ}, vị trí, phòng ban, số lượng. 4.2 Đề xuất ngân sách (kênh {TopCV, Website, VietnamWorks}). 4.3 Đề xuất offer (mức lương VND).
- Vị trí/phòng ban tuyển dụng dùng danh mục khác với HRIS (vd "Trưởng Phòng Tiếp Thị", "Nhân Viên kinh doanh", "KTV Trị liệu", "Booking", "Thu Ngân"): cần ánh xạ khi nối sang hồ sơ.

---

## 8. Vai trò - trách nhiệm tài chính / kế toán (COS-FIN-02) và kiểm soát chi

### 8.1 Cơ cấu (hiện 3 người kế toán lõi + thủ quỹ ngoài cơ cấu)
- Kế toán trưởng; Kế toán chi kiêm Kế toán vật tư; Kế toán thu kiêm Thủ kho. Thủ quỹ nằm ngoài, làm online, có thể nhận tiền mặt, chi, giữ sổ quỹ. Thu ngân thuộc đơn vị vận hành chi nhánh, không thuộc phòng Tài chính.
- Nguyên tắc: không một người nào nắm đồng thời hai trong ba chức năng "phê duyệt/quyết định", "thực hiện/ghi nhận", "giữ tài sản" trên cùng giao dịch; khi kiêm nhiệm bắt buộc có Kế toán trưởng kiểm tra + Giám đốc xác nhận + đối soát độc lập. Kế toán trưởng không tự duyệt giao dịch do chính mình lập.

### 8.2 Ai làm gì
| Vai trò | Kết quả cần bảo đảm / việc chính / quyền |
|---|---|
| Kế toán trưởng | Số liệu tài chính-kế toán-thuế đúng hạn; kiểm soát chung, tổng hợp, thuế, giá thành, TÍNH LƯƠNG, khóa sổ, báo cáo Ban Giám đốc; duyệt chuyên môn mức 2; có quyền trả hồ sơ, yêu cầu giải trình, trình Giám đốc duyệt cuối. |
| Kế toán thu | Đối soát doanh thu với ngân hàng/POS/QR/tiền mặt/VTTECH; công nợ phải thu; xuất hóa đơn; lưu chứng từ. |
| Kế toán chi | Kiểm tra đề nghị thanh toán/tạm ứng/hoàn ứng; hạch toán chi và công nợ phải trả; duyệt nghiệp vụ mức 1. |
| Kế toán vật tư / Thủ kho | Sổ kho (nhập-xuất-tồn, lô, hạn dùng, FEFO) / hàng vật lý, giao nhận theo phiếu. |
| Thủ quỹ | Thu/chi theo chứng từ đủ phê duyệt; sổ quỹ; báo cáo tồn quỹ hằng ngày; đối chiếu sổ quỹ với kế toán hằng tháng. |
| Thu ngân chi nhánh | Thu đúng đơn/số tiền/kênh; không tự đổi giá, gói, số buổi; bàn giao tiền mặt. |

Quy tắc tiền mặt khách trả: báo ngay vào nhóm chung, ưu tiên nộp ngân hàng, bàn giao Thủ quỹ kèm phiếu thu, hoàn tất trước 09:00 sáng hôm sau.

### 8.3 Chuỗi phê duyệt chuẩn (chi tiền, mua sắm, cấp vật tư, sửa hóa đơn, ngoại lệ)
Người đề nghị (Approval + hồ sơ) → Trưởng bộ phận / Giám đốc chi nhánh xác nhận → Kế toán nghiệp vụ kiểm mức 1 → Kế toán trưởng duyệt chuyên môn mức 2 → Giám đốc duyệt cuối → Thủ quỹ / Thủ kho thực hiện → Kế toán cập nhật kết quả.
Hạn mức duyệt theo cấp (bảng TC-OPS-01 2.2, rule QT-HM-06): nhãn cấp {Kế toán nghiệp vụ, Kế toán trưởng, GĐCN, BOD, CEO}; hiện CHƯA CÓ NGƯỠNG TIỀN, ghi rõ "chờ Kế toán trưởng và BOD chốt". Không tự đặt.
Quy tắc dữ liệu bắt buộc (QT-DL-01 đến 05): có mã giao dịch + mã đơn vị AVI/ADL/MSC + mã đối tượng; có ngày phát sinh/xử lý và trạng thái; số tiền/số lượng/kênh thu-chi logic; có liên kết chứng từ (Approval, đơn hàng, phiếu, hoá đơn); truy ngược được về nguồn (VTTECH, Approval, ngân hàng). Không đạt thì chưa được đóng hồ sơ hoặc chuyển hạch toán.

### 8.4 RACI (R làm, A chịu trách nhiệm cuối, C tham vấn, I được báo)
| Luồng | Người đề nghị/Thu ngân | KT Thu | KT Chi | KT Vật tư | Thủ kho | Thủ quỹ | KTT | Giám đốc |
|---|---|---|---|---|---|---|---|---|
| Thu tiền, công nợ phải thu | R | R | | | | | A/C | I |
| Thanh toán / tạm ứng / hoàn ứng | R | | R | | | R | C | A/I |
| Xuất nhập vật tư | R | | | R | R | | C/I | A/I |
| Mua sắm | R | | R | R | R | | C/I | A/I |
| Sửa/điều chỉnh đơn hàng | R | R | | | | I | A/I | I |
| Quản lý quỹ | | C | C | | | R | A | I |
| Khóa sổ và thuế | | C | C | C | | | R | I/A |
| Báo cáo quản trị | | C | C | C | | | R/A | I |
(Dòng nào Giám đốc A/I: Giám đốc là A, có thể chỉ cần được báo ở khâu thực thi.)

### 8.5 Nhịp công việc liên quan lương
- Kế toán trưởng: hằng tháng TÍNH LƯƠNG, khóa sổ, báo cáo; hằng quý nộp tờ khai VAT, TNCN. (Quy định trả lương lại giao Phòng NLPT lập bảng lương và TC-CU kiểm/duyệt/chuyển khoản: hai tài liệu chưa khớp hoàn toàn về người tính lương, xem mục 9.)
- Uỷ quyền duyệt chỉ hợp lệ khi có văn bản/Lark ghi rõ phạm vi và thời hạn; rà quyền hệ thống tối thiểu hằng quý; khóa tài khoản người nghỉ trong tối đa 24 giờ; ngoại lệ phải có người chịu trách nhiệm, lý do, bằng chứng, người duyệt, kết quả, lưu vết trên hệ thống.
- Bitable TC-OPS: tạm ứng (3.3) có trạng thái {Đã ứng, Đang hoàn, Đã hoàn đủ, Quá hạn, Chuyển trừ lương}, tuổi nợ {Chưa đến hạn, 1-7, 8-15, 16-30, 31-60, Trên 60 ngày}; đề nghị chi (3.2) trạng thái {Chờ duyệt, Đã duyệt, Đã chi, Từ chối, Cần bổ sung chứng từ, Đã hạch toán}, kênh {Chuyển khoản, POS, QR, Ví điện tử, Tiền mặt, Thẻ}.

---

## 9. Workflow tự động trên Lark (20 cái, đều bật)

| Mã | Kích hoạt | Việc làm |
|---|---|---|
| 8.1 | Cập nhật bản ghi 1.6 | Tạo dòng hợp đồng cộng tác viên ở 1.4 |
| 8.2-8.6 | Nhắc theo ngày của dòng hợp đồng 1.3 | Gửi tin Lark có nút mở form: bài test onboarding; nhắc Mentor đánh giá 30 / 60 ngày; nhắc HCNS đánh giá 60 ngày; khảo sát trải nghiệm thử việc |
| 8.7 | Bản ghi 1.10 đạt điều kiện | Gửi tin chúc mừng điều chỉnh/bổ nhiệm cho người được điều chỉnh và cho người quản lý |
| 8.8 | Nhắc | Nhắc lịch review lương (ngày áp dụng + 1 năm - 15 ngày) |
| 8.9 | Bản ghi nhân sự | Tạo thông tin phép năm (3.3) |
| 8.10 | Hàng tháng 25 | Nhắc đăng ký lịch nghỉ tuần vào nhóm ADL và AVI |
| 8.11 | Thêm bản ghi 3.6 | Duyệt ngày nghỉ (gửi người duyệt) |
| 8.12 | Nút | Tạo danh sách nhân sự nghỉ lễ (3.8) từ 3.7 |
| 8.13 | Hàng tháng ngày 1, 06:00 | Với mọi nhân sự "Đang làm" có mã: tạo dòng 4.1 Bảng lương + dòng 2.5 tổng hợp công |
| 8.14 | Nút | Báo cáo công hằng ngày cho Giám đốc |
| 8.15 | Nút | Gửi bảng lương |
| 8.16 | Thay đổi 4.1 | Lưu snapshot sang 4.4 |
| 8.17 | Thay đổi 4.1 | Lưu thuế TNCN lần 1 sang 4.5 |
| 8.18-8.19 | Hàng tháng ngày 1, 02:00 | Tạo dòng thống kê phân nhóm hợp đồng và dashboard theo phòng ban |
| 10.8 | Hằng ngày 09:00 | Gọi HTTP báo cáo chấm công thời gian thực (BOD), lọc "Trạng thái báo cáo = Báo cáo" |

---

## 10. Áp dụng cho AMIA OS

Hiện AMIA OS đã có các bảng `nhan_vien` (id, user_id, ho_ten, dien_thoai, email, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong), `chi_nhanh` (ma, ten), `hoa_hong_ti_le` (loại dịch vụ/sản phẩm/gói thẻ, vai phục vụ/tư vấn/bán, tỉ lệ), `dong_nhan_vien` (hoa hồng theo dòng hoá đơn, vai, tỉ lệ), `cong_viec`, `de_xuat`, `so_quy`, `loai_thu_chi`. Đề xuất mở rộng, không phá bảng cũ.

### 10.1 Bảng đề xuất
1. `nhan_vien_ho_so` (1-1 với `nhan_vien`; dữ liệu nhạy cảm, RLS chặt: chỉ HCNS, Giám đốc, chính chủ): ma_nv (MSC.xxxx, tự tăng, bất biến), gioi_tinh, ngay_sinh, que_quan, quoc_tich, tinh_trang_hon_nhan, cccd (so, ngay_cap, noi_cap), ma_so_thue, so_so_bhxh, so_the_bhyt, noi_dang_ky_bhyt, dia_chi, nguoi_than_lien_he (ten, quan_he, sdt), hoc_van (truong, nganh), hinh_thuc_nhan_luong {chuyen_khoan, tien_mat}, tk_ngan_hang (ngan_hang, so_tk, chu_tk), ngay_vao_lam, ngay_len_chinh_thuc, ngay_nghi_viec, tep_dinh_kem (nda, cccd, anh).
2. `nhan_vien_dieu_kien` (lịch sử điều kiện lương, có `hieu_luc_tu`; mỗi lần điều chỉnh một dòng; hồ sơ hiện hành = dòng có hieu_luc_tu <= ngày cần xét và lớn nhất, KHÔNG phải dòng cập nhật gần nhất): nhan_vien_id, hieu_luc_tu, chuc_danh_id, phong_ban, don_vi {MSC, AVI, ADL, VAN_PHONG}, vi_tri {giam_doc, truong_phong, truong_bo_phan, nhan_vien}, tinh_trang {thu_viec, chinh_thuc, remote, cong_tac_vien}, trang_thai_lam_viec {dang_lam, da_nghi}, khung_lam_viec {van_phong, chi_nhanh, khong_cham_cong}, luong_thoa_thuan, luong_dong_bh, he_so, thu_nhap_chuc_danh, thuong_hieu_qua_cb, dong_bh {dong, khong_dong, dong_o_noi_khac}, cam_ket_08 (bool), so_nguoi_phu_thuoc, tro_cap_an_ca_ngay, tro_cap_dong_phuc, tro_cap_nha_o, tro_cap_truc_ca, tro_cap_tap_su, tro_cap_khac, quy_nhan_vien (công đoàn), ghi_chu, quyet_dinh_tep. Quy tắc: khi tra điều kiện lương của kỳ T phải lấy theo `hieu_luc_tu <= cuối kỳ T`.
3. `hop_dong_lao_dong`: nhan_vien_id, loai {thu_viec, hdld_1, hdld_2, kxd, cong_tac_vien, thoi_vu, hoc_viec, tap_su}, so_hd, tu_ngay, den_ngay (null nếu KXĐ), file, ghi_chu, trang_thai. Hằng số khuyến nghị theo nguồn: thử việc 60 ngày, L1 12 tháng, L2 24 tháng (kể từ ngày lên chính thức), sau đó KXĐ; nhắc trước 45 ngày và cảnh báo khi còn <= 7 ngày.
4. `nghi_phep_don` (đơn nghỉ/đi trễ/về sớm/ra ngoài, trạng thái duyệt) và `quy_phep_nam` (tổng phép, phép tồn, đã dùng, còn lại); `lam_them_gio` (khung giờ, số giờ, hệ số).
5. `cham_cong_ngay` (nhan_vien_id, ngay, ca1 vao/ra, ca2 vao/ra, ket_qua theo ca, cong_thuc_te, phut_tre, ghi_nhan_nghi_le, nghi_phep_nam, nghi_phep_khac, nghi_khong_luong, cong_tac, gio_tang_ca, he_so_tang_ca, trang_thai_ngay {thu_viec, chinh_thuc}, nguon): để tách công thử việc / chính thức trong cùng tháng.
6. `ky_luong` (thang, nam, ngay_cong_chuan, trang_thai: nhap → nlpt_lap → ktt_kiem → gd_duyet → chi_l1 → chi_l2 → khoa; nguoi_lap, nguoi_kiem, nguoi_duyet, thoi_diem từng bước) và `bang_luong_dong` (một dòng/nhân sự/kỳ, lưu mọi thành phần của mục 4 + snapshot điều kiện lương đã dùng); khóa kỳ thì chỉ đọc, sai sót chuyển sang kỳ sau (bổ sung/khấu trừ ở "điều chỉnh" của kỳ kế).
7. `luong_khoan_phat_sinh` (thưởng/khấu trừ/tạm ứng theo người-kỳ: loại, số tiền, căn cứ, người duyệt) thay cho cột nhập tay "Cộng khác", "Trừ khác/tạm ứng", "Trừ vi phạm", "Bổ sung công", "Nghỉ phép tính lương".
8. `hoa_hong_ky` (kết quả hoa hồng/dịch vụ/mỹ phẩm theo người-kỳ): tổng hợp từ `dong_nhan_vien` × `hoa_don` đã thanh toán; kèm các loại thưởng của 5.3 (thưởng cá nhân, TBP, GĐCN, vượt chỉ tiêu chi nhánh). Hiện `hoa_hong_ti_le` chỉ có 3 vai và 3 loại; cần thêm tỉ lệ theo chức danh/mức đạt (đang chưa rõ, xem 11).
9. `bsc_ky` (nhan_vien_id, ky, ti_le_dat, quy_thuong, thuong_thuc_dat) và `bsc_cau_hinh` (ti_le trên lương cơ bản; hiện 10% cho khối MSC Group theo QĐ 002.2026).
10. Onboarding: `onboarding_ho_so` (trạng thái form, link tài liệu, các mốc) + `onboarding_danh_gia` (loại: mentor_30, mentor_60, hr_60; điểm 1-5 cho kết quả/năng lực/thái độ/phù hợp; đề xuất {chinh_thuc, gia_han, khong_tiep_nhan}; chuỗi duyệt trưởng ban → quản lý chi nhánh → giám đốc) + `onboarding_bai_test`. Tuyển dụng: `ung_vien` (trạng thái pipeline), `de_xuat_tuyen_dung`, `offer` (liên kết sang hồ sơ khi xác nhận).

### 10.2 Công thức nên cài thành hàm DB / service (thứ tự tính)
Giữ đúng thứ tự dưới đây (Lark đang làm vậy), nhưng sửa các lỗi ở mục 11:
1. `cong_chuan(ky, don_vi)` theo quy ước đã chốt (cần chị Lâm chốt, mục 11) rồi ghi vào `ky_luong`.
2. Cộng công theo từng ngày, tách trạng thái ngày: `cong_ct`, `cong_tv`; `cong = ROUNDUP(.., 3)`.
3. `luong_ngay_cong_ct = luong_co_ban × cong_ct / cong_chuan`; `luong_ngay_cong_tv = luong_co_ban / cong_chuan × cong_tv × ty_le_tv` (ty_le_tv: cấu hình theo từng nhân sự, mặc định 85% theo quy định, 100% nếu hợp đồng ghi vậy).
4. `thuong_hieu_suat = Σ (cong/ cong_chuan × thuong_hieu_qua_cb × ty_le)` theo phần CT và TV; `% hiệu suất` chỉ để hiển thị.
5. `luong_ot = (gio_150_ct + 0,85 × gio_150_tv)/(cong_chuan×8) × thu_nhap_chuc_danh × 1,5 + (gio_100_ct + 0,85 × gio_100_tv)/(cong_chuan×8) × thu_nhap_chuc_danh × 1,0`.
6. Phụ cấp: `an_ca = ROUNDUP(cong × an_ca_ngay, -3)`; `dong_phuc = MIN(150000, dong_phuc_cap / cong_chuan × tong_cong, dong_phuc_cap)`; `nha_o = nha_o_cap / cong_chuan × tong_cong, tối đa nha_o_cap`.
7. `hoa_hong_dich_vu`, `thuong_content`, `thuong_bsc`, `cong_khac` (từ `luong_khoan_phat_sinh`).
8. `gross = lương CT + lương TV + thưởng hiệu suất + ăn ca + đồng phục + nhà ở + cộng khác + OT + hoa hồng/dịch vụ + content + BSC`.
9. `bhxh_nld = luong_dong_bh × 10,5% (nếu dong_bh = 'dong')`; `bhxh_cty = luong_dong_bh × 21,5%`.
10. `giam_tru = 15.500.000 + so_npt × 6.200.000` (hằng số lưu ở `cau_hinh`, không hard-code).
11. `thu_nhap_chiu_thue = gross - an_ca - ot - dong_phuc` (xác nhận mục 11 trước khi chốt).
12. `thu_nhap_tinh_thue = MAX(0, thu_nhap_chiu_thue - giam_tru - bhxh_nld)`.
13. `thue_tncn`: bảng bậc thuế lưu thành dữ liệu cấu hình (không viết cứng trong công thức); phân nhánh theo (chính thức + đóng BH) / (chính thức không đóng BH: 10% trên thu nhập chịu thuế) / (chưa chính thức hoặc cộng tác viên: 10% khi thu nhập từ ngưỡng 5.000.000 trở lên) / cam kết 08.
14. `tong_khau_tru = ROUND(bhxh_nld + thue + quy_nhan_vien + tru_khac_tam_ung + tru_vi_pham, 0)`; `thuc_tra = ROUND(gross - tong_khau_tru, -3)` (làm tròn nghìn theo bitable; cần chốt có làm tròn không).
15. Chi hai đợt: `L1 = thuc_tra - (hoa_hong_dich_vu + content + bsc)`; `L2 = thuc_tra - L1`; ghi nhận số đã chi để tính "còn lại".
16. Sau khoá kỳ: snapshot bất biến, phiếu lương sinh từ snapshot; khiếu nại sửa bằng dòng điều chỉnh ở kỳ kế (đúng 3.7.3 quy định).

### 10.3 Trạng thái nên dùng
- Làm việc: dang_lam / da_nghi. Tình trạng hợp đồng: thu_viec / chinh_thuc / remote / cong_tac_vien (thêm: tap_su, hoc_viec, thoi_vu theo quy định).
- Loại hợp đồng: thu_viec, hdld_1, hdld_2, kxd, cong_tac_vien, het_han (suy ra).
- Đơn từ (theo Approval Lark): dang_duyet, da_duyet, tu_choi, huy, thu_hoi.
- Kỳ lương: xem 10.1 mục 6. Chi: chua_chi, da_chi_l1, da_chi_het. Khấu trừ/tạm ứng: da_ung, dang_hoan, da_hoan, qua_han, chuyen_tru_luong.
- Ứng viên: chua_lien_he_duoc, cv_fail, phong_van, fail_pv, pass_pv, da_gui_offer, tu_choi_offer, da_xac_nhan_offer. Thử việc 60 ngày: mentor_30 chờ → mentor_60 chờ → hr_60 → quyết định {ký hợp đồng, gia hạn, không tiếp nhận}.
- Phòng ban: dùng danh mục MSC (12 giá trị); AMIA là chi nhánh/đơn vị (AVI Vinh và ADL Đà Lạt trong Lark). Với AMIA OS nên cho `chi_nhanh` ánh xạ ma ↔ {AVI, ADL, MSC}.

### 10.4 Phân quyền và tách nhiệm
- Hồ sơ nhân sự, CCCD, tài khoản, mức lương: chỉ HCNS, Giám đốc, KTT (phần lương) và chính chủ xem phần của mình; nhân viên khác không thấy (đúng SOP onboarding và nguyên tắc "bảo mật tiền lương" trong quy định).
- Kỳ lương: người lập bảng ≠ người kiểm ≠ người duyệt ≠ người chuyển khoản (maker-checker-approver); ghi lịch sử từng bước.
- Duyệt chi/tạm ứng theo mục 8.3; hạn mức tiền để trống cho tới khi KTT + BOD chốt.

---

## 11. Chưa rõ / cần hỏi chị Lâm

### 11.1 Hỏi chốt (có nhiều phiên bản trong nguồn, không chọn thay)
1. Ngày công chuẩn: ba cách khác nhau. Bitable 4.1: ngày tháng trừ ngày nghỉ hằng tuần theo công thức, tối đa 26; sheet 9.2026: cột nhập cố định 26; dự thảo T2.2026: 24 cho MSC (văn phòng), 26 cho các đơn vị khác. Quy định ghi "công bố hằng năm" nhưng chưa thấy bảng công bố; bảng 9.1 cột "Công chuẩn tương ứng" đang rỗng. Chốt cách nào cho AMIA (chi nhánh Vinh T2-T7 = 26?).
2. Lương thử việc: quy định nói mức 85% "có thể áp dụng", bitable dùng "Hệ số" riêng cho từng người, sheet dùng cột "% lương thử việc" (đang 100%). Quy ước mặc định cho AMIA?
3. Thu nhập chịu thuế đang TRỪ TOÀN BỘ tiền OT (không chỉ phần chênh lệch ngoài giờ so với giờ hành chính) và trừ ăn ca, đồng phục: có đúng ý không? Cần Kế toán trưởng xác nhận. (Luật thuế thường chỉ miễn phần chênh lệch OT; ăn ca/đồng phục có mức miễn riêng.)
4. Ngưỡng thuế 10% cho lao động chưa chính thức: ">5.000.000" (bitable 4.1) hay ">=5.000.000" (sheet 9.2026, bảng 4.2)? Cam kết 08 so ngưỡng 186.000.000 với "thu nhập tính thuế" của MỘT THÁNG: đúng ý chưa (186 triệu = 15,5 triệu × 12, có vẻ là ngưỡng cả năm)?
5. BHXH NLĐ 10,5%: bitable chỉ áp khi "Đóng BH"; sheet áp cho mọi dòng (kể cả không đóng). Quy ước? Lương đóng BH cho cộng tác viên và thử việc?
6. Lương tháng 13: quyết định 002.2026 tính theo lương cơ bản/12 × số tháng; bản dự thảo T2.2026 tính theo tổng thu nhập trung bình. Dùng cách nào? Làm tròn tháng lẻ: >=16 ngày lên 1 tháng, <=15 ngày bỏ (OCR, cần xác nhận).
7. Kỳ chi thưởng: quy định ghi ba kiểu khác nhau (2 quý/lần vào 30/4 và Tết Dương lịch; "01/01 và 01/06"; Tết Âm cho thưởng xếp loại và tháng 13). Chốt lịch.
8. Tạm ứng: quy định "công ty không áp dụng tạm ứng lương", nhưng bảng lương có cột "Trừ khác / tạm ứng" và bảng TC-OPS có trạng thái "Chuyển trừ lương". Tạm ứng lương cá nhân có được phép không, và phân biệt với tạm ứng công tác phí thế nào?
9. Ai tính lương: Quy định trả lương giao Phòng Nhân lực & Phát triển lập bảng, Tài chính - Cung ứng kiểm/duyệt chuyển khoản; COS-FIN-02 ghi Kế toán trưởng "kiêm tính lương". Trong AMIA OS ai là người lập (maker) và ai duyệt (checker)?
10. Hạn mức duyệt chi theo cấp (QT-HM-06): chưa có số. Chờ KTT + BOD chốt.
11. Tỷ lệ hoa hồng AMIA: bảng `hoa_hong_ti_le` hiện chưa có; Lark chỉ có kết quả hoa hồng đã tính ở 5.3 (đồng bộ từ Kinh doanh), tỷ lệ theo chức danh nằm trong Phụ lục 04-05 bản scan chưa đọc được. Cần bản số hoặc xem trang PDF 53-58.
12. Bảng hệ số giá trị công việc (Phụ lục 02A/02B), thang bảng lương theo bậc 1-5, mức ăn ca theo khu vực/chức danh (Phụ lục 03: có nhiều mức theo cấp lãnh đạo/quản lý và khu vực HCM/HN/Vinh): chưa trích được số; cần bản số hoặc xem trang gốc.
13. Trợ cấp phát sinh trong 1.6 chưa thấy cột tính ở 4.1 (phụ cấp trực ca, tập sự, phụ cấp khác, kiêm nhiệm): tính vào đâu, theo công hay cố định?
14. Hỗ trợ nhà ở: trần lấy "MAX toàn bảng" là cố ý hay lỗi công thức?
15. Danh mục "Văn phòng: Hà Nội, Hồ Chí Minh, Đà Nẵng" trong 9.2 chưa rõ dùng cho gì.

### 11.2 Lỗi/điểm lạ trong nguồn (đừng chép nguyên sang AMIA OS)
- Công thức Công chuẩn và Giờ chuẩn ở 2.3 so sánh với chữ tiếng Anh "Saturday/Sunday", nhưng cột "Thứ" ra tiếng Việt → luôn sai. Công thức Công chuẩn ở 4.1 thực tế đếm ngày trong tuần theo thứ của ngày 1; chưa kiểm chứng đúng với mọi tháng.
- Trường 3.3 "Cảnh báo": kiểm "=0" trước "<0" nên "Âm phép" không bao giờ hiện.
- "Nhắc sinh nhật" so ngày = 1 (không phải ngày hiện tại).
- 5.3 trường "Chi nhánh làm việc" trả về năm (sai công thức).
- Nghỉ phép tính lương nhập tay bị cộng cả vào công CT và công TV: có thể tính trùng.
- Chọn lọc bản ghi: một số tra cứu lấy dòng 1.6 "mới nhất" theo ngày cập nhật, một số không lọc "mới nhất" → có thể lấy nhầm dòng cũ. AMIA OS nên lấy theo ngày hiệu lực.
- Các trường tham chiếu hỏng (hiển thị "無効な参照です"): báo cáo 4.3 (Lương OT, Doanh số dịch vụ/mỹ phẩm, Thưởng hoa hồng, Thưởng BSC, Hoa hồng mỹ phẩm, Thưởng trị liệu, Trừ đi trễ, Tổng thu nhập) và "Phạt đi trễ" ở 2.3: chưa đọc được.
- Sai chính tả danh mục: "Đã nghĩ" (đúng: Đã nghỉ); chức danh "Nhân viên Trị liệu" lặp; "Tri liệu AVI" (đúng: Trị liệu AVI); "Quản lí".
- Biểu thuế trong công thức là 5 bậc (5% / 10% / 20% / 30% / 35%) và mức giảm trừ 15,5 triệu + 6,2 triệu/người phụ thuộc: khớp biểu thuế mới. Nên để kế toán thuế xác nhận ngày hiệu lực áp dụng và lưu thành cấu hình theo năm.
- Số liệu lấy từ OCR (cần xem lại mắt trên trang gốc trước khi chốt): 85% lương thử việc/tập sự/học việc; ngưỡng khấu trừ 35%; thời hạn khiếu nại 01 ngày làm việc; chi lương trước ngày 10; BSC >= 80%; tỉ lệ quỹ thưởng 50%/100%; làm tròn tháng 13; mức hiếu hỉ; 30.000 → 35.000 đ ăn ca; BSC 10%. Riêng 35.000 đ/ngày (khớp dự thảo T2 "Ăn ca 35") và BHXH 10,5% / 21,5% (từ công thức) đã có đối chiếu chéo.
- Dashboard "7.1 Tổng quan chấm công": chưa đọc khối.
- Whiteboard sơ đồ SOP onboarding và sơ đồ COS-FIN-02: chưa đọc được.
- Wiki 5.x, 6.x, 2, 3.4, 4: chỉ có tiêu đề; nếu có tài liệu thật thì nằm ở nơi khác (chưa tìm thấy).

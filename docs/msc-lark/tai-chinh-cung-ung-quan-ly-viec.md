# MSC Lark: Tài chính – Cung ứng – Quản lý công việc (nghiệp vụ thật, để áp dụng cho AMIA OS)

Đọc ngày 27/10/2026 bằng `lark-cli2` (tài khoản Trợ Lý CEO), CHỈ ĐỌC. Tệp này chỉ ghi cấu trúc, công thức, danh mục, trạng thái, ngưỡng duyệt. Không chép tên người, số điện thoại, số tài khoản, số tiền thật. Chỗ nào không đọc được hoặc là suy luận của người tóm tắt thì ghi rõ.

## 0. Ba điều cần biết trước

1. **Hai Base của MSC hiện là "bộ khung"**: Base Tài chính–Cung ứng có 24 bảng nhưng chỉ 5 bảng có dữ liệu (danh mục tài liệu, quy tắc, đơn vị, tài khoản kế toán, nhân sự tài chính); Base Quản lý task có 0 bản ghi ở mọi bảng công việc. Không thấy workflow/automation nào được cấu hình (lệnh liệt kê workflow trả 0 ở cả hai Base). Các "tự động" nêu trong tài liệu SOP là **yêu cầu cấu hình sau**, chưa phải đang chạy.
2. **Nguồn nghiệp vụ đáng tin nhất là bộ SOP trên Wiki (COS-FIN-xx, FIN-PROC-xx)**, không phải bảng trong Base. Khi hai nơi lệch nhau, mục 5 liệt kê rõ chỗ lệch và đề xuất lấy SOP làm chuẩn.
3. **Có mâu thuẫn về ngưỡng duyệt chi** (mục 5, mục 8): SOP nói 10 triệu, nhưng chính Base ghi "chưa có số, không tự đặt ngưỡng".

## 1. Nguồn đã đọc

| # | Tài liệu | Loại | Link | Mức đọc |
|---|---|---|---|---|
| 1 | TC-OPS-01-2026_Quản lý Tài chính - Cung ứng_MSC | Bitable | https://mscgroupvn.jp.larksuite.com/base/ORqxbZM68aE6oEsGuAjjkWv8pqe | Đủ 24 bảng + toàn bộ trường/lựa chọn; đọc bản ghi của 2.1, 2.2, 5.1, 5.2 |
| 2 | MSC.26_BTCCU.KT.QUY_Báo cáo quỹ ngày | Sheet | https://mscgroupvn.jp.larksuite.com/sheets/JIEasWF5bhZ2sutcIXkjz4qap1e | Tiêu đề 2 tầng, công thức mẫu, cấu trúc khối ngày, tab danh mục tài khoản |
| 3a | MSC_Quản lý task tất cả công ty | Bitable | https://mscgroupvn.jp.larksuite.com/base/EgKNbpQR2a9bVFsdnKsjac6kpXe | Trường/công thức bảng 2.0, 2.3, 2.9–2.12, 3.1, 3.2; liệt kê 3 dashboard |
| 3b | MSC và OMYN - Danh mục Công việc 2026 | Sheet | https://mscgroupvn.jp.larksuite.com/sheets/H1zPsYbFVhOzQLtKfVHjq9fdpJe | Đủ 3 tab |
| 4 | HƯỚNG DẪN THAO TÁC TRÊN GIAO DIỆN APP QUẢN LÝ CÔNG VIỆC — MSC GROUP | Docx/Wiki | https://mscgroupvn.jp.larksuite.com/wiki/Dompwl75dirEs3kZsJGjsmtdp4c | Đủ (ngắn) |
| 5 | COS-FIN-02_Vai trò và trách nhiệm công việc | Docx/Wiki | https://mscgroupvn.jp.larksuite.com/wiki/LWl7wobtfiFsATk60GQjp1UOpVd | Đủ |
| 6 | Danh sách máy ĐL | Sheet | https://mscgroupvn.jp.larksuite.com/sheets/M1vDs9iyzhwYCatwtXUjJwfhpWe | Chỉ cấu trúc cột |
| 7 | COS-FIN-03 (chính sách), COS-FIN-06 (KPI), COS-FIN-07 (views/automation), COS-FIN-08 (điều hành) | Wiki | tìm bằng `docs +search "COS-FIN"` (mã trong `/wiki/XsXCwR0lLidGHkkDx2cjpMfjpfh`, `/FgZxwWYFCiHuTekHV8sjsuCjpYc`, `/VKPrwjGpHiVBHektKp6jrVjXpie`, `/VBg4w7T3KitnQYkJKkij6NqKpEf`) | 03, 08 đọc kỹ; 06, 07 đọc phần KPI/automation |
| 8 | FIN-PROC-01 thanh toán, 02 tạm ứng, 03 hoàn ứng, 04 thu tiền–đối soát, 05 sửa đơn, 06 kế hoạch vật tư, 07 mua sắm, 08 xuất nhập–điều chuyển–kiểm kê, 09 hoàn tiền khách, 10 khoá sổ, 11 đối chiếu công nợ, 12 báo cáo, 14 ngân sách | Wiki | mã trang: `T430w8ieNiqYaIknZ1vje90Ypwh`, `YUokwERHniY8bmk9Xj4jRTVxpxh`, `EjuQwfjvfiquJhkBA7SjtCM6pkc`, `AJxlwBOnhi69yNkqoz1jKS8UpFd`, `PN5Uwe6HRiI88ok3PD2jkkZHphh`, `AFLWwV9QDizMJQkVXOPjxQkPpje`, `ZfK8wz4TNiPsuuk8NqujniTip8d`, `NPAAwtUY1iTkYqkLUEcjfIsNpeh`, `IaHpwIA3niRrkRkOiEajkN8gp2f`, `PdNIwjpa2ibIBWkCIQGjkDqBp1c`, `MpzqwXbRwiVWSokJSiijMuX7pAc`, `IrjKwlAAZioPsykuhTLjSyMgpbd`, `HTsOwTPFJiIziTkPANyjGPnsphd` (đều dưới `https://mscgroupvn.jp.larksuite.com/wiki/`) | Đọc kỹ phần luồng, ma trận duyệt, rulebook, trạng thái; bỏ qua blueprint trường Approval chi tiết |

**Chưa đọc được / chưa đọc kỹ**: FIN-PROC-13 (định mức giá vốn) và FIN-PROC-15 (mở/đóng chi nhánh) chỉ xem mục lục; COS-FIN-04 (danh mục PROC/SOP) và COS-FIN-05 (hệ thống file Base) chỉ lấy từ bảng 2.1; Bitable "APP_Công việc & Hiệu suất" (mã `Pe03bI9ola65BGsfOuIjXTAppBN`, được hướng dẫn nhắc tới) mở được nhưng **không có bảng nào** (app chạy trên bảng của Base task 3a); các bảng công việc 2.1–2.8 theo từng ban chỉ kiểm 2.3 (giống hệt 2.0), 6 bảng còn lại giả định cùng khuôn; chưa mở thử nội dung 3 dashboard (chỉ biết tên); chưa đọc COS-FIN-01, 04, 05 toàn văn.

---

## 2. Tài chính – Cung ứng

### 2.1 Cấu trúc Base TC-OPS-01-2026 (24 bảng)

Đánh số theo nhóm: 0.x vận hành chung, 1.x kế hoạch, 2.x chuẩn/quy tắc, 3.x giao dịch, 4.x ngoại lệ, 5.x danh mục.

| Bảng | Nội dung / trường chính (rút gọn) | Trạng thái / lựa chọn |
|---|---|---|
| 0.2 Vai trò và RACI | Đầu việc, nhóm việc (Lập đề nghị, Kiểm tra hồ sơ, Phê duyệt, Chi tiền–thu tiền, Đối soát, Hạch toán, Khoá kỳ, Báo cáo), SOP liên quan, R/A/C/I (4 cột người), tần suất, hạn xử lý, đầu ra bắt buộc, bảng ghi nhận | Đang áp dụng / Chờ xác nhận / Ngừng áp dụng |
| 0.5 Danh mục nguồn dữ liệu | Tên nguồn, loại nguồn (Lark Sheet/Base/Wiki, VTTECH, Salon Hero, Phần mềm kế toán, Ngân hàng/POS, Facebook/Pancake, Nhập tay), "là nguồn chuẩn", chu kỳ cập nhật, bẫy đã biết | Đang dùng / Chờ cấp quyền / Đã dừng |
| 0.6 KPI phòng ban | Mã KPI, nhóm (Sản lượng, Chất lượng, Hiệu suất, Tài chính, Tuân thủ, Con người), công thức, nguồn, mục tiêu, thực đạt, tỷ lệ đạt %, đơn vị đo | Đạt / Gần đạt / Không đạt / Chưa có số |
| 0.8 Lịch điều hành & nhịp báo cáo | Mã mốc, loại (Họp, Báo cáo, Nhắc việc, Đối soát, Khoá sổ, Kiểm tra), tần suất, giờ, người chủ trì, người phải nộp, đầu ra | Đang chạy / Tạm dừng / Chưa bật |
| 1.1 Ngân sách theo kỳ | Mã ngân sách, kỳ (Tháng/Quý/Năm), đơn vị, nhóm chi phí, trung tâm chi phí, ngân sách được duyệt, đã chi, còn lại, tỷ lệ sử dụng %, mã Approval | Dự thảo / Đã duyệt / Đang dùng / Đã khoá kỳ |
| 1.2 Kế hoạch dòng tiền | Từ ngày–đến ngày, tiền đầu kỳ, dự kiến thu/chi, thực thu/chi, chênh lệch, dự kiến cuối kỳ, cờ cảnh báo thiếu hụt | Chưa bắt đầu / Đang làm / Hoàn thành / Tạm dừng / Huỷ |
| 2.1 Danh mục COS-FIN và FIN-PROC | Mã tài liệu, loại (COS, PROC, SOP, FORM, Adoption Pack), miền nghiệp vụ, phạm vi, phiên bản, ngày hiệu lực, link wiki | Dự thảo / Đang hiệu lực / Đang sửa / Hết hiệu lực |
| 2.2 Hạn mức phê duyệt & quy tắc dữ liệu | Mã quy tắc, nhóm (Hạn mức chi, Hạn mức giảm giá, 5 loại Trường bắt buộc: Định danh, Thời gian, Giá trị, Chứng từ, Liên kết hệ thống), ngưỡng tiền, cấp được duyệt (Kế toán nghiệp vụ, KTT, GĐCN, BOD, CEO), kết quả khi không đạt | Đang hiệu lực / Chờ MSC xác nhận / Hết hiệu lực |
| 3.1 Phiếu thu theo kênh | Mã phiếu thu, ngày phát sinh, đơn vị, kênh thu (CK ngân hàng, POS, QR, ví, tiền mặt, thẻ), số tiền, mã đơn VTTECH, mã GD ngân hàng, người thu, người tư vấn, đã đối soát, chênh lệch, mã Approval | Mới ghi nhận / Chờ đối soát / Đã khớp / Lệch–đang xử lý / Đã hạch toán |
| 3.2 Đề nghị chi – lệnh chi | Mã đề nghị, người đề nghị, nội dung, nhóm chi phí, trung tâm chi phí, NCC, số tiền đề nghị/được duyệt, **có trong ngân sách** (checkbox), **vượt ngân sách** (số tiền), cấp duyệt (KTT/GĐCN/BOD/CEO), kênh chi, ngày chi thực tế, chứng từ, mã Approval | Chờ duyệt / Đã duyệt / Đã chi / Từ chối / Cần bổ sung chứng từ / Đã hạch toán |
| 3.3 Tạm ứng – hoàn ứng | Mã tạm ứng, người nhận, mục đích, số tạm ứng, đã hoàn, còn phải hoàn, hạn hoàn ứng, số ngày quá hạn, tuổi nợ (Chưa đến hạn, 1-7, 8-15, 16-30, 31-60, >60 ngày), chứng từ quyết toán | Đã ứng / Đang hoàn / Đã hoàn đủ / Quá hạn / Chuyển trừ lương |
| 3.4 Công nợ phải thu (AR) | Kỳ, khách, mã đơn/thoả thuận, số dư đầu/cuối kỳ, tăng/giảm trong kỳ, ngày đến hạn, ngày quá hạn, nhóm tuổi nợ (6 nhóm như trên), cờ tranh chấp, người tư vấn, người phụ trách thu, hành động, bằng chứng xác nhận | Trong hạn / Quá hạn–đang nhắc / Đã cam kết trả / Tranh chấp / Đã thu đủ / Đề xuất xử lý |
| 3.5 Công nợ phải trả (AP) | Kỳ, NCC, số dư đầu/cuối kỳ, tăng/giảm, ngày đến hạn, lịch thanh toán, trả trước chưa có hoá đơn, hạn cần nhận hoá đơn, ngày gửi đối chiếu NCC, hạn NCC phản hồi, chênh lệch | Trạng thái: Trong hạn / Đến hạn trả / Quá hạn / Đã trả đủ / Đang đối chiếu. Kết quả đối chiếu: Chưa gửi / Đã gửi–chờ phản hồi / Khớp / Lệch / Quá hạn phản hồi. (AP có nhóm tuổi nợ trong Base nhưng SOP nói AP KHÔNG chia nhóm tuổi nợ, xem mục 5) |
| 3.6 Đối soát dòng tiền | Ngày, đơn vị, kênh, tài khoản/thiết bị, số theo hệ thống nguồn / theo ngân hàng–POS, chênh lệch, số GD khớp/lệch, nguyên nhân lệch (Ghi nhận chậm, Phí giao dịch, Thu hộ–chi hộ, Nhập sai số tiền, Trùng giao dịch, Chưa rõ), hạn xử lý | Khớp / Đang xử lý lệch / Đã xử lý / Chuyển kỳ sau |
| 3.7 Nhập xuất tồn vật tư (tham chiếu VTTECH) | Ngày, kho, mã VTTECH, tên vật tư, nhóm (Đầu tay máy, Kim–vật tư tiêu hao, Mỹ phẩm điều trị, Sản phẩm bán lẻ, Văn phòng, Khác), lô, hạn dùng, tồn đầu, nhập, xuất, tồn cuối, tồn kiểm thực tế, chênh lệch, cờ tồn thấp, cờ sắp hết hạn | Khớp / Lệch–đang xử lý / Đã xử lý. Chỉ có 2 kho (Vinh, Đà Lạt), xem mục 5 |
| 3.8 Hoá đơn điện tử | Số hoá đơn, ngày, loại (bán ra/mua vào), MST, đối tượng, giá trị trước thuế, thuế GTGT, tổng, kỳ kê khai, đã kê khai, mã đơn/đề nghị chi, lý do thay thế–điều chỉnh | Đã phát hành / Đã thay thế / Đã điều chỉnh / Đã huỷ / Chờ phát hành |
| 3.9 Nhật ký kiểm soát và khoá kỳ | Mã kỳ, phân hệ (Thu, Chi, Vật tư–kho, AR, AP, Thuế–hoá đơn, Hạch toán, Tổng hợp), người khoá, thời điểm khoá, vấn đề phát sinh khi khoá, quyết định (Ghi nhận vào kỳ sau, Mở lại kỳ, Điều chỉnh trong kỳ, Chưa quyết) | Kỳ: Mở / Đang rà soát / Đã khoá / Mở lại |
| 4.1 Đề nghị mở lại kỳ | Mã kỳ cần mở lại, phân hệ, lý do, dữ liệu trước/sau điều chỉnh, số tiền ảnh hưởng, mức độ ảnh hưởng (Cao–ảnh hưởng báo cáo đã phát hành / Trung bình / Thấp), người đề nghị / kiểm tra / xác nhận, phiên bản báo cáo phát hành lại | Chờ duyệt / Đã duyệt / Từ chối / Cần bổ sung |
| 4.2 Đề xuất điều chỉnh dữ liệu | Bảng/mã bản ghi cần sửa, giá trị hiện tại/đề xuất, loại lỗi (Thiếu dữ liệu, Trùng bản ghi, Sai logic, Sai nguồn, Khác), số tiền ảnh hưởng, cấp duyệt (KTT/GĐCN/BOD), Data Owner, cờ "đã sửa" | Chờ duyệt / Đã duyệt / Từ chối / Cần bổ sung |
| 5.1 Option đơn vị | Mã (AVI Vinh, ADL Đà Lạt, MSC Tổng công ty/Vận hành Hà Nội), loại (Chi nhánh, Tổng công ty, Phòng vận hành), **cờ là kho vật tư** (Hà Nội = không), Data Owner | Đã chốt / Chờ quyết định |
| 5.2 Option tài khoản kế toán | Số hiệu TK, tên, nhóm (Phải thu, Phải trả, Tạm ứng, Doanh thu, Chi phí, Tiền, Vật tư–tài sản, Thuế, Khác), nguồn chuẩn (Phần mềm kế toán, Base quản lý hồ sơ, Chờ quyết định). Mới có 4 TK: phải thu khách (131), phải thu khác (138), tạm ứng (141), phải trả người bán (331), cả 4 đang "Chờ MSC xác nhận" | Đã chốt / Chờ MSC xác nhận / Chờ quyết định |
| 5.3 Option nhóm chi phí | Tên nhóm, mã, trung tâm chi phí, tài khoản hạch toán, loại (Chi phí trực tiếp, Chi phí bán hàng, Chi phí quản lý, Chi phí tài chính, Đầu tư) | Đã chốt / Chờ quyết định nơi quản lý. Chưa có bản ghi |
| 5.4 Option nhà cung cấp | Mã NCC, tên, MST, người liên hệ, nhóm hàng (Thiết bị máy, Đầu tay–vật tư máy, Mỹ phẩm điều trị, Sản phẩm bán lẻ, Dịch vụ marketing, Văn phòng–khác), **hạn công nợ (ngày)**, điều khoản thanh toán, đang hợp tác. Chưa có bản ghi | Đã chốt / Chờ quyết định hệ thống chủ |
| 5.5 Nhân sự tài chính và phân quyền | Chức danh (Kế toán trưởng, Kế toán nghiệp vụ, Kế toán vật tư, Kế toán thu, Thu ngân, Thủ kho, Thủ quỹ, Giám đốc chi nhánh, BOD), đơn vị, **miền dữ liệu phụ trách** (Thu, Chi, Vật tư–kho, AR, AP, Thuế–hoá đơn, Hạch toán, Báo cáo, Khoá kỳ), cờ Data Owner, **hạn mức duyệt chi (đ)** trên từng người | Đang làm việc (checkbox) |

**Quy tắc dữ liệu đang có hiệu lực trong 2.2** (nguyên văn rút gọn, hiệu lực từ 01/10/2026): QT-DL-01 giao dịch phải có mã giao dịch + mã đơn vị AVI/ADL/MSC + mã đối tượng từ nguồn chuẩn, nếu không thì chưa đưa vào đối soát/báo cáo chính thức; QT-DL-02 phải có ngày phát sinh, ngày cần xử lý, trạng thái, thời điểm cập nhật; QT-DL-03 số tiền/số lượng/đơn vị/kênh/loại nghiệp vụ phải hợp logic, nếu không thì không cho đóng hồ sơ hay sang hạch toán; QT-DL-04 phải có liên kết tới Approval/đơn/phiếu/hoá đơn/bằng chứng, nếu không thì trả hồ sơ hoặc chờ bổ sung; QT-DL-05 truy ngược được về VTTECH, Approval, ngân hàng, phần mềm kế toán, nếu không thì đánh dấu chưa khớp và không cho đóng.

### 2.2 Mã dùng chung và nguồn dữ liệu chuẩn (COS-FIN-03 mục 2.6)

- Đơn vị: **AVI** (Vinh), **ADL** (Đà Lạt), **MSC** (Tổng công ty/Phòng vận hành Hà Nội). Dùng cùng mã trên Approval, Base, báo cáo.
- Khách hàng, dịch vụ, vật tư, kho lấy từ **VTTECH** (nguồn đơn hàng/doanh thu/kho). Tiền thực nhận lấy từ ngân hàng/POS/QR/sổ quỹ. Hạch toán, thuế, báo cáo pháp lý lấy từ **phần mềm kế toán**. Lark Base chỉ là lớp trạng thái, đối soát, báo cáo.
- Mã chứng từ do hệ thống sinh, không đặt tay. Không dùng file cá nhân làm nguồn số liệu chính. Mã đã có nguồn chuẩn không được nhập tay lại.

### 2.3 Vai trò, maker-checker, kiểm soát chung

Vai trò theo chức năng, không theo tên: Kế toán trưởng (KTT), Kế toán thu, Kế toán chi, Kế toán vật tư, Thủ kho, Thủ quỹ, Thu ngân/nhân sự thu tại chi nhánh, Giám đốc chi nhánh, Giám đốc Công ty. Cơ cấu thật chỉ 3 người kế toán cốt lõi (1 KTT; 1 người kiêm Kế toán chi + vật tư; 1 người kiêm Kế toán thu + Thủ kho) nên SOP đặt **kiểm soát bù trừ**.

Quy tắc kiểm soát (gom từ COS-FIN-02, COS-FIN-03, các FIN-PROC):

1. **Bất kiêm nhiệm 3 chức năng**: không ai nắm từ hai trong ba chức năng (quyết định/phê duyệt, thực hiện/ghi nhận, giữ tiền/tài sản/hàng) trên cùng một giao dịch. Nếu bắt buộc kiêm nhiệm: KTT kiểm tra + Giám đốc xác nhận + bằng chứng đối soát độc lập.
2. **Không tự duyệt cái mình lập**, kể cả KTT (khi KTT lập hoặc ghi nhận thì Giám đốc hoặc người độc lập được chỉ định duyệt).
3. **Chuỗi tách bước** trong thanh toán: duyệt hồ sơ, xếp lịch thanh toán, lập lệnh/xuất quỹ, đóng hồ sơ là bốn bước riêng, "không người nào tự hoàn tất toàn bộ chuỗi". Xếp lịch **không phải** bước duyệt lại.
4. Kế toán vật tư giữ chứng từ/sổ kho nhưng **không** giữ hàng; Thủ kho giữ hàng nhưng **không** lập/duyệt/điều chỉnh chứng từ, **không được biết giá nhập kho**. Đối chiếu sổ với thực tế cần xác nhận của cả hai.
5. **Không chứng từ, không thanh toán**; không hợp thức hoá bằng thoả thuận miệng; không thu ngoài hệ thống; không nhập/xuất/chuyển kho thiếu phiếu; **không chia nhỏ giao dịch để né cấp duyệt**; không mua trước rồi xin duyệt (nếu đã xảy ra thì ghi thành case vi phạm/ngoại lệ cho Giám đốc quyết định, không tự hợp thức).
6. **Không xoá cứng** chứng từ đã phát sinh, chỉ huỷ/vô hiệu hoá và giữ lịch sử. Mọi sửa đổi dữ liệu tài chính ghi: người sửa, thời điểm, giá trị trước/sau, lý do bắt buộc. Báo cáo nhật ký chỉnh sửa bất thường gửi KTT hằng tuần.
7. Thay đổi trọng yếu sau khi đã duyệt (số tiền, người thụ hưởng, tài khoản, mục đích) **phải quay lại đúng cấp đã duyệt**; mọi sửa phải có comment và audit trail.
8. Uỷ quyền duyệt chỉ có hiệu lực khi có văn bản/Lark ghi rõ phạm vi và thời hạn; không mặc định chuyển quyền. Rà soát quyền hệ thống tối thiểu hằng quý; khoá tài khoản người nghỉ việc trong tối đa 24 giờ.
9. Phân quyền dữ liệu theo phạm vi: giám đốc chi nhánh chỉ thấy dữ liệu chi nhánh mình.
10. Đối chiếu chéo bắt buộc với nguồn độc lập: doanh thu kế toán với số ca thực hiện bên chuyên môn; xuất vật tư với hồ sơ dùng vật tư theo khách/ca; hoa hồng với chấm công; chi phí marketing với số liệu nền tảng quảng cáo; công nợ NCC với đơn đã duyệt và giao nhận; quỹ chi nhánh với camera/biên bản kiểm quỹ.
11. Kiểm soát tại chi nhánh không có KTT: chụp/tải chứng từ gốc trong 04 giờ làm việc; chứng từ giấy gửi theo lô ngày 25 hằng tháng; camera quầy thu ngân và kho lưu tối thiểu 30 ngày; kiểm kê quỹ/kho đột xuất có người độc lập (có thể qua video call); **quỹ vận hành chi nhánh bằng 0 vào cuối ngày**.
12. Red flag phải báo ngay KTT: chênh lệch tiền, giao dịch không xác định, nộp tiền mặt chậm, chi trước phê duyệt, chứng từ trùng/sai, tạm ứng quá hạn, thiếu/thừa/sai lô kho, hàng cận hạn, mua vượt nhu cầu/ngân sách, dùng file cá nhân, sai lệch giữa các hệ thống.

### 2.4 Các loại chứng từ (Approval) và vòng đời trạng thái

Mã Approval do Lark tự sinh. Tên mã nội bộ trong SOP:

| Mã | Chứng từ | Trạng thái chuẩn (SOP) |
|---|---|---|
| MSC-ĐNTT | Đề nghị thanh toán (cả hoàn trả chi phí nhân viên đã tự chi) | Chờ QL đơn vị xác nhận → KT chi kiểm tra → Chờ KTT → Chờ Giám đốc (nếu ≥10 triệu) → Đã duyệt–Chờ xếp lịch chi → Đã xếp lịch chi → Đã chi–Chờ kế toán đóng hồ sơ → Đã hoàn tất. Nhánh: Chờ bổ sung chứng từ, Từ chối |
| MSC-ĐNTU | Đề nghị tạm ứng (dự toán nhiều dòng) | …cùng chuỗi duyệt/xếp lịch → Đã chi–Chờ hoàn ứng. Nhánh: Chờ bổ sung chứng từ, Quá hạn hoàn ứng, Từ chối |
| MSC-ĐNHU | Đề nghị hoàn ứng (1 tạm ứng ↔ đúng 1 hoàn ứng) | …Chờ Giám đốc (nếu phải chi thêm ≥10 triệu) → Chờ xử lý chênh lệch → Đã chi/thu–Chờ kế toán đóng hồ sơ → Đã hoàn tất. Nhánh: Chờ bổ sung chứng từ, Quá hạn hoàn ứng, Từ chối |
| MSC-KHSDVT | Kế hoạch sử dụng vật tư (theo chi nhánh × bộ phận × tháng) | Nháp → Chờ GĐCN → KT vật tư tổng hợp → KT chi kiểm ngân sách → KTT → Giám đốc → Đã duyệt. Nhánh: Chờ bổ sung, Chờ giải trình vượt ngân sách, Từ chối, Hủy |
| MSC-ĐNMH | Đề nghị mua hàng (vật tư/mỹ phẩm và CCDC/máy móc/TSCĐ) | Chờ kiểm tra → Chờ duyệt → Đã duyệt/Chờ đặt hàng → Đang giao → Đã nhận → Chờ chứng từ/công nợ → Hoàn tất. Nhánh: Chờ bổ sung, Chờ giải trình vượt ngân sách, Chờ xử lý chênh lệch, Từ chối, Hủy |
| MSC-ĐNXK | Đề nghị xuất kho/cấp/điều chuyển vật tư | Chờ duyệt → Chờ cấp → Đang điều chuyển → Chờ xác nhận nhận → Hoàn tất. Nhánh: Chờ bổ sung, Chờ giải trình vượt ngân sách, Chờ xử lý chênh lệch, Từ chối, Hủy. Thêm trạng thái riêng cho xuất khẩn cấp: **Đã xuất khẩn–Chờ hậu kiểm** |
| MSC-XLVT | Xử lý vật tư (chênh lệch kiểm kê, trả NCC, huỷ hàng, điều chỉnh tồn) | Chờ xác minh → Chờ KTT → Chờ Giám đốc → Chờ thực hiện → Chờ cập nhật tồn → Hoàn tất. Nhánh: Chờ bổ sung, Chờ xử lý chênh lệch, Từ chối, Hủy |
| MSC-ĐCHĐ | Điều chỉnh đơn hàng (không chi tiền) | Nháp → Chờ GĐ chi nhánh → KT thu kiểm tra → Chờ KTT (nếu trọng yếu) → Chờ Giám đốc (nếu trọng yếu) → Đã duyệt–Chờ thực hiện → Chờ đồng bộ → Hoàn tất. Nhánh: Chờ bổ sung, Chờ xác minh khách, Chờ đối soát, Chuyển FIN-PROC-09, Từ chối, Hủy |
| MSC-HTKH (MSC-HC) | Hoàn trả khách hàng | Nháp → Chờ GĐ chi nhánh → KT thu đối soát → KT chi kiểm tra → KTT kiểm tra → Chờ Giám đốc Công ty → Chờ hoàn tiền → Chờ cập nhật hệ thống → Hoàn tất. Nhánh: Chờ bổ sung, Chờ xác minh người nhận, Chờ đối soát, Chờ xử lý hoá đơn/đơn hàng, Từ chối, Hủy |
| Đơn thu (VTTECH) | Đơn/khoản thu | Đã tạo đơn → Chờ thanh toán → Đã thu–Chờ đối soát → Đã đối soát → Đã hoàn tất. Nhánh: Chờ định danh, Chờ xác minh chênh lệch, Chờ xử lý hoàn/hủy, Từ chối |
| Kỳ khoá sổ | Kỳ kế toán tháng | Chuẩn bị → Đang thu thập → Đang đối chiếu → Chờ KTT rà soát → Đã khoá → Đã phát hành báo cáo. Nhánh: Chờ bổ sung, Chờ xử lý ngoại lệ, Chờ xác nhận Giám đốc, Mở lại kỳ |
| Đối chiếu công nợ | AR | Chưa đối chiếu → Chờ xác minh → Đã xác nhận/Đang thu hồi → Đã xử lý. Nhánh: Tiền chờ định danh, Đang tranh chấp, Chờ quyết định, Có chênh lệch |
| Đối chiếu công nợ | AP | Chưa đối chiếu → Đã đối chiếu nội bộ → Chờ NCC xác nhận → Hoàn tất. Nhánh: Có chênh lệch, Trả trước NCC, Hoá đơn chưa về, Hoá đơn chưa về quá hạn, NCC không phản hồi |

Cách đọc hai tầng trạng thái: trạng thái **chính** là một chuỗi tuyến tính theo cấp duyệt; trạng thái **nhánh** (Chờ bổ sung, Từ chối, Hủy, Chờ giải trình vượt ngân sách, Chờ xử lý chênh lệch) là rẽ ra khỏi chuỗi rồi quay lại cùng hồ sơ (bổ sung trên chính hồ sơ để giữ audit trail).

### 2.5 Ngưỡng và hạn mức duyệt

Nguồn: COS-FIN-03 mục 2.7 + FIN-PROC-01/02/03/07/08/09. Hạn mức xác định theo **tổng giá trị của một nhu cầu**, không được chia nhỏ.

| Nghiệp vụ | Điều kiện | Chuỗi duyệt | Duyệt cuối |
|---|---|---|---|
| Thanh toán, tạm ứng | < 10 triệu | QL đơn vị → KT chi → KTT | KTT |
| Thanh toán, tạm ứng | ≥ 10 triệu | QL đơn vị → KT chi → KTT → Giám đốc | Giám đốc Công ty |
| Hoàn ứng | Phần công ty phải trả thêm: < 10 triệu / ≥ 10 triệu | như trên, tính theo phần chênh lệch | KTT / Giám đốc Công ty |
| Mua sắm | Mọi đề nghị mua và ngoại lệ báo giá (không có bậc 10 triệu) | KT chi → KTT → Giám đốc | Giám đốc Công ty |
| Cấp vật tư | Trong kế hoạch đã duyệt | KT vật tư → KTT | KTT |
| Cấp/điều chỉnh vật tư | Vượt kế hoạch, vượt định mức, huỷ, ghi giảm, ngoại lệ trọng yếu | GĐ chi nhánh cam kết → KT vật tư kiểm khả năng điều chuyển → KTT → Giám đốc | Giám đốc Công ty |
| Điều chỉnh đơn hàng | Thông thường | GĐ chi nhánh duyệt, KT thu thực hiện, KTT và Giám đốc nhận thông tin | GĐ chi nhánh |
| Điều chỉnh đơn hàng | Trọng yếu (ảnh hưởng tiền, doanh thu, hoá đơn, quyền lợi khách) | KTT kiểm tra | Giám đốc Công ty |
| Hoàn tiền khách | **Mọi khoản, không phân biệt giá trị** | GĐ chi nhánh → KT thu đối soát → KT chi → KTT | Giám đốc Công ty |
| Ngân sách vượt | Mọi khoản vượt | KTT kiểm nguồn bù | Giám đốc Công ty. Điều chuyển ngân sách trong cùng phòng/chi nhánh: KTT kiểm tra; khác chi nhánh hoặc khác nhóm chi phí: Giám đốc Công ty |
| Mở lại kỳ | Mọi lần | KT viên đề nghị → KTT kiểm tra, mở kỳ | Giám đốc xác nhận nếu giao dịch do KTT lập hoặc ảnh hưởng trọng yếu |

Các ngưỡng và hạn thời gian khác (đều là quy tắc, không phải số liệu thật):

| Hạng mục | Quy định |
|---|---|
| Hồ sơ thanh toán thông thường | Gửi trước ngày cần chi tối thiểu **03 ngày làm việc**; Approval cảnh báo gửi muộn |
| SLA mỗi cấp duyệt và bước kiểm tra KT chi | Tối đa **01 ngày làm việc** |
| Nhắc | Nhắc trước ngày cần chi 01 ngày; hồ sơ cần bổ sung nhắc sau 02 ngày, **không tự đóng** (KT chi quyết định đóng hay từ chối) |
| Chi gấp | Chỉ khi ảnh hưởng trực tiếp vận hành phòng khám/khách/an toàn tài sản/nghĩa vụ pháp lý; vẫn phải duyệt trước; hồ sơ thiếu bổ sung trong 03 ngày làm việc; QL đơn vị xác nhận tính gấp, Giám đốc duyệt ngoại lệ |
| Nhân viên tự chi trước | Hạn chế; chỉ cấp bách, đã có phê duyệt chủ trương, **dưới 2 triệu** |
| Tạm ứng | Chỉ dùng khi chưa xác định chính xác chi phí; không cấp mới khi khoản cũ chưa đóng (ngoại lệ: KTT kiểm tra, Giám đốc duyệt); hạn hoàn ứng **tối đa 03 ngày làm việc** sau ngày hoàn thành công việc; nhắc trước hạn 02 ngày, đúng hạn, hằng ngày khi quá hạn; công việc bị huỷ phải hoàn toàn bộ trong **01 ngày làm việc**; **đối trừ lương chỉ khi có chính sách chính thức, chưa áp dụng mặc định** |
| Báo giá khi mua | NCC đã duyệt mua định kỳ: 1 báo giá hiện hành + đối chiếu giá hợp đồng/lần mua gần nhất; NCC mới, máy móc, CCDC, TSCĐ: tối thiểu **2** báo giá; đơn **trên 20 đến 30 triệu**: tối thiểu **2** báo giá; đơn **trên 30 triệu**: tối thiểu **3** báo giá kèm bảng so sánh và lý do chọn; trên 20 triệu mà không đủ báo giá: giải trình và Giám đốc duyệt ngoại lệ **trước khi mua** |
| Đánh giá NCC | 12 tháng/lần theo giá, chất lượng, giao đúng hạn, hồ sơ/hoá đơn, phản hồi lỗi, bảo hành; KTT kiểm tra, Giám đốc duyệt danh sách NCC tiếp tục dùng |
| Hoàn tiền khách | SLA kiểm tra mỗi cấp 01 ngày; chi hoàn tối đa **03 ngày làm việc** sau khi Giám đốc duyệt và hồ sơ đầy đủ; không có chính sách hoàn mặc định (cọc, trả trước, thẻ liệu trình chưa dùng không tự động được hoàn); ưu tiên hoàn về đúng tài khoản/phương thức đã chuyển |
| Hàng nhập còn hạn dưới **90 ngày** | Chỉ nhập khi có phê duyệt ngoại lệ (KTT kiểm tra, Giám đốc duyệt) và kế hoạch sử dụng rõ |
| Cảnh báo hạn dùng | 90 ngày: bắt đầu cảnh báo; 60 ngày: yêu cầu ưu tiên dùng/điều chuyển; 30 ngày: khẩn, bắt buộc phương án xử lý |
| Ngân sách khả dụng | = ngân sách được duyệt − thực chi − khoản đã duyệt chưa chi − đơn đặt hàng đã cam kết. Khoản chờ duyệt hiển thị riêng. Vượt ngân sách thì hồ sơ sang **Chờ giải trình vượt ngân sách**, chưa được mua/cấp/chi cho đến khi duyệt ngoại lệ. **Không** có cảnh báo sớm ở mức 80% |
| Đối chiếu công nợ NCC | Số dư cuối kỳ **từ 5 triệu/NCC**: đối chiếu nội bộ và gửi xác nhận NCC **hằng tháng**; dưới 5 triệu, trả trước, hoặc phát sinh nhưng cuối kỳ bằng 0: nội bộ hằng tháng, gửi NCC hằng quý và bắt buộc cuối năm |

### 2.6 Phân loại thu / chi (và danh mục nhóm)

Phân loại thu, chi chi tiết nằm ở sheet Báo cáo quỹ ngày (mục 3). Trong Base:

- **Kênh thu/chi** (3.1, 3.2, 3.6): Chuyển khoản ngân hàng, POS, QR, Ví điện tử, Tiền mặt, Thẻ.
- **Nhóm chi phí** (5.3): Chi phí trực tiếp, bán hàng, quản lý, tài chính, Đầu tư; mỗi nhóm có trung tâm chi phí và tài khoản hạch toán.
- **Nhóm hàng cung cấp** (5.4) và **nhóm vật tư** (3.7): xem bảng trên.
- **Doanh thu** tách riêng: dịch vụ (đặt cọc, trả trước, thẻ liệu trình, buổi lẻ) và mỹ phẩm (kho Tư vấn); mỹ phẩm báo cáo tách khỏi dịch vụ, tách theo chi nhánh.
- **CAPEX và OPEX quản lý riêng**: máy móc, CCDC/TSCĐ có kế hoạch đầu tư riêng (ngưỡng phân loại CCDC/TSCĐ còn "chờ quyết định").
- Ngân sách và chi phí quản lý **theo chi nhánh**; hiện không có nhóm chi dùng chung toàn công ty. Lập theo cơ sở dòng tiền, dùng giá chưa gồm VAT được khấu trừ.

### 2.7 Quy trình mua hàng → nhận hàng → thanh toán (FIN-PROC-06/07/08/01)

1. **Kế hoạch** (FIN-PROC-06): kế hoạch kinh doanh và kế hoạch tài chính tháng sau có trước **ngày 25**; mỗi Trưởng bộ phận Tư vấn/Trị liệu lập **một** MSC-KHSDVT cho từng chi nhánh × tháng (không gộp nhiều chi nhánh/tháng); KT vật tư tổng hợp và kiểm tồn 5 kho; KT chi so với ngân sách; KTT kiểm; Giám đốc duyệt **trước ngày làm việc cuối tháng trước**. Phần vượt ngân sách: thứ tự xử lý là giảm/giãn nhu cầu → điều chuyển giữa 5 kho → tái phân bổ ngân sách → xin bổ sung ngân sách.
2. **Đề nghị mua** (FIN-PROC-07): bắt buộc liên kết kế hoạch sử dụng + kế hoạch kinh doanh + kế hoạch tài chính đã duyệt; KT vật tư kiểm tồn và khả năng điều chuyển trước khi mua mới; lập MSC-ĐNMH kèm báo giá/bảng so sánh/hợp đồng/tiêu chuẩn kỹ thuật; KT chi kiểm ngân sách–công nợ → KTT → Giám đốc. **Chỉ sau "Đã duyệt/Chờ đặt hàng" mới được cam kết hay phát hành đơn đặt hàng.**
3. **Hai nhánh mua**: vật tư/mỹ phẩm do KT vật tư phụ trách mua; CCDC/máy móc/TSCĐ do Giám đốc hoặc người được giao. Người đặt hàng **không đồng thời là người duy nhất nhận và nghiệm thu**.
4. **Nhận hàng**: Thủ kho kiểm đếm; vật tư kiểm mã, số lượng, lô, hạn dùng, bao bì, bảo quản; tài sản kiểm model, serial, phụ kiện, vận hành, bảo hành và ký nghiệm thu. Hàng sai/thiếu/hỏng: dừng nhập chính thức phần lệch, lập biên bản, không thanh toán phần chưa chấp nhận.
5. **Thanh toán/công nợ**: KT chi ghi nhận hoá đơn và công nợ hợp lệ; thanh toán trước/đặt cọc/mua công nợ dẫn chiếu quy trình thanh toán (mục 2.4, MSC-ĐNTT/ĐNTU).
6. **Đóng đơn** chỉ khi đối chiếu đủ **6 nhóm hồ sơ**: đề nghị mua, báo giá/hợp đồng/đơn đặt hàng, giao hàng, phiếu nhập hoặc nghiệm thu, hoá đơn, thanh toán/công nợ; không còn chênh lệch hàng, chứng từ, hoá đơn, công nợ. Hồ sơ tài sản tối thiểu: mã tài sản, tên, model/serial, nguyên giá, vị trí, người quản lý, hạn bảo hành, biên bản bàn giao/nghiệm thu, lịch bảo trì.
7. **Mua gấp/hết hàng khẩn**: kiểm điều chuyển giữa 5 kho trước; chỉ mua tại chỗ khi Giám đốc Công ty duyệt **bằng văn bản trước**; phiếu kho + ảnh giao nhận bổ sung trong 24 giờ; hoá đơn/chứng từ tài chính bổ sung tối đa 03 ngày làm việc.

### 2.8 Kho: nhập, xuất, điều chuyển, kiểm kê, điều chỉnh tồn (FIN-PROC-08, COS-FIN-03)

- **5 kho đúng**: Kho Tổng (cấp công ty); Kho Trị liệu và Kho Tư vấn tại Vinh; Kho Trị liệu và Kho Tư vấn tại Đà Lạt. Kho Tư vấn đồng thời là kho mỹ phẩm; không có kho mỹ phẩm thứ sáu; Hà Nội không có kho vật tư.
- **FEFO** cho hàng có hạn dùng (lô hạn gần xuất trước); FIFO chỉ cho hàng không quản lý hạn. Theo dõi đủ: mã, số lượng, đơn vị tính, lô, hạn dùng, đơn giá/giá trị lô, tình trạng, kho. Không dùng/bán hàng hết hạn, hỏng, mất tem nhãn.
- **Không cấp/xuất nếu chưa có MSC-ĐNXK hoặc chứng từ nguồn đủ duyệt**. Ngoại lệ duy nhất: cấp cứu y tế thực sự (xem dưới).
- Phiếu kho lập trên VTTECH bởi KT vật tư, **in 2 liên**, Thủ kho kiểm đếm và ký cùng người giao/nhận, giữ 1 liên, trả KT vật tư 1 liên; cập nhật trong ngày.
- Luồng theo nghiệp vụ: nhập mua (đối chiếu đơn mua + giao hàng → phiếu nhập → Thủ kho thực nhập); xuất sử dụng (ĐNXK đã duyệt → phiếu xuất theo FEFO → người nhận ký); điều chuyển (phiếu điều chuyển → Đang điều chuyển → **kho nhận kiểm đếm và xác nhận tối đa 24 giờ** thì mới ghi tăng kho nhận); nhập trả Kho Tổng (hàng không đạt chuyển khu cách ly và MSC-XLVT); trả NCC (MSC-XLVT, KTT + Giám đốc duyệt, KT chi xác nhận giảm/cấn trừ công nợ); huỷ hàng (cách ly và khoá lô, hội đồng huỷ tối thiểu Thủ kho + KT vật tư + đại diện quản lý/KTT, biên bản và ảnh, Giám đốc duyệt trước khi huỷ/ghi giảm).
- **Hạn gửi ĐNXK**: Trưởng bộ phận gửi trước **ngày 02** hằng tháng hoặc trước ngày khoá do KT vật tư thông báo.
- **Chênh lệch giao nhận** (thiếu, sai lô, hỏng, quá hạn xác nhận): phản hồi trong 01 ngày làm việc, chuyển Chờ xử lý chênh lệch, không đóng giao dịch.
- **Xuất khẩn cấp tại chỗ (chỉ cấp cứu y tế thực sự)**: Quản lý/Giám đốc chi nhánh quyết định, lập ngay Phiếu xuất khẩn cấp (chi nhánh, thời điểm, khách/ca điều trị, lý do lâm sàng, kho, mã hàng, số lượng, lô, hạn, người đề nghị–giao–nhận) → trạng thái "Đã xuất khẩn–Chờ hậu kiểm" → KT vật tư cập nhật VTTECH và hoàn thiện hồ sơ trong **24 giờ** → KTT hậu kiểm → vượt thẩm quyền hoặc nghi lạm dụng thì trình Giám đốc. Quá 24 giờ cảnh báo KTT và vào KPI tuân thủ. **Không** áp dụng cho mua tại chỗ, thiếu hàng do chủ quan, hay nhu cầu gấp thông thường.
- **Kiểm kê**: toàn bộ 5 kho **hằng tháng** (ngày cuối tháng) và đột xuất khi có chênh lệch/nghi thất thoát/yêu cầu quản lý. Quy trình: KT vật tư chốt danh sách tồn sổ và thông báo giờ khoá số → tạm dừng nhập/xuất (nếu bắt buộc phát sinh thì ghi riêng) → Thủ kho + KT vật tư cùng đếm, ghi số thực, lô, hạn, tình trạng, ký biên bản → đối chiếu VTTECH, lập MSC-XLVT cho chênh lệch cần điều chỉnh → KTT kiểm tra → Giám đốc duyệt → **chỉ cập nhật sổ sau khi duyệt**. Kiểm kê đột xuất/hàng giá trị cao/nghi thất thoát phải có thêm người độc lập do KTT hoặc Giám đốc chỉ định. Nghi thất thoát: dừng điều chỉnh, bảo toàn bằng chứng, báo ngay KTT/Giám đốc.
- **Điều chỉnh tồn** chỉ qua MSC-XLVT đã duyệt; Thủ kho không điều chỉnh giá trị tồn.

### 2.9 Thu tiền, đối soát, công nợ

- **Thu**: chỉ thu khi đã có đơn trên VTTECH; Nhân viên tư vấn **không trực tiếp nhận tiền**; Thu ngân nhận tiền, xác nhận kênh, phát hành phiếu thu. Tiền mặt: đếm trước mặt khách, in phiếu 2 liên, khách ký; báo ngay vào nhóm chung; ưu tiên nộp ngân hàng, chưa nộp được thì bàn giao Thủ quỹ kèm chứng từ; **hoàn tất trước 09:00 sáng hôm sau**. Thu ngân chốt ca ngay khi hết ca. Hồ sơ khách bắt buộc: họ tên, ngày sinh, số điện thoại (CCCD/địa chỉ chỉ khi xuất hoá đơn). Thu trả trước/thẻ liệu trình phải ghi số đã thu, đã dùng, còn lại, mã gói, tổng số buổi, ngày bắt đầu–hết hạn; không tự đổi gói hay tăng giảm buổi. Voucher: chưa có nghiệp vụ, chưa áp dụng.
- **Đối soát** hằng ngày theo mã đơn, khách, chi nhánh, số tiền, thời gian, kênh. POS/QR/ví ghi theo số khách trả, phí ghi riêng. Chỉ chốt doanh thu vận hành khi xác nhận được tiền thực nhận. Chênh lệch: Thu ngân/Tư vấn phản hồi trong ngày, KT thu xử lý trong 01 ngày làm việc, quá hạn báo KTT và GĐ chi nhánh. Không tự sửa khi chưa có bằng chứng; giữ dữ liệu gốc.
- **Tiền chờ định danh** (chuyển khoản chưa biết đơn/khách): theo dõi riêng, **chưa được ghi công nợ khách hàng**.
- **AR**: nhóm tuổi nợ 6 bậc kèm owner: chưa đến hạn (theo dõi); 1-7 ngày (Tư vấn nhắc); 8-15 (Trưởng bộ phận tham gia); 16-30 (GĐ chi nhánh cam kết phương án); 31-60 (KTT kiểm soát); >60 (Giám đốc quyết định thu hồi/dự phòng). Khiếu nại hoặc đề nghị giảm/hoàn chuyển trạng thái "Đang tranh chấp", **không tự xoá/giảm AR**. Tuổi nợ tính từ ngày kế tiếp ngày đến hạn.
- **AP**: **không** chia nhóm tuổi nợ, theo dõi theo ngày đến hạn và lịch thanh toán. Biên bản xác nhận gửi NCC trong 02 ngày làm việc sau khi chốt AP (D+6 đến D+7), NCC phản hồi trong 03 ngày làm việc, không phản hồi thì lưu bằng chứng và leo thang KTT. Khoản trả trước/hoá đơn chưa về phải có NCC, số tiền, mục đích, hạn hoá đơn, owner; quá hạn hoá đơn thì "Hoá đơn chưa về quá hạn" và chưa được đóng hồ sơ/AP.
- **Hoá đơn bán ra**: sửa, điều chỉnh, thay thế chỉ khi có lý do và chứng từ; KT thu kiểm tra, KTT kiểm tra chuyên môn, Giám đốc duyệt cuối; sau đó đồng bộ phần mềm hoá đơn, VTTECH, Base, phần mềm kế toán.

### 2.10 Khoá sổ và chốt kỳ (FIN-PROC-10, COS-FIN-03)

Quy ước: D = ngày cuối tháng; D+n = ngày làm việc thứ n của tháng sau. Phần mềm kế toán là nơi khoá kỳ chính thức; VTTECH và Base chốt snapshot nghiệp vụ.

| Mốc | Phải hoàn tất | Owner |
|---|---|---|
| D | Kiểm kê vật lý, khoá phát sinh kho tháng | Thủ kho, KT vật tư |
| D+1 | Doanh thu, tiền thực nhận, ngân hàng, quỹ | KT thu; Thủ quỹ xác nhận quỹ |
| D+2 | AR sơ bộ, tiền chờ định danh, tạm ứng; phiếu kho + đối chiếu VTTECH + giải trình chênh lệch | KT thu, KT chi, KT vật tư |
| D+4 | Xác minh AR với Tư vấn/chi nhánh | KT thu kiểm soát |
| D+5 trước 12:00 | Chốt AR tháng; chi phí, AP, lương/hoa hồng, CCDC/TSCĐ, phân bổ, khấu hao, giá thành | Các owner; KTT tổng hợp lương; Giám đốc hoặc người độc lập xác nhận bảng lương |
| D+6 cuối ngày | Rà điều kiện, chốt ngoại lệ, **khoá kỳ** | KTT |
| D+7 | **Phát hành báo cáo quản trị** | KTT phát hành; Giám đốc nhận |

Checklist trước khi khoá: doanh thu khớp VTTECH/phiếu thu/dòng tiền; ngân hàng và quỹ đối chiếu có người xác nhận độc lập với người ghi sổ; AR/AP khớp sổ chi tiết và sổ cái; kiểm kê xong, phiếu kho chốt D+2; chi phí–hoá đơn–tạm ứng–CCDC/TSCĐ ghi đúng kỳ; lương/hoa hồng có đầu vào nhân sự và xác nhận độc lập; **không có thay đổi dữ liệu nào thiếu audit log**.

Chứng từ muộn: ghi vào kỳ sau **hoặc** mở lại kỳ, tuỳ ảnh hưởng thuế/doanh thu/lợi nhuận/tiền/công nợ/tính trọng yếu; kế toán viên không tự quyết. Hồ sơ mở lại kỳ lưu: lý do, dữ liệu trước/sau, người thực hiện, người xác nhận, phiên bản báo cáo phát hành lại; KTT khoá lại, phát hành lại và thông báo phiên bản cũ hết hiệu lực. Ngoại lệ không được tự điều chỉnh để "ép khoá"; mọi ngoại lệ có owner, hạn xử lý, cấp quyết định.

### 2.11 Nhịp báo cáo / điều hành tài chính (COS-FIN-08, PROC-12, COS-FIN-07)

- **Hằng ngày**: Thu ngân chốt đơn–phiếu–kênh–tiền mặt; KT thu đối soát và gửi **báo cáo doanh thu ngày trước 09:00** ngày làm việc kế tiếp; KT chi rà hồ sơ/lịch thanh toán/tạm ứng; KT vật tư cập nhật phiếu kho trong ngày; Thủ quỹ ghi sổ quỹ và báo tồn quỹ; KTT xem cảnh báo, giao owner.
- **Hằng tuần**: chốt công nợ + tồn kho tuần trước trước **12:00 thứ Hai**, KTT phát hành report pack trước **17:00 cùng ngày** (Giám đốc, KTT, GĐ chi nhánh theo phạm vi).
- **Hằng tháng**: D+5/D+6/D+7 như trên; họp kế toán tháng do KTT chủ trì (KT thu, chi, vật tư bắt buộc), biên bản ghi quyết định/owner/hạn/ưu tiên/trạng thái.
- **Hằng quý**: rà soát trong cuộc họp tháng cuối quý (ngân sách, xu hướng chi phí, công nợ, tồn kho, CCDC/TSCĐ, hiệu quả NCC, KPI, sai lệch lặp lại); forecast quý trong tháng cuối quý; ngân sách năm: BGĐ giao mục tiêu trước 01/11, đơn vị gửi kế hoạch trước 30/11, duyệt trước 31/12; dòng tiền cuốn chiếu 13 tuần + 12 tháng.
- Báo cáo tháng: P&L, tỷ lệ chi phí/doanh thu, doanh thu–chi phí từng dịch vụ, AR, AP, tồn kho, dòng tiền, ngân sách so thực tế. Số liệu tạm cần KTT phê duyệt (Giám đốc xác nhận nếu trọng yếu). Sửa báo cáo đã phát hành: đề xuất bằng email, KT nghiệp vụ giải trình, KTT quyết hoặc trình Giám đốc, phát hành phiên bản mới ghi rõ thay đổi, thông báo lại mọi người nhận, **không sửa âm thầm**.
- Chế độ kế toán áp dụng: Thông tư 133/2016/TT-BTC, năm dương lịch, VNĐ.
- **12 automation đặc tả (AUT-FIN-01…12)**, chưa cấu hình: (01) thu chưa đối soát sau 09:00 hôm sau; (02) hồ sơ thanh toán còn 1 ngày làm việc tới ngày cần chi; (03) quá ngày cần chi chưa hoàn tất; (04) thiếu chứng từ/thông tin bắt buộc; (05) tạm ứng sắp/đến/quá hạn hoàn ứng; (06) vật tư còn 90/60/30 ngày tới hạn dùng; (07) tồn ≤ mức tối thiểu theo mã–kho–thời kỳ; (08) chi không có ngân sách; (09) thực chi + chờ duyệt vượt ngân sách (không cảnh báo 80%); (10) đến lịch kiểm kê cuối tháng; (11) giao dịch tiền mặt/lệch thu tiền báo vào nhóm chung; (12) ngoại lệ nghiêm trọng/quá SLA thì leo thang KTT + Giám đốc. Giai đoạn đầu dùng thông báo Lark và nhóm chat, chưa tự tạo task.
- **KPI (COS-FIN-06)** có 3 trạng thái: Kiểm soát bắt buộc, Theo dõi cải tiến, Chờ áp dụng chính thức; chỉ dùng đánh giá cá nhân khi có đủ tên–mục đích–công thức–nguồn–tần suất–owner–người xác nhận–ngưỡng–hành động và đã có **baseline 03 tháng liên tục**; kỳ không phát sinh ghi `N/A`, không mặc định đạt 100%. Mục tiêu định lượng do KTT đề xuất, Giám đốc duyệt (chưa có số).

### 2.12 Ma trận RACI trọng yếu (COS-FIN-02)

R = làm, A = quyết định cuối, C = góp ý trước khi làm, I = được báo sau. Cột: Người đề nghị/Thu ngân · KT thu · KT chi · KT vật tư · Thủ kho · Thủ quỹ · KTT · Giám đốc.

| Luồng | Đề nghị/Thu ngân | KT thu | KT chi | KT vật tư | Thủ kho | Thủ quỹ | KTT | GĐ |
|---|---|---|---|---|---|---|---|---|
| Thu tiền và công nợ phải thu | R | R | | | | | A/C | I |
| Thanh toán/tạm ứng/hoàn ứng | R | | R | | | R | C | A/I |
| Xuất nhập vật tư | R | | | R | R | | C/I | A/I |
| Mua sắm | R | | R | R | R | | C/I | A/I |
| Đề xuất và cấp vật tư cho chi nhánh | R | | | R | R | | C/I | A/I |
| Sửa/điều chỉnh đơn hàng | R | R | | | | I | A/I | I |
| Quản lý quỹ | | C | C | | | R | A | I |
| Khoá sổ và thuế | | C | C | C | | | R | I/A |
| Báo cáo quản trị | | C | C | C | | | R/A | I |

(Cột GĐ của hàng "Sửa/điều chỉnh đơn hàng" là I trong RACI nhưng SOP FIN-PROC-05 nói hồ sơ trọng yếu do Giám đốc duyệt cuối. Xem mục 5.)

---

## 3. Báo cáo quỹ ngày (Sheet MSC.26_BTCCU.KT.QUY)

**Cấu trúc tệp**: mỗi tháng một tab (`T3.26`, `T4.26`, `T5.26`, `T6.26`, `T7.26`; tab T3 đang ẩn) + tab `Sheet2` là danh mục tài khoản. Hàng 1 là nhóm cột, hàng 2 là tên cột, khoá 2 hàng + 2 cột.

**Khối ngày**: mỗi ngày là một khối **6 hàng** (mỗi hàng một tài khoản ngân hàng/quỹ của một đơn vị) + 1 hàng `TỔNG CỘNG` (công thức SUM 6 hàng) + 1 hàng trống. Danh sách tài khoản **thay đổi trong tháng** (đầu tháng có tài khoản chi nhánh AVI, ADL, MSC, hai tài khoản chuyên thu của Đà Lạt và MSC Group, một tài khoản đơn vị 22ME; cuối tháng thêm tài khoản "CTY" thay cho một tài khoản khác), nên khối ngày không cố định theo tên tài khoản. Số tài khoản không chép ở đây.

**Cột** (A→AZ):

| Cột | Nhóm | Tên cột |
|---|---|---|
| A, B | | Ngày báo cáo · Tài khoản Quỹ |
| C–F | Thu từ khách | Thu ngân nộp · Khách quẹt thẻ · Khách chuyển khoản · **Thu từ khách** (tổng) |
| G–L | Thu nội bộ | Thu phí quản lý · Hoàn tạm ứng · Hoàn chi thừa · BHXH/lương/thuế người gửi · Ký quỹ · **Thu nội bộ** (tổng) |
| M–O | Thu từ đối tác/NCC | Hoàn phí trả thừa · Khác · **Thu từ đối tác/NCC** (tổng) |
| P–V | Thu tài chính | Lãi ngân hàng · Lãi cho vay · Lãi thẻ tín dụng · Góp vốn · Vay nợ · Thu tài chính khác · **Thu tài chính** (tổng) |
| W | | **Tổng thu** |
| X–AB | Chi cho khách | Hoàn phí dịch vụ/mua hàng · Bồi thường · Quà tặng · Chi cho khách khác · **Chi cho khách** (tổng) |
| AC–AJ | Chi đối tác/NCC | Phí dịch vụ ngân hàng · Đặt cọc dịch vụ/mua hàng · Trả phí + nợ dịch vụ/mua hàng · Mua máy CNC · Nộp phí BHXH · Nộp thuế · Tạm ứng/thanh toán chạy quảng cáo · **Chi cho đối tác NCC** (tổng) |
| AK–AU | Chi nội bộ | Nhân công–Lương · Hoàn ký quỹ đồng phục · Tạm ứng công tác phí · Tạm ứng hành chính–CSVC · Tạm ứng DV&TNKH · Tạm ứng Tiếp thị · Tạm ứng thưởng nhóm KD · Tạm ứng mua hàng–Trị liệu · Chi nội bộ khác · Hoàn trả phí Công đoàn · **Chi nội bộ** (tổng) |
| AV | | **Tổng chi** |
| AW–AY | Tồn quỹ | Dư đầu kỳ (hôm trước) · Dư chưa rõ lý do · **TỒN QUỸ CUỐI NGÀY** |
| AZ | Ghi chú | Ghi chú tự do (thường là việc chờ duyệt chi, ghi chú tài khoản) |

**Công thức** (đã đọc trực tiếp):

- Thu từ khách `F = C + D + E`; Thu nội bộ `L = G + H + I + J + K`; Thu đối tác `O = M + N`; Thu tài chính `V = P + Q + R + S + T + U`.
- `Tổng thu W = F + L + O + V`.
- Chi cho khách `AB = X + Y + Z + AA`; Chi đối tác `AJ = AC + AD + AE + AF + AG + AH + AI`; Chi nội bộ `AU = AK + AL + AM + AN + AO + AP + AQ + AR + AS + AT`.
- `Tổng chi AV = AB + AJ + AU`.
- **`Tồn cuối AY = AW + AX + W − AV`** (dư đầu kỳ + dư chưa rõ lý do + tổng thu − tổng chi).
- **`Dư đầu kỳ AW`** = tồn cuối của **ngày trước, cùng hàng tài khoản**. Ngày đầu tháng lấy chéo tab từ hàng cuối của tab tháng trước (dạng `='Tháng trước'!AY…`).
- `Dư chưa rõ lý do AX` thường để trống, là ô nhập tay.
- Hàng `TỔNG CỘNG` = SUM theo cột của 6 hàng tài khoản trong ngày.
- **Các ô đầu vào (C, D, E, các cột chi chi tiết…) là tổng nhập tay dạng `=a+b+c`** hoặc số gõ trực tiếp, không có liên kết tới phiếu thu/chi.

**Về "đối chiếu tiền mặt/ngân hàng"**: sheet không có công thức đối chiếu riêng. Cột "Thu ngân nộp" là phần tiền mặt thu ngân nộp vào quỹ/ngân hàng; "Khách quẹt thẻ" và "Khách chuyển khoản" là hai kênh còn lại. Việc đối chiếu với sao kê ngân hàng/POS do KT thu làm ngoài sheet (xem 2.9, bảng 3.6). Không có cột "tiền mặt tại quỹ" riêng; Thủ quỹ có nhiệm vụ riêng báo tồn quỹ và đối chiếu sổ quỹ với kế toán hằng tháng.

**Nhận xét cho việc dựng lại**:

- Phân loại thu/chi 2 tầng (nhóm → khoản) khớp với `loai_thu_chi` của AMIA OS nếu thêm cột nhóm cha. Danh sách khoản thu/chi trong sheet là danh mục **mở, đã tự mọc thêm** (ví dụ cột "Mua máy CNC" là một khoản chi riêng lẻ dưới nhóm đối tác), nên AMIA OS nên cho quản trị tự thêm khoản chứ không hard-code.
- "Dư chưa rõ lý do" nên coi là **ngoại lệ phải giải trình và có người duyệt**, không phải ô điều chỉnh tự do (tinh thần "không tự điều chỉnh để ép khớp" của SOP khoá sổ).
- Đầu vào nhập tay `=a+b+c` nên thay bằng tổng tự động từ phiếu thu/chi (phiếu đã có người lập, người duyệt, tài khoản, nhóm).
- Danh mục tài khoản thay đổi theo thời gian: cần bảng tài khoản quỹ có ngày bắt đầu/kết thúc hiệu lực.

---

## 4. Quản lý công việc

### 4.1 Giao diện app theo hướng dẫn (đọc từ tài liệu số 4)

Ứng dụng tên "APP_Công việc & Hiệu suất", trang thao tác "QUẢN LÝ CÔNG VIỆC", áp dụng toàn bộ nhân sự và cấp quản lý MSC Group. Bao gồm hai giai đoạn: (1) nhân sự **tự lên kế hoạch và tạo task**; (2) **báo cáo kết quả** khi xong để hệ thống ghi nhận hiệu suất.

**Menu trái (3 mục theo cấp)**: *Tổng quan điều hành* (Ban Giám đốc: biểu đồ chỉ số toàn công ty) · *Quản lý Phòng ban* (Trưởng bộ phận theo dõi nhân sự phòng mình) · *Quản lý công việc* (nơi làm việc hằng ngày của từng nhân sự). Tương ứng 3 dashboard trong Base: 1.1 Dashboard CEO–BGĐ, 1.2 Dashboard Quản lý Phòng ban, 1.3 Trang chủ Nhân viên.

**Bộ lọc (4 thanh chọn)**: Nhân viên · Phòng ban · Thời gian (tuần này, tháng này, khoảng chỉ định) · Tiến độ (trễ hạn, cần ưu tiên).

**Hai tab hiển thị**: *Kế hoạch công việc* (lưới, nhập nhiều dòng) và *Kanban* (thẻ theo trạng thái, kéo thả từ "Chưa bắt đầu" sang "Hoàn thành").

**Tạo task**: nút `+ Add Record` ở thanh công cụ hoặc dấu `+` ở dòng cuối. Bắt buộc điền: **Đầu mục công việc** (tên việc, ví dụ họp giao ban, gọi tư vấn chốt lịch, trực fanpage), **Phòng ban**, **Deadline** ("lưu ý sống còn": không có Deadline thì không tính được đúng hạn/trễ hạn và task không được tính KPI chuẩn), **Bắt đầu** và **Định mức thời gian** (số giờ dự kiến). Hệ thống tự sinh: STT; **Mã công việc** dạng tiền tố công ty + ngày + số thứ tự trong ngày (ví dụ `MSC2026100201`, không sửa được); Nhân sự thực hiện (lấy theo tài khoản Lark người tạo); **Trạng thái ban đầu "Chưa bắt đầu"**.

**Báo cáo hoàn thành (2 bước)**: (1) đổi Trạng thái sang *Hoàn thành* (hoặc kéo thẻ Kanban); (2) **bắt buộc nộp minh chứng**: tệp ở cột *Kết quả* (ảnh nghiệm thu, ảnh chụp tin chốt khách, hợp đồng, phiếu bàn giao…) **hoặc** tóm tắt chữ ở *Mô tả kết quả* (hoặc cả hai). Khi đủ hai bước, *Ngày hoàn thành* tự nhảy giờ thực tế (khoá nhập tay), và *Tình trạng CV* tự so với Deadline: nộp đúng/trước hạn → "Hoàn thành (đúng hạn)"; sau hạn → "Hoàn thành (muộn)". **Nếu đổi sang Hoàn thành mà để trống cả hai ô kết quả thì Ngày hoàn thành không nhảy** và Tình trạng CV bị tính là "Trễ hạn" hoặc "Hoàn thành (chưa nhập ngày)".

**13 cột người dùng thấy**: STT · Mã công việc · Nhân sự thực hiện · Phòng ban · Đầu mục công việc · Định mức thời gian · Bắt đầu · Deadline · Trạng thái (hướng dẫn chỉ nêu Chưa bắt đầu / Hoàn thành / Hủy bỏ) · Ngày hoàn thành · Kết quả · Mô tả kết quả · Tình trạng CV.

**Lưu ý kiểm chứng**: quy tắc "Ngày hoàn thành tự nhảy" là hành vi theo mô tả hướng dẫn; qua lệnh đọc **không thấy workflow/automation nào được cấu hình trong Base**, nên chưa xác nhận được cơ chế thật (có thể là nút/quy tắc cấp app hoặc chưa bật).

### 4.2 Bảng công việc trong Base "MSC_Quản lý task tất cả công ty"

Cấu trúc thư mục Base: 1 Dashboard (3 trang) · 2 Quản lý task phát sinh · 2A Dữ liệu công việc (bảng 2.0 toàn công ty + 2.1 đến 2.8 theo ban/phòng) · 2B Đánh giá công việc (2.9 đến 2.12) · 3 Master data & Lookup (3.1 thời gian, 3.2 nhân sự) · 4 Workflow (thư mục rỗng).

Mỗi ban/phòng có bảng riêng: Ban Giám đốc · Ban Nhân lực & Phát triển · Ban Tài chính & Cung ứng · Ban Tiếp thị · Ban Kinh doanh · Phòng Sale & CRM · Phòng Trị liệu–Chuyên môn · Phòng Dịch vụ khách hàng. Bảng 2.0 (toàn công ty) và 2.3 (đã kiểm) cùng 56 trường.

**Trường công việc (56) chia nhóm**:

- Định danh và thời gian: STT, Số TT, **Mã công việc** (tự đánh số), Đầu mục công việc, Nhân sự thực hiện (người), Hỗ trợ/Liên quan (người), Người tạo, Phòng ban (lookup từ danh mục nhân sự), Bắt đầu, **Deadline**, Định mức thời gian, Ngày hoàn thành, Ngày báo cáo, Ngày duyệt.
- **Trạng thái** (4 lựa chọn): Chưa bắt đầu · Đang làm · Hoàn thành · Hủy bỏ.
- **Trạng thái duyệt** (5): Chờ duyệt · Làm lại · Đã nộp lại · TP đã duyệt · Đã báo BGĐ; kèm *Trưởng phòng duyệt* (tra từ quản lý trực tiếp của nhân sự), *Nhận xét trưởng phòng*, *Nhận xét duyệt*, cờ *Đã báo BGĐ*.
- Kết quả: *Kết quả* (tệp), *Mô tả kết quả*, *Link kết quả*, *Hình ảnh xác thực*, *Kết quả trong ngày*, *Việc tồn / vướng mắc*, *Mã phiếu nguồn* (liên kết chứng từ gốc).
- **Vai trò báo cáo** (8): Marketing · Sales/Tư vấn · Telesales · Trị liệu · CSKH/Thu ngân · Kế toán · Hành chính nhân sự · Ban Giám đốc. Từ đó các **trường số liệu theo vai trò** (suy luận gán vai trò từ tên trường): Số bài/ấn phẩm (Marketing); Số lịch hẹn, Số khách chốt, Doanh thu (Sales/Tư vấn); Số cuộc gọi, Số cuộc kết nối, Kết quả cuộc gọi, Số lịch hẹn (Telesales); Số khách điều trị, Số buổi hoàn thành (Trị liệu); Số khách đón tiếp, Số bill xuất, Tổng thu trong ngày (CSKH/Thu ngân); Tồn quỹ cuối ngày, Tổng chi trong ngày, Số phiếu chi/ĐNTT xử lý, Công nợ thu được, Đối soát doanh thu CN (Đã khớp/Có chênh lệch/Chưa đối soát), Báo cáo tháng KT (Báo cáo quỹ tháng, Doanh thu CN Vinh, Doanh thu CN Đà Lạt, Thống kê chi phí phòng ban, Thống kê khoản mục chi, Theo dõi công nợ, Thuế, Kiểm kê kho, Kế hoạch tài chính, Xếp lịch duyệt chi) (Kế toán).
- Cột tính: **Tình trạng CV**, Tiến độ %, Tuần/Năm, Tháng/Năm, Năm tạo, Tháng tạo, Số ngày trễ/sớm, Số ngày hoàn thành task, Họ và tên, TK Lark NV, Phòng ban.

**Công thức đã đọc**:

- **Tình trạng CV** (theo thứ tự ưu tiên): Hủy bỏ → "Hủy bỏ"; Thất bại → "Thất bại"; Hoàn thành → (không có Ngày hoàn thành → "Hoàn thành (chưa nhập ngày)"; không có Deadline → "Hoàn thành (chưa có hạn)"; Ngày hoàn thành > Deadline → "Hoàn thành (muộn)"; ngược lại "Hoàn thành (đúng hạn)"); còn lại → không có Deadline → "Chưa có hạn"; Deadline trước hôm nay (so theo ngày) → "Trễ hạn"; Deadline là hôm nay → "Đến hạn hôm nay"; sau hôm nay → "Còn hạn".
- **Tiến độ %**: 0 nếu Thất bại/Hủy bỏ hoặc Mô tả kết quả rỗng; ngược lại 0,4 (0,3 + 0,1 vì đã có mô tả) cộng 0,6 nếu Hoàn thành hoặc 0,5 nếu "Chờ duyệt", ngược lại cộng 0.
- Số ngày trễ/sớm = Ngày hoàn thành − Deadline; Số ngày hoàn thành task = Ngày hoàn thành − Bắt đầu; Tuần/Năm = số tuần ISO của Deadline.

**Mức ưu tiên** (4: Làm ngay · Cao · Trung bình · Thấp) và *Kiểm tra đúng hạn* (Đúng hạn/Trễ hạn) nằm ở bảng 3.1 Lookup thời gian (cùng danh mục ngày/tuần/tháng/quý/năm); bảng công việc chính **không có trường ưu tiên riêng và không có trường chu kỳ lặp**. Tần suất lặp (Ngày/Tuần/Tháng/Quý/Năm) chỉ có ở bảng 0.2 và 0.8 của Base tài chính (việc định kỳ của phòng tài chính).

**Danh mục nhân sự (3.2)**, cấu trúc: Mã phòng ban (PKD, TCKT, HCNS, MKT, BGĐ, DV-KT) · Phòng ban (8) · Cơ sở (Vinh, Đà Lạt, Văn phòng) · Chức danh (danh sách dài, ~28 chức danh) · Cấp bậc (Quản lý, Trợ lý, Chuyên viên, Nhân viên) · QL trực tiếp · Trạng thái làm việc (ON, OFF, Thực tập, Thử việc, Nghỉ thai sản) · Tình trạng hội nhập (Thực tập sinh, Thử việc, Chính thức, Remote, Nghỉ việc…) · Tài khoản Lark · cột "BC hôm nay" đếm số báo cáo trong ngày của từng người. Bảng này còn chứa nhiều dữ liệu cá nhân nhạy cảm (giấy tờ, ngân hàng, gia đình); **không nên sao chép sang module việc**, chỉ lấy khoá nhân viên + phòng ban + quản lý trực tiếp.

### 4.3 Đánh giá hiệu suất, review tháng, thưởng phạt (nhóm 2B)

- **2.10 Hiệu suất nhân viên tháng**: theo nhân sự × tháng. `HIỆU SUẤT TỔNG = ROUND(Tỷ lệ đúng hạn% × 0,7 + Tỷ lệ task hoàn thành% × 0,3; 1)`. Tỷ lệ hoàn thành % = hoàn thành / tổng task (loại Hủy bỏ); tỷ lệ đúng hạn % = (hoàn thành không muộn) / hoàn thành. **Xếp loại**: ≥90 Xuất Sắc · ≥80 Tốt · ≥65 Đạt · ≥50 Trung bình · còn lại Kém. Hiệu suất giảm? = so kỳ trước giảm ≥ 0,05 (xem lỗi đơn vị ở mục 5). Điểm Task % = (hoàn thành − hoàn thành chưa có kết quả) / hoàn thành × 100. Xếp hạng trong phòng = 1 + số người cùng phòng cùng tháng có hiệu suất cao hơn; so với TB phòng và Top phòng. **Mức cảnh báo** theo số cờ trong 3 cờ (Có task quá hạn; Hiệu suất giảm; Có task đã hoàn thành nhưng chưa có kết quả): 3 → Rủi ro cao, 2 → Cảnh báo, 1 → Cần chú ý, 0 → Ổn định.
- **2.11 Review tháng nhân sự**: số báo cáo đã nộp / đạt / làm lại, nhận xét–giải trình; trạng thái **Chờ TP đề xuất → Chờ GĐ review → Đã duyệt**; nhánh **Yêu cầu giải trình → Đã giải trình**.
- **2.12 Đánh giá trưởng phòng tháng**: điểm Giám đốc 1–10, nhận xét; trạng thái Chờ đánh giá / Đạt / Không đạt / Đã chuyển thưởng phạt.
- **2.9 Thưởng phạt công việc**: phân loại LỖI VI PHẠM / THÀNH TÍCH; hình thức (14): Tuyên dương công khai, Thưởng điểm thi đua, Thưởng tài chính, Bằng khen, Thưởng cuối tháng, Thưởng hiện vật, Thưởng đặc biệt, Phê bình riêng, Phê bình công khai, Phạt tài chính, Phạt cuối tháng, Trừ điểm thi đua, Biên bản kiểm điểm, Phạt đặc biệt; số tiền; kết quả xử lý (Đã xong / Hủy bỏ / Chưa thực hiện). Mã sinh theo mẫu `TP_<nhân sự>_<yyyymmdd>`.
- Sheet "Kế toán viên/Kế toán trưởng – Kế hoạch & KPI" (tìm thấy khi tra cứu) chưa mở.

### 4.4 Sheet "MSC và OMYN – Danh mục Công việc 2026"

Đây **không phải bảng task hằng ngày** mà là **backlog dự án dựng hệ thống làm việc** cho hai bên (MSC/Amia và Omyn), lập 10/10/2026. 3 tab:

- *Tổng hợp*: mỗi nhóm hạng mục × bên (MSC/Omyn) × số đầu việc × (Hoàn thành, Đang thực hiện, Chưa thực hiện, Chờ quyết định); bảng "Những việc cần chốt trước khi triển khai tiếp" (nội dung cần chốt, thuộc bên, người quyết định, ảnh hưởng nếu chưa chốt).
- *MSC* và *Omyn*: cột **Mã** (dạng MSC.B.01, OMY.01) · **Hạng mục** · **Nội dung công việc** · **Người phụ trách** · **Thời hạn** (ngày hoặc "Chưa ấn định" hoặc "Sau khi xong <mã khác>", tức phụ thuộc trước–sau) · **Tình trạng** (Hoàn thành · Đang thực hiện · Chưa thực hiện · Chờ quyết định · Đang vận hành) · **Ưu tiên** (Rất cao · Cao · Trung bình · –) · **Ghi chú**.
- Nguyên tắc triển khai ghi trong tab Omyn, đáng mang sang AMIA OS: **đi đúng 3 bước** rà soát khung công việc → biên soạn quy trình/quy định/biểu mẫu → **sau cùng mới dựng phần mềm**; dữ liệu Omyn **dựng riêng, không dùng chung với Amia**; ưu tiên bản miễn phí; thư mục Omyn chia 8 nhóm (pháp lý, chiến lược, sản phẩm, marketing, kinh doanh, vận hành, tài chính…); Omyn đã có danh mục 76 quy trình/biểu mẫu và sơ đồ 18 chức danh (30/9/2026). MSC ghi rõ: không làm lại hệ thống đang vận hành ổn định; phía MSC không làm app chấm công.

### 4.5 Danh sách máy ĐL (chỉ cấu trúc cột)

Một sheet, 195 hàng × 17 cột, 7 cột dùng: **VỊ TRÍ** (nhóm phòng/khu chức năng, ví dụ nhóm theo phòng chăm sóc da, công nghệ cao, phòng bác sĩ) · **TÊN MÁY/THIẾT BỊ** · **ĐVT** · **SỐ LƯỢNG** · **HÌNH ẢNH** (có ô ghi "không tìm được ảnh") · **GIÁ NHẬP** (có ô tính bằng USD) · **GIÁ THANH LÝ**. Đây là danh sách thanh lý thiết bị chi nhánh Đà Lạt, không có mã tài sản, serial, ngày mua, tình trạng. SOP mua sắm yêu cầu hồ sơ tài sản tối thiểu nhiều hơn (mục 2.7, bước 6), nên danh mục tài sản của AMIA OS (nếu làm) nên theo SOP chứ không theo sheet này.

---

## 5. Mâu thuẫn và chất lượng dữ liệu cần biết (không sao chép nguyên)

| # | Chỗ lệch | Chi tiết | Cách xử lý đề xuất |
|---|---|---|---|
| 1 | **Ngưỡng duyệt chi** | Quy tắc QT-HM-06 trong Base ghi "hạn mức duyệt chi theo cấp **chưa có số**, cần KTT và BOD chốt; KHÔNG TỰ ĐẶT NGƯỠNG TIỀN", trạng thái "Chờ MSC xác nhận", ngưỡng tiền để trống. Trong khi COS-FIN-03/FIN-PROC-01/02/03 ghi rõ 10 triệu | Đặt ngưỡng là **tham số cấu hình**, mặc định theo Wiki (10 triệu), hỏi chị Lâm xác nhận trước khi coi là chính thức |
| 2 | **Cấp duyệt** | Base 3.2 có cấp KTT/GĐCN/BOD/CEO (2.2 thêm "Kế toán nghiệp vụ"); SOP chỉ có KTT và Giám đốc Công ty (GĐ chi nhánh chỉ xác nhận nhu cầu, trừ điều chỉnh đơn hàng thông thường) | Lấy SOP làm chuẩn |
| 3 | **Trạng thái đề nghị chi** | Base 3.2 chỉ 6 trạng thái (Chờ duyệt, Đã duyệt, Đã chi, Từ chối, Cần bổ sung chứng từ, Đã hạch toán) trong khi SOP có chuỗi dài hơn (xác nhận QL, KT chi kiểm tra, chờ KTT, chờ GĐ, chờ xếp lịch, đã xếp lịch, chờ đóng hồ sơ, hoàn tất) | Lấy chuỗi SOP làm chuẩn (kiểm soát chặt hơn, có bước xếp lịch tách khỏi duyệt) |
| 4 | **Số kho** | Base 3.7 chỉ "Kho Vinh, Kho Đà Lạt"; SOP/Chính sách: đúng 5 kho (Tổng + Trị liệu + Tư vấn mỗi chi nhánh) | Lấy 5 kho |
| 5 | **AP có nhóm tuổi nợ** | Bảng 3.5 có "Nhóm tuổi nợ", SOP FIN-PROC-11: AP không chia nhóm tuổi nợ | Bỏ trường này ở AP |
| 6 | **Trừ lương** | Bảng 3.3 có trạng thái "Chuyển trừ lương", SOP: chỉ áp dụng khi có chính sách chính thức, chưa mặc định | Đừng mở trạng thái này cho tới khi có chính sách |
| 7 | **Báo cáo tuần** | COS-FIN-08 mục "hằng tuần" nói chốt công nợ phải thu + phải trả + tồn kho; mục "12. Bổ sung" và PROC-12 nói báo cáo tuần chỉ công nợ phải thu và tạm ứng chưa hoàn | Hỏi chốt (xem mục 8) |
| 8 | **Giờ cutoff** | Báo cáo doanh thu ngày gửi trước 09:00 (PROC-12/COS-FIN-08); PROC-04 nói đối soát hoàn thành trước 10:00 ngày làm việc kế tiếp | Hỏi chốt |
| 9 | **RACI "Sửa/điều chỉnh đơn hàng"** | RACI để Giám đốc cột "I", KTT cột "A/I"; PROC-05 nói hồ sơ trọng yếu do Giám đốc duyệt cuối | Theo PROC-05 |
| 10 | **Trạng thái công việc** | Cột Trạng thái có 4 lựa chọn (thêm "Đang làm"); hướng dẫn app chỉ liệt kê 3. Công thức lại tham chiếu thêm "Thất bại" và "Chờ duyệt" **không có** trong danh sách lựa chọn | Dùng 4 trạng thái; nếu cần "Chờ duyệt" thì tách sang trường duyệt (đã có) |
| 11 | **Công thức bị hỏng** | Nhiều công thức ở 2.10 (Tổng task, Task hoàn thành, Task đúng hạn, Task quá hạn, Task đang làm, Task chưa có kết quả) chứa tham chiếu lỗi (chuỗi "tham chiếu không hợp lệ" do bảng/trường nguồn bị xoá hoặc đổi tên), nên số liệu có thể đang sai/rỗng. Công thức "Hiệu suất giảm?" so sánh với −0,05 trong khi điểm theo thang 0–100 (lệch đơn vị) | **Không sao chép công thức hỏng.** Giữ lại phần còn nguyên ý nghĩa: trọng số 0,7/0,3, 5 mức xếp loại 90/80/65/50, logic 3 cờ cảnh báo |
| 12 | **"Ngày hoàn thành tự nhảy"** | Chỉ có trong hướng dẫn; không thấy workflow cấu hình | Coi là yêu cầu (đặt `hoan_thanh_luc` lúc chuyển sang xong) chứ không phải đặc tả đã kiểm chứng |
| 13 | **Base trống** | Gần như mọi bảng giao dịch và công việc có 0 bản ghi; các Option 5.3/5.4 trống; Option tài khoản kế toán mới 4 dòng, đều "Chờ MSC xác nhận" | Đây là đặc tả trước khi vận hành, không phải dữ liệu mẫu để học phân bố |
| 14 | **Quỹ chi nhánh bằng 0 cuối ngày** vs sheet Báo cáo quỹ | Sheet có "tồn quỹ cuối ngày" theo tài khoản ngân hàng/quỹ công ty; quy định "quỹ vận hành chi nhánh = 0" là quỹ tiền mặt ở chi nhánh, hai thứ khác nhau | Tách "quỹ tiền mặt chi nhánh" (phải về 0) khỏi "tài khoản ngân hàng" |

---

## 6. Áp dụng cho AMIA OS

Bản đồ lệch giữa nghiệp vụ MSC và những gì AMIA OS **đã có** (theo `docs/LO-TRINH.md` và các migration 0026 đến 0031; đã đối chiếu tên bảng, chưa đối chiếu từng cột). Đề xuất theo hướng **bổ sung vào bảng sẵn có**, không dựng bảng mới trừ khi ghi "mới".

### 6.1 Quyền và maker-checker (nền cho mọi thứ khác)

Hiện `nhan_vien.vai_tro` gồm: ky_thuat, quan_ly, le_tan, thu_ngan, tu_van, bac_si, ktv, thu_kho, ke_toan, marketing, nha_dau_tu. Migration 0017 đã **gộp chu/giam_doc vào quan_ly**, nên hệ thống **không biểu đạt được** "KTT duyệt dưới ngưỡng, Giám đốc duyệt từ ngưỡng", cũng không có "Kế toán trưởng" riêng.

- Thêm vào `nhan_vien` (hoặc bảng phụ) các cột: `chuc_danh_tai_chinh` (ke_toan_truong, ke_toan_thu, ke_toan_chi, ke_toan_vat_tu, thu_quy, giam_doc_cong_ty, giam_doc_chi_nhanh) và **`han_muc_duyet` (số tiền, null = không có quyền duyệt chi)**, bám bảng 5.5 "Hạn mức duyệt chi (đ)" và "Miền dữ liệu phụ trách". Không thêm vai trò mới vào check của `vai_tro` nếu chưa cần (tránh phải sửa lại check lần thứ ba).
- Bảng tham số `quy_tac_duyet` (mới, nhỏ): `loai_nghiep_vu`, `nguong_tien`, `cap_duyet_duoi`, `cap_duyet_tu`, `hieu_luc_tu`, `trang_thai` (đang hiệu lực / chờ xác nhận). Mặc định nạp đúng bảng 2.5 nhưng ngưỡng 10 triệu đặt `trang_thai = cho_xac_nhan` cho đến khi chị Lâm chốt (mâu thuẫn #1).
- **Kiểm tra cứng ở cơ sở dữ liệu**: `nguoi_duyet_id <> nguoi_gui_id` (cả `de_xuat` và `don_mua`, nơi đã có `nguoi_duyet_id`); người lập phiếu kho khác người giao nhận; người duyệt phải có `han_muc_duyet >= so_tien`; không cho cùng người làm cả hai bước "duyệt" và "chi/xuất quỹ" trên một đề nghị.
- **Phân quyền theo trường**: Thủ kho không thấy đơn giá/giá trị nhập (quy tắc riêng của SOP kho). Giám đốc chi nhánh chỉ thấy dữ liệu chi nhánh mình (khoá theo `chi_nhanh_id`).
- **Không xoá cứng** chứng từ; sửa dữ liệu tài chính phải có nhật ký (người, lúc, trước/sau, lý do). Khoá tài khoản người nghỉ việc trong 24 giờ.

### 6.2 Đề xuất, thanh toán, tạm ứng, hoàn ứng → mở rộng `de_xuat`

Hiện `de_xuat.loai` ∈ {mua_sam, thanh_toan, tam_ung}; `trang_thai` ∈ {cho_duyet, da_duyet, da_thuc_hien, tu_choi, huy}; có `so_quy_id`, `don_mua_id`, hàm `chi_theo_de_xuat`. So với SOP:

| Thiếu | Đề xuất |
|---|---|
| Hoàn ứng | Thêm `loai = 'hoan_ung'` + cột `de_xuat_goc_id` (**unique**: 1 tạm ứng ↔ đúng 1 hoàn ứng), tổng chi thực tế, chênh lệch tự tính, hướng xử lý (nhân viên hoàn / công ty trả thêm / bằng nhau) |
| Hoàn trả khách | Thêm `loai = 'hoan_khach'`; luôn cần Giám đốc Công ty duyệt mọi giá trị |
| Chuỗi duyệt nhiều cấp | Bảng `de_xuat_buoc_duyet` (mới): đề xuất, thứ tự, vai trò cần duyệt, người duyệt, kết quả, lúc, ghi chú. Số bước sinh ra từ `quy_tac_duyet` + số tiền |
| Trạng thái | Mở rộng: cho_ql_xac_nhan → kt_chi_kiem_tra → cho_ktt → cho_giam_doc → da_duyet_cho_xep_lich → da_xep_lich → da_chi_cho_dong_ho_so → hoan_tat; nhánh: cho_bo_sung, tu_choi, huy. Giữ `da_thuc_hien` chỉ để tương thích |
| Xếp lịch chi | Cột `ngay_can_chi`, `ngay_xep_lich`, `nguoi_xep_lich_id` (KTT), `ly_do_hoan` (chưa đủ nguồn tiền, chưa đến hạn, chờ đối soát, ưu tiên thấp) |
| Hạn gửi | Cảnh báo khi `ngay_can_chi` cách ngày gửi dưới 3 ngày làm việc |
| SLA | `han_xu_ly` mỗi bước (+1 ngày làm việc); quá hạn đẩy thông báo (đã có `thong_bao`, 0019/0025) |
| Ngân sách | `nhom_chi_phi_id`, cờ `trong_ngan_sach`, `vuot_ngan_sach` (số tiền); vượt thì chuyển `cho_giai_trinh_vuot_ngan_sach` |
| Chứng từ | Bảng đính kèm chứng từ (hợp đồng, báo giá, hoá đơn, nghiệm thu); cờ "chưa có hoá đơn" + hạn bổ sung. QT-DL-04: thiếu liên kết chứng từ thì không đóng |
| Tạm ứng mở | Chặn gửi tạm ứng mới nếu người đó còn khoản cũ chưa đóng; nhắc trước hạn 2 ngày, đúng hạn, hằng ngày khi quá hạn; hạn hoàn ứng = ngày hoàn thành việc + 3 ngày làm việc |
| Chi dưới 2 triệu tự chi trước | Loại riêng "hoàn trả chi phí nhân viên", cần phê duyệt chủ trương đính kèm |

### 6.3 Sổ quỹ thu/chi (đã có `quy`, `loai_thu_chi`, `so_quy`, `v_so_quy`, `so_quy_tong`)

- `so_quy.loai` đang là thu/chi/nap/rut; `nguon` thu_cong/chuyen_quy/dao_phieu. Phù hợp phần lõi. Bổ sung `loai_thu_chi` thành **2 tầng** (`nhom_cha`: Thu từ khách / Thu nội bộ / Thu từ đối tác–NCC / Thu tài chính / Chi cho khách / Chi đối tác–NCC / Chi nội bộ) và nạp danh mục khoản theo cột sheet ở mục 3 (cho phép quản trị thêm khoản).
- **Báo cáo quỹ ngày** làm thành view/báo cáo: mỗi dòng = (ngày × quỹ), các cột = tổng theo khoản; `ton_cuoi = ton_dau + chenh_lech_chua_ro + tong_thu − tong_chi`; `ton_dau` = tồn cuối ngày liền trước của đúng quỹ đó (xuyên tháng, không cần nối tab). Dòng `TỔNG CỘNG` = SUM theo đơn vị/ngày.
- **"Dư chưa rõ lý do"**: ghi thành phiếu `loai = 'dieu_chinh'` (mới) bắt buộc lý do, cần duyệt, hiện trong danh sách ngoại lệ chưa đóng; không cho nhập tự do trên báo cáo.
- Quỹ cần **ngày hiệu lực** (kiểm xem bảng `quy` hiện có `hoat_dong`/ngày bắt đầu–kết thúc chưa), vì danh sách tài khoản của MSC đổi theo thời gian.
- Tách **quỹ tiền mặt chi nhánh** (quy định cuối ngày về 0, tiền khách chưa nộp phải theo dõi riêng, nộp/bàn giao trước 09:00 hôm sau) khỏi các tài khoản ngân hàng; thêm phiếu "bàn giao tiền mặt" (người giao, Thủ quỹ nhận, chứng từ, xác nhận) và cảnh báo chưa bàn giao quá 09:00.
- **Đối soát** (chưa làm theo LO-TRINH): bảng `doi_soat` (mới) theo ngày × đơn vị × kênh: số theo hệ thống, số theo ngân hàng/POS, chênh lệch, nguyên nhân (6 mã ở bảng 3.6), hạn xử lý, trạng thái (khớp / đang xử lý lệch / đã xử lý / chuyển kỳ sau).

### 6.4 Kho và mua hàng (đã có `nha_cung_cap`, `don_mua`, `don_mua_dong`, `ncc_so_cai`, `v_cong_no_ncc`, hàm `nhan_hang_don_mua`, `thanh_toan_ncc`; kho ở migration 0006/0012)

`don_mua.trang_thai`: nhap, cho_duyet, da_duyet, dang_nhan, da_nhan, huy. So với SOP:

- Thêm trạng thái: `cho_giai_trinh_vuot_ngan_sach`, `cho_chung_tu_cong_no`, `cho_xu_ly_chenh_lech`, `hoan_tat` (chỉ sau khi đủ **6 nhóm hồ sơ**), `tu_choi`. Bổ sung kiểm tra: không phát hành đơn đặt hàng cho NCC trước `da_duyet`.
- Báo giá: bảng `bao_gia_don_mua` (mới) + luật số báo giá tối thiểu theo giá trị (NCC mới/máy móc/CCDC/TSCĐ hoặc >20 triệu: 2; >30 triệu: 3; thiếu thì cần ngoại lệ Giám đốc, ghi lý do).
- `nha_cung_cap`: thêm mã NCC, MST, nhóm hàng cung cấp (6 nhóm), hạn công nợ (ngày), điều khoản thanh toán, ngày đánh giá gần nhất (nhắc 12 tháng/lần), trạng thái hợp tác.
- Công nợ NCC (`v_cong_no_ncc`): thêm **lịch thanh toán**, **trả trước chưa có hoá đơn** + hạn nhận hoá đơn + trạng thái "Hoá đơn chưa về quá hạn", **kết quả đối chiếu** (Chưa gửi / Chờ phản hồi / Khớp / Lệch / Quá hạn phản hồi), ngưỡng 5 triệu quyết định tần suất gửi xác nhận, không có nhóm tuổi nợ.
- Người đặt hàng ≠ người nhận/nghiệm thu duy nhất; hàng sai/thiếu/hỏng lập biên bản và tách phần lệch.
- **Kho**: cấu trúc **5 kho** (Tổng + Trị liệu và Tư vấn mỗi chi nhánh; Hà Nội không kho) với cờ kho mỹ phẩm; **FEFO** trừ theo lô/hạn (đang ghi "chưa làm" trong LO-TRINH mục 5); phiếu kho 2 liên và xác nhận 2 người; chuyển kho: trạng thái `dang_dieu_chuyen` và **kho nhận xác nhận trong 24 giờ** mới ghi tăng; cảnh báo hạn dùng 90/60/30 ngày; cảnh báo tồn thấp theo mã × kho; **chặn nhập hàng còn hạn <90 ngày** trừ khi có ngoại lệ; kiểm kê hằng tháng cuối tháng (khoá nhập/xuất tạm, 2 người ký, chênh lệch phải qua phiếu "xử lý vật tư" được duyệt mới điều chỉnh tồn); phiếu **xuất khẩn cấp y tế** (trạng thái `da_xuat_khan_cho_hau_kiem`, hạn hậu kiểm 24 giờ, cảnh báo quá hạn); xử lý vật tư (trả NCC, huỷ, điều chỉnh) theo `xu_ly_vat_tu` (mới) với chuỗi duyệt KTT → Giám đốc.
- Kế hoạch sử dụng vật tư theo tháng × chi nhánh (`ke_hoach_vat_tu`, mới) làm đầu vào cho phiếu cấp và đề nghị mua; hạn gửi đề nghị xuất kho trước ngày 02 hằng tháng.

### 6.5 Nơi làm việc: việc cần làm, báo cáo ngày, wiki, đề xuất (đã có `cong_viec`, `bao_cao_ngay`, `wiki_bai`, `de_xuat`)

`cong_viec` hiện: tiêu đề, mô tả, người giao/nhận, `han`, `uu_tien` (thap/thuong/cao), `trang_thai` (moi/dang_lam/xong/huy), `ket_qua`, `hoan_thanh_luc`. So với app MSC:

| Thiếu | Đề xuất |
|---|---|
| Mã việc | `ma` tự sinh dạng `<tiền tố>yyyymmdd<nn>` (ví dụ `AMIA2026102701`), bất biến |
| Phòng ban / vai trò báo cáo | `phong_ban`, `vai_tro_bao_cao` (8 vai trò MSC, quy về vai trò AMIA) |
| Bắt buộc có hạn, giờ bắt đầu, định mức giờ | `han` not null cho việc tạo mới, thêm `bat_dau`, `dinh_muc_gio` |
| Minh chứng | `mo_ta_ket_qua` + tệp đính kèm; **chặn chuyển sang `xong` nếu thiếu cả hai** (khớp quy tắc "bắt buộc có hình ảnh hoặc mô tả kết quả") |
| Tình trạng tính tự động | View `tinh_trang_cv`: huỷ / hoàn thành đúng hạn / hoàn thành muộn / chưa có hạn / trễ hạn / đến hạn hôm nay / còn hạn (đúng thứ tự công thức mục 4.2). So theo **ngày**, không theo giờ, với việc chưa xong |
| Duyệt | `trang_thai_duyet` (cho_duyet, lam_lai, da_nop_lai, truong_phong_duyet, da_bao_bgd), `nguoi_duyet_id` mặc định = quản lý trực tiếp, nhận xét |
| Trạng thái | Giữ 4: moi (Chưa bắt đầu), dang_lam, xong, huy; ưu tiên có thể đặt thang 4 bậc (làm ngay/cao/trung bình/thấp) |
| Chu kỳ lặp | Mẫu việc định kỳ (ngày/tuần/tháng/quý/năm) sinh việc tự động, theo bảng 0.2/0.8; MSC chưa có ở bảng task |
| Bộ lọc, Kanban | Lọc nhân viên × phòng ban × thời gian × tiến độ; hai kiểu xem (lưới, Kanban kéo thả) |

`bao_cao_ngay` hiện chỉ có `da_lam`, `vuong`, `ke_hoach` (văn bản). Đề xuất thêm: trường **số liệu theo vai trò** (lưu `jsonb` + danh mục chỉ số theo vai trò, ví dụ lịch hẹn/khách chốt/doanh thu cho tư vấn, số khách điều trị cho KTV, số bill và tổng thu cho thu ngân, tồn quỹ cho kế toán), ảnh xác thực, cờ đã báo quản lý, trạng thái duyệt, và đếm "đã nộp hôm nay" cho từng người. Ghép kỳ hạn tài chính: báo cáo doanh thu ngày trước 09:00; công nợ + tạm ứng tuần chốt 12:00 thứ Hai.

Đánh giá hiệu suất/thưởng phạt (4.3) **chưa nên làm trong đợt này** (nhạy cảm, nguồn công thức đang hỏng, chị Lâm chưa yêu cầu). Nếu làm sau, dùng: trọng số 0,7/0,3, mức 90/80/65/50, 3 cờ cảnh báo, chỉ tính từ dữ liệu việc thật, và **ghi nhận KPI theo ba trạng thái + baseline 03 tháng** của COS-FIN-06 trước khi dùng đánh giá cá nhân.

`de_xuat` (mục 6.2) đã là nơi gom đề xuất mua sắm/thanh toán/tạm ứng; `wiki_bai` có thể nạp các SOP (FIN-PROC) dưới dạng bài có phiên bản/ngày hiệu lực/phạm vi áp dụng theo bảng 2.1 (Dự thảo/Đang hiệu lực/Đang sửa/Hết hiệu lực).

### 6.6 Khoá sổ, ngân sách, công nợ khách, báo cáo (đa phần chưa có)

- `ky_ke_toan` (mới): mã kỳ, đơn vị, phân hệ, trạng thái (mo → dang_ra_soat → da_khoa → mo_lai), thời điểm khoá, người khoá; **trigger chặn ghi/sửa/xoá sổ cái, sổ quỹ, phiếu kho, công nợ khi kỳ đã khoá**; `de_nghi_mo_lai_ky` với dữ liệu trước/sau và chuỗi duyệt (KTT, Giám đốc nếu trọng yếu). Lịch D/D+1…D+7 làm checklist theo phân hệ.
- `ngan_sach_ky` (mới): kỳ, đơn vị, nhóm chi phí, ngân sách duyệt, **khả dụng = duyệt − đã chi − đã duyệt chưa chi − đơn đặt cam kết**, trạng thái dự thảo/đã duyệt/đang dùng/đã khoá; kiểm tra tại bước gửi đề xuất và tạo đơn mua; cảnh báo chỉ khi vượt (không cảnh báo 80%).
- Công nợ khách (AR): dữ liệu công nợ SalonHero đã chuyển; bổ sung 6 nhóm tuổi nợ, người phụ trách, hành động, trạng thái (Trong hạn / Quá hạn–đang nhắc / Đã cam kết / Tranh chấp / Đã thu đủ), "tiền chờ định danh" tách riêng không vào công nợ.
- Danh mục `nhom_chi_phi` (5 loại) và `tai_khoan_ke_toan` chỉ khi có phần mềm kế toán đối ứng; hiện mới có 4 TK ở trạng thái chờ xác nhận nên **chưa nên cứng hoá mã tài khoản**.
- Báo cáo định kỳ theo mục 2.11, ưu tiên: doanh thu ngày theo chi nhánh/kênh, báo cáo quỹ ngày, công nợ NCC và tạm ứng quá hạn, tồn kho cận hạn/tồn thấp.

### 6.7 Thứ tự làm gợi ý (theo mức đáng làm trước)

1. Nền quyền: `han_muc_duyet`, `quy_tac_duyet`, chặn tự duyệt, nhật ký sửa (mọi thứ sau đều dựa vào).
2. `de_xuat`: hoàn ứng, chuỗi duyệt nhiều cấp, xếp lịch chi, SLA (khớp luồng đang dùng nhất).
3. Sổ quỹ 2 tầng + báo cáo quỹ ngày + phiếu điều chỉnh "dư chưa rõ".
4. Mua hàng: báo giá, ngân sách, đóng đơn đủ 6 nhóm hồ sơ, công nợ NCC đầy đủ.
5. Kho: FEFO/hạn dùng/chuyển kho 24 giờ/kiểm kê tháng/xuất khẩn cấp.
6. Việc cần làm: mã, minh chứng bắt buộc, tình trạng tự tính, duyệt, báo cáo ngày theo vai trò.
7. Khoá sổ + ngân sách + đối soát (cần dữ liệu thật của 2 đến 3 tháng chạy song song).

---

## 7. Phạm vi không áp dụng hoặc để sau

- Hoá đơn điện tử, phần mềm kế toán, chuyển khoản ngân hàng tự động, Approval của Lark: AMIA OS không thay (LO-TRINH đã ghi không làm hoá đơn điện tử).
- Tiền lương, hoa hồng, giá thành: có trong lịch khoá sổ (D+5) nhưng không thuộc phạm vi tài liệu đọc.
- Dữ liệu cá nhân trong danh mục nhân sự (giấy tờ, ngân hàng, gia đình): không đưa vào module việc.
- Omyn là công ty khác, dữ liệu tách riêng: AMIA OS không chia sẻ dữ liệu với Omyn.

## 8. Chưa rõ / cần hỏi chị Lâm

1. **Ngưỡng 10 triệu có phải chính thức không?** Wiki (COS-FIN-03, FIN-PROC-01/02/03) nói 10 triệu: dưới thì KTT duyệt cuối, từ đó trở lên Giám đốc Công ty. Nhưng Base TC-OPS-01 (quy tắc QT-HM-06) ghi "chưa có số, cần KTT và BOD chốt, không tự đặt ngưỡng". Em đề xuất để ngưỡng là tham số và mặc định 10 triệu, chờ chị xác nhận.
2. **Cấp duyệt trong AMIA OS**: sau khi gộp chủ/giám đốc vào quản lý (migration 0017), ai là "Kế toán trưởng" và ai là "Giám đốc Công ty" của AMIA? Có cần tách hai chức danh này (thêm cột chức danh tài chính + hạn mức, không thêm vai trò) không? Cơ sở Vinh/Đà Lạt có "Giám đốc chi nhánh" duyệt bước xác nhận nhu cầu không?
3. **Phạm vi áp dụng**: các quy trình tài chính này (tạm ứng, hoàn ứng, mua hàng, kho 5 kho, khoá sổ) dành cho toàn MSC Group. AMIA OS làm theo đủ hay chỉ lấy phần cho phòng khám (thu, quỹ, mua vật tư, kho, đề xuất, việc)?
4. **VTTECH và SalonHero**: SOP gọi VTTECH là nguồn chuẩn đơn hàng/doanh thu/kho/lô. AMIA OS đang thay SalonHero. VTTECH là tên khác của hệ thống đó, hay là hệ thống khác sẽ chạy song song? Nếu AMIA OS là hệ thống nguồn thì "đối soát VTTECH với ngân hàng" sẽ là đối soát chính AMIA OS với sao kê.
5. **Báo cáo quỹ ngày**: AMIA OS thay sheet này luôn (chị muốn cùng bộ cột thu/chi như trên, kể cả khoản "Mua máy CNC", "Hoàn trả phí Công đoàn"…) hay gọn lại? Cột "Dư chưa rõ lý do": chị đồng ý coi là ngoại lệ phải giải trình và duyệt?
6. **Giờ chốt**: báo cáo doanh thu ngày gửi trước 09:00 hay đối soát xong trước 10:00? Báo cáo tuần gồm công nợ phải thu + phải trả + tồn kho, hay chỉ phải thu + tạm ứng chưa hoàn (hai đoạn trong COS-FIN-08 nói khác nhau)?
7. **Khoá sổ**: AMIA OS có áp dụng mốc D+5 12:00 chốt, D+6 khoá, D+7 phát hành cho chi nhánh? Hay khoá theo ngày/tuần trước?
8. **Kho**: AMIA có đúng 5 kho (Tổng; Trị liệu + Tư vấn tại Vinh; Trị liệu + Tư vấn tại Đà Lạt) hay chỉ 2 kho như Base 3.7? Hà Nội không có kho vật tư. Có dùng Kho Tổng ở cấp công ty không?
9. **Tạm ứng/hoàn ứng và chi nhỏ**: có áp dụng "tự chi dưới 2 triệu khi đã có chủ trương", "đối trừ lương" (hiện SOP nói chưa áp dụng)? Có cần Approval hoàn trả khách riêng cho mọi giá trị do Giám đốc duyệt?
10. **Việc cần làm**: dùng 4 trạng thái (chưa bắt đầu, đang làm, hoàn thành, huỷ) + trường duyệt riêng của trưởng phòng được không? Báo cáo ngày của từng vai trò (tư vấn, lễ tân/thu ngân, KTV, bác sĩ, marketing, kế toán) cần những chỉ số nào cụ thể? (MSC có bộ trường theo vai trò nhưng gán vai trò là em suy luận từ tên trường.)
11. **Hiệu suất, thưởng phạt, review trưởng phòng**: có đưa vào AMIA OS đợt này không? Nếu có, công thức MSC đang hỏng một phần (mục 5 #11), cần chốt lại thang điểm và ai được xem.
12. **Danh mục khoản thu/chi và nhóm chi phí**: lấy theo sheet quỹ hay dựng lại theo cơ sở Vinh/Đà Lạt? Tài khoản kế toán (131/138/141/331) vẫn "chờ MSC xác nhận" nên em chưa gắn mã TK vào dữ liệu.
13. **Tài liệu em chưa đọc kỹ**: FIN-PROC-13 (định mức giá vốn), FIN-PROC-15 (mở/đóng chi nhánh), COS-FIN-04/05 toàn văn, sheet "Kế toán trưởng/Kế toán viên – Kế hoạch & KPI", các bảng việc 2.1–2.8 ngoài 2.3. Cần em đọc tiếp phần nào trước?

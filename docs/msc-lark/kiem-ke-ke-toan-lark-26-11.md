# Kiểm kê kế toán – thu chi trên Lark MSC (để bê sang AMIA OS)

Đọc ngày 26/11/2026 bằng `lark-cli2`, CHỈ ĐỌC. Không chép tên người kèm lương, số tài khoản, số tiền thật. Domain: https://mscgroupvn.jp.larksuite.com
Đã đọc trước: `amia-os/docs/msc-lark/tai-chinh-cung-ung-quan-ly-viec.md` (SOP + Base TC-OPS-01 + sheet quỹ). Báo cáo này CHỈ nêu cái mới / cái đính chính.

## 0. Năm phát hiện quan trọng nhất

1. **"App Quản lý Thu chi" thật sự đang chạy = Base `FIN-RPO-01-2026_Quản Lý Tài Chính_MSC`** (42 bảng, dữ liệu sống tới 26/11/2026), KHÔNG phải `MSC_BCĐ_Thu Chi`. Tài liệu cũ (docs/msc-lark) chỉ đọc Base TC-OPS-01 (khung rỗng, SOP) mà bỏ sót Base này. Wiki: `/wiki/R9UfwUaMgirqv5kA4ABjw2bPpwf` (base token `Kuh4bTZFxaL52LsNTuvjv8VspFd`). Base này là nơi Lark Approval ghi dữ liệu về (đề nghị thanh toán / tạm ứng / hoàn ứng / kế hoạch ngân sách…), kèm báo cáo quỹ, thống kê chi phí, xếp lịch chi, doanh thu ngày. KPI của kế toán cũng ghi nguồn là "Base FIN-RPO Quản lý Tài chính MSC".
2. **`MSC_BCĐ_Thu Chi` và `MSC_BCD. Tổng hợp thu chi` KHÔNG phải kế toán công ty.** BCĐ = Ban Công Đoàn. Đó là sổ quỹ công đoàn/quỹ phạt nội bộ (phạt đi muộn, quà sinh nhật, quà lễ, thăm ốm). Nên thuộc MSC Group OS (nhân sự/văn hoá), không phải AMIA OS. Chỉ cần xác nhận với chị Lâm.
3. **Chuỗi duyệt THẬT đã đọc được từ 25 phiếu của nhiều người** (`approval instances get --instance-code` đọc được phiếu của người khác; mã lấy bằng cách giải mã base64 cột `SourceID` trong Base FIN-RPO). **SOP + migration 0348 (QL đơn vị → KT chi → KTT → GĐ từ 10 triệu) về cơ bản ĐÚNG**; chỗ lệch là tên vai trò và các bước đầu/cuối. Tóm tắt (vai trò, không nêu tên), xem đủ ở mục 10:
   - **Đề nghị thanh toán, chi nhánh (AVI/ADL)**: Người lập → Trưởng bộ phận/Trưởng phòng xác nhận → Quản lý chi nhánh → **KT tổng hợp** kiểm (được trả về "Bổ sung chứng từ") → KTT → **Giám đốc CHỈ khi ≥10 triệu** (dưới ngưỡng bỏ bước) → CC KTT+KT tổng hợp → **Hành chính kiêm Thủ quỹ lên lệnh chi/UNC** → **KT tổng hợp đóng hồ sơ** → CC KTT.
   - **Tổng công ty (MSC)**: Người lập → Trưởng phòng → KT tổng hợp → KTT → (CC) → Giám đốc (≥10 triệu) → CC; dưới 10 triệu: KT tổng hợp → KTT → Hành chính kiêm Thủ quỹ → KT tổng hợp (không có Giám đốc).
   - **Tạm ứng**: cùng chuỗi, Giám đốc duyệt ở phiếu lớn, Thủ quỹ nhận CC hoặc chi ở bước cuối. **Hoàn ứng**: Trưởng bộ phận → QL chi nhánh → KT tổng hợp → KTT → Thủ quỹ (xác nhận nhận/chi bù) → KT tổng hợp đóng; hay bị trả về.
   - **Kế hoạch ngân sách**: Trưởng phòng/bộ phận lập → KT tổng hợp → Giám đốc. **Điều chỉnh HĐ bán lẻ/VAT** và **Đề xuất cấp/hoàn hàng**: người lập → KT tổng hợp → Giám đốc (CC QL chi nhánh/KTT).
   - Phiếu "Hoàn trả khách" và "Mua sắm" KHÔNG có bảng/định nghĩa trong Base FIN-RPO nên chưa kiểm được hai chuỗi này của 0348.
   - Tức là cần SỬA: (a) đổi/ánh xạ vai: Lark dùng **KT viên, KT tổng hợp, KTT, Hành chính kiêm Thủ quỹ, Giám đốc, Quản lý chi nhánh, Trưởng bộ phận/phòng**, không có Kế toán chi/thu/vật tư; (b) thêm bước **Thủ quỹ chi tiền** và **KT tổng hợp đóng hồ sơ** sau khi duyệt; (c) bước 1 ở chi nhánh là HAI cấp (Trưởng bộ phận rồi QL chi nhánh); (d) trạng thái "Cần bổ sung chứng từ" + gửi lại lần N; (e) CC không phải bước duyệt; (f) bước lặp cùng người (người lập đồng thời là người duyệt) tự bỏ qua (REMOVE_REPEAT).
4. **Phiếu của Lark có khối bút toán Nợ/Có** (định khoản) do kế toán điền ở bước kiểm: "Bút toán ghi nhận chi phí" và "Bút toán ghi nhận thanh toán", mỗi dòng gồm Nợ/Có · Đối tượng · Số hiệu tài khoản (111, 141, 311, 331, 333, 334, 338, 211, 611, 642…) · Số tiền · Chi nhánh. AMIA OS chưa có gì tương đương (BeDental cũng ghi "Để sau").
5. **Quy trình chi đã đổi ngày ~03/09/2026**: trước đó dùng 2 bảng cũ `4.9 Đề nghị duyệt chi` (257 phiếu, tới 31/08) + `4.8 Lệnh chi tiền` (672 phiếu, tới 03/09); từ 03/09 dùng 3 form tách riêng có bút toán `4.12/4.13/4.14/4.15/4.16` + bảng `3.14 Xếp duyệt lịch chi`. AMIA nên bám bản MỚI.

## 1. Bảng nguồn → trạng thái trong AMIA OS

| # | Nguồn Lark | Là gì | Trạng thái AMIA OS |
|---|---|---|---|
| 1a | MSC_BCĐ_Thu Chi (Base `LB0TbhRPha3d2gsALECjKJyapcd`, 168 dòng) | Sổ quỹ phạt/công đoàn | Chưa có; không thuộc AMIA (xem mục 0.2) |
| 1b | MSC_BCD. Tổng hợp thu chi (Sheet `QWxusayeehYAoItyMUcjYr9Vpvg`) | Cùng sổ quỹ công đoàn + bảng chia quà lễ/tết theo nhân sự | Chưa có; không thuộc AMIA |
| 2 | Wiki Phòng Tài chính - Kế toán (8 COS + 15 PROC + Base FIN-RPO) | SOP / quy chế | Có một phần (docs/msc-lark đã tóm; 0032, 0348 dựng theo) |
| 3 | Sheet MSC.26_BTCCU.KT.QUY Báo cáo quỹ ngày | Báo cáo quỹ ngày 6 TK × ngày | Có một phần (sổ quỹ có, báo cáo quỹ ngày chưa) |
| 4 | Sheet AVI.26_KT.TN_BC doanh thu ngày | Báo cáo doanh thu ngày AVI, nhập từ SalonHero | Có một phần (bao-cao "Doanh thu theo ngày" có; thiếu chỉ tiêu, đối chiếu) |
| 5 | Docx Hướng dẫn AMIA OS: Kế toán + Lộ trình IT | Tài liệu của chính AMIA OS | Mô tả cái ĐÃ làm; mục 5 |
| 6 | 3 sheet Kế hoạch & KPI (KTT, KT viên, KT tổng hợp) | Mô tả công việc, checklist, KPI, lộ trình thử việc | Chưa có (KPI/việc để MSC OS) |
| 7 | **FIN-RPO-01-2026 Base** (phát hiện mới) | App thu chi chính của kế toán | Có một phần; chi tiết mục 7 |
| 8 | Lark Approval (instances) | Phiếu duyệt thật | Đọc được chuỗi duyệt thật của 25 phiếu (mục 10); chuỗi 0348 gần đúng, cần 5 chỉnh sửa |

## 2. Wiki "MSC_BCĐ_Thu Chi" và "MSC_BCD. Tổng hợp thu chi" (mục 1 đề bài)

- **MSC_BCĐ_Thu Chi** (`wiki/TvWbw7k48iXzM9kgoWPjbKJnpbg`): node Bitable, không có trang con. Bảng `1. THU VÀ CHI` (168 dòng, 06/2025 tới nay; có vài dòng ngày sai năm 2029) + `7.1. Lookup tháng năm` (12 dòng, tra tháng/năm).
  - Cột: STT (tự đánh số) · Ngày lập · Nội dung · Khoản thu · Khoản chi · Số tiền · Khoản Thu/Chi (Thu | Chi) · Trạng thái (Đã thanh toán | Chưa thanh toán | Đang chờ) · Người nộp/nhận · Người nhận · Ghi chú · Tháng, Năm (công thức tra lookup) · Parent items.
  - Nội dung toàn là tiền phạt vi phạm nội quy, thu hộ quỹ công đoàn, quà sinh nhật, thăm ốm, quà lễ, trích thưởng Tết. Đơn vị là Ban Công Đoàn.
- **MSC_BCD. Tổng hợp thu chi** (`wiki/LYDBwKwqZinCK2kn7ygjYSM2pph`, sheet, thuộc trang "2. MSC_BCĐ_Tài liệu"): 12 tab. `Thu-Chi (Chi)` và `Thu-Chi (Vân Anh)` là sổ 9 cột (STT, Ngày, Nội dung, Thu, Chi, Tồn cuối kỳ = tồn trước + thu − chi, NV đóng, NV nhận, Ghi chú; người giữ quỹ đổi nhau theo kỳ "bàn giao dư đầu kỳ"). Các tab còn lại là danh sách chia quà (Thưởng Tết dương, Tết âm, 8/3, 30/4, 2/9, Trung thu, 20/10): mã nhân viên, đơn vị, chức danh, STK, ngân hàng, mức quà. **Chứa số tài khoản ngân hàng nhân sự: không đưa vào AMIA.**
- Lưu ý quyền: node cha của `MSC_BCĐ_Thu Chi` (`WCXzwhEWoiHs5GkCs6LjEE6Jp2f`) trả `permission_denied` (131006) nên không liệt kê được cây BCĐ phía trên; node `MSC_BCD. Tổng hợp thu chi` nằm dưới trang "2. MSC_BCĐ_Tài liệu" (`QadJwsLyti0ANXkrg0GjgpYxpWf`), trang này chỉ chứa mỗi sheet đó. Cả hai node đều không có node con.
- Tài liệu liên quan: sheet `MSC25_BCĐ_Đề xuất mức phạt công đoàn` (khung phạt theo hành vi, 100–300 nghìn/lần), `MSC25_BCĐ_Danh sách thu tiền phạt vi phạm` (theo tháng).
- **AMIA OS**: chưa có. Khuyến nghị: không bê vào AMIA (là nghiệp vụ nội bộ nhân sự, đã ghi "Omyn/MSC OS"). Nếu chị Lâm muốn có thì làm ở `mscgroup-os`: bảng `quy_cong_doan_so` (ngày, nội dung, thu/chi, người nộp/nhận, trạng thái) + tồn cuối kỳ cộng dồn, giống sổ quỹ AMIA.

## 3. Wiki "Phòng Tài chính - Kế toán" (`wiki/Nh4Cw6IYWipTcFkpibtjv3REp7g`, space 7602480749425495574)

Cây con (đủ 2 cấp):
- COS-FIN-01 Tổng quan phòng · COS-FIN-02 Vai trò và trách nhiệm · COS-FIN-03 Nguyên tắc và chính sách · COS-FIN-06 Ghi nhận KPI · COS-FIN-07 Views, biểu đồ, tự động hoá · COS-FIN-08 Quy trình điều hành vận hành
- COS-FIN-04 Danh mục PROC & thư viện SOP → FIN-PROC-01 Thanh toán · 02 Tạm ứng · 03 Hoàn ứng · 04 Thu tiền và đối soát doanh thu · 05 Sửa/điều chỉnh đơn hàng · 06 Lập kế hoạch vật tư · 07 Mua sắm vật tư/CCDC/TSCĐ · 08 Xuất nhập, điều chuyển, kiểm kê vật tư · 09 Hoàn tiền khách · 10 Khoá sổ tháng · 11 Đối chiếu công nợ phải thu/phải trả · 12 Lập và phát hành báo cáo · 13 Định mức giá vốn dịch vụ · 14 Lập và kiểm soát ngân sách · 15 Mở mới và đóng chi nhánh
- COS-FIN-05 Hệ thống file Base quản lý Data → Base `FIN-RPO-01-2026_Quản Lý Tài Chính_MSC` + trang `FIN-RPO-01-2026_Tổng quan quy trình…` (trang này là khung rỗng: 3 sơ đồ/whiteboard, bảng workflow và SOP chưa điền).
- Đã có tóm tắt cho phần lớn; **chưa đọc (docs/msc-lark mục 8 #13 cũng ghi chưa đọc)**: FIN-PROC-13 (định mức giá vốn), FIN-PROC-14 (ngân sách), FIN-PROC-15 (mở/đóng chi nhánh). Đề nghị dev đọc trước khi làm ngân sách và định mức.
- AMIA OS: có một phần. SOP đã thành mã (0032 hạn mức, 0348 quy trình duyệt nhiều bước, khoá kỳ, ngân sách, đối soát). Chưa có: wiki SOP trong app theo phiên bản/ngày hiệu lực (có `wiki_bai` nhưng chưa nạp FIN-PROC).

## 4. Sheet Báo cáo quỹ ngày (`sheets/JIEasWF5bhZ2sutcIXkjz4qap1e`)

Cấu trúc 52 cột đã ghi đủ ở docs/msc-lark mục 3 (nhóm Thu từ khách / Thu nội bộ / Thu đối tác-NCC / Thu tài chính / Chi cho khách / Chi đối tác-NCC / Chi nội bộ / Tồn quỹ; công thức tồn cuối AY = dư đầu kỳ + dư chưa rõ + tổng thu − tổng chi). Đính chính + bổ sung:
- Tab: `T3.26` (ẩn), `T4.26`, `T5.26`, `T6.26`, `T7.26`, `Sheet2` (danh mục tài khoản, 6 dòng). **Từ T7 người dùng không tạo tab tháng nữa: tab `T7.26` chạy liên tục tháng 7 → 30/11/2026 (khoảng 1.146 dòng, 8 dòng/ngày = 7 tài khoản + 1 dòng TỔNG CỘNG)**; sheet vẫn được sửa tới 25/11 → đang dùng thật.
- Danh mục tài khoản quỹ (Sheet2): TK chi nhánh AVI, TK chi nhánh ADL, TK chi nhánh MSC, TK chuyên thu CN Đà Lạt, TK chuyên thu MSC Group, TK 22ME (tiền mặt/khác). Trong Base FIN-RPO còn thêm TK công ty, TK AVI ngân hàng thứ hai (OCB), "Tổng quỹ".
- Dư đầu kỳ ngày đầu tab T7 nối chéo `='T6.26'!AY…`; các ngày sau lấy tồn cuối ngày trước cùng dòng.
- Có bản 2025 (`MSC.25_BTCCU.KT.QUY`, `sheets/FjZUs4Zr2hboxMtuO2njjPB5pQc`: tab BC quỹ T6.25, T7.25): chỉ để tra cứu quá khứ.
- **Trong Base FIN-RPO bảng `3.3 Báo cáo quỹ` (2.032 dòng) là bản "sống" của sheet này**: cùng bộ cột nhưng các ô Tạm ứng / Hoàn ứng / Đề nghị thanh toán là CÔNG THỨC cộng các phiếu Approval đã duyệt (trạng thái Approved) theo ngày + tài khoản quỹ, không còn nhập tay. Workflow `6.7 Tạo báo cáo quỹ ngày mới` (hẹn giờ) tự sinh dòng mỗi ngày. Dashboard `1.3/1.4 Báo cáo quỹ`.
- AMIA OS: **có một phần**. Có `quy` (mỗi chi nhánh 2 quỹ: tiền mặt + ngân hàng, ràng buộc unique chi_nhanh+loại), `so_quy` sổ cái chỉ thêm, `loai_thu_chi` phẳng (10 dòng), đảo phiếu, chuyển quỹ/nạp/rút, tồn đầu/cuối, xuất Excel, cột ngân hàng (0346), tài khoản ngân hàng nhận tiền theo từng khoản thu (0323). **Thiếu**: (1) nhiều tài khoản ngân hàng/quỹ cho một chi nhánh và quỹ cấp công ty (unique hiện cấm); (2) loại thu/chi 2 tầng theo 7 nhóm của sheet; (3) báo cáo quỹ ngày dạng ngày × tài khoản × khoản (có dòng TỔNG, tồn cuối chạy xuyên tháng); (4) "Dư chưa rõ lý do" thành phiếu điều chỉnh có duyệt; (5) số dư ban đầu từng quỹ + cảnh báo (BeDental gap #1, bảng `quy` đã có cột `so_du_dau` + cờ `da_nhap_so_du` nhưng không thấy màn nhập/cảnh báo trong `tai-chinh/so-quy`); (6) tự sinh dòng hằng ngày/ngưỡng cảnh báo ngày trước chưa chốt (Base có cờ "Ngày trước").

## 5. Sheet "AVI.26_KT.TN_BC doanh thu ngày_260301" (`sheets/XE95sZ0dPhzSsetKhOFj8DGppCh`)

9 tab: `AVI.25.KT.TN_BC Doanh thu ngay` (ẩn, 2025, 15 nghìn dòng), **`AVI.26.KT.TN_BC Doanh thu ngay`** (bản chính 2026) + bản `（Copy）`, `AVI25_KT.TN_BC DT năm` (ẩn), và 4 tab dữ liệu dán từ SalonHero: `Khách đặt lịch`, `Du lieu No`, `Du lieu chi tiet Salon Hero`, `Dữ liệu loại dịch vụ`; `Sheet7` là ô nháp. Thu ngân (chức danh "AVI - Thu ngân") cập nhật hằng ngày; ô vàng điền tay, hướng dẫn ở cột S.
- **Khối đầu**: Năm, Tháng, Ngày cập nhật, Chức danh; bảng CHỈ TIÊU THÁNG / Thực hiện / CHỈ TIÊU NGÀY / Thực hiện / Ngày hoạt động / Tỷ lệ tháng / Tỷ lệ ngày cho 5 chỉ tiêu: Số khách đặt lịch, Số khách đến, Doanh số mỹ phẩm, Doanh số dịch vụ, Doanh số đào tạo. Chỉ tiêu ngày = chỉ tiêu tháng / số ngày hoạt động. Nhiều công thức đang lỗi `#REF!`/`#DIV/0!` ở bản 2026 (thực hiện không còn nối đúng cột).
- **Mỗi ngày là một khối 44 dòng**, cột: Số lượng · Doanh số (theo HĐ · Doanh thu đã nhận · Doanh số theo lượt dịch vụ) · Hình thức thanh toán (Quẹt thẻ · Tiền mặt · Chuyển khoản · Trừ thẻ thành viên) · Khoản khác (Đặt cọc · Thu nợ cũ · Nợ mới) · Tổng thu. Các nhóm dòng:
  - LƯỢT KHÁCH: Khách thực đến · Khách dùng dịch vụ · Khách mua
  - KHÁCH MỚI theo nguồn: Từ trang mạng · Giới thiệu · Cộng tác viên · Tự liên hệ · Chương trình hợp tác · Khác
  - KHÁCH CŨ theo thời gian ngừng: dưới 3 tháng · 3 → 6 tháng · trên 6 tháng
  - LOẠI DỊCH VỤ/SP: Trị liệu – Dược mỹ phẩm · Trị liệu – CNC · Mỹ phẩm · Đào tạo
  - NHÓM BÁN: Tư vấn · Trị liệu · Bác sĩ · Tư vấn trực tuyến · Cộng tác viên · Khác
  - CHÍNH SÁCH BÁN: Thẻ 10/20/30 buổi (CSD) + từng dịch vụ (Peeling Biocell, Laser Thẻ CC plus, Laser Body, Laser nám/tàn nhang, MFU Pro/Basic/Mắt, Meso, Căng chỉ, Tế bào gốc)
- **Công thức**: toàn bộ là `SUMIFS/COUNTIFS` từ tab dán: Doanh số theo HĐ = tổng "Doanh thu sau khi giảm" (cột P) của dòng chi tiết cùng ngày + loại; Thực thu = tiền mặt + CK + quẹt thẻ − đặt cọc − thu nợ (G = I+J+K − M − N); thanh toán lấy từ tab "Du lieu No" (tiền mặt, thẻ, CK, ví, thu nợ trong/trước kỳ, trừ thẻ tiền, VAT); số khách lấy từ "Khách đặt lịch" theo trạng thái. Hàng "Đối chiếu" phía trên mỗi khối: đối chiếu HĐ, quỹ, SalonHero, VAT, tài khoản ngân hàng, nợ phải trả, kiểm soát đặt cọc, nợ phải thu (tên cột, chưa thấy logic cụ thể ở các ô đọc).
- Tab dữ liệu SalonHero: `Du lieu chi tiet Salon Hero` 63 cột (mỗi dòng 1 hạng mục hoá đơn: ngày, mã HĐ, dịch vụ/SP, loại, số lượng, doanh thu trước/sau giảm, giảm giá theo mục/tổng/điểm/voucher, trừ thẻ tiền, loại thanh toán, khách mới/quay lại, nguồn đặt lịch, tối đa 5 nhân viên làm + 5 bán + 5 tư vấn kèm hoa hồng, hoa hồng giới thiệu, đánh giá, nhóm KH, người giới thiệu, chi nhánh, nhóm bán, loại DV). Chứa tên/SĐT khách (không bê).
- Base FIN-RPO đã chuyển phần này thành bảng: `3.1.1 Doanh thu ngày (Vinh)` 11.583 dòng (cột Nhóm/Chỉ tiêu/Chi tiết, ngày, các khoản; công thức), `3.1.2 Khách đặt lịch` 9.352, `3.1.3 Dữ liệu nợ` 514, `3.1.4 Dữ liệu chi tiết` 17.243, `3.1.5 Loại dịch vụ` 79; bản Đà Lạt `3.2.x` (chỉ 11.550 dòng doanh thu, các bảng khác trống). Workflow `6.2 Bổ sung ngày bị thiếu doanh thu`. Dashboard `1.1/1.2 Báo cáo doanh thu CN Đà Lạt/Vinh`.
- AMIA OS: **có một phần, nhưng AMIA là NGUỒN gốc nên không cần "dán dữ liệu"**. `bao-cao` có "Doanh thu theo ngày", theo thu ngân, theo dịch vụ, theo khách, khách còn nợ, hoa hồng. Thiếu: (1) chỉ tiêu tháng/ngày + tỷ lệ hoàn thành cho 5 chỉ tiêu (không có bảng chỉ tiêu doanh thu chi nhánh; grep chỉ thấy chỉ tiêu trong hoa hồng/thu nhập); (2) khách mới theo nguồn, khách cũ theo thời gian ngừng, nhóm bán (tư vấn/trị liệu/bác sĩ/online/CTV), chính sách bán theo gói (nên kiểm từng tab báo cáo xem cột nào đã có); (3) các dòng "Đối chiếu HĐ/quỹ/ngân hàng/đặt cọc/nợ" như một màn đối soát cuối ngày; (4) xuất đúng mẫu tờ thu ngân đang quen.

## 6. Hướng dẫn AMIA OS: Kế toán + Lộ trình IT (docx)

`docx/Vox5dUtFPo2u5vxU8TojnMhspZc` (hướng dẫn, 10/11/2026) mô tả cái AMIA ĐÃ làm: Sổ quỹ (thu/chi/nạp/rút/chuyển, đảo phiếu), hoá đơn đầu vào + khoản chờ hoá đơn + đối chiếu (người đối chiếu khác người ghi), công nợ khách 6 nhóm tuổi + thu nợ, hoá đơn điện tử (xuất Excel, ghi số), hoa hồng tháng + quyết toán, ngân sách tháng theo phân loại chi, duyệt kiểm kê/xử lý vật tư, khoá kỳ kế toán (rà trước khi khoá, mở lại cần Chủ/Kỹ thuật). Mốc cuối tháng ghi: kiểm kê D → đối soát D+2 → chốt công nợ/lương D+5 → khoá D+6.
- Những chỗ nhắc kế toán/thu chi/duyệt: mục 1 (bảng quyền), 2.1–2.5 (hằng ngày), 3 (cuối ngày), 4.1–4.6 (cuối tháng), 5 (lỗi).
- **Điểm lệch với Lark cần xử lý**: mục 1 ghi kế toán KHÔNG duyệt đơn mua/không lập đơn mua; trong Lark KTT duyệt mua sắm. Chưa thấy tài liệu nói về chuỗi duyệt đề xuất (QL → KT chi → KTT → GĐ) dù migration 0348 đã dựng; chưa thấy màn hoàn ứng/tạm ứng trong hướng dẫn kế toán.
- `docx/CwMcdTlx8oQQuPxpj5cjNp6jpAh` (Lộ trình IT 16/11–28/11): phần "Kho + Tài chính" 19/11–23/11, đầu mối chị Dung. Việc nhắc tới: kick-off 19/11; **20/11 trước 12h chị Dung gửi** danh sách NCC (tên, SĐT, MST, công nợ còn lại), tồn kho thực tế, số dư đầu kỳ tiền mặt + từng tài khoản ngân hàng, công nợ khách, quy tắc hoa hồng, định mức vật tư; 21–22/11 nhập/xuất kho thật + đối soát tiền thu cuối ngày; 23/11 kiểm kê thử + đối chiếu sổ kế toán để nghiệm thu (tiêu chí xong: "thu chi các ngày chạy thử ra từ phần mềm, khớp sổ kế toán"). Bảng theo dõi đang để "Chưa làm" cho kick-off và gửi dữ liệu. Ranh giới: AMIA OS = Salon + Marketing/Sale/Kho/CRM + Tài chính bán hàng; MSC OS lo nhân sự/lương/KPI/công việc.
- Hàm ý: "số dư đầu kỳ từng tài khoản" cần có màn nhập (mục 4, thiếu #5) và kết quả nghiệm thu so với sổ Lark nên chạy song song với Base FIN-RPO 3.3 và sheet BCQ.

## 7. Ba sheet "Kế hoạch & KPI" (KTT `VBZrsI1RXhVHGztb9gJjt0k8pff`, KT viên `Q28fsZUtchQCj6txqxtj8V2oped`, KT tổng hợp `RYo4spkOXhM1bHtai1VjzDRgpSc`)

Mỗi sheet 6 tab: Mô tả công việc · Lộ trình 60 ngày (thử việc) · Checklist hàng ngày · KPI 5-Way · Quy tắc giao việc tháng · CTTV (chương trình thử việc). Đây là tài liệu nhân sự + vai trò, giúp biết AI làm gì ở từng bước duyệt.

| Vai | Đầu việc chính (rút gọn) | KPI (trọng số) | Nhịp |
|---|---|---|---|
| Kế toán trưởng | Điều hành quy trình + phân quyền duyệt Approval; soát chứng từ và bút toán (chỉnh bút toán các phiếu có bút toán); DUYỆT BÁO CÁO QUỸ CUỐI NGÀY (tồn cuối = dư đầu + thu − chi); theo dõi công nợ TK 131/331/138 (141 khi áp dụng) và mốc hoàn ứng; BCTC/thuế/báo cáo quản trị theo đơn vị (MSC/AVI/ADL); ngân sách vs thực chi, cảnh báo sớm; đào tạo, chốt lương với Nhân lực và doanh thu với Kinh doanh | BCTC & thuế đúng hạn 20 · chính xác hạch toán 20 · kiểm soát quỹ-dòng tiền 15 (số ngày báo cáo quỹ khớp, dư chưa rõ lý do = 0) · công nợ & tạm ứng đúng hạn 15 · phiếu Approval đúng quy trình/hạn 10 · kiểm soát ngân sách 10 · BSC tháng 10 (mục tiêu 90) | Ngày/Tuần/Tháng/Quý |
| Kế toán viên | Tiếp nhận phiếu Tạm ứng/Hoàn ứng/Đề nghị thanh toán, kiểm số tiền–tài khoản–nội dung với chứng từ gốc (xử lý trong 1 ngày làm việc); chọn hình thức thanh toán + đối tượng; lập Lệnh chi sau khi phiếu duyệt, phối hợp thủ quỹ; cập nhật báo cáo quỹ cuối ngày, xử lý "dư chưa rõ"; theo dõi tạm ứng/công nợ, nhắc trước hạn; nhận hoá đơn đầu vào, lập đề nghị điều chỉnh HĐ bán lẻ và xuất VAT; scan, lưu chứng từ | Xử lý phiếu đúng hạn 25 · chính xác số tiền/TK/nội dung 20 · báo cáo quỹ cuối ngày 15 · tạm ứng & công nợ 10 · hoá đơn/VAT/lưu trữ 10 · báo cáo ngày & nội quy 10 · BSC 10 | Ngày/Tuần |
| Kế toán tổng hợp | Tổng hợp từ KT viên, định khoản, kết chuyển, phân bổ, khoá sổ tháng; đối chiếu doanh thu báo cáo ngày AVI/ADL + hệ thống bán hàng với báo cáo quỹ và tiền về, đối chiếu công nợ; lập BCTC, tờ khai GTGT/TNDN/TNCN, xuất VAT; hạch toán lương/BHXH + chi phí theo ngân sách; TSCĐ/CCDC/vật tư/khấu hao; hướng dẫn KT viên | Hạch toán & khoá sổ 20 · đối chiếu doanh thu-quỹ-công nợ 20 · BCTC/thuế 20 · lương/BHXH/chi phí 10 · tài sản/vật tư 10 · hồ sơ & tuân thủ 10 · BSC 10 | Tuần/Tháng/Quý |

- Checklist ngày (KTT): soát chứng từ + phiếu chờ duyệt (ngày); duyệt báo cáo quỹ cuối ngày (ngày); công nợ + tạm ứng đến hạn (tuần); BCTC/thuế/ngân sách (tháng); gửi báo cáo ngày/tuần cho cấp trên; cập nhật dữ liệu lên phần mềm/Lark; tuân thủ nội quy/BSC. Bản KT viên: xử lý phiếu trong ngày · cập nhật báo cáo quỹ · lập lệnh chi theo phiếu đã duyệt · tạm ứng/công nợ (tuần) · hoá đơn/VAT (tuần).
- KPI dùng thang: Điểm = trọng số × %đạt × 100; ≥90 Xuất sắc, 80–89 Đạt, 70–79 Đạt có điều kiện, <70 Không đạt.
- Quy tắc giao việc tháng: đầu tháng ngày 1–2 giao mục tiêu; thứ Hai hằng tuần giao ban rà phiếu tồn + tạm ứng sắp đến hạn; giữa tháng ~15 sơ kết (đối chiếu quỹ, công nợ luỹ kế); 2 ngày cuối tháng khoá sổ, đối chiếu doanh thu–quỹ–công nợ, chấm BSC; 8 nguyên tắc giao việc (5W1H, gắn KPI, một việc một người, ghi tập trung, ưu tiên, nhắc theo mốc, nghiệm thu, báo sớm).
- AMIA OS: **chưa có** (KPI/công việc/thử việc thuộc MSC OS, đúng ranh giới Lộ trình IT). Chỉ nên lấy từ đây: (a) cảnh báo nhắc cuối ngày "báo cáo quỹ cuối ngày chưa chốt/dư chưa rõ lý do ≠ 0", (b) số liệu cho MSC OS tính KPI: số ngày quỹ khớp, tạm ứng quá hạn, phiếu xử lý đúng hạn.

## 8. Tìm kiếm thêm, các tài sản khác (mục 7 đề bài)

Đã tìm: app Thu chi, Quản lý thu chi, phiếu thu, phiếu chi, đề nghị thanh toán, tạm ứng, hoàn ứng, công nợ, kiểm kê quỹ, đối soát, hoá đơn (+ thu chi, quỹ công đoàn, sổ quỹ, báo cáo quỹ, kế toán, ngân sách, quyết toán, thanh toán, VAT, thuế, tài chính). Không có tài liệu tên "App Quản lý Thu chi". Danh sách tài sản kế toán tìm thấy (đã gạt kịch bản/marketing nhiễu):

| Tài sản | URL | Ghi chú |
|---|---|---|
| **FIN-RPO-01-2026 Quản Lý Tài Chính (Base)** | /wiki/R9UfwUaMgirqv5kA4ABjw2bPpwf | Căn cứ chính, mục 9 |
| FIN-RPO-01-2025 (BaseApp rỗng) | /app/SsD5b0pFSa906as4L5GjMjhipLc | Vỏ BaseApp 0 trang, tham chiếu 15 bảng của Base 2026 |
| Đề nghị tạm ứng (Base, 31 dòng) | /base/DeV5bAfDsaZMkWsf8LIjV5Pdplf | Bản sao riêng, 1 bảng cùng cột 4.13 + "Bút toán ghi nhận thanh toán", "Thời gian duyệt"; có vẻ là bản cũ/nháp |
| TC-OPS-01-2026 Quản lý Tài chính – Cung ứng (Base) | /base/ORqxbZM68aE6oEsGuAjjkWv8pqe | Đã tóm ở docs/msc-lark; khung rỗng |
| MSC26_BNLPT_Đề nghị thanh toán công tác phí (Sheet) | /sheets/DrqnsHgGBh30nCt1rIljFRPXpkf | Mẫu "GIẤY ĐỀ NGHỊ THANH TOÁN" (Kính gửi BLĐ; họ tên, chức vụ, bộ phận, nội dung, thời gian, số tiền + bằng chữ) + bảng kê mỗi người một tab. Chứa tên cá nhân |
| MSC.Định mức vật tư (Sheet) | /sheets/Hw7usxhCuh49UztM1E7jz3OZprc | Định mức vật tư dịch vụ; sửa 23/11 (kho, đã có 0006/0310) |
| Dữ liệu tài chính SalonHero cũ (đối chiếu) | /sheets/UReRsLzjehf455tjSxmjPostpBe | Tab: Theo ngày · Sổ quỹ SalonHero · Hoá đơn 2026 · Tiền thu theo ngày trả · Chi tiết thu nợ; đối chiếu sổ quỹ AMIA đã chuyển |
| Đối chiếu BeDental ↔ AMIA OS (docx) | /docx/AKc4diESfoqcEDxqiTxjqlNnpPh | Mục 4A đã liệt 13 gap tài chính (sổ quỹ, hoá đơn, đối soát) |
| MSC.26_BTCCU.KT.QUY 2025 | /sheets/FjZUs4Zr2hboxMtuO2njjPB5pQc | Báo cáo quỹ 2025 |
| AVI.25_KT.TN_BC doanh thu ngày_251203 | /sheets/Ct7YsM43shrESstAQokjXy7Tphc | Bản 2025 |
| AVI25_PKD.TV_BC Doanh thu ngày T2.2026; MSC26_PKD_Báo cáo doanh thu ngày AVI T10.2026; AVI26_Doanh thu theo dịch vụ | /sheets/PzUnsRPX5hlMCotAMaCj7s3qp1f · /S5NSsjSTyhkCUTt6y6ijW7JhpHh · /Q722sZuC7hIFu7tAkmdju1nGpxH | Báo cáo doanh thu phòng Kinh doanh (kết quả tháng) |
| BOD-PROC-01 Kế hoạch năm/ngân sách · BOD-PROC-04 Capex/Opex approval & spend control | /wiki/YmwpwaCXdirA05kKcKbjNrIHp8e · /wiki/KtMlwcDTKiGNYYkV8kNjbN5rpEd | Quy trình Hội đồng/BOD: duyệt capex/opex; liên quan hạn mức duyệt cấp cao |
| ADL Kiểm kê 25.12.25 · ADL26 Danh sách kiểm kê tài sản CCDC (22.10.2026) | /sheets/O5ENsEqCUhBpSMtD0bnjw7eRpTh · /EtE1sPVFthzUxhtsYPMjIAjlpCh | Kiểm kê (Đà Lạt đóng, dữ liệu lịch sử) |
| Bảng lương / Lương tháng 10.2026 / BM01-03-04 Thưởng hiệu suất T7–T10 / HRM-HRIS-01 Hồ sơ nhân sự_Công lương | /sheets/IUKkseL4Oh2Z5stB3HtjD4Mmpvg · /PYg3s8ht1hpGHDtQlpHjEyIWpNb · /base/V0pVbwdzsaS6VisuvNwjSkWhpIg | Lương: KHÔNG kiểm kê nội dung (nhạy cảm); thuộc MSC OS |
| AVI.PTL.Ngân sách_2602 (PDF) | /file/WFm4bcI8AoqiGvxqfVbjTT6qptd | Ngân sách chi nhánh tháng 2/2026, chưa đọc nội dung |
| MSC25_BCĐ_Đề xuất mức phạt / Danh sách thu tiền phạt (công đoàn) | /sheets/LKYtsdxfBhpTDmtfeyXjh6qJpAS · /WsE1s4TB2hiYSAtddVRjAavHpCg | Quỹ công đoàn (mục 2) |
| Hướng dẫn AMIA OS: Thu ngân và Lễ tân / Thủ kho / Quản lý chi nhánh | /docx/GIDTdosbWowmFoxpADxjwr6dp8h · /HMBMdDDKQoGXkhxcdVpjKmcDpUc · /CJhKdIl38oeCBExTZP6jlPRkpWe | Tài liệu của chính AMIA (có đoạn phiếu thu/chi/duyệt) |

## 9. FIN-RPO-01-2026 – bảng, trường, workflow (căn cứ chính để bê)

URL: https://mscgroupvn.jp.larksuite.com/wiki/R9UfwUaMgirqv5kA4ABjw2bPpwf (base token `Kuh4bTZFxaL52LsNTuvjv8VspFd`). 5 dashboard, 7 workflow (tất cả đang bật). Quy ước: trường `Status`/`Tình trạng` = trạng thái Approval của Lark: Approved / Rejected / Recalled (người lập thu hồi) / Under Review (đang xử lý) / Processing / Canceled / Terminated / Deleted. Các cột `Request No.`, `SourceID`, `Submitted at`, `Completed at`, `Current assignee`, `Requester`, `Approval steps`, `Initiator department` là trường hệ thống của Approval.

### 9.1 Các bảng giao dịch (đang dùng sau 03/09/2026)

| Bảng (số dòng) | Trường nghiệp vụ | Ghi chú dữ liệu |
|---|---|---|
| **4.12 Đề nghị thanh toán** (232; 04/09–26/11; 172 duyệt, 23 từ chối, 22 thu hồi, 15 đang xử lý) | Bộ phận · Đơn vị làm việc (MSC/ADL/AVI) · Khoản chi · Nội dung đề xuất · Số tiền (+bằng chữ) · Ngày cần thanh toán · Hình thức thanh toán (Tiền mặt / Chuyển khoản / Tiền mặt quỹ) · người nhận (số TK, chủ TK, ngân hàng) · Hồ sơ đính kèm / link · Ghi chú | |
| **4.13 Đề nghị tạm ứng** (95; 04/09–18/11) | như trên + Hạng mục chi phí (dòng chi tiết hạng mục + số tiền) · Tổng tiền dự trù · Ngày cần tạm ứng · Khoản chi gồm cả "Công đoàn" | |
| **4.11 Đề nghị hoàn ứng** (28; 03/09–16/11) | Phiếu tạm ứng gốc · Số tiền đã tạm ứng · Số tiền thực tế chi trả · Số tiền thiếu cần thanh toán bổ sung · Cần thanh toán thêm (Có/Không) · Minh chứng thực tế chi trả · Ngày hoàn ứng · tài khoản nhận | |
| **4.14 Đề nghị tạm ứng (có bút toán)** (117) · **4.15 Đề nghị thanh toán (có bút toán)** (430) · **4.16 Phiếu hoàn ứng (có bút toán)** (55) | Cùng bộ trường 4.13/4.12/4.11 **cộng** khối bút toán: Bút toán ghi nhận mua hàng/chi phí (Nợ/Có · Đối tượng · Tài khoản · Số tiền · Chi nhánh, hai dòng Nợ và Có) và Bút toán ghi nhận thanh toán (như trên). 4.16 có thêm Số tiền thừa cần hoàn ứng (nhân viên hoàn lại), Mã tạm ứng (công thức), Loại đề nghị (Phiếu hoàn ứng / Đề nghị hoàn ứng) | Đây là BẢN HOÀN TẤT sau khi kế toán điền bút toán; "Bước đang thực hiện" là người đang giữ. 4.14/4.15 có Mã phiếu, Ngày hoàn thành |
| **3.14 Xếp duyệt lịch chi** (256; ngày dự kiến chi 03/09–30/11) | Mã phiếu · Loại phiếu (Đề nghị thanh toán / Tạm ứng) · Khoản chi · Số tiền · Hình thức chi (CK / Tiền mặt / Tiền mặt quỹ) · Ngày dự kiến chi · Người thực hiện · Trạng thái (Chờ chi / Đã chi) | Sinh TỰ ĐỘNG bởi workflow `6.3` (ĐNTT) và `6.4` (ĐNTU) khi phiếu duyệt xong. **Cả 256 dòng đều "Chờ chi": cột "Đã chi" chưa được dùng**, tức bước chi tiền/đánh dấu đã chi chưa được duy trì ở bảng này (theo dõi ở Approval/sổ quỹ). Hỏi lại kế toán |
| **4.10 Kế hoạch ngân sách** (72; 30/01–05/11; 44 duyệt, 13 từ chối, 9 thu hồi, 6 đang xử lý) | Mã kế hoạch · Kỳ lập ngân sách · Bộ phận · Đơn vị làm việc · Tổng dự toán ngân sách · Link dự toán ngân sách (file) · So với dự toán tháng trước · Lý do tăng/giảm · Ghi chú · Người lập | Người duyệt đang chờ: Trưởng phòng Kinh doanh / Quản lý chi nhánh AVI. Phiếu chi phải dán "Link kế hoạch ngân sách đã duyệt" |

### 9.2 Bảng cũ (đến hết 08–09/2026, không dùng nữa nhưng có lịch sử): 4.8 Lệnh chi tiền (672) và 4.9 Đề nghị duyệt chi (257)

- 4.9: một form chung `Loại đề nghị` ∈ {Thanh toán, Hoàn ứng, Tạm ứng}; Số tiền đề xuất · Số tiền đã tạm ứng · Ngày cần tạm ứng/thanh toán · Phân loại chi phí (Chưa biết rõ / Không có hoá đơn VAT / Có hoá đơn VAT) · Khoản chi (Hoàn trả nội bộ, Trị liệu, DV&TNKH, Bán hàng, Kinh doanh, Hành chính, Hoạt động nội bộ, Mua hàng, Tiếp thị, Hoàn trả khách hàng, Nhân lực, Sửa chữa MTB, CCDC, Hoàn tiền ký quỹ…) · Link kế hoạch ngân sách đã duyệt.
- 4.8 **Lệnh chi tiền** (phiếu chi riêng): Mã phiếu chi · Link đề nghị tạm ứng/hoàn ứng đã duyệt · Đề nghị duyệt chi (mã) · Người yêu cầu · Mục đích chi (Tạm ứng / Thanh toán / Trả nợ / Luân chuyển quỹ – nộp phí quản lý / Hoàn trả / Cho vay nội bộ) · Khoản chi · Tài khoản thanh toán (AVI/ADL/MSC × cá nhân/công ty) · Đơn vị chi · Số tiền + bằng chữ · Họ tên + STK + ngân hàng người nhận · Nội dung chuyển khoản · Thời gian thực hiện chi · Kỳ thanh toán · Định khoản (Nợ TK 141/642/611/311/331/333/334/338/211 · Có TK 111…) · Tài liệu đính kèm. Dữ liệu 23/01–03/09, 597 duyệt.

### 9.3 Bảng báo cáo / thống kê / danh mục

| Bảng | Nội dung |
|---|---|
| 3.3 Báo cáo quỹ (2.032) | Xem mục 4. Cột khoản thu/chi như sheet; TK quỹ: TK CTY, TK CN AVI VCB, TK CN AVI OCB, TK CN MSC, TKCT CN Đà Lạt, TKCT MSC GROUP, TK CN 22ME, "Tổng quỹ". Dòng tổng theo ngày; cờ "Ngày trước" |
| 3.11 Thống kê chi phí phòng ban (120) · 3.12 Thống kê khoản mục chi (242) | Theo ngày báo cáo: phòng ban / khoản mục × loại chi phí (Đề nghị thanh toán, Đề nghị hoàn ứng) × chi phí (công thức cộng phiếu duyệt trong tháng). Workflow hẹn giờ `6.5`, `6.6` |
| 3.13 Kế hoạch tài chính (6) | Theo chi nhánh (ADL/AVI/MSC/OVI) × tháng: Ngân sách · Tổng thu/chi (khách, nội bộ, đối tác-NCC, tài chính) · Chênh lệch · Tiến độ · Cảnh báo (công thức) |
| 3.4 Theo dõi công nợ (10) | Tài khoản (131/331/138) × ngày báo cáo × nhân sự: dư nợ/có đầu kỳ, phát sinh nợ/có trong kỳ (công thức), dư cuối kỳ |
| 3.5 Thuế · 3.6 Kho · 3.7 Kiểm kê · 3.8 Mua hàng · 3.9 Đầu tư · 3.10 Quỹ – Ngân hàng (mỗi bảng 5 dòng, 1 cột "Văn bản") | Chỗ giữ chỗ cho các báo cáo sau |
| 5.1 Option Thời Gian · 5.2 Option Approval (338) · 5.3 Option Báo Cáo (36) | Danh mục dùng chung: Tháng/Năm; **mọi danh sách chọn của phiếu**: Đơn vị làm việc / Đơn vị chi (ADL, AVI, MSC, OVI) · Bộ phận (~20) · Khoản chi / Nhóm ngân sách chi (~16: Mua hàng, Hành chính, Chuyển tiền nội bộ khác chi nhánh, Nhân sự, Marketing–tiếp thị, Pháp lý, Thuế, Đầu tư máy móc thiết bị, Sửa chữa máy móc thiết bị, Vận chuyển, Hoàn tiền trả khách hàng, Dịch vụ khách hàng, Phần mềm–Ứng dụng công nghệ, Nộp phí quản lý, Tài sản, CCDC, Công đoàn…) · Đối tượng (NCC/ngân hàng/cá nhân, hàng trăm giá trị) · Định khoản · Ngân hàng · Mục đích chi · Phân loại chi phí VAT · Hình thức thanh toán |
| 1.1 Quản lý nhân sự (104) | Danh bạ nhân sự gồm chức vụ, phòng ban, tài khoản Lark. Chứa dữ liệu cá nhân nhạy cảm: KHÔNG bê |
| 2.1 Hướng dẫn sử dụng (8) | Khung hướng dẫn (loại Bảng/Dashboard, người phụ trách, tự động/thủ công): nội dung còn trống |
| 4.1 Đề xuất cấp & mua hàng vật tư (0) · 4.2 Đề xuất cấp hoàn hàng (52) · 4.3 Kế hoạch cấp & mua hàng (0) · 4.5 Thông báo cấp hàng (0) · 4.7 Kế hoạch sử dụng vật tư trị liệu_mỹ phẩm (14) | Mảng kho/cung ứng: Đề xuất cấp/hoàn hàng (Nội dung: Cấp hàng/Hoàn hàng; Lý do; bộ phận Trị liệu/Tư vấn; ngày mong muốn nhận; link KH sử dụng đã duyệt); Kế hoạch sử dụng vật tư (Số kế hoạch; Vật tư trị liệu hay Mỹ phẩm bán; Trưởng bộ phận). Thuộc Kho & Mua sắm |
| 4.6 Đề nghị điều chỉnh hoá đơn bán lẻ & xuất hoá đơn VAT (9) | Mã HĐ · Ngày giao dịch · Mã–Tên khách · Thu ngân · Nội dung đề nghị (Xuất HĐ VAT / Điều chỉnh–Thay thế HĐ VAT / Sửa HĐ bán lẻ viết tay / Huỷ HĐ bán lẻ viết tay) · Lý do (sai tên dịch vụ, sai người thực hiện, đổi dịch vụ…) · Hình thức TT · Nội dung sai cần sửa / Nội dung đúng |

### 9.4 Workflow (7, tự động của Base)
`6.1 Gửi thông tin` (chưa rõ nội dung, hẹn giờ) · `6.2 Bổ sung ngày bị thiếu doanh thu` · `6.3 Add vào xếp lịch duyệt chi (ĐNTT)` · `6.4 Add vào xếp lịch duyệt chi (ĐNTU)` · `6.5 Thống kê chi phí khoản chi` · `6.6 Thống kê chi phí phòng ban` · `6.7 Tạo báo cáo quỹ ngày mới`. Dashboard: Doanh thu CN Đà Lạt / CN Vinh · Báo cáo quỹ ×2 · Thống kê chi phí.

### 9.5 Chuỗi duyệt thực tế
Xem mục 0.3 và mục 10. Phân bố phiếu đang chờ (Under Review) theo vai trò: KT tổng hợp, KTT, Hành chính kiêm Thủ quỹ, Hành chính nhân sự, Giám đốc (chỉ phiếu AVI ≥10 triệu), Quản lý chi nhánh AVI/Trưởng phòng Kinh doanh (kế hoạch ngân sách).

## 10. Lark Approval (mục 8 đề bài)

- `approval instances initiated` / `tasks query` chỉ thấy phiếu do tài khoản đang đăng nhập (Trợ Lý CEO) khởi tạo (1 phiếu). **Nhưng `approval instances get --instance-code <mã>` đọc được phiếu của người khác**: cột `SourceID` của các bảng 4.x trong Base FIN-RPO là base64 của chuỗi chứa mã instance dạng UUID (`…:<UUID>-1:…`); giải mã lấy UUID rồi `instances get` trả form, `tasks`, `operation_records` (START, PASS, ROLLBACK_SELECTED + comment, REMOVE_REPEAT, AUTO_PASS, CC kèm người nhận). Đã đọc 25 phiếu, gán user → chức vụ qua Base 1.1 (không ghi tên).
- Chuỗi quan sát (chức vụ; "→" = PASS, `[CC]` = chỉ nhận thông báo):
  - **Đề nghị thanh toán, AVI, ≥10 triệu**: Hành chính nhân sự (lập) → Trưởng phòng Nhân lực → Trưởng phòng Kinh doanh/QL chi nhánh AVI → KT tổng hợp → KTT → Giám đốc → [CC KTT, KTTH] → Hành chính kiêm Thủ quỹ (lệnh chi) → [CC]. Một phiếu lập bởi KTT: bước lặp tự bỏ (REMOVE_REPEAT) → KTTH → GĐ → Thủ quỹ "chi đã lên lệnh" → KTTH.
  - **ĐNTT, AVI, <10 triệu**: Hành chính nhân sự → Trưởng phòng NL → QL chi nhánh AVI → KTTH → KTT → Thủ quỹ ("đã lên lệnh ngân hàng") → KTTH → [CC KTT]. (3/3 phiếu dưới ngưỡng không có Giám đốc.)
  - **ĐNTT, MSC ≥10 triệu**: Trưởng phòng Tiếp thị (lập) → Trưởng phòng → KTTH → KTT → [CC KTTH] → Giám đốc → [CC KTT, KTTH]; có phiếu cc Thủ quỹ. **ĐNTT, MSC <10 triệu**: lập → KTTH (trả "Bổ sung chứng từ") → KTTH → KTT → [CC GĐ] → Thủ quỹ → KTTH.
  - **ĐNTT, ADL**: Thu ngân (lập) → Nhân viên trị liệu (xác nhận) → QL chi nhánh ADL → KTTH → KTT → [CC KTTH, Thủ quỹ] → Giám đốc → [CC]; có phiếu bị trả 2 lần ("sửa lại khoản chi").
  - **Tạm ứng**: AVI: HCNS → Trưởng phòng NL → QL chi nhánh AVI → KTTH → KTT → Giám đốc → [CC Thủ quỹ]; dưới ngưỡng: … → KTT → Thủ quỹ → [CC]. MSC: Trưởng phòng → KTTH → KTT → Giám đốc → [CC] → KTTH (ghi nhận) …
  - **Hoàn ứng**: Trưởng bộ phận Trị liệu/HCNS (lập) → Trưởng bộ phận/Trưởng phòng → QL chi nhánh AVI → KTTH → KTT → Thủ quỹ ("đã nhận tiền vào TK" / "đã lên UNC") → KTTH → [CC KTT]; 3/4 phiếu bị trả về ít nhất 1 lần (KTTH hoặc KTT hoặc Thủ quỹ), lập lại.
  - **Kế hoạch ngân sách**: Trưởng phòng/bộ phận (lập) → KTTH → Giám đốc (3/3 phiếu).
  - **Điều chỉnh HĐ bán lẻ & xuất VAT**: Thu ngân (lập) → KTTH → Giám đốc → [CC QL chi nhánh]; hoặc KT viên (lập) → Thu ngân → KT viên → [CC GĐ, KTT].
  - **Đề xuất cấp/hoàn hàng**: Trưởng bộ phận Trị liệu → KTTH → Giám đốc.
- Giám đốc là bước DUYỆT khi ≥10 triệu (xác nhận bằng bảng `Current assignee` của phiếu đang chờ: Giám đốc chỉ giữ phiếu AVI ≥10 triệu; KTT giữ phiếu dưới ngưỡng; Hành chính nhân sự giữ phiếu AVI ≥10 triệu ở bước đầu). KTT thường được CC ở bước sau cùng.
- Hạn chế: mẫu 25 phiếu (≤3 mỗi nhóm), không đọc được cấu hình định nghĩa (không có quyền admin Approval; `approval approvals search` là thao tác ghi nên không chạy). Còn thiếu phiếu "Hoàn trả khách" và "Mua sắm". Trong Base, trường `Approval steps` gần như null.
- 14 định nghĩa phiếu (dev đã có danh sách trường) khớp với các bảng 4.x: Đề nghị thanh toán / tạm ứng / hoàn ứng (kể cả bản "có bút toán"), Kế hoạch ngân sách, Điều chỉnh HĐ bán lẻ & VAT, Đề xuất cấp/hoàn hàng, Kế hoạch sử dụng vật tư, Lệnh chi tiền (cũ), Đề nghị duyệt chi (cũ).

## 11. So khớp tổng thể với AMIA OS (đã kiểm repo)

Đã có (kiểm src + migrations): sổ quỹ thu/chi/nạp/rút/chuyển, đảo phiếu, xuất Excel; phân loại thu/chi phẳng; tài khoản ngân hàng nhận tiền theo khoản thu; hoá đơn đầu vào + khoản chờ hoá đơn + đối chiếu; công nợ khách 6 nhóm tuổi; công nợ NCC; hoá đơn điện tử/GTGT; khoá kỳ kế toán (`ky_ke_toan`, nhật ký); đối soát bán hàng; ngân sách tháng theo phân loại chi (`ngan_sach_ky`); báo giá đơn mua; de_xuat 5 loại (mua sắm, thanh toán, tạm ứng, hoàn ứng, hoàn khách) + chuỗi duyệt nhiều bước (`quy_trinh_duyet*`, `de_xuat_buoc_duyet`, 0348) + hạn mức duyệt, chức danh tài chính (0032) + người lập ≠ người duyệt/chi; phiếu in thu (`/in/phieu-thu`); hoa hồng; báo cáo bán hàng nhiều tab.

Thiếu hẳn (so với FIN-RPO-01 + sheet): xem 12. Có một phần: báo cáo quỹ ngày, chỉ tiêu doanh thu, chuỗi duyệt theo thực tế, thống kê chi phí theo phòng ban.

## 12. VIỆC CẦN DỰNG (xếp theo mức quan trọng)

**P0 – chặn nghiệm thu "thu chi chạy từ phần mềm, khớp sổ kế toán" (mục tiêu 23/11, đã trễ)**
1. **Chỉnh seed 0348 theo chuỗi thật (mục 10)** — chuỗi 0348 về cơ bản đúng, KHÔNG làm lại, chỉ sửa 5 chỗ: (a) ánh xạ `chuc_danh_tai_chinh`: thêm `ke_toan_tong_hop` + `ke_toan_vien` (hoặc ánh xạ về `ke_toan_chi`/`ke_toan_thu`), "Hành chính kiêm Thủ quỹ" → `thu_quy`, "Quản lý chi nhánh"/"Trưởng bộ phận" là bước riêng; (b) bước chi nhánh thành HAI cấp (Trưởng bộ phận → QL chi nhánh), tổng công ty chỉ Trưởng phòng; (c) thêm sau duyệt: bước **Thủ quỹ chi tiền** (lệnh chi/UNC) và **KT tổng hợp đóng hồ sơ**; (d) trạng thái **"Cần bổ sung chứng từ"** + người duyệt trả về người lập, gửi lại lần N (3/4 phiếu hoàn ứng bị trả về ≥1 lần); (e) CC (thông báo) tách khỏi bước duyệt, bước lặp cùng người tự bỏ qua. Giữ ngưỡng Giám đốc từ 10 triệu (đã thấy: <10tr không có GĐ, ≥10tr có GĐ). Hai chuỗi `hoan_khach` và `mua_sam` không có đối chứng ở Lark nên giữ nguyên chờ chị Dung xác nhận. Thêm chuỗi riêng cho Kế hoạch ngân sách (KTTH → GĐ), Điều chỉnh HĐ/VAT, Đề xuất cấp/hoàn hàng (KTTH → GĐ).
2. **Màn "Số dư đầu kỳ từng quỹ/tài khoản"** (chị Dung gửi 20/11): loại phiếu `so_du_ban_dau`, banner "a/b quỹ đã nhập"; cho phép nhiều tài khoản/quỹ trên một chi nhánh và quỹ cấp công ty (bỏ ràng buộc unique chi_nhanh+loại, hoặc thêm bảng tài khoản quỹ) — Lark đang có 7 tài khoản quỹ.
3. **Báo cáo quỹ ngày** thay sheet `MSC.26_BTCCU.KT.QUY`: ngày × tài khoản quỹ × khoản (7 nhóm: thu từ khách, thu nội bộ, thu đối tác-NCC, thu tài chính, chi cho khách, chi đối tác-NCC, chi nội bộ), dòng TỔNG CỘNG, tồn cuối = tồn đầu + dư chưa rõ + thu − chi chạy xuyên tháng; phiếu "điều chỉnh dư chưa rõ" bắt buộc lý do + duyệt; tự sinh dòng mỗi ngày; xuất Excel đúng mẫu KT đang dùng; cảnh báo ngày trước chưa chốt. Là việc chính của KTT/KT viên hằng ngày.
4. **Bút toán Nợ/Có trên phiếu thanh toán/tạm ứng/hoàn ứng** (2 khối: ghi nhận chi phí, ghi nhận thanh toán; mỗi khối ≥ 2 dòng Nợ/Có · Đối tượng · số hiệu TK · số tiền · chi nhánh) do KT tổng hợp điền ở bước kiểm; kiểm tổng Nợ = tổng Có. Cần danh mục tài khoản kế toán (111, 131, 138, 141, 211, 311, 331, 333, 334, 338, 611, 642 + còn lại theo Thông tư 133) và danh mục Đối tượng. docs/msc-lark mục 8 ghi tài khoản "chờ MSC xác nhận" nên hỏi chị Lâm cho phép cứng hoá.

**P1 – giữ y quy trình Lark để nhân viên quen**
5. **Mở rộng form đề xuất cho giống 3 form Lark mới**: Khoản chi (~16 giá trị, từ 5.2), Bộ phận, Đơn vị làm việc, Phân loại chi phí VAT (3), Hình thức thanh toán (Tiền mặt / Chuyển khoản / Tiền mặt quỹ), Ngày cần thanh toán/tạm ứng, số tiền bằng chữ (tự sinh), tạm ứng có dòng Hạng mục chi phí + Tổng tiền dự trù, hoàn ứng: tiền thực tế chi trả / thiếu cần bổ sung / thừa cần hoàn + minh chứng, nhiều tệp đính kèm (hiện 1 link). Mã phiếu dạng riêng từng loại (ĐNTT/ĐNTU/ĐNHU).
6. **Lệnh chi + Xếp lịch chi**: bảng/ tab "Xếp lịch chi" tự thêm khi phiếu duyệt xong (ngày dự kiến chi, hình thức chi, người thực hiện, Chờ chi → Đã chi) — Lark đang để cả 256 dòng "Chờ chi", nên làm cho đúng (đóng vòng: chi xong tự chuyển Đã chi và ghi sổ quỹ). Phiếu chi riêng có Mã phiếu chi, tài khoản thanh toán, nội dung chuyển khoản; in phiếu chi (BeDental gap #3).
7. **Quy trình "Kế hoạch ngân sách" có duyệt** (mã kế hoạch, kỳ, bộ phận, tổng dự toán, file dự toán, so với tháng trước, lý do tăng/giảm); phiếu chi bắt buộc gắn kế hoạch đã duyệt hoặc ghi vượt ngân sách (đã có `ngan_sach_ky`, thiếu quy trình duyệt và liên kết).
8. **Báo cáo thống kê chi phí**: theo phòng ban và theo khoản mục chi theo tháng (thay Base 3.11/3.12), thêm bảng "Kế hoạch tài chính" (ngân sách vs thực chi, tiến độ, cảnh báo) — dùng `bc_tong_khoan_chi` làm nền.
9. **Báo cáo doanh thu ngày theo mẫu AVI.26.KT.TN**: khối chỉ tiêu tháng/ngày + tỷ lệ cho 5 chỉ tiêu; lượt khách; khách mới theo nguồn; khách cũ theo thời gian ngừng; loại DV/SP; nhóm bán; chính sách bán/gói; các hình thức thanh toán + đặt cọc + thu nợ + nợ mới. Bảng chỉ tiêu theo tháng/chi nhánh nhập ở màn riêng. Dữ liệu lấy thẳng từ hoá đơn/thanh toán (không dán SalonHero).

**P2 – bổ sung**
10. Đề nghị điều chỉnh/thay thế hoá đơn bán lẻ & xuất VAT thành quy trình duyệt (có lý do, nội dung sai/đúng); hiện AMIA có mở lại hoá đơn + lập HĐ GTGT nhưng chưa có form đề nghị + duyệt.
11. Theo dõi công nợ theo tài khoản 131/331/138(/141) với dư đầu/cuối, phát sinh nợ/có theo kỳ (3.4); in/xuất mẫu "Giấy đề nghị thanh toán" (kính gửi BLĐ, bằng chữ) cho phiếu thanh toán/công tác phí.
12. Đưa FIN-PROC (và COS-FIN) vào `wiki_bai` có phiên bản/ngày hiệu lực; đọc FIN-PROC-13/14/15 để làm định mức, ngân sách, mở/đóng chi nhánh.
13. Cảnh báo nhắc cuối ngày/tháng: quỹ chưa chốt, dư chưa rõ ≠ 0, tạm ứng quá hạn, phiếu quá SLA, phiếu thiếu chứng từ (đẩy số cho MSC OS đo KPI).

**Không bê/để chỗ khác**
14. Sổ quỹ công đoàn + quỹ phạt (MSC_BCĐ) → MSC OS nếu cần. Danh sách chia quà (có STK) → không bê. Bảng lương/thưởng, Hồ sơ nhân sự → MSC OS. KPI/lộ trình thử việc 3 vị trí kế toán → MSC OS. Mục kho/cung ứng 4.2/4.7 → Kho & Mua sắm.

## 13. Cần hỏi chị Lâm / KTT trước khi dựng

1. "App Quản lý Thu chi" chị nói là Base FIN-RPO-01 (quản lý tài chính) hay sổ quỹ công đoàn MSC_BCĐ_Thu Chi? Em đoán là FIN-RPO-01.
2. Chuỗi duyệt cho Hoàn trả khách và Mua sắm (không có phiếu trong Base FIN-RPO): có dùng Approval nào khác không? Ngưỡng 10 triệu của Giám đốc là chính thức (quan sát dữ liệu khớp)?
3. Bảng 3.14 Xếp duyệt lịch chi: kế toán có thật sự dùng cột "Đã chi" không? (hiện toàn "Chờ chi".) Quy trình chi tiền thật sau khi phiếu duyệt do ai bấm, ghi ở đâu?
4. Báo cáo quỹ ngày: sau khi AMIA thay, KT còn nhập tay sheet song song bao lâu (nghiệm thu 23/11 đã qua)? Cho phép gọn bớt các cột hiếm dùng (Mua máy CNC, Hoàn trả phí Công đoàn…)?
5. Có cứng hoá hệ tài khoản kế toán (TT133) trong AMIA không, hay chỉ cho kế toán nhập số hiệu TK dạng chữ?
6. Quỹ công đoàn có đưa sang MSC OS hay bỏ?

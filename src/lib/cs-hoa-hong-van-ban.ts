/** Nội dung văn bản chính sách (chép nguyên từ các file chị Lâm gửi 04/11/2026). Tỉ lệ, đơn giá hiện trên màn lấy từ CSDL (cs_hoa_hong, phi_tl_don_gia),
 *  phần chữ dưới đây chỉ là điều khoản. */

export type Muc = { tieuDe: string; doan: string[] };

export const QD_PHI_TRI_LIEU = {
  ten: "Quy định về phí trị liệu đối với bác sĩ và trị liệu viên",
  hieuLuc: "Hiệu lực từ 01/11/2026, áp dụng từ kỳ tính phí tháng 11/2026",
  muc: [
    { tieuDe: "Điều 1. Phạm vi và đối tượng áp dụng", doan: [
      "Quy định đơn giá, cách tính, quy trình xác nhận và chi trả phí trị liệu cho bác sĩ chính thức và trị liệu viên tại chi nhánh AMIA Vinh. Thay thế phần phí trị liệu tại Phụ lục 07 (01.26/ĐX-BKD.PKD/CSB) và các quy định trước đây về phí trị liệu.",
      "Không áp dụng cho bác sĩ mời theo đợt. Phí của bác sĩ mời theo đợt được thỏa thuận bằng văn bản riêng cho từng đợt.",
    ] },
    { tieuDe: "Điều 2. Nguyên tắc tính phí", doan: [
      "Phí trị liệu tính theo ca thực tế và đơn giá tại Phụ lục 01 (bác sĩ) và Phụ lục 02 (trị liệu viên). Một ca là một lần thực hiện một dịch vụ cho một khách hàng, có phiếu dịch vụ trên phần mềm và chữ ký xác nhận của khách hàng. Thẻ, liệu trình tính theo từng buổi.",
      "Bác sĩ chính thức áp dụng chung một đơn giá, không phân biệt bậc. Đơn giá không thay đổi theo giá bán hoặc chương trình khuyến mại.",
      "Mỗi ca chỉ tính phí cho người thực hiện chính. Ca có bác sĩ thực hiện chính: trị liệu viên hỗ trợ tính 15.000 đồng/ca. Ca Exion do trị liệu viên tự thực hiện toàn bộ: tính theo đơn giá Exion của trị liệu viên, bác sĩ không tính phí ca đó.",
      "Dịch vụ chưa có trong Phụ lục 01, Phụ lục 02 chỉ được tính phí khi Giám đốc chi nhánh phê duyệt đơn giá bổ sung bằng văn bản.",
    ] },
    { tieuDe: "Điều 3. Cách tính và trần chi tháng", doan: [
      "Phí tháng của mỗi cá nhân = Tổng (Số đơn vị thực hiện × Đơn giá). Đơn vị tính theo cột ĐVT (lần, buổi, vùng, cc, nốt, cm², điểm, ca).",
      "Trần chi tháng: tổng phí bác sĩ không vượt 3%, tổng phí trị liệu viên không vượt 1% doanh số dịch vụ thực thu của chi nhánh trong tháng. Vượt trần thì phí thực nhận = Phí theo đơn giá × (Trần chi ÷ Tổng phí theo đơn giá).",
      "Ví dụ: bác sĩ làm 10 ca Pico Plus Full và 5 cc HA Volumax, phí = 10 × 120.000 + 5 × 500.000 = 3.700.000 đồng.",
    ] },
    { tieuDe: "Điều 4. Không tính phí, truy thu và bồi thường", doan: [
      "Không tính phí: ca bảo hành, ca làm lại do lỗi kỹ thuật hoặc lỗi thao tác, ca tặng, ca dùng thử, dịch vụ đi kèm tặng, ca không có phiếu dịch vụ hoặc chữ ký khách hàng.",
      "Ca phải khắc phục, bồi thường cho khách hàng do lỗi chuyên môn: truy thu phí ca đó. Bác sĩ chịu tối thiểu 50% giá trị bồi thường khi lỗi do tay nghề, trách nhiệm của bác sĩ; mức cụ thể do Giám đốc chi nhánh quyết định.",
    ] },
    { tieuDe: "Điều 6. Xử lý vi phạm và hiệu lực", doan: [
      "Khai khống ca, ghi sai người thực hiện hoặc số đơn vị: không tính phí ca đó, truy thu phí đã chi và xử lý kỷ luật theo Nội quy lao động.",
      "Quy định có hiệu lực từ ngày 01/11/2026, áp dụng từ kỳ tính phí tháng 11/2026. Phòng HCNS rà soát đơn giá 06 tháng một lần hoặc khi thay đổi bảng giá dịch vụ, trình Giám đốc phê duyệt.",
    ] },
  ] as Muc[],
  quyTrinh: [
    ["1", "Ghi nhận ca", "Nhập phần mềm: dịch vụ, người thực hiện chính, người hỗ trợ, số đơn vị; khách hàng ký phiếu dịch vụ. Bác sĩ, trị liệu viên kiểm tra thông tin trước khi khách ký.", "Lễ tân", "Trong ngày"],
    ["2", "Tổng hợp", "Xuất báo cáo dịch vụ, lập bảng tính tháng của Phụ lục 01 và Phụ lục 02, đối chiếu trần chi.", "Kế toán", "Ngày 01 – 03 tháng sau"],
    ["3", "Xác nhận", "Rà soát ca bảo hành, ca lỗi, ca phụ bác sĩ; ký xác nhận và chịu trách nhiệm về số ca được duyệt.", "Giám đốc chi nhánh", "Ngày 04"],
    ["4", "Thông báo", "Gửi bảng phí cá nhân, tiếp nhận phản hồi sai lệch trong 02 ngày làm việc; cập nhật phụ lục khi có dịch vụ mới.", "Phòng HCNS", "Ngày 05"],
    ["5", "Chi trả", "Chi cùng kỳ lương tháng.", "Kế toán", "Theo kỳ lương"],
  ],
};

export const PL05 = {
  ten: "Phụ lục 05 – Chính sách hoa hồng nhân viên",
  apDung: "Áp dụng cho tư vấn, trị liệu viên, telesale và khối gián tiếp từ ngày 01/11/2026",
  dinhNghia: [
    "Doanh số cá nhân: tổng doanh thu thực thu của các đơn do nhân sự chốt trong tháng, đã được Kế toán đối chiếu với phần mềm và sao kê. Tiền đặt cọc chưa sử dụng dịch vụ chưa được tính; được tính vào tháng khách sử dụng dịch vụ lần đầu hoặc thanh toán đủ.",
    "Doanh số chi nhánh: tổng doanh thu thực thu của chi nhánh trong tháng (từ ngày 01 đến ngày cuối tháng) theo báo cáo Kế toán chốt, không gồm tiền cọc chưa sử dụng dịch vụ.",
    "Giá khuyến mại, giá sàn, giá tối thiểu: theo Bảng giá khách hàng (Phụ lục 02) và Chính sách giá (Phụ lục 03) đang áp dụng; với liệu trình nhiều buổi, so sánh theo giá của cả liệu trình. Giá sàn là giá bán thấp hơn giá khuyến mại nhưng không thấp hơn giá tối thiểu. Không bán dưới giá tối thiểu; đơn bán dưới giá tối thiểu không được tính hoa hồng.",
    "Khách mới: khách chưa phát sinh giao dịch tại chi nhánh trong 12 tháng gần nhất. Khách tự khai thác: có bằng chứng tin nhắn hoặc cuộc gọi từ tài khoản cá nhân của nhân sự với khách, có thời điểm trước khi khách liên hệ kênh của công ty.",
  ],
  quyDinh: [
    "Mỗi đơn hàng chỉ ghi nhận doanh số một lần. Đơn có nhiều người cùng tư vấn: tỷ lệ chia ghi trên phần mềm ngay khi tạo đơn, Giám đốc chi nhánh duyệt trong ngày; không ghi tỷ lệ thì chia đều; một đơn chia tối đa cho 02 người.",
    "Nguồn khách (Khách cũ / Khách Marketing / Tư vấn tự khai thác / Telesale) ghi trên phần mềm ngay khi tạo hồ sơ khách, không sửa sau khi đơn đã chốt. Tranh chấp gửi Giám đốc chi nhánh trong 03 ngày làm việc; căn cứ là thời điểm ghi nhận đầu tiên trên phần mềm.",
    "Thẻ tiền tính hoa hồng một lần khi thu tiền thẻ. Trả góp, công nợ tính theo tiền thực thu trong tháng. Hoàn tiền, hủy thẻ, hủy dịch vụ: thu hồi hoa hồng đã nhận vào kỳ lương tháng phát sinh.",
    "Nhân sự nghỉ việc được nhận hoa hồng các đơn đã thu đủ tiền trước ngày nghỉ việc.",
    "Không thuộc Phụ lục này: phí trị liệu (Phụ lục 07, 09); thưởng sản xuất video, nội dung Marketing (quy định riêng).",
  ],
  viDuTuVan: "Tư vấn A có chỉ tiêu 400.000.000đ, bán 480.000.000đ gồm: 255.000.000đ dịch vụ giá khuyến mại × 1,5% = 3.825.000đ; 50.000.000đ dịch vụ giá sàn × 0,7% = 350.000đ; 100.000.000đ thẻ Amia Gold đúng giá khuyến mại × 2% = 2.000.000đ; 45.000.000đ gói Ichi Lift Therapy dưới giá khuyến mại × 1% = 450.000đ; 30.000.000đ mỹ phẩm × 3% = 900.000đ; vượt chỉ tiêu (480.000.000 − 400.000.000) × 3% = 2.400.000đ. Tổng 9.925.000đ.",
  telesale: "Doanh số telesale mang về: doanh thu thực thu của khách mới và khách cũ từ các đơn phát sinh trong 30 ngày kể từ lịch hẹn do telesale đặt trên phần mềm. Tiền cọc telesale thu trước được tính khi khách sử dụng dịch vụ. Tỷ lệ tháng = (phần doanh số chi nhánh đến 1,8 tỷ × tỷ lệ bậc 1 + phần từ 1,8 đến 2,8 tỷ × tỷ lệ bậc 2 + phần trên 2,8 tỷ × tỷ lệ bậc 3) ÷ doanh số chi nhánh. Hoa hồng = Doanh số telesale mang về × Tỷ lệ tháng.",
  viDuTelesale: [
    "Chi nhánh 1.500.000.000đ, telesale mang về 500.000.000đ: tỷ lệ tháng 0,5%; hoa hồng = 2.500.000đ.",
    "Chi nhánh 2.400.000.000đ, telesale mang về 600.000.000đ: tỷ lệ tháng = (1.800.000.000 × 0,5% + 600.000.000 × 0,8%) ÷ 2.400.000.000 = 0,575%; hoa hồng = 3.450.000đ.",
  ],
  gianTiep: "Áp dụng cho: nhân viên Nhân lực & Phát triển, Tài chính & Cung ứng (kế toán), Marketing (quản trị quảng cáo, nội dung) và quản lý các bộ phận này. Điều kiện: làm đủ công tháng, đạt KPI tháng, không vi phạm kỷ luật trong tháng. Doanh số chi nhánh theo số Kế toán chốt.",
  thiHanh: [
    "Kế toán gửi bảng hoa hồng, thưởng nháp trước ngày 05 tháng sau. Nhân sự có ý kiến trong 03 ngày làm việc; quá thời hạn được hiểu là đồng ý.",
    "Giám đốc chi nhánh và Kế toán chịu trách nhiệm kiểm soát doanh số, nguồn khách, tỷ lệ chia đơn làm căn cứ chi trả.",
    "Phụ lục có hiệu lực từ ngày 01/11/2026, thay thế Phụ lục 05 Quý II/2026 và các quy định trước đây về hoa hồng, thưởng bán hàng của nhân viên.",
  ],
};

export const PL06 = {
  ten: "Phụ lục 06 – Chính sách hoa hồng quản lý",
  apDung: "Áp dụng cho Giám đốc chi nhánh, Trưởng phòng Marketing từ ngày 01/11/2026",
  dinhNghia: [
    "Doanh số chi nhánh: tổng doanh thu thực thu của chi nhánh trong tháng (từ ngày 01 đến ngày cuối tháng) theo báo cáo Kế toán chốt, không gồm tiền cọc chưa sử dụng dịch vụ.",
    "Giá sàn: giá bán thấp hơn giá khuyến mại nhưng không thấp hơn giá tối thiểu, theo Bảng giá khách hàng và Chính sách giá đang áp dụng.",
    "Doanh số tính hoa hồng = Doanh số chi nhánh − 50% doanh thu bán giá sàn.",
    "Doanh số Marketing mang về: doanh thu thực thu của khách mới và khách cũ đến từ chiến dịch Marketing trong tháng, ghi nguồn Marketing trên phần mềm.",
  ],
  quyDinh: [
    "Quản lý hưởng hoa hồng trên doanh số của đơn vị phụ trách theo Phụ lục này. Đơn quản lý tự bán đã nằm trong doanh số chi nhánh, không tính hoa hồng nhân viên.",
    "Hoa hồng tính theo từng phần doanh số: mỗi tỷ lệ chỉ áp dụng cho phần doanh số nằm trong mức đó, sau đó cộng lại. Phần doanh số trên 2,8 tỷ hưởng tỷ lệ cao nhất.",
  ],
  viDu: [
    ["Doanh số tính hoa hồng", "1.500.000.000 − 50% × 150.000.000 = 1.425.000.000đ", "3.200.000.000 − 50% × 320.000.000 = 3.040.000.000đ"],
    ["Giám đốc chi nhánh", "1.425.000.000 × 0,8% = 11.400.000đ", "1.800.000.000 × 0,8% + 1.000.000.000 × 2% + 240.000.000 × 3% = 41.600.000đ"],
    ["Trưởng phòng Marketing", "Tỷ lệ tháng 0,5% · 700.000.000 × 0,5% = 3.500.000đ", "Tỷ lệ tháng 0,78125% · 1.600.000.000 × 0,78125% = 12.500.000đ"],
  ],
  thiHanh: [
    "Kế toán tính hoa hồng quản lý cùng kỳ lương tháng, căn cứ doanh số chi nhánh, doanh thu bán giá sàn, doanh số Marketing mang về và chi phí quảng cáo đã chốt.",
    "Phụ lục có hiệu lực từ ngày 01/11/2026, thay thế Phụ lục 06 Quý II/2026.",
  ],
};

/** Giả định của sheet "Bảng tham khảo" trong PL05/PL06 (số minh họa). */
export const GIA_DINH_THAM_KHAO = { giaSan: 0.1, mkt: 0.5, telesale: 0.3, qc: 0.12, dsTuVan: 0.25, chiTieuTuVan: 0.22, tuVanKm: 0.6, tuVanGoiDungGia: 0.2, dsTlv: 0.03 };
export const MOC_THAM_KHAO = [1_240_000_000, 1_500_000_000, 1_800_000_000, 2_000_000_000, 2_400_000_000, 2_800_000_000, 3_000_000_000, 4_000_000_000];

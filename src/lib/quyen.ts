// Vai trò và quyền. Một nơi duy nhất: menu, trang, Server Action đều hỏi ở đây.
// ASSUMPTION: ma trận quyền dưới đây là đề xuất mặc định theo vai trò SalonHero đang dùng (Quản lý / Leader, Thu ngân, Thủ kho, Bác sĩ, Kế toán, Tư vấn, Marketing, Nhà đầu tư) + Lễ tân + Chuyên viên trị liệu.
// Chủ chốt lại thì chỉ sửa bảng này.

import { ganSalonHero } from "@/lib/quyen-salonhero";

export const VAI_TRO = ["chu", "ky_thuat", "quan_ly", "nhan_su", "le_tan", "thu_ngan", "tu_van", "bac_si", "ktv", "thu_kho", "ke_toan", "marketing", "nha_dau_tu", "nhan_vien", "chi_xem"] as const;
export type VaiTro = (typeof VAI_TRO)[number];

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  chu: "Chủ",
  ky_thuat: "Kỹ thuật",
  quan_ly: "Quản lý / Leader",
  nhan_su: "Nhân sự (HCNS)",
  le_tan: "Lễ tân",
  thu_ngan: "Thu ngân",
  tu_van: "Tư vấn",
  bac_si: "Bác sĩ",
  ktv: "Chuyên viên trị liệu",
  thu_kho: "Thủ kho",
  ke_toan: "Kế toán",
  marketing: "Marketing",
  nha_dau_tu: "Nhà đầu tư",
  nhan_vien: "Nhân viên",
  chi_xem: "Chỉ xem (giám sát)",
};

export type Quyen =
  | "khach.xem" | "khach.sua" | "khach.nhap" | "khach.xuat" | "khach.sdt" | "khach.email"
  | "hoso.xem" | "hoso.sua" | "anh.xem" | "anh.them"
  | "lich.xem" | "lich.sua" | "lich.xuat"
  | "ban.xem" | "ban.tao" | "ban.huy" | "ban.sua" | "ban.giamgia" | "ban.sua_khoa" | "ban.toan_co_so" | "ban.tip" | "no.thu" | "no.xoa" | "hd.vat"
  | "the.xem" | "the.thuchien" | "the.dieuchinh"
  | "danhmuc.xem" | "danhmuc.sua"
  | "kho.xem" | "kho.nhap" | "kho.duyet" | "ky.khoa" | "ky.mo_lai"
  | "phieu.xem" | "phieu.chidinh" | "phieu.cap" | "phieu.nhan" | "phieu.doichieu"
  | "baocao.xem" | "baocao.tien"
  | "quy.xem" | "quy.ghi" | "quy.dao"
  | "mua.xem" | "mua.tao" | "mua.duyet"
  | "viec.tatca" | "dexuat.duyet" | "wiki.sua"
  | "noibo.dung"
  | "mkt.xem" | "mkt.sua" | "mkt.duyet" | "lead.xu_ly" | "vb.xem" | "vb.soan" | "vb.duyet"
  | "cong.xem" | "cong.sua" | "nghi.duyet" | "nghi.duyet_bgd" | "luong.xem" | "luong.sua" | "luong.duyet"
  | "nhanvien.quanly" | "hr.hoso" | "qt.sua"
  | "kn.ghi" | "kn.duyet" | "bc.bao" | "bc.xu_ly"
  | "tongquan.xem"
  | "hethong.phanquyen";

// Quyền quản trị hệ thống (tài khoản, vai trò, phân quyền, cài đặt) chỉ Chủ và Kỹ thuật nắm; không nằm trong TAT_CA của Quản lý / Leader.
// Chủ (chị Lâm chốt lại 28/10/2026, trước đó bỏ 26/10): người sở hữu, nhìn toàn cảnh điều hành và tự phân quyền, cài đặt hệ thống. Khác Kỹ thuật ở chỗ KHÔNG được bỏ qua quy tắc "người lập không tự duyệt".
const TAT_CA: Quyen[] = [
  "khach.xem", "khach.sua", "khach.nhap", "khach.xuat", "khach.sdt", "khach.email", "lich.xuat", "ban.giamgia", "ban.sua_khoa", "ban.toan_co_so", "ban.tip", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "lich.sua",
  "ban.xem", "ban.tao", "ban.huy", "ban.sua", "no.thu", "hd.vat", "the.xem", "the.thuchien", "the.dieuchinh", "danhmuc.xem", "danhmuc.sua",
  "kho.xem", "kho.nhap", "kho.duyet", "ky.khoa", "ky.mo_lai", "phieu.xem", "phieu.chidinh", "phieu.cap", "phieu.nhan", "phieu.doichieu", "baocao.xem", "baocao.tien", "nhanvien.quanly", "hr.hoso", "qt.sua", "kn.ghi", "kn.duyet", "bc.bao", "bc.xu_ly", "tongquan.xem", "quy.xem", "quy.ghi", "quy.dao", "mua.xem", "mua.tao", "mua.duyet", "viec.tatca", "dexuat.duyet", "wiki.sua",
  "cong.xem", "cong.sua", "nghi.duyet", "nghi.duyet_bgd", "luong.xem", "luong.sua", "luong.duyet", "noibo.dung",
  "mkt.xem", "mkt.sua", "mkt.duyet", "lead.xu_ly", "vb.xem", "vb.soan", "vb.duyet",
];

const MAC_DINH_CU: Record<VaiTro, Quyen[]> = {
  // "no.xoa" = Xoá nợ / điều chỉnh nợ: SalonHero reportCustomer.customerDebt.delete chỉ Chủ có (câu 3, 03/11/2026). Không nằm trong TAT_CA nên Quản lý và quyền riêng không cấp được.
  // "quy.dao" = Đảo (xoá) phiếu sổ quỹ: SalonHero reportFinancial.cost.delete chỉ Kế toán + Chủ (nối đợt 2, 03/11/2026). Có trong TAT_CA (Kỹ thuật cấp riêng được) nhưng vai có bản SalonHero lấy theo ma trận → Quản lý, Thu ngân… không có, Kế toán có.
  chu: [...TAT_CA, "hethong.phanquyen", "no.xoa"],
  ky_thuat: [...TAT_CA, "hethong.phanquyen", "no.xoa"],
  quan_ly: TAT_CA,
  nhan_su: ["tongquan.xem", "khach.xem", "khach.sdt", "khach.email", "lich.xem", "danhmuc.xem", "baocao.xem", "noibo.dung", "viec.tatca", "cong.xem", "cong.sua", "nghi.duyet", "luong.xem", "luong.sua", "hr.hoso", "vb.xem", "vb.soan", "mkt.xem"],
  le_tan: ["khach.xem", "khach.sdt", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "the.xem", "danhmuc.xem", "noibo.dung", "lead.xu_ly", "vb.xem", "vb.soan", "kn.ghi", "bc.bao"],
  thu_ngan: ["tongquan.xem", "khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "ban.tao", "no.thu", "hd.vat", "the.xem", "danhmuc.xem", "baocao.xem", "baocao.tien", "noibo.dung", "vb.xem", "vb.soan", "kn.ghi", "bc.bao"], // SalonHero: Thu ngân đặt/sửa lịch (booking create+update)
  tu_van: ["khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "ban.tao", "the.xem", "danhmuc.xem", "noibo.dung", "lead.xu_ly", "vb.xem", "vb.soan", "kn.ghi", "bc.bao"],
  bac_si: ["khach.xem", "khach.sua", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.chidinh", "noibo.dung", "bc.bao", "bc.xu_ly"], // SalonHero: Bác sĩ thêm/sửa khách (customer create+update)
  ktv: ["khach.xem", "khach.sua", "hoso.xem", "anh.xem", "anh.them", "lich.xem", "lich.sua", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.nhan", "noibo.dung", "bc.bao"], // SalonHero: Nhân viên/Tư vấn đặt lịch và thêm/sửa khách (booking+customer create/update)
  thu_kho: ["tongquan.xem", "danhmuc.xem", "kho.xem", "kho.nhap", "phieu.xem", "phieu.cap", "phieu.doichieu", "mua.xem", "mua.tao", "noibo.dung"],
  ke_toan: ["tongquan.xem", "khach.xem", "khach.sua", "lich.xem", "ban.xem", "no.thu", "hd.vat", "danhmuc.xem", "kho.xem", "kho.duyet", "ky.khoa", "baocao.xem", "baocao.tien", "phieu.xem", "quy.xem", "quy.ghi", "mua.xem", "cong.xem", "luong.xem", "luong.sua", "noibo.dung", "vb.xem"], // SalonHero: Kế toán xem lịch, thêm/sửa khách (booking read, customer create+update)
  marketing: ["tongquan.xem", "khach.xem", "khach.sua", "lich.xem", "danhmuc.xem", "baocao.xem", "noibo.dung", "mkt.xem", "mkt.sua", "lead.xu_ly", "vb.xem", "vb.soan"], // SalonHero: Marketing CSKH thêm/sửa khách (customer create+update)
  nha_dau_tu: ["tongquan.xem", "baocao.xem", "baocao.tien"],
  nhan_vien: ["noibo.dung"],
  // Chỉ xem (chị Lâm 9/11/2026, tài khoản anh Tú hcns@mscvn.com, giống vai "chi_xem" bên MSC OS): xem mọi màn, không ghi được gì.
  // Chỉ có quyền XEM nên mọi hành động ghi (đòi quyền sửa) tự bị từ chối; thêm lưới ở auth.ts (kiemQuyen/kiemNoiBo) và middleware (API ghi). Không có lương, không quản trị.
  chi_xem: ["tongquan.xem", "khach.xem", "khach.sdt", "khach.email", "hoso.xem", "anh.xem", "lich.xem", "ban.xem", "the.xem", "danhmuc.xem", "kho.xem", "phieu.xem", "baocao.xem", "baocao.tien", "quy.xem", "mua.xem", "noibo.dung", "viec.tatca", "mkt.xem", "vb.xem", "cong.xem"],
};
/** Quyền vai "Chỉ xem" còn được dùng TRONG Server Action (đọc, tìm kiếm). Quyền khác trong action đều bị chặn. */
export const QUYEN_DOC: readonly Quyen[] = ["tongquan.xem", "khach.xem", "khach.sdt", "khach.email", "hoso.xem", "anh.xem", "lich.xem", "ban.xem", "the.xem", "danhmuc.xem", "kho.xem", "phieu.xem", "baocao.xem", "baocao.tien", "quy.xem", "mua.xem", "viec.tatca", "mkt.xem", "vb.xem", "cong.xem"];

/** Chị Lâm 29/10: quyền các vai có bản SalonHero lấy THEO ma trận SalonHero (quyen-salonhero.ts); vai riêng của AMIA giữ mặc định. */
export const QUYEN_THEO_VAI_TRO = Object.fromEntries((Object.keys(MAC_DINH_CU) as VaiTro[]).map((v) => [v, ganSalonHero(v, MAC_DINH_CU[v])])) as Record<VaiTro, Quyen[]>;

export const QUYEN_MAC_DINH = (vt: VaiTro): Quyen[] => QUYEN_THEO_VAI_TRO[vt];

/** Tập quyền thật của một người: Chủ và Kỹ thuật luôn đủ; người khác theo danh sách riêng (nếu Kỹ thuật đã đặt) hoặc mặc định của vai trò.
 *  "hethong.phanquyen" không bao giờ cấp được cho vai trò khác Chủ và Kỹ thuật, dù danh sách riêng có ghi. */
export function quyenHieuLuc(vt: VaiTro, rieng: readonly string[] | null | undefined): Quyen[] {
  if (vt === "ky_thuat" || vt === "chu") return QUYEN_THEO_VAI_TRO[vt];
  const goc = rieng ? TAT_CA.filter((q) => rieng.includes(q)) : QUYEN_THEO_VAI_TRO[vt];
  return goc.filter((q) => q !== "hethong.phanquyen");
}

export type CoQuyen = { vaiTro: VaiTro; quyen: readonly Quyen[] };
export const coQuyen = (nd: CoQuyen | null | undefined, q: Quyen) => !!nd && nd.quyen.includes(q);
export const laVaiTro = (v: unknown): v is VaiTro => (VAI_TRO as readonly unknown[]).includes(v);

/** Danh sách quyền Kỹ thuật được tích chọn cho từng người (không gồm quyền hệ thống), gom theo nhóm cho dễ đọc. */
export const NHOM_QUYEN: { nhom: string; muc: { ma: Quyen; nhan: string }[] }[] = [
  { nhom: "Tổng quan", muc: [{ ma: "tongquan.xem", nhan: "Có dashboard (Tổng quan)" }] },
  { nhom: "Khách hàng", muc: [{ ma: "khach.xem", nhan: "Xem khách" }, { ma: "khach.sua", nhan: "Thêm / sửa khách" }, { ma: "khach.nhap", nhan: "Nhập Excel khách" }, { ma: "khach.xuat", nhan: "Xuất Excel khách" }, { ma: "khach.sdt", nhan: "Xem SĐT khách" }, { ma: "khach.email", nhan: "Xem email khách" }, { ma: "hoso.xem", nhan: "Xem hồ sơ điều trị" }, { ma: "hoso.sua", nhan: "Ghi hồ sơ điều trị" }, { ma: "anh.xem", nhan: "Xem ảnh khách" }, { ma: "anh.them", nhan: "Thêm ảnh khách" }] },
  { nhom: "Lịch hẹn", muc: [{ ma: "lich.xem", nhan: "Xem lịch" }, { ma: "lich.sua", nhan: "Đặt / đổi / huỷ lịch" }, { ma: "lich.xuat", nhan: "Xuất Excel lịch hẹn" }] },
  { nhom: "Bán hàng", muc: [{ ma: "ban.xem", nhan: "Xem hoá đơn" }, { ma: "ban.tao", nhan: "Bán hàng (thu ngân)" }, { ma: "ban.huy", nhan: "Huỷ hoá đơn" }, { ma: "ban.sua", nhan: "Sửa hoá đơn đã chốt (mở lại về nháp)" }, { ma: "ban.giamgia", nhan: "Giảm giá khi bán" }, { ma: "ban.sua_khoa", nhan: "Sửa hoá đơn đã khoá" }, { ma: "ban.toan_co_so", nhan: "Xem hoá đơn toàn cơ sở" }, { ma: "ban.tip", nhan: "Nhập tiền tip" }, { ma: "no.thu", nhan: "Thu nợ" }, { ma: "hd.vat", nhan: "Ghi nhận đã xuất hoá đơn VAT" }] },
  { nhom: "Thẻ liệu trình", muc: [{ ma: "the.xem", nhan: "Xem thẻ" }, { ma: "the.thuchien", nhan: "Thực hiện buổi" }, { ma: "the.dieuchinh", nhan: "Điều chỉnh / cấp thẻ tay" }] },
  { nhom: "Vật tư & kho", muc: [{ ma: "phieu.xem", nhan: "Xem phiếu cấp vật tư" }, { ma: "phieu.chidinh", nhan: "Bác sĩ chỉ định vật tư" }, { ma: "phieu.cap", nhan: "Kho cấp vật tư" }, { ma: "phieu.nhan", nhan: "Chuyên viên trị liệu nhận vật tư" }, { ma: "phieu.doichieu", nhan: "Đối chiếu phiếu" }, { ma: "kho.xem", nhan: "Xem kho" }, { ma: "kho.nhap", nhan: "Nhập / kiểm kho" }, { ma: "kho.duyet", nhan: "Duyệt kiểm kê, xử lý vật tư, hậu kiểm xuất khẩn cấp" }] },
  { nhom: "Mua hàng", muc: [{ ma: "mua.xem", nhan: "Xem đơn mua, nhà cung cấp, công nợ" }, { ma: "mua.tao", nhan: "Lập đơn mua, nhà cung cấp" }, { ma: "mua.duyet", nhan: "Duyệt / từ chối đơn mua" }] },
  { nhom: "Nơi làm việc", muc: [{ ma: "noibo.dung", nhan: "Dùng Nơi làm việc (việc, chấm công, đề xuất, phiếu của tôi)" }, { ma: "viec.tatca", nhan: "Xem việc và báo cáo ngày của mọi người" }, { ma: "dexuat.duyet", nhan: "Duyệt / từ chối đề xuất" }, { ma: "wiki.sua", nhan: "Viết, sửa Wiki công ty" }, { ma: "qt.sua", nhan: "Cập nhật tiến độ Khung vận hành Kinh doanh (giao việc, hạn, trạng thái)" }] },
  { nhom: "Nhân sự", muc: [{ ma: "cong.xem", nhan: "Xem chấm công, lịch ca, phiếu của mọi người" }, { ma: "cong.sua", nhan: "Phân ca, nhập công tay, khoá tháng, chỉnh phép" }, { ma: "nghi.duyet", nhan: "Duyệt phiếu nghỉ, tăng ca, điều chỉnh công" }, { ma: "nghi.duyet_bgd", nhan: "Duyệt nghỉ từ 4 ngày (Ban Giám đốc)" }, { ma: "luong.xem", nhan: "Xem bảng lương và điều kiện lương" }, { ma: "luong.sua", nhan: "Lập kỳ lương, sửa điều kiện lương, cộng/trừ" }, { ma: "luong.duyet", nhan: "Duyệt kỳ lương" }, { ma: "hr.hoso", nhan: "Hồ sơ nhân sự đầy đủ của mọi người (CCCD, thuế, BHXH, ngân hàng, giấy tờ), nghỉ việc, danh mục phòng ban" }] },
  { nhom: "Khiếu nại & biến chứng", muc: [{ ma: "kn.ghi", nhan: "Ghi nhận và xử lý khiếu nại, ghi làm lại bảo hành" }, { ma: "kn.duyet", nhan: "Duyệt phương án khiếu nại có chi phí, xem mọi vụ việc" }, { ma: "bc.bao", nhan: "Báo dấu hiệu bất thường / biến chứng" }, { ma: "bc.xu_ly", nhan: "Bác sĩ: khám, chẩn đoán, biên bản biến chứng" }] },
  { nhom: "Marketing", muc: [{ ma: "mkt.xem", nhan: "Xem chiến dịch, quảng cáo, nội dung, báo cáo marketing" }, { ma: "mkt.sua", nhan: "Tạo/sửa chiến dịch, quảng cáo, nội dung, link, đối tác" }, { ma: "mkt.duyet", nhan: "Duyệt chiến dịch và nội dung" }, { ma: "lead.xu_ly", nhan: "Nhận và xử lý lead (liên hệ, chuyển thành khách)" }] },
  { nhom: "Văn bản & Hợp đồng", muc: [{ ma: "vb.xem", nhan: "Xem sổ văn bản, hợp đồng, đồng ý dùng ảnh" }, { ma: "vb.soan", nhan: "Soạn, nộp duyệt, ghi nhận đã ký, lưu bản điện tử" }, { ma: "vb.duyet", nhan: "Duyệt văn bản (vượt ngưỡng chi nhánh thì cần người không gắn chi nhánh)" }] },
  { nhom: "Sổ quỹ", muc: [{ ma: "quy.xem", nhan: "Xem sổ quỹ thu/chi" }, { ma: "quy.ghi", nhan: "Ghi thu/chi, nạp/rút, chuyển quỹ" }, { ma: "quy.dao", nhan: "Đảo (xoá) phiếu thu/chi — như SalonHero chỉ Kế toán và Chủ" }, { ma: "ky.khoa", nhan: "Khoá kỳ kế toán theo tháng" }, { ma: "ky.mo_lai", nhan: "Mở lại kỳ đã khoá (phải ghi lý do)" }] },
  { nhom: "Danh mục & báo cáo", muc: [{ ma: "danhmuc.xem", nhan: "Xem danh mục" }, { ma: "danhmuc.sua", nhan: "Sửa danh mục" }, { ma: "baocao.xem", nhan: "Xem báo cáo" }, { ma: "baocao.tien", nhan: "Xem số tiền (doanh thu, hoa hồng)" }, { ma: "nhanvien.quanly", nhan: "Sửa chi nhánh" }] },
];

// Vai trò và quyền. Một nơi duy nhất: menu, trang, Server Action đều hỏi ở đây.
// ASSUMPTION: ma trận quyền dưới đây là đề xuất mặc định theo vai trò SalonHero đang dùng (Quản lý / Leader, Thu ngân, Thủ kho, Bác sĩ, Kế toán, Tư vấn, Marketing, Nhà đầu tư) + Lễ tân + KTV.
// Chủ chốt lại thì chỉ sửa bảng này.

export const VAI_TRO = ["ky_thuat", "quan_ly", "le_tan", "thu_ngan", "tu_van", "bac_si", "ktv", "thu_kho", "ke_toan", "marketing", "nha_dau_tu"] as const;
export type VaiTro = (typeof VAI_TRO)[number];

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  ky_thuat: "Kỹ thuật",
  quan_ly: "Quản lý / Leader",
  le_tan: "Lễ tân",
  thu_ngan: "Thu ngân",
  tu_van: "Tư vấn",
  bac_si: "Bác sĩ",
  ktv: "Kỹ thuật viên",
  thu_kho: "Thủ kho",
  ke_toan: "Kế toán",
  marketing: "Marketing",
  nha_dau_tu: "Nhà đầu tư",
};

export type Quyen =
  | "khach.xem" | "khach.sua" | "khach.nhap"
  | "hoso.xem" | "hoso.sua" | "anh.xem" | "anh.them"
  | "lich.xem" | "lich.sua"
  | "ban.xem" | "ban.tao" | "ban.huy" | "no.thu"
  | "the.xem" | "the.thuchien" | "the.dieuchinh"
  | "danhmuc.xem" | "danhmuc.sua"
  | "kho.xem" | "kho.nhap"
  | "phieu.xem" | "phieu.chidinh" | "phieu.cap" | "phieu.nhan" | "phieu.doichieu"
  | "baocao.xem" | "baocao.tien"
  | "quy.xem" | "quy.ghi"
  | "mua.xem" | "mua.tao" | "mua.duyet"
  | "nhanvien.quanly"
  | "tongquan.xem"
  | "hethong.phanquyen";

// Quyền quản trị hệ thống (tài khoản, vai trò, phân quyền) chỉ vai trò Kỹ thuật nắm (chủ chốt 26/10/2026) — không nằm trong TAT_CA của Quản lý / Leader (vai trò cao nhất sau Kỹ thuật; bỏ Chủ và Giám đốc 26/10/2026).
const TAT_CA: Quyen[] = [
  "khach.xem", "khach.sua", "khach.nhap", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "lich.sua",
  "ban.xem", "ban.tao", "ban.huy", "no.thu", "the.xem", "the.thuchien", "the.dieuchinh", "danhmuc.xem", "danhmuc.sua",
  "kho.xem", "kho.nhap", "phieu.xem", "phieu.chidinh", "phieu.cap", "phieu.nhan", "phieu.doichieu", "baocao.xem", "baocao.tien", "nhanvien.quanly", "tongquan.xem", "quy.xem", "quy.ghi", "mua.xem", "mua.tao", "mua.duyet",
];

export const QUYEN_THEO_VAI_TRO: Record<VaiTro, Quyen[]> = {
  ky_thuat: [...TAT_CA, "hethong.phanquyen"],
  quan_ly: TAT_CA,
  le_tan: ["khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "the.xem", "danhmuc.xem"],
  thu_ngan: ["tongquan.xem", "khach.xem", "khach.sua", "lich.xem", "ban.xem", "ban.tao", "no.thu", "the.xem", "danhmuc.xem", "baocao.xem", "baocao.tien"],
  tu_van: ["khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "ban.tao", "the.xem", "danhmuc.xem"],
  bac_si: ["khach.xem", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.chidinh"],
  ktv: ["khach.xem", "hoso.xem", "anh.xem", "anh.them", "lich.xem", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.nhan"],
  thu_kho: ["tongquan.xem", "danhmuc.xem", "kho.xem", "kho.nhap", "phieu.xem", "phieu.cap", "phieu.doichieu", "mua.xem", "mua.tao"],
  ke_toan: ["tongquan.xem", "khach.xem", "ban.xem", "no.thu", "danhmuc.xem", "kho.xem", "baocao.xem", "baocao.tien", "phieu.xem", "quy.xem", "quy.ghi", "mua.xem"],
  marketing: ["tongquan.xem", "khach.xem", "lich.xem", "danhmuc.xem", "baocao.xem"],
  nha_dau_tu: ["tongquan.xem", "baocao.xem", "baocao.tien"],
};

export const QUYEN_MAC_DINH = (vt: VaiTro): Quyen[] => QUYEN_THEO_VAI_TRO[vt];

/** Tập quyền thật của một người: Kỹ thuật luôn đủ; người khác theo danh sách riêng (nếu Kỹ thuật đã đặt) hoặc mặc định của vai trò.
 *  "hethong.phanquyen" không bao giờ cấp được cho vai trò khác Kỹ thuật, dù danh sách riêng có ghi. */
export function quyenHieuLuc(vt: VaiTro, rieng: readonly string[] | null | undefined): Quyen[] {
  if (vt === "ky_thuat") return QUYEN_THEO_VAI_TRO.ky_thuat;
  const goc = rieng ? TAT_CA.filter((q) => rieng.includes(q)) : QUYEN_THEO_VAI_TRO[vt];
  return goc.filter((q) => q !== "hethong.phanquyen");
}

export type CoQuyen = { vaiTro: VaiTro; quyen: readonly Quyen[] };
export const coQuyen = (nd: CoQuyen | null | undefined, q: Quyen) => !!nd && nd.quyen.includes(q);
export const laVaiTro = (v: unknown): v is VaiTro => (VAI_TRO as readonly unknown[]).includes(v);

/** Danh sách quyền Kỹ thuật được tích chọn cho từng người (không gồm quyền hệ thống), gom theo nhóm cho dễ đọc. */
export const NHOM_QUYEN: { nhom: string; muc: { ma: Quyen; nhan: string }[] }[] = [
  { nhom: "Tổng quan", muc: [{ ma: "tongquan.xem", nhan: "Có dashboard (Tổng quan)" }] },
  { nhom: "Khách hàng", muc: [{ ma: "khach.xem", nhan: "Xem khách" }, { ma: "khach.sua", nhan: "Thêm / sửa khách" }, { ma: "khach.nhap", nhan: "Nhập Excel khách" }, { ma: "hoso.xem", nhan: "Xem hồ sơ điều trị" }, { ma: "hoso.sua", nhan: "Ghi hồ sơ điều trị" }, { ma: "anh.xem", nhan: "Xem ảnh khách" }, { ma: "anh.them", nhan: "Thêm ảnh khách" }] },
  { nhom: "Lịch hẹn", muc: [{ ma: "lich.xem", nhan: "Xem lịch" }, { ma: "lich.sua", nhan: "Đặt / đổi / huỷ lịch" }] },
  { nhom: "Bán hàng", muc: [{ ma: "ban.xem", nhan: "Xem hoá đơn" }, { ma: "ban.tao", nhan: "Bán hàng (thu ngân)" }, { ma: "ban.huy", nhan: "Huỷ hoá đơn" }, { ma: "no.thu", nhan: "Thu nợ" }] },
  { nhom: "Thẻ liệu trình", muc: [{ ma: "the.xem", nhan: "Xem thẻ" }, { ma: "the.thuchien", nhan: "Thực hiện buổi" }, { ma: "the.dieuchinh", nhan: "Điều chỉnh / cấp thẻ tay" }] },
  { nhom: "Vật tư & kho", muc: [{ ma: "phieu.xem", nhan: "Xem phiếu cấp vật tư" }, { ma: "phieu.chidinh", nhan: "Bác sĩ chỉ định vật tư" }, { ma: "phieu.cap", nhan: "Kho cấp vật tư" }, { ma: "phieu.nhan", nhan: "KTV nhận vật tư" }, { ma: "phieu.doichieu", nhan: "Đối chiếu phiếu" }, { ma: "kho.xem", nhan: "Xem kho" }, { ma: "kho.nhap", nhan: "Nhập / kiểm kho" }] },
  { nhom: "Mua hàng", muc: [{ ma: "mua.xem", nhan: "Xem đơn mua, nhà cung cấp, công nợ" }, { ma: "mua.tao", nhan: "Lập đơn mua, nhà cung cấp" }, { ma: "mua.duyet", nhan: "Duyệt / từ chối đơn mua" }] },
  { nhom: "Sổ quỹ", muc: [{ ma: "quy.xem", nhan: "Xem sổ quỹ thu/chi" }, { ma: "quy.ghi", nhan: "Ghi thu/chi, chuyển quỹ, đảo phiếu" }] },
  { nhom: "Danh mục & báo cáo", muc: [{ ma: "danhmuc.xem", nhan: "Xem danh mục" }, { ma: "danhmuc.sua", nhan: "Sửa danh mục" }, { ma: "baocao.xem", nhan: "Xem báo cáo" }, { ma: "baocao.tien", nhan: "Xem số tiền (doanh thu, hoa hồng)" }, { ma: "nhanvien.quanly", nhan: "Sửa chi nhánh" }] },
];

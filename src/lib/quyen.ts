// Vai trò và quyền. Một nơi duy nhất: menu, trang, Server Action đều hỏi ở đây.
// ASSUMPTION: ma trận quyền dưới đây là đề xuất mặc định theo vai trò SalonHero đang dùng (Chủ, Quản lý, Thu ngân, Thủ kho, Bác sĩ, Kế toán, Tư vấn, Marketing, Nhà đầu tư) + Lễ tân + KTV.
// Chủ chốt lại thì chỉ sửa bảng này.

export const VAI_TRO = ["chu", "quan_ly", "le_tan", "thu_ngan", "tu_van", "bac_si", "ktv", "thu_kho", "ke_toan", "marketing", "nha_dau_tu"] as const;
export type VaiTro = (typeof VAI_TRO)[number];

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  chu: "Chủ",
  quan_ly: "Quản lý",
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
  | "nhanvien.quanly";

const TAT_CA: Quyen[] = [
  "khach.xem", "khach.sua", "khach.nhap", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "lich.sua",
  "ban.xem", "ban.tao", "ban.huy", "no.thu", "the.xem", "the.thuchien", "the.dieuchinh", "danhmuc.xem", "danhmuc.sua",
  "kho.xem", "kho.nhap", "phieu.xem", "phieu.chidinh", "phieu.cap", "phieu.nhan", "phieu.doichieu", "baocao.xem", "baocao.tien", "nhanvien.quanly",
];

export const QUYEN_THEO_VAI_TRO: Record<VaiTro, Quyen[]> = {
  chu: TAT_CA,
  quan_ly: TAT_CA,
  le_tan: ["khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "the.xem", "danhmuc.xem"],
  thu_ngan: ["khach.xem", "khach.sua", "lich.xem", "ban.xem", "ban.tao", "no.thu", "the.xem", "danhmuc.xem", "baocao.xem", "baocao.tien"],
  tu_van: ["khach.xem", "khach.sua", "lich.xem", "lich.sua", "ban.xem", "ban.tao", "the.xem", "danhmuc.xem"],
  bac_si: ["khach.xem", "hoso.xem", "hoso.sua", "anh.xem", "anh.them", "lich.xem", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.chidinh"],
  ktv: ["khach.xem", "hoso.xem", "anh.xem", "anh.them", "lich.xem", "the.xem", "the.thuchien", "danhmuc.xem", "phieu.xem", "phieu.nhan"],
  thu_kho: ["danhmuc.xem", "kho.xem", "kho.nhap", "phieu.xem", "phieu.cap", "phieu.doichieu"],
  ke_toan: ["khach.xem", "ban.xem", "no.thu", "danhmuc.xem", "kho.xem", "baocao.xem", "baocao.tien", "phieu.xem"],
  marketing: ["khach.xem", "lich.xem", "danhmuc.xem", "baocao.xem"],
  nha_dau_tu: ["baocao.xem", "baocao.tien"],
};

export const coQuyen = (vt: VaiTro | null | undefined, q: Quyen) => !!vt && QUYEN_THEO_VAI_TRO[vt].includes(q);
export const laVaiTro = (v: unknown): v is VaiTro => (VAI_TRO as readonly unknown[]).includes(v);

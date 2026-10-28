export type Vai = "phuc_vu" | "tu_van" | "ban";
export const VAI: { ma: Vai; ten: string }[] = [{ ma: "phuc_vu", ten: "Phục vụ" }, { ma: "tu_van", ten: "Tư vấn" }, { ma: "ban", ten: "Bán hàng" }];
/** SalonHero: mỗi dòng hàng có tối đa 5 người hưởng cho mỗi vai. DB cũng chặn (migration 0081). */
export const TOI_DA_NGUOI_HUONG = 5;
export const PHUONG_THUC = [
  { gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" },
];
export const NHAN_PHUONG_THUC = Object.fromEntries(PHUONG_THUC.map((p) => [p.gia_tri, p.nhan])) as Record<string, string>;

export type MucBan = { loai: "dich_vu" | "goi_the" | "san_pham"; id: string; ten: string; gia: number; nhom: string; vatPct?: number };
export type DongDon = { loai: MucBan["loai"]; ref: string; sl: number; giam: number; nv: Record<Vai, { id: string; ti: number }[]> };
export type KhoanThu = { phuong_thuc: string; so_tien: number; the_id?: string };
export type DonBan = {
  khachId: string | null; lichId: string | null; chiNhanhId: string;
  dong: DongDon[]; giamDon: number; vatPct: number; phuPhi: number; tip: number; nguoiGioiThieu: string; ghiChu: string; thu: KhoanThu[];
  /** Số điểm thưởng khách đổi lấy giảm giá (0 = không đổi). Tiền giảm = điểm × tỉ lệ cấu hình, máy chủ tự tính lại. */
  doiDiem?: number;
  /** Mã voucher khách đưa (rỗng = không dùng). Máy chủ tự tính lại tiền giảm từ danh mục. */
  voucher?: string;
};
export const tinhDon = (hang: number, giamDon: number, vatPct: number, phuPhi: number, tip: number) => {
  const sauGiam = Math.max(hang - giamDon, 0);
  const vat = Math.round((sauGiam * vatPct) / 100);
  return { vat, phai: sauGiam + vat + phuPhi + tip };
};

/** Voucher (thẻ giảm giá) như trang Bán hàng cần: đủ để tính tiền giảm khi người bán đổi dòng hàng, không cần hỏi lại máy chủ. */
export type GioiHanVoucher = "tong_don" | "dich_vu_the" | "san_pham" | "the" | "dich_vu" | "dich_vu_san_pham";
export type VoucherDon = { loai_giam: "tien" | "phan_tram"; gia_tri: number; giam_toi_da: number | null; gioi_han: GioiHanVoucher };
/** Cột "Giới hạn dịch vụ áp dụng" của SalonHero → loại dòng hàng được tính giảm. Cùng bảng với hàm voucher_loai_dong của DB (migration 0080). */
export const GIOI_HAN_VOUCHER: { gia_tri: GioiHanVoucher; nhan: string; loai: MucBan["loai"][] }[] = [
  { gia_tri: "tong_don", nhan: "Tổng giá trị đơn hàng", loai: ["dich_vu", "goi_the", "san_pham"] },
  { gia_tri: "dich_vu_the", nhan: "Tất cả dịch vụ và thẻ", loai: ["dich_vu", "goi_the"] },
  { gia_tri: "san_pham", nhan: "Tất cả sản phẩm", loai: ["san_pham"] },
  { gia_tri: "the", nhan: "Thẻ dịch vụ", loai: ["goi_the"] },
  { gia_tri: "dich_vu", nhan: "Tất cả dịch vụ", loai: ["dich_vu"] },
  { gia_tri: "dich_vu_san_pham", nhan: "Cả d.vụ & s.phẩm (không thẻ)", loai: ["dich_vu", "san_pham"] },
];
/** Tiền giảm của voucher cho các dòng (thành tiền sau giảm giá dòng). Cùng công thức với hàm tinh_giam_voucher của DB (migration 0080):
 *  phần trăm làm tròn đồng, chặn bởi mức giảm tối đa; tiền không quá phần tiền hàng áp dụng. Dùng số nguyên (phần trăm × 100) để không lệch so với DB. */
export const tinhGiamVoucher = (v: VoucherDon, dong: { loai: string; thanh: number }[]) => {
  const loai = GIOI_HAN_VOUCHER.find((g) => g.gia_tri === v.gioi_han)?.loai ?? [];
  const coSo = dong.filter((d) => (loai as string[]).includes(d.loai)).reduce((s, d) => s + d.thanh, 0);
  let giam = v.loai_giam === "phan_tram" ? Math.round((coSo * Math.round(v.gia_tri * 100)) / 10000) : Math.floor(v.gia_tri);
  if (v.loai_giam === "phan_tram" && v.giam_toi_da != null) giam = Math.min(giam, v.giam_toi_da);
  return Math.max(Math.min(giam, coSo), 0);
};

export const lamTron = (n: number) => Math.round(n * 100) / 100;
/** Chia đều 100% cho n người (hai chữ số lẻ): phần dư dồn vào người cuối để cộng đủ đúng 100. */
export const chiaDeuTi = (n: number) => Array.from({ length: n }, (_, i) => (i < n - 1 ? lamTron(100 / n) : lamTron(100 - lamTron(100 / n) * (n - 1))));

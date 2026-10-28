/** Quy ước mã và tên sản phẩm / vật tư (chị Lâm 28/10: "mã sản phẩm, cách đặt tên" phải làm chặt, chỗ kế toán sẽ setup lại dần).
 *  MÃ: chữ in hoa + số, 3–24 ký tự, chỉ gồm A-Z 0-9 . _ - (không dấu cách). Mã tự sinh theo nhóm: <TIỀN TỐ>-<4 chữ số>, vd MP-0012. Mã vạch tách riêng (ma_vach, 8–14 chữ số).
 *  TÊN: <Loại hàng> <Thương hiệu> <Tên sản phẩm> <Dung tích/quy cách>, vd "Kem chống nắng Heliocare 360 Pigment Solution Fluid SPF50+ 50ml".
 *  Viết hoa chữ đầu, không viết hoa toàn bộ, không khoảng trắng thừa, 6–120 ký tự, không trùng tên sản phẩm khác (không phân biệt hoa thường và dấu). */

export const MA_HOP_LE = /^[A-Z0-9][A-Z0-9._-]{2,23}$/;
export const MA_VACH_HOP_LE = /^[0-9]{8,14}$/;

export const chuanHoaTen = (s: string) => s.replace(/\s+/g, " ").trim();
/** Khoá so sánh tên: bỏ dấu, chữ thường, một khoảng trắng. */
export const khoaTen = (s: string) => chuanHoaTen(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

const TIEN_TO: [RegExp, string][] = [
  [/thuốc/i, "TH"], [/vật tư|thermo|tiêu hao/i, "VT"], [/quà|tặng/i, "QT"], [/dụng cụ|thiết bị/i, "DC"], [/mỹ phẩm|sữa tắm|dưỡng|sản phẩm bán/i, "MP"],
];
export const tienToTheoNhom = (nhom: string | null | undefined) => TIEN_TO.find(([re]) => re.test(nhom ?? ""))?.[1] ?? "SP";

export function loiTen(ten: string): string | null {
  const t = chuanHoaTen(ten);
  if (t.length < 6) return "Tên quá ngắn (tối thiểu 6 ký tự). Ghi đủ: loại hàng, thương hiệu, tên, quy cách.";
  if (t.length > 120) return "Tên quá dài (tối đa 120 ký tự).";
  if (t.length > 8 && t === t.toUpperCase() && /[A-ZÀ-Ỹ]/.test(t)) return "Không viết hoa toàn bộ tên. Viết hoa chữ đầu mỗi từ riêng, còn lại viết thường.";
  return null;
}
export const loiMa = (ma: string) => (MA_HOP_LE.test(ma) ? null : "Mã gồm 3–24 ký tự chữ in hoa, số, dấu . _ - và không có dấu cách (vd MP-0012).");
export const loiMaVach = (mv: string) => (!mv || MA_VACH_HOP_LE.test(mv) ? null : "Mã vạch gồm 8–14 chữ số.");

export type SanPhamRaSoat = { ma: string; ten: string; nhom: string | null; ton_toi_thieu: number; gia_nhap_don_vi: number | null; gia_ban: number; ban_le: boolean; theo_doi_kho: boolean; hoat_dong: boolean; don_vi_mua: string | null; tieu_hao: boolean; ma_vach: string | null };
export const NHAN_VAN_DE: Record<string, string> = {
  ma: "Mã không theo quy ước", ten: "Tên không theo quy ước", trung: "Tên trùng sản phẩm khác", nhom: "Chưa có nhóm hàng", ton_thieu: "Chưa đặt tồn tối thiểu",
  gia_von: "Chưa có giá vốn", gia_ban: "Bán lẻ nhưng giá bán bằng 0", ma_vach: "Bán lẻ nhưng chưa có mã vạch", don_vi_mua: "Chưa có đơn vị mua",
};
/** Các vấn đề dữ liệu của một sản phẩm (chỉ xét hàng đang dùng); `trung` do nơi gọi truyền vào vì cần so với cả danh mục. */
export function vanDeSanPham(s: SanPhamRaSoat, trung: boolean): string[] {
  if (!s.hoat_dong) return [];
  const ra: string[] = [];
  if (loiMa(s.ma)) ra.push("ma");
  if (loiTen(s.ten)) ra.push("ten");
  if (trung) ra.push("trung");
  if (!s.nhom) ra.push("nhom");
  if (s.theo_doi_kho && Number(s.ton_toi_thieu) === 0) ra.push("ton_thieu");
  if (s.gia_nhap_don_vi == null) ra.push("gia_von");
  if (s.ban_le && Number(s.gia_ban) === 0) ra.push("gia_ban");
  if (s.ban_le && !s.ma_vach) ra.push("ma_vach");
  if (!s.don_vi_mua && !s.tieu_hao) ra.push("don_vi_mua");
  return ra;
}

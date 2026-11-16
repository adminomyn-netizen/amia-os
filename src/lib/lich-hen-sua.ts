// Sửa lịch hẹn (chị Lâm 10/11/2026): ai được sửa, trường nào bị khoá theo trạng thái, loại lịch. Hàm thuần để dùng chung máy chủ + giao diện + kiểm thử.

/** Vai quản lý lịch: sửa được MỌI lịch và xem lịch sử sửa (Chủ, Kỹ thuật, Quản lý / Leader). */
export const VAI_QUAN_LY_LICH = ["chu", "ky_thuat", "quan_ly"] as const;
export const laQuanLyLich = (vaiTro: string) => (VAI_QUAN_LY_LICH as readonly string[]).includes(vaiTro);
export const LY_DO_KHONG_SUA = "Chỉ người tạo lịch hoặc quản lý được sửa";

/** Ai có quyền "lich.sua" đều sửa được MỌI lịch, kể cả lịch người khác tạo / đồng bộ SalonHero / đặt online (chị Lâm 16/11/2026: "sửa cả ngày cả giờ, các thông tin trong lịch hẹn sửa hết").
 *  Nơi gọi đã chặn quyền "lich.sua"; trường khoá theo trạng thái / hoá đơn vẫn giữ (khoaSuaLich), mọi lần sửa vẫn ghi lịch sử. */
export function quyenSuaLich(_nd: { vaiTro: string; nhanVienId: string }, _lich: { tao_boi: string | null }): { duoc: boolean; lyDo?: string } {
  return { duoc: true };
}

/** Trạng thái còn sửa được hết (chưa phục vụ). */
export const TRANG_THAI_SUA_HET = ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"] as const;
export type KhoaSua = { gio: boolean; khach: boolean; diCung: boolean; dichVu: boolean; lyDo: string[] };
const NHAN_TT: Record<string, string> = { dang_phuc_vu: "đang phục vụ", hoan_thanh: "đã hoàn thành", huy: "đã huỷ", khong_den: "khách không đến" };

/** Trường bị khoá khi sửa: lịch đã vào phục vụ / xong / huỷ / không đến thì không đổi khách, chi nhánh, ngày giờ, khách đi cùng;
 *  dịch vụ khoá khi đã có hoá đơn (hoá đơn đã tính theo dịch vụ). Luôn sửa được: người thực hiện, phòng, nguồn, loại lịch, ghi chú. */
export function khoaSuaLich(trangThai: string, coHoaDon: boolean): KhoaSua {
  const het = (TRANG_THAI_SUA_HET as readonly string[]).includes(trangThai);
  const lyDo: string[] = [];
  if (!het) lyDo.push(`Lịch ${NHAN_TT[trangThai] ?? trangThai} nên không đổi khách, chi nhánh, ngày giờ, thời lượng và khách đi cùng.`);
  if (coHoaDon) lyDo.push("Lịch đã có hoá đơn nên không đổi dịch vụ (sửa ở hoá đơn).");
  return { gio: !het, khach: !het, diCung: !het, dichVu: coHoaDon, lyDo };
}

// ───────── Loại lịch ─────────
export const LOAI_LICH = {
  tu_van_moi: { nhan: "Tư vấn khách mới", ngan: "Tư vấn mới" },
  lieu_trinh: { nhan: "Khách liệu trình", ngan: "Liệu trình" },
  dich_vu_le: { nhan: "Làm dịch vụ lẻ", ngan: "DV lẻ" },
  tai_kham: { nhan: "Tái khám / kiểm tra", ngan: "Tái khám" },
  bao_hanh: { nhan: "Bảo hành / chăm sóc lại", ngan: "Bảo hành" },
} as const;
export type LoaiLich = keyof typeof LOAI_LICH;
export const laLoaiLich = (v: unknown): v is LoaiLich => typeof v === "string" && Object.prototype.hasOwnProperty.call(LOAI_LICH, v);
export const nhanLoaiLich = (v: string | null | undefined, ngan = false) => (laLoaiLich(v) ? LOAI_LICH[v][ngan ? "ngan" : "nhan"] : "");
export const LUA_CHON_LOAI_LICH = (Object.keys(LOAI_LICH) as LoaiLich[]).map((gia_tri) => ({ gia_tri, nhan: LOAI_LICH[gia_tri].nhan }));

/** Gợi ý loại lịch theo khách: còn thẻ liệu trình (còn buổi) → Khách liệu trình; chưa từng có hoá đơn → Tư vấn khách mới; còn lại không đoán. */
export function goiYLoaiLich(k: { coTheLieuTrinh: boolean; soLanDen: number }): LoaiLich | "" {
  if (k.coTheLieuTrinh) return "lieu_trinh";
  if (k.soLanDen === 0) return "tu_van_moi";
  return "";
}

/** Dòng lịch sử sửa của dịch vụ / khách đi cùng (bảng con, ứng dụng tự ghi). Trả null khi không đổi. */
export function dongDoiDanhSach(truong: string, nhan: string, cu: string[], moi: string[]) {
  const a = [...cu].sort().join(", "), b = [...moi].sort().join(", ");
  return a === b ? null : { truong, nhan, cu: cu.join(", "), moi: moi.join(", ") };
}

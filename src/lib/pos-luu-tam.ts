// Thu ngân giữ tạm các đơn đang mở trong trình duyệt (chị Lâm 11/11/2026: "nhập ở đây nó lưu cache 1 tiếng của user đó,
// khi vào thì nó vẫn còn hiện cho đến khi người đấy tắt hoặc xoá hẳn"). Hàm thuần: đọc / dọn / kiểm dữ liệu lưu tạm.
// - Khoá theo TÀI KHOẢN đăng nhập: người khác đăng nhập cùng máy không thấy đơn của người trước.
// - Hết hạn 1 giờ kể từ lần SỬA cuối (mỗi lần sửa gia hạn lại).
// - Không lưu khoản thu / tiền khách đưa / tổng tiền: tổng luôn tính lại từ dòng + giá danh mục lúc mở lại; dòng của mục đã ngừng bán thì bỏ.
// - Đơn đã "Lưu nháp" lên máy chủ: chỉ nhớ id nháp, mở lại lấy đúng bản trên máy chủ (máy chủ là gốc).
import type { DongDon } from "@/lib/ban-hang";

export const POS_TTL_MS = 60 * 60 * 1000;
export const CN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const khoaPos = (nguoiId: string) => `amia-pos-don:v1:${nguoiId}`;
export const khoaCn = (nguoiId: string) => `amia-pos-cn:v1:${nguoiId}`;
export const TIEN_TO_POS = "amia-pos-don:v1:";

export type KhachLuu = { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string; doi_tac_id?: string | null };
/** Trạng thái một đơn chưa lưu nháp. */
export type DonLuuTam = {
  khach: KhachLuu | null; cnId: string; dong: DongDon[]; lichId: string | null;
  giamDon: number; giamPct: string; vatPct: string; phuPhi: number; tip: number; ghiChu: string; gioVao: string; gioRa: string; soKhach: string; ngayHd: string;
  moLe: boolean; tab: "dich_vu" | "goi_the" | "san_pham";
};
export type TabLuu = { kieu: "ban" | "dich_vu"; nhapId?: string; don?: DonLuuTam; /** Chữ ký đơn dựng từ địa chỉ (?lich= / ?khach=): mở lại cùng địa chỉ thì không nhân đôi. */ tuUrl?: string };
export type BoNhoPos = { luc: number; xem: number; tabs: TabLuu[] };

const so = (v: unknown, md = 0) => (typeof v === "number" && Number.isFinite(v) ? v : md);
const chu = (v: unknown, md = "") => (typeof v === "string" ? v.slice(0, 2000) : md);

/** Đọc bộ nhớ đơn: hỏng / hết hạn (quá 1 giờ từ lần sửa cuối) / rỗng → null. */
export function docBoNhoPos(tho: string | null, bayGio: number): BoNhoPos | null {
  if (!tho) return null;
  let x: Partial<BoNhoPos>;
  try { x = JSON.parse(tho); } catch { return null; }
  if (!x || typeof x.luc !== "number" || !Array.isArray(x.tabs)) return null;
  if (bayGio - x.luc > POS_TTL_MS || x.luc > bayGio + 60_000) return null;
  const tabs = x.tabs.filter((t): t is TabLuu => !!t && (t.kieu === "ban" || t.kieu === "dich_vu") && (typeof t.nhapId === "string" || (!!t.don && typeof t.don === "object")));
  return tabs.length ? { luc: x.luc, xem: Math.min(Math.max(0, so(x.xem)), tabs.length - 1), tabs } : null;
}

/** Đơn có gì đáng giữ (khách, dòng, ghi chú hoặc đã lưu nháp). Tab trống không cần lưu. */
export const tabCoNoiDung = (t: TabLuu) => !!t.nhapId || !!t.don && (!!t.don.khach || t.don.dong.length > 0 || !!t.don.ghiChu.trim());

/** Làm sạch một đơn lúc mở lại: bỏ dòng của mục không còn trong danh mục, chi nhánh không còn thì về mặc định. */
export function lamSachDon(d: DonLuuTam, mucCo: (khoa: string) => boolean, cnCo: (id: string) => boolean, cnMacDinh: string): DonLuuTam {
  const dong = (Array.isArray(d.dong) ? d.dong : []).filter((x) => x && typeof x.ref === "string" && mucCo(`${x.loai}:${x.ref}`) && so(x.sl) > 0)
    .map((x) => ({ ...x, sl: Math.min(so(x.sl, 1), 999), giam: Math.max(0, so(x.giam)) }));
  const k = d.khach && typeof d.khach.id === "string" && typeof d.khach.ho_ten === "string" ? d.khach : null;
  return {
    khach: k, cnId: cnCo(chu(d.cnId)) ? d.cnId : cnMacDinh, dong, lichId: typeof d.lichId === "string" ? d.lichId : null,
    giamDon: Math.max(0, so(d.giamDon)), giamPct: chu(d.giamPct), vatPct: chu(d.vatPct, "0"), phuPhi: Math.max(0, so(d.phuPhi)), tip: Math.max(0, so(d.tip)),
    ghiChu: chu(d.ghiChu), gioVao: chu(d.gioVao), gioRa: chu(d.gioRa), soKhach: chu(d.soKhach, "1"), ngayHd: chu(d.ngayHd),
    moLe: !!d.moLe, tab: d.tab === "goi_the" || d.tab === "san_pham" ? d.tab : "dich_vu",
  };
}

/** Chi nhánh nhớ lần trước của người dùng (30 ngày), chỉ khi chi nhánh đó còn trong danh sách được bán. */
export function docCnNho(tho: string | null, bayGio: number, cnCo: (id: string) => boolean): string | null {
  if (!tho) return null;
  try {
    const x = JSON.parse(tho) as { id?: unknown; luc?: unknown };
    if (typeof x.id !== "string" || typeof x.luc !== "number" || bayGio - x.luc > CN_TTL_MS || !cnCo(x.id)) return null;
    return x.id;
  } catch { return null; }
}

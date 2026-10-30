/** Biến dùng được trong mẫu tin Zalo OA / SMS. */
export const BIEN_TIN = ["ten", "ngay_hen", "gio_hen", "co_so"] as const;
export const KENH_TIN = [{ ma: "zalo_oa", ten: "Zalo OA" }, { ma: "sms", ten: "SMS" }] as const;
export type KenhTin = (typeof KENH_TIN)[number]["ma"];
export const laKenhTin = (k: unknown): k is KenhTin => KENH_TIN.some((x) => x.ma === k);
export const tenKenh = (k: string) => ({ zalo_oa: "Zalo OA", sms: "SMS", messenger: "Messenger" }[k] ?? k);

const RE_BIEN = /\{\{\s*([a-z_]+)\s*\}\}/g;
/** Các biến có trong mẫu (không trùng). */
export const bienTrongMau = (mau: string) => [...new Set([...mau.matchAll(RE_BIEN)].map((m) => m[1]))];
/** Biến lạ (không nằm trong BIEN_TIN) có trong mẫu. */
export const bienLa = (mau: string) => bienTrongMau(mau).filter((b) => !(BIEN_TIN as readonly string[]).includes(b));
/** Biến mẫu cần nhưng giá trị trống: tin gửi đi không được thiếu chữ. */
export const bienThieu = (mau: string, giaTri: Record<string, string | null | undefined>) => bienTrongMau(mau).filter((b) => !(giaTri[b] ?? "").trim());
/** Điền {{biến}} vào mẫu. */
export const dienMauTin = (mau: string, giaTri: Record<string, string | null | undefined>) => mau.replace(RE_BIEN, (_, k: string) => (giaTri[k] ?? "").trim());

/** Số điện thoại Việt Nam về dạng 0xxxxxxxxx (10 số). Không hợp lệ thì null. */
export function chuanHoaSdt(s: string | null | undefined): string | null {
  let p = String(s ?? "").replace(/[^\d+]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return /^0\d{9}$/.test(p) ? p : null;
}
/** Che số điện thoại cho người không có quyền xem SĐT khách. */
export const cheSdt = (s: string) => (s.length > 3 ? `${"*".repeat(s.length - 3)}${s.slice(-3)}` : "***");

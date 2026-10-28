// Định dạng hiển thị (an toàn cho cả máy chủ và trình duyệt).
export const tienVN = (so: number | string | null | undefined) => `${Number(so ?? 0).toLocaleString("vi-VN")} đ`;
/** Số tiền gọn cho ô thống kê: 900k, 1,2tr, 3,4 tỷ (số đầy đủ chỉ hiện ở chỗ chi tiết). */
export const tienGon = (so: number | string | null | undefined) => {
  const n = Number(so ?? 0), a = Math.abs(n);
  const f = (x: number, d: string) => `${(Math.round(x * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${d}`;
  return a >= 1e9 ? f(n / 1e9, " tỷ") : a >= 1e6 ? f(n / 1e6, "tr") : a >= 1e3 ? f(n / 1e3, "k") : String(n);
};
export const soVN = (so: number | string | null | undefined) => Number(so ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
export const ngayVN = (d: string | null | undefined) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "");
const HCM = { timeZone: "Asia/Ho_Chi_Minh" } as const;
export const homNayHCM = () => new Date().toLocaleDateString("sv-SE", HCM);
export const gioVN = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { ...HCM, hour: "2-digit", minute: "2-digit", hour12: false }) : "");
export const ngayGioVN = (iso: string | null | undefined) => (iso ? `${gioVN(iso)} ${ngayVN(new Date(iso).toLocaleDateString("sv-SE", HCM))}` : "");
export const ngayCuaIso = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", HCM);
/** Chỉ giữ chữ số của số điện thoại: "0912 345.678" → "0912345678"; +84 đổi về 0. */
export const chuanSdt = (s: string) => {
  const so = s.replace(/[^\d+]/g, "").replace(/^\+84/, "0").replace(/^84(?=\d{9}$)/, "0");
  return so.replace(/\D/g, "");
};
export const coSdtHopLe = (s: string) => /^0\d{9,10}$/.test(chuanSdt(s));
export const soTuChu = (v: FormDataEntryValue | null | undefined) => Number(String(v ?? "").replace(/[^\d-]/g, "")) || 0;
/** Tháng của ngày YYYY-MM-DD cộng/trừ số ngày (không dùng múi giờ máy). */
export const congNgay = (d: string, n: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

/** "còn/tổng buổi"; thẻ chuyển từ SalonHero không giới hạn buổi (tổng 999.999) hiện là "Không giới hạn". */
export function buoiConLai(con: number | null | undefined, tong: number | null | undefined) {
  if ((tong ?? 0) >= 999999) return "Không giới hạn";
  return `${con ?? 0}/${tong ?? 0} buổi`;
}

// Nhắc chăm sóc tạo tay (câu 12 + 22, như SalonHero "Lịch nhắc chăm sóc"): lặp theo Ngày / Tuần / Tháng mỗi N, M lần; hoặc lặp không đều theo từng khoảng ngày.
// Quy tắc nhắc lưu theo từng dịch vụ (dich_vu.quy_tac_nhac), không có chu kỳ mặc định chung.

export type KieuLapNhac = "SINGLE" | "DAY" | "WEEK" | "MONTH" | "UNEQUAL";
export const KIEU_LAP_NHAC: { ma: KieuLapNhac; nhan: string }[] = [
  { ma: "SINGLE", nhan: "Không lặp" }, { ma: "DAY", nhan: "Lặp theo ngày" }, { ma: "WEEK", nhan: "Lặp theo tuần" }, { ma: "MONTH", nhan: "Lặp theo tháng" }, { ma: "UNEQUAL", nhan: "Lặp không đều" },
];
export const laKieuLapNhac = (v: unknown): v is KieuLapNhac => KIEU_LAP_NHAC.some((k) => k.ma === v);
const DON_VI: Record<string, string> = { DAY: "ngày", WEEK: "tuần", MONTH: "tháng" };
export const TOI_DA_LAN_NHAC = 52;

/** Quy tắc nhắc của một dịch vụ: so_lan = tổng số lần nhắc (gồm lần đầu); cac_khoang = số ngày giữa các lần (lặp không đều). */
export type QuyTacNhac = { kieu: KieuLapNhac; moi: number; so_lan: number; cac_khoang: number[] };

/** Đọc quy tắc lưu trong CSDL (bỏ qua dữ liệu hỏng). */
export function docQuyTac(v: unknown): QuyTacNhac | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!laKieuLapNhac(o.kieu) || o.kieu === "SINGLE") return null;
  const moi = Math.trunc(Number(o.moi)) || 1, soLan = Math.trunc(Number(o.so_lan)) || 2;
  const cac = Array.isArray(o.cac_khoang) ? o.cac_khoang.map((x) => Math.trunc(Number(x))).filter((x) => x >= 1 && x <= 365) : [];
  return { kieu: o.kieu, moi: Math.min(365, Math.max(1, moi)), so_lan: Math.min(TOI_DA_LAN_NHAC, Math.max(2, soLan)), cac_khoang: cac.slice(0, TOI_DA_LAN_NHAC - 1) };
}

/** "7, 14, 30" → [7, 14, 30]; lỗi thì trả chuỗi báo lỗi. */
export function docCacKhoang(chu: string): number[] | string {
  const tach = chu.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  if (!tach.length) return "Nhập các khoảng ngày giữa những lần nhắc, cách nhau dấu phẩy (vd 7, 14, 30).";
  const so = tach.map(Number);
  if (so.some((x) => !Number.isInteger(x) || x < 1 || x > 365)) return "Mỗi khoảng là số ngày nguyên từ 1 đến 365.";
  if (so.length > TOI_DA_LAN_NHAC - 1) return `Tối đa ${TOI_DA_LAN_NHAC} lần nhắc.`;
  return so;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Mọi thời điểm nhắc (ISO, giờ Việt Nam +07:00) từ lần đầu `ngay` + `gio`. Theo tháng: ngày 31 rơi vào tháng ngắn thì lấy ngày cuối tháng. */
export function cacNgayNhac(ngay: string, gio: string, q: { kieu: KieuLapNhac; moi?: number; so_lan?: number; cac_khoang?: number[] }): string[] {
  const [y, m, d] = ngay.split("-").map(Number);
  const iso = (yy: number, mm: number, dd: number) => new Date(`${yy}-${pad(mm)}-${pad(dd)}T${gio}:00+07:00`).toISOString();
  if (q.kieu === "SINGLE") return [iso(y, m, d)];
  if (q.kieu === "UNEQUAL") {
    const ra = [iso(y, m, d)];
    let t = Date.UTC(y, m - 1, d);
    for (const k of q.cac_khoang ?? []) { t += k * 86400e3; const x = new Date(t); ra.push(iso(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate())); }
    return ra;
  }
  const moi = Math.max(1, q.moi ?? 1), soLan = Math.max(1, Math.min(TOI_DA_LAN_NHAC, q.so_lan ?? 2));
  const ra: string[] = [];
  for (let i = 0; i < soLan; i++) {
    if (q.kieu === "MONTH") {
      const tm = m - 1 + i * moi, nam = y + Math.floor(tm / 12), thang = ((tm % 12) + 12) % 12;
      const cuoi = new Date(Date.UTC(nam, thang + 1, 0)).getUTCDate();
      ra.push(iso(nam, thang + 1, Math.min(d, cuoi)));
    } else {
      const x = new Date(Date.UTC(y, m - 1, d + i * moi * (q.kieu === "WEEK" ? 7 : 1)));
      ra.push(iso(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()));
    }
  }
  return ra;
}

/** Mô tả lặp ngắn cho bảng: "Mỗi 1 tuần · 2 lần", "Không đều: 7, 14 ngày · 3 lần". Dữ liệu SalonHero cũ (không có khoảng) chỉ hiện kiểu + số lần nhắc. */
export function moTaLapNhac(n: { kieu_lap?: string | null; lap_khoang?: number | null; so_lan_lap?: number | null; cac_ngay_nhac?: unknown }) {
  const k = n.kieu_lap ?? "SINGLE";
  if (k === "SINGLE") return "";
  const soLan = Array.isArray(n.cac_ngay_nhac) ? n.cac_ngay_nhac.length : n.so_lan_lap != null ? n.so_lan_lap + 1 : null;
  const lan = soLan ? ` · ${soLan} lần` : "";
  if (k === "UNEQUAL") return `Lặp không đều${lan}`;
  return `${n.lap_khoang ? `Mỗi ${n.lap_khoang} ${DON_VI[k] ?? k}` : `Hằng ${DON_VI[k] ?? k}`}${lan}`;
}

export const NHAN_TRANG_THAI_NHAC: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  dang_nhac: { nhan: "Chưa thực hiện", kieu: "cho" }, da_xong: { nhan: "Đã thực hiện", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "tram" },
};

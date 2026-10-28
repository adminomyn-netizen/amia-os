// Lịch hẹn: nguồn đặt và lịch lặp theo đúng mã SalonHero (dữ liệu chuyển sang giữ nguyên mã), nhãn tiếng Việt lấy từ bản dịch của SalonHero.

/** Nguồn đặt lịch: mã SalonHero → nhãn. Thứ tự = thường gặp trước (theo 51.875 lịch đã chuyển). */
export const NGUON_DAT: Record<string, string> = {
  PHONE: "Gọi điện", MESSENGER: "FB Messenger", TELESALE: "Telesale", REFERRAL: "Giới thiệu", ZALO: "Zalo", VOUCHER: "Voucher",
  WEB: "Từ website", WALKIN: "Đến trực tiếp", REPEAT: "Định kỳ", HOTLINE: "Hotline", EVENT: "Sự kiện", GOOGLE: "Google", TIKTOK: "Tiktok",
  INSTAGRAM: "Instagram", WHATSAPP: "WhatsApp", SHOPEE: "Shopee", JAMJA: "Jamja", HANA: "Chatbot", IOS: "iOS app", ANDROID: "Android app",
  AD1: "AD1", AD2: "AD2", AD3: "AD3", AD4: "AD4", AD5: "AD5",
};
export const LUA_CHON_NGUON = Object.entries(NGUON_DAT).map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
/** Nhãn của một nguồn; mã lạ (hoặc chữ cũ nhập tay) thì hiện nguyên văn. */
export const nhanNguon = (ma: string | null | undefined) => (ma ? NGUON_DAT[ma] ?? ma : "");

export type KieuLap = "DAILY" | "WEEKLY" | "MONTHLY";
export const KIEU_LAP: Record<KieuLap, { nhan: string; don_vi: string }> = {
  DAILY: { nhan: "Theo ngày", don_vi: "ngày/lần" },
  WEEKLY: { nhan: "Theo tuần", don_vi: "tuần/lần" },
  MONTHLY: { nhan: "Theo tháng", don_vi: "tháng/lần" },
};
export const laKieuLap = (v: unknown): v is KieuLap => v === "DAILY" || v === "WEEKLY" || v === "MONTHLY";
export const TOI_DA_BUOI_LAP = 52;

/** Mô tả ngắn một lịch lặp: "Lặp theo tuần · buổi 2/4". Lịch cũ SalonHero chỉ có kiểu lặp. */
export function moTaLap(l: { kieu_lap?: string | null; lap_khoang?: number | null; lap_tong?: number | null; lap_thu_tu?: number | null }) {
  if (!l.kieu_lap) return "";
  const k = laKieuLap(l.kieu_lap) ? KIEU_LAP[l.kieu_lap].nhan.toLowerCase() : l.kieu_lap;
  const khoang = l.lap_khoang && l.lap_khoang > 1 && laKieuLap(l.kieu_lap) ? `, ${l.lap_khoang} ${KIEU_LAP[l.kieu_lap].don_vi}` : "";
  const buoi = l.lap_tong ? ` · buổi ${l.lap_thu_tu ?? "?"}/${l.lap_tong}` : "";
  return `Lặp ${k}${khoang}${buoi}`;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Các ngày (YYYY-MM-DD) của chuỗi lặp, buổi đầu là `ngay`. Theo tháng: ngày 31 rơi vào tháng ngắn thì lấy ngày cuối tháng (như lịch thường dùng). */
export function ngayLap(ngay: string, kieu: KieuLap, khoang: number, tong: number): string[] {
  const [y, m, d] = ngay.split("-").map(Number);
  const ra: string[] = [];
  for (let i = 0; i < tong; i++) {
    if (kieu === "MONTHLY") {
      const tm = m - 1 + i * khoang;
      const nam = y + Math.floor(tm / 12), thang = ((tm % 12) + 12) % 12;
      const cuoi = new Date(Date.UTC(nam, thang + 1, 0)).getUTCDate();
      ra.push(`${nam}-${pad(thang + 1)}-${pad(Math.min(d, cuoi))}`);
    } else {
      const t = new Date(Date.UTC(y, m - 1, d + i * khoang * (kieu === "WEEKLY" ? 7 : 1)));
      ra.push(`${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`);
    }
  }
  return ra;
}

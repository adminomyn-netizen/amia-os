// Lịch hẹn: nguồn đặt và lịch lặp theo đúng mã SalonHero (dữ liệu chuyển sang giữ nguyên mã), nhãn tiếng Việt lấy từ bản dịch của SalonHero.

/** Nguồn đặt lịch: mã SalonHero → nhãn. Thứ tự = thường gặp trước (theo 51.875 lịch đã chuyển). */
export const NGUON_DAT: Record<string, string> = {
  PHONE: "Gọi điện", MESSENGER: "FB Messenger", TELESALE: "Telesale", REFERRAL: "Giới thiệu", ZALO: "Zalo", VOUCHER: "Voucher",
  WEB: "Từ website", WALKIN: "Đến trực tiếp", REPEAT: "Định kỳ", HOTLINE: "Hotline", EVENT: "Sự kiện", GOOGLE: "Google", TIKTOK: "Tiktok",
  INSTAGRAM: "Instagram", WHATSAPP: "WhatsApp", SHOPEE: "Shopee", JAMJA: "Jamja", HANA: "Chatbot", IOS: "iOS app", ANDROID: "Android app",
  ONLINE: "Đặt online",
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

// ───────── Lưới lịch hẹn kiểu SalonHero (nhân viên / chỗ / thời gian × ngày) ─────────
const THU_DAI = ["C.Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
/** Thứ của ngày YYYY-MM-DD: 0 = Chủ nhật … 6 = Thứ 7 (không phụ thuộc múi giờ máy). */
export const thuCuaNgay = (ngay: string) => new Date(`${ngay}T00:00:00Z`).getUTCDay();
const ddmm = (ngay: string) => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`;
/** Nhãn cột ngày: "Hôm nay (28/10)", "Thứ 5 (29/10)", "C.Nhật (01/11)". */
export const nhanCotNgay = (ngay: string, homNay: string) => (ngay === homNay ? `Hôm nay (${ddmm(ngay)})` : `${THU_DAI[thuCuaNgay(ngay)]} (${ddmm(ngay)})`);
/** Thanh ngày bên phải: "Thứ 4, 28/10/2026 (Hôm nay)". */
export const nhanNgayDai = (ngay: string, homNay: string) => `${THU_DAI[thuCuaNgay(ngay)]}, ${ddmm(ngay)}/${ngay.slice(0, 4)}${ngay === homNay ? " (Hôm nay)" : ""}`;
/** "2026-10-28" → "28-10-2026" (ô chọn khoảng ngày). */
export const ngayGach = (ngay: string) => ngay.split("-").reverse().join("-");

/** Tên nhân viên hiển thị IN HOA: "MSC.TV-25.0115.Nguyễn Thị Thư" → "MSC.TV-25.0115.NGUYỄN THỊ THƯ". */
export const tenNvHoa = (ten: string) => ten.trim().toLocaleUpperCase("vi-VN");
/** Chữ tắt trong vòng tròn: bỏ phần mã "MSC.…." ở đầu, lấy chữ cái đầu của từ CUỐI rồi từ ĐẦU ("Đinh Thị Hôngg Mây" → "MĐ"); một từ thì lấy hai chữ đầu. */
export function chuTatTen(ten: string) {
  const t = ten.trim();
  const sach = /^MSC\./i.test(t) ? t.slice(t.lastIndexOf(".") + 1).trim() || t : t;
  const tu = sach.split(/\s+/).filter(Boolean);
  if (tu.length === 0) return "?";
  if (tu.length === 1) return tu[0].slice(0, 2).toLocaleUpperCase("vi-VN");
  return (tu[tu.length - 1][0] + tu[0][0]).toLocaleUpperCase("vi-VN");
}
/** Mọi ngày từ `tu` đến `den` (gồm cả hai đầu), tối đa `toiDa` ngày. */
export function cacNgayTrong(tu: string, den: string, toiDa = 31): string[] {
  const ra: string[] = [];
  for (let t = new Date(`${tu}T00:00:00Z`), d = new Date(`${den}T00:00:00Z`); t <= d && ra.length < toiDa; t.setUTCDate(t.getUTCDate() + 1)) ra.push(t.toISOString().slice(0, 10));
  return ra;
}
/** Số ô hạng khách: Vàng → cúp, Bạch kim/Kim cương → kim cương, Bạc → huy chương, Thường → không biểu tượng. */
export const BIEU_TUONG_HANG: Record<string, "cup" | "kim_cuong" | "huy_chuong" | ""> = { "Vàng": "cup", "Bạch kim": "kim_cuong", "Kim cương": "kim_cuong", "Bạc": "huy_chuong", "Thường": "" };

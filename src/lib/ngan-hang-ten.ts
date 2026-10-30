// Chuẩn hoá tên ngân hàng về dạng ngắn ("Ngân hàng Vietcombank" → "Vietcombank"). Hàm thuần, dùng cho thu ngân, bù dữ liệu SalonHero và bộ lọc hoá đơn điện tử.
// Bản sao cùng quy tắc cho script nằm ở scripts/chuyen-salonhero/lib.mjs (có test so khớp hai bên).

/** Thứ tự ưu tiên khi hiện ô chọn ở Thu ngân. */
export const NGAN_HANG_MAC_DINH = ["Techcombank", "Vietcombank", "Sacombank", "TPBank", "BIDV", "Khác"] as const;

/** [tên ngắn, mẫu khớp trên chữ đã bỏ dấu, viết thường]. Thứ tự quan trọng: mẫu cụ thể đứng trước. */
const BANG: [string, RegExp][] = [
  ["Vietcombank", /vietcombank|\bvcb\b|ngoai thuong/],
  ["Techcombank", /techcombank|\btcb\b|ky thuong/],
  ["Sacombank", /sacombank|\bstb\b|sai gon thuong tin/],
  ["TPBank", /tpbank|tien phong/],
  ["BIDV", /\bbidv\b|dau tu va phat trien/],
  ["VietinBank", /vietinbank|vietin\b|cong thuong/],
  ["Agribank", /agribank|nong nghiep/],
  ["OCB", /\bocb\b|phuong dong/],
  ["ACB", /\bacb\b|a chau/],
  ["MBBank", /mb ?bank|\bmb\b|quan doi/],
  ["SHB", /\bshb\b|sai gon ha noi/],
  ["SCB", /\bscb\b|sai gon scb/],
  ["SGB", /\bsgb\b/],
  ["DongA Bank", /dong a/],
  ["SeABank", /seabank|dong nam a/],
  ["MSB", /maritime|\bmsb\b|hang hai/],
  ["VPBank", /vpbank|viet nam thinh vuong/],
  ["Eximbank", /eximbank|xuat nhap khau/],
  ["VIB", /\bvib\b|quoc te/],
  ["PGBank", /pgbank|petrolimex/],
  ["LPBank", /lpbank|lien viet/],
  ["HDBank", /hdbank|phat trien tp/],
  ["ANZ", /\banz\b/],
  ["HSBC", /hsbc/],
  ["Deutsche Bank", /deutsche/],
  ["Citibank", /citibank|citi\b/],
  ["Standard Chartered", /standard chartered/],
  ["PVcomBank", /pvcombank|dai chung/],
  ["ABBank", /abbank|an binh/],
  ["BacABank", /bacabank|bac a\b/],
  ["VietABank", /vietabank|viet a bank|viet a\b/],
  ["VietBank", /vietbank|viet nam thuong tin/],
  ["Bao Viet Bank", /bao viet/],
  ["BVBank", /viet capital|bvbank|ban viet/],
  ["KienLongBank", /kien long/],
  ["Commonwealth Bank", /commonwealth/],
  ["Shinhan Bank", /shinhan/],
  ["Nam A Bank", /nam a bank|nam a\b/],
  ["OceanBank", /ocean/],
  ["GPBank", /gpbank|dau khi toan cau/],
  ["NCB", /\bncb\b|quoc dan/],
  ["Woori", /woori/],
];

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

/** Tên ngân hàng dạng ngắn; chuỗi rỗng/null → null; tên lạ thì giữ nguyên chữ (bỏ chữ "Ngân hàng" ở đầu, tối đa 40 ký tự). */
export function chuanTenNganHang(ten: string | null | undefined): string | null {
  const goc = String(ten ?? "").replace(/\s+/g, " ").trim();
  if (!goc) return null;
  const k = boDau(goc);
  for (const [ngan, mau] of BANG) if (mau.test(k)) return ngan;
  const sach = goc.replace(/^ngân hàng\s+/i, "").replace(/^(tmcp|nh)\s+/i, "").trim();
  return sach ? sach.slice(0, 40) : null;
}

/** Hai phương thức có ngân hàng nhận: chuyển khoản và quẹt thẻ. Tiền mặt và trừ thẻ tiền thì không. */
export const CO_NGAN_HANG = ["chuyen_khoan", "quet_the"] as const;
export const coNganHang = (phuongThuc: string) => (CO_NGAN_HANG as readonly string[]).includes(phuongThuc);

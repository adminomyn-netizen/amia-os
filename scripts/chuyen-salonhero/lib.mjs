// Thư viện chung cho bộ chuyển SalonHero → AMIA OS (đợt 28/10/2026). Đọc bản xuất NDJSON, nối DB thật, mã đợt, nhân viên hệ thống, bản đồ mã.
import pg from "pg";
import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";

export const HANG = { NORMAL: "Thường", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch kim", DIAMOND: "Kim cương" };
export const LOC_DALAT = 9202; // Đà Lạt; MỌI nơi khác (Vinh 8377, cơ sở cũ "Amia Beauty Center", không rõ) = VINH (chị Lâm chốt 28/10)
export const cnTheoLoc = (id) => (Number(id) === LOC_DALAT ? "DALAT" : "VINH");
export const vnNgay = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10) : null);
export const sdt = (s) => { let p = String(s ?? "").replace(/\D/g, ""); if (p.startsWith("84") && p.length >= 11) p = "0" + p.slice(2); return p; };
export const sach = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
export const so = (v) => Math.round(Number(v) || 0);

export async function ketNoi() {
  if (!process.env.PW) throw new Error("Thiếu PW (mật khẩu DB lấy từ Keychain amia-os-db-password)");
  const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
  await db.connect();
  return db;
}

/** Đọc tệp NDJSON từng dòng (không nạp cả tệp). */
export async function* docNdjson(tep) {
  if (!existsSync(tep)) throw new Error("Không có tệp " + tep);
  const rl = createInterface({ input: createReadStream(tep, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const l of rl) if (l) yield JSON.parse(l);
}
export async function docHet(tep) { const ra = []; for await (const x of docNdjson(tep)) ra.push(x); return ra; }

export async function theoLo(mang, n, fn) { for (let i = 0; i < mang.length; i += n) await fn(mang.slice(i, i + n), i); }

/** Tạo (nếu chưa có) bản ghi đợt nhập. */
export async function taoDot(db, ma, moTa) {
  await db.query(`insert into public.nhap_dot (ma, mo_ta) values ($1, $2) on conflict (ma) do nothing`, [ma, moTa]);
}

/** Người lập/ghi cho dữ liệu chuyển: tài khoản hệ thống không đăng nhập được (hoat_dong = false). */
export async function nhanVienHeThong(db) {
  const ten = "Dữ liệu SalonHero (hệ thống)";
  let r = (await db.query(`select id from public.nhan_vien where ho_ten = $1 limit 1`, [ten])).rows[0];
  if (!r) r = (await db.query(`insert into public.nhan_vien (ho_ten, vai_tro, hoat_dong, chuc_danh) values ($1, 'nhan_vien', false, 'Tài khoản hệ thống – không đăng nhập') returning id`, [ten])).rows[0];
  return r.id;
}

export async function mapMa(db, bang, cot = "sh_id") {
  const m = new Map();
  for (const r of (await db.query(`select ${cot} as sh, id from public.${bang} where ${cot} is not null`)).rows) m.set(Number(r.sh), r.id);
  return m;
}

export function inBang(rows) { console.table(rows); }

// ── Ngân hàng nhận tiền của từng khoản thanh toán (migration 0179, thanh_toan.ngan_hang) ──
// Bản sao quy tắc của src/lib/ngan-hang-ten.ts (tests/ngan-hang-ten.test.ts so khớp hai bên). Đổi bên này thì đổi cả bên kia.
const NGAN_HANG_MAU = [
  ["Vietcombank", /vietcombank|\bvcb\b|ngoai thuong/], ["Techcombank", /techcombank|\btcb\b|ky thuong/], ["Sacombank", /sacombank|\bstb\b|sai gon thuong tin/], ["TPBank", /tpbank|tien phong/],
  ["BIDV", /\bbidv\b|dau tu va phat trien/], ["VietinBank", /vietinbank|vietin\b|cong thuong/], ["Agribank", /agribank|nong nghiep/], ["OCB", /\bocb\b|phuong dong/], ["ACB", /\bacb\b|a chau/],
  ["MBBank", /mb ?bank|\bmb\b|quan doi/], ["SHB", /\bshb\b|sai gon ha noi/], ["SCB", /\bscb\b|sai gon scb/], ["SGB", /\bsgb\b/], ["DongA Bank", /dong a/], ["SeABank", /seabank|dong nam a/],
  ["MSB", /maritime|\bmsb\b|hang hai/], ["VPBank", /vpbank|viet nam thinh vuong/], ["Eximbank", /eximbank|xuat nhap khau/], ["VIB", /\bvib\b|quoc te/], ["PGBank", /pgbank|petrolimex/],
  ["LPBank", /lpbank|lien viet/], ["HDBank", /hdbank|phat trien tp/], ["ANZ", /\banz\b/], ["HSBC", /hsbc/], ["Deutsche Bank", /deutsche/], ["Citibank", /citibank|citi\b/],
  ["Standard Chartered", /standard chartered/], ["PVcomBank", /pvcombank|dai chung/], ["ABBank", /abbank|an binh/], ["BacABank", /bacabank|bac a\b/], ["VietABank", /vietabank|viet a bank|viet a\b/],
  ["VietBank", /vietbank|viet nam thuong tin/], ["Bao Viet Bank", /bao viet/], ["BVBank", /viet capital|bvbank|ban viet/], ["KienLongBank", /kien long/], ["Commonwealth Bank", /commonwealth/],
  ["Shinhan Bank", /shinhan/], ["Nam A Bank", /nam a bank|nam a\b/], ["OceanBank", /ocean/], ["GPBank", /gpbank|dau khi toan cau/], ["NCB", /\bncb\b|quoc dan/], ["Woori", /woori/],
];
const boDauChu = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
export function chuanTenNganHang(ten) {
  const goc = String(ten ?? "").replace(/\s+/g, " ").trim();
  if (!goc) return null;
  const k = boDauChu(goc);
  for (const [ngan, mau] of NGAN_HANG_MAU) if (mau.test(k)) return ngan;
  const sachTen = goc.replace(/^ngân hàng\s+/i, "").replace(/^(tmcp|nh)\s+/i, "").trim();
  return sachTen ? sachTen.slice(0, 40) : null;
}
const PT_SH = { CASH: "tien_mat", TRANSFER: "chuyen_khoan", CARD: "quet_the", COD: "ship_cod", WALLET: "vi_dien_tu" }; // 0199: COD/ví vào quỹ ngân hàng như SalonHero
const ptShDich = (t) => PT_SH[String(t ?? "").toUpperCase()] ?? "chuyen_khoan";
const soTien = (v) => Math.round(Number(v) || 0);

/** Chuẩn bị dữ liệu ngân hàng của MỘT hoá đơn SalonHero ({l, d} trong tệp NDJSON hoặc d lấy từ API): ngân hàng theo từng khoản (phương thức + số tiền) từ lịch sử thanh toán,
 *  dự phòng từ amount_paid_multi, và ngân hàng chung của hoá đơn (chỉ khi hoá đơn TRANSFER/CARD một loại). */
export function chuanBiNganHangSh(r) {
  const l = r.l ?? {}, d = r.d ?? {};
  const ptHd = String(l.payment_type ?? d.payment_type ?? "").toUpperCase();
  const theoSuKien = new Map(), theoMulti = new Map();
  const them = (m, pt, tien, ten) => { const k = `${pt}|${tien}`; (m.get(k) ?? m.set(k, new Set()).get(k)).add(ten ?? ""); };
  for (const x of d.paymentHistory ?? []) if (!x.is_deleted && soTien(x.amount_paid) > 0) them(theoSuKien, ptShDich(x.payment_type), soTien(x.amount_paid), chuanTenNganHang(x.bank_name));
  if (ptHd === "MULTIPLE") {
    let m = []; try { m = JSON.parse(l.amount_paid_multi ?? d.amount_paid_multi ?? "[]"); } catch { m = []; }
    for (const x of Array.isArray(m) ? m : []) if (soTien(x.amount_paid) > 0) them(theoMulti, ptShDich(x.payment_type), soTien(x.amount_paid), chuanTenNganHang(x.bank_name));
  }
  const tenHd = ptHd === "TRANSFER" || ptHd === "CARD" ? chuanTenNganHang(l.bank_name ?? d.bank_name) : null;
  return { ptHd, theoSuKien, theoMulti, tenHd };
}

/** Ngân hàng của một khoản thanh toán AMIA (phương thức + số tiền). Trả { ten, nguon }: nguon = su_kien | multi | hoa_don | khong_ro | mo_ho | khong_ap_dung.
 *  Mơ hồ (cùng phương thức + số tiền nhưng hai ngân hàng khác nhau) thì ten = null, KHÔNG đoán. */
export function nganHangKhoan(ch, pt, tien) {
  if (pt !== "chuyen_khoan" && pt !== "quet_the") return { ten: null, nguon: "khong_ap_dung" };
  const k = `${pt}|${soTien(tien)}`;
  for (const [m, nguon] of [[ch.theoSuKien, "su_kien"], [ch.theoMulti, "multi"]]) {
    const s = m.get(k); if (!s) continue;
    const co = [...s].filter(Boolean);
    if (!co.length) continue;
    if (co.length > 1 || (s.has("") && ch.tenHd !== co[0])) return { ten: null, nguon: "mo_ho" };
    return { ten: co[0], nguon };
  }
  if (ch.tenHd) return { ten: ch.tenHd, nguon: "hoa_don" };
  return { ten: null, nguon: "khong_ro" };
}

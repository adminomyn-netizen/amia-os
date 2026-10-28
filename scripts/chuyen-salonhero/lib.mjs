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

// Dùng: PW=<mật khẩu DB> node scripts/nhap-salonhero/chay.mjs [--that]
//   Mặc định CHẠY THỬ: nhập trong một giao dịch rồi huỷ (rollback), in số liệu đối chiếu. Thêm --that mới ghi thật.
// Cần: dữ liệu đã xuất ở sao-luu/salonhero/*.json (xem scripts/nhap-salonhero/README.md); mật khẩu DB ở Keychain `amia-os-db-password`.
import pg from "pg";
import { readFileSync } from "node:fs";
import { doiChieu, nhap } from "./nhap.mjs";

const that = process.argv.includes("--that");
const doc = (t) => JSON.parse(readFileSync(`sao-luu/salonhero/${t}.json`, "utf8"));
const d = {
  khach: doc("khach"), khach_chi_tiet: doc("khach_chi_tiet"), the: doc("the"), loai_the: doc("loai_the"), dich_vu: doc("dich_vu"), san_pham: doc("san_pham"),
  nhom: doc("nhom"), nhan_vien: doc("nhan_vien"), no: doc("no"), ton_kho: doc("ton_kho"), don_vi: doc("don_vi"),
};
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false }, statement_timeout: 600000 });
await db.connect();
try {
  await db.query("begin");
  const kq = await nhap(db, d, { log: (m) => console.log("…", m) });
  console.log(JSON.stringify(kq, null, 1));
  const ds = await doiChieu(db, d);
  console.table(ds);
  if (ds.some((x) => !x.khop)) { console.log("KHÔNG KHỚP → huỷ, không ghi."); await db.query("rollback"); process.exitCode = 1; }
  else if (!that) { await db.query("rollback"); console.log("Chạy thử OK (đã huỷ, chưa ghi). Thêm --that để ghi thật."); }
  else { await db.query("commit"); console.log("ĐÃ GHI."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

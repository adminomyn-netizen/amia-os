// PW=<mật khẩu DB> node scripts/dinh-muc/chay.mjs [--that]   (mặc định chạy thử rồi huỷ)
import pg from "pg";
import { readFileSync } from "node:fs";
import { nhapDinhMuc } from "./nhap.mjs";
const that = process.argv.includes("--that");
const rows = JSON.parse(readFileSync("scripts/dinh-muc/flora-25-10.json", "utf8"));
const anhXa = JSON.parse(readFileSync("scripts/dinh-muc/anh-xa-dich-vu.json", "utf8"));
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query("begin");
  const kq = await nhapDinhMuc(db, rows, anhXa);
  console.log(JSON.stringify(kq, null, 1));
  await db.query(that ? "commit" : "rollback");
  console.log(that ? "ĐÃ GHI." : "Chạy thử (đã huỷ). Thêm --that để ghi.");
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

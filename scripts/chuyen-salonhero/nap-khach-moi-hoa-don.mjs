// Nạp hoa_don.khach_moi = is_new_customer gốc SalonHero (0212) cho mọi hoá đơn chuyển từ SalonHero. Đọc bản xuất có sẵn (chỉ đọc), bản sau đè bản trước.
// Chạy: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/nap-khach-moi-hoa-don.mjs [--that]   (mặc định chạy thử, rollback)
import { createRequire } from "node:module"; import { createReadStream, readdirSync, existsSync } from "node:fs"; import { createInterface } from "node:readline";
const require = createRequire("/Users/phamtunglam/project___1140/amia-os/package.json");
const pg = require("pg");
const GOC = "/Users/phamtunglam/project___1140/amia-os/sao-luu";
const tep = ["salonhero-20261028-1753/hoa_don.ndjson", "salonhero-20261028-1753/hoa_don_bosung.ndjson", "salonhero-20261028-1753/hoa_don_2026_10.ndjson",
  ...readdirSync(GOC).filter((n) => /^dong-bo-\d{8}-\d{4}$/.test(n)).sort().map((n) => `${n}/hoa_don.ndjson`)].filter((f) => existsSync(`${GOC}/${f}`));
const co = new Map();
for (const f of tep) for await (const dong of createInterface({ input: createReadStream(`${GOC}/${f}`), crlfDelay: Infinity })) { if (!dong.trim()) continue; const r = JSON.parse(dong); const d = r.d ?? r; const id = Number(r.id ?? d.id ?? r.l?.id);
  if (id && d.is_new_customer != null && d.is_new_customer !== "") co.set(id, Number(d.is_new_customer) === 1); }
console.log("đọc", tep.length, "tệp →", co.size, "hoá đơn có cờ; khách mới:", [...co.values()].filter(Boolean).length);
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect(); await db.query("begin");
try {
  await db.query("set local session_replication_role = replica"); // chỉ đổi cờ, không chạy trigger thông báo
  const ds = [...co.entries()]; let n = 0;
  for (let i = 0; i < ds.length; i += 5000) n += (await db.query(`update public.hoa_don h set khach_moi = x.v from jsonb_to_recordset($1::jsonb) as x(sh bigint, v boolean) where h.sh_id = x.sh and h.khach_moi is distinct from x.v`, [JSON.stringify(ds.slice(i, i + 5000).map(([sh, v]) => ({ sh, v })))])).rowCount;
  const k = (await db.query(`select count(*) filter (where sh_id is not null) sh, count(*) filter (where sh_id is not null and khach_moi is null) sh_trong, count(*) filter (where khach_moi) moi, count(*) filter (where sh_id is null and khach_moi is not null) app from public.hoa_don`)).rows[0];
  console.log("cập nhật", n, "hoá đơn", k);
  if (process.argv.includes("--that")) { await db.query("commit"); console.log("ĐÃ GHI"); } else { await db.query("rollback"); console.log("chạy thử — đã rollback"); }
} catch (e) { await db.query("rollback"); console.log("LỖI → rollback:", e.message); }
await db.end();

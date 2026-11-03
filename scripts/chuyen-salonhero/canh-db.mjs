// Đo nhanh DB AMIA trước khi đồng bộ đêm: in 1 dòng JSON {"dn":"ok"|"loi","dn_ms":N} (N = thời gian kết nối + 1 truy vấn nhỏ). Cần PW như các script khác.
import { ketNoi } from "./lib.mjs";
const t = Date.now();
try {
  const db = await ketNoi();
  await db.query("select count(*) from public.chi_nhanh");
  await db.end();
  console.log(JSON.stringify({ dn: "ok", dn_ms: Date.now() - t }));
} catch { console.log(JSON.stringify({ dn: "loi", dn_ms: Date.now() - t })); }

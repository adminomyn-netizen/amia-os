// Bù ngày tạo thật của dịch vụ, sản phẩm, gói thẻ (SalonHero createdAt) vào cột tao_luc, để Thu ngân sắp xếp "Mới nhất" đúng.
// Trước đó cả danh mục có cùng tao_luc = lúc nạp (24–29/10/2026). Chạy lại an toàn. Dry-run mặc định; --that mới ghi.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/bu-ngay-tao-danh-muc.mjs [--that]
import { readFileSync } from "node:fs";
import { ketNoi } from "./lib.mjs";

const that = process.argv.includes("--that");
const tep = (ten) => { const d = JSON.parse(readFileSync(`sao-luu/salonhero/${ten}.json`, "utf8")); return Array.isArray(d) ? d : d.data; };
const db = await ketNoi();
const NGUON = [["dich_vu", "dich_vu"], ["san_pham", "san_pham"], ["goi_the", "loai_the"]];
try {
  await db.query("begin");
  for (const [bang, nguon] of NGUON) {
    const ds = tep(nguon).filter((x) => x.createdAt).map((x) => ({ sh: String(x.id), tao: new Date(x.createdAt).toISOString() }));
    const r = await db.query(
      `with n as (select (x->>'sh') sh, (x->>'tao')::timestamptz tao from jsonb_array_elements($1::jsonb) x)
       update public.${bang} t set tao_luc = n.tao from n where t.sh_id::text = n.sh and t.tao_luc is distinct from n.tao`, [JSON.stringify(ds)]);
    const tong = (await db.query(`select count(*)::int n, count(distinct tao_luc::date)::int ngay from public.${bang}`)).rows[0];
    console.log(`${bang}: nguồn ${ds.length}, cập nhật ${r.rowCount}, sau đó ${tong.n} dòng / ${tong.ngay} ngày tạo khác nhau`);
  }
  await db.query(that ? "commit" : "rollback");
  console.log(that ? "ĐÃ GHI." : "Chạy thử, đã huỷ (thêm --that để ghi).");
} catch (e) { await db.query("rollback"); throw e; } finally { await db.end(); }

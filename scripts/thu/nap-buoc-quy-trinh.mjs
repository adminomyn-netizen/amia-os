// Nạp bước quy trình dịch vụ (0322) từ JSON dựng từ sheet Lark "MSC26 - Quy trình dịch vụ Trị Liệu 2026".
// Dùng: PW=… node scripts/thu/nap-buoc-quy-trinh.mjs <seed-0322.json> [--ghi]   (không có --ghi = chạy thử, chỉ in số, KHÔNG ghi)
// Chạy lại được: bước upsert theo khoa; liên kết dịch vụ → bước của các dịch vụ trong tệp được thay hẳn (dịch vụ khác không đụng).
// Chỉ ghi bảng cấu hình quy trình (buoc_quy_trinh, dich_vu_buoc) — không tiền, không kho, không thẻ.
import { readFileSync } from "node:fs";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";

const [tep, co] = process.argv.slice(2);
if (!tep) throw new Error("Đưa đường dẫn seed-0322.json");
const ghi = co === "--ghi";
const { buoc, dich_vu_buoc: lk } = JSON.parse(readFileSync(tep, "utf8"));
const db = await ketNoi();
try {
  await db.query("begin");
  const dv = new Set((await db.query("select id from public.dich_vu where id = any($1::uuid[])", [[...new Set(lk.map((x) => x.dich_vu_id))]])).rows.map((x) => x.id));
  const thieu = lk.filter((x) => !dv.has(x.dich_vu_id));
  if (thieu.length) throw new Error(`Có ${new Set(thieu.map((x) => x.dich_vu_id)).size} dịch vụ không còn trong DB`);
  const truoc = (await db.query("select (select count(*) from public.buoc_quy_trinh) b, (select count(*) from public.dich_vu_buoc) l")).rows[0];
  await db.query(`insert into public.buoc_quy_trinh (ten, khoa, dung_chung, goi_y_vat_tu)
    select x.ten, x.khoa, x.dung_chung, x.goi_y_vat_tu from jsonb_to_recordset($1::jsonb) as x(ten text, khoa text, dung_chung boolean, goi_y_vat_tu text)
    on conflict (khoa) do update set ten = excluded.ten, dung_chung = excluded.dung_chung, goi_y_vat_tu = excluded.goi_y_vat_tu`, [JSON.stringify(buoc)]);
  await db.query("delete from public.dich_vu_buoc where dich_vu_id = any($1::uuid[])", [[...dv]]);
  await db.query(`insert into public.dich_vu_buoc (dich_vu_id, buoc_id, thu_tu, goi_y_vat_tu, nguon)
    select x.dich_vu_id, b.id, x.thu_tu, x.goi_y_vat_tu, x.nguon from jsonb_to_recordset($1::jsonb) as x(dich_vu_id uuid, khoa text, thu_tu int, goi_y_vat_tu text, nguon text)
    join public.buoc_quy_trinh b on b.khoa = x.khoa`, [JSON.stringify(lk)]);
  const sau = (await db.query("select (select count(*) from public.buoc_quy_trinh) b, (select count(*) from public.dich_vu_buoc) l")).rows[0];
  console.log(`Bước: ${truoc.b} → ${sau.b} · Liên kết dịch vụ→bước: ${truoc.l} → ${sau.l} (tệp có ${buoc.length} bước, ${lk.length} liên kết, ${dv.size} dịch vụ)`);
  await db.query(ghi ? "commit" : "rollback");
  console.log(ghi ? "ĐÃ GHI" : "CHẠY THỬ — đã huỷ, DB không đổi (thêm --ghi để ghi)");
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
finally { await db.end(); }

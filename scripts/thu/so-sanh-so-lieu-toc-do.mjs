// Chụp số liệu các view tính sẵn (v_the_khach, v_khach_hang, v_ton_kho, đếm thẻ sắp hết) để so trước/sau một thay đổi tốc độ.
// Dùng: PW=... node scripts/thu/so-sanh-so-lieu-toc-do.mjs <tệp.json>   rồi   node scripts/thu/so-sanh-so-lieu-toc-do.mjs so <trước.json> <sau.json>
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";
const [lenh, a, b] = process.argv.slice(2);
if (lenh === "so") {
  const A = JSON.parse(readFileSync(a, "utf8")), B = JSON.parse(readFileSync(b, "utf8")); let loi = 0;
  for (const k of Object.keys(A)) {
    const x = A[k], y = B[k];
    if (!y) { console.log("THIẾU", k); loi++; continue; }
    const ok = x.n === y.n && x.bam === y.bam;
    console.log(ok ? "KHỚP" : "LỆCH", k, x.n, y.n);
    if (!ok) { loi++; const mx = new Map(x.dong.map((r) => [r[0], r])); let in_ = 0; for (const r of y.dong) { const o = mx.get(r[0]); if (JSON.stringify(o) !== JSON.stringify(r) && in_++ < 5) console.log("  trước", JSON.stringify(o), "\n  sau  ", JSON.stringify(r)); } }
  }
  process.exit(loi ? 1 : 0);
}
const db = await ketNoi();
const TRUY = {
  v_the_khach: `select id::text, so_buoi_con, so_du_tien::text, tinh_trang from public.v_the_khach order by id`,
  dem_the_sap_het: `select coalesce(chi_nhanh_id::text,'-'), count(*)::int from public.v_the_khach where tinh_trang='sap_het' and loai='lan' group by 1 order by 1`,
  v_khach_hang: `select id::text, chi_12_thang::text, hang, so_the_dang_dung, trang_thai from public.v_khach_hang order by id`,
  v_ton_kho: `select chi_nhanh_id::text || ':' || san_pham_id::text, ton::text, duoi_muc_toi_thieu from public.v_ton_kho order by 1`,
};
const ra = {};
try {
  for (const [k, sql] of Object.entries(TRUY)) {
    const t = Date.now();
    const r = (await db.query({ text: sql, rowMode: "array" })).rows;
    ra[k] = { n: r.length, bam: createHash("sha256").update(JSON.stringify(r)).digest("hex"), dong: r };
    console.log(k, r.length, "dòng", Date.now() - t, "ms");
  }
  writeFileSync(lenh, JSON.stringify(ra));
} finally { await db.end(); }

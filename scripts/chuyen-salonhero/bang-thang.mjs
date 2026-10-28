import { ketNoi, docNdjson, mapMa, vnNgay } from "./lib.mjs";
const D = "sao-luu/salonhero-20261028-1753";
const dm = async (t) => { const m = new Map(); for await (const r of docNdjson(`${D}/${t}`)) m.set(r[0], r); return m; };
const don = await dm("dem_don_v2.ndjson"), lich = await dm("dem_lich_v2.ndjson");
const db = await ketNoi(); const khach = await mapMa(db, "khach_hang"); const bo = new Map(); const seen = new Set();
for (const t of ["lich_hen.ndjson", "lich_hen_bosung.ndjson"]) for await (const r of docNdjson(`${D}/${t}`)) { if (seen.has(r.id)) continue; seen.add(r.id); if (!khach.get(Number(r.customer_id))) { const m = vnNgay(r.booked_at).slice(0, 7); bo.set(m, (bo.get(m) ?? 0) + 1); } }
const dA = new Map((await db.query(`select to_char(ngay_hd,'YYYY-MM') m, count(*) filter (where trang_thai='hoan_thanh')::int ht, coalesce(sum(tong_phai_thu - tien_tru_the) filter (where trang_thai='hoan_thanh'),0)::bigint tien from public.hoa_don where la_lich_su and sh_id is not null and not la_so_du_dau group by 1`)).rows.map((r) => [r.m, r]));
const lA = new Map((await db.query(`select to_char(bat_dau at time zone 'Asia/Ho_Chi_Minh','YYYY-MM') m, count(*)::int n from public.lich_hen where la_lich_su and sh_id is not null group by 1`)).rows.map((r) => [r.m, r.n]));
const out = []; let nl = 0;
for (const m of [...don.keys()].sort()) { if (m < "2023-01") continue; const s = don.get(m), a = dA.get(m) ?? { ht: 0, tien: 0 }, l = lich.get(m), sl = (l?.[1] ?? 0) - (bo.get(m) ?? 0), al = lA.get(m) ?? 0;
  const ok = a.ht === s[2] && Number(a.tien) === Number(s[5]) && sl === al; if (!ok) nl++;
  out.push(`${m} | HĐ ${s[2]}|${a.ht} | tiền ${s[5]}|${a.tien} | lịch ${sl}|${al}${bo.get(m) ? ` (−${bo.get(m)} khách không còn)` : ""}${ok ? "" : "  ← LỆCH"}`); }
console.log(out.join("\n")); console.log("tháng lệch:", nl, "/", out.length); await db.end();

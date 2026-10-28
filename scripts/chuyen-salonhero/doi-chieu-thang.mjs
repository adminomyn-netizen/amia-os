// ĐỐI CHIẾU THEO THÁNG (bản đúng, sau khi sửa lỗi sót ngày cuối tháng): số đếm sống SalonHero lấy lại bằng khoảng [đầu tháng, đầu tháng sau) vs DB AMIA.
// Dùng: PW=… node scripts/chuyen-salonhero/doi-chieu-thang.mjs <thư_mục_xuất> [--tu 2023-01] [--den 2026-09]
import { writeFileSync } from "node:fs";
import { ketNoi, docNdjson, mapMa, vnNgay, inBang } from "./lib.mjs";
const D = process.argv[2]; const arg = (t, m) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const tu = arg("--tu", "2023-01"), den = arg("--den", "2026-09");
const TT = { BOOKED: "chua_xac_nhan", CONFIRMED: "da_xac_nhan", CHECKIN: "cho_phuc_vu", PROCESSED: "dang_phuc_vu", FINISHED: "hoan_thanh", CANCELED: "huy", NOSHOW: "khong_den" };
const docMap = async (tep) => { const m = new Map(); try { for await (const r of docNdjson(`${D}/${tep}`)) m.set(r[0], r); } catch { /* chưa có */ } return m; };
const donSong = await docMap("dem_don_v2.ndjson"), lichSong = await docMap("dem_lich_v2.ndjson");
const db = await ketNoi(); const q = async (s, p) => (await db.query(s, p)).rows;
// khách không còn ở AMIA → lịch không đổ được (ngoại lệ đã biết)
const khach = await mapMa(db, "khach_hang"); const boQua = new Map(); const thay = new Set();
for (const tep of ["lich_hen.ndjson", "lich_hen_bosung.ndjson"]) { try { for await (const r of docNdjson(`${D}/${tep}`)) { if (thay.has(r.id)) continue; thay.add(r.id); if (!khach.get(Number(r.customer_id))) { const k = vnNgay(r.booked_at).slice(0, 7) + "|" + (TT[r.status] ?? "?"); boQua.set(k, (boQua.get(k) ?? 0) + 1); } } } catch { /* tệp chưa có */ } }
const donAm = new Map((await q(`select to_char(ngay_hd,'YYYY-MM') m, count(*) filter (where trang_thai='hoan_thanh')::int ht, count(*) filter (where trang_thai='huy')::int huy, coalesce(sum(tong_phai_thu - tien_tru_the) filter (where trang_thai='hoan_thanh'),0)::bigint tien, coalesce(sum(con_no) filter (where trang_thai='hoan_thanh'),0)::bigint no
  from public.hoa_don where la_lich_su and sh_id is not null and not la_so_du_dau group by 1`)).map((r) => [r.m, r]));
const lichAm = new Map((await q(`select to_char(bat_dau at time zone 'Asia/Ho_Chi_Minh','YYYY-MM') m, trang_thai t, count(*)::int n from public.lich_hen where la_lich_su and sh_id is not null group by 1,2`)).map((r) => [r.m + "|" + r.t, r.n]));
const kq = []; let lechDon = 0, lechLich = 0;
for (const [m, s] of [...donSong].sort()) {
  if (m < tu || m > den) continue; const a = donAm.get(m) ?? { ht: 0, huy: 0, tien: 0, no: 0 };
  const d = [a.ht - s[2], a.huy - s[4], Number(a.tien) - Number(s[5]), Number(a.no) - Number(s[7])]; if (d.some((x) => x)) { lechDon++; kq.push({ thang: m, loai: "hóa đơn", SH_ht: s[2], AM_ht: a.ht, SH_huy: s[4], AM_huy: a.huy, SH_tien: s[5], AM_tien: Number(a.tien), SH_no: s[7], AM_no: Number(a.no) }); }
}
for (const [m, s] of [...lichSong].sort()) {
  if (m < tu || m > den) continue; for (const [st, n] of Object.entries(s[2])) { const k = m + "|" + (TT[st] ?? st); const sh = n - (boQua.get(k) ?? 0), am = lichAm.get(k) ?? 0; if (sh !== am) { lechLich++; kq.push({ thang: m, loai: "lịch " + st, SH: sh, AMIA: am }); } }
}
console.log({ thang_don_so: [...donSong.keys()].filter((m) => m >= tu && m <= den).length, thang_lich_so: [...lichSong.keys()].filter((m) => m >= tu && m <= den).length, thang_don_lech: lechDon, o_lich_lech: lechLich, khach_khong_con_o_amia: [...boQua.values()].reduce((a, b) => a + b, 0) });
inBang(kq.slice(0, 40)); writeFileSync(`${D}/_doi-chieu-thang-${tu}-${den}.json`, JSON.stringify(kq, null, 1)); await db.end();

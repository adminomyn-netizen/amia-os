// BƯỚC 4 — NHẮC CHĂM SÓC KHÁCH SalonHero → AMIA OS (bảng khach_nhac, migration 0064). Mặc định chạy THỬ (rollback); --that mới ghi.
// Dùng: PW=… node scripts/chuyen-salonhero/buoc4-nhac.mjs <thư_mục_xuất> [--tu 2023] [--den 2026] [--dot SH-2810-12] [--that]
// Lọc năm theo ngày TẠO nhắc (createdAt, giờ VN) — cùng cách đã dùng khi đổ nhắc 2020–2022 lên Lark Base.
import { writeFileSync } from "node:fs";
import { ketNoi, docNdjson, theoLo, taoDot, mapMa, cnTheoLoc, vnNgay, sach, inBang } from "./lib.mjs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const tu = arg("--tu", "2023"), den = arg("--den", "2099"), dot = arg("--dot", "SH-2810-12"), that = process.argv.includes("--that");
const TT = { ACTIVE: "dang_nhac", INACTIVE: "da_xong", CANCEL: "huy" };
const iso = (v) => (v && v !== "None" ? v : null);

const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const nguon = [], thay = new Set();
for await (const r of docNdjson(`${thuMuc}/nhac_cham_soc.ndjson`)) {
  const nam = vnNgay(r.createdAt).slice(0, 4);
  if (nam < tu || nam > den || thay.has(r.id)) continue; thay.add(r.id); nguon.push(r);
}
console.log(`Nguồn nhắc ${tu}–${den}: ${nguon.length}`);
try {
  await db.query("begin");
  await taoDot(db, dot, `Nhắc chăm sóc ${tu}–${den} từ bản xuất lần 2 (28/10/2026)`);
  const khach = await mapMa(db, "khach_hang"), cn = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  const daCo = new Set((await q(`select sh_id from public.khach_nhac where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const rows = [], khongKhach = []; let daCoN = 0;
  for (const r of nguon) {
    if (daCo.has(Number(r.id))) { daCoN++; continue; }
    const kh = khach.get(Number(r.customer_id)); if (!kh) { khongKhach.push(`${r.id}:${sach(r.customer_fullname)}`); continue; }
    let cac = null; try { cac = r.all_reminded_dates ? JSON.parse(r.all_reminded_dates) : null; } catch { /* giữ null */ }
    rows.push({ sh_id: Number(r.id), khach_id: kh, noi_dung: sach(r.content) || null, ghi_chu: sach(r.note) || null, trang_thai: TT[r.status] ?? "dang_nhac", sh_trang_thai: r.status, ngay_nhac: iso(r.reminded_date), hoan_thanh_luc: iso(r.finish_at),
      kieu_lap: iso(r.repeat_type), so_lan_lap: r.total_repeat == null ? null : Number(r.total_repeat), cac, so_cuoc_goi: Number(r.call_quantity) || 0, dich_vu_ten: sach(r.service_name) || null, nguoi_tao_ten: sach(r.creator_name) || null,
      nguoi_pt_ten: sach(r.user_name) || null, cn: cnTheoLoc(r.location_id), tao_luc: iso(r.createdAt) ?? new Date().toISOString() });
  }
  let n = 0;
  await theoLo(rows, 1000, async (lo) => {
    n += (await q(`insert into public.khach_nhac (sh_id, khach_id, noi_dung, ghi_chu, trang_thai, sh_trang_thai, ngay_nhac, hoan_thanh_luc, kieu_lap, so_lan_lap, cac_ngay_nhac, so_cuoc_goi, dich_vu_ten, nguoi_tao_ten, nguoi_phu_trach_ten, chi_nhanh_id, tao_luc, la_lich_su, nhap_dot)
      select x.sh_id, x.khach_id, x.noi_dung, x.ghi_chu, x.trang_thai, x.sh_trang_thai, x.ngay_nhac, x.hoan_thanh_luc, x.kieu_lap, x.so_lan_lap, x.cac, x.so_cuoc_goi, x.dich_vu_ten, x.nguoi_tao_ten, x.nguoi_pt_ten, (select id from public.chi_nhanh where ma = x.cn), x.tao_luc, true, $2
      from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, noi_dung text, ghi_chu text, trang_thai text, sh_trang_thai text, ngay_nhac timestamptz, hoan_thanh_luc timestamptz, kieu_lap text, so_lan_lap int, cac jsonb, so_cuoc_goi int, dich_vu_ten text, nguoi_tao_ten text, nguoi_pt_ten text, cn text, tao_luc timestamptz)
      on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), dot])).length;
  });
  // Đối chiếu theo năm tạo × trạng thái: tệp (trừ khách không còn ở AMIA) | AMIA
  const ids = nguon.map((r) => Number(r.id));
  const am = new Map((await q(`select to_char(tao_luc at time zone 'Asia/Ho_Chi_Minh','YYYY') y, sh_trang_thai t, count(*)::int n from public.khach_nhac where sh_id = any($1::bigint[]) group by 1,2`, [ids])).map((r) => [r.y + "|" + r.t, r.n]));
  const tep = new Map(), bo = new Set(khongKhach.map((s) => Number(s.split(":")[0])));
  for (const r of nguon) { if (bo.has(Number(r.id))) continue; const k = vnNgay(r.createdAt).slice(0, 4) + "|" + r.status; tep.set(k, (tep.get(k) ?? 0) + 1); }
  const bang = [...new Set([...am.keys(), ...tep.keys()])].sort().map((k) => ({ nam_trangthai: k, tep_xuat: tep.get(k) ?? 0, AMIA: am.get(k) ?? 0, lech: (am.get(k) ?? 0) - (tep.get(k) ?? 0) }));
  inBang(bang);
  const lech = bang.reduce((s, r) => s + Math.abs(r.lech), 0);
  const tom = { dot, that, nguon: nguon.length, ghi: n, da_co: daCoN, khach_khong_con: khongKhach.length, mau_khach_khong_con: khongKhach.slice(0, 5), tong_lech: lech };
  console.log(tom); writeFileSync(`${thuMuc}/_buoc4-${tu}-${den}-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, bang }, null, 1));
  if (that && (lech || n !== rows.length)) { await db.query("rollback"); console.log("LỆCH → HUỶ, chưa ghi gì."); process.exitCode = 2; }
  else if (that) { await db.query("commit"); console.log("ĐÃ GHI THẬT."); }
  else { await db.query("rollback"); console.log("Chạy thử xong (đã rollback)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI:", e.message); process.exitCode = 1; }
await db.end();

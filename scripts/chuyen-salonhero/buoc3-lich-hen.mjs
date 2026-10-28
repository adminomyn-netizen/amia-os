// BƯỚC 3 — LỊCH HẸN SalonHero → AMIA OS (đợt 28/10/2026). Mặc định chạy THỬ trong 1 giao dịch rồi rollback; --that mới ghi thật.
// Dùng: PW=… node scripts/chuyen-salonhero/buoc3-lich-hen.mjs <thư_mục_xuất> [--tep lich_hen.ndjson] [--thang 2026-10] [--dot SH-2810-03] [--song <booking_months.json>] [--that]
// Quy tắc (chị Lâm chốt 28/10): cơ sở 9202 = Đà Lạt, MỌI nơi khác (kể cả "Amia Beauty Center" cũ) = Vinh; cờ la_lich_su = true; không thông báo.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { ketNoi, docNdjson, theoLo, taoDot, nhanVienHeThong, mapMa, cnTheoLoc, vnNgay, sach, inBang } from "./lib.mjs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const tep = arg("--tep", "lich_hen.ndjson"), thang = arg("--thang", null), dot = arg("--dot", "SH-2810-03"), that = process.argv.includes("--that"), tepSong = arg("--song", null);

const tu = arg("--tu", null), den = arg("--den", null);
const TT = { BOOKED: "chua_xac_nhan", CONFIRMED: "da_xac_nhan", CHECKIN: "cho_phuc_vu", PROCESSED: "dang_phuc_vu", FINISHED: "hoan_thanh", CANCELED: "huy", NOSHOW: "khong_den" };
const mang = (s) => { try { const v = typeof s === "string" ? JSON.parse(s) : s; return Array.isArray(v) ? v.map(Number).filter(Boolean) : []; } catch { return []; } };
const iso = (v) => (v && v !== "None" ? v : null);

const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const nguon = [];
for await (const r of docNdjson(`${thuMuc}/${tep}`)) {
  const ng = vnNgay(r.booked_at);
  if (thang && !ng.startsWith(thang)) continue;
  if (tu && ng.slice(0, 7) < tu) continue;
  if (den && ng.slice(0, 7) > den) continue;
  nguon.push(r);
}
console.log(`Nguồn ${tep}${thang ? " tháng " + thang : ""}: ${nguon.length} lịch`);

try {
  await db.query("begin");
  await taoDot(db, dot, `Lịch hẹn lịch sử ${thang ?? (tu || den ? `${tu ?? "đầu"}→${den ?? "cuối"}` : "toàn bộ")} từ bản xuất lần 2 (28/10/2026)`);
  const he = await nhanVienHeThong(db);
  const cn = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  const khach = await mapMa(db, "khach_hang"), nv = await mapMa(db, "nhan_vien"), dv = await mapMa(db, "dich_vu");
  const daCo = new Set((await q(`select sh_id from public.lich_hen where sh_id is not null`)).map((r) => Number(r.sh_id)));

  const bao = { khong_co_khach: [], da_co: 0, dv_khong_khop: 0, nv_khong_khop: 0, gio_bang_0: 0, trung_ma_nguon: 0 };
  const lich = [], dvRows = [], thay = new Set(), boQua = new Map(); // boQua: lịch của khách không còn ở AMIA (vd khách thử) — ngoại lệ đã biết, trừ khỏi cả hai vế đối chiếu
  for (const r of nguon) {
    const shId = Number(r.id);
    if (thay.has(shId)) { bao.trung_ma_nguon++; continue; } thay.add(shId);
    if (daCo.has(shId)) { bao.da_co++; continue; }
    const kh = khach.get(Number(r.customer_id));
    if (!kh) { bao.khong_co_khach.push(shId); const k = vnNgay(r.booked_at).slice(0, 7) + "|" + (TT[r.status] ?? "chua_xac_nhan"); boQua.set(k, (boQua.get(k) ?? 0) + 1); bao.khong_co_khach_ten = [...(bao.khong_co_khach_ten ?? []), `${shId}:${sach(r.customer_name)}`]; continue; }
    const bd = new Date(r.booked_at), phut = Number(r.estimated_duration) > 0 ? Number(r.estimated_duration) : 30;
    if (!(Number(r.estimated_duration) > 0)) bao.gio_bang_0++;
    const ops = mang(r.operator_id), nvId = ops.length ? nv.get(ops[0]) ?? null : null;
    if (ops.length && !nvId) bao.nv_khong_khop++;
    const trangThai = TT[r.status] ?? "chua_xac_nhan";
    lich.push({
      sh_id: shId, khach_id: kh, chi_nhanh: cnTheoLoc(r.location_id), bat_dau: bd.toISOString(), ket_thuc: new Date(bd.getTime() + phut * 60000).toISOString(), trang_thai: trangThai,
      nhan_vien_id: nvId, nguon: sach(r.booking_source) || null, ghi_chu: sach(r.note) || null, ly_do_huy: trangThai === "huy" ? `Huỷ bởi ${r.canceled_by ?? "không rõ"} (SalonHero)` : null,
      tao_luc: iso(r.createdAt) ?? bd.toISOString(), ma_dat_lich: iso(r.booking_code), nguon_dat: sach(r.booking_source) || null,
      xac_nhan_luc: iso(r.confirmed_at), checkin_luc: iso(r.checkin_at), bat_dau_lam_luc: iso(r.process_at), hoan_thanh_luc: iso(r.finished_at), huy_luc: iso(r.canceled_at),
      nhan_vien_ten: sach(r.operator_names) || null, dich_vu_ten: sach(r.product_names) || null, so_khach: Number(r.number_of_guests) || 1,
      kieu_lap: iso(r.repeat_type), nguoi_tao_ten: sach(r.created_by_user_fullname) || null, hoa_don_sh_id: iso(r.order_id) ? Number(r.order_id) : null,
    });
    const dem = new Map();
    for (const p of mang(r.product_id)) { const d = dv.get(p); if (d) dem.set(d, (dem.get(d) ?? 0) + 1); else bao.dv_khong_khop++; }
    for (const [d, n] of dem) dvRows.push({ sh: shId, dv: d, n });
  }
  console.log(`Sẽ ghi ${lich.length} lịch, ${dvRows.length} dòng dịch vụ`, bao.khong_co_khach.length ? `(${bao.khong_co_khach.length} lịch không có khách ở AMIA)` : "");

  let nLich = 0, nDv = 0;
  await theoLo(lich, 2000, async (lo) => {
    const r = await q(`insert into public.lich_hen (sh_id, khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id, nguon, ghi_chu, ly_do_huy, tao_boi, tao_luc, cap_nhat_luc, ma_dat_lich, nguon_dat,
         xac_nhan_luc, checkin_luc, bat_dau_lam_luc, hoan_thanh_luc, huy_luc, nhan_vien_ten, dich_vu_ten, so_khach, kieu_lap, nguoi_tao_ten, hoa_don_sh_id, la_lich_su, nhap_dot)
       select x.sh_id, x.khach_id, (select id from public.chi_nhanh where ma = x.chi_nhanh), x.bat_dau, x.ket_thuc, x.trang_thai, x.nhan_vien_id, x.nguon, x.ghi_chu, x.ly_do_huy, $2::uuid, x.tao_luc, x.tao_luc, x.ma_dat_lich, x.nguon_dat,
         x.xac_nhan_luc, x.checkin_luc, x.bat_dau_lam_luc, x.hoan_thanh_luc, x.huy_luc, x.nhan_vien_ten, x.dich_vu_ten, x.so_khach, x.kieu_lap, x.nguoi_tao_ten, x.hoa_don_sh_id, true, $3
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, chi_nhanh text, bat_dau timestamptz, ket_thuc timestamptz, trang_thai text, nhan_vien_id uuid, nguon text, ghi_chu text, ly_do_huy text, tao_luc timestamptz,
         ma_dat_lich text, nguon_dat text, xac_nhan_luc timestamptz, checkin_luc timestamptz, bat_dau_lam_luc timestamptz, hoan_thanh_luc timestamptz, huy_luc timestamptz, nhan_vien_ten text, dich_vu_ten text, so_khach int,
         kieu_lap text, nguoi_tao_ten text, hoa_don_sh_id bigint)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), he, dot]);
    nLich += r.length;
  });
  await theoLo(dvRows, 4000, async (lo) => {
    const r = await q(`insert into public.lich_hen_dich_vu (lich_id, dich_vu_id, so_luong, nhap_dot)
       select l.id, x.dv, x.n, $2 from jsonb_to_recordset($1::jsonb) as x(sh bigint, dv uuid, n int) join public.lich_hen l on l.sh_id = x.sh where l.nhap_dot = $2
       on conflict do nothing returning 1`, [JSON.stringify(lo), dot]);
    nDv += r.length;
  });

  // ── Đối chiếu: nguồn (tệp) | AMIA (DB) | SalonHero sống (nếu có) theo tháng × trạng thái ──
  const ids = [...thay].filter((id) => !daCo.has(id));
  const am = await q(`select to_char(bat_dau at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') m, trang_thai t, count(*)::int n from public.lich_hen where sh_id = any($1::bigint[]) group by 1, 2`, [ids]);
  const amTheo = new Map(am.map((r) => [r.m + "|" + r.t, r.n]));
  const nguonTheo = new Map();
  const daDem = new Set();
  for (const r of nguon) { if (daCo.has(Number(r.id)) || daDem.has(Number(r.id))) continue; daDem.add(Number(r.id)); const k = vnNgay(r.booked_at).slice(0, 7) + "|" + (TT[r.status] ?? "chua_xac_nhan"); nguonTheo.set(k, (nguonTheo.get(k) ?? 0) + 1); }
  const song = new Map();
  if (tepSong && existsSync(tepSong) && !process.argv.includes("--bo-song")) for (const [m, tong, st] of JSON.parse(readFileSync(tepSong, "utf8"))) { for (const [s, n] of Object.entries(st)) song.set(m + "|" + (TT[s] ?? s), n); }
  const keys = [...new Set([...amTheo.keys(), ...nguonTheo.keys()])].sort();
  const bang = keys.map((k) => { const a = amTheo.get(k) ?? 0, g = (nguonTheo.get(k) ?? 0) - (boQua.get(k) ?? 0), s = song.has(k) ? song.get(k) - (boQua.get(k) ?? 0) : null; return { thang_trangthai: k, tep_xuat: g, AMIA: a, SalonHero_song: s, lech_so_voi_tep: a - g, lech_so_voi_song: s == null ? "-" : a - s }; });
  inBang(bang);
  const tongLech = bang.reduce((t, r) => t + Math.abs(r.lech_so_voi_tep), 0), tongLechSong = bang.reduce((t, r) => t + (typeof r.lech_so_voi_song === "number" ? Math.abs(r.lech_so_voi_song) : 0), 0);
  const tom = { dot, that, thang, khach_khong_con: bao.khong_co_khach_ten ?? [], nguon: nguon.length, lich_ghi: nLich, dich_vu_ghi: nDv, ...bao, khong_co_khach: bao.khong_co_khach.length, tong_lech_voi_tep: tongLech, tong_lech_voi_song: tongLechSong };
  console.log(tom);
  writeFileSync(`${thuMuc}/_buoc3-${thang ?? (tu || den ? `${tu ?? "dau"}-${den ?? "cuoi"}` : "tat-ca")}-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, bang, khong_co_khach: bao.khong_co_khach.slice(0, 500) }, null, 1));

  if (that && (tongLech !== 0 || tongLechSong !== 0 || nLich !== lich.length)) { await db.query("rollback"); console.log("LỆCH → HỦY, chưa ghi gì."); process.exitCode = 2; }
  else if (that) { await db.query("commit"); console.log("ĐÃ GHI THẬT."); }
  else { await db.query("rollback"); console.log("Chạy thử xong (đã rollback)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI:", e.message); process.exitCode = 1; }
finally { await db.end(); }

// BƯỚC 1b — THẺ ĐÃ DÙNG HẾT / HẾT HẠN / bị thu hồi mà SalonHero không trả trong danh sách thẻ (getMemberCardList), vào DB thật.
//  Nguồn: <thư-mục-xuất>/the_het.ndjson = chi tiết thẻ lấy bằng getMemberCardById (id từ hoa_don_dong.the_khach_sh_id chưa có thẻ)
//  + getMemberCardsByCustomerId (mọi thẻ khác của cùng các khách đó). Chỉ ĐỌC từ SalonHero.
//  Cùng logic cấp thẻ / sổ cái với buoc1-khach-the.mjs:
//   • loại 'lan': cấp `use_limit` buổi + 1 dòng điều chỉnh −số buổi đã dùng (còn lại = limit − use_count); loại 'tien': cấp số dư hiện tại.
//   • trạng thái: thu hồi → 'thu_hoi', khoá → 'khoa', còn lại 'hoat_dong' (thẻ hết buổi / hết hạn vẫn 'hoat_dong' — giao diện tự suy ra "hết hạn / hết buổi" từ hạn dùng và số dư; KHÔNG thêm giá trị enum mới).
//   • khách phải có sẵn trong khach_hang (sh_id), gói phải có sẵn trong goi_the (sh_id); thiếu thì LIỆT KÊ và bỏ.
//   • idempotent theo sh_id: thẻ đã có trong DB thì bỏ qua, KHÔNG sửa, KHÔNG xoá gì của dữ liệu hiện có.
// Mặc định CHẠY THỬ trong 1 giao dịch rồi HUỶ (rollback) và in bảng đối chiếu; thêm --that mới ghi thật (tự huỷ nếu có thẻ lệch số dư).
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/buoc1b-the-het.mjs <thư-mục-xuất> [--that] [--dot SH-2910-01]
import { ketNoi, docHet, theoLo, taoDot, nhanVienHeThong, mapMa, cnTheoLoc, vnNgay, sach, so, inBang } from "./lib.mjs";
import { writeFileSync } from "node:fs";

const thuMuc = process.argv[2]; if (!thuMuc) throw new Error("Thiếu thư mục xuất");
const that = process.argv.includes("--that");
const dot = process.argv.includes("--dot") ? process.argv[process.argv.indexOf("--dot") + 1] : "SH-2910-01";
const db = await ketNoi();
const q = async (sql, p) => (await db.query(sql, p)).rows;
function dedupe(v0, daCo, id) { let v = v0; if (daCo.has(v)) v = `${v0}-${id}`; daCo.add(v); return v; }

const dsThe = (await docHet(`${thuMuc}/the_het.ndjson`)).filter((c) => !c.is_deleted);
console.log(`Nguồn: ${dsThe.length} thẻ (thẻ đã hết / hết hạn / thu hồi ngoài danh sách SalonHero)`);

const dich = (c) => { // số dư đúng theo SalonHero: buổi còn lại (thẻ lần) hoặc số dư tiền (thẻ tiền)
  const lan = c.card_type === "USING";
  const limit = Math.max(1, Math.round(Number(c.use_limit) || 1));
  const da = Math.min(limit, Math.max(0, Math.round(Number(c.use_count) || 0)));
  return { lan, limit, da, buoi: lan ? limit - da : 0, tien: lan ? 0 : Math.max(0, so(c.account_balance)) };
};

try {
  await db.query("begin");
  await taoDot(db, dot, "Thẻ đã hết/hết hạn/thu hồi mà danh sách thẻ SalonHero không trả (29/10/2026)");
  const he = await nhanVienHeThong(db);
  const khachMap = await mapMa(db, "khach_hang");
  const goi = await mapMa(db, "goi_the");
  const daCo = new Set((await q(`select sh_id from public.the_khach where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const maThe = new Set((await q(`select ma from public.the_khach`)).map((r) => r.ma));
  const bo = { da_co_trong_db: 0, khong_co_khach: 0, khong_co_goi: 0 }; const boMau = { khach: new Set(), goi: new Set() };
  const theMoi = [];
  for (const c of dsThe) {
    if (daCo.has(Number(c.id))) { bo.da_co_trong_db++; continue; }
    if (!khachMap.has(Number(c.customer_id))) { bo.khong_co_khach++; boMau.khach.add(Number(c.customer_id)); continue; }
    if (!goi.has(Number(c.card_id))) { bo.khong_co_goi++; boMau.goi.add(Number(c.card_id)); continue; }
    const d = dich(c);
    theMoi.push({ sh_id: Number(c.id), ma: dedupe(sach(c.code) || `TSH${c.id}`, maThe, c.id), khach_sh: Number(c.customer_id), goi_sh: Number(c.card_id), cn: cnTheoLoc(c.init_location_id), loai: d.lan ? "lan" : "tien",
      so_buoi_tong: d.lan ? d.limit : null, tong_tien: d.lan ? so(c.card_sale_price) : so(c.card_default_account_balance) || so(c.account_balance),
      gia_tri_buoi: d.lan ? (d.limit < 999999 ? Math.round((Number(c.card_sale_price) || 0) / d.limit) : so(c.card_use_price)) : 0,
      ngay_cap: vnNgay(c.created_at ?? c.createdAt), han_dung: vnNgay(c.expiry_date), trang_thai: c.is_revoked ? "thu_hoi" : c.is_locked ? "khoa" : "hoat_dong",
      ghi_chu: `Chuyển từ SalonHero (mã thẻ ${sach(c.code)}) — thẻ đã hết/hết hạn nằm ngoài danh sách thẻ${c.note ? ` — ${sach(c.note)}` : ""}${d.lan && d.limit >= 999999 ? " — thẻ không giới hạn số buổi" : ""}`,
      so_buoi_cap: d.lan ? d.limit : 0, so_buoi_da_dung: d.lan ? d.da : 0, so_du_tien: d.tien });
  }

  let nTheMoi = 0;
  await theoLo(theMoi, 1000, async (lo) => {
    const them = await q(`with ins as (insert into public.the_khach (sh_id, ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, tong_tien, gia_tri_buoi, cap_tay, ngay_cap, han_dung, trang_thai, ghi_chu, nhap_dot)
         select x.sh_id, x.ma, k.id, g.id, (select id from public.chi_nhanh where ma = x.cn), x.loai, x.so_buoi_tong, x.tong_tien, x.gia_tri_buoi, true, coalesce(x.ngay_cap, current_date), x.han_dung, x.trang_thai, x.ghi_chu, $2
           from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, khach_sh bigint, goi_sh bigint, cn text, loai text, so_buoi_tong int, tong_tien bigint, gia_tri_buoi bigint, ngay_cap date, han_dung date, trang_thai text, ghi_chu text)
           join public.khach_hang k on k.sh_id = x.khach_sh join public.goi_the g on g.sh_id = x.goi_sh on conflict (sh_id) do nothing returning id, sh_id) select id, sh_id from ins`, [JSON.stringify(lo), dot]);
    nTheMoi += them.length;
    const idTheoSh = new Map(them.map((r) => [Number(r.sh_id), r.id])); const sc = [];
    for (const t of lo) { const id = idTheoSh.get(t.sh_id); if (!id) continue;
      if (t.loai === "lan") { sc.push({ the_id: id, loai: "cap", so_buoi: t.so_buoi_cap, so_tien: 0, ghi_chu: "Số buổi gốc chuyển từ SalonHero" }); if (t.so_buoi_da_dung > 0) sc.push({ the_id: id, loai: "dieu_chinh", so_buoi: -t.so_buoi_da_dung, so_tien: 0, ghi_chu: "Số buổi đã dùng trước khi chuyển từ SalonHero" }); }
      else sc.push({ the_id: id, loai: "cap", so_buoi: 0, so_tien: t.so_du_tien, ghi_chu: "Số dư còn lại chuyển từ SalonHero" }); }
    if (sc.length) await q(`insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu, nhap_dot) select x.the_id, x.loai, x.so_buoi, x.so_tien, $2::uuid, x.ghi_chu, $3 from jsonb_to_recordset($1::jsonb) as x(the_id uuid, loai text, so_buoi int, so_tien bigint, ghi_chu text)`, [JSON.stringify(sc), he, dot]);
  });

  // ── ĐỐI CHIẾU (cùng giao dịch) ──
  const kq = [];
  const them = (muc, sh, am, ghi = "") => kq.push({ muc, salonhero: sh, amia: am, lech: Number(am) - Number(sh), khop: Number(sh) === Number(am) ? "KHỚP" : "LỆCH", ghi });
  them("Số thẻ nạp mới", theMoi.length, nTheMoi, `bỏ: ${bo.da_co_trong_db} đã có, ${bo.khong_co_khach} thẻ không có khách (${boMau.khach.size} khách), ${bo.khong_co_goi} thẻ không có gói (${boMau.goi.size} gói)`);
  const sd = new Map((await q(`select t.sh_id, t.loai, t.trang_thai, coalesce(sum(c.so_buoi),0)::int b, coalesce(sum(c.so_tien),0)::bigint tien from public.the_khach t left join public.the_so_cai c on c.the_id = t.id where t.nhap_dot = $1 group by t.sh_id, t.loai, t.trang_thai`, [dot])).map((r) => [Number(r.sh_id), r]));
  let lechThe = 0, conBuoi = 0, buoiHet = 0, conTien = 0, tongBuoiCon = 0; const mauLech = [], trangThai = {};
  for (const t of theMoi) {
    const a = sd.get(t.sh_id);
    if (!a) { lechThe++; mauLech.push([t.sh_id, "không có"]); continue; }
    trangThai[a.trang_thai] = (trangThai[a.trang_thai] || 0) + 1;
    const mong = t.loai === "lan" ? t.so_buoi_cap - t.so_buoi_da_dung : t.so_du_tien; const co = t.loai === "lan" ? a.b : Number(a.tien);
    if (mong !== co) { lechThe++; if (mauLech.length < 10) mauLech.push([t.sh_id, mong, co]); }
    if (t.loai === "lan") { if (a.b > 0) { conBuoi++; tongBuoiCon += a.b; } else buoiHet++; } else if (Number(a.tien) > 0) conTien++;
  }
  them("Thẻ nạp có số dư khác SalonHero (buổi / tiền)", 0, lechThe, JSON.stringify(mauLech));
  const goc = new Map(dsThe.map((c) => [Number(c.id), c]));
  let lechGoc = 0; for (const t of theMoi) { const c = goc.get(t.sh_id); const d = dich(c); const a = sd.get(t.sh_id); if (a && (d.lan ? a.b !== d.buoi : Number(a.tien) !== d.tien)) lechGoc++; }
  them("Đối chiếu lại trực tiếp từ use_limit − use_count / account_balance của SalonHero: thẻ lệch", 0, lechGoc);
  console.log(`Trạng thái thẻ nạp: ${JSON.stringify(trangThai)} · thẻ lần còn buổi: ${conBuoi} (tổng ${tongBuoiCon} buổi) · thẻ lần hết buổi (0): ${buoiHet} · thẻ tiền còn số dư: ${conTien}`);
  const hetHan = (await q(`select count(*)::int n from public.the_khach where nhap_dot = $1 and han_dung < current_date`, [dot]))[0].n;
  const hetHanConBuoi = (await q(`select count(*)::int n from public.the_khach t where t.nhap_dot = $1 and t.han_dung < current_date and (select coalesce(sum(so_buoi),0) + coalesce(sum(so_tien),0) from public.the_so_cai where the_id = t.id) > 0`, [dot]))[0].n;
  console.log(`Thẻ nạp đã quá hạn dùng: ${hetHan} (trong đó còn số dư theo SalonHero: ${hetHanConBuoi})`);

  // dòng hoá đơn còn thiếu thẻ
  const thieu = await q(`select d.the_khach_sh_id id, count(*)::int n from public.hoa_don_dong d where d.the_khach_sh_id is not null and not exists (select 1 from public.the_khach t where t.sh_id = d.the_khach_sh_id) group by 1`);
  const tongDong = thieu.reduce((s, r) => s + r.n, 0);
  const lyDo = { khach_khong_co: 0, goi_khong_co: 0, khong_lay_duoc_tu_salonhero: 0 };
  const dongTheoLyDo = { khach_khong_co: 0, goi_khong_co: 0, khong_lay_duoc_tu_salonhero: 0 };
  const theKhongKhach = new Set(dsThe.filter((c) => !khachMap.has(Number(c.customer_id))).map((c) => Number(c.id)));
  const theKhongGoi = new Set(dsThe.filter((c) => khachMap.has(Number(c.customer_id)) && !goi.has(Number(c.card_id))).map((c) => Number(c.id)));
  const mauThieu = [];
  for (const r of thieu) { const id = Number(r.id); const k = theKhongKhach.has(id) ? "khach_khong_co" : theKhongGoi.has(id) ? "goi_khong_co" : "khong_lay_duoc_tu_salonhero"; lyDo[k]++; dongTheoLyDo[k] += r.n; if (mauThieu.length < 15 && k === "khong_lay_duoc_tu_salonhero") mauThieu.push([id, r.n]); }
  them("Dòng hoá đơn còn trỏ tới thẻ không có trong the_khach (mục tiêu 0)", 0, tongDong, `${thieu.length} thẻ; lý do (thẻ/dòng): ${JSON.stringify(lyDo)} / ${JSON.stringify(dongTheoLyDo)}; mẫu không lấy được: ${JSON.stringify(mauThieu)}`);
  inBang(kq);
  const tom = { dot, that, the_moi: nTheMoi, bo, khach_thieu: [...boMau.khach].slice(0, 20), goi_thieu: [...boMau.goi].slice(0, 20), the_lan_con_buoi: conBuoi, tong_buoi_con: tongBuoiCon, the_lan_het_buoi: buoiHet, the_tien_con_du: conTien, trang_thai: trangThai, qua_han: hetHan, qua_han_con_du: hetHanConBuoi, dong_hoa_don_con_thieu: tongDong, ly_do_thieu: lyDo, dong_theo_ly_do: dongTheoLyDo };
  console.log(JSON.stringify(tom));
  writeFileSync(`${thuMuc}/_buoc1b-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, doi_chieu: kq }, null, 1));
  const lechTong = lechThe + lechGoc + (nTheMoi !== theMoi.length ? 1 : 0);
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  else if (lechTong) { await db.query("rollback"); console.log("CÓ THẺ LỆCH SỐ DƯ → HUỶ, KHÔNG GHI."); process.exitCode = 1; }
  else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

// BƯỚC 6 — LỊCH SỬ NHẬP/XUẤT KHO của SalonHero (2.182 dòng nhập + 498 dòng xuất, 2019–2026) vào sổ kho AMIA (kho_so_cai),
// để các báo cáo Nhập kho / Xuất kho bởi nhân viên / Nhập xuất kho hàng khớp SalonHero. KHÔNG làm đổi tồn hiện tại, KHÔNG ép tồn âm của SalonHero vào sổ.
//
// CÁCH GHI (đợt SH-2910-02, chị Lâm/Tula 29/10/2026):
//  • Mỗi dòng nhập SalonHero  → 1 dòng sổ kho loai='nhap' (+SL), don_gia = thành tiền / SL, tao_luc = giờ SalonHero.
//    Mỗi dòng xuất            → EX_RETURN 'tra_ncc' · EX_CONSUME 'cap_ca' · EX_DESTROY 'hao_hut' · EX_GIFT/EX_INTERNAL/không rõ 'xuat_khan' (−SL).
//  • BÙ TỒN: với mỗi (chi nhánh, sản phẩm) có lịch sử, thêm 1 dòng loai='nhap', ghi chú bắt đầu "Tồn đầu kỳ" (nên mọi báo cáo coi là SỐ DƯ ĐẦU,
//    không tính vào Tổng nhập/xuất), số lượng = −(tổng lịch sử của chính đợt này) ⇒ tồn hiện tại của MỌI (chi nhánh, sản phẩm) KHÔNG ĐỔI (kiểm tự động).
//    Số dư đầu 65 dòng chuyển từ SalonHero (25/10) không bị đụng. Tồn âm của SalonHero không vào sổ (luật chặn tồn âm giữ nguyên).
//  • Chỉ chuyển sản phẩm có sh_id ở AMIA (423 mặt hàng bán lẻ đang dùng). Dòng của sản phẩm SalonHero đã xoá (không có ở AMIA) KHÔNG chuyển, liệt kê ở _kho-lich-su-khong-chuyen.csv.
//  • KHÔNG sinh dòng 'xuat_ban' cho hoá đơn lịch sử (xem phần "Chênh lệch do bán hàng" in ra khi chạy: xuất của SalonHero = xuất thủ công + bán hàng).
//  • kho_so_cai không có cột nhap_dot và go_dot_nhap() không đụng tới nó: mỗi dòng mang nhãn "[SH-2910-02]" trong ghi_chu; GỠ bằng
//    `buoc6-kho-lich-su.mjs <thư-mục> --go [--that]` (KHÔNG dùng go_dot_nhap cho đợt này).
// Mặc định CHẠY THỬ (giao dịch rồi rollback) + in đối chiếu từng chi nhánh bằng chính các hàm báo cáo của app; --that mới commit, đối chiếu lệch thì tự huỷ.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/buoc6-kho-lich-su.mjs <thư-mục-xuất> [--dot SH-2910-02] [--that | --go]
import { ketNoi, docNdjson, taoDot, nhanVienHeThong, cnTheoLoc, vnNgay, sach, inBang } from "./lib.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const dot = arg("--dot", "SH-2910-02"), that = process.argv.includes("--that"), go = process.argv.includes("--go");
const NHAN = `[${dot}]`;
const DAU_KY = "Tồn đầu kỳ".normalize("NFC");
const CUA_SO = "2018-01-01T00:00:00+07:00"; // dòng bù tồn xếp trước mọi lịch sử
const XUAT_LOAI = { EX_RETURN: "tra_ncc", EX_CONSUME: "cap_ca", EX_DESTROY: "hao_hut", EX_GIFT: "xuat_khan", EX_INTERNAL: "xuat_khan" };
const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const lech = []; // mọi chỗ đối chiếu lệch → nếu có thì --that tự huỷ
const ket = { dot, che_do: go ? "go" : that ? "that" : "thu" };
const chuoi = (n) => String(Math.round(n * 1e4) / 1e4);

try {
  await db.query("begin");

  // ───────── GỠ ĐỢT ─────────
  if (go) {
    await db.query(`select set_config('amia.go_dot', 'on', true)`);
    const truoc = (await q(`select count(*)::int n, coalesce(sum(so_luong),0)::float s from public.kho_so_cai where ghi_chu like $1`, [`%${NHAN}%`]))[0];
    if (truoc.n === 0) throw new Error(`Không có dòng sổ kho nào mang nhãn ${NHAN}`);
    await db.query(`delete from public.kho_so_cai where ghi_chu like $1`, [`%${NHAN}%`]);
    await db.query(`update public.nhap_dot set go_luc = now() where ma = $1`, [dot]);
    console.log(`Gỡ đợt ${dot}: ${truoc.n} dòng sổ kho (tổng SL ${truoc.s}).`);
    ket.go = truoc;
    if (that) { await db.query("commit"); console.log("ĐÃ GỠ THẬT."); } else { await db.query("rollback"); console.log("CHẠY THỬ gỡ (rollback)."); }
    await db.end(); process.exit(0);
  }

  // ───────── ĐỌC NGUỒN ─────────
  const nhapRaw = [], xuatRaw = [];
  for await (const r of docNdjson(`${thuMuc}/kho_nhap.ndjson`)) nhapRaw.push(r);
  for await (const r of docNdjson(`${thuMuc}/kho_xuat.ndjson`)) xuatRaw.push(r);
  const tham = JSON.parse(readFileSync(`${thuMuc}/kho_bc_nhap_xuat_tham_chieu.json`, "utf8"));
  console.log(`Nguồn: ${nhapRaw.length} dòng nhập, ${xuatRaw.length} dòng xuất (SalonHero).`);

  // đợt chưa dùng
  if ((await q(`select 1 from public.nhap_dot where ma = $1`, [dot])).length) throw new Error(`Mã đợt ${dot} đã có trong nhap_dot — dùng mã khác hoặc gỡ bằng --go`);
  if ((await q(`select 1 from public.kho_so_cai where ghi_chu like $1 limit 1`, [`%${NHAN}%`])).length) throw new Error(`Sổ kho đã có dòng mang nhãn ${NHAN}`);
  await taoDot(db, dot, `Lịch sử nhập/xuất kho SalonHero (2.182 nhập + 498 xuất) vào kho_so_cai (29/10/2026). GỠ bằng buoc6-kho-lich-su.mjs --go, KHÔNG dùng go_dot_nhap (sổ kho không có cột nhap_dot).`);
  const he = await nhanVienHeThong(db);
  const cn = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  const sp = new Map((await q(`select sh_id, id from public.san_pham where sh_id is not null`)).map((r) => [Number(r.sh_id), r.id]));
  const spInfo = new Map((await q(`select id, ma, ten, ban_le from public.san_pham`)).map((r) => [r.id, r]));

  // ───────── TRẠNG THÁI TRƯỚC ─────────
  const tonKey = (c, s) => `${c}|${s}`;
  const tonTruoc = new Map((await q(`select chi_nhanh_id c, san_pham_id s, sum(so_luong)::float t from public.kho_so_cai group by 1, 2`)).map((r) => [tonKey(r.c, r.s), r.t]));
  const dau65 = (await q(`select count(*)::int n, coalesce(sum(so_luong),0)::float s, max(id)::int mx from public.kho_so_cai`))[0];
  const loTruoc = (await q(`select count(*)::int n, coalesce(sum(con_lai),0)::float s from public.v_ton_lo`))[0];
  const amTruoc = (await q(`select count(*)::int n from public.v_ton_kho where ton < 0`))[0].n;
  console.log(`Trước: ${dau65.n} dòng sổ kho (tổng ${dau65.s}), ${tonTruoc.size} (chi nhánh, sản phẩm), tồn âm ${amTruoc}, v_ton_lo ${loTruoc.n} lô.`);

  // ───────── DỰNG DÒNG ─────────
  const ls = [], boQua = [];
  const ghiNhap = (r) => `Lịch sử SalonHero ${NHAN} · nhập ${sach(r.sku)} #${r.id} · ${r.purpose_type}${r.provider_name ? " · " + sach(r.provider_name) : ""}`;
  const ghiXuat = (r) => `Lịch sử SalonHero ${NHAN} · xuất ${sach(r.sku)} #${r.id} · ${r.purpose_type || "(không rõ)"} ${sach(r.purpose_type_str)}`.trim();
  for (const [nguon, kind] of [[nhapRaw, "nhap"], [xuatRaw, "xuat"]]) {
    for (const r of nguon) {
      const spId = sp.get(Number(r.product_id));
      const co = cn[cnTheoLoc(r.location_id)];
      if (r.status && r.status !== "COMPLETED") { boQua.push({ kind, id: r.id, ly_do: "chưa hoàn tất " + r.status, r }); continue; }
      if (!spId) { boQua.push({ kind, id: r.id, ly_do: "sản phẩm không có ở AMIA", r }); continue; }
      const sl = Number(r.quantity);
      if (!(sl > 0)) { boQua.push({ kind, id: r.id, ly_do: "số lượng ≤ 0", r }); continue; }
      const gia = kind === "nhap" && Number(r.total_price) > 0 ? Math.round((Number(r.total_price) / sl) * 1e4) / 1e4 : null;
      ls.push({ kind, id: Number(r.id), cn: co, sp: spId, loai: kind === "nhap" ? "nhap" : (XUAT_LOAI[r.purpose_type] ?? "xuat_khan"), sl: kind === "nhap" ? sl : -sl, gia, luc: r.createdAt,
        ghi: kind === "nhap" ? ghiNhap(r) : ghiXuat(r), raw: r });
    }
  }
  ls.sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : a.kind === b.kind ? a.id - b.id : a.kind === "nhap" ? -1 : 1));
  // dòng bù tồn: −(tổng lịch sử của chính đợt này) theo (chi nhánh, sản phẩm)
  const rong = new Map();
  for (const d of ls) rong.set(tonKey(d.cn, d.sp), (rong.get(tonKey(d.cn, d.sp)) ?? 0) + d.sl);
  const bu = [...rong].filter(([, v]) => v !== 0).map(([k, v]) => { const [c, s] = k.split("|"); return { cn: c, sp: s, sl: -v }; });
  console.log(`Dựng: ${ls.length} dòng lịch sử (nhập ${ls.filter((d) => d.kind === "nhap").length}, xuất ${ls.filter((d) => d.kind === "xuat").length}), bù tồn ${bu.length} dòng, bỏ qua ${boQua.length}.`);
  const tomBo = {};
  for (const b of boQua) { const k = `${b.kind}|${b.r.location_id}|${b.ly_do}`; const t = (tomBo[k] ??= { dong: 0, sl: 0, tien: 0, sp: new Set() }); t.dong++; t.sl += b.r.quantity; t.tien += Number(b.r.total_price) || 0; t.sp.add(b.r.product_id); }
  inBang(Object.entries(tomBo).map(([k, t]) => ({ nhom: k, dong: t.dong, san_pham: t.sp.size, so_luong: t.sl, tien: t.tien })));
  ket.bo_qua = Object.entries(tomBo).map(([k, t]) => ({ nhom: k, dong: t.dong, san_pham: t.sp.size, so_luong: t.sl, tien: t.tien }));
  const csv = ["loai,ma_dong_salonhero,ngay,chi_nhanh,ma_sp_salonhero,sku,ten,so_luong,thanh_tien,ly_do",
    ...boQua.map((b) => [b.kind, b.r.id, vnNgay(b.r.createdAt), cnTheoLoc(b.r.location_id), b.r.product_id, b.r.product_sku, `"${sach(b.r.product_name).replace(/"/g, "'")}"`, b.r.quantity, b.r.total_price ?? 0, b.ly_do].join(","))].join("\n");
  writeFileSync(`${thuMuc}/_kho-lich-su-khong-chuyen.csv`, csv + "\n");

  // ───────── GHI (dòng bù trước, rồi lịch sử theo thời gian) ─────────
  const chen = async (cols) => {
    for (let i = 0; i < cols.c.length; i += 600) {
      const cat = (a) => a.slice(i, i + 600);
      await db.query(
        `insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id, tao_luc)
         select a, b, c, d, e, f, $7, g from unnest($1::uuid[], $2::uuid[], $3::text[], $4::numeric[], $5::numeric[], $6::text[], $8::timestamptz[]) with ordinality as t(a, b, c, d, e, f, g, ord) order by ord`,
        [cat(cols.c), cat(cols.s), cat(cols.l), cat(cols.q), cat(cols.g), cat(cols.n), he, cat(cols.t)]);
    }
  };
  await chen({ c: bu.map((b) => b.cn), s: bu.map((b) => b.sp), l: bu.map(() => "nhap"), q: bu.map((b) => b.sl), g: bu.map(() => null),
    n: bu.map(() => `${DAU_KY} (bù theo lịch sử SalonHero) ${NHAN}`), t: bu.map(() => CUA_SO) });
  await chen({ c: ls.map((d) => d.cn), s: ls.map((d) => d.sp), l: ls.map((d) => d.loai), q: ls.map((d) => d.sl), g: ls.map((d) => d.gia), n: ls.map((d) => d.ghi), t: ls.map((d) => d.luc) });

  // ───────── KIỂM BẤT BIẾN ─────────
  const sau = (await q(`select count(*)::int n, coalesce(sum(so_luong),0)::float s from public.kho_so_cai`))[0];
  const daGhi = (await q(`select count(*)::int n, count(*) filter (where ghi_chu like 'Tồn đầu kỳ%')::int bu from public.kho_so_cai where ghi_chu like $1`, [`%${NHAN}%`]))[0];
  if (daGhi.n !== ls.length + bu.length || daGhi.bu !== bu.length) lech.push(`Số dòng ghi ${daGhi.n}/${daGhi.bu} ≠ dự kiến ${ls.length + bu.length}/${bu.length} (kiểm LIKE 'Tồn đầu kỳ%' có nhận dòng bù không)`);
  const tonSau = new Map((await q(`select chi_nhanh_id c, san_pham_id s, sum(so_luong)::float t from public.kho_so_cai group by 1, 2`)).map((r) => [tonKey(r.c, r.s), r.t]));
  let doiTon = 0, tonAmMoi = 0;
  for (const [k, t] of tonSau) { if (Math.abs(t - (tonTruoc.get(k) ?? 0)) > 1e-9) doiTon++; if (t < 0) tonAmMoi++; }
  for (const [k, t] of tonTruoc) if (!tonSau.has(k) && t !== 0) doiTon++;
  const dau65Sau = (await q(`select count(*)::int n, coalesce(sum(so_luong),0)::float s from public.kho_so_cai where id <= $1 and ghi_chu not like $2`, [dau65.mx, `%${NHAN}%`]))[0];
  const loSau = (await q(`select count(*)::int n, coalesce(sum(con_lai),0)::float s from public.v_ton_lo`))[0];
  const amSau = (await q(`select count(*)::int n from public.v_ton_kho where ton < 0`))[0].n;
  console.log(`Sau: ${sau.n} dòng sổ kho (tổng ${sau.s}), (chi nhánh, sản phẩm) ${tonSau.size}; tồn đổi ở ${doiTon} cặp; tồn âm ${amSau}; ${dau65Sau.n}/${dau65.n} dòng cũ nguyên vẹn.`);
  if (doiTon) lech.push(`Tồn hiện tại đổi ở ${doiTon} cặp (chi nhánh, sản phẩm)`);
  if (tonAmMoi || amSau !== amTruoc) lech.push(`Có tồn âm (${amSau}, trước ${amTruoc})`);
  if (dau65Sau.n !== dau65.n || dau65Sau.s !== dau65.s) lech.push("Dòng sổ kho cũ bị đổi");
  if (loSau.n !== loTruoc.n || loSau.s !== loTruoc.s) lech.push("v_ton_lo đổi");
  ket.bat_bien = { dong_sau: sau.n, ton_doi: doiTon, ton_am_truoc: amTruoc, ton_am_sau: amSau, dong_cu_nguyen: dau65Sau.n === dau65.n, v_ton_lo: loSau };

  // ───────── ĐỐI CHIẾU THEO CHI NHÁNH × KỲ (dùng chính các hàm báo cáo của app) ─────────
  const KY = [["thang10", "Tháng 10/2026", "2026-10-01", "2026-10-31"], ["nam2025", "Năm 2025", "2025-01-01", "2025-12-31"], ["nam2026", "Năm 2026", "2026-01-01", "2026-12-31"], ["tatca", "Từ đầu → 31/10/2026", "2015-01-01", "2026-10-31"]];
  const LOC = [["VINH", 8377], ["DALAT", 9202]];
  const trongKy = (r, a, b) => { const d = vnNgay(r.createdAt); return d >= a && d <= b; };
  const bang = [], banHang = [];
  const tongTienChuyen = (r) => { const sl = Number(r.quantity), g = Number(r.total_price) > 0 ? Math.round((Number(r.total_price) / sl) * 1e4) / 1e4 : 0; return Math.round(sl * g); };
  for (const [maCn, loc] of LOC) {
    const cnId = cn[maCn];
    for (const [kk, tenKy, a, b] of KY) {
      const nhapKy = nhapRaw.filter((r) => r.location_id === loc && trongKy(r, a, b)), xuatKy = xuatRaw.filter((r) => r.location_id === loc && trongKy(r, a, b));
      const nhapMap = nhapKy.filter((r) => sp.has(Number(r.product_id))), xuatMap = xuatKy.filter((r) => sp.has(Number(r.product_id)));
      // báo cáo Nhập kho (chi tiết) · Xuất kho (chi tiết) · Nhập xuất kho hàng
      const bn = await q(`select * from public.bc_kho_nhap($1::date, $2::date, $3::uuid, null, null, null, false, 20000, 0)`, [a, b, cnId]);
      const bx = await q(`select * from public.bc_kho_xuat($1::date, $2::date, $3::uuid, null, null, false, 20000, 0)`, [a, b, cnId]);
      const bnx = await q(`select * from public.bc_kho_nhap_xuat($1::date, $2::date, $3::uuid, null, null, 20000, 0)`, [a, b, cnId]);
      const slNhap = bn.reduce((s, r) => s + Number(r.so_luong), 0), tienNhap = bn.reduce((s, r) => s + Number(r.tong_tien), 0), slXuat = bx.reduce((s, r) => s + Number(r.so_luong), 0);
      const expTien = nhapMap.reduce((s, r) => s + tongTienChuyen(r), 0);
      const ktr = (ten, got, exp) => { if (Math.abs(got - exp) > 1e-6) lech.push(`${maCn} ${tenKy}: ${ten} ${got} ≠ ${exp}`); };
      ktr("dòng nhập", bn.length, nhapMap.length); ktr("SL nhập", slNhap, nhapMap.reduce((s, r) => s + r.quantity, 0)); ktr("tiền nhập", tienNhap, expTien);
      ktr("dòng xuất", bx.length, xuatMap.length); ktr("SL xuất", slXuat, xuatMap.reduce((s, r) => s + r.quantity, 0));
      // so từng sản phẩm với SalonHero (Nhập xuất kho hàng, 423 mặt hàng bán lẻ)
      const ref = tham[`${loc}_${kk}`], byId = new Map(bnx.map((r) => [r.ma, r]));
      const spById = new Map(); for (const [sh, id] of sp) spById.set(sh, id);
      // bán hàng AMIA (hoá đơn lịch sử, hoàn thành) trong kỳ — CHỈ ĐỂ ĐỐI CHIẾU, không ghi sổ kho
      const ban = new Map((await q(`select p.sh_id, sum(d.so_luong)::float q from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id join public.san_pham p on p.id = d.san_pham_id
        where d.loai = 'san_pham' and h.trang_thai = 'hoan_thanh' and h.chi_nhanh_id = $1 and h.ngay_hd between $2::date and $3::date group by 1`, [cnId, a, b])).map((r) => [Number(r.sh_id), r.q]));
      let nhapKhop = 0, xuatSauBan = 0, cuoiKhop = 0, cuoiLech = [], dauAm = 0, spCo = 0, banTong = 0, xuatSh = 0, nhapSh = 0, xuatTay = 0;
      const mapSpMa = new Map((await q(`select sh_id, ma from public.san_pham where sh_id is not null`)).map((r) => [Number(r.sh_id), r.ma]));
      for (const r of ref) {
        const ma = mapSpMa.get(Number(r.id)); const o = ma && byId.get(ma); if (!o) continue; spCo++;
        const bh = ban.get(Number(r.id)) ?? 0; banTong += bh; xuatSh += r.totalExport; nhapSh += r.totalImport; xuatTay += Number(o.xuat);
        if (Number(o.nhap) === r.totalImport) nhapKhop++;
        if (Number(o.xuat) + bh === r.totalExport) xuatSauBan++;
        if (Number(o.dau) < 0) dauAm++;
        if (kk !== "nam2025") { const exp = Math.max(r.endingInventory, 0); if (Number(o.cuoi) === exp) cuoiKhop++; else if (cuoiLech.length < 8) cuoiLech.push(`${ma}: AMIA ${o.cuoi} / SalonHero ${r.endingInventory}`); }
      }
      if (nhapKhop !== spCo) lech.push(`${maCn} ${tenKy}: Nhập xuất kho hàng — ${spCo - nhapKhop}/${spCo} sản phẩm nhập lệch SalonHero`);
      const tongTien = nhapKy.reduce((s, r) => s + (Number(r.total_price) || 0), 0);
      bang.push({ chi_nhanh: maCn, ky: tenKy,
        "nhap AMIA/map/SH (dòng)": `${bn.length}/${nhapMap.length}/${nhapKy.length}`, "nhap SL AMIA/SH": `${slNhap}/${nhapKy.reduce((s, r) => s + r.quantity, 0)}`, "nhap tiền AMIA/SH": `${tienNhap}/${tongTien}`,
        "xuat AMIA/map/SH (dòng)": `${bx.length}/${xuatMap.length}/${xuatKy.length}`, "xuat SL AMIA/SH": `${slXuat}/${xuatKy.reduce((s, r) => s + r.quantity, 0)}`,
        "NXK nhập khớp sp": `${nhapKhop}/${spCo}`, "NXK xuất+bán khớp sp": `${xuatSauBan}/${spCo}`, "tồn cuối = max(SH,0)": `${cuoiKhop}/${spCo}`, "sp có tồn đầu < 0": dauAm });
      banHang.push({ chi_nhanh: maCn, ky: tenKy, "SalonHero xuất (bán lẻ)": xuatSh, "AMIA xuất thủ công (đã nạp)": xuatTay, "AMIA bán hàng (chưa ghi sổ kho)": banTong, "SalonHero − thủ công − bán": xuatSh - xuatTay - banTong, "tổng tồn đầu AMIA": bnx[0]?.tong_dau ?? 0, "tổng tồn cuối AMIA": bnx[0]?.tong_cuoi ?? 0, "SalonHero tồn cuối": ref.reduce((s, r) => s + r.endingInventory, 0) });
      if (cuoiLech.length && kk === "tatca") console.log(`  ${maCn} tồn cuối lệch (≠ max(SalonHero,0)):`, cuoiLech.join(" · "));
    }
  }
  console.log("\n── ĐỐI CHIẾU BÁO CÁO (AMIA/đã chuyển/SalonHero) ──"); inBang(bang);
  console.log("\n── CHÊNH LỆCH DO BÁN HÀNG (xuất SalonHero = xuất thủ công + bán hàng; AMIA chưa ghi bán hàng lịch sử vào sổ kho) ──"); inBang(banHang);
  ket.doi_chieu = bang; ket.ban_hang = banHang;
  const bt = await q(`select c.ma, count(*)::int n from public.bc_ton_theo_lo(null, null, null, null, 20000, 0) x join public.chi_nhanh c on c.ten = x.chi_nhanh group by 1`);
  console.log("Tồn theo lô (AMIA):", JSON.stringify(bt), "(SalonHero không có lô nào)");

  // ───────── KẾT ─────────
  ket.lech = lech;
  writeFileSync(`${thuMuc}/_buoc6-${that ? "that" : "thu"}.json`, JSON.stringify(ket, null, 1));
  if (lech.length) { console.log("\nLỆCH:\n - " + lech.join("\n - ")); throw new Error("Đối chiếu lệch → huỷ (rollback)"); }
  if (that) { await db.query("commit"); console.log(`\nĐÃ GHI THẬT đợt ${dot}: ${ls.length} dòng lịch sử + ${bu.length} dòng bù tồn.`); }
  else { await db.query("rollback"); console.log("\nCHẠY THỬ SẠCH (đã rollback, DB không đổi). Thêm --that để ghi."); }
} catch (e) {
  try { await db.query("rollback"); } catch {}
  console.error("LỖI:", e.message); process.exitCode = 1;
} finally { await db.end(); }

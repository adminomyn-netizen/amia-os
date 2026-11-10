// BƯỚC 1 — KHÁCH + THẺ từ bản xuất lần 2 của SalonHero (28/10/2026) vào DB thật.
//  • Khách đã có (khớp sh_id): CẬP NHẬT các trường lấy từ SalonHero + trường mới (nghề nghiệp, công ty, Facebook, SĐT phụ…). Không đổi số điện thoại, nguồn, người phụ trách, người giới thiệu.
//  • Khách chưa có: THÊM MỚI (gắn nhap_dot). Khách đã bị xoá khỏi danh sách SalonHero nhưng còn thẻ: dựng lại từ thẻ như đợt 25/10.
//  • Thẻ đã có: số dư (buổi / tiền) được kéo về ĐÚNG số hiện tại của SalonHero bằng 1 dòng sổ cái "điều chỉnh" có ghi chú (sổ cái không sửa dòng cũ). Thẻ mới: cấp mới.
//  • Ghi chú riêng của SalonHero (CS######) → khach_ghi_chu (sh_id = mã ghi chú, bỏ qua nếu đã có).
// Mặc định CHẠY THỬ trong 1 giao dịch rồi HUỶ (rollback) và in bảng đối chiếu; thêm --that mới ghi thật.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/buoc1-khach-the.mjs <thư-mục-xuất> [--that] [--dot SH-2810-01]
import { ketNoi, docHet, docNdjson, theoLo, taoDot, nhanVienHeThong, mapMa, HANG, cnTheoLoc, vnNgay, sdt, sach, so, inBang, ngaySinhSh } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const thuMuc = process.argv[2]; if (!thuMuc) throw new Error("Thiếu thư mục xuất");
const that = process.argv.includes("--that");
const dot = process.argv.includes("--dot") ? process.argv[process.argv.indexOf("--dot") + 1] : "SH-2810-01";
const db = await ketNoi();
const q = async (sql, p) => (await db.query(sql, p)).rows;

// ── Nguồn ──
const dsKhach = await docHet(`${thuMuc}/khach.ndjson`);
const chiTiet = new Map();
for await (const r of docNdjson(`${thuMuc}/khach_tong_hop.ndjson`)) chiTiet.set(Number(r.id), r);
const dsThe = await docHet(`${thuMuc}/the.ndjson`);
const nhoLines = await docHet(`${thuMuc}/nho.ndjson`);
console.log(`Nguồn: khách ${dsKhach.length}, chi tiết ${chiTiet.size}, thẻ ${dsThe.length}`);
if (chiTiet.size < dsKhach.length) console.log(`CẢNH BÁO: mới có chi tiết của ${chiTiet.size}/${dsKhach.length} khách (bản xuất chưa xong)`);

function nguonKhach(ct) {
  const s = sach(ct.refer_source).toLowerCase();
  if (Number(ct.refer_by_cust_id) > 0 || /bạn bè|giới thiệu|người quen/.test(s)) return "khach_cu_gioi_thieu";
  if (/page|facebook|fb|voucher|tiktok|zalo|google|website|quảng cáo|ads/.test(s)) return "mkt";
  return "khac";
}
function dedupe(v0, daCo, id) { let v = v0; if (daCo.has(v)) v = `${v0}-${id}`; daCo.add(v); return v; }

// Khách còn thẻ nhưng không còn trong danh sách → dựng từ thẻ
const coKhach = new Set(dsKhach.map((c) => Number(c.id)));
const dung = new Map();
for (const c of dsThe) {
  if (c.is_deleted || coKhach.has(Number(c.customer_id)) || dung.has(Number(c.customer_id))) continue;
  dung.set(Number(c.customer_id), { id: c.customer_id, code: c.customer_code, full_name: c.customer_fullname, mobile: c.customer_phone, gender: "", rank: "NORMAL", loyalty_point: 0, tags: [], location_names: c.init_location_name ?? "", _tu_the: true });
}
const tatCa = [...dsKhach, ...dung.values()].sort((a, b) => a.id - b.id);

if (that && chiTiet.size < dsKhach.length) throw new Error(`Bản xuất chưa đủ (chi tiết ${chiTiet.size}/${dsKhach.length}) — không ghi thật khi thiếu dữ liệu`);
const bao = { sdt_doi_bo_qua: 0, sdt_trong: 0, sdt_trung: 0, mat_chi_tiet: 0 };
const dieuTra = { sdt_doi: [], mat_chi_tiet: [] };

try {
  await db.query("begin");
  await taoDot(db, dot, "Khách + thẻ từ bản xuất lần 2 (28/10/2026)");
  const he = await nhanVienHeThong(db);
  const chu = (await q(`select id from public.nhan_vien where vai_tro = 'quan_ly' and hoat_dong order by tao_luc limit 1`))[0];
  const cnId = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  const hienCo = new Map((await q(`select sh_id, id, dien_thoai from public.khach_hang where sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
  const maDaCo = new Set((await q(`select ma from public.khach_hang`)).map((r) => r.ma));
  const sdtDaCo = new Set((await q(`select dien_thoai from public.khach_hang`)).map((r) => r.dien_thoai));

  const dong = (c) => {
    const rt = chiTiet.get(Number(c.id)); const ct = rt?.chi_tiet ?? {};
    if (!rt && !c._tu_the) { bao.mat_chi_tiet++; if (dieuTra.mat_chi_tiet.length < 20) dieuTra.mat_chi_tiet.push(c.id); }
    const ngaySinh = ngaySinhSh(ct); // thiếu/sai năm → không rõ năm (1904-mm-dd), 0327
    const diaChi = [sach(ct.address), sach(ct.district_name), sach(ct.city_name)].filter(Boolean).join(", ") || null;
    return {
      sh_id: Number(c.id), ho_ten: sach(ct.full_name || c.full_name) || `Khách ${c.id}`, zalo: sdt(c.zalo) || null, email: sach(ct.email || c.email) || null,
      gioi_tinh: c.gender === "F" ? "nữ" : c.gender === "M" ? "nam" : null, ngay_sinh: ngaySinh, dia_chi: diaChi,
      nghe_nghiep: sach(ct.job) || null, cong_ty: sach(ct.organization) || null, facebook: sach(ct.facebook_id) || null, website: sach(ct.website) || null,
      chieu_cao_cm: Number(ct.height) > 0 ? Number(ct.height) : null, can_nang_kg: Number(ct.weight) > 0 ? Number(ct.weight) : null, ma_so_thue: sach(ct.tax_code) || null,
      tinh_thanh: sach(ct.city_name) || null, quan_huyen: sach(ct.district_name) || null, quoc_gia: sach(ct.country_code) || null, sdt_phu: sdt(ct.new_mobile) || null,
      ma_the_giay: sach(ct.card_code || c.card_code) || null, co_so_goc: sach(c.location_names || ct.location_names) || null,
      hang_goc: HANG[c.rank] ?? null, diem_goc: so(c.loyalty_point), tong_chi_goc: so(ct.total_paid_amount), so_lan_den_goc: so(ct.number_visited), lan_den_cuoi: vnNgay(ct.last_visited),
    };
  };

  // ── 1. Cập nhật khách đã có ──
  const capNhat = [], moi = [];
  for (const c of tatCa) {
    const d = dong(c);
    const co = hienCo.get(d.sh_id);
    if (co) {
      const p = sdt(c.mobile) || sdt(chiTiet.get(d.sh_id)?.chi_tiet?.mobile);
      if (p && p !== co.dien_thoai && !String(co.dien_thoai).includes("TRUNG") && !String(co.dien_thoai).startsWith("KHONG-SDT")) { bao.sdt_doi_bo_qua++; if (dieuTra.sdt_doi.length < 30) dieuTra.sdt_doi.push([d.sh_id, co.dien_thoai, p]); }
      capNhat.push(d);
    } else moi.push({ c, d });
  }
  let nCapNhat = 0;
  await theoLo(capNhat, 1000, async (lo) => {
    const r = await q(`update public.khach_hang k set ho_ten = x.ho_ten, zalo = coalesce(x.zalo, k.zalo), email = coalesce(x.email, k.email), gioi_tinh = coalesce(x.gioi_tinh, k.gioi_tinh), ngay_sinh = coalesce(x.ngay_sinh, k.ngay_sinh),
         dia_chi = coalesce(x.dia_chi, k.dia_chi), nghe_nghiep = x.nghe_nghiep, cong_ty = x.cong_ty, facebook = x.facebook, website = x.website, chieu_cao_cm = x.chieu_cao_cm, can_nang_kg = x.can_nang_kg, ma_so_thue = x.ma_so_thue,
         tinh_thanh = x.tinh_thanh, quan_huyen = x.quan_huyen, quoc_gia = x.quoc_gia, sdt_phu = x.sdt_phu, ma_the_giay = x.ma_the_giay, co_so_goc = x.co_so_goc,
         hang_goc = coalesce(x.hang_goc, k.hang_goc), diem_goc = x.diem_goc, tong_chi_goc = x.tong_chi_goc, so_lan_den_goc = x.so_lan_den_goc, lan_den_cuoi = coalesce(x.lan_den_cuoi, k.lan_den_cuoi), cap_nhat_luc = now()
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ho_ten text, zalo text, email text, gioi_tinh text, ngay_sinh date, dia_chi text, nghe_nghiep text, cong_ty text, facebook text, website text, chieu_cao_cm numeric, can_nang_kg numeric,
            ma_so_thue text, tinh_thanh text, quan_huyen text, quoc_gia text, sdt_phu text, ma_the_giay text, co_so_goc text, hang_goc text, diem_goc int, tong_chi_goc bigint, so_lan_den_goc int, lan_den_cuoi date)
       where k.sh_id = x.sh_id returning 1`, [JSON.stringify(lo)]);
    nCapNhat += r.length;
  });

  // ── 2. Thêm khách mới ──
  const khMoi = moi.map(({ c, d }) => {
    const ct = chiTiet.get(d.sh_id)?.chi_tiet ?? {};
    let p = sdt(c.mobile) || sdt(ct.mobile); let ghiMa = "";
    if (!p) { p = `KHONG-SDT-${c.id}`; bao.sdt_trong++; } else if (sdtDaCo.has(p)) { p = `${p}-TRUNG${c.id}`; bao.sdt_trung++; ghiMa = "SĐT trùng với một khách khác ở SalonHero, cần gộp hoặc sửa tay."; }
    sdtDaCo.add(p);
    const loc = ct.init_location_id ?? null;
    const cn = loc ? cnTheoLoc(loc) : /Đà Lạt/.test(c.location_names ?? "") && !/Vinh/.test(c.location_names ?? "") ? "DALAT" : "VINH";
    return { ...d, ma: dedupe(sach(c.code) || `SH${c.id}`, maDaCo, c.id), dien_thoai: p, cn, nguon: nguonKhach(ct), nguon_chi_tiet: sach(ct.refer_source) || null, tao_luc: ct.createdAt ?? null,
      ghi_chu: [c._tu_the ? "Khách đã bị xoá khỏi danh sách SalonHero nhưng còn thẻ — hồ sơ dựng lại từ dữ liệu thẻ, cần rà lại." : "", ghiMa].filter(Boolean).join(" ") || null };
  });
  let nMoi = 0;
  await theoLo(khMoi, 1000, async (lo) => {
    const r = await q(`insert into public.khach_hang (sh_id, ma, ho_ten, dien_thoai, zalo, email, gioi_tinh, ngay_sinh, dia_chi, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id, ghi_chu, tao_luc,
         hang_goc, diem_goc, tong_chi_goc, so_lan_den_goc, lan_den_cuoi, nghe_nghiep, cong_ty, facebook, website, chieu_cao_cm, can_nang_kg, ma_so_thue, tinh_thanh, quan_huyen, quoc_gia, sdt_phu, ma_the_giay, co_so_goc, nhap_dot)
       select x.sh_id, x.ma, x.ho_ten, x.dien_thoai, x.zalo, x.email, x.gioi_tinh, x.ngay_sinh, x.dia_chi, (select id from public.chi_nhanh where ma = x.cn), x.nguon, x.nguon_chi_tiet, $2::uuid, x.ghi_chu, coalesce(x.tao_luc, now()),
         x.hang_goc, x.diem_goc, x.tong_chi_goc, x.so_lan_den_goc, x.lan_den_cuoi, x.nghe_nghiep, x.cong_ty, x.facebook, x.website, x.chieu_cao_cm, x.can_nang_kg, x.ma_so_thue, x.tinh_thanh, x.quan_huyen, x.quoc_gia, x.sdt_phu, x.ma_the_giay, x.co_so_goc, $3
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ho_ten text, dien_thoai text, zalo text, email text, gioi_tinh text, ngay_sinh date, dia_chi text, cn text, nguon text, nguon_chi_tiet text, ghi_chu text, tao_luc timestamptz,
            hang_goc text, diem_goc int, tong_chi_goc bigint, so_lan_den_goc int, lan_den_cuoi date, nghe_nghiep text, cong_ty text, facebook text, website text, chieu_cao_cm numeric, can_nang_kg numeric, ma_so_thue text, tinh_thanh text, quan_huyen text,
            quoc_gia text, sdt_phu text, ma_the_giay text, co_so_goc text)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), chu.id, dot]);
    nMoi += r.length;
  });

  // ── 3. Ghi chú riêng của SalonHero ──
  const khachId = await mapMa(db, "khach_hang");
  const ghiChu = [];
  for (const [shId, rt] of chiTiet) {
    const notes = rt.ghi_chu?.notes ?? [];
    for (const n of notes) {
      if (n.is_deleted || !khachId.has(shId)) continue;
      const nd = [n.content, n.content_1, n.content_2, n.content_3, n.content_4, n.content_5, n.content_6].filter((x) => x && x !== "None").map(sach).filter(Boolean);
      if (!nd.length) continue;
      ghiChu.push({ sh_id: Number(n.id), khach_id: khachId.get(shId), noi_dung: nd.join("\n") + (n.creator_name ? `\n— ${sach(n.creator_name)} (SalonHero)` : ""), tao_luc: n.createdAt ?? null });
    }
  }
  let nGhiChu = 0;
  await theoLo(ghiChu, 1000, async (lo) => {
    const r = await q(`insert into public.khach_ghi_chu (sh_id, khach_id, tinh_trang, tao_luc, loai, nhap_dot)
       select x.sh_id, x.khach_id, x.noi_dung, coalesce(x.tao_luc, now()), 'cskh', $2 from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, noi_dung text, tao_luc timestamptz)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), dot]);
    nGhiChu += r.length;
  });

  // ── 4. Thẻ: cập nhật số dư cho thẻ đã có (dòng điều chỉnh), thêm thẻ mới ──
  const khachMoiMap = await mapMa(db, "khach_hang");
  const goi = await mapMa(db, "goi_the");
  const theCo = new Map((await q(`select t.sh_id, t.id, t.loai, t.trang_thai, coalesce(s.b,0)::int buoi, coalesce(s.t,0)::bigint tien from public.the_khach t left join lateral (select sum(so_buoi) b, sum(so_tien) t from public.the_so_cai where the_id = t.id) s on true where t.sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
  const maThe = new Set((await q(`select ma from public.the_khach`)).map((r) => r.ma));
  const dieuChinh = [], theMoi = [], bo = { khong_co_khach: 0, khong_co_goi: 0, so_du_bo: 0, trang_thai_doi: 0 };
  const dichTrangThai = [];
  for (const c of dsThe) {
    if (c.is_deleted) continue;
    const lan = c.card_type === "USING";
    const limit = Math.max(1, Math.round(Number(c.use_limit) || 1));
    const da = Math.min(limit, Math.max(0, Math.round(Number(c.use_count) || 0)));
    const dichBuoi = lan ? limit - da : 0, dichTien = lan ? 0 : Math.max(0, so(c.account_balance));
    const tt = c.is_revoked ? "thu_hoi" : c.is_locked ? "khoa" : "hoat_dong";
    const co = theCo.get(Number(c.id));
    if (co) {
      if (dichBuoi !== co.buoi || dichTien !== Number(co.tien)) dieuChinh.push({ the_id: co.id, so_buoi: dichBuoi - co.buoi, so_tien: dichTien - Number(co.tien) });
      if (co.trang_thai !== tt && co.trang_thai !== "thu_hoi") { dichTrangThai.push({ id: co.id, trang_thai: tt }); bo.trang_thai_doi++; }
      continue;
    }
    if (!khachMoiMap.has(Number(c.customer_id))) { bo.khong_co_khach++; bo.so_du_bo += so(c.account_balance); continue; }
    if (!goi.has(Number(c.card_id))) { bo.khong_co_goi++; continue; }
    theMoi.push({ sh_id: Number(c.id), ma: dedupe(sach(c.code) || `TSH${c.id}`, maThe, c.id), khach_sh: Number(c.customer_id), goi_sh: Number(c.card_id), cn: cnTheoLoc(c.init_location_id), loai: lan ? "lan" : "tien",
      so_buoi_tong: lan ? limit : null, tong_tien: lan ? so(c.card_sale_price) : so(c.card_default_account_balance) || so(c.account_balance),
      gia_tri_buoi: lan ? (limit < 999999 ? Math.round((Number(c.card_sale_price) || 0) / limit) : so(c.card_use_price)) : 0, ngay_cap: vnNgay(c.created_at ?? c.createdAt), han_dung: vnNgay(c.expiry_date), trang_thai: tt,
      ghi_chu: `Chuyển từ SalonHero (mã thẻ ${sach(c.code)})${c.note ? ` — ${sach(c.note)}` : ""}${lan && limit >= 999999 ? " — thẻ không giới hạn số buổi" : ""}`, so_buoi_cap: lan ? limit : 0, so_buoi_da_dung: lan ? da : 0, so_du_tien: dichTien });
  }
  if (dieuChinh.length) await theoLo(dieuChinh, 1000, (lo) => q(`insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu, nhap_dot)
      select x.the_id, 'dieu_chinh', x.so_buoi, x.so_tien, $2::uuid, 'Đồng bộ số dư với SalonHero (đợt ' || $3 || ')', $3 from jsonb_to_recordset($1::jsonb) as x(the_id uuid, so_buoi int, so_tien bigint)`, [JSON.stringify(lo), he, dot]));
  if (dichTrangThai.length) await theoLo(dichTrangThai, 1000, (lo) => q(`update public.the_khach t set trang_thai = x.trang_thai from jsonb_to_recordset($1::jsonb) as x(id uuid, trang_thai text) where t.id = x.id`, [JSON.stringify(lo)]));
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

  // ── 5. ĐỐI CHIẾU (trong cùng giao dịch) ──
  const kq = [];
  const them = (muc, sh, am, ghi = "") => kq.push({ muc, salonhero: sh, amia: am, lech: Number(am) - Number(sh), khop: Number(sh) === Number(am) ? "KHỚP" : "LỆCH", ghi });
  them("Số khách (danh sách + dựng từ thẻ)", tatCa.length, (await q(`select count(*)::int n from public.khach_hang where sh_id is not null`))[0].n, `${dung.size} khách dựng từ thẻ`);
  them("Số thẻ chưa xoá", dsThe.filter((c) => !c.is_deleted).length - bo.khong_co_khach - bo.khong_co_goi, (await q(`select count(*)::int n from public.the_khach where sh_id is not null`))[0].n, `bỏ: ${bo.khong_co_khach} thẻ không có khách, ${bo.khong_co_goi} thẻ không có gói`);
  // số dư từng thẻ
  const sd = await q(`select t.sh_id, t.loai, coalesce(sum(c.so_buoi),0)::int b, coalesce(sum(c.so_tien),0)::bigint tien from public.the_khach t left join public.the_so_cai c on c.the_id = t.id where t.sh_id is not null group by t.sh_id, t.loai`);
  const amSd = new Map(sd.map((r) => [Number(r.sh_id), r]));
  let lechThe = 0; const mauLech = [];
  for (const c of dsThe) { if (c.is_deleted) continue; const a = amSd.get(Number(c.id)); if (!a) continue;
    const lan = c.card_type === "USING"; const limit = Math.max(1, Math.round(Number(c.use_limit) || 1)); const da = Math.min(limit, Math.max(0, Math.round(Number(c.use_count) || 0)));
    const dich = lan ? limit - da : Math.max(0, so(c.account_balance)); const co = lan ? a.b : Number(a.tien);
    if (dich !== co) { lechThe++; if (mauLech.length < 10) mauLech.push([c.id, dich, co]); } }
  them("Thẻ có số dư khác SalonHero (buổi / tiền)", 0, lechThe, JSON.stringify(mauLech));
  const idShThe = new Set(dsThe.filter((c) => !c.is_deleted).map((c) => Number(c.id)));
  const conAmiaMatSh = [...theCo.keys()].filter((id) => !idShThe.has(id));
  them("Thẻ có ở AMIA nhưng SalonHero hiện không còn trả về (cần rà tay, KHÔNG tự xoá)", 0, conAmiaMatSh.length, JSON.stringify(conAmiaMatSh.slice(0, 12)));
  them("Tổng điểm thưởng (cột diem_goc)", dsKhach.reduce((s, c) => s + so(c.loyalty_point), 0), (await q(`select coalesce(sum(diem_goc),0)::bigint n from public.khach_hang where sh_id is not null`))[0].n);
  them("Khách có nghề nghiệp", [...chiTiet.values()].filter((r) => sach(r.chi_tiet?.job)).length, (await q(`select count(*)::int n from public.khach_hang where nghe_nghiep is not null`))[0].n);
  them("Khách có SĐT phụ", [...chiTiet.values()].filter((r) => sdt(r.chi_tiet?.new_mobile)).length, (await q(`select count(*)::int n from public.khach_hang where sdt_phu is not null`))[0].n);
  them("Ghi chú riêng SalonHero đã nhập", ghiChu.length, (await q(`select count(*)::int n from public.khach_ghi_chu where sh_id is not null`))[0].n);
  inBang(kq);
  const tom = { dot, that, cap_nhat: nCapNhat, them_moi: nMoi, ghi_chu_rieng_moi: nGhiChu, the_dieu_chinh: dieuChinh.length, the_moi: nTheMoi, the_doi_trang_thai: bo.trang_thai_doi, ...bao, bo, dieu_tra: dieuTra };
  console.log(JSON.stringify(tom));
  writeFileSync(`${thuMuc}/_buoc1-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, doi_chieu: kq }, null, 1));
  const lech = kq.filter((x) => x.khop === "LỆCH" && !/Khách có|Ghi chú|Thẻ có số dư/.test(x.muc)).length + (lechThe ? 1 : 0);
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  else if (lechThe) { await db.query("rollback"); console.log("CÓ THẺ LỆCH SỐ DƯ → HUỶ, KHÔNG GHI."); process.exitCode = 1; }
  else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

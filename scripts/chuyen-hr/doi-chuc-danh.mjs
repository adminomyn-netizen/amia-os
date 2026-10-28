// Đặt lại chức danh/phòng ban/chi nhánh theo GỐC Lark cho người đã ghép với Lark. Mặc định chạy thử rồi huỷ; --that mới ghi.
// Giá trị cũ lưu ở sao-luu/hr-lark/doi-chuc-danh-<giờ>.json để gỡ lại (cùng sao lưu DB truoc-chuc-danh-lark).
import { writeFileSync } from "node:fs";
import { ketNoi, docBang, chu, danhSach, ngay, khongDau, phongBanChung, CN_THEO_DON_VI } from "./lib-hr.mjs";
import { xayNguoi } from "./nguoi.mjs";
const that = process.argv.includes("--that");
const hienThi = (t) => { const k = khongDau(t); return /^(nhan vien tri lieu|tri lieu vien|ktv|ky thuat vien)$/.test(k) ? "Chuyên viên Trị liệu" : String(t).trim(); };
const hienThiList = (l) => l.map(hienThi).filter(Boolean).join(", ") || null;
const P = xayNguoi(); const db = await ketNoi(); const DOT = "HR-2810-04"; const st = {}; const dem = (k, n = 1) => (st[k] = (st[k] ?? 0) + n);
try {
  await db.query("begin");
  await db.query(`insert into public.nhap_dot (ma, mo_ta) values ($1,$2) on conflict do nothing`, [DOT, "Đặt lại chức danh/phòng ban/chi nhánh theo gốc Lark (28/10/2026)"]);
  const nv = (await db.query(`select n.id, n.ho_ten, n.ma_nv, n.ma_lark, n.lark_open_id, n.chuc_danh, n.don_vi, n.phong_ban_goc, n.phong_ban_id, n.chi_nhanh_id, c.ma cn from public.nhan_vien n left join public.chi_nhanh c on c.id = n.chi_nhanh_id`)).rows;
  const byO = new Map(nv.filter((r) => r.lark_open_id).map((r) => [r.lark_open_id, r])), byM = new Map(nv.filter((r) => r.ma_lark).map((r) => [r.ma_lark, r]));
  const pb = new Map((await db.query(`select id, ten from public.phong_ban`)).rows.map((r) => [r.ten, r.id])); const cn = new Map((await db.query(`select id, ma from public.chi_nhanh`)).rows.map((r) => [r.ma, r.id]));
  const r16 = docBang("1.6").map((r) => ({ r, rec: (r["✏️Mã nhân viên"] || [])[0]?.id, hl: ngay(r["✏️Ngày áp dụng"]) ?? ngay(r["✏️Ngày cập nhật"]) })).filter((x) => x.rec);
  const l16 = new Map(); for (const x of r16) (l16.get(x.rec) ?? l16.set(x.rec, []).get(x.rec)).push(x);
  for (const l of l16.values()) l.sort((a, b) => String(a.hl).localeCompare(String(b.hl)));
  const luu = []; const daLienKet = new Set(); const tenDm = new Set();
  for (const p of P.people) {
    const row = (p.open && byO.get(p.open)) || (p.ma && byM.get(p.ma)); if (!row) { dem("nguoi_lark_khong_co_trong_app"); continue; } daLienKet.add(row.id);
    const m = l16.get(p.rec)?.at(-1)?.r;
    const ds = danhSach(p.r?.["Chức vụ"]); const cds = ds.length ? ds : m ? danhSach(m["Chức danh(*)"]) : p.r21?.job_title ? [chu(p.r21.job_title)] : [];
    const cd = hienThiList(cds); cds.map(hienThi).forEach((t) => tenDm.add(t));
    const donVi = chu(p.r?.["Nơi làm việc"]) ?? chu(m?.["✏️Làm việc"]); const pbGoc = chu(p.r?.["Phòng ban"]) ?? chu(m?.["Phòng ban"]);
    const pbId = pb.get(phongBanChung(pbGoc)) ?? null; const cnLark = donVi ? CN_THEO_DON_VI[donVi] : null;
    const moi = { chuc_danh: cd ?? row.chuc_danh, phong_ban_goc: pbGoc ?? row.phong_ban_goc, phong_ban_id: pbId ?? row.phong_ban_id, chi_nhanh_id: cnLark ? cn.get(cnLark) : row.chi_nhanh_id, don_vi: donVi ?? row.don_vi };
    if (Object.keys(moi).every((k) => moi[k] === row[k])) { dem("khong_doi"); continue; }
    luu.push({ id: row.id, ten: row.ho_ten, ma_nv: row.ma_nv, ma_lark: row.ma_lark, cu: { chuc_danh: row.chuc_danh, phong_ban_goc: row.phong_ban_goc, phong_ban_id: row.phong_ban_id, chi_nhanh_id: row.chi_nhanh_id, don_vi: row.don_vi }, moi });
    await db.query(`update public.nhan_vien set chuc_danh=$2, phong_ban_goc=$3, phong_ban_id=$4, chi_nhanh_id=$5, don_vi=$6 where id=$1`, [row.id, moi.chuc_danh, moi.phong_ban_goc, moi.phong_ban_id, moi.chi_nhanh_id, moi.don_vi]);
    dem("nhan_vien_sua"); if (row.chuc_danh !== moi.chuc_danh) dem("doi_chuc_danh"); if (row.chi_nhanh_id !== moi.chi_nhanh_id) dem("doi_chi_nhanh"); if (row.phong_ban_id !== moi.phong_ban_id) dem("doi_phong_ban");
  }
  // dieu_kien_luong: mỗi dòng theo đúng dòng 1.6 cùng (người, ngày hiệu lực)
  const dk = (await db.query(`select d.id, d.nhan_vien_id, d.hieu_luc_tu::text hl, d.chuc_danh, n.lark_open_id o, n.ma_lark m from public.dieu_kien_luong d join public.nhan_vien n on n.id = d.nhan_vien_id where d.nhap_dot = 'HR-2810-01'`)).rows;
  const luuDk = [];
  for (const d of dk) {
    const p = (d.o && P.byOpen.get(d.o)) || (d.m && P.byMa.get(d.m)); const x = p && l16.get(p.rec)?.filter((y) => y.hl === d.hl).at(-1); if (!x) { dem("dieu_kien_khong_doi_chieu_duoc"); continue; }
    const cd = hienThiList(danhSach(x.r["Chức danh(*)"])); if (cd === d.chuc_danh) continue;
    luuDk.push({ id: d.id, cu: d.chuc_danh }); await db.query(`update public.dieu_kien_luong set chuc_danh = $2 where id = $1`, [d.id, cd]); dem("dieu_kien_luong_sua");
  }
  const luuKs = [];
  for (const r of docBang("1.9")) { const p = P.byRec.get((r["Mã NV"] || [])[0]?.id); const row = p && ((p.open && byO.get(p.open)) || byM.get(p.ma)); if (!row) continue; const cv = hienThi(chu(r["Chức vụ"]) ?? "") || null;
    const q = await db.query(`select id, chuc_vu from public.hr_khao_sat_nghi_viec where nhan_vien_id = $1 and chuc_vu is distinct from $2`, [row.id, cv]); for (const k of q.rows) { luuKs.push({ id: k.id, cu: k.chuc_vu }); await db.query(`update public.hr_khao_sat_nghi_viec set chuc_vu = $2 where id = $1`, [k.id, cv]); dem("khao_sat_sua"); } }
  // danh mục chức danh: thêm tên thiếu (không xoá)
  const dm = new Set((await db.query(`select ten from public.chuc_danh_dm`)).rows.map((r) => khongDau(r.ten))); let tt = Number((await db.query(`select coalesce(max(thu_tu),0) m from public.chuc_danh_dm`)).rows[0].m);
  for (const t of tenDm) if (t && !dm.has(khongDau(t))) { await db.query(`insert into public.chuc_danh_dm (ten, thu_tu, nhap_dot) values ($1,$2,$3)`, [t, ++tt, DOT]); dem("chuc_danh_dm_them"); dm.add(khongDau(t)); }
  const khongGhep = nv.filter((r) => !daLienKet.has(r.id)).map((r) => ({ ten: r.ho_ten, ma_nv: r.ma_nv, chuc_danh_hien_tai: r.chuc_danh }));
  const tep = `sao-luu/hr-lark/doi-chuc-danh-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.json`;
  if (that) writeFileSync(tep, JSON.stringify({ nhan_vien: luu, dieu_kien_luong: luuDk, khao_sat: luuKs, khong_ghep: khongGhep }, null, 1), { mode: 0o600 });
  console.log("Thống kê:", JSON.stringify(st)); console.log("Tệp giá trị cũ:", that ? tep : "(chạy thử, chưa ghi tệp)");
  console.log("Đổi chức danh (tên · cũ → Lark):"); for (const x of luu.filter((y) => y.cu.chuc_danh !== y.moi.chuc_danh)) console.log(` - ${x.ten} (${x.ma_nv}) · ${x.cu.chuc_danh ?? "(trống)"} → ${x.moi.chuc_danh}`);
  console.log("Không ghép được với Lark:", khongGhep.length); for (const x of khongGhep) console.log(` - ${x.ten} (${x.ma_nv}) · ${x.chuc_danh_hien_tai ?? "(trống)"}`);
  if (that) { await db.query("commit"); console.log("ĐÃ GHI"); } else { await db.query("rollback"); console.log("Chạy thử OK (huỷ)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI:", e.message); process.exitCode = 1; }
await db.end();

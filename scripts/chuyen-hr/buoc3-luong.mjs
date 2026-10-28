// BƯỚC 3 — LƯƠNG & THƯỞNG PHẠT & TÀI SẢN: bảng lương các tháng (4.4 bản chốt + 4.1 phần còn lại), lương CTV (4.2), thuế lần 1 (4.5), thưởng phạt (5.4),
// ghi nhận hoa hồng/thưởng từ Kinh doanh (5.3), BSC (5.1), tài sản cấp (6.1). Mã đợt: HR-2810-03. Cần HR-2810-01 đã ghi.
// Dùng: PW=... node scripts/chuyen-hr/buoc3-luong.mjs [--thu-go] [--that]
// Không in số tiền từng người: chỉ in tổng đối chiếu theo bảng.
import { ketNoi, khongDau, docBang, chu, so, tien, ngay, nguoiLark } from "./lib-hr.mjs";
import { xayNguoi } from "./nguoi.mjs";

const DOT = "HR-2810-03";
const that = process.argv.includes("--that"), thuGo = process.argv.includes("--thu-go");
const dem0 = {}; const dem = (k, n = 1) => (dem0[k] = (dem0[k] ?? 0) + n);
const tong = {}; const cong = (k, v) => (tong[k] = (tong[k] ?? 0) + (v ?? 0));
const db = await ketNoi();
const P = xayNguoi();
const DEM = `select (select count(*) from public.hr_luong_lark) lu, (select count(*) from public.hr_luong_ctv) ctv, (select count(*) from public.hr_thue_lan1) th, (select count(*) from public.hr_thuong_phat) tp, (select count(*) from public.hr_ghi_nhan_kd) kd, (select count(*) from public.hr_bsc) bsc, (select count(*) from public.hr_tai_san) ts`;
const thang = (v) => { const m = String(chu(v) ?? "").match(/(\d{1,2})/); return m ? Number(m[1]) : null; };
try {
  await db.query("begin");
  const truoc = (await db.query(DEM)).rows[0];
  await db.query(`insert into public.nhap_dot (ma, mo_ta) values ($1,$2) on conflict (ma) do nothing`, [DOT, "Lương các tháng, lương CTV, thuế lần 1, thưởng phạt, hoa hồng KD, BSC, tài sản — từ Lark HRM-HRIS-01 (28/10/2026)"]);
  const rows = (await db.query(`select id, lark_open_id o, ma_lark m from public.nhan_vien where lark_open_id is not null or ma_lark is not null`)).rows;
  const byO = new Map(rows.filter((r) => r.o).map((r) => [r.o, r.id])), byM = new Map(rows.filter((r) => r.m).map((r) => [r.m, r.id]));
  const tuNguoi = (p) => (p ? byO.get(p.open) ?? byM.get(p.ma) ?? null : null);
  const theoTen = new Map(); for (const p of P.people) (theoTen.get(p.tenKd) ?? theoTen.set(p.tenKd, []).get(p.tenKd)).push(p);
  const idTen = (v) => { const l = theoTen.get(khongDau(chu(v))); return l && l.length === 1 ? tuNguoi(l[0]) : null; };
  const idOpen = (v) => byO.get(nguoiLark(v)) ?? null;
  const idMa = (v) => { const m = chu(v); return m ? tuNguoi(P.byMa.get(m)) ?? byM.get(m) ?? null : null; };

  // ───── Bảng lương: 4.4 (bản chốt) ưu tiên, 4.1 bù phần còn lại ─────
  const luong = new Map();
  const dat = (nv, nam, th, o) => { luong.set(nv + "|" + nam + "|" + th, { nv, nam, th, ...o }); };
  for (const r of docBang("4.4")) {
    const nv = idOpen(r["🤖Họ và tên"]); const d = ngay(r["🤖Ngày tạo"]); if (!nv || !d) { dem("luong_4.4_khong_noi_duoc_nguoi"); continue; }
    const k = nv + "|" + d.slice(0, 4) + "|" + Number(d.slice(5, 7)); if (luong.has(k)) dem("luong_4.4_trung_nguoi_thang_giu_dong_sau");
    dat(nv, Number(d.slice(0, 4)), Number(d.slice(5, 7)), { nguon: "4.4", tinh_trang: null, phong_ban: chu(r["🤖Phòng ban"]), thu_nhap_chuc_danh: tien(r["🤖Thu nhập chức danh"]), tong_cong: so(r["🤖Tổng công"]), luong_ot: tien(r["🤖Tổng lương OT"]), thuong_hieu_suat: tien(r["🤖Thưởng hiệu suất"]), an_ca: tien(r["🤖Ăn ca tháng"]), dong_phuc: tien(r["🤖Trợ cấp đồng phục theo công"]), nha_o: tien(r["🤖Hỗ trợ nhà ở theo ngày công"]), cong_khac: tien(r["🤖Cộng khác"]), thuong_hoa_hong_dv: tien(r["🤖Tổng thưởng hoa hồng + dịch vụ"]), bhxh_nld: tien(r["🤖Phí BHXH NLĐ đóng"]), tong_giam_tru: tien(r["🤖Tổng giảm trừ"]), thu_nhap_chiu_thue: tien(r["🤖Thu nhập chịu thuế"]), thu_nhap_tinh_thue: tien(r["🤖Thu nhập tính thuế"]), thue_tncn: tien(r["🤖Thuế TNCN"]), thuc_tra: tien(r["🤖Tổng thực trả"]) });
  }
  const so44 = luong.size;
  for (const r of docBang("4.1")) {
    const nam = Number(chu(r["Năm"])), th = thang(r["Tháng"]); if (!nam || !th) { dem("luong_4.1_dong_mau_khong_co_nam_bo"); continue; }
    const nv = idOpen(r["Họ và tên"]) ?? idMa(r["Mã nhân viên"]); if (!nv) { dem("luong_4.1_khong_noi_duoc_nguoi"); continue; }
    const k = nv + "|" + nam + "|" + th; if (luong.has(k)) { dem("luong_4.1_trung_voi_ban_chot_4.4_bo"); continue; }
    dat(nv, nam, th, { nguon: "4.1", tinh_trang: chu(r["Tình trạng"]), khung_lam_viec: chu(r["Khung làm việc"]), don_vi: chu(r["Làm việc"]), phong_ban: chu(r["Phòng ban"]), luong_co_ban: tien(r["Lương cơ bản"]), cong_chuan: so(r["Công chuẩn"]), tong_cong: so(r["Tổng công"]), thu_nhap_chuc_danh: tien(r["Thu nhập chức danh"]), luong_ot: tien(r["Tổng lương OT"]), thuong_hieu_suat: tien(r["Thưởng hiệu suất"]), an_ca: tien(r["Ăn ca tháng"]), dong_phuc: tien(r["Trợ cấp đồng phục theo công"]), nha_o: tien(r["Hỗ trợ nhà ở theo ngày công"]), cong_khac: tien(r["Cộng khác"]), thuong_hoa_hong_dv: tien(r["Tổng thưởng hoa hồng + dịch vụ"]), gross: tien(r["Tổng thu nhập Gross"]), bhxh_nld: tien(r["Phí BHXH NLĐ đóng"]), bhxh_cty: tien(r["Phí BHXH Công ty đóng"]), tong_giam_tru: tien(r["Tổng giảm trừ"]), thu_nhap_chiu_thue: tien(r["Thu nhập chịu thuế"]), thu_nhap_tinh_thue: tien(r["Thu nhập tính thuế"]), thue_tncn: tien(r["Thuế TNCN"]), tru_khac_tam_ung: tien(r["Trừ khác/tạm ứng"]), quy_nhan_vien: tien(r["Quỹ nhân viên"]), tong_khau_tru: tien(r["Tổng khấu trừ"]), thuc_tra: tien(r["Tổng thực trả"]), thanh_toan_l1: tien(r["Thanh toán lương L1"]) });
  }
  const C = ["tinh_trang", "khung_lam_viec", "don_vi", "phong_ban", "luong_co_ban", "cong_chuan", "tong_cong", "thu_nhap_chuc_danh", "luong_ot", "thuong_hieu_suat", "an_ca", "dong_phuc", "nha_o", "cong_khac", "thuong_hoa_hong_dv", "gross", "bhxh_nld", "bhxh_cty", "tong_giam_tru", "thu_nhap_chiu_thue", "thu_nhap_tinh_thue", "thue_tncn", "tru_khac_tam_ung", "quy_nhan_vien", "tong_khau_tru", "thuc_tra", "thanh_toan_l1"];
  for (const x of luong.values()) {
    await db.query(`insert into public.hr_luong_lark (nhan_vien_id, nam, thang, nguon, ${C.join(", ")}, nhap_dot) values ($1,$2,$3,$4,${C.map((_, i) => "$" + (i + 5)).join(",")},$${C.length + 5})`, [x.nv, x.nam, x.th, x.nguon, ...C.map((c) => x[c] ?? null), DOT]);
    dem("hr_luong_lark"); cong("luong_thuc_tra_" + x.nguon, x.thuc_tra);
  }
  dem("hr_luong_lark_tu_4.4", so44);

  // ───── Lương CTV (4.2), thuế lần 1 (4.5) ─────
  for (const r of docBang("4.2")) {
    const d = ngay(r["✏️Ngày tạo"]); const nv = idMa(r["✏️Mã nhân viên"]);
    await db.query(`insert into public.hr_luong_ctv (nhan_vien_id, ho_ten, ma_nv, email, nam, thang, ngay, don_gia, ngay_cong, thuong_khac, tong_thu_nhap, thue_tncn, thuc_nhan, ngan_hang, so_tai_khoan, chu_tai_khoan, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [nv, chu(r["✏️Họ và tên text"]), chu(r["✏️Mã nhân viên"]), chu(r["✏️Email"]), so(r["Năm"]), thang(r["Tháng"]), d, tien(r["✏️Đơn giá"]), so(r["✏️Ngày công thực tế"]), tien(r["✏️Thưởng khác"]), tien(r["Tổng thu nhập"]), tien(r["Thuế TNCN"]), tien(r["Thực nhận"]), chu(r["✏️Ngân hàng"]), chu(r["✏️STK ngân hàng"]), chu(r["✏️Tên chủ tài khoản"]), DOT]);
    dem("hr_luong_ctv"); cong("ctv_thuc_nhan", tien(r["Thực nhận"]));
  }
  for (const r of docBang("4.5")) {
    const nv = idMa(r["🤖Mã Nhân viên"]) ?? idTen(r["Tên nhân viên"]); if (!nv) { dem("thue_lan1_khong_noi_duoc_nguoi"); continue; }
    await db.query(`insert into public.hr_thue_lan1 (nhan_vien_id, ngay, so_tien, nhap_dot) values ($1,$2,$3,$4)`, [nv, ngay(r["🤖Ngày tạo"]), tien(r["🤖Số tiền thuế lần 1 đã khấu trừ"]), DOT]); dem("hr_thue_lan1"); cong("thue_lan1", tien(r["🤖Số tiền thuế lần 1 đã khấu trừ"]));
  }

  // ───── Thưởng phạt (5.4), hoa hồng/thưởng KD (5.3), BSC (5.1), tài sản (6.1) ─────
  for (const r of docBang("5.4")) {
    await db.query(`insert into public.hr_thuong_phat (nhan_vien_id, ngay_lap, nam, thang, noi_dung, khoan_thu, khoan_chi, trang_thai, ghi_chu, ma_goc, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [idOpen(r["Người nhận"]), ngay(r["Ngày Lập"]), so(r["Năm"]), thang(r["Tháng"]), chu(r["Nội dung"]), tien(r["Khoản Thu"]), tien(r["Khoản chi"]), chu(r["Trạng thái"]), chu(r["Ghi chú"]), chu(r.SourceID), DOT]); dem("hr_thuong_phat"); cong("tp_thu", tien(r["Khoản Thu"])); cong("tp_chi", tien(r["Khoản chi"]));
  }
  for (const r of docBang("5.3")) {
    await db.query(`insert into public.hr_ghi_nhan_kd (nhan_vien_id, ngay, nam, thang, don_vi, phong_ban, doanh_so_dich_vu, doanh_so_my_pham, phi_tri_lieu, hh_dich_vu, hh_my_pham, hh_ban_lanh_dao, hh_gdcn, thuong_ds_truong_bp, thuong_vuot_dat_ca_nhan, thuong_vuot_chi_nhanh, tro_cap_truc_dem, thuong, tong_hh_ca_nhan, tong_hh_thuc_nhan, tong_cong, ghi_chu, ma_tham_chieu, nhap_dot)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      [idOpen(r["✏️Họ tên nhân viên"]), ngay(r["✏️Ngày ghi nhận"]), so(r["Năm"]), thang(r["Tháng"]), chu(r["Làm việc"]) ?? chu(r["Chi nhánh làm việc"]), chu(r["Phòng ban"]), tien(r["✏️Doanh số dịch vụ"]), tien(r["✏️Doanh số mỹ phẩm"]), tien(r["✏️Phí trị liệu"]), tien(r["✏️Hoa hồng bán dịch vụ"]), tien(r["✏️Hoa hồng bán mỹ phẩm"]), tien(r["✏️Hoa hồng Ban lãnh đạo"]), tien(r["✏️Hoa hồng GĐCN"]), tien(r["✏️Thưởng doanh số trưởng bộ phận"]), tien(r["✏️Thưởng vượt + đạt doanh số cá nhân"]), tien(r["✏️Thưởng vượt doanh số chi nhánh >110%"]), tien(r["✏️Trợ cấp tư vấn trực tuyến (trực đêm)"]), tien(r["✏️Thưởng"]), tien(r["✏️Tổng hoa hồng DS cá nhân (mỹ phẩm + dịch vụ)"]), tien(r["✏️Tổng hoa hồng thực nhận"]), tien(r["✏️Tổng cộng"]), chu(r["✏️Ghi chú"]), chu(r["✏️Mã tham chiếu"]), DOT]); dem("hr_ghi_nhan_kd"); cong("kd_tong_cong", tien(r["✏️Tổng cộng"]));
  }
  for (const r of docBang("5.1")) {
    const nv = idOpen(r["Tên nhân sự"]); if (!nv) { dem("bsc_khong_noi_duoc_nguoi"); continue; }
    await db.query(`insert into public.hr_bsc (nhan_vien_id, nam, thang, hieu_qua, nhap_dot) values ($1,$2,$3,$4,$5)`, [nv, so(r["Năm"]), thang(r["Tháng"]), so(r["Hiệu quả làm việc"]), DOT]); dem("hr_bsc");
  }
  for (const r of docBang("6.1")) {
    await db.query(`insert into public.hr_tai_san (ten_tai_san, loai, hang_model, so_luong, don_vi_tinh, tinh_trang, nhan_vien_id, ngay_cap, ngay_thu_hoi, ghi_chu, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [chu(r["✏️Tên tài sản"]) ?? "(không tên)", chu(r["✏️Loại tài sản"]), chu(r["✏️Hãng / Model"]), so(r["✏️Số lượng"]), chu(r["✏️Đơn vị tính"]), chu(r["✏️Tình trạng"]), idOpen(r["✏️Nhân sự sử dụng"]), ngay(r["✏️Ngày cấp"]), ngay(r["✏️Ngày thu hồi"]), chu(r["✏️Ghi chú"]), DOT]); dem("hr_tai_san");
  }

  // ───── Đối chiếu ─────
  const sau = (await db.query(DEM)).rows[0]; const h = {}; for (const k of Object.keys(truoc)) h[k] = Number(sau[k]) - Number(truoc[k]);
  const db_tong = (await db.query(`select (select coalesce(sum(thuc_tra),0) from public.hr_luong_lark where nhap_dot=$1 and nguon='4.4') l44, (select coalesce(sum(thuc_tra),0) from public.hr_luong_lark where nhap_dot=$1 and nguon='4.1') l41, (select coalesce(sum(thuc_nhan),0) from public.hr_luong_ctv where nhap_dot=$1) ctv, (select coalesce(sum(so_tien),0) from public.hr_thue_lan1 where nhap_dot=$1) thue, (select coalesce(sum(khoan_thu),0) from public.hr_thuong_phat where nhap_dot=$1) tpt, (select coalesce(sum(khoan_chi),0) from public.hr_thuong_phat where nhap_dot=$1) tpc, (select coalesce(sum(tong_cong),0) from public.hr_ghi_nhan_kd where nhap_dot=$1) kd`, [DOT])).rows[0];
  console.log("Thống kê:", JSON.stringify(dem0, null, 1)); console.log("Chênh số dòng:", JSON.stringify(h));
  const nb = (a, b) => Number(a) === Number(b ?? 0);
  const kt = [
    ["hr_luong_lark = số (người,tháng)", h.lu === dem0.hr_luong_lark && h.lu === luong.size],
    ["tổng thực trả bản chốt 4.4 khớp", nb(db_tong.l44, tong["luong_thuc_tra_4.4"])], ["tổng thực trả 4.1 khớp", nb(db_tong.l41, tong["luong_thuc_tra_4.1"])],
    ["lương CTV: số dòng = 4.2 và tổng thực nhận", h.ctv === docBang("4.2").length && nb(db_tong.ctv, tong.ctv_thuc_nhan)],
    ["thuế lần 1", nb(db_tong.thue, tong.thue_lan1) && h.th === (dem0.hr_thue_lan1 ?? 0)],
    ["thưởng phạt = 5.4 (167) và tổng thu/chi", h.tp === docBang("5.4").length && nb(db_tong.tpt, tong.tp_thu) && nb(db_tong.tpc, tong.tp_chi)],
    ["ghi nhận KD = 5.3 (138) và tổng", h.kd === docBang("5.3").length && nb(db_tong.kd, tong.kd_tong_cong)],
    ["BSC", h.bsc === (dem0.hr_bsc ?? 0)], ["tài sản = 6.1 (10)", h.ts === docBang("6.1").length],
  ];
  console.table(kt.map(([k, v]) => ({ kiem_tra: k, khop: v }))); const khop = kt.every(([, v]) => v);
  if (thuGo) {
    const g = await db.query(`select public.go_dot_hr($1) r`, [DOT]); console.log("go_dot_hr:", JSON.stringify(g.rows[0].r));
    const s2 = (await db.query(DEM)).rows[0]; const ve = Object.keys(truoc).every((k) => Number(s2[k]) === Number(truoc[k])); console.log("Sau gỡ về đúng như trước:", ve); await db.query("rollback"); process.exitCode = ve ? 0 : 1;
  } else if (!khop) { console.log("KHÔNG KHỚP → huỷ."); await db.query("rollback"); process.exitCode = 1; }
  else if (!that) { await db.query("rollback"); console.log("Chạy thử OK (đã huỷ). Thêm --that để ghi thật."); }
  else { await db.query("commit"); console.log("ĐÃ GHI (mã đợt " + DOT + ")."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

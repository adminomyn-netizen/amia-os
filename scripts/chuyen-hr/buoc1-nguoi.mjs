// BƯỚC 1 — NGƯỜI: hồ sơ, người thân, phòng ban/chức danh, hợp đồng, điều kiện lương (lộ trình), nghỉ việc + khảo sát nghỉ việc.
// Nguồn: Lark HRM-HRIS-01 (sao-luu/hr-lark). Mã đợt: HR-2810-01.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-hr/buoc1-nguoi.mjs [--thu N] [--that] [--thu-go]
//   Mặc định CHẠY THỬ: ghi trong một giao dịch rồi HUỶ. --thu N chỉ lấy N người đầu. --that mới commit. --thu-go: sau khi nhập, gọi go_dot_hr và kiểm DB về đúng như trước (rồi huỷ).
// Không in dữ liệu cá nhân (CCCD, lương, số TK…): chỉ đếm số lượng và tổng đối chiếu.
import { ketNoi, thoiDiem, docBang, chu, danhSach, so, tien, ngay, nguoiLark, sdt, khongDau, phongBanChung, vaiTroTheoChucDanh, KHUNG, VI_TRI, CN_THEO_DON_VI } from "./lib-hr.mjs";
import { xayNguoi, ghepVoiAmia, HOM_NAY } from "./nguoi.mjs";

const DOT = "HR-2810-01";
const that = process.argv.includes("--that"), thuGo = process.argv.includes("--thu-go");
const iThu = process.argv.indexOf("--thu"); const gioiHan = iThu > 0 ? Number(process.argv[iThu + 1]) : null;
const P = xayNguoi();
let people = P.people; if (gioiHan) people = people.filter((p) => p.nguon === "1.1").slice(0, gioiHan);
const trongPham = new Set(people);
const thongKe = {};
const dem = (k, n = 1) => (thongKe[k] = (thongKe[k] ?? 0) + n);

const db = await ketNoi();
const LON = (s) => (s == null ? null : String(s));
try {
  await db.query("begin");
  const truoc = (await db.query(`select (select count(*) from public.nhan_vien) nv, (select count(*) from public.nhan_vien_ho_so) hs, (select count(*) from public.nhan_vien_than_nhan) tn, (select count(*) from public.hd_lao_dong) hd, (select count(*) from public.dieu_kien_luong) dk, (select count(*) from public.nghi_viec) nghi, (select count(*) from public.phong_ban) pb, (select count(*) from public.chuc_danh_dm) cd`)).rows[0];
  await db.query(`insert into public.nhap_dot (ma, mo_ta) values ($1, $2) on conflict (ma) do nothing`, [DOT, "Nhân sự từ Lark HRM-HRIS-01: người, hồ sơ, người thân, hợp đồng, điều kiện lương, nghỉ việc (28/10/2026)"]);

  // Tài khoản hệ thống: người ghi cho dữ liệu chuyển (không đăng nhập được)
  const TEN_HT = "Dữ liệu Lark HR (hệ thống)";
  let ht = (await db.query(`select id from public.nhan_vien where ho_ten = $1 limit 1`, [TEN_HT])).rows[0]?.id; let htMoi = 0;
  if (!ht) { htMoi = 1; }
  if (!ht) ht = (await db.query(`insert into public.nhan_vien (ho_ten, vai_tro, hoat_dong, chuc_danh, trang_thai_lam, khung_lam_viec, nhap_dot) values ($1, 'nhan_vien', false, 'Tài khoản hệ thống – không đăng nhập', 'khoa', 'khong_cham_cong', $2) returning id`, [TEN_HT, DOT])).rows[0].id;

  // Danh mục
  const pb = new Map((await db.query(`select id, ten from public.phong_ban`)).rows.map((r) => [r.ten, r.id]));
  const cnId = new Map((await db.query(`select id, ma from public.chi_nhanh`)).rows.map((r) => [r.ma, r.id]));
  const cnMa = new Map([...cnId].map(([m, i]) => [i, m]));
  const cdDm = new Map((await db.query(`select ten from public.chuc_danh_dm`)).rows.map((r) => [khongDau(r.ten), r.ten]));

  // Bảng 1.6 gom theo người (record 1.1), sắp theo ngày hiệu lực
  const r16 = docBang("1.6").map((r) => ({ r, rec: (r["✏️Mã nhân viên"] || [])[0]?.id, hl: ngay(r["✏️Ngày áp dụng"]) ?? ngay(r["✏️Ngày cập nhật"]) })).filter((x) => x.rec && P.byRec.get(x.rec));
  const r16Theo = new Map(); for (const x of r16) (r16Theo.get(x.rec) ?? r16Theo.set(x.rec, []).get(x.rec)).push(x);
  for (const l of r16Theo.values()) l.sort((a, b) => String(a.hl).localeCompare(String(b.hl)) || String(chu(a.r["✏️Ngày cập nhật"])).localeCompare(String(chu(b.r["✏️Ngày cập nhật"]))));
  const moiNhat = (p) => r16Theo.get(p.rec)?.at(-1)?.r ?? null;

  // Chức danh mới vào danh mục (chỉ những tên chưa có, so không dấu)
  const dsCd = new Map();
  for (const p of people) for (const t of [...danhSach(p.r?.["Chức vụ"]), ...(r16Theo.get(p.rec) ?? []).flatMap((x) => danhSach(x.r["Chức danh(*)"]))]) { const k = khongDau(t); if (k && !cdDm.has(k) && !dsCd.has(k)) dsCd.set(k, t.trim()); }
  for (const r of docBang("9.2")) { const t = chu(r["✏️Chức vụ"]); const k = khongDau(t); if (k && !cdDm.has(k) && !dsCd.has(k)) dsCd.set(k, t); }
  let thuTuCd = Number((await db.query(`select coalesce(max(thu_tu), 0) m from public.chuc_danh_dm`)).rows[0].m);
  for (const [k, t] of dsCd) { await db.query(`insert into public.chuc_danh_dm (ten, thu_tu, nhap_dot) values ($1, $2, $3)`, [t, ++thuTuCd, DOT]); cdDm.set(k, t); dem("chuc_danh_moi"); }

  // Ghép với người AMIA có sẵn
  const nvAmia = (await db.query(`select id, ho_ten, dien_thoai, email, chi_nhanh_id, lark_open_id from public.nhan_vien where nhap_dot is distinct from $1 and ho_ten <> $2`, [DOT, TEN_HT])).rows;
  const gh = ghepVoiAmia({ ...P, people }, nvAmia, cnMa); const ghep = new Map([...gh.ghep].filter(([p]) => trongPham.has(p))); const canXacNhan = gh.canXacNhan;
  dem("ghep_voi_amia", ghep.size);

  // Hoạt động cuối cùng (để suy trạng thái người chỉ có ở 2.1)
  const cuoiCong = new Map(); for (const r of [...docBang("2.3")]) { const o = nguoiLark(r.Employee), d = ngay(r.Date); if (o && d && (!cuoiCong.get(o) || d > cuoiCong.get(o))) cuoiCong.set(o, d); }

  // ───── Người ─────
  const emailDaCo = new Set((await db.query(`select lower(email) e from public.nhan_vien where email is not null`)).rows.map((r) => r.e));
  const idCua = new Map(); // person → nhan_vien.id
  const canXacNhanTt = [];
  for (const p of people) {
    const r16m = moiNhat(p);
    const donVi = chu(p.r?.["Nơi làm việc"]) ?? chu(r16m?.["✏️Làm việc"]) ?? (chu(p.r21?.work_station)?.match(/AVI|ADL|MSC/)?.[0] ?? null);
    const pbGoc = chu(p.r?.["Phòng ban"]) ?? chu(r16m?.["Phòng ban"]) ?? chu(p.r21?.departments);
    const pbId = pb.get(phongBanChung(pbGoc)) ?? null;
    const cd = danhSach(p.r?.["Chức vụ"]).join(", ") || danhSach(r16m?.["Chức danh(*)"]).join(", ") || chu(p.r21?.job_title) || null;
    const email = p.email && !emailDaCo.has(p.email.toLowerCase()) ? p.email : null; if (email) emailDaCo.add(email.toLowerCase());
    const ngayNghi = p.ngayNghi && p.ngayNghi <= HOM_NAY ? p.ngayNghi : null;
    let tt;
    if (ngayNghi) tt = "nghi_viec";
    else if (p.nguon === "1.1" && chu(p.r["Trạng thái"]) === "Đang làm") tt = "dang_lam";
    else if (p.nguon === "2.1" && (cuoiCong.get(p.open) ?? "") >= "2026-10-01") tt = "dang_lam";
    else { tt = "tam_nghi"; canXacNhanTt.push(p.ma ?? p.open); }
    const khung = KHUNG[chu(r16m?.["✏️Khung làm việc"])] ?? (donVi === "MSC" ? "van_phong" : "chi_nhanh");
    dem("tt_" + tt);
    const g = ghep.get(p);
    if (g) {
      const n = (await db.query(`select *, ngay_vao_lam::text as d_vao, ngay_vao_chinh_thuc::text as d_ct, ngay_nghi_viec::text as d_nghi from public.nhan_vien where id = $1 for update`, [g.nv.id])).rows[0];
      const tr = { lark_open_id: n.lark_open_id, ma_lark: n.ma_lark, don_vi: n.don_vi, phong_ban_goc: n.phong_ban_goc, phong_ban_id: n.phong_ban_id, ngay_vao_lam: n.d_vao, ngay_vao_chinh_thuc: n.d_ct, ngay_nghi_viec: n.d_nghi, email: n.email, dien_thoai: n.dien_thoai, chuc_danh: n.chuc_danh };
      await db.query(`insert into public.nhan_vien_ghep_lark (nhan_vien_id, nhap_dot, ma_lark, ly_do, truoc) values ($1, $2, $3, $4, $5)`, [n.id, DOT, p.ma, g.ly, JSON.stringify(tr)]);
      await db.query(`update public.nhan_vien set lark_open_id = $2, ma_lark = $3, don_vi = $4, phong_ban_goc = $5, phong_ban_id = coalesce(phong_ban_id, $6), ngay_vao_lam = coalesce(ngay_vao_lam, $7), ngay_vao_chinh_thuc = coalesce(ngay_vao_chinh_thuc, $8), ngay_nghi_viec = coalesce(ngay_nghi_viec, $9), email = coalesce(email, $10), dien_thoai = coalesce(dien_thoai, $11), chuc_danh = coalesce(chuc_danh, $12) where id = $1`,
        [n.id, p.open, p.ma, donVi, pbGoc, pbId, p.ngayVao, p.ngayCT, ngayNghi, email, p.sdt || null, cd]);
      idCua.set(p, n.id); dem("nhan_vien_cap_nhat");
      if (tt === "nghi_viec" && n.hoat_dong) dem("xung_dot_amia_con_hoat_dong_lark_da_nghi");
      continue;
    }
    const ins = await db.query(`insert into public.nhan_vien (ho_ten, dien_thoai, email, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong, ngay_vao_lam, ngay_vao_chinh_thuc, trang_thai_lam, khung_lam_viec, phong_ban_id, ngay_nghi_viec, lark_open_id, ma_lark, don_vi, phong_ban_goc, nhap_dot)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning id`,
      [p.ten, p.sdt || null, email, vaiTroTheoChucDanh(cd), cd, cnId.get(CN_THEO_DON_VI[donVi] ?? "") ?? null, tt === "dang_lam", p.ngayVao, p.ngayCT, tt, khung, pbId, ngayNghi, p.open, p.ma, donVi, pbGoc, DOT]);
    idCua.set(p, ins.rows[0].id); dem("nhan_vien_moi");
  }
  const idTheoRec = (rec) => { const p = P.byRec.get(rec); return p && trongPham.has(p) ? idCua.get(p) : null; };
  const idTheoOpen = (o) => { const p = o ? P.byOpen.get(o) : null; return p && trongPham.has(p) ? idCua.get(p) : null; };

  // ───── Hồ sơ cá nhân (bảng 1.1) ─────
  const HON_NHAN = new Set(["Độc thân", "Đã lập gia đình", "Đã lập gia đình, có con", "Khác"]);
  for (const p of people.filter((x) => x.nguon === "1.1")) {
    const r = p.r; const id = idCua.get(p); const tk = chu(r["✏️Số Tài Khoản"]);
    const hn = chu(r["✏️Tình trạng hôn nhân"]); const gt = chu(r["✏️Giới tính"]);
    const kq = await db.query(`insert into public.nhan_vien_ho_so (nhan_vien_id, gioi_tinh, ngay_sinh, noi_sinh, que_quan, dan_toc, ton_giao, quoc_tich, tinh_trang_hon_nhan, dien_thoai_rieng, cccd, ngay_cap_cccd, noi_cap_cccd, ma_so_thue, so_bhxh, so_bhyt, noi_dk_bhyt, dia_chi_hien_tai, nguoi_than_ten, nguoi_than_quan_he, nguoi_than_dien_thoai, truong, nganh, hinh_thuc_nhan_luong, ngan_hang, so_tai_khoan, nhap_dot)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) on conflict (nhan_vien_id) do nothing`,
      [id, gt === "Nam" || gt === "Nữ" ? gt : null, ngay(r["✏️Ngày tháng năm sinh"]), chu(r["✏️Nơi Sinh"]), chu(r["✏️Quê quán"]), chu(r["✏️Dân tộc"]), chu(r["✏️Tôn giáo"]), chu(r["✏️Quốc tịch"]), HON_NHAN.has(hn) ? hn : null,
       p.sdt || null, chu(r["✏️Căn cước công dân"]), ngay(r["✏️Ngày cấp CCCD"]), chu(r["✏️Nơi cấp CCCD"]), chu(r["✏️Mã số thuế TNCN(*)"]), chu(r["✏️Số sổ BHXH(*)"]), chu(r["✏️Số thẻ BHYT(*)"]), chu(r["✏️Nơi đăng ký BHYT(*)"]),
       chu(r["✏️Địa chỉ hiện tại"]), chu(r["✏️Họ và tên người thân"]), chu(r["✏️Mối quan hệ với người thân"]), chu(r["✏️Số điện thoại người thân"]), chu(r["✏️Trường đại học/cao đẳng"]), chu(r["✏️Ngành học"]),
       tk ? "chuyen_khoan" : null, chu(r["✏️Ngân hàng"]), tk, DOT]);
    dem("ho_so", kq.rowCount); if (!kq.rowCount) dem("ho_so_da_co_giu_nguyen");
  }

  // ───── Người thân / phụ thuộc (1.2) ─────
  for (const r of docBang("1.2")) {
    const nv = idTheoOpen(nguoiLark(r["Họ và tên nhân viên"])); if (!nv) { if (!gioiHan) dem("than_nhan_thieu_nguoi"); continue; }
    const qh = chu(r["Quan hệ với nhân viên"]); const gt = chu(r["Giới tính"]);
    await db.query(`insert into public.nhan_vien_than_nhan (nhan_vien_id, ho_ten, quan_he, ngay_sinh, cccd, phu_thuoc, dien_thoai, gioi_tinh, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [nv, chu(r["Họ và tên người thân"]), qh, ngay(r["Ngày sinh"]), chu(r["Căn cước công dân chủ hộ(*)"]), chu(r["Trạng thái người phụ thuộc"]) === "Người phụ thuộc", chu(r["Số điện thoại chủ hộ"]), gt === "Nam" || gt === "Nữ" ? gt : null, DOT]);
    dem("than_nhan");
  }

  // ───── Hợp đồng lao động (1.3) và hợp đồng khác (1.4) ─────
  const linkFile = (v) => { const t = (Array.isArray(v) ? v : [])[0]?.file_token; return t ? `https://mscgroupvn.jp.larksuite.com/file/${t}` : null; };
  const hdDaCo = new Map();
  for (const c of docBang("1.3")) {
    const nv = idTheoOpen(nguoiLark(c["✏️Họ tên nhân sự(*)"])); if (!nv) continue;
    const gd = [
      ["thu_viec", chu(c["✏️Số HĐTV"]), linkFile(c["✏️File hợp đồng(*)"]), ngay(c["Từ ngày(*)"]), ngay(c["Đến ngày(*)"])],
      ["hdld_1", chu(c["✏️Số HĐLĐ (lần 1)(*)"]), linkFile(c["✏️File hợp đồng (1)(*)"]), ngay(c["Từ ngày (lần 1)(*)"]), ngay(c["Đến ngày (lần 1)(*)"])],
      ["hdld_2", chu(c["✏️Số HĐLĐ (lần 2)(*)"]), linkFile(c["✏️File hợp đồng (2)(*)"]), ngay(c["Từ ngày (lần 2)(*)"]), ngay(c["Đến ngày (lần 2)(*)"])],
      ["kxd", chu(c["✏️Số HĐ KXĐ(*)"]), linkFile(c["✏️File hợp đồng (3)(*)"]), ngay(c["Từ ngày ký(*)"]), null],
    ];
    let coBang = false;
    for (const [giaiDoan, soHd, link, tu, den] of gd) {
      if (!soHd && !link) continue; coBang = true;
      if (!tu || (giaiDoan !== "kxd" && (!den || den < tu))) { dem("hop_dong_bo_vi_ngay_khong_hop_le_" + giaiDoan); continue; }
      const k = nv + "|" + giaiDoan; const cu = hdDaCo.get(k);
      if (cu) { dem("hop_dong_trung_giai_doan_giu_dong_day_du_hon"); if ((cu[2] ? 1 : 0) + (cu[5] ? 1 : 0) >= (soHd ? 1 : 0) + (link ? 1 : 0)) continue; }
      hdDaCo.set(k, [nv, giaiDoan, soHd, tu, den, link, chu(c["✏️note"])]);
    }
    if (!coBang) dem("hop_dong_chi_la_lich_du_kien_khong_do");
  }
  for (const h of hdDaCo.values()) { await db.query(`insert into public.hd_lao_dong (nhan_vien_id, giai_doan, so_hd, tu_ngay, den_ngay, link_ban_dien_tu, ghi_chu, nguoi_id, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [...h, ht, DOT]); dem("hop_dong_" + h[1]); }

  // ───── Điều kiện lương theo lộ trình (1.6) ─────
  let tongCb = 0, tongTt = 0;
  for (const [rec, list] of r16Theo) {
    const nv = idTheoRec(rec); if (!nv) continue; const p = P.byRec.get(rec);
    const soNpt = docBang("1.2").filter((x) => nguoiLark(x["Họ và tên nhân viên"]) === p.open && chu(x["Trạng thái người phụ thuộc"]) === "Người phụ thuộc").length;
    const daCo = new Map();
    for (const x of list) { // list đã sắp theo ngày hiệu lực; dòng sau (cập nhật muộn hơn) ghi đè dòng trùng ngày
      daCo.set(x.hl, x);
    }
    const dong = [...daCo.values()]; dem("lo_trinh_trung_ngay_gop", list.length - dong.length);
    for (let i = 0; i < dong.length; i++) {
      const r = dong[i].r; const hl = dong[i].hl; if (!hl) { dem("lo_trinh_thieu_ngay"); continue; }
      const dongBh = chu(r["✏️Đóng BH"]) === "Đóng BH"; const cb = tien(r["✏️Lương CB (BHXH)"]) ?? 0;
      const tt16 = chu(r["✏️Tình trạng(*)"]) ?? chu(p.r?.["Tình trạng"]);
      const tinhTrang = tt16 === "Thử việc" ? "thu_viec" : "chinh_thuc";
      const cd = danhSach(r["Chức danh(*)"]).join(", ") || null; const pbc = chu(r["Phòng ban"]);
      const lt = tien(r["✏️Lương thỏa thuận"]);
      await db.query(`insert into public.dieu_kien_luong (nhan_vien_id, hieu_luc_tu, tinh_trang, luong_co_ban, dong_bh, luong_dong_bh, an_ca_ngay, dong_phuc_cap, nha_o_cap, so_npt, ghi_chu, nguoi_id, chuc_danh, phong_ban_id, vi_tri, luong_thoa_thuan, thuong_hieu_qua, quy_nhan_vien, phu_cap_khac, phu_cap_truc_ca, he_so_luong, cam_ket_08, khung_lam_viec, ngay_thong_bao_review, nhap_dot)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [nv, hl, tinhTrang, cb, dongBh, dongBh ? cb : 0, tien(r["✏️Ăn ca"]) ?? 0, tien(r["✏️Hỗ trợ đồng phục"]) ?? 0, tien(r["✏️Hỗ trợ nhà ở"]) ?? 0, i === dong.length - 1 ? soNpt : 0, null, ht, cd, pb.get(phongBanChung(pbc)) ?? null, VI_TRI[chu(r["Vị trí(*)"])] ?? null,
         lt, tien(r["✏️Thưởng hiệu quả công việc"]), tien(r["✏️Quỹ nhân viên"]), tien(r["✏️Phụ cấp khác"]), tien(r["✏️Phụ cấp trực ca"]), so(r["✏️Hệ số lương"]), chu(r["✏️Cam kết 08 - TTNCN"]) === "Có" ? true : chu(r["✏️Cam kết 08 - TTNCN"]) === "Không" ? false : null,
         KHUNG[chu(r["✏️Khung làm việc"])] ?? null, ngay(r["Ngày thông báo review lương"]), DOT]);
      dem("dieu_kien_luong"); tongCb += cb; tongTt += lt ?? 0;
    }
  }

  // ───── Nghỉ việc (1.8, trùng khớp 10.7) + khảo sát (1.9) ─────
  const NHOM = { "Lương, thưởng không phù hợp": "luong_thuong", "Lý do cá nhân khác": "ca_nhan", "Công việc không đúng định hướng": "dinh_huong", "Chuyển nơi sinh sống": "ca_nhan", "Công ty tái cơ cấu hoặc cắt giảm nhân sự": "khac" };
  const nghi = docBang("1.8").map((r) => ({ r, nv: idTheoOpen(nguoiLark(r.Requester)), nop: ngay(r["Thời gian làm đơn"]) ?? ngay(r["Submitted at"]) })).filter((x) => x.nv);
  nghi.sort((a, b) => String(a.nop).localeCompare(String(b.nop)));
  const dangChay = new Map(); // nv → phiếu đang chạy (mới nhất giữ, cũ hơn → huỷ)
  const sXong = nghi.map((x) => {
    const st = chu(x.r.Status); const lc = ngay(x.r["Ngày làm việc cuối cùng"]);
    let tt = st === "Approved" ? (lc && lc <= HOM_NAY ? "hoan_tat" : "da_duyet") : st === "Under Review" ? "cho_duyet" : st === "Rejected" ? "tu_choi" : "huy";
    return { ...x, tt, lc, st };
  });
  for (const x of sXong) if (x.tt === "cho_duyet" || x.tt === "da_duyet") { const cu = dangChay.get(x.nv); if (cu) { cu.tt = "huy"; dem("nghi_viec_phieu_cu_doi_thanh_huy_do_trung_phieu_dang_chay"); } dangChay.set(x.nv, x); }
  const nghiTheoNv = new Map();
  for (const x of sXong) {
    if (!x.lc) { dem("nghi_viec_thieu_ngay_cuoi"); continue; }
    const lydo = chu(x.r["Lý do nghỉ việc"]); const khac = chu(x.r["Lý do nghỉ việc(khác)"]);
    const ban = chu(x.r["Biên bản thỏa thuận nghỉ việc"]), cam = chu(x.r["Cam kết bảo mật chống cạnh tranh"]);
    const kq = await db.query(`insert into public.nghi_viec (nhan_vien_id, loai, nhom_ly_do, ly_do, ngay_lam_cuoi, nguoi_nhan_ban_giao_id, ban_giao_xong, bien_ban_thoa_thuan, cam_ket_bao_mat, khao_sat, trang_thai, nguoi_gui_id, hoan_tat_luc, tao_luc, nhap_dot, ma_phieu, ly_do_goc, trang_thai_goc, nop_luc)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,$10,$11,$12,coalesce($13::timestamptz, now()),$14,$15,$16,$17,$18) returning id`,
      [x.nv, chu(x.r["Loại nghỉ việc"]) === "Trước hạn" ? "truoc_han" : "dung_han", NHOM[lydo] ?? "khac", [lydo, khac].filter(Boolean).join(" — ") || null, x.lc, idTheoOpen(nguoiLark(x.r["Người nhận bàn giao"])),
       chu(x.r["Đã/Chưa hoàn thành bàn giao công việc"]) === "Đã hoàn thành bàn giao công việc", ban === "Đã ký thỏa thuận nghỉ việc", cam === "Đã ký cam kết", x.tt, x.nv,
       x.tt === "hoan_tat" ? thoiDiem(x.r["Completed at"]) : null, thoiDiem(x.r["Submitted at"]), DOT, chu(x.r["Request No."]), lydo, x.st, x.nop]);
    dem("nghi_viec"); (nghiTheoNv.get(x.nv) ?? nghiTheoNv.set(x.nv, []).get(x.nv)).push(kq.rows[0].id);
  }
  for (const r of docBang("1.9")) {
    const nv = idTheoRec((r["Mã NV"] || [])[0]?.id);
    if (!nv) { dem("khao_sat_nghi_viec_khong_noi_duoc_nguoi"); continue; }
    await db.query(`insert into public.hr_khao_sat_nghi_viec (nhan_vien_id, y_dinh_nghi, ly_do_chinh, yeu_to_giu_chan, danh_gia_quan_ly, lo_trinh_phat_trien, y_kien, chi_nhanh, chuc_vu, phong_ban, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [nv, chu(r["Bắt đầu có ý định nghỉ"]), chu(r["Lý do chính nghỉ việc"]), danhSach(r["Yếu tố giữ chân"]).join("; ") || null, so(r["Đánh giá quản lý"]), so(r["Lộ trình phát triển"]), chu(r["Ý kiến đóng góp"]), chu(r["Chi nhánh"]), chu(r["Chức vụ"]), chu(r["Phòng ban"]), DOT]);
    dem("khao_sat_nghi_viec");
  }
  // ───── Cơ cấu đơn vị Lark (2.2) ─────
  for (const r of docBang("2.2")) {
    await db.query(`insert into public.hr_don_vi_lark (ma_lark, ten, ma_cha, truong_don_vi_id, thu_tu, hoat_dong, nhap_dot) values ($1,$2,$3,$4,$5,$6,$7)`,
      [chu(r.department_id), chu(r.name), chu(r.parent_department_id) && chu(r.parent_department_id) !== "0" ? chu(r.parent_department_id) : null, idTheoOpen(nguoiLark(r.leader)), so(r.order), !/inactive|disable|unused/i.test(String(chu(r.status) ?? "")), DOT]);
    dem("don_vi_lark");
  }

  // ───── Đối chiếu ─────
  const sau = (await db.query(`select (select count(*) from public.nhan_vien) nv, (select count(*) from public.nhan_vien_ho_so) hs, (select count(*) from public.nhan_vien_than_nhan) tn, (select count(*) from public.hd_lao_dong) hd, (select count(*) from public.dieu_kien_luong) dk, (select count(*) from public.nghi_viec) nghi, (select count(*) from public.phong_ban) pb, (select count(*) from public.chuc_danh_dm) cd,
    (select coalesce(sum(luong_co_ban), 0) from public.dieu_kien_luong where nhap_dot = $1) cb, (select coalesce(sum(luong_thoa_thuan), 0) from public.dieu_kien_luong where nhap_dot = $1) tt`, [DOT])).rows[0];
  const hieu = {}; for (const k of Object.keys(truoc)) hieu[k] = Number(sau[k]) - Number(truoc[k]);
  console.log("Thống kê:", JSON.stringify(thongKe, null, 1));
  console.log("Trước:", JSON.stringify(truoc)); console.log("Sau  :", JSON.stringify(sau)); console.log("Chênh:", JSON.stringify(hieu));
  console.log(`Tổng lương cơ bản (BHXH) đã đổ = ${sau.cb} | nguồn (sau gộp trùng ngày) = ${tongCb} | khớp ${Number(sau.cb) === tongCb}; Tổng lương thoả thuận đã đổ = ${sau.tt} | nguồn = ${tongTt} | khớp ${Number(sau.tt) === tongTt}`);
  console.log("AMIA không ghép được với Lark (cần chị xác nhận):", canXacNhan.length, "| người Lark chưa rõ trạng thái làm việc (tam_nghi, cần chị xác nhận):", canXacNhanTt.length);
  const kiemTra = [
    ["nhan_vien: chênh = người mới + tài khoản hệ thống", hieu.nv === (thongKe.nhan_vien_moi ?? 0) + htMoi],
    ["người Lark = mới + ghép", people.length === (thongKe.nhan_vien_moi ?? 0) + (thongKe.nhan_vien_cap_nhat ?? 0)],
    ["hồ sơ = 1.1 − đã có", hieu.hs === (thongKe.ho_so ?? 0)],
    ["người thân = đã ghi", hieu.tn === (thongKe.than_nhan ?? 0)],
    ["điều kiện lương = đã ghi", hieu.dk === (thongKe.dieu_kien_luong ?? 0)],
    ["nghỉ việc = đã ghi", hieu.nghi === (thongKe.nghi_viec ?? 0)],
    ["khảo sát nghỉ việc = 1.9 (12)", gioiHan || (thongKe.khao_sat_nghi_viec ?? 0) === docBang("1.9").length],
    ["đơn vị Lark = 2.2 (19)", gioiHan || (thongKe.don_vi_lark ?? 0) === docBang("2.2").length],
    ["lương CB khớp tổng nguồn", Number(sau.cb) === tongCb && Number(sau.tt) === tongTt],
  ];
  console.table(kiemTra.map(([k, v]) => ({ kiem_tra: k, khop: v })));
  const khop = kiemTra.every(([, v]) => v);
  if (thuGo) {
    const kq = await db.query(`select public.go_dot_hr($1) as r`, [DOT]); console.log("go_dot_hr:", JSON.stringify(kq.rows[0].r));
    const g = (await db.query(`select (select count(*) from public.nhan_vien) nv, (select count(*) from public.nhan_vien_ho_so) hs, (select count(*) from public.nhan_vien_than_nhan) tn, (select count(*) from public.hd_lao_dong) hd, (select count(*) from public.dieu_kien_luong) dk, (select count(*) from public.nghi_viec) nghi, (select count(*) from public.phong_ban) pb, (select count(*) from public.chuc_danh_dm) cd`)).rows[0];
    const veCu = Object.keys(truoc).every((k) => Number(g[k]) === Number(truoc[k])); console.log("Sau go_dot_hr đếm lại:", JSON.stringify(g), "→ về đúng như trước:", veCu);
    // người ghép đã trả lại cột cũ?
    const x = (await db.query(`select count(*) c from public.nhan_vien where lark_open_id is not null or ma_lark is not null`)).rows[0].c; console.log("nhan_vien còn khoá Lark sau khi gỡ (phải 0):", x);
    await db.query("rollback"); process.exitCode = veCu && x === "0" ? 0 : 1; await db.end(); process.exit();
  }
  if (!khop) { console.log("KHÔNG KHỚP → huỷ, không ghi."); await db.query("rollback"); process.exitCode = 1; }
  else if (!that) { await db.query("rollback"); console.log("Chạy thử OK (đã huỷ, chưa ghi). Thêm --that để ghi thật."); }
  else { await db.query("commit"); console.log("ĐÃ GHI (mã đợt " + DOT + ")."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

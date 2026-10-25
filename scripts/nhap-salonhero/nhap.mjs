// Chuyển dữ liệu SalonHero → AMIA OS. Chỉ chuyển SỐ DƯ ĐẦU KỲ + danh mục + hồ sơ khách (không phát lại lịch sử hoá đơn).
// Chạy lại an toàn: mọi bản ghi có sh_id (unique), gặp lại thì bỏ qua. `db` là bất kỳ object có query(sql, params) → {rows} (pg.Client hoặc PGlite).
// Đầu vào `d` = { khach, khach_chi_tiet, the, loai_the, dich_vu, san_pham, nhom, nhan_vien, no, ton_kho, don_vi } (xuất từ SalonHero bằng ABA, xem README).

const HANG = { NORMAL: "Thường", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch kim", DIAMOND: "Kim cương" };
const LOC_DALAT = 9202;   // mọi nơi khác (kể cả Vinh 8377) = chi nhánh VINH

const vnNgay = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10) : null);
const sdt = (s) => { let p = String(s ?? "").replace(/\D/g, ""); if (p.startsWith("84") && p.length >= 11) p = "0" + p.slice(2); return p; };
const sach = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
const cnTheoLoc = (id) => (Number(id) === LOC_DALAT ? "DALAT" : "VINH");

function vaiTro(chucDanh) {
  const t = String(chucDanh ?? "").toLowerCase();
  if (/b[aá]c s[ỹĩi]|bác sĩ|bác sỹ/.test(t)) return "bac_si";
  if (/thu ng[aâ]n/.test(t)) return "thu_ngan";
  if (/quản lý|giám đốc/.test(t)) return "quan_ly";
  if (/tư vấn/.test(t)) return "tu_van";
  return "ktv";
}
function nguonKhach(ct) {
  const s = sach(ct.refer_source).toLowerCase();
  if (Number(ct.refer_by_cust_id) > 0 || /bạn bè|giới thiệu|người quen/.test(s)) return "khach_cu_gioi_thieu";
  if (/page|facebook|fb|voucher|tiktok|zalo|google|website|quảng cáo|ads/.test(s)) return "mkt";
  return "khac";
}
function dedupe(giaTri, daCo, id) {
  let v = giaTri;
  if (daCo.has(v)) v = `${giaTri}-${id}`;
  daCo.add(v);
  return v;
}
async function theoLo(db, mang, n, fn) {
  for (let i = 0; i < mang.length; i += n) await fn(mang.slice(i, i + n));
}

// Khách đã bị xoá khỏi danh sách SalonHero nhưng vẫn còn thẻ (còn tiền / còn buổi): dựng hồ sơ từ chính dữ liệu thẻ để không mất số dư.
export function khachDayDu(d) {
  const co = new Set(d.khach.map((c) => c.id));
  const mo = new Map();
  for (const c of d.the) {
    if (c.is_deleted || co.has(c.customer_id) || mo.has(c.customer_id)) continue;
    mo.set(c.customer_id, { id: c.customer_id, code: c.customer_code, full_name: c.customer_fullname, mobile: c.customer_phone, gender: "", rank: "NORMAL", loyalty_point: 0, tags: [],
      location_names: c.init_location_name ?? "", _tu_the: true });
  }
  return [...d.khach, ...mo.values()];
}

export async function nhap(db, d, { log = () => {} } = {}) {
  const q = async (sql, p) => (await db.query(sql, p)).rows;
  const kq = {};
  const chu = (await q(`select id from public.nhan_vien where vai_tro = 'chu' and hoat_dong order by tao_luc limit 1`))[0];
  if (!chu) throw new Error("Chưa có tài khoản Chủ (nhan_vien.vai_tro = 'chu') để làm người phụ trách / người lập mặc định.");
  const cn = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  if (!cn.VINH || !cn.DALAT) throw new Error("Thiếu chi nhánh VINH / DALAT.");

  // ───── Nhóm dịch vụ + dịch vụ ─────
  const nhomDv = [...new Set(d.dich_vu.map((x) => sach(x.group_name) || "Khác"))];
  for (const t of nhomDv) await q(`insert into public.dich_vu_nhom (ten, thu_tu) values ($1, (select coalesce(max(thu_tu), 0) + 1 from public.dich_vu_nhom)) on conflict (ten) do nothing`, [t]);
  const maDv = new Set((await q(`select ma from public.dich_vu`)).map((r) => r.ma));
  const dv = d.dich_vu.map((x) => ({
    sh_id: x.id, ma: dedupe(sach(x.sku) || `DV${x.id}`, maDv, x.id), nhom: sach(x.group_name) || "Khác", ten: sach(x.name),
    thoi_luong: Number(x.service_duration) > 0 ? Math.round(Number(x.service_duration)) : 60,
    gia: Math.max(0, Math.round(Number(x.default_price) || 0)), gia_von: Math.max(0, Math.round(Number(x.import_price) || 0)),
    // dịch vụ "thẻ thành viên / thẻ tiền" của SalonHero chỉ là vỏ cho thẻ: giữ để đối chiếu, không bán lẻ
    hoat_dong: !/^(thẻ tiền|thẻ thành viên)$/i.test(sach(x.group_name)) && !!x.is_active && !x.is_deleted,
  }));
  await theoLo(db, dv, 500, (lo) => q(
    `insert into public.dich_vu (sh_id, ma, nhom_id, ten, thoi_luong_phut, gia, gia_von, hoat_dong)
     select x.sh_id, x.ma, (select id from public.dich_vu_nhom where ten = x.nhom), x.ten, x.thoi_luong, x.gia, x.gia_von, x.hoat_dong
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, nhom text, ten text, thoi_luong int, gia bigint, gia_von bigint, hoat_dong boolean)
     on conflict (sh_id) do nothing`, [JSON.stringify(lo)]));
  kq.dich_vu = dv.length;

  // ───── Sản phẩm ─────
  const maSp = new Set((await q(`select ma from public.san_pham`)).map((r) => r.ma));
  const u1 = d.don_vi.u1, u2 = d.don_vi.u2;
  const sp = d.san_pham.map((x) => {
    const mua = u1[Number(x.unit_1)] ?? "cái";
    const dung = Number(x.capacity) > 0 ? (u2[Number(x.unit_2)] ?? mua) : mua;
    return { sh_id: x.id, ma: dedupe(sach(x.sku) || `SP${x.id}`, maSp, x.id), ten: sach(x.name), nhom: sach(x.group_name) || null, don_vi: dung, don_vi_mua: mua,
      he_so: Number(x.capacity) > 0 ? Number(x.capacity) : 1, gia_nhap: Number(x.import_price) > 0 ? Number(x.import_price) : null,
      gia_ban: Math.max(0, Math.round(Number(x.default_price) || 0)), hoat_dong: !!x.is_active && !x.is_deleted };
  });
  await theoLo(db, sp, 500, (lo) => q(
    `insert into public.san_pham (sh_id, ma, ten, nhom, don_vi, don_vi_mua, he_so_quy_doi, gia_nhap_don_vi, gia_ban, ban_le, hoat_dong)
     select x.sh_id, x.ma, x.ten, x.nhom, x.don_vi, x.don_vi_mua, x.he_so, x.gia_nhap, x.gia_ban, true, x.hoat_dong
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ten text, nhom text, don_vi text, don_vi_mua text, he_so numeric, gia_nhap numeric, gia_ban bigint, hoat_dong boolean)
     on conflict (sh_id) do nothing`, [JSON.stringify(lo)]));
  kq.san_pham = sp.length;

  // ───── Gói thẻ (loại thẻ SalonHero + loại chỉ còn trong thẻ khách đã bán) ─────
  const maGoi = new Set((await q(`select ma from public.goi_the`)).map((r) => r.ma));
  const loai = new Map();
  for (const t of d.loai_the) loai.set(t.id, { sh_id: t.id, ten: sach(t.card_name), lan: t.card_type === "USING", gia: t.sale_price, so_buoi: t.use_limit, gtt: t.default_account_balance,
    ngay: Number(t.time_limit_by_day) > 0 ? Number(t.time_limit_by_day) : Number(t.time_limit) > 0 ? Number(t.time_limit) * 30 : null, hoat_dong: !t.is_deleted });
  let moCoi = 0;
  for (const c of d.the) if (!loai.has(c.card_id)) {
    moCoi++;
    loai.set(c.card_id, { sh_id: c.card_id, ten: sach(c.card_name), lan: c.card_type === "USING", gia: c.card_sale_price, so_buoi: c.use_limit, gtt: c.card_default_account_balance || c.account_balance, ngay: null, hoat_dong: false });
  }
  const goi = [...loai.values()].map((g) => ({
    sh_id: g.sh_id, ma: dedupe(`SH${g.sh_id}`, maGoi, g.sh_id), ten: g.ten || `Thẻ SalonHero ${g.sh_id}`, loai: g.lan ? "lan" : "tien", gia: Math.max(0, Math.round(Number(g.gia) || 0)),
    so_buoi: g.lan ? Math.max(1, Math.round(Number(g.so_buoi) || 1)) : null,
    gia_tri_the: g.lan ? null : Math.max(1, Math.round(Number(g.gtt) || Number(g.gia) || 1)), han_dung_ngay: g.ngay, hoat_dong: g.hoat_dong }));
  await theoLo(db, goi, 500, (lo) => q(
    `insert into public.goi_the (sh_id, ma, ten, loai, gia, so_buoi, gia_tri_the, han_dung_ngay, hoat_dong)
     select x.sh_id, x.ma, x.ten, x.loai, x.gia, x.so_buoi, x.gia_tri_the, x.han_dung_ngay, x.hoat_dong
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ten text, loai text, gia bigint, so_buoi int, gia_tri_the bigint, han_dung_ngay int, hoat_dong boolean)
     on conflict (sh_id) do nothing`, [JSON.stringify(lo)]));
  kq.goi_the = goi.length; kq.goi_the_chi_con_trong_the_khach = moCoi;

  // ───── Nhân viên (không tạo tài khoản đăng nhập) ─────
  const nv = d.nhan_vien.map((o) => ({ sh_id: o.id, ho_ten: sach(o.name), dien_thoai: sdt(o.phone) || null, email: sach(o.email) || null, vai_tro: vaiTro(o.title), chuc_danh: sach(o.title) || null,
    cn: cnTheoLoc(o.location_id), hoat_dong: !!o.is_active && !o.is_deleted }));
  await theoLo(db, nv, 200, (lo) => q(
    `insert into public.nhan_vien (sh_id, ho_ten, dien_thoai, email, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong)
     select x.sh_id, x.ho_ten, x.dien_thoai, x.email, x.vai_tro, x.chuc_danh, (select id from public.chi_nhanh where ma = x.cn), x.hoat_dong
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ho_ten text, dien_thoai text, email text, vai_tro text, chuc_danh text, cn text, hoat_dong boolean)
     on conflict (sh_id) do nothing`, [JSON.stringify(lo)]));
  kq.nhan_vien = nv.length;

  // ───── Khách hàng ─────
  const maDaCo = new Set((await q(`select ma from public.khach_hang`)).map((r) => r.ma));
  const sdtDaCo = new Set((await q(`select dien_thoai from public.khach_hang`)).map((r) => r.dien_thoai));
  const tatCaKhach = khachDayDu(d);
  const sapXep = [...tatCaKhach].sort((a, b) => a.id - b.id);
  const bao = { sdt_trong: 0, sdt_trung: 0, ma_trung: 0 };
  const kh = sapXep.map((c) => {
    const ct = d.khach_chi_tiet[c.id] ?? {};
    let p = sdt(c.mobile) || sdt(ct.mobile);
    let ghiChuMa = "";
    if (!p) { p = `KHONG-SDT-${c.id}`; bao.sdt_trong++; }
    else if (sdtDaCo.has(p)) { p = `${p}-TRUNG${c.id}`; bao.sdt_trung++; ghiChuMa = "SĐT trùng với một khách khác ở SalonHero, cần gộp hoặc sửa tay."; }
    sdtDaCo.add(p);
    const maGoc = sach(c.code) || `SH${c.id}`;
    if (maDaCo.has(maGoc)) bao.ma_trung++;
    const dobOk = Number(ct.dob_year) > 1900 && Number(ct.dob_month) >= 1 && Number(ct.dob_month) <= 12 && Number(ct.dob_date) >= 1 && Number(ct.dob_date) <= 31;
    const ngaySinh = dobOk ? `${ct.dob_year}-${String(ct.dob_month).padStart(2, "0")}-${String(ct.dob_date).padStart(2, "0")}` : null;
    const diaChi = [sach(ct.address), sach(ct.district_name), sach(ct.city_name)].filter(Boolean).join(", ") || null;
    const loc = ct.init_location_id ?? null;
    const cnMa = loc ? cnTheoLoc(loc) : /Đà Lạt/.test(c.location_names ?? "") && !/Vinh/.test(c.location_names ?? "") ? "DALAT" : "VINH";
    const nhan = (c.tags ?? []).map((t) => t.tag_name).filter(Boolean).join(", ");
    const ghi = [c._tu_the ? "Khách đã bị xoá khỏi danh sách SalonHero nhưng còn thẻ — hồ sơ dựng lại từ dữ liệu thẻ, cần rà lại thông tin." : "", ghiChuMa, ct.job ? `Nghề: ${sach(ct.job)}` : "", nhan ? `Nhãn SalonHero: ${nhan}` : "", Number(c.loyalty_point) > 0 ? `Điểm tích luỹ SalonHero: ${c.loyalty_point}` : ""].filter(Boolean).join("\n") || null;
    return { sh_id: c.id, ma: dedupe(maGoc, maDaCo, c.id), ho_ten: sach(ct.full_name || c.full_name) || `Khách ${c.id}`, dien_thoai: p, zalo: sdt(c.zalo) || null, email: sach(ct.email || c.email) || null,
      gioi_tinh: c.gender === "F" ? "nữ" : c.gender === "M" ? "nam" : null, ngay_sinh: ngaySinh, dia_chi: diaChi, cn: cnMa, nguon: nguonKhach(ct), nguon_chi_tiet: sach(ct.refer_source) || null, ghi_chu: ghi,
      tao_luc: ct.createdAt ?? null, hang_goc: HANG[c.rank] ?? null, diem_goc: Number(c.loyalty_point) || 0, tong_chi_goc: Math.round(Number(ct.total_paid_amount) || 0),
      so_lan_den_goc: Number(ct.number_visited) || 0, lan_den_cuoi: vnNgay(ct.last_visited), note: sach(ct.note) ? String(ct.note).trim() : null, ref: Number(ct.refer_by_cust_id) || null };
  });
  let khachMoi = 0, ghiChuMoi = 0;
  await theoLo(db, kh, 1000, async (lo) => {
    const them = await q(
      `with ins as (
         insert into public.khach_hang (sh_id, ma, ho_ten, dien_thoai, zalo, email, gioi_tinh, ngay_sinh, dia_chi, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id, ghi_chu, tao_luc,
                                        hang_goc, diem_goc, tong_chi_goc, so_lan_den_goc, lan_den_cuoi)
         select x.sh_id, x.ma, x.ho_ten, x.dien_thoai, x.zalo, x.email, x.gioi_tinh, x.ngay_sinh, x.dia_chi, (select id from public.chi_nhanh where ma = x.cn), x.nguon, x.nguon_chi_tiet, $2::uuid, x.ghi_chu,
                coalesce(x.tao_luc, now()), x.hang_goc, x.diem_goc, x.tong_chi_goc, x.so_lan_den_goc, x.lan_den_cuoi
           from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ho_ten text, dien_thoai text, zalo text, email text, gioi_tinh text, ngay_sinh date, dia_chi text, cn text, nguon text, nguon_chi_tiet text,
                                                   ghi_chu text, tao_luc timestamptz, hang_goc text, diem_goc int, tong_chi_goc bigint, so_lan_den_goc int, lan_den_cuoi date)
         on conflict (sh_id) do nothing returning id, sh_id)
       select id, sh_id from ins`, [JSON.stringify(lo), chu.id]);
    khachMoi += them.length;
    const idTheoSh = new Map(them.map((r) => [Number(r.sh_id), r.id]));
    const ghiChu = lo.filter((x) => x.note && idTheoSh.has(x.sh_id)).map((x) => ({ khach_id: idTheoSh.get(x.sh_id), note: x.note, tao_luc: x.tao_luc }));
    if (ghiChu.length) {
      await q(`insert into public.khach_ghi_chu (khach_id, tinh_trang, tao_luc) select x.khach_id, x.note, coalesce(x.tao_luc, now()) from jsonb_to_recordset($1::jsonb) as x(khach_id uuid, note text, tao_luc timestamptz)`, [JSON.stringify(ghiChu)]);
      ghiChuMoi += ghiChu.length;
    }
  });
  const gioiThieu = kh.filter((x) => x.ref).map((x) => ({ sh_id: x.sh_id, ref: x.ref }));
  if (gioiThieu.length) await q(
    `update public.khach_hang k set nguoi_gioi_thieu_id = r.id from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ref bigint) join public.khach_hang r on r.sh_id = x.ref
      where k.sh_id = x.sh_id and k.nguoi_gioi_thieu_id is null`, [JSON.stringify(gioiThieu)]);
  kq.khach = { nguon: d.khach.length, dung_lai_tu_the: tatCaKhach.length - d.khach.length, them_moi: khachMoi, ghi_chu_dieu_tri: ghiChuMoi, ...bao };
  log("khách xong");

  // ───── Thẻ khách + số dư đầu kỳ ─────
  const khachSh = new Set(tatCaKhach.map((c) => c.id));
  const maThe = new Set((await q(`select ma from public.the_khach`)).map((r) => r.ma));
  const bo = { khong_co_khach: 0, so_du_bo: 0 };
  const the = [];
  for (const c of d.the) {
    if (c.is_deleted) continue;
    if (!khachSh.has(c.customer_id)) { bo.khong_co_khach++; bo.so_du_bo += Number(c.account_balance) || 0; continue; }
    const lan = c.card_type === "USING";
    const limit = Math.max(1, Math.round(Number(c.use_limit) || 1));
    const da = Math.min(limit, Math.max(0, Math.round(Number(c.use_count) || 0)));
    the.push({
      sh_id: c.id, ma: dedupe(sach(c.code) || `TSH${c.id}`, maThe, c.id), khach_sh: c.customer_id, goi_sh: c.card_id, cn: cnTheoLoc(c.init_location_id), loai: lan ? "lan" : "tien",
      so_buoi_tong: lan ? limit : null, tong_tien: lan ? Math.round(Number(c.card_sale_price) || 0) : Math.round(Number(c.card_default_account_balance) || Number(c.account_balance) || 0),
      gia_tri_buoi: lan ? (limit < 999999 ? Math.round((Number(c.card_sale_price) || 0) / limit) : Math.round(Number(c.card_use_price) || 0)) : 0,
      ngay_cap: vnNgay(c.created_at ?? c.createdAt), han_dung: vnNgay(c.expiry_date), trang_thai: c.is_revoked ? "thu_hoi" : c.is_locked ? "khoa" : "hoat_dong",
      ghi_chu: `Chuyển từ SalonHero (mã thẻ ${sach(c.code)})${c.note ? ` — ${sach(c.note)}` : ""}${lan && limit >= 999999 ? " — thẻ không giới hạn số buổi" : ""}`,
      so_buoi_cap: lan ? limit : 0, so_buoi_da_dung: lan ? da : 0, so_du_tien: lan ? 0 : Math.max(0, Math.round(Number(c.account_balance) || 0)),
    });
  }
  let theMoi = 0;
  await theoLo(db, the, 1000, async (lo) => {
    const them = await q(
      `with ins as (
         insert into public.the_khach (sh_id, ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, tong_tien, gia_tri_buoi, cap_tay, ngay_cap, han_dung, trang_thai, ghi_chu)
         select x.sh_id, x.ma, k.id, g.id, (select id from public.chi_nhanh where ma = x.cn), x.loai, x.so_buoi_tong, x.tong_tien, x.gia_tri_buoi, true, coalesce(x.ngay_cap, current_date), x.han_dung, x.trang_thai, x.ghi_chu
           from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, khach_sh bigint, goi_sh bigint, cn text, loai text, so_buoi_tong int, tong_tien bigint, gia_tri_buoi bigint, ngay_cap date, han_dung date, trang_thai text, ghi_chu text)
           join public.khach_hang k on k.sh_id = x.khach_sh join public.goi_the g on g.sh_id = x.goi_sh
         on conflict (sh_id) do nothing returning id, sh_id)
       select id, sh_id from ins`, [JSON.stringify(lo)]);
    theMoi += them.length;
    const idTheoSh = new Map(them.map((r) => [Number(r.sh_id), r.id]));
    const dong = [];
    for (const t of lo) {
      const id = idTheoSh.get(t.sh_id);
      if (!id) continue;
      if (t.loai === "lan") {
        dong.push({ the_id: id, loai: "cap", so_buoi: t.so_buoi_cap, so_tien: 0, ghi_chu: "Số buổi gốc chuyển từ SalonHero" });
        if (t.so_buoi_da_dung > 0) dong.push({ the_id: id, loai: "dieu_chinh", so_buoi: -t.so_buoi_da_dung, so_tien: 0, ghi_chu: "Số buổi đã dùng trước khi chuyển từ SalonHero" });
      } else dong.push({ the_id: id, loai: "cap", so_buoi: 0, so_tien: t.so_du_tien, ghi_chu: "Số dư còn lại chuyển từ SalonHero" });
    }
    if (dong.length) await q(
      `insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu)
       select x.the_id, x.loai, x.so_buoi, x.so_tien, $2::uuid, x.ghi_chu from jsonb_to_recordset($1::jsonb) as x(the_id uuid, loai text, so_buoi int, so_tien bigint, ghi_chu text)`, [JSON.stringify(dong), chu.id]);
  });
  kq.the = { nguon: d.the.length, them_moi: theMoi, bo_vi_khong_co_khach: bo.khong_co_khach, so_du_tien_bi_bo: bo.so_du_bo };
  log("thẻ xong");

  // ───── Công nợ đầu kỳ: mỗi đơn còn nợ = 1 hoá đơn `la_so_du_dau` (không tính doanh thu) ─────
  const khId = (shId) => shId;
  const no = [];
  const noBo = { khong_co_khach: 0, so_tien_bi_bo: 0 };
  for (const o of d.no) {
    const con = Math.round(Number(o.total) - Number(o.payment) - Number(o.payment_debt));
    if (con <= 0) continue;
    if (!khachSh.has(khId(o.customer_id))) { noBo.khong_co_khach++; noBo.so_tien_bi_bo += con; continue; }
    no.push({ sh_id: o.order_id, ma: `SH-${o.order_code}`, khach_sh: o.customer_id, cn: cnTheoLoc(o.location_id), ngay: vnNgay(o.order_date), con,
      ghi_chu: `Công nợ chuyển từ SalonHero. Hoá đơn gốc ${o.order_code}: tổng ${Number(o.total)}, đã thu ${Number(o.payment) + Number(o.payment_debt)}, còn nợ ${con}.` });
  }
  let noMoi = 0;
  await theoLo(db, no, 500, async (lo) => {
    const r = await q(
      `with ins as (
         insert into public.hoa_don (sh_id, ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, ghi_chu, chot_luc, la_so_du_dau)
         select x.sh_id, x.ma, (select id from public.chi_nhanh where ma = x.cn), k.id, 'hoan_thanh', x.ngay, x.con, x.con, 0, x.con, $2::uuid, x.ghi_chu, now(), true
           from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, khach_sh bigint, cn text, ngay date, con bigint, ghi_chu text) join public.khach_hang k on k.sh_id = x.khach_sh
         on conflict (sh_id) do nothing returning 1)
       select count(*)::int as n from ins`, [JSON.stringify(lo), chu.id]);
    noMoi += r[0].n;
  });
  kq.no = { don_con_no: no.length, them_moi: noMoi, bo_vi_khong_co_khach: noBo.khong_co_khach, so_tien_bi_bo: noBo.so_tien_bi_bo };

  // ───── Tồn kho đầu kỳ ─────
  const ton = d.ton_kho.filter((t) => Number(t.quantity) > 0).map((t) => ({ sp_sh: t.product_id, cn: cnTheoLoc(t.location_id), sl: Number(t.quantity), gia: Number(t.purchase_price) || null }));
  let tonMoi = 0;
  const daCoTon = new Set((await q(`select p.sh_id from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id where s.ghi_chu = 'Tồn đầu kỳ chuyển từ SalonHero'`)).map((r) => Number(r.sh_id)));
  const tonCanNhap = ton.filter((t) => !daCoTon.has(t.sp_sh));
  if (tonCanNhap.length) {
    const r = await q(
      `with ins as (
         insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id)
         select (select id from public.chi_nhanh where ma = x.cn), p.id, 'nhap', x.sl, x.gia, 'Tồn đầu kỳ chuyển từ SalonHero', $2::uuid
           from jsonb_to_recordset($1::jsonb) as x(sp_sh bigint, cn text, sl numeric, gia numeric) join public.san_pham p on p.sh_id = x.sp_sh returning 1)
       select count(*)::int as n from ins`, [JSON.stringify(tonCanNhap), chu.id]);
    tonMoi = r[0].n;
  }
  kq.ton_kho = { dong_co_ton: ton.length, them_moi: tonMoi };
  return kq;
}

// Đối chiếu số trong DB với số của chính SalonHero (nguồn đã xuất). Trả về danh sách {muc, salonhero, amia, khop}.
export async function doiChieu(db, d) {
  const q = async (sql) => (await db.query(sql)).rows[0];
  const tatCa = khachDayDu(d);
  const khachSh = new Set(tatCa.map((c) => c.id));
  const the = d.the.filter((c) => !c.is_deleted && khachSh.has(c.customer_id));
  const nguonLan = the.filter((c) => c.card_type === "USING" && !c.is_revoked && !c.is_locked && c.use_limit < 999999);
  const mon = the.filter((c) => c.card_type === "MONEY" && !c.is_revoked && !c.is_locked);
  const noNguon = d.no.reduce((s, o) => { const con = Math.round(Number(o.total) - Number(o.payment) - Number(o.payment_debt)); return s + (con > 0 && khachSh.has(o.customer_id) ? con : 0); }, 0);
  const ds = [];
  const them = (muc, a, b) => ds.push({ muc, salonhero: Number(a), amia: Number(b), khop: Number(a) === Number(b) });
  them("Số khách (gồm khách dựng lại từ thẻ)", tatCa.length, (await q(`select count(*) n from public.khach_hang where sh_id is not null`)).n);
  them("Số thẻ khách (không tính thẻ đã xoá / khách không còn)", the.length, (await q(`select count(*) n from public.the_khach where sh_id is not null`)).n);
  them("Tổng buổi còn — thẻ lần đang hoạt động, giới hạn thường", nguonLan.reduce((s, c) => s + c.use_limit - c.use_count, 0),
    (await q(`select coalesce(sum(v.so_buoi_con), 0) n from public.v_the_khach v where v.sh_id is not null and v.loai = 'lan' and v.trang_thai = 'hoat_dong' and v.so_buoi_tong < 999999`)).n);
  them("Tổng số dư thẻ tiền đang hoạt động (đ)", mon.reduce((s, c) => s + Number(c.account_balance), 0),
    (await q(`select coalesce(sum(v.so_du_tien), 0) n from public.v_the_khach v where v.sh_id is not null and v.loai = 'tien' and v.trang_thai = 'hoat_dong'`)).n);
  them("Tổng công nợ (đ)", noNguon, (await q(`select coalesce(sum(con_no), 0) n from public.hoa_don where la_so_du_dau`)).n);
  them("Số khách còn nợ", new Set(d.no.filter((o) => Number(o.total) - Number(o.payment) - Number(o.payment_debt) > 0 && khachSh.has(o.customer_id)).map((o) => o.customer_id)).size,
    (await q(`select count(distinct khach_id) n from public.hoa_don where la_so_du_dau and con_no > 0`)).n);
  return ds;
}

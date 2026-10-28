// BƯỚC 2 — CÔNG & PHIẾU: kết quả chấm công từng ngày (2.3 ∪ 10.3), phiếu nghỉ/ra ngoài/online/OT/công tác/điều chỉnh công (3.1, 3.2, 3.4, 3.5, 2.6, 10.5, 10.6),
// nghỉ tháng (3.6), nghỉ lễ (3.8, 9.3), phép đã dùng trước đó (3.3). Mã đợt: HR-2810-02. Cần HR-2810-01 đã ghi (nhan_vien có lark_open_id).
// Dùng: PW=... node scripts/chuyen-hr/buoc2-cong.mjs [--thu-go] [--that]   (mặc định chạy thử rồi huỷ)
import { ketNoi, thoiDiem, docBang, chu, so, ngay, nguoiLark } from "./lib-hr.mjs";

const DOT = "HR-2810-02";
const that = process.argv.includes("--that"), thuGo = process.argv.includes("--thu-go");
const dem0 = {}; const dem = (k, n = 1) => (dem0[k] = (dem0[k] ?? 0) + n);
const db = await ketNoi();
async function lo(bang, cols, rows, n = 400) {
  for (let i = 0; i < rows.length; i += n) {
    const part = rows.slice(i, i + n); const ph = part.map((_, r) => "(" + cols.map((_, c) => "$" + (r * cols.length + c + 1)).join(",") + ")").join(",");
    await db.query(`insert into public.${bang} (${cols.join(", ")}) values ${ph}`, part.flat());
  }
}
const phut = (a, b) => Math.round((new Date(a) - new Date(b)) / 60000);
const DEM = `select (select count(*) from public.cham_cong) cc, (select count(*) from public.hr_cong_lark) cl, (select count(*) from public.phieu_hr) ph, (select count(*) from public.hr_nghi_thang) nt, (select count(*) from public.hr_nghi_le) nl, (select count(*) from public.ngay_le) le, (select count(*) from public.dieu_chinh_phep) dp`;
try {
  await db.query("begin");
  const truoc = (await db.query(DEM)).rows[0];
  await db.query(`insert into public.nhap_dot (ma, mo_ta) values ($1,$2) on conflict (ma) do nothing`, [DOT, "Công & phiếu nhân sự từ Lark HRM-HRIS-01: chấm công ngày, nghỉ/OT/ra ngoài/online/công tác/điều chỉnh, nghỉ tháng, nghỉ lễ (28/10/2026)"]);
  const nv = new Map((await db.query(`select lark_open_id o, id from public.nhan_vien where lark_open_id is not null`)).rows.map((r) => [r.o, r.id]));
  const ht = (await db.query(`select id from public.nhan_vien where ho_ten = 'Dữ liệu Lark HR (hệ thống)'`)).rows[0].id;
  if (nv.size < 100) throw new Error("Chưa có đủ người Lark trong nhan_vien (chạy buoc1-nguoi trước).");

  // ───── Chấm công ngày: 2.3 ∪ 10.3 (khoá = Result id) ─────
  const kq = new Map(); let trung = 0;
  for (const [nguon, ma] of [["2.3", "2.3"], ["10.3", "10.3"]]) for (const r of docBang(ma)) {
    const id = chu(r["Result id"]) ?? (r.record_id ? `rec:${nguon}:${r.record_id}` : null); if (!id) { dem("cong_thieu_ma_ket_qua"); continue; } if (!chu(r["Result id"])) dem("cong_thieu_result_id_dung_ma_dong");
    if (kq.has(id)) { trung++; continue; } kq.set(id, { r, nguon });
  }
  dem("cong_nguon_2.3_va_10.3_gop_theo_result_id", kq.size); dem("cong_trung_result_id_bo", trung);
  const congRows = [];
  const byNgay = new Map(); // (nv|ngày) → giờ vào sớm nhất / ra muộn nhất để tạo cham_cong
  for (const [id, { r, nguon }] of kq) {
    const o = nguoiLark(r.Employee), n = nv.get(o), d = ngay(r.Date); if (!n || !d) { dem("cong_khong_noi_duoc_nguoi_hoac_ngay"); continue; }
    const vao = thoiDiem(r["Check in time"]), ra = thoiDiem(r["Check out time"]);
    congRows.push([n, d, id, chu(r["Shift name"]), chu(r["Group name"]), thoiDiem(r["Check in shift time"]), thoiDiem(r["Check out shift time"]), vao, ra, chu(r["Check in result"]), chu(r["Check out result"]), chu(r["Check in result supplement"]), chu(r["Check out result supplement"]),
       chu(r["Check in - Is offsite"]) === "true" ? true : chu(r["Check in - Is offsite"]) === "false" ? false : null, chu(r["Check out - Is offsite"]) === "true" ? true : chu(r["Check out - Is offsite"]) === "false" ? false : null,
       chu(r["Check in location name"]), chu(r["Check out location name"]), thoiDiem(r["Check in time No 2"]), thoiDiem(r["Check out time No 2"]), so(r["Ghi nhận đi trễ về sớm"]), nguon, DOT]);
    dem("hr_cong_lark");
    if (vao || ra) {
      const k = n + "|" + d; const c = byNgay.get(k) ?? { n, d, vao: null, ra: null, gcv: null, gcr: null, late: false, early: false, lackIn: false, lackOut: false };
      if (vao && (!c.vao || vao < c.vao)) { c.vao = vao; c.gcv = thoiDiem(r["Check in shift time"]); c.late = chu(r["Check in result"]) === "Late"; }
      if (ra && (!c.ra || ra > c.ra)) { c.ra = ra; c.gcr = thoiDiem(r["Check out shift time"]); c.early = chu(r["Check out result"]) === "Early"; }
      byNgay.set(k, c);
    }
  }
  await lo("hr_cong_lark", ["nhan_vien_id", "ngay", "ma_ket_qua", "ca_ten", "nhom_cham_cong", "gio_ca_vao", "gio_ca_ra", "vao", "ra", "kq_vao", "kq_ra", "bu_vao", "bu_ra", "ngoai_vao", "ngoai_ra", "noi_vao", "noi_ra", "vao_2", "ra_2", "tre_ve_som_cong", "nguon", "nhap_dot"], congRows);
  const ccRows = [];
  for (const c of byNgay.values()) {
    const tre = c.late && c.vao && c.gcv ? Math.max(0, phut(c.vao, c.gcv)) : 0, vs = c.early && c.ra && c.gcr ? Math.max(0, phut(c.gcr, c.ra)) : 0;
    const du = c.vao && c.ra;
    ccRows.push([c.n, c.d, c.vao, c.ra, "lark", tre, vs, du ? 1 : 0, !du ? "quen_cham_cong" : tre > 0 ? "di_muon" : null, du ? null : "Chỉ có một lượt chấm trong dữ liệu Lark — công để 0, chờ phiếu điều chỉnh", DOT]);
    dem("cham_cong");
  }

  await lo("cham_cong", ["nhan_vien_id", "ngay", "vao", "ra", "phuong_thuc", "tre_phut", "ve_som_phut", "cong", "loi", "ghi_chu", "nhap_dot"], ccRows);

  // ───── Phiếu ─────
  const TT = { Approved: "da_duyet", "Under Review": "cho_duyet", Rejected: "tu_choi", Recalled: "huy", Deleted: "huy" };
  const lam1 = (x) => Math.round(x * 10) / 10;
  const soNgayGio = (d, donVi) => { const v = so(d); if (v == null || v <= 0) return null; const goc = `${v} ${donVi ?? ""}`.trim(); return donVi === "hour" ? { gio: Math.max(0.1, lam1(v)), ngay: Math.max(0.1, lam1(v / 8)), goc } : { gio: null, ngay: Math.min(999.9, Math.max(0.1, lam1(v))), goc }; };
  const maDaDung = new Set();
  async function phieu(nguon, r, { loai, loaiNghi = null, sd, tu, den, lyDo, chiTiet = null, extra = {} }) {
    const n = nv.get(nguoiLark(r.Requester)); if (!n) { dem("phieu_khong_noi_duoc_nguoi_" + nguon); return; }
    const reqNo = chu(r["Request No."]) ?? r.record_id; let ma = `LK-${nguon}-${reqNo}`; for (let i = 2; maDaDung.has(ma); i++) { ma = `LK-${nguon}-${reqNo}-${i}`; dem("phieu_trung_ma_them_hau_to"); } maDaDung.add(ma);
    const st = chu(r.Status); const tt = TT[st] ?? "huy";
    let ghiChuNgay = null; if (!tu) { tu = ngay(r["Submitted at"]); ghiChuNgay = "Lark thiếu ngày — lấy theo ngày nộp phiếu"; dem("phieu_thieu_ngay_lay_ngay_nop_" + nguon); }
    if (!tu) { dem("phieu_thieu_ngay_" + nguon); return; }
    if (ghiChuNgay) chiTiet = [chiTiet, ghiChuNgay].filter(Boolean).join(" | ");
    const den2 = den && den >= tu ? den : tu;
    await db.query(`insert into public.phieu_hr (ma, loai, loai_nghi, nhan_vien_id, tu_ngay, den_ngay, so_ngay, so_gio, vao_dieu_chinh, ra_dieu_chinh, loi_cham_cong, ly_do, nguoi_nhan_ban_giao_id, trang_thai, nguoi_gui_id, duyet_luc, tao_luc, nhap_dot, chi_tiet_goc, trang_thai_goc)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,coalesce($17::timestamptz, now()),$18,$19,$20)`,
      [ma, loai, loaiNghi, n, tu, den2, sd.ngay, sd.gio, extra.vao ?? null, extra.ra ?? null, extra.loi ?? null, (lyDo ?? "").trim() || "(Lark không ghi lý do)", nv.get(nguoiLark(r["Người ủy nhiệm công tác"])) ?? null, tt, n,
       tt === "da_duyet" ? thoiDiem(r["Completed at"]) : null, thoiDiem(r["Submitted at"]), DOT, [chiTiet, sd.goc && "Thời lượng gốc: " + sd.goc].filter(Boolean).join(" | ") || null, st]);
    dem("phieu_" + nguon);
  }
  const LOAI_NGHI = { "Nghỉ Phép Có Lương": ["nghi", "phep_nam"], "Nghỉ không lương": ["nghi", "nghi_khong_luong"], "Nghỉ chế độ (Cưới, ma chay,..)": ["nghi", "nghi_che_do"], "Đi trễ/về sớm": ["di_tre_ve_som", null], "Xin đi ra ngoài": ["ra_ngoai", null], "Xin đi ra ngoài việc công ty": ["ra_ngoai", null] };
  for (const r of docBang("3.2")) {
    const lt = chu(r["Leave type"]); const [loai, loaiNghi] = LOAI_NGHI[lt] ?? [null, null]; if (!loai) { dem("phieu_3.2_loai_la"); continue; }
    const sd = soNgayGio(r.Duration, chu(r["Leave unit"])) ?? { gio: null, ngay: 0.1 };
    await phieu("3.2", r, { loai, loaiNghi, sd, tu: ngay(r["Start time"]), den: ngay(r["End time"]), lyDo: chu(r["Reason for leave"]), chiTiet: [lt, chu(r["Nhóm làm việc"]), chu(r["Đơn vị làm việc"]), chu(r["Thông tin liên hệ khi vắng mặt"]) ? "có SĐT liên hệ" : null].filter(Boolean).join(" | ") });
  }
  const gop = (a, b, k) => { const m = new Map(); for (const r of [...docBang(a), ...docBang(b)]) { const id = chu(r[k]); if (id && !m.has(id)) m.set(id, r); } return m; };
  for (const r of gop("3.1", "10.5", "Request No.").values()) {
    await phieu("3.1+10.5", r, { loai: "lam_online", sd: soNgayGio(r.Duration, chu(r["Duration unit"])) ?? { gio: null, ngay: 1 }, tu: ngay(r["Start time"]), den: ngay(r["End time"]), lyDo: chu(r.Reasons), chiTiet: chu(r["Out-of-office type"]) });
  }
  for (const r of docBang("3.4")) {
    await phieu("3.4", r, { loai: "ra_ngoai", sd: soNgayGio(r.Duration, chu(r["Duration unit"])) ?? { gio: null, ngay: 0.1 }, tu: ngay(r["Start time"]), den: ngay(r["End time"]), lyDo: chu(r.Reasons), chiTiet: [chu(r["Loại"]), chu(r["Nhóm làm việc"]), chu(r["Đơn vị làm việc"])].filter(Boolean).join(" | ") });
  }
  for (const r of docBang("3.5")) {
    const gio = so(r["Khoảng thời gian"]); const sd = gio && gio > 0 ? { gio: Math.max(0.1, lam1(gio)), ngay: Math.max(0.1, lam1(gio / 8)), goc: gio + " giờ" } : { gio: null, ngay: 0.1 };
    await phieu("3.5", r, { loai: "lam_them", sd, tu: ngay(r["Start time"]), den: ngay(r["End time"]), lyDo: chu(r["Lý do tăng ca"]), chiTiet: [chu(r["Khung giờ làm việc"]), chu(r["Nơi làm việc"]), chu(r["Tên dịch vụ"]) && "DV: " + chu(r["Tên dịch vụ"]), chu(r["Mã khách hàng"]) && "Mã KH: " + chu(r["Mã khách hàng"]), chu(r["Ghi chú"])].filter(Boolean).join(" | ") });
  }
  const hhmm = (v) => { const t = thoiDiem(v); return t ? new Date(new Date(t).getTime() + 7 * 3600e3).toISOString().slice(11, 16) : null; };
  const LOI = { "Quên chấm công": "quen_cham_cong", "Lý do công việc": "ly_do_cong_viec", "Lý do khác": "ly_do_khac" };
  for (const r of docBang("2.6")) {
    const lc = chu(r["Loại chấm công"]); const gio = hhmm(r["Replenishment time"]);
    await phieu("2.6", r, { loai: "dieu_chinh_cc", sd: { gio: null, ngay: 1 }, tu: ngay(r["Date of error"]), den: ngay(r["Date of error"]), lyDo: chu(r["Reason for correction"]), chiTiet: [chu(r["Original record"]), chu(r["Loại lỗi"])].filter(Boolean).join(" | "), extra: { vao: lc === "Thời gian check in" ? gio : null, ra: lc === "Thời gian check out" ? gio : null, loi: LOI[chu(r["Loại lỗi"])] ?? null } });
  }
  for (const r of docBang("10.6")) {
    const ngayVe = ngay(r["Đến ngày"]); const so_ = so(r["Total trip duration (days)"]);
    await phieu("10.6", r, { loai: "cong_tac", sd: { gio: null, ngay: so_ && so_ > 0 ? Math.round(so_ * 10) / 10 : 1 }, tu: ngay(r["Ngày bắt đầu"]), den: ngayVe, lyDo: chu(r["Reason for trip"]) ?? chu(r["Mục đích công tác"]), chiTiet: [chu(r["Địa điểm công tác"]), chu(r["Tổng số tiền đề nghị thanh toán"]) && "Đề nghị thanh toán: " + chu(r["Tổng số tiền đề nghị thanh toán"])].filter(Boolean).join(" | ") });
  }

  // ───── Nghỉ tháng, nghỉ lễ, ngày lễ, phép đã dùng trước đó ─────
  for (const r of docBang("3.6")) { const n = nv.get(nguoiLark(r["Nhân sự đăng ký"])), d = ngay(r["Ngày nghỉ"]); if (!n || !d) { dem("nghi_thang_bo_thieu_nguoi_hoac_ngay"); continue; } await db.query(`insert into public.hr_nghi_thang (nhan_vien_id, ngay, duyet, khong_duyet, nhap_dot) values ($1,$2,$3,$4,$5)`, [n, d, r["Duyệt"] === true || r["Duyệt"] === "true", r["Không duyệt"] === true || r["Không duyệt"] === "true", DOT]); dem("hr_nghi_thang"); }
  for (const r of docBang("3.8")) { const n = nv.get(nguoiLark(r["Nhân sự"])), d = ngay(r["Ngày đăng ký nghỉ lễ"]); if (!n || !d) { dem("nghi_le_bo_thieu"); continue; } await db.query(`insert into public.hr_nghi_le (nhan_vien_id, ngay, nhap_dot) values ($1,$2,$3)`, [n, d, DOT]); dem("hr_nghi_le"); }
  for (const r of docBang("9.3")) { const d = ngay(r["Ngày nghỉ lễ"]); if (!d) continue; const q = await db.query(`insert into public.ngay_le (ngay, ten, nhap_dot) values ($1,$2,$3) on conflict (ngay) do nothing`, [d, chu(r["Nội dung"]) ?? "Nghỉ lễ", DOT]); dem("ngay_le", q.rowCount); }
  for (const r of docBang("3.3")) { const n = nv.get(nguoiLark(r["🤖Họ và tên nhân sự"])), v = so(r["✏️Số phép đã dùng trước đó"]); if (!n || !v) continue; await db.query(`insert into public.dieu_chinh_phep (nhan_vien_id, nam, so_ngay, ly_do, nguoi_id, nhap_dot) values ($1,2026,$2,'Phép đã dùng trước đó (Lark 3.3)',$3,$4)`, [n, -v, ht, DOT]); dem("dieu_chinh_phep"); }

  // ───── Đối chiếu ─────
  const sau = (await db.query(DEM)).rows[0]; const h = {}; for (const k of Object.keys(truoc)) h[k] = Number(sau[k]) - Number(truoc[k]);
  console.log("Thống kê:", JSON.stringify(dem0, null, 1)); console.log("Chênh:", JSON.stringify(h));
  const nguonPhieu = ["phieu_3.2", "phieu_3.1+10.5", "phieu_3.4", "phieu_3.5", "phieu_2.6", "phieu_10.6"].reduce((s, k) => s + (dem0[k] ?? 0), 0);
  const kt = [
    ["hr_cong_lark = kết quả duy nhất", h.cl === (dem0.hr_cong_lark ?? 0) && h.cl === (dem0["cong_nguon_2.3_va_10.3_gop_theo_result_id"] ?? 0) - (dem0.cong_khong_noi_duoc_nguoi_hoac_ngay ?? 0)],
    ["cham_cong = số (người,ngày) có chấm", h.cc === (dem0.cham_cong ?? 0)],
    ["phieu_hr = tổng các bảng nguồn", h.ph === nguonPhieu],
    ["nghỉ tháng", h.nt === (dem0.hr_nghi_thang ?? 0)], ["nghỉ lễ", h.nl === (dem0.hr_nghi_le ?? 0)],
  ];
  console.table(kt.map(([k, v]) => ({ kiem_tra: k, khop: v })));
  const khop = kt.every(([, v]) => v);
  const slch = (await db.query(`select (select count(*) from public.hr_cong_lark where nhap_dot = $1 and vao is not null) co_vao, (select count(*) from public.hr_cong_lark where nhap_dot = $1 and vao is null and ra is null) khong_cham`, [DOT])).rows[0]; console.log("hr_cong_lark: có giờ vào", slch.co_vao, "| không có lượt chấm (vắng/không cần chấm)", slch.khong_cham);
  if (thuGo) {
    const g = await db.query(`select public.go_dot_hr($1) r`, [DOT]); console.log("go_dot_hr:", JSON.stringify(g.rows[0].r));
    const s2 = (await db.query(DEM)).rows[0]; const ve = Object.keys(truoc).every((k) => Number(s2[k]) === Number(truoc[k])); console.log("Sau gỡ về đúng như trước:", ve);
    await db.query("rollback"); process.exitCode = ve ? 0 : 1;
  } else if (!khop) { console.log("KHÔNG KHỚP → huỷ."); await db.query("rollback"); process.exitCode = 1; }
  else if (!that) { await db.query("rollback"); console.log("Chạy thử OK (đã huỷ). Thêm --that để ghi thật."); }
  else { await db.query("commit"); console.log("ĐÃ GHI (mã đợt " + DOT + ")."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();

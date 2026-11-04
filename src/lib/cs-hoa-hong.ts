/** Chính sách hoa hồng & phí trị liệu từ 01/11/2026 — phần TÍNH THUẦN (không đọc CSDL), để kiểm bằng ví dụ trong phụ lục.
 *  PL05: hoa hồng nhân viên (tư vấn, trị liệu viên, telesale, khối gián tiếp). PL06: hoa hồng quản lý (Giám đốc chi nhánh, Trưởng phòng Marketing).
 *  Quy định phí trị liệu + PL01 (bác sĩ) + PL02 (trị liệu viên). */
import { boDau } from "@/lib/dinh-dang";

export const HIEU_LUC_CS_MOI = "2026-11-01";

export type Bac = [number | null, number][];
export type CauHinhHh = {
  tv: { km: number; san: number; goi_km: number; goi_duoi_km: number; my_pham: number; khach_moi_tu_khai_thac: number; vuot_chi_tieu: number };
  telesale: { bac: Bac; so_ngay: number };
  gian_tiep: { moc: { tu: number; nv: number; ql: number }[] };
  gd: { bac: Bac; tru_gia_san: number };
  mkt: { bac: Bac; tran_qc: number };
  phi_tl: { tran_bs: number; tran_tlv: number; phu_bs: number };
};

export const CAU_HINH_MAC_DINH: CauHinhHh = {
  tv: { km: 0.015, san: 0.007, goi_km: 0.02, goi_duoi_km: 0.01, my_pham: 0.03, khach_moi_tu_khai_thac: 0.03, vuot_chi_tieu: 0.03 },
  telesale: { bac: [[1_800_000_000, 0.005], [2_800_000_000, 0.008], [null, 0.01]], so_ngay: 30 },
  gian_tiep: { moc: [{ tu: 2_000_000_000, nv: 300_000, ql: 500_000 }, { tu: 2_800_000_000, nv: 500_000, ql: 1_000_000 }] },
  gd: { bac: [[1_800_000_000, 0.008], [2_800_000_000, 0.02], [null, 0.03]], tru_gia_san: 0.5 },
  mkt: { bac: [[1_800_000_000, 0.005], [2_800_000_000, 0.01], [null, 0.015]], tran_qc: 0.15 },
  phi_tl: { tran_bs: 0.03, tran_tlv: 0.01, phu_bs: 15_000 },
};

/** Gộp cấu hình đọc từ CSDL với mặc định (thiếu khoá nào lấy mặc định khoá đó). */
export function docCauHinh(x: unknown): CauHinhHh {
  const o = (x && typeof x === "object" ? x : {}) as Partial<CauHinhHh>;
  const m = CAU_HINH_MAC_DINH;
  return {
    tv: { ...m.tv, ...o.tv }, telesale: { ...m.telesale, ...o.telesale }, gian_tiep: { ...m.gian_tiep, ...o.gian_tiep },
    gd: { ...m.gd, ...o.gd }, mkt: { ...m.mkt, ...o.mkt }, phi_tl: { ...m.phi_tl, ...o.phi_tl },
  };
}

/** Tính lũy tiến theo từng phần: mỗi tỉ lệ chỉ áp cho phần doanh số nằm trong mức đó, rồi cộng lại. */
export function luyTien(ds: number, bac: Bac): number {
  let tong = 0, duoi = 0;
  for (const [tren, tl] of bac) {
    if (ds <= duoi) break;
    const phan = (tren == null ? ds : Math.min(ds, tren)) - duoi;
    if (phan > 0) tong += phan * tl;
    if (tren == null) break;
    duoi = tren;
  }
  return tong;
}

/** Tỉ lệ tháng = tổng lũy tiến ÷ doanh số chi nhánh (telesale, Trưởng phòng Marketing). Doanh số 0 → tỉ lệ bậc đầu. */
export const tiLeThang = (dsCn: number, bac: Bac) => (dsCn > 0 ? luyTien(dsCn, bac) / dsCn : bac[0]?.[1] ?? 0);

/** Thưởng khối gián tiếp theo mốc doanh số chi nhánh. */
export function thuongGianTiep(dsCn: number, cap: "nv" | "ql", cfg: CauHinhHh) {
  let tien = 0;
  for (const m of [...cfg.gian_tiep.moc].sort((a, b) => a.tu - b.tu)) if (dsCn >= m.tu) tien = m[cap];
  return tien;
}

/* ---------------- PL05 mục A: tư vấn, trị liệu viên ---------------- */

export type NguoiDong = { nv: string; vai: string; tl: number };
export type DongDoanhSo = {
  dongId: string; cn: string; khachId: string | null; khachNguon: string | null; khachMoi: boolean;
  loai: string; dvId: string | null; goiId: string | null; giaRong: number | null; tt: number; nguoi: NguoiDong[];
};
export type GiaMuc = { km: number | null; toiThieu: number | null };
export type DanhMucGoi = { id: string; ten: string; km: number; goiId: string | null; dvId: string | null };
export type NguCanhGia = { dichVu: Map<string, GiaMuc>; goi: Map<string, GiaMuc>; danhMuc: DanhMucGoi[] };

/** Khoản tính hoa hồng bán hàng của một dòng. "chua_gia" = dịch vụ chưa nhập giá khuyến mại → tạm tính mức giá khuyến mại và đánh dấu để kế toán bổ sung. */
export type KhoanBan = "dv_km" | "dv_san" | "dv_duoi_tt" | "dv_chua_gia" | "goi_km" | "goi_duoi_km" | "my_pham" | "khach_moi_tkt";
export const NHAN_KHOAN_BAN: Record<KhoanBan, string> = {
  dv_km: "Dịch vụ từ giá khuyến mại", dv_san: "Dịch vụ giá sàn", dv_duoi_tt: "Dưới giá tối thiểu (không tính)", dv_chua_gia: "Dịch vụ chưa có giá KM (tạm tính 1,5%)",
  goi_km: "Gói, thẻ danh mục từ giá KM", goi_duoi_km: "Gói, thẻ danh mục dưới giá KM", my_pham: "Mỹ phẩm", khach_moi_tkt: "Khách mới tự khai thác (đơn đầu)",
};
const LECH = 1; // sai số làm tròn khi so giá (đồng)

/** Phân loại một dòng theo giá bán (chưa xét khách mới tự khai thác). */
export function phanLoaiDong(d: DongDoanhSo, g: NguCanhGia): { khoan: Exclude<KhoanBan, "khach_moi_tkt">; danhMuc?: string } {
  if (d.loai === "san_pham") return { khoan: "my_pham" };
  const dm = g.danhMuc.find((x) => (d.goiId && x.goiId === d.goiId) || (d.dvId && x.dvId === d.dvId));
  const gia = d.giaRong ?? 0;
  if (dm) {
    const toiThieu = d.goiId ? g.goi.get(d.goiId)?.toiThieu ?? null : d.dvId ? g.dichVu.get(d.dvId)?.toiThieu ?? null : null;
    if (toiThieu != null && gia < toiThieu - LECH) return { khoan: "dv_duoi_tt", danhMuc: dm.ten };
    return { khoan: gia >= dm.km - LECH ? "goi_km" : "goi_duoi_km", danhMuc: dm.ten };
  }
  const m = d.goiId ? g.goi.get(d.goiId) : d.dvId ? g.dichVu.get(d.dvId) : undefined;
  if (!m || m.km == null) return { khoan: "dv_chua_gia" };
  if (gia >= m.km - LECH) return { khoan: "dv_km" };
  if (m.toiThieu == null || gia >= m.toiThieu - LECH) return { khoan: "dv_san" };
  return { khoan: "dv_duoi_tt" };
}

export function tiLeKhoanBan(k: KhoanBan, cfg: CauHinhHh) {
  const t = cfg.tv;
  return { dv_km: t.km, dv_chua_gia: t.km, dv_san: t.san, dv_duoi_tt: 0, goi_km: t.goi_km, goi_duoi_km: t.goi_duoi_km, my_pham: t.my_pham, khach_moi_tkt: t.khach_moi_tu_khai_thac }[k];
}

/** Người được ghi doanh số của dòng: người tư vấn (nếu có), không có thì người bán. Mỗi dòng chỉ ghi một lần. */
export function nguoiChot(nguoi: NguoiDong[]) {
  const tv = nguoi.filter((x) => x.vai === "tu_van");
  return tv.length ? tv : nguoi.filter((x) => x.vai === "ban");
}

export type KetQuaBan = { ds: number; theoKhoan: Partial<Record<KhoanBan, { ds: number; hh: number }>>; hh: number };

/** Hoa hồng bán hàng (PL05 mục A) theo từng người, chưa gồm thưởng vượt chỉ tiêu. */
export function tinhHoaHongBan(dong: DongDoanhSo[], g: NguCanhGia, cfg: CauHinhHh): Map<string, KetQuaBan> {
  const kq = new Map<string, KetQuaBan>();
  for (const d of dong) {
    const pl = phanLoaiDong(d, g);
    const khoan: KhoanBan = d.khachMoi && d.khachNguon === "tu_van" ? "khach_moi_tkt" : pl.khoan;
    const tl = tiLeKhoanBan(khoan, cfg);
    for (const p of nguoiChot(d.nguoi)) {
      const phan = d.tt * p.tl / 100;
      const r = kq.get(p.nv) ?? { ds: 0, theoKhoan: {}, hh: 0 };
      const k = r.theoKhoan[khoan] ?? { ds: 0, hh: 0 };
      k.ds += phan; k.hh += phan * tl; r.theoKhoan[khoan] = k;
      r.ds += phan; r.hh += phan * tl;
      kq.set(p.nv, r);
    }
  }
  return kq;
}

export const thuongVuotChiTieu = (ds: number, chiTieu: number | null, cfg: CauHinhHh) => (chiTieu != null && chiTieu > 0 && ds > chiTieu ? (ds - chiTieu) * cfg.tv.vuot_chi_tieu : 0);

/** Doanh thu bán giá sàn (tính cả gói danh mục bán dưới giá KM) — dùng cho "Doanh số tính hoa hồng" của Giám đốc chi nhánh. */
export function doanhThuGiaSan(dong: DongDoanhSo[], g: NguCanhGia) {
  let s = 0;
  for (const d of dong) { const k = phanLoaiDong(d, g).khoan; if (k === "dv_san" || k === "goi_duoi_km") s += d.tt; }
  return s;
}

/* ---------------- PL05 mục B: telesale ---------------- */

/** Tên để so khớp: bỏ mã MSC đầu tên, bỏ dấu, chữ thường, gộp khoảng trắng. */
export const chuanTen = (t: string) => boDau(t.replace(/^MSC[.\-A-Z0-9]*\.\s*/, "")).toLowerCase().replace(/\s+/g, " ").trim();

export type HoaDonTien = { hoaDonId: string; khachId: string | null; ngay: string; tien: number };
export type LichDat = { khachId: string; ngay: string; nguoiTao: string };

/** Doanh số telesale mang về: hoá đơn của khách có lịch hẹn do telesale đặt trong `soNgay` ngày trước (hoặc cùng ngày) hoá đơn; nhiều lịch thì lấy lịch gần nhất. */
export function doanhSoTelesale(hd: HoaDonTien[], lich: LichDat[], telesale: { id: string; ten: string }[], soNgay: number) {
  const theoTen = new Map(telesale.map((t) => [chuanTen(t.ten), t.id]));
  const theoKhach = new Map<string, { ngay: string; nv: string }[]>();
  const chuaKhop = new Map<string, number>();
  for (const l of lich) {
    const nv = theoTen.get(chuanTen(l.nguoiTao));
    if (!nv) { chuaKhop.set(l.nguoiTao, (chuaKhop.get(l.nguoiTao) ?? 0) + 1); continue; }
    const ds = theoKhach.get(l.khachId) ?? [];
    ds.push({ ngay: l.ngay, nv }); theoKhach.set(l.khachId, ds);
  }
  const kq = new Map<string, { ds: number; soHd: number }>();
  for (const h of hd) {
    if (!h.khachId) continue;
    const tu = congNgayChuoi(h.ngay, -soNgay);
    const hop = (theoKhach.get(h.khachId) ?? []).filter((l) => l.ngay >= tu && l.ngay <= h.ngay).sort((a, b) => b.ngay.localeCompare(a.ngay))[0];
    if (!hop) continue;
    const r = kq.get(hop.nv) ?? { ds: 0, soHd: 0 };
    r.ds += h.tien; r.soHd += 1; kq.set(hop.nv, r);
  }
  return { theoNv: kq, nguoiDatChuaKhop: [...chuaKhop.entries()].sort((a, b) => b[1] - a[1]) };
}

function congNgayChuoi(d: string, n: number) {
  const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/* ---------------- PL06: quản lý ---------------- */

export function hoaHongGiamDoc(dsCn: number, dsGiaSan: number, cfg: CauHinhHh) {
  const dsTinh = Math.max(0, dsCn - cfg.gd.tru_gia_san * dsGiaSan);
  return { dsTinh, hh: luyTien(dsTinh, cfg.gd.bac) };
}

export function hoaHongMarketing(dsCn: number, dsMkt: number, chiPhiQc: number, cfg: CauHinhHh) {
  const tl = tiLeThang(dsCn, cfg.mkt.bac);
  const vuotQc = dsCn > 0 ? chiPhiQc > cfg.mkt.tran_qc * dsCn : chiPhiQc > 0;
  return { tl, vuotQc, hh: vuotQc ? 0 : dsMkt * tl };
}

/* ---------------- Phí trị liệu ---------------- */

export type DongDonGia = { id: string; doiTuong: "bac_si" | "tri_lieu"; stt: number; ten: string; dvt: string; donGia: number; dvIds: Set<string>; tenGhep: Set<string> };
export type CaDichVu = { dongId: string; ngay: string; maHd: string; khach: string | null; dvId: string | null; ten: string; soLuong: number; nguoi: { nv: string; tl: number }[]; loaiTru: string | null };
export type DongPhi = { ca: CaDichVu; nv: string; doiTuong: "bac_si" | "tri_lieu"; dong: DongDonGia | null; laPhuBs: boolean; soDv: number; donGia: number; tien: number };
export type KetQuaPhi = {
  dong: DongPhi[];
  chuaDonGia: { ca: CaDichVu; doiTuong: "bac_si" | "tri_lieu"; nv: string }[];
  nguoiKhac: CaDichVu[]; loaiTru: CaDichVu[];
};

export const khoaTen = (t: string) => t.trim().toLowerCase();

export function timDonGia(ds: DongDonGia[], doiTuong: "bac_si" | "tri_lieu", ca: Pick<CaDichVu, "dvId" | "ten">) {
  const k = khoaTen(ca.ten);
  return ds.find((d) => d.doiTuong === doiTuong && ((ca.dvId && d.dvIds.has(ca.dvId)) || d.tenGhep.has(k))) ?? null;
}

/** Mỗi ca chỉ tính cho người thực hiện chính. Có bác sĩ thực hiện chính: trị liệu viên hỗ trợ được phí phụ bác sĩ. Không có bác sĩ: trị liệu viên tính theo đơn giá PL02. */
export function tinhPhiTriLieu(ca: CaDichVu[], donGia: DongDonGia[], nhomNv: (nv: string) => string | null, cfg: CauHinhHh): KetQuaPhi {
  const kq: KetQuaPhi = { dong: [], chuaDonGia: [], nguoiKhac: [], loaiTru: [] };
  for (const c of ca) {
    if (c.loaiTru) { kq.loaiTru.push(c); continue; }
    const bs = c.nguoi.find((p) => nhomNv(p.nv) === "bac_si");
    const tlv = c.nguoi.find((p) => nhomNv(p.nv) === "tri_lieu");
    if (bs) {
      const d = timDonGia(donGia, "bac_si", c);
      if (d) kq.dong.push({ ca: c, nv: bs.nv, doiTuong: "bac_si", dong: d, laPhuBs: false, soDv: c.soLuong, donGia: d.donGia, tien: c.soLuong * d.donGia });
      else kq.chuaDonGia.push({ ca: c, doiTuong: "bac_si", nv: bs.nv });
      if (tlv) kq.dong.push({ ca: c, nv: tlv.nv, doiTuong: "tri_lieu", dong: null, laPhuBs: true, soDv: 1, donGia: cfg.phi_tl.phu_bs, tien: cfg.phi_tl.phu_bs });
    } else if (tlv) {
      const d = timDonGia(donGia, "tri_lieu", c);
      if (d) kq.dong.push({ ca: c, nv: tlv.nv, doiTuong: "tri_lieu", dong: d, laPhuBs: false, soDv: c.soLuong, donGia: d.donGia, tien: c.soLuong * d.donGia });
      else kq.chuaDonGia.push({ ca: c, doiTuong: "tri_lieu", nv: tlv.nv });
    } else kq.nguoiKhac.push(c);
  }
  return kq;
}

/** Trần chi tháng: tổng phí vượt trần thì mỗi người nhận = phí theo đơn giá × (trần ÷ tổng phí). */
export function heSoTran(tongPhi: number, dsDv: number, tiLeTran: number) {
  const tran = dsDv * tiLeTran;
  return { tran, heSo: tongPhi > tran && tongPhi > 0 ? tran / tongPhi : 1 };
}

/** Bảng tham khảo theo doanh số chi nhánh (sheet "Bảng tham khảo" của PL05/PL06) — giả định minh họa, không phải số thật. */
export type GiaDinhThamKhao = { giaSan: number; mkt: number; telesale: number; qc: number; dsTuVan: number; chiTieuTuVan: number; tuVanKm: number; tuVanGoiDungGia: number; dsTlv: number };
export function dongThamKhao(ds: number, gd: GiaDinhThamKhao, cfg: CauHinhHh) {
  const dsTv = ds * gd.dsTuVan, phanSan = 1 - gd.tuVanKm - gd.tuVanGoiDungGia;
  const tuVan = dsTv * (gd.tuVanKm * cfg.tv.km + gd.tuVanGoiDungGia * cfg.tv.goi_km + phanSan * cfg.tv.san) + thuongVuotChiTieu(dsTv, ds * gd.chiTieuTuVan, cfg);
  return {
    tuVan, triLieu: ds * gd.dsTlv * cfg.tv.km, telesale: ds * gd.telesale * tiLeThang(ds, cfg.telesale.bac),
    gianTiepNv: thuongGianTiep(ds, "nv", cfg), gianTiepQl: thuongGianTiep(ds, "ql", cfg),
    giamDoc: hoaHongGiamDoc(ds, ds * gd.giaSan, cfg).hh, marketing: hoaHongMarketing(ds, ds * gd.mkt, ds * gd.qc, cfg).hh,
  };
}

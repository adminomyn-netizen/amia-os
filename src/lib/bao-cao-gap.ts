import type { sb } from "@/lib/db";
import { tuyChon } from "@/lib/db";

/** Dữ liệu ba báo cáo kiểu SalonHero: theo chi nhánh, theo khách hàng, lịch sử dùng thẻ (hàm CSDL ở migration 0115).
 *  Dùng chung cho trang Báo cáo và nút Xuất Excel → số trên màn hình và trong tệp luôn khớp. */
type Db = ReturnType<typeof sb>;

export const HANG_KHACH = ["Thường", "Bạc", "Vàng", "Bạch kim", "Kim cương"] as const;
export const SO_DONG = [10, 20, 50, 100] as const;
export const soDongTrang = (s?: string) => (SO_DONG as readonly number[]).includes(Number(s)) ? Number(s) : 20;
export const soTrang = (s?: string) => Math.max(1, Math.floor(Number(s)) || 1);

export async function layTheoChiNhanh(db: Db, tu: string, den: string, cn?: string) {
  const { data, error } = await db.rpc("bc_theo_chi_nhanh", { p_tu: tu, p_den: den });
  if (error) throw new Error(error.message);
  const ds = (data ?? []).filter((r) => !cn || r.chi_nhanh_id === cn).map((r) => ({
    id: r.chi_nhanh_id, ten: r.ten, soNhanVien: Number(r.so_nhan_vien), soDon: Number(r.so_don), daThu: Number(r.da_thu), conNo: Number(r.con_no), doanhThu: Number(r.doanh_thu),
    tmBan: Number(r.tm_ban), tmNo: Number(r.tm_no), ckBan: Number(r.ck_ban), ckNo: Number(r.ck_no),
  }));
  const cong = (k: "daThu" | "conNo" | "tmBan" | "tmNo" | "ckBan" | "ckNo" | "doanhThu" | "soDon") => ds.reduce((s, r) => s + r[k], 0);
  return { ds, tong: { daThu: cong("daThu"), conNo: cong("conNo"), tmBan: cong("tmBan"), tmNo: cong("tmNo"), ckBan: cong("ckBan"), ckNo: cong("ckNo"), doanhThu: cong("doanhThu"), soDon: cong("soDon") } };
}

export type LocKhach = { tu: string; den: string; cn?: string; nhom?: string; hang?: string; q?: string; trang?: number; so?: number };
export async function layTheoKhachHang(db: Db, l: LocKhach, tatCa = false) {
  const hang = (HANG_KHACH as readonly string[]).includes(l.hang ?? "") ? l.hang : undefined;
  const { data, error } = await db.rpc("bc_theo_khach_hang", {
    p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_nhom: (l.nhom ? [l.nhom] : null) as unknown as string[], p_hang: tuyChon(hang), p_tim: tuyChon(l.q?.trim().slice(0, 80)),
    p_so: tatCa ? 20000 : (l.so ?? 20), p_tu_dong: tatCa ? 0 : ((l.trang ?? 1) - 1) * (l.so ?? 20),
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => ({ id: r.khach_id, ma: r.ma, ten: r.ho_ten, dienThoai: r.dien_thoai, hang: r.hang, laMoi: r.la_moi, soDon: Number(r.so_don), doanhThu: Number(r.doanh_thu), thucThu: Number(r.thuc_thu), thuNo: Number(r.thu_no), noMoi: Number(r.no_moi) }));
  const t = data?.[0];
  const tong = { dong: Number(t?.tong_dong ?? 0), khach: Number(t?.t_khach ?? 0), doanhThu: Number(t?.t_doanh_thu ?? 0), thucThu: Number(t?.t_thuc_thu ?? 0), thuNo: Number(t?.t_thu_no ?? 0),
    khachMoi: Number(t?.t_khach_moi ?? 0), dtMoi: Number(t?.t_dt_moi ?? 0), thuMoi: Number(t?.t_thu_moi ?? 0), khachCu: Number(t?.t_khach_cu ?? 0), dtCu: Number(t?.t_dt_cu ?? 0), thuCu: Number(t?.t_thu_cu ?? 0) };
  return { rows, tong };
}

export type LocThe = { tu: string; den: string; cn?: string; q?: string; tenThe?: string; loai?: string; trang?: number; so?: number };
export async function layLichSuDungThe(db: Db, l: LocThe, tatCa = false) {
  const { data, error } = await db.rpc("bc_lich_su_dung_the", {
    p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_tim: tuyChon(l.q?.trim().slice(0, 80)), p_ten_the: tuyChon(l.tenThe?.trim().slice(0, 80)), p_loai: tuyChon(l.loai === "lan" || l.loai === "tien" ? l.loai : undefined),
    p_so: tatCa ? 50000 : (l.so ?? 20), p_tu_dong: tatCa ? 0 : ((l.trang ?? 1) - 1) * (l.so ?? 20),
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r, i) => ({ khoa: `${r.hoa_don_id ?? "app"}-${r.ma_the ?? i}-${r.ngay}-${i}`, hoaDonId: r.hoa_don_id, maHd: r.ma_hd, ngay: r.ngay, khachId: r.khach_id, khach: r.khach, dienThoai: r.dien_thoai, chiNhanh: r.chi_nhanh, tenThe: r.ten_the, maThe: r.ma_the, loai: r.loai_the, soLan: Number(r.so_lan), tien: Number(r.tien) }));
  const t = data?.[0];
  return { rows, tong: { dong: Number(t?.tong_dong ?? 0), lan: Number(t?.tong_lan ?? 0), tien: Number(t?.tong_tien ?? 0) } };
}

/** Số SalonHero đọc trực tiếp (chỉ đọc) ngày 29/10/2026 cho tháng đã đóng 10/2025 — dùng cho bảng đối chiếu nhỏ dưới mỗi báo cáo. */
export const SH_MAU_GAP = {
  ky: { tu: "2025-10-01", den: "2025-10-31", nhan: "tháng 10/2025" },
  chiNhanh: [
    { ten: "AMIA Vinh", soDon: 743, daThu: 1033907000, conNo: 29900000, doanhThu: 1066014000 },
    { ten: "AMIA Đà Lạt", soDon: 197, daThu: 414480000, conNo: 26400000, doanhThu: 431660000 },
  ],
  khach: { chiNhanh: "AMIA Vinh", soKhach: 330, doanhThu: 1066014000, thucThu: 1036114000 },
  theDung: { soDong: 986, soLan: 1002, tien: 1046378837 },
};

/** Gom các dòng theo ngày thành tuần (thứ Hai–Chủ nhật) / tháng / quý — các cột đều là số cộng được. */
export type KieuGom = "ngay" | "tuan" | "thang" | "quy";
export const KIEU_GOM: { ma: KieuGom; ten: string }[] = [{ ma: "ngay", ten: "Ngày" }, { ma: "tuan", ten: "Tuần" }, { ma: "thang", ten: "Tháng" }, { ma: "quy", ten: "Quý" }];
export const kieuGom = (s?: string): KieuGom => (KIEU_GOM.some((k) => k.ma === s) ? (s as KieuGom) : "ngay");
const dmy = (iso: string) => iso.split("-").reverse().join("-");
function khoaKy(ngay: string, k: KieuGom): { khoa: string; nhan: string } {
  if (k === "ngay") return { khoa: ngay, nhan: dmy(ngay) };
  const d = new Date(`${ngay}T00:00:00Z`);
  if (k === "tuan") {
    const t2 = new Date(d); t2.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const cn = new Date(t2); cn.setUTCDate(t2.getUTCDate() + 6);
    const a = t2.toISOString().slice(0, 10), b = cn.toISOString().slice(0, 10);
    return { khoa: a, nhan: `${dmy(a)} → ${dmy(b)}` };
  }
  if (k === "thang") return { khoa: ngay.slice(0, 7), nhan: `${ngay.slice(5, 7)}-${ngay.slice(0, 4)}` };
  const q = Math.floor((Number(ngay.slice(5, 7)) - 1) / 3) + 1;
  return { khoa: `${ngay.slice(0, 4)}-Q${q}`, nhan: `Quý ${q}-${ngay.slice(0, 4)}` };
}
export function gomTheoKy<T extends { ngay: string }>(rows: T[], k: KieuGom, cong: (keyof T)[]): (T & { nhan: string })[] {
  const m = new Map<string, T & { nhan: string }>();
  for (const r of rows) {
    const { khoa, nhan } = khoaKy(r.ngay, k);
    const cu = m.get(khoa);
    if (!cu) { m.set(khoa, { ...r, nhan }); continue; }
    for (const c of cong) (cu[c] as number) = Number(cu[c]) + Number(r[c]);
  }
  return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([, v]) => v);
}

export async function layDoanhThuChiSo(db: Db, tu: string, den: string, cn?: string) {
  const { data, error } = await db.rpc("bc_doanh_thu_chi_so", { p_tu: tu, p_den: den, p_cn: tuyChon(cn) });
  if (error) throw new Error(error.message);
  const r = data?.[0];
  const n = (v: unknown) => Number(v ?? 0);
  return { soDon: n(r?.so_don), banMoi: n(r?.ban_moi), thuNo: n(r?.thu_no), tmBan: n(r?.tm_ban), tmNo: n(r?.tm_no), qtBan: n(r?.qt_ban), qtNo: n(r?.qt_no), ckBan: n(r?.ck_ban), ckNo: n(r?.ck_no),
    noMoiChuaThu: n(r?.no_moi_chua_thu), thuNoTrongKy: n(r?.thu_no_trong_ky), thuNoNgoaiKy: n(r?.thu_no_ngoai_ky), truThe: n(r?.tru_the_tien), soVoucher: n(r?.so_voucher), truVoucher: n(r?.tru_voucher), tip: n(r?.tip), vat: n(r?.vat) };
}

export async function layNhanVienSh(db: Db, tu: string, den: string, cn?: string) {
  const { data, error } = await db.rpc("bc_nhan_vien_sh", { p_tu: tu, p_den: den, p_cn: tuyChon(cn) });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const x = { id: r.nhan_vien_id, ten: r.ho_ten, soPhucVu: Number(r.so_phuc_vu), dsDichVu: Number(r.ds_dich_vu), soSanPham: Number(r.so_san_pham), dsSanPham: Number(r.ds_san_pham), soThe: Number(r.so_the), dsThe: Number(r.ds_the), soTuVan: Number(r.so_tu_van), dsTuVan: Number(r.ds_tu_van) };
    return { ...x, tong: x.dsDichVu + x.dsSanPham + x.dsThe + x.dsTuVan };
  }).sort((a, b) => b.tong - a.tong);
}

export const LOAI_MUC = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", ban_the: "Bán thẻ", dung_the: "Dùng thẻ" } as const;
export type LoaiMuc = keyof typeof LOAI_MUC;
/** Bộ lọc loại ở đầu trang (như SalonHero): Dịch vụ & sản phẩm / Dịch vụ / Sản phẩm / Thẻ. */
export const LOC_LOAI: { ma: string; ten: string; gom: LoaiMuc[] }[] = [
  { ma: "", ten: "Dịch vụ & sản phẩm", gom: ["dich_vu", "san_pham", "ban_the", "dung_the"] },
  { ma: "dv", ten: "Dịch vụ", gom: ["dich_vu", "ban_the", "dung_the"] },
  { ma: "sp", ten: "Sản phẩm", gom: ["san_pham"] },
  { ma: "the", ten: "Thẻ", gom: ["ban_the", "dung_the"] },
];
export async function laySanPhamDichVu(db: Db, tu: string, den: string, cn?: string) {
  const { data, error } = await db.rpc("bc_san_pham_dich_vu", { p_tu: tu, p_den: den, p_cn: tuyChon(cn) });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ loai: r.loai as LoaiMuc, ma: r.ma, ten: r.loai === "ban_the" ? `Bán ${r.ten}` : r.loai === "dung_the" ? `Sử dụng ${r.ten}` : r.ten, soLuong: Number(r.so_luong), truoc: Number(r.truoc), sau: Number(r.sau), truThe: Number(r.tru_the), thucNhan: Number(r.thuc_nhan) }));
}

export const PHUONG_THUC_VN: Record<string, string> = { tien_mat: "Tiền mặt", chuyen_khoan: "Chuyển khoản", quet_the: "Quẹt thẻ", the_tien: "Thẻ tiền" };
export async function layCacLanTraNo(db: Db, l: { tu: string; den: string; cn?: string; q?: string; trang?: number; so?: number }, tatCa = false) {
  const { data, error } = await db.rpc("bc_cac_lan_tra_no", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_tim: tuyChon(l.q?.trim().slice(0, 80)), p_so: tatCa ? 20000 : (l.so ?? 20), p_tu_dong: tatCa ? 0 : ((l.trang ?? 1) - 1) * (l.so ?? 20) });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => ({ id: r.thanh_toan_id, ngay: r.ngay, hoaDonId: r.hoa_don_id, maHd: r.ma_hd, khachId: r.khach_id, khach: r.khach, dienThoai: r.dien_thoai, chiNhanh: r.chi_nhanh, tongHd: Number(r.tong_hd), soTien: Number(r.so_tien), phuongThuc: PHUONG_THUC_VN[r.phuong_thuc] ?? r.phuong_thuc, nguoiThu: r.nguoi_thu }));
  return { rows, tong: { dong: Number(data?.[0]?.tong_dong ?? 0), tien: Number(data?.[0]?.tong_tien ?? 0) } };
}

/** Thống kê sử dụng dịch vụ theo mã thẻ (kiểu SalonHero): gom dòng hoá đơn thành (phân loại, mã, tên); mỗi dòng kèm danh sách khách. Giới hạn 93 ngày (đọc qua API, không có hàm riêng). */
export type KhachDung = { khachId: string | null; ten: string; dienThoai: string | null; maHd: string; ngay: string; soLuong: number };
export type DongDungDichVu = { khoa: string; phanLoai: "dung" | "ban"; ma: string; ten: string; soLuong: number; khach: KhachDung[] };
export async function layThongKeDungDichVu(db: Db, tu: string, den: string, cn?: string, q?: string) {
  const dong: { id: string; loai: string; ten: string; so_luong: number; the_khach_sh_id: number | null; dich_vu_id: string | null; goi_id: string | null; hd: { id: string; ma: string; sh_ma: string | null; ngay_hd: string; khach_id: string | null } }[] = [];
  for (let i = 0; ; i += 1000) {
    let qr = db.from("hoa_don_dong")
      .select("id, loai, ten, so_luong, the_khach_sh_id, dich_vu_id, goi_id, hd:hoa_don!inner(id, ma, sh_ma, ngay_hd, khach_id)")
      .eq("hd.trang_thai", "hoan_thanh").eq("hd.la_so_du_dau", false).gte("hd.ngay_hd", tu).lte("hd.ngay_hd", den)
      .or("the_khach_sh_id.not.is.null,loai.eq.goi_the").order("id").range(i, i + 999);
    if (cn) qr = qr.eq("hd.chi_nhanh_id", cn);
    const { data, error } = await qr;
    if (error) throw new Error(error.message);
    dong.push(...((data ?? []) as unknown as typeof dong));
    if (!data || data.length < 1000) break;
  }
  const shIds = [...new Set(dong.map((d) => d.the_khach_sh_id).filter((x): x is number => x != null))];
  const theMa = new Map<number, string>();
  for (let i = 0; i < shIds.length; i += 300) {
    const { data } = await db.from("the_khach").select("sh_id, ma").in("sh_id", shIds.slice(i, i + 300));
    for (const t of data ?? []) if (t.sh_id != null) theMa.set(t.sh_id, t.ma);
  }
  const [{ data: dvs }, { data: gois }] = await Promise.all([db.from("dich_vu").select("id, ma"), db.from("goi_the").select("id, ma")]);
  const maDv = new Map((dvs ?? []).map((d) => [d.id, d.ma])), maGoi = new Map((gois ?? []).map((g) => [g.id, g.ma]));
  const kIds = [...new Set(dong.map((d) => d.hd.khach_id).filter((x): x is string => !!x))];
  const kh = new Map<string, { ho_ten: string; dien_thoai: string | null }>();
  for (let i = 0; i < kIds.length; i += 300) {
    const { data } = await db.from("khach_hang").select("id, ho_ten, dien_thoai").in("id", kIds.slice(i, i + 300));
    for (const k of data ?? []) kh.set(k.id, k);
  }
  const m = new Map<string, DongDungDichVu>();
  for (const d of dong) {
    const phanLoai = d.loai === "goi_the" ? "ban" : "dung";
    const ma = phanLoai === "ban" ? (maGoi.get(d.goi_id ?? "") ?? "") : [maDv.get(d.dich_vu_id ?? "") ?? "", d.the_khach_sh_id != null ? theMa.get(d.the_khach_sh_id) ?? "" : ""].filter(Boolean).join(" - ");
    const khoa = `${phanLoai}|${ma}|${d.ten}`;
    const r = m.get(khoa) ?? { khoa, phanLoai, ma, ten: d.ten, soLuong: 0, khach: [] };
    r.soLuong += d.so_luong;
    const k = d.hd.khach_id ? kh.get(d.hd.khach_id) : undefined;
    r.khach.push({ khachId: d.hd.khach_id, ten: k?.ho_ten ?? "Khách lẻ", dienThoai: k?.dien_thoai ?? null, maHd: d.hd.sh_ma ?? d.hd.ma, ngay: d.hd.ngay_hd, soLuong: d.so_luong });
    m.set(khoa, r);
  }
  const tuKhoa = (q ?? "").trim().toLowerCase();
  return [...m.values()].filter((r) => !tuKhoa || r.ma.toLowerCase().includes(tuKhoa) || r.ten.toLowerCase().includes(tuKhoa)).sort((a, b) => b.soLuong - a.soLuong || a.ten.localeCompare(b.ten, "vi"));
}

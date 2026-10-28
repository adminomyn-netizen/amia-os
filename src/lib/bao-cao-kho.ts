import type { sb } from "@/lib/db";
import { tuyChon } from "@/lib/db";

/** Dữ liệu sáu báo cáo kho kiểu SalonHero (hàm CSDL ở migration 0121). Dùng chung cho trang Báo cáo và nút Xuất Excel → số trên màn hình và trong tệp luôn khớp.
 *  Mọi hàm chỉ ĐỌC, có phân trang (so, trang) và trả kèm tổng của toàn bộ kết quả. `tatCa` = lấy tối đa 20.000 dòng cho Excel. */
type Db = ReturnType<typeof sb>;
export const SO_DONG_KHO = [10, 25, 50, 100] as const;
export const soDongKho = (s?: string) => ((SO_DONG_KHO as readonly number[]).includes(Number(s)) ? Number(s) : 10);
const cat = (q?: string) => tuyChon(q?.trim().slice(0, 80));
const phan = (tatCa: boolean, so: number, trang: number) => ({ p_so: tatCa ? 20000 : so, p_tu_dong: tatCa ? 0 : (Math.max(1, trang) - 1) * so });
const n = (v: unknown) => Number(v ?? 0);

/** Ô "Phân loại" của báo cáo xuất kho — đúng 11 nhãn và thứ tự của SalonHero. */
export const LOAI_XUAT = [
  { gia_tri: "tieu_hao", nhan: "Xuất tiêu hao" }, { gia_tri: "noi_bo", nhan: "Xuất sang kho nội bộ" }, { gia_tri: "tra_ncc", nhan: "Xuất trả hàng NCC" }, { gia_tri: "huy", nhan: "Xuất huỷ vì hỏng hóc" },
  { gia_tri: "cho_tang", nhan: "Xuất cho/tặng" }, { gia_tri: "dong_goi", nhan: "Xuất đóng gói" }, { gia_tri: "dao_tao", nhan: "Xuất đào tạo" }, { gia_tri: "ban_hoc_vien", nhan: "Xuất bán học viên" },
  { gia_tri: "svc", nhan: "Xuất hàng SVC" }, { gia_tri: "can_bang", nhan: "Xuất cân bằng kho" }, { gia_tri: "khac", nhan: "Xuất khác" },
];
export const NHAN_LOAI_XUAT: Record<string, string> = Object.fromEntries(LOAI_XUAT.map((l) => [l.gia_tri, l.nhan]));
export const NGUON_NHAP = [{ gia_tri: "tat_ca", nhan: "Tất cả các nguồn" }, { gia_tri: "cn", nhan: "Các chi nhánh" }, { gia_tri: "ncc", nhan: "Nhà cung cấp" }];
/** Mặc định của SalonHero: Nhập từ = Nhà cung cấp. */
export const nguonNhap = (s?: string) => (s === "tat_ca" ? "" : s === "cn" ? "cn" : "ncc");

export async function layNhapXuatKho(db: Db, l: { tu: string; den: string; cn?: string; nhom?: string; q?: string; trang?: number; so?: number }, tatCa = false) {
  const so = l.so ?? 10;
  const { data, error } = await db.rpc("bc_kho_nhap_xuat", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_nhom: cat(l.nhom), p_tim: cat(l.q), ...phan(tatCa, so, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return {
    rows: d.map((r) => ({ id: r.san_pham_id, ma: r.ma, ten: r.ten, nhom: r.nhom, giaBan: n(r.gia_ban), giaVon: n(r.gia_von), giaNhapTb: n(r.gia_nhap_tb), dau: n(r.dau), nhap: n(r.nhap), xuat: n(r.xuat), nhapCd: n(r.nhap_cd), xuatCd: n(r.xuat_cd), cuoi: n(r.cuoi) })),
    tong: { dong: n(d[0]?.tong_dong), dau: n(d[0]?.tong_dau), cuoi: n(d[0]?.tong_cuoi), nhap: n(d[0]?.tong_nhap), xuat: n(d[0]?.tong_xuat) },
  };
}

export async function layNhapKho(db: Db, l: { tu: string; den: string; cn?: string; nguon?: string; ncc?: string; q?: string; tong?: boolean; trang?: number }, tatCa = false) {
  const { data, error } = await db.rpc("bc_kho_nhap", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_nguon: nguonNhap(l.nguon) || (undefined as unknown as string), p_ncc: tuyChon(l.ncc), p_tim: cat(l.q), p_tong: !!l.tong, ...phan(tatCa, 10, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return {
    rows: d.map((r) => ({ khoa: r.khoa, ma: r.ma, ten: r.ten, nhom: r.nhom, lo: r.lo, han: r.han, maPhieu: r.ma_phieu, luc: r.thoi_gian, ncc: r.ncc, giaNhap: n(r.gia_nhap), soLuong: n(r.so_luong), giamGia: n(r.giam_gia), tongTien: n(r.tong_tien) })),
    tong: { dong: n(d[0]?.tong_dong), chiPhi: n(d[0]?.tong_chi_phi) },
  };
}

export async function layXuatKho(db: Db, l: { tu: string; den: string; cn?: string; loai?: string; q?: string; tong?: boolean; trang?: number }, tatCa = false) {
  const loai = l.loai && NHAN_LOAI_XUAT[l.loai] ? l.loai : undefined;
  const { data, error } = await db.rpc("bc_kho_xuat", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_loai: tuyChon(loai), p_tim: cat(l.q), p_tong: !!l.tong, ...phan(tatCa, 10, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return {
    rows: d.map((r) => ({ khoa: r.khoa, ma: r.ma, ten: r.ten, nhom: r.nhom, lo: r.lo, han: r.han, maPhieu: r.ma_phieu, luc: r.thoi_gian, nguoiNhan: r.nguoi_nhan, phanLoai: r.phan_loai ? (NHAN_LOAI_XUAT[r.phan_loai] ?? r.phan_loai) : null, giaVon: n(r.gia_von), giaTb: n(r.gia_tb), soLuong: n(r.so_luong) })),
    tong: { dong: n(d[0]?.tong_dong) },
  };
}

export async function layBanSanPham(db: Db, l: { tu: string; den: string; cn?: string; q?: string; tong?: boolean; trang?: number }, tatCa = false) {
  const { data, error } = await db.rpc("bc_ban_san_pham", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_tim: cat(l.q), p_tong: !!l.tong, ...phan(tatCa, 10, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return {
    rows: d.map((r) => ({ khoa: r.khoa, ma: r.ma, ten: r.ten, maHd: r.ma_hd, hoaDonId: r.hoa_don_id, luc: r.thoi_gian, gia1sp: n(r.gia_1sp), soLuong: n(r.so_luong), giaSau: n(r.gia_sau), doanhThu: n(r.doanh_thu), giaVon: n(r.gia_von), loiNhuan: n(r.loi_nhuan) })),
    tong: { dong: n(d[0]?.tong_dong), doanhThu: n(d[0]?.tong_doanh_thu), nhap: n(d[0]?.tong_nhap), loiNhuan: n(d[0]?.tong_doanh_thu) - n(d[0]?.tong_nhap) },
  };
}

/** Hai nhóm nút chọn một của SalonHero: Còn tồn / Sắp hết / Hết hàng và Còn hạn / Hết hạn (mặc định Còn tồn + Còn hạn). */
export const TINH_TRANG_LO = [{ ma: "con_ton", ten: "Còn tồn" }, { ma: "sap_het", ten: "Sắp hết" }, { ma: "het_hang", ten: "Hết hàng" }];
export const HAN_LO = [{ ma: "con_han", ten: "Còn hạn" }, { ma: "het_han", ten: "Hết hạn" }];
export const tinhTrangLo = (s?: string) => (TINH_TRANG_LO.some((x) => x.ma === s) ? s! : "con_ton");
export const hanLo = (s?: string) => (HAN_LO.some((x) => x.ma === s) ? s! : "con_han");

export async function layTonTheoLo(db: Db, l: { cn?: string; q?: string; tt?: string; han?: string; trang?: number }, tatCa = false) {
  const { data, error } = await db.rpc("bc_ton_theo_lo", { p_cn: tuyChon(l.cn), p_tim: cat(l.q), p_tt: tinhTrangLo(l.tt), p_han: hanLo(l.han), ...phan(tatCa, 10, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return { rows: d.map((r) => ({ khoa: r.khoa, ma: r.ma, ten: r.ten, chiNhanh: r.chi_nhanh, lo: r.lo, han: r.han, nhap: n(r.nhap), xuat: n(r.xuat), ton: n(r.ton) })), tong: { dong: n(d[0]?.tong_dong) } };
}

export async function layChiPhiDichVu(db: Db, l: { tu: string; den: string; cn?: string; dv?: string; nv?: string; q?: string; trang?: number }, tatCa = false) {
  const { data, error } = await db.rpc("bc_chi_phi_dich_vu", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_dv: tuyChon(l.dv), p_nv: tuyChon(l.nv), p_tim: cat(l.q), ...phan(tatCa, 10, l.trang ?? 1) });
  if (error) throw new Error(error.message);
  const d = data ?? [];
  return {
    rows: d.map((r) => ({ id: r.san_pham_id, cnId: r.chi_nhanh_id, ma: r.ma, ten: r.ten, chiNhanh: r.chi_nhanh, soLuong: n(r.so_luong), soLan: n(r.so_lan), chiPhi: n(r.chi_phi) })),
    tong: { dong: n(d[0]?.tong_dong), chiPhi: n(d[0]?.tong_chi_phi) },
  };
}

export async function layChiPhiDichVuCt(db: Db, l: { tu: string; den: string; cn?: string; sp: string; dv?: string; nv?: string }) {
  const { data, error } = await db.rpc("bc_chi_phi_dich_vu_ct", { p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_sp: l.sp, p_dv: tuyChon(l.dv), p_nv: tuyChon(l.nv) });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.phieu_id, ma: r.ma, ngay: r.ngay, dichVu: r.dich_vu, nguoiLam: r.nguoi_lam, soLuong: n(r.so_luong), chiPhi: n(r.chi_phi) }));
}

import type { Database } from "@/lib/supabase/database.types";
import type { sb } from "@/lib/db";
import { congNgay } from "@/lib/dinh-dang";

/** Dữ liệu dùng chung cho trang Báo cáo và nút Xuất Excel (cùng một nguồn → số trên màn hình và trong tệp luôn khớp). */
type Db = ReturnType<typeof sb>;

export type NhomKy = "tong" | "thang" | "ngay";
export const NHOM_KY: { gia_tri: NhomKy; nhan: string }[] = [{ gia_tri: "tong", nhan: "Cả kỳ" }, { gia_tri: "thang", nhan: "Theo tháng" }, { gia_tri: "ngay", nhan: "Theo ngày" }];

/** Nhóm theo ngày chỉ cho khoảng ≤ 93 ngày (API trả tối đa 1.000 dòng/lần); dài hơn thì tự gom theo tháng. */
export function chonNhom(nhom: string | undefined, tu: string, den: string, macDinh: NhomKy): { nhom: NhomKy; doiTuNgay: boolean } {
  const n: NhomKy = nhom === "tong" || nhom === "thang" || nhom === "ngay" ? nhom : macDinh;
  if (n === "ngay" && congNgay(tu, 93) < den) return { nhom: "thang", doiTuNgay: true };
  return { nhom: n, doiTuNgay: false };
}

export const TRANG_THAI_LICH: Record<string, string> = {
  chua_xac_nhan: "Chưa xác nhận", da_xac_nhan: "Đã xác nhận", cho_phuc_vu: "Đã đến, chờ phục vụ", dang_phuc_vu: "Đang phục vụ",
  hoan_thanh: "Hoàn thành (khách đến)", huy: "Huỷ", khong_den: "Không đến",
};
/** Nguồn đặt lịch (mã SalonHero viết hoa + mã của app). */
export const NGUON_LICH: Record<string, string> = {
  PHONE: "Điện thoại", MESSENGER: "Messenger", WEB: "Website", EVENT: "Sự kiện", GOOGLE: "Google", AD1: "Quảng cáo", REPEAT: "Khách đặt lại",
  REFERRAL: "Giới thiệu", WALKIN: "Khách vãng lai", IOS: "Ứng dụng iOS", ANDROID: "Ứng dụng Android", OTHER: "Khác", KHAC: "Không ghi nguồn",
  dien_thoai: "Điện thoại", zalo: "Zalo", facebook: "Facebook", truc_tiep: "Trực tiếp", website: "Website", khac: "Khác",
};
export const tenNguon = (k: string) => NGUON_LICH[k] ?? k;
/** Kỳ "2025-10-01" → "10/2025" (tháng) hoặc "01/10/2025" (ngày). */
export const tenKy = (ky: string, nhom: NhomKy) => (nhom === "thang" ? `${ky.slice(5, 7)}/${ky.slice(0, 4)}` : ky.split("-").reverse().join("/"));
export const tiLe = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "—");

export type DongThuNgan = Database["public"]["Functions"]["bc_thu_ngan"]["Returns"][number];
export type DongDatLich = Database["public"]["Functions"]["bc_dat_lich"]["Returns"][number];
export type DongDungDv = Database["public"]["Functions"]["bc_dung_dich_vu"]["Returns"][number];

export async function layThuNgan(db: Db, tu: string, den: string, cn: string | undefined, nhom: NhomKy) {
  const { data, error } = await db.rpc("bc_thu_ngan", { p_tu: tu, p_den: den, p_cn: cn as string, p_nhom: nhom });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, so_don: Number(r.so_don), doanh_so: Number(r.doanh_so), tru_the_tien: Number(r.tru_the_tien), doanh_thu: Number(r.doanh_thu), con_no: Number(r.con_no), da_thu: Number(r.da_thu) }));
}

export async function layDatLich(db: Db, tu: string, den: string, cn: string | undefined, nhom: NhomKy) {
  const { data, error } = await db.rpc("bc_dat_lich", { p_tu: tu, p_den: den, p_cn: cn as string, p_nhom: nhom === "tong" ? "thang" : nhom });
  if (error) throw new Error(error.message);
  const ds = (data ?? []).map((r) => ({ ...r, so_lich: Number(r.so_lich), hoan_thanh: Number(r.hoan_thanh), huy: Number(r.huy), khong_den: Number(r.khong_den), chua_den: Number(r.chua_den) }));
  const theo = (c: string) => ds.filter((r) => r.chieu === c);
  const tong = theo("tong")[0] ?? { chieu: "tong", khoa: "", nhan: "Tổng", so_lich: 0, hoan_thanh: 0, huy: 0, khong_den: 0, chua_den: 0 };
  return { tong, trangThai: theo("trang_thai"), nguon: theo("nguon"), nhanVien: theo("nhan_vien"), chiNhanh: theo("chi_nhanh"), ky: theo("ky").sort((a, b) => a.khoa.localeCompare(b.khoa)) };
}

export async function layDungDichVu(db: Db, tu: string, den: string, cn: string | undefined, nhom: NhomKy) {
  const { data, error } = await db.rpc("bc_dung_dich_vu", { p_tu: tu, p_den: den, p_cn: cn as string, p_nhom: nhom === "tong" ? "thang" : nhom });
  if (error) throw new Error(error.message);
  const ds = (data ?? []).map((r) => ({ ...r, luot_the: Number(r.luot_the), luot_tien: Number(r.luot_tien), doanh_so: Number(r.doanh_so), gia_tri_the: Number(r.gia_tri_the) }));
  const theo = (c: string) => ds.filter((r) => r.chieu === c);
  const tong = theo("tong")[0] ?? { chieu: "tong", khoa: "", nhan: "Tổng", luot_the: 0, luot_tien: 0, doanh_so: 0, gia_tri_the: 0 };
  return { tong, dichVu: theo("dich_vu"), nhanVien: theo("nhan_vien"), chiNhanh: theo("chi_nhanh"), ky: theo("ky").sort((a, b) => a.khoa.localeCompare(b.khoa)) };
}

/** Số SalonHero đọc trực tiếp (chỉ đọc) ngày 28/10/2026 cho kỳ mẫu tháng 10/2025 — dùng cho bảng đối chiếu nhỏ dưới mỗi báo cáo.
 *  Sau migration 0071 + 0086 app khớp SalonHero (doanh thu gồm VAT, trừ phần trả bằng thẻ). */
export const SH_MAU = {
  ky: { tu: "2025-10-01", den: "2025-10-31", nhan: "tháng 10/2025" },
  thuNgan: [
    { ten: "Nguyễn Thị Vân Anh", so_don: 649, doanh_thu: 709262000, con_no: 26900000 },
    { ten: "Trần Diệu Thuý", so_don: 60, doanh_thu: 301500000, con_no: 8500000 },
    { ten: "Nguyễn Thị Trà", so_don: 73, doanh_thu: 278802000, con_no: 3000000 },
    { ten: "Nguyễn Thị Hoài Nam", so_don: 106, doanh_thu: 129170000, con_no: 17900000 },
    { ten: "Lê Thị Quỳnh Chi", so_don: 20, doanh_thu: 53040000, con_no: 0 },
    { ten: "Tư Vấn Amia Vinh", so_don: 2, doanh_thu: 25900000, con_no: 0 },
    { ten: "Trị liệu AĐL", so_don: 30, doanh_thu: 0, con_no: 0 },
  ],
  datLich: { tong: 1020, hoan_thanh: 743, huy: 84, da_xac_nhan: 142, chua_xac_nhan: 51, PHONE: 969, MESSENGER: 32 },
  dungDichVu: { luot_the: 988, luot_tien: 1, doanh_so_tien: 1200000 },
};

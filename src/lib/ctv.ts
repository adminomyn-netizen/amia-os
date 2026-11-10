/** CTV / giới thiệu (migration 0314): nhãn, link đặt lịch có REF, kiểm SĐT di động làm mã REF. Dùng chung máy chủ + trình duyệt (không import máy chủ). */

import { congNgay, homNayHCM } from "./dinh-dang";

export const TT_RUT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_xu_ly: { ten: "Cần xử lý", kieu: "cho" }, dang_duyet_chi: { ten: "Đang duyệt chi", kieu: "cho" }, da_chi: { ten: "Đã chi", kieu: "tot" }, tu_choi: { ten: "Từ chối", kieu: "loi" },
};
export const HINH_THUC_RUT: Record<string, string> = { chuyen_khoan: "Chuyển khoản", tien_mat: "Tiền mặt" };
export const LOAI_BT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  ghi_nhan: { ten: "Ghi nhận", kieu: "tot" }, dieu_chinh: { ten: "Điều chỉnh", kieu: "cho" }, dao: { ten: "Đảo (huỷ / hoàn)", kieu: "loi" },
};
export const LOAI_MUC_HH: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Thẻ / liệu trình" };

/** Chuẩn hoá SĐT di động làm mã REF (giống chuan_ma_ref trong DB): 0[35789] + 8 số; 84… → 0…; không hợp lệ → null. */
export function chuanMaRef(s: string | null | undefined): string | null {
  let x = (s ?? "").replace(/\D/g, "");
  if (/^84\d{9}$/.test(x)) x = `0${x.slice(2)}`;
  return /^0(3|5|7|8|9)\d{8}$/.test(x) ? x : null;
}

/** Link đặt lịch của nguồn: /dat-lich?ref=<SĐT>. */
export const linkDatLich = (goc: string, ref: string) => `${goc.replace(/\/$/, "")}/dat-lich?ref=${encodeURIComponent(ref)}`;

// ── Cổng CTV (M5, migration 0317) ─────────────────────────────────────────

export const KY_CTV = [{ ma: "thang-nay", ten: "Tháng này" }, { ma: "thang-truoc", ten: "Tháng trước" }, { ma: "3-thang", ten: "3 tháng" }, { ma: "tuy-chon", ten: "Tuỳ chọn" }];
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
/** Kỳ của cổng CTV → [từ, đến] (giờ VN). Tuỳ chọn: tối đa 400 ngày, sai thì về tháng này. */
export function kyCtv(ky: string | undefined, tu?: string, den?: string): { ky: string; tu: string; den: string } {
  const homNay = homNayHCM(), dauThang = `${homNay.slice(0, 7)}-01`;
  if (ky === "thang-truoc") { const cuoi = congNgay(dauThang, -1); return { ky, tu: `${cuoi.slice(0, 7)}-01`, den: cuoi }; }
  if (ky === "3-thang") { const t = new Date(`${dauThang}T00:00:00Z`); t.setUTCMonth(t.getUTCMonth() - 2); return { ky, tu: t.toISOString().slice(0, 10), den: homNay }; }
  if (ky === "tuy-chon" && tu && den && NGAY.test(tu) && NGAY.test(den) && tu <= den && (Date.parse(den) - Date.parse(tu)) / 86400000 <= 400) return { ky, tu, den };
  return { ky: "thang-nay", tu: dauThang, den: homNay };
}
export const TINH_TRANG_GT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_den: { ten: "Chưa đến", kieu: "cho" }, da_den: { ten: "Đã đến", kieu: "tot" }, khong_den: { ten: "Không đến", kieu: "loi" }, da_huy: { ten: "Đã huỷ", kieu: "tram" }, hoa_don: { ten: "Đã có hoá đơn", kieu: "tot" },
};
export const LOC_GT = [{ ma: "", ten: "Tất cả" }, { ma: "da_den", ten: "Đã đến" }, { ma: "khong_den", ten: "Không đến" }, { ma: "da_huy", ten: "Đã huỷ" }, { ma: "co_hoa_don", ten: "Đã có hoá đơn" }];
export const TT_THANH_TOAN_HH: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  da_tt: { ten: "Đã thanh toán", kieu: "tot" }, mot_phan: { ten: "Thanh toán một phần", kieu: "cho" }, chua_tt: { ten: "Chưa thanh toán", kieu: "tram" },
};
export const TT_KHIEU_NAI: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  moi: { ten: "Mới", kieu: "cho" }, dang_xu_ly: { ten: "Đang xử lý", kieu: "cho" }, da_xu_ly: { ten: "Đã xử lý", kieu: "tot" }, tu_choi: { ten: "Từ chối", kieu: "loi" },
};
/** Che email khi hiện lại cho chính chủ: "lan.nguyen@gmail.com" → "la***@gmail.com". */
export const cheEmail = (e: string | null | undefined) => {
  if (!e || !e.includes("@")) return "";
  const [a, b] = e.split("@");
  return `${a.slice(0, Math.min(2, a.length))}***@${b}`;
};

/** CTV / giới thiệu (migration 0314): nhãn, link đặt lịch có REF, kiểm SĐT di động làm mã REF. Dùng chung máy chủ + trình duyệt (không import máy chủ). */

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

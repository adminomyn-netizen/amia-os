export const LOAI_DX = { mua_sam: "Mua sắm", thanh_toan: "Thanh toán", tam_ung: "Tạm ứng lương", hoan_ung: "Hoàn ứng", hoan_khach: "Hoàn trả khách" } as const;
export const CHUC_DANH_TC: Record<string, string> = {
  ke_toan_truong: "Kế toán trưởng", ke_toan_thu: "Kế toán thu", ke_toan_chi: "Kế toán chi", ke_toan_vat_tu: "Kế toán vật tư", thu_quy: "Thủ quỹ",
  giam_doc_cong_ty: "Giám đốc công ty", giam_doc_chi_nhanh: "Giám đốc chi nhánh",
};
/** Hạn mức duyệt hiệu lực: đã đặt thì theo số đã đặt; chưa đặt thì Kỹ thuật/Quản lý không giới hạn, vai trò khác không có quyền duyệt khoản tiền. */
export const hanMucHieuLuc = (vaiTro: string, hanMuc: number | null | undefined) => (hanMuc != null ? Number(hanMuc) : vaiTro === "chu" || vaiTro === "ky_thuat" || vaiTro === "quan_ly" ? Infinity : 0);
export const TT_DX: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, da_thuc_hien: { ten: "Đã thực hiện", kieu: "tot" },
  tu_choi: { ten: "Từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const TT_VIEC: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  moi: { ten: "Mới giao", kieu: "cho" }, dang_lam: { ten: "Đang làm", kieu: "cho" }, xong: { ten: "Hoàn thành", kieu: "tot" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const UU_TIEN: Record<string, string> = { thap: "Thấp", thuong: "Thường", cao: "Cao" };

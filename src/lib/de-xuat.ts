export const LOAI_DX = { mua_sam: "Mua sắm", thanh_toan: "Thanh toán", tam_ung: "Tạm ứng lương" } as const;
export const TT_DX: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, da_thuc_hien: { ten: "Đã thực hiện", kieu: "tot" },
  tu_choi: { ten: "Từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const TT_VIEC: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  moi: { ten: "Mới giao", kieu: "cho" }, dang_lam: { ten: "Đang làm", kieu: "cho" }, xong: { ten: "Hoàn thành", kieu: "tot" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const UU_TIEN: Record<string, string> = { thap: "Thấp", thuong: "Thường", cao: "Cao" };

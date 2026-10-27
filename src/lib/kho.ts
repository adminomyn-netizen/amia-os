export const NHAN_LOAI_KHO: Record<string, string> = {
  nhap: "Nhập kho", xuat_ban: "Bán lẻ", cap_ca: "Cấp theo phiếu", tra_ca: "Trả lại kho", kiem_ke: "Kiểm kê", dieu_chinh: "Điều chỉnh",
  chuyen_di: "Chuyển đi", chuyen_den: "Chuyển đến", hao_hut: "Huỷ / hao hụt", xuat_khan: "Xuất khẩn cấp", tra_ncc: "Trả nhà cung cấp",
};
export const TT_CHUYEN: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  dang_chuyen: { ten: "Đang chuyển", kieu: "cho" }, da_nhan: { ten: "Đã nhận", kieu: "tot" }, cho_xu_ly_chenh_lech: { ten: "Chờ xử lý chênh lệch", kieu: "loi" },
  da_xu_ly: { ten: "Đã xử lý", kieu: "tram" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const TT_KIEM_KE: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  dang_dem: { ten: "Đang đếm", kieu: "cho" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, tu_choi: { ten: "Bị từ chối", kieu: "loi" },
};
export const LOAI_XU_LY: Record<string, string> = { huy: "Huỷ hàng", hao_hut: "Hao hụt", tra_ncc: "Trả nhà cung cấp", dieu_chinh_giam: "Điều chỉnh giảm tồn", dieu_chinh_tang: "Điều chỉnh tăng tồn" };
export const TT_XU_LY: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt, đã ghi sổ", kieu: "tot" }, tu_choi: { ten: "Bị từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const TT_XUAT_KHAN: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_hau_kiem: { ten: "Chờ hậu kiểm", kieu: "cho" }, da_hau_kiem: { ten: "Đã hậu kiểm", kieu: "tot" }, vuot_tham_quyen: { ten: "Trình cấp trên", kieu: "loi" },
};
/** Mốc cảnh báo hạn dùng (ngày) và hạn tối thiểu khi nhập hàng (SOP kho: 90/60/30 ngày; không nhập hàng còn dưới 90 ngày nếu chưa có ngoại lệ). */
export const MOC_HAN = [30, 60, 90] as const;
export const HAN_NHAP_TOI_THIEU = 90;

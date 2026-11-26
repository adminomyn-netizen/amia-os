export const LOAI_DX = { mua_sam: "Mua sắm", thanh_toan: "Thanh toán", tam_ung: "Tạm ứng", hoan_ung: "Hoàn ứng", hoan_khach: "Hoàn trả khách" } as const;
export const CHUC_DANH_TC: Record<string, string> = {
  ke_toan_truong: "Kế toán trưởng", ke_toan_tong_hop: "Kế toán tổng hợp", ke_toan_vien: "Kế toán viên", ke_toan_thu: "Kế toán thu", ke_toan_chi: "Kế toán chi", ke_toan_vat_tu: "Kế toán vật tư", thu_quy: "Thủ quỹ",
  giam_doc_cong_ty: "Giám đốc công ty", giam_doc_chi_nhanh: "Giám đốc chi nhánh",
};
/** Hạn mức duyệt hiệu lực: đã đặt thì theo số đã đặt; chưa đặt thì Kỹ thuật/Quản lý không giới hạn, vai trò khác không có quyền duyệt khoản tiền. */
export const hanMucHieuLuc = (vaiTro: string, hanMuc: number | null | undefined) => (hanMuc != null ? Number(hanMuc) : vaiTro === "chu" || vaiTro === "ky_thuat" || vaiTro === "quan_ly" ? Infinity : 0);
export const TT_DX: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, can_bo_sung: { ten: "Cần bổ sung chứng từ", kieu: "loi" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, da_thuc_hien: { ten: "Đã thực hiện", kieu: "tot" },
  tu_choi: { ten: "Từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const TT_VIEC: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  moi: { ten: "Mới giao", kieu: "cho" }, dang_lam: { ten: "Đang làm", kieu: "cho" }, xong: { ten: "Hoàn thành", kieu: "tot" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const UU_TIEN: Record<string, string> = { thap: "Thấp", thuong: "Thường", cao: "Cao" };

/** Danh mục "Khoản chi / Nhóm ngân sách chi" của phiếu Lark (Base FIN-RPO, bảng 5.2). */
export const KHOAN_CHI = ["Mua hàng", "Hành chính", "Nhân sự", "Marketing – tiếp thị", "Pháp lý", "Thuế", "Đầu tư máy móc thiết bị", "Sửa chữa máy móc thiết bị", "Vận chuyển", "Hoàn tiền trả khách hàng", "Dịch vụ khách hàng", "Phần mềm – ứng dụng công nghệ", "Nộp phí quản lý", "Tài sản", "Công cụ dụng cụ", "Chuyển tiền nội bộ khác chi nhánh", "Công đoàn", "Khác"];
export const HINH_THUC_CHI: Record<string, string> = { chuyen_khoan: "Chuyển khoản", tien_mat: "Tiền mặt", tien_mat_quy: "Tiền mặt quỹ" };
export const PHAN_LOAI_VAT: Record<string, string> = { co_vat: "Có hoá đơn VAT", khong_vat: "Không có hoá đơn VAT", chua_ro: "Chưa biết rõ" };

/** Hạng mục chi phí của phiếu tạm ứng: mỗi dòng "Tên hạng mục | số tiền". Trả danh sách + tổng, hoặc lỗi. */
export function phanTichHangMuc(text: string): { ds: { ten: string; so_tien: number }[]; tong: number } | { loi: string } {
  const ds: { ten: string; so_tien: number }[] = [];
  for (const dong of text.split("\n").map((x) => x.trim()).filter(Boolean)) {
    const [ten, tien] = dong.split("|").map((x) => x.trim());
    const so = Number((tien ?? "").replace(/[.\s,đ₫]/g, ""));
    if (!ten || !tien || !Number.isInteger(so) || so <= 0) return { loi: `Dòng hạng mục chưa đúng: "${dong}". Viết "Tên hạng mục | số tiền", mỗi hạng mục một dòng.` };
    ds.push({ ten, so_tien: so });
  }
  return { ds, tong: ds.reduce((t, x) => t + x.so_tien, 0) };
}

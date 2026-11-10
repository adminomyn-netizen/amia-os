// Hộp Lead dạng pipeline (M3, migration 0313): hằng số và hàm nhỏ dùng chung cho trang, hành động và tệp.
// Giai đoạn (cột kanban) ở bảng lead_giai_doan; lead.ket_qua (open/won/lost) do trigger suy ra từ giai đoạn, KHÔNG ghi tay.
// lead.trang_thai_lien_he giữ nghĩa "kết quả liên hệ" (src/lib/marketing.ts TT_LIEN_HE).

export const KET_QUA_LEAD: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  open: { ten: "Đang mở", kieu: "cho" }, won: { ten: "Thắng", kieu: "tot" }, lost: { ten: "Thua", kieu: "tram" },
};

/** Mức chăm sóc theo số ngày từ lần cập nhật gần nhất (như BeDental). */
export const MUC_CHAM_SOC = [
  { ma: "moi", ten: "Mới cập nhật (0–7 ngày)", tu: 0, den: 7 },
  { ma: "chu_y", ten: "Cần chú ý (8–14 ngày)", tu: 8, den: 14 },
  { ma: "lau", ten: "Lâu chưa chăm sóc (15–29 ngày)", tu: 15, den: 29 },
  { ma: "bo_quen", ten: "Bỏ quên (từ 30 ngày)", tu: 30, den: null },
] as const;

export const LOC_NHAC = [
  { ma: "qua_han", ten: "Nhắc quá hạn" }, { ma: "hom_nay", ten: "Nhắc hôm nay" }, { ma: "sap_toi", ten: "Nhắc sắp tới" }, { ma: "khong", ten: "Không có nhắc" },
] as const;

export const LOAI_HOAT_DONG: Record<string, string> = {
  tao: "Tạo lead", phu_trach: "Phụ trách", doi_giai_doan: "Đổi giai đoạn", mo_lai: "Mở lại", gan_khach: "Hồ sơ khách", ghi_chu: "Ghi chú", goi: "Gọi", nhan_tin: "Nhắn tin",
  tac_vu: "Tác vụ", nhac: "Nhắc việc", tep: "Tệp", ho_tro: "Người hỗ trợ", lien_he: "Liên hệ",
};
/** Loại hoạt động người dùng ghi tay ở tab Hoạt động. */
export const HOAT_DONG_GHI_TAY = [{ gia_tri: "ghi_chu", nhan: "Ghi chú" }, { gia_tri: "goi", nhan: "Gọi" }, { gia_tri: "nhan_tin", nhan: "Nhắn tin" }] as const;

export const NHAN_TEP: Record<string, string> = { truoc: "Trước điều trị", sau: "Sau điều trị", khac: "Khác" };
export const KHO_LEAD_TEP = "lead-tep";
export const TEP_LEAD_TOI_DA = 10 * 1024 * 1024;
export const SO_TEP_TAI_TAY = 5;
const DUOI: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", pdf: "application/pdf" };
export function loaiTepLead(ten: string): { duoi: string; mime: string } | null {
  const duoi = (ten.split(".").pop() ?? "").toLowerCase();
  return DUOI[duoi] ? { duoi, mime: DUOI[duoi] } : null;
}
export function kiemTraTepLead(ten: string, kichThuoc: number): string | null {
  if (!loaiTepLead(ten)) return "Chỉ nhận ảnh JPG, PNG, WEBP, HEIC hoặc tệp PDF.";
  if (!(kichThuoc > 0)) return "Tệp rỗng.";
  if (kichThuoc > TEP_LEAD_TOI_DA) return "Tệp quá 10 MB.";
  return null;
}

/** "Cập nhật hôm nay" / "Cập nhật 3 ngày trước" (theo ngày giờ Việt Nam). */
export function capNhatTruoc(iso: string, bay = new Date()): string {
  const ngay = (d: Date) => Math.floor((d.getTime() + 7 * 3600e3) / 86400e3);
  const n = ngay(bay) - ngay(new Date(iso));
  return n <= 0 ? "Cập nhật hôm nay" : n === 1 ? "Cập nhật hôm qua" : `Cập nhật ${n} ngày trước`;
}

/** Quá SLA của cột: lead còn mở, cột có SLA, ở cột lâu hơn số phút cho phép. */
export const quaSla = (giaiDoanLuc: string, slaPhut: number | null, ketQua: string, bay = Date.now()) =>
  ketQua === "open" && !!slaPhut && bay - new Date(giaiDoanLuc).getTime() > slaPhut * 60000;

export const MAU_COT = ["#3b82f6", "#d97706", "#8b5cf6", "#14a394", "#16a34a", "#9ca3af", "#e11d48", "#0ea5e9", "#a16207", "#64748b"];

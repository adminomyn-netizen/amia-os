export const NHOM_VB: Record<string, string> = { khach: "Khách hàng", doi_tac: "Đối tác", noi_bo: "Nội bộ", chinh_sach: "Chính sách" };
export const TT_VB: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Nháp", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt, chờ ký", kieu: "cho" }, da_ky: { ten: "Đã ký", kieu: "tot" },
  huy: { ten: "Đã huỷ", kieu: "tram" }, thay_the: { ten: "Đã thay thế", kieu: "tram" },
};
export const LOAI_CONSENT: Record<string, string> = { theo_doi_dieu_tri: "Chụp / lưu ảnh để theo dõi điều trị", truyen_thong: "Dùng ảnh cho truyền thông" };
export const GIAI_DOAN_HD: Record<string, string> = { thu_viec: "Thử việc", hdld_1: "HĐLĐ lần 1", hdld_2: "HĐLĐ lần 2", kxd: "Không xác định thời hạn" };
export const THU_TU_HD = ["thu_viec", "hdld_1", "hdld_2", "kxd"] as const;
export const NGAY_THU_VIEC = 60;

/** Hiệu lực tính từ ngày: hết hạn / sắp hết hạn trong `truoc` ngày / còn hiệu lực / chưa xác định. */
export function tinhHieuLuc(den: string | null | undefined, hom: string, congNgay: (d: string, n: number) => string, truoc: number): "het" | "sap" | "con" | "khong" {
  if (!den) return "khong";
  if (den < hom) return "het";
  return den <= congNgay(hom, truoc) ? "sap" : "con";
}

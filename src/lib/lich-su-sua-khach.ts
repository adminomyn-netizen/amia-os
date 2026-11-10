import { ngaySinhVN } from "@/lib/ngay-sinh";

// Lịch sử sửa hồ sơ khách của nhân viên (chị Diệu Thuý 10/11/2026 mục 3): mỗi lần lưu ghi một dòng nhat_ky_truy_cap (hanh_dong "sua_khach")
// với chi_tiet.doi = { cột: [cũ, mới] } chỉ gồm các cột thật sự đổi. Phần tính thuần, không đọc DB, để test được.

/** Nhãn các cột hiện trong lịch sử; cột không có ở đây thì không ghi. Cột id (chi nhánh, phụ trách, người giới thiệu) ghi id, lúc hiện đổi ra tên. */
export const NHAN_COT_KHACH: Record<string, string> = {
  ho_ten: "Họ tên", dien_thoai: "Điện thoại", zalo: "Zalo", email: "Email", gioi_tinh: "Giới tính", ngay_sinh: "Ngày sinh", dia_chi: "Địa chỉ",
  chi_nhanh_id: "Chi nhánh", nguon: "Nguồn khách", nguon_chi_tiet: "Chi tiết nguồn", nguoi_gioi_thieu_id: "Người giới thiệu", nguoi_phu_trach_id: "Người phụ trách",
  ghi_chu: "Ghi chú", dong_y_dung_hinh: "Đồng ý dùng hình ảnh", tinh_thanh: "Tỉnh/thành", quan_huyen: "Quận/huyện", quoc_gia: "Quốc gia", sdt_phu: "SĐT phụ",
  facebook: "Facebook", website: "Website", nghe_nghiep: "Nghề nghiệp", cong_ty: "Công ty", ma_so_thue: "Mã số thuế", ma_the_giay: "Mã thẻ giấy",
};
/** Cột chứa số điện thoại: người không có quyền xem SĐT thì che. */
export const COT_SDT = new Set(["dien_thoai", "sdt_phu", "zalo"]);

type GiaTri = string | number | boolean | null;
const chuan = (v: unknown): GiaTri => (v === undefined || v === "" ? null : typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : v == null ? null : String(v));

/** Các cột đổi giữa bản cũ và bản mới (chỉ cột có nhãn và có trong `moi`). */
export function cotDoi(cu: Record<string, unknown> | null | undefined, moi: Record<string, unknown>): Record<string, [GiaTri, GiaTri]> {
  const ra: Record<string, [GiaTri, GiaTri]> = {};
  for (const k of Object.keys(moi)) {
    if (!(k in NHAN_COT_KHACH)) continue;
    const a = chuan(cu?.[k]), b = chuan(moi[k]);
    if (a !== b) ra[k] = [a, b];
  }
  return ra;
}

/** Một dòng hiện: "Họ tên: A → B". `ten` đổi id sang tên (chi nhánh, nhân viên, khách). `xemSdt` = false thì che số. */
export function moTaDoi(doi: Record<string, [GiaTri, GiaTri]>, o: { ten?: (cot: string, id: string) => string | undefined; xemSdt: boolean }): string[] {
  const hien = (cot: string, v: GiaTri) => {
    if (v == null) return "(trống)";
    if (typeof v === "boolean") return v ? "Có" : "Không";
    if (COT_SDT.has(cot) && !o.xemSdt) return "•••";
    if (cot === "ngay_sinh" && typeof v === "string") return ngaySinhVN(v); // "20/11 (không rõ năm)" thay vì "1904-11-20"
    return (cot.endsWith("_id") && o.ten?.(cot, String(v))) || String(v);
  };
  return Object.entries(doi).filter(([k]) => k in NHAN_COT_KHACH).map(([k, [a, b]]) => `${NHAN_COT_KHACH[k]}: ${hien(k, a)} → ${hien(k, b)}`);
}

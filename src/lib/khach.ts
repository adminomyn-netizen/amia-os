export const NGUON = [
  { gia_tri: "mkt", nhan: "Marketing (quảng cáo, fanpage)" },
  { gia_tri: "telesale", nhan: "Telesale tự tìm" },
  { gia_tri: "tu_van", nhan: "Tư vấn tự tìm" },
  { gia_tri: "khach_cu_gioi_thieu", nhan: "Khách cũ giới thiệu" },
  { gia_tri: "khac", nhan: "Khác / chưa rõ" },
];
export const NHAN_NGUON = Object.fromEntries(NGUON.map((n) => [n.gia_tri, n.nhan.split(" (")[0]])) as Record<string, string>;
export const TRANG_THAI_KHACH: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  lead: { nhan: "Tiềm năng", kieu: "tram" },
  da_den: { nhan: "Đã đến", kieu: "cho" },
  dang_lieu_trinh: { nhan: "Đang liệu trình", kieu: "tot" },
  het_lieu_trinh: { nhan: "Hết liệu trình", kieu: "cho" },
  mat: { nhan: "Đã mất", kieu: "loi" },
};
export const TRANG_THAI_KHACH_LC = Object.entries(TRANG_THAI_KHACH).map(([gia_tri, v]) => ({ gia_tri, nhan: v.nhan }));

import type { Truong } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";

/** Biểu mẫu khách dùng ở cả "Thêm khách" và "Sửa". 5 trường bắt buộc: nguồn · người phụ trách · (trạng thái, hạng tự tính) · dịch vụ quan tâm. */
export function truongKhach(o: { dichVu: LuaChon[]; nhanVien: LuaChon[]; chiNhanh: LuaChon[] }): Truong[] {
  return [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "dien_thoai", nhan: "Số điện thoại (không trùng)", loai: "chu", batBuoc: true },
    { ten: "zalo", nhan: "Zalo", loai: "chu" }, { ten: "ngay_sinh", nhan: "Ngày sinh", loai: "ngay" },
    { ten: "gioi_tinh", nhan: "Giới tính", loai: "chon", luaChon: [{ gia_tri: "nữ", nhan: "Nữ" }, { gia_tri: "nam", nhan: "Nam" }, { gia_tri: "khác", nhan: "Khác" }] },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: o.chiNhanh, batBuoc: true },
    { ten: "nguon", nhan: "Nguồn khách", loai: "chon", luaChon: NGUON, batBuoc: true },
    { ten: "nguoi_gioi_thieu", nhan: "Người giới thiệu (mã hoặc SĐT, nếu là khách cũ giới thiệu)", loai: "chu" },
    { ten: "nguon_chi_tiet", nhan: "Chi tiết nguồn (chiến dịch, bài quảng cáo...)", loai: "chu", rong: true },
    { ten: "nguoi_phu_trach_id", nhan: "Người phụ trách (telesale/tư vấn)", loai: "chon", luaChon: o.nhanVien, batBuoc: true, rong: true },
    { ten: "quan_tam", nhan: "Dịch vụ quan tâm", loai: "nhieu", luaChon: o.dichVu },
    { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true }, { ten: "email", nhan: "Email", loai: "email" },
    { ten: "ghi_chu", nhan: "Ghi chú chung", loai: "nhieu_dong" },
    { ten: "dong_y_dung_hinh", nhan: "Khách đồng ý (bằng văn bản) cho dùng hình ảnh", loai: "gat" },
  ];
}

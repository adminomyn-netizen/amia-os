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
/** Nhãn tiếng Việt của trạng thái lịch hẹn (tab Lịch sử giao dịch; bảng lịch hẹn riêng có bản màu sắc ở trang Lịch hẹn). */
export const NHAN_TRANG_THAI_LICH: Record<string, string> = {
  chua_xac_nhan: "Chưa xác nhận", da_xac_nhan: "Đã xác nhận", cho_phuc_vu: "Chờ phục vụ", dang_phuc_vu: "Đang phục vụ", hoan_thanh: "Hoàn thành", huy: "Đã huỷ", khong_den: "Không đến",
};
/** Thứ tự danh sách khách (mặc định tên A → Z như SalonHero). */
/** Các ô lọc danh sách khách (giống SalonHero). Dùng chung cho danh sách bên trái, API và nút Xuất Excel để mọi nơi luôn khớp nhau. */
export const KHOA_LOC = [
  "trang_thai", "nguon", "hang", "phu_trach", "nhom", "gioi_tinh", "diem_tu", "diem_den", "tuoi_tu", "tuoi_den", "the", "no", "sinh_nhat", "sinh_ngay",
  "chi_nhanh", "nhieu_cn", "tinh", "quan", "den_tu", "den_den", "tao_tu", "tao_den", "dich_vu", "san_pham", "nhan_vien", "ds_tu", "ds_den", "nhom_kieu",
] as const;
export type KhoaLoc = (typeof KHOA_LOC)[number];

export const SAP_XEP_KHACH = [
  { gia_tri: "ten", nhan: "Tên A → Z" },
  { gia_tri: "ten_giam", nhan: "Tên Z → A" },
  { gia_tri: "moi", nhan: "Mới tạo trước" },
  { gia_tri: "chi", nhan: "Chi 12 tháng cao trước" },
  { gia_tri: "diem", nhan: "Điểm thưởng cao trước" },
];

import type { Truong } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";

/** Biểu mẫu khách dùng ở cả "Thêm khách" và "Sửa". 5 trường bắt buộc: nguồn · người phụ trách · (trạng thái, hạng tự tính) · dịch vụ quan tâm. */
export function truongKhach(o: { dichVu: LuaChon[]; nhanVien: LuaChon[]; chiNhanh: LuaChon[]; nhom?: LuaChon[] }): Truong[] {
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
    // Nhóm khách chọn ngay khi tạo như form SalonHero (khách đã có thì đổi bằng "Đổi nhóm" ở hồ sơ).
    ...(o.nhom?.length ? [{ ten: "nhom_ids", nhan: "Nhóm khách hàng", loai: "nhieu" as const, luaChon: o.nhom, chiKhiTao: true }] : []),
    { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true }, { ten: "email", nhan: "Email", loai: "email" },
    // Các ô còn lại của form "Thêm khách hàng mới" ở SalonHero (cột đã có từ 0055; trước đây chỉ hiện ở hồ sơ, không nhập/sửa được).
    // Tỉnh/thành và phường/xã chọn từ danh mục như SalonHero (34 tỉnh sau sáp nhập 2025 + tỉnh cũ); giá trị cũ nhập tay vẫn giữ.
    { ten: "tinh_thanh", nhan: "Tỉnh/thành", loai: "chon", diaBan: "tinh", goiY: "Chọn tỉnh/thành" }, { ten: "quan_huyen", nhan: "Phường/xã", loai: "chon", diaBan: { theoTinh: "tinh_thanh" }, goiY: "Chọn phường/xã" },
    { ten: "quoc_gia", nhan: "Quốc gia", loai: "chu", goiY: "VN" }, { ten: "sdt_phu", nhan: "Số điện thoại phụ", loai: "chu" },
    { ten: "facebook", nhan: "Facebook", loai: "chu" }, { ten: "website", nhan: "Website", loai: "chu" },
    { ten: "nghe_nghiep", nhan: "Nghề nghiệp", loai: "chu" }, { ten: "cong_ty", nhan: "Công ty", loai: "chu" },
    { ten: "ma_so_thue", nhan: "Mã số thuế", loai: "chu" }, { ten: "ma_the_giay", nhan: "Mã thẻ giấy", loai: "chu" },
    { ten: "ghi_chu", nhan: "Ghi chú chung", loai: "nhieu_dong" },
    { ten: "dong_y_dung_hinh", nhan: "Khách đồng ý (bằng văn bản) cho dùng hình ảnh", loai: "gat" },
  ];
}

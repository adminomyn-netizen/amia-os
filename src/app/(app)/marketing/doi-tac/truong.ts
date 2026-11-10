import type { Truong } from "@/components/ui/BieuMau";
import { KIEU_HH_GIOI_THIEU, LOAI_DOI_TAC } from "@/lib/marketing";

/** Truong của biểu mẫu nguồn giới thiệu (Thêm / Sửa) — dùng chung với trang chi tiết. */
export function truongDoiTac(): Truong[] {
  return [
    { ten: "ten", nhan: "Tên nguồn giới thiệu", loai: "chu", batBuoc: true },
    { ten: "loai", nhan: "Phân loại", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_DOI_TAC).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "dien_thoai", nhan: "Điện thoại di động (mã REF)", loai: "chu", ghiChu: "SĐT di động là mã REF: link đặt lịch dạng /dat-lich?ref=<SĐT>, số hiện công khai trên link/QR. Đổi số thì link/QR cũ vẫn dùng thêm 90 ngày." },
    { ten: "ten_hien_thi", nhan: "Tên hiển thị trên trang đặt lịch", loai: "chu", ghiChu: "Khách thấy ở ô Người giới thiệu. Để trống = tên nguồn." },
    { ten: "email", nhan: "Email nhận thông báo", loai: "email" },
    { ten: "gui_email", nhan: "Gửi email thông báo hoa hồng cho nguồn này", loai: "gat" },
    { ten: "hoat_dong", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "Đang hợp tác" }, { gia_tri: "0", nhan: "Ngừng" }] },
    { ten: "hh_kieu", nhan: "Mức hoa hồng mặc định", loai: "chon", batBuoc: true, luaChon: KIEU_HH_GIOI_THIEU.map((k) => ({ ...k })) },
    { ten: "hh_gia_tri", nhan: "Giá trị", loai: "so", ghiChu: "Phần trăm: % trên doanh số dòng sau giảm giá (số lẻ dùng dấu phẩy). Theo tiền: số đồng mỗi lượt. Theo điểm: không tính tiền. Mức riêng từng dịch vụ đặt ở trang Chi tiết." },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
}


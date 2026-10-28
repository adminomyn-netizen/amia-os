import type { Truong } from "@/components/ui/BieuMau";
import { CACH_XAC_NHAN, KENH_KN, LOAI_KN } from "@/lib/khieu-nai";

type LC = { gia_tri: string; nhan: string };
const tu = (o: Record<string, string>): LC[] => Object.entries(o).map(([gia_tri, nhan]) => ({ gia_tri, nhan }));

/** Ô nhập khách: theo số điện thoại (danh sách chung) hoặc đã biết sẵn (nút trên hồ sơ khách). */
const khach = (coDienThoai: boolean): Truong[] => (coDienThoai ? [{ ten: "dien_thoai", nhan: "Số điện thoại khách", loai: "chu", batBuoc: true, rong: true, goiY: "0912345678" }] : []);
const dichVu = (dv: LC[]): Truong => ({ ten: "dich_vu_id", nhan: "Dịch vụ liên quan", loai: "chon", rong: true, luaChon: [{ gia_tri: "", nhan: "Không rõ / không có" }, ...dv] });

/** BM17: ghi nhận khiếu nại. Chọn "Y khoa" thì tự chuyển sang biến chứng cho bác sĩ. */
export const truongKhieuNai = (dv: LC[], coDienThoai: boolean): Truong[] => [
  ...khach(coDienThoai),
  { ten: "kenh", nhan: "Khách phản ánh qua", loai: "chon", batBuoc: true, luaChon: tu(KENH_KN) },
  { ten: "loai", nhan: "Loại khiếu nại", loai: "chon", batBuoc: true, luaChon: tu(LOAI_KN) },
  dichVu(dv),
  { ten: "noi_dung", nhan: "Khách phản ánh gì", loai: "nhieu_dong", batBuoc: true, rong: true, goiY: "Ghi đúng lời khách, xin lỗi khách trước, không giải thích." },
];

/** QT-12 bước 1: báo dấu hiệu bất thường để bác sĩ xem ngay. */
export const truongBaoBatThuong = (dv: LC[], coDienThoai: boolean): Truong[] => [
  ...khach(coDienThoai),
  dichVu(dv),
  { ten: "dau_hieu", nhan: "Dấu hiệu bất thường", loai: "nhieu_dong", batBuoc: true, rong: true, goiY: "Đỏ, rát, phồng, sưng, chóng mặt... vùng nào, từ lúc nào." },
];

export const truongDeXuat = (): Truong[] => [
  { ten: "loai", nhan: "Phân loại", loai: "chon", batBuoc: true, rong: true, luaChon: tu(LOAI_KN), ghiChu: "Nếu thấy liên quan chuyên môn, chọn Y khoa để chuyển bác sĩ." },
  { ten: "nguyen_nhan", nhan: "Nguyên nhân đã xác minh", loai: "nhieu_dong", batBuoc: true, rong: true },
  { ten: "phuong_an", nhan: "Phương án khắc phục", loai: "nhieu_dong", batBuoc: true, rong: true },
  { ten: "co_chi_phi", nhan: "Phương án có chi phí (giảm giá, hoàn tiền, làm lại miễn phí)", loai: "gat", rong: true },
  { ten: "chi_phi", nhan: "Chi phí ước tính", loai: "tien", rong: true, ghiChu: "Để trống nếu không có. Có chi phí thì Quản lý duyệt." },
];

export const truongDong = (): Truong[] => [
  { ten: "khach_xac_nhan", nhan: "Khách đã đồng ý với cách xử lý", loai: "gat", rong: true },
  { ten: "cach_xac_nhan", nhan: "Khách xác nhận bằng cách nào", loai: "chon", batBuoc: true, rong: true, luaChon: tu(CACH_XAC_NHAN) },
  { ten: "nguyen_nhan_goc", nhan: "Nguyên nhân gốc", loai: "nhieu_dong", batBuoc: true, rong: true },
  { ten: "phong_ngua", nhan: "Cách phòng ngừa lặp lại", loai: "nhieu_dong", batBuoc: true, rong: true },
];

export const truongKham = (): Truong[] => [
  { ten: "chan_doan", nhan: "Chẩn đoán", loai: "nhieu_dong", batBuoc: true, rong: true },
  { ten: "phuong_an", nhan: "Phương án khắc phục", loai: "nhieu_dong", batBuoc: true, rong: true },
];
export const truongCamKet = (): Truong[] => [{ ten: "cam_ket", nhan: "Cam kết mức khắc phục với khách", loai: "nhieu_dong", batBuoc: true, rong: true, ghiChu: "Áp chính sách bảo hành biến chứng; viết rõ để khách và bác sĩ cùng xác nhận." }];
export const truongDongBc = (): Truong[] => [
  { ten: "nguyen_nhan_goc", nhan: "Nguyên nhân gốc", loai: "nhieu_dong", batBuoc: true, rong: true },
  { ten: "phong_ngua", nhan: "Hành động phòng ngừa", loai: "nhieu_dong", batBuoc: true, rong: true },
];

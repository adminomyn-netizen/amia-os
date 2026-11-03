import "server-only";
import { sb } from "@/lib/db";

export type ThanhVienNhom = { thuTu: number; ten: string; laKhachChinh: boolean; khachId: string | null; dichVuIds: string[]; nhanVienId: string | null; phong: string | null; thoiLuong: number | null };

/** Cả nhóm khách của một lịch hẹn, Khách 1 (khách chính) đứng đầu. Dùng cho Thu ngân: "Thanh toán ngay" từ lịch nhiều khách gom dịch vụ của CẢ NHÓM vào MỘT hoá đơn của khách chính
 *  (như SalonHero createOrderBooking), đặt hoa_don.so_khach = số phần tử. Mỗi dòng dịch vụ giữ người thực hiện của khách đó. Trả [] nếu không có lịch. */
export async function docNhomLich(lichId: string): Promise<ThanhVienNhom[]> {
  const db = sb();
  const [{ data: l }, { data: dv }, { data: tv }] = await Promise.all([
    db.from("lich_hen").select("id, khach_id, nhan_vien_id, phong, bat_dau, ket_thuc").eq("id", lichId).maybeSingle(),
    db.from("lich_hen_dich_vu").select("dich_vu_id").eq("lich_id", lichId),
    db.from("lich_hen_khach").select("thu_tu, ten, khach_id, dich_vu_ids, nhan_vien_id, phong, thoi_luong_phut").eq("lich_id", lichId).order("thu_tu"),
  ]);
  if (!l) return [];
  const chinh: ThanhVienNhom = { thuTu: 1, ten: "Khách 1", laKhachChinh: true, khachId: l.khach_id, dichVuIds: (dv ?? []).map((x) => x.dich_vu_id), nhanVienId: l.nhan_vien_id, phong: l.phong, thoiLuong: Math.round((Date.parse(l.ket_thuc) - Date.parse(l.bat_dau)) / 60000) };
  return [chinh, ...(tv ?? []).map((x) => ({ thuTu: x.thu_tu, ten: x.ten, laKhachChinh: false, khachId: x.khach_id, dichVuIds: x.dich_vu_ids ?? [], nhanVienId: x.nhan_vien_id, phong: x.phong, thoiLuong: x.thoi_luong_phut }))];
}

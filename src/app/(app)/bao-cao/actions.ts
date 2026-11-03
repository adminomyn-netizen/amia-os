"use server";

import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";

export type KhachCuaMuc = { khachId: string | null; ten: string; dienThoai: string | null; hoaDonId: string; maHd: string; ngay: string; soLuong: number; thanhTien: number };
const LOAI = new Set(["dich_vu", "san_pham", "ban_the", "dung_the"]);
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nút "Xem danh sách khách" của báo cáo Theo sản phẩm / dịch vụ: khách đã mua / dùng đúng mặt hàng đó trong khoảng ngày (tối đa 300 dòng gần nhất). Chỉ đọc. */
export async function layKhachCuaMuc(loai: string, ten: string, tu: string, den: string, cn: string): Promise<{ ok: true; rows: KhachCuaMuc[]; tong: number } | { ok?: false; loi: string }> {
  const nd = await kiemQuyen("baocao.tien");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!LOAI.has(loai) || !ten.trim() || ten.length > 300 || !NGAY.test(tu) || !NGAY.test(den) || (cn && !UUID.test(cn))) return { loi: "Yêu cầu không hợp lệ." };
  const chiNhanh = nd.chiNhanhId ?? (cn || undefined);
  const { data, error } = await sb().rpc("bc_khach_cua_muc", { p_loai: loai, p_ten: ten, p_tu: tu, p_den: den, p_cn: tuyChon(chiNhanh), p_gioi_han: 300 });
  if (error) return { loi: thongBaoLoi(error) };
  const xemSdt = coQuyen(nd, "khach.sdt");
  return {
    ok: true, tong: Number(data?.[0]?.tong_dong ?? 0),
    rows: (data ?? []).map((r) => ({ khachId: r.khach_id, ten: r.ho_ten ?? "Khách lẻ", dienThoai: r.dien_thoai ? (xemSdt ? r.dien_thoai : "•••") : null, hoaDonId: r.hoa_don_id, maHd: r.ma_hd, ngay: r.ngay_hd, soLuong: Number(r.so_luong), thanhTien: Number(r.thanh_tien) })),
  };
}

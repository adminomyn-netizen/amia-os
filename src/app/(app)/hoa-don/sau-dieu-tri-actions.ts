"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull } from "@/lib/form";
import { guiChoNhanVien, nguoiCoQuyen } from "@/lib/push";

type KQ = { ok?: true; loi?: string; khieuNaiId?: string; khieuNaiMoi?: boolean };

/** Ghi hoặc sửa đánh giá "Hài lòng / Không hài lòng" của một lần điều trị (hoá đơn hoặc lịch hẹn). Người có quyền bán hàng hoặc đặt lịch (thu ngân, lễ tân) ghi được.
 *  "Không hài lòng" tự tạo khiếu nại (trong cùng giao dịch ở DB) rồi báo người có quyền duyệt khiếu nại của chi nhánh bằng thông báo đẩy nội bộ (không SMS/Zalo). */
export async function luuDanhGiaSauDieuTri(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(coQuyen(nd, "ban.tao") || coQuyen(nd, "lich.sua"))) return { loi: KHONG_DU_QUYEN };
  const hoaDonId = chuoiHoacNull(fd, "hoa_don_id"), lichId = chuoiHoacNull(fd, "lich_hen_id");
  const ketQua = chuoi(fd, "ket_qua");
  if (!["hai_long", "khong_hai_long"].includes(ketQua)) return { loi: "Chọn Hài lòng hoặc Không hài lòng." };
  if (ketQua === "khong_hai_long" && !chuoi(fd, "ly_do")) return { loi: "Chọn lý do khách không hài lòng." };
  const db = sb();
  // Chi nhánh của lần điều trị phải là chi nhánh của người ghi (người gắn chi nhánh).
  const dich = hoaDonId ? (await db.from("hoa_don").select("chi_nhanh_id").eq("id", hoaDonId).maybeSingle()).data : lichId ? (await db.from("lich_hen").select("chi_nhanh_id").eq("id", lichId).maybeSingle()).data : null;
  if (!dich || (nd.chiNhanhId && dich.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy lần điều trị cần đánh giá." };
  const { data, error } = await db.rpc("ghi_danh_gia_sau_dieu_tri", {
    p_hoa_don: (hoaDonId ?? undefined) as string, p_lich: (lichId ?? undefined) as string, p_ket_qua: ketQua, p_ly_do: chuoi(fd, "ly_do"), p_ghi_chu: chuoi(fd, "ghi_chu").slice(0, 1000), p_nguoi: nd.nhanVienId,
  });
  const r = data?.[0];
  if (error || !r) return { loi: thongBaoLoi(error) || "Không lưu được đánh giá." };
  if (r.r_khieu_nai_moi && r.r_khieu_nai_id) {
    try {
      const ids = (await nguoiCoQuyen("kn.duyet", r.r_chi_nhanh_id)).filter((x) => x !== nd.nhanVienId);
      if (ids.length) await guiChoNhanVien(ids, { tieuDe: "Khách không hài lòng sau điều trị", noiDung: "Đã tự tạo một khiếu nại mới, cần tiếp nhận và xử lý.", url: `/khieu-nai/${r.r_khieu_nai_id}`, tag: `kn-${r.r_khieu_nai_id}` });
    } catch (e) { console.error("[sau-dieu-tri] gửi thông báo lỗi", (e as Error).message); }
  }
  if (hoaDonId) revalidatePath(`/hoa-don/${hoaDonId}`);
  revalidatePath("/khach-hang"); revalidatePath("/khieu-nai");
  return { ok: true, khieuNaiId: r.r_khieu_nai_id ?? undefined, khieuNaiMoi: r.r_khieu_nai_moi };
}

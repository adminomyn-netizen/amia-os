"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };

/** Ghi trạng thái xử lý công nợ của một hoá đơn. Khiếu nại thì chuyển "tranh chấp"; không bao giờ tự xoá hay giảm nợ ở đây. */
export async function capNhatXuLyNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "trang_thai"), hen = chuoiHoacNull(fd, "hen_tra");
  if (!["dang_nhac", "da_cam_ket", "tranh_chap"].includes(tt)) return { loi: "Chọn trạng thái xử lý." };
  if (hen && (!/^\d{4}-\d{2}-\d{2}$/.test(hen) || hen < homNayHCM())) return { loi: "Ngày hẹn trả không được ở quá khứ." };
  if (tt === "da_cam_ket" && !hen) return { loi: "Khách đã cam kết thì cần ngày hẹn trả." };
  if (tt === "tranh_chap" && !chuoi(fd, "ghi_chu")) return { loi: "Ghi lý do khiếu nại / tranh chấp." };
  const db = sb();
  const { data: hd } = await db.from("hoa_don").select("id, chi_nhanh_id, con_no, trang_thai").eq("id", chuoi(fd, "hoa_don_id")).maybeSingle();
  if (!hd || hd.trang_thai !== "hoan_thanh" || Number(hd.con_no) <= 0 || (nd.chiNhanhId && hd.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Hoá đơn không còn nợ hoặc không thuộc chi nhánh của bạn." };
  const { error } = await db.from("cong_no_khach_xu_ly").upsert({ hoa_don_id: hd.id, trang_thai: tt, nguoi_phu_trach_id: chuoiHoacNull(fd, "nguoi_phu_trach_id"), hen_tra: hen, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "hoa_don_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

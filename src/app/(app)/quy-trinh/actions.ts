"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { chuoi, chuoiHoacNull } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Cập nhật một đầu việc của Kế hoạch triển khai: người có quyền "qt.sua" sửa mọi việc; người được giao chỉ đổi trạng thái và ghi chú việc của mình. */
export async function capNhatDauViec(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ma = chuoi(fd, "ma");
  const db = sb();
  const { data: v } = await db.from("kd_dau_viec").select("ma, nguoi_phu_trach_id").eq("ma", ma).maybeSingle();
  if (!v) return { loi: "Không tìm thấy đầu việc." };
  const quanLy = coQuyen(nd, "qt.sua");
  if (!quanLy && v.nguoi_phu_trach_id !== nd.nhanVienId) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "trang_thai");
  if (!["chua", "dang", "xong", "bo"].includes(tt)) return { loi: "Chọn trạng thái." };
  const du: TablesUpdate<"kd_dau_viec"> = { trang_thai: tt, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: nd.nhanVienId };
  if (quanLy) {
    const han = chuoiHoacNull(fd, "han");
    if (han && !NGAY.test(han)) return { loi: "Hạn chưa đúng." };
    du.han = han;
    du.nguoi_phu_trach_id = chuoiHoacNull(fd, "nguoi_phu_trach_id");
  }
  const { error } = await db.from("kd_dau_viec").update(du).eq("ma", ma);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/quy-trinh");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";

type KQ = { ok?: true; loi?: string };

export async function danhDauOnboarding(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("id, chi_nhanh_id").eq("id", chuoi(fd, "nhan_vien_id")).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId)) return { loi: KHONG_DU_QUYEN };
  const { error } = chuoi(fd, "huy") === "1"
    ? await db.from("onboarding_tien_do").delete().eq("nhan_vien_id", n.id).eq("muc_id", chuoi(fd, "muc_id"))
    : await db.from("onboarding_tien_do").upsert({ nhan_vien_id: n.id, muc_id: chuoi(fd, "muc_id"), nguoi_id: nd.nhanVienId }, { onConflict: "nhan_vien_id,muc_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function khoaKy(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ky.khoa");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const thang = chuoi(fd, "thang");
  if (!THANG.test(thang)) return { loi: "Tháng không hợp lệ." };
  const { error } = await sb().rpc("khoa_ky", { p_thang: thang, p_nguoi: nd.nhanVienId, p_ghi_chu: chuoi(fd, "ghi_chu") });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

export async function moLaiKy(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ky.mo_lai");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const thang = chuoi(fd, "thang");
  if (!THANG.test(thang)) return { loi: "Tháng không hợp lệ." };
  const { error } = await sb().rpc("mo_lai_ky", { p_thang: thang, p_nguoi: nd.nhanVienId, p_ly_do: chuoi(fd, "ly_do") });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

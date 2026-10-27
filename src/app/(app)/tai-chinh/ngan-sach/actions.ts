"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };

export async function luuNganSach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ky.khoa");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const thang = chuoi(fd, "thang"), loai = chuoi(fd, "loai_thu_chi_id"), cn = chuoiHoacNull(fd, "chi_nhanh_id"), tien = Math.round(so(fd, "so_tien"));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(thang) || !loai || !(tien >= 0)) return { loi: "Chọn tháng, phân loại chi và nhập ngân sách." };
  if (nd.chiNhanhId && cn !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  let q = db.from("ngan_sach_ky").select("id").eq("thang", thang).eq("loai_thu_chi_id", loai);
  q = cn ? q.eq("chi_nhanh_id", cn) : q.is("chi_nhanh_id", null);
  const { data: cu } = await q.maybeSingle();
  const row = { thang, loai_thu_chi_id: loai, chi_nhanh_id: cn, so_tien: tien, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() };
  const { error } = cu ? await db.from("ngan_sach_ky").update(row).eq("id", cu.id) : await db.from("ngan_sach_ky").insert(row);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

export async function xoaNganSach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ky.khoa");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("ngan_sach_ky").delete().eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

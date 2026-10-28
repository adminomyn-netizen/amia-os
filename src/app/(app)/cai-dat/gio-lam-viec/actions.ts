"use server";

import { revalidatePath, updateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi } from "@/lib/form";
import { THU, gioBaThu, gioDeLuu, loiGioBaThu, tomTatGio, type GioNgay, type KhoaThu } from "@/lib/gio-lam-viec";

type KQ = { ok?: true; loi?: string };

/** Giờ làm việc của MỘT chi nhánh theo từng thứ (hoặc "dùng giờ chung" = xoá giờ riêng). Chỉ Chủ / Kỹ thuật; ghi nhật ký giá trị trước và sau. */
export async function luuGioLamViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "chi_nhanh_id");
  if (!id) return { loi: "Chọn chi nhánh." };
  const db = sb();
  const [{ data: cn }, { data: ch }] = await Promise.all([db.from("chi_nhanh").select("id, ten, gio_lam_viec").eq("id", id).maybeSingle(), db.from("cua_hang").select("gio_lam_viec").eq("id", 1).maybeSingle()]);
  if (!cn) return { loi: "Không có chi nhánh này." };
  let moi: ReturnType<typeof gioDeLuu> | null = null;
  if (!bat(fd, "dung_chung")) {
    const g = Object.fromEntries(THU.map(({ khoa }) => [khoa, { nghi: bat(fd, `${khoa}_nghi`), mo: chuoi(fd, `${khoa}_mo`), dong: chuoi(fd, `${khoa}_dong`) }])) as Record<KhoaThu, GioNgay>;
    const loi = loiGioBaThu(g);
    if (loi) return { loi };
    moi = gioDeLuu(g);
  }
  const { error } = await db.from("chi_nhanh").update({ gio_lam_viec: moi }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  updateTag("chi-nhanh");
  const tt = (v: unknown) => (v == null ? "giờ chung" : tomTatGio(gioBaThu(v, ch?.gio_lam_viec)));
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_gio_lam_viec", doi_tuong: "chi_nhanh", doi_tuong_id: id, chi_tiet: { chi_nhanh: cn.ten, truoc: cn.gio_lam_viec, sau: moi, tom_tat: { truoc: tt(cn.gio_lam_viec), sau: tt(moi) } } });
  revalidatePath("/cai-dat/gio-lam-viec");
  revalidatePath("/dat-lich");
  return { ok: true };
}

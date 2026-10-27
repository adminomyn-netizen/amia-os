"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull } from "@/lib/form";
import { congNgay } from "@/lib/dinh-dang";
import { NGAY_THU_VIEC } from "@/lib/van-ban";

type KQ = { ok?: true; loi?: string };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export async function luuHdld(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), gd = chuoi(fd, "giai_doan"), tu = chuoi(fd, "tu_ngay");
  let den = chuoiHoacNull(fd, "den_ngay");
  if (!nv || !["thu_viec", "hdld_1", "hdld_2", "kxd"].includes(gd) || !NGAY.test(tu)) return { loi: "Chọn nhân viên, giai đoạn và ngày bắt đầu." };
  if (gd === "kxd") den = null;
  else if (gd === "thu_viec" && !den) den = congNgay(tu, NGAY_THU_VIEC - 1);
  if (gd !== "kxd" && (!den || !NGAY.test(den) || den < tu)) return { loi: "Nhập ngày hết hạn sau ngày bắt đầu." };
  const link = chuoiHoacNull(fd, "link_ban_dien_tu");
  if (link && !/^https?:\/\//.test(link)) return { loi: "Link bản điện tử phải bắt đầu bằng https://" };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("id, ngay_vao_lam, ngay_vao_chinh_thuc, chi_nhanh_id").eq("id", nv).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId)) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("hd_lao_dong").upsert({ nhan_vien_id: nv, giai_doan: gd, so_hd: chuoiHoacNull(fd, "so_hd"), tu_ngay: tu, den_ngay: den, link_ban_dien_tu: link, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId }, { onConflict: "nhan_vien_id,giai_doan" });
  if (error) return { loi: thongBaoLoi(error) };
  if (gd === "thu_viec" && !n.ngay_vao_lam) await db.from("nhan_vien").update({ ngay_vao_lam: tu }).eq("id", nv);
  if (["hdld_1", "hdld_2", "kxd"].includes(gd) && !n.ngay_vao_chinh_thuc) await db.from("nhan_vien").update({ ngay_vao_chinh_thuc: tu }).eq("id", nv);
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

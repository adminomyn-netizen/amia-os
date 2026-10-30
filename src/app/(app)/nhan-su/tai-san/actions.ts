"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { NGAY_ISO, nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };

/** Cấp phát tài sản cho nhân viên (thêm mới hoặc sửa theo id). */
export async function luuTaiSan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten_tai_san"), nv = chuoi(fd, "nhan_vien_id"), cap = chuoi(fd, "ngay_cap");
  if (ten.length < 2 || ten.length > 200) return { loi: "Nhập tên tài sản (2 đến 200 ký tự)." };
  if (cap && !NGAY_ISO.test(cap)) return { loi: "Ngày cấp không đúng." };
  const sl = so(fd, "so_luong") || 1;
  if (sl <= 0 || sl > 9999) return { loi: "Số lượng chưa hợp lệ." };
  if (nv && !(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  if (!nv && nd.chiNhanhId) return { loi: "Chọn nhân viên nhận tài sản." };
  const db = sb();
  const dong = { ten_tai_san: ten, loai: chuoiHoacNull(fd, "loai"), hang_model: chuoiHoacNull(fd, "hang_model"), so_luong: sl, don_vi_tinh: chuoiHoacNull(fd, "don_vi_tinh"), tinh_trang: chuoiHoacNull(fd, "tinh_trang"), nhan_vien_id: nv || null, ngay_cap: cap || null, ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  if (id) {
    const { data: cu } = await db.from("hr_tai_san").select("nhan_vien_id").eq("id", id).maybeSingle();
    if (!cu || (cu.nhan_vien_id && !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id)))) return { loi: KHONG_DU_QUYEN };
    const { error } = await db.from("hr_tai_san").update(dong).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { error } = await db.from("hr_tai_san").insert(dong);
    if (error) return { loi: thongBaoLoi(error) };
  }
  revalidatePath("/nhan-su/tai-san");
  return { ok: true };
}

/** Thu hồi tài sản: ghi ngày thu hồi (hôm nay nếu không nhập). */
export async function thuHoiTaiSan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("hr_tai_san").select("nhan_vien_id, ngay_thu_hoi").eq("id", id).maybeSingle();
  if (!cu || (cu.nhan_vien_id && !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id)))) return { loi: KHONG_DU_QUYEN };
  if (cu.ngay_thu_hoi) return { loi: "Tài sản này đã thu hồi." };
  const ngay = chuoi(fd, "ngay") || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const { error } = await db.from("hr_tai_san").update({ ngay_thu_hoi: ngay }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/tai-san");
  return { ok: true };
}

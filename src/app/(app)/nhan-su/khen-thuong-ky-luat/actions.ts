"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { NGAY_ISO, nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };

/** Ghi một khoản khen thưởng (khoan_chi: công ty chi) hoặc kỷ luật phạt tiền (khoan_thu: nhân viên nộp). Kỷ luật không phạt tiền thì số tiền để 0. */
export async function luuKhenKyLuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), nv = chuoi(fd, "nhan_vien_id"), loai = chuoi(fd, "loai"), ngay = chuoi(fd, "ngay_lap"), nd_ = chuoi(fd, "noi_dung");
  if (!nv || !["thuong", "phat"].includes(loai) || !NGAY_ISO.test(ngay)) return { loi: "Chọn nhân viên, loại và ngày lập." };
  if (nd_.length < 2 || nd_.length > 500) return { loi: "Nhập nội dung (2 đến 500 ký tự)." };
  const tien = Math.round(so(fd, "so_tien"));
  if (tien < 0 || tien > 1_000_000_000) return { loi: "Số tiền chưa hợp lệ." };
  if (loai === "thuong" && tien <= 0) return { loi: "Khen thưởng cần số tiền lớn hơn 0." };
  if (!(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  const dong = { nhan_vien_id: nv, ngay_lap: ngay, nam: Number(ngay.slice(0, 4)), thang: Number(ngay.slice(5, 7)), noi_dung: nd_, khoan_chi: loai === "thuong" ? tien : 0, khoan_thu: loai === "phat" ? tien : 0, trang_thai: chuoi(fd, "trang_thai") || "Đã ghi nhận", ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  const db = sb();
  if (id) {
    const { data: cu } = await db.from("hr_thuong_phat").select("nhan_vien_id").eq("id", id).maybeSingle();
    if (!cu || !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id ?? ""))) return { loi: KHONG_DU_QUYEN };
    const { error } = await db.from("hr_thuong_phat").update(dong).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { error } = await db.from("hr_thuong_phat").insert(dong);
    if (error) return { loi: thongBaoLoi(error) };
  }
  revalidatePath("/nhan-su/khen-thuong-ky-luat");
  return { ok: true };
}

export async function xoaKhenKyLuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("hr_thuong_phat").select("nhan_vien_id").eq("id", id).maybeSingle();
  if (!cu || !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id ?? ""))) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("hr_thuong_phat").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/khen-thuong-ky-luat");
  return { ok: true };
}

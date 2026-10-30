"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so, soHoacNull } from "@/lib/form";
import { NGAY_ISO, nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };

/** Khoá học trong lộ trình đào tạo (chức danh trống = áp cho mọi vị trí). Khoá đã có kết quả thì ẩn, không xoá. */
export async function luuKhoaDaoTao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten");
  if (ten.length < 2 || ten.length > 200) return { loi: "Nhập tên khoá học (2 đến 200 ký tự)." };
  const gio = so(fd, "so_gio");
  if (gio < 0 || gio > 999) return { loi: "Số giờ chưa hợp lệ." };
  const dong = { ten, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), thu_tu: Math.round(so(fd, "thu_tu")), so_gio: gio, bat_buoc: bat(fd, "bat_buoc"), mo_ta: chuoiHoacNull(fd, "mo_ta"), hoat_dong: id ? bat(fd, "hoat_dong") : true };
  const { error } = id ? await sb().from("dao_tao_khoa").update(dong).eq("id", id) : await sb().from("dao_tao_khoa").insert(dong);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/dao-tao");
  return { ok: true };
}

/** Kết quả học của một nhân viên ở một khoá (mỗi cặp một bản, ghi lại thì ghi đè). */
export async function luuKetQuaDaoTao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), khoa = chuoi(fd, "khoa_id"), tt = chuoi(fd, "trang_thai"), ngay = chuoi(fd, "ngay_hoc");
  if (!nv || !khoa || !["chua_hoc", "dang_hoc", "dat", "chua_dat"].includes(tt)) return { loi: "Chọn nhân viên, khoá học và trạng thái." };
  if (ngay && !NGAY_ISO.test(ngay)) return { loi: "Ngày học không đúng." };
  const diem = soHoacNull(fd, "diem");
  if (diem !== null && (diem < 0 || diem > 100)) return { loi: "Điểm từ 0 đến 100." };
  if (!(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("dao_tao_ket_qua").upsert({ nhan_vien_id: nv, khoa_id: khoa, trang_thai: tt, ngay_hoc: ngay || null, diem, ghi_chu: chuoiHoacNull(fd, "ghi_chu") }, { onConflict: "nhan_vien_id,khoa_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/dao-tao");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/cai-dat/nhan-vien-phuc-vu"); revalidatePath("/nhan-vien"); return { ok: true }; };
const COT = "ho_ten, chuc_danh, nhom_nv, chi_nhanh_id, dien_thoai, hien_dat_lich, la_phuc_vu";

/** Thêm / sửa nhân viên phục vụ (SalonHero #/operators). Thêm = tạo hồ sơ MỚI không có tài khoản đăng nhập (vai trò Kỹ thuật viên); không đụng đăng nhập, email hay trạng thái làm việc — những thứ đó sửa ở Tài khoản & phân quyền / Hồ sơ nhân sự. Quyền nhanvien.quanly, ghi nhật ký trước/sau. */
export async function luuNhanVienPhucVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { ho_ten: chuoi(fd, "ho_ten"), chuc_danh: chuoiHoacNull(fd, "chuc_danh"), nhom_nv: chuoiHoacNull(fd, "nhom_nv"), chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), hien_dat_lich: bat(fd, "hien_dat_lich") };
  if (!row.ho_ten) return { loi: "Nhập họ tên." };
  if ((row.nhom_nv ?? "").length > 60) return { loi: "Nhóm nhân viên tối đa 60 ký tự." };
  const db = sb();
  const { data: cu } = id ? await db.from("nhan_vien").select(COT).eq("id", id).maybeSingle() : { data: null };
  if (id && !cu) return { loi: "Không tìm thấy nhân viên." };
  const { data: moi, error } = id
    ? await db.from("nhan_vien").update(row).eq("id", id).select("id").single()
    : await db.from("nhan_vien").insert({ ...row, vai_tro: "ktv", la_phuc_vu: true }).select("id").single();
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: id ? "sua_nhan_vien_phuc_vu" : "them_nhan_vien_phuc_vu", doi_tuong: "nhan_vien", doi_tuong_id: moi.id, chi_tiet: { truoc: cu, sau: row } });
  return xong();
}

/** Nút "Xóa" của SalonHero: ở AMIA chỉ BỎ người này khỏi danh sách Nhân viên phục vụ. Hồ sơ nhân sự, tài khoản, hoá đơn, hoa hồng, lịch hẹn giữ nguyên. */
export async function boNhanVienPhucVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("nhan_vien").select(COT).eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy nhân viên." };
  const { error } = await db.from("nhan_vien").update({ la_phuc_vu: false }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "bo_nhan_vien_phuc_vu", doi_tuong: "nhan_vien", doi_tuong_id: id, chi_tiet: { truoc: cu } });
  return xong();
}

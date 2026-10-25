"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull } from "@/lib/form";
import { laVaiTro } from "@/lib/quyen";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/nhan-vien"); return { ok: true }; };
const MK_TOI_THIEU = 8;

export async function taoNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vaiTro = chuoi(fd, "vai_tro");
  if (!laVaiTro(vaiTro)) return { loi: "Chọn vai trò." };
  if (vaiTro === "chu" && nd.vaiTro !== "chu") return { loi: "Chỉ Chủ mới tạo được tài khoản Chủ." };
  const hoTen = chuoi(fd, "ho_ten");
  const email = chuoi(fd, "email").toLowerCase();
  const matKhau = chuoi(fd, "mat_khau");
  if (!hoTen) return { loi: "Nhập họ tên." };
  let userId: string | null = null;
  if (email) {
    if (matKhau.length < MK_TOI_THIEU) return { loi: `Mật khẩu ban đầu tối thiểu ${MK_TOI_THIEU} ký tự.` };
    const { data, error } = await createAdminClient().auth.admin.createUser({ email, password: matKhau, email_confirm: true, app_metadata: { vai_tro: vaiTro }, user_metadata: { ho_ten: hoTen } });
    if (error || !data.user) return { loi: error?.message.includes("registered") ? "Email này đã có tài khoản." : "Không tạo được tài khoản đăng nhập." };
    userId = data.user.id;
  }
  const { error } = await sb().from("nhan_vien").insert({ user_id: userId, ho_ten: hoTen, email: email || null, dien_thoai: chuoiHoacNull(fd, "dien_thoai"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id") });
  if (error) {
    if (userId) await createAdminClient().auth.admin.deleteUser(userId);
    return { loi: thongBaoLoi(error) };
  }
  return xong();
}

export async function suaNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const vaiTro = chuoi(fd, "vai_tro");
  if (!laVaiTro(vaiTro)) return { loi: "Chọn vai trò." };
  const db = sb();
  const { data: cu } = await db.from("nhan_vien").select("user_id, vai_tro").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy nhân viên." };
  if ((vaiTro === "chu" || cu.vai_tro === "chu") && nd.vaiTro !== "chu") return { loi: "Chỉ Chủ mới đổi được tài khoản Chủ." };
  const hoatDong = bat(fd, "hoat_dong");
  if (id === nd.nhanVienId && !hoatDong) return { loi: "Không tự khoá tài khoản của chính mình." };
  const { error } = await db.from("nhan_vien").update({
    ho_ten: chuoi(fd, "ho_ten"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"),
    chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), hoat_dong: hoatDong,
  }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  if (cu.user_id) {
    const a = createAdminClient().auth.admin;
    await a.updateUserById(cu.user_id, { app_metadata: { vai_tro: vaiTro }, ban_duration: hoatDong ? "none" : "876000h" });
  }
  return xong();
}

export async function datLaiMatKhau(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const matKhau = chuoi(fd, "mat_khau");
  if (matKhau.length < MK_TOI_THIEU) return { loi: `Mật khẩu tối thiểu ${MK_TOI_THIEU} ký tự.` };
  const { data: nv } = await sb().from("nhan_vien").select("user_id, vai_tro").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!nv?.user_id) return { loi: "Nhân viên này chưa có tài khoản đăng nhập." };
  if (nv.vai_tro === "chu" && nd.vaiTro !== "chu") return { loi: "Chỉ Chủ mới đặt lại mật khẩu của Chủ." };
  const { error } = await createAdminClient().auth.admin.updateUserById(nv.user_id, { password: matKhau });
  return error ? { loi: "Không đặt lại được mật khẩu." } : xong();
}

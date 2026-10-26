"use server";

import { layNguoiDungHienTai } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { chuoi } from "@/lib/form";
import { sb } from "@/lib/db";

/** Tự đổi mật khẩu: phải nhập đúng mật khẩu hiện tại (chặn người mượn máy đang mở sẵn). */
export async function doiMatKhau(fd: FormData): Promise<{ ok?: true; loi?: string }> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Phiên đăng nhập đã hết. Đăng nhập lại." };
  const cu = chuoi(fd, "mat_khau_cu"), moi = chuoi(fd, "mat_khau_moi");
  if (moi.length < 8) return { loi: "Mật khẩu mới tối thiểu 8 ký tự." };
  if (moi === cu) return { loi: "Mật khẩu mới phải khác mật khẩu cũ." };
  const { error: e1 } = await (await createClient()).auth.signInWithPassword({ email: nd.email, password: cu });
  if (e1) return { loi: "Mật khẩu hiện tại chưa đúng." };
  const { error } = await createAdminClient().auth.admin.updateUserById(nd.userId, { password: moi });
  if (error) return { loi: "Không đổi được mật khẩu. Thử lại." };
  // Đổi mật khẩu thu hồi phiên cũ: đăng nhập lại bằng mật khẩu mới để người dùng không bị văng ra.
  await (await createClient()).auth.signInWithPassword({ email: nd.email, password: moi });
  await sb().from("nhan_vien").update({ phai_doi_mat_khau: false }).eq("id", nd.nhanVienId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Ảnh đại diện: chỉ của chính mình; chỉ nhận JPEG nhỏ đã thu sẵn ở trình duyệt. */
export async function datAnhDaiDien(fd: FormData): Promise<{ ok?: true; loi?: string }> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Phiên đăng nhập đã hết. Đăng nhập lại." };
  const anh = fd.get("xoa") === "1" ? null : chuoi(fd, "anh");
  if (anh !== null && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(anh)) return { loi: "Ảnh không hợp lệ." };
  if (anh && anh.length > 100000) return { loi: "Ảnh quá lớn." };
  const { error } = await sb().from("nhan_vien").update({ anh_dai_dien: anh }).eq("id", nd.nhanVienId);
  if (error) return { loi: "Không lưu được ảnh. Thử lại." };
  revalidatePath("/", "layout");
  return { ok: true };
}

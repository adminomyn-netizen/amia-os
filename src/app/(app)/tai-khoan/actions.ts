"use server";

import { layNguoiDungHienTai } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuoi } from "@/lib/form";

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
  return error ? { loi: "Không đổi được mật khẩu. Thử lại." } : { ok: true };
}

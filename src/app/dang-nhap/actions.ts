"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sb } from "@/lib/db";

export async function dangNhap(_: { loi?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const matKhau = String(formData.get("mat_khau") || "");
  if (!email || !matKhau) return { loi: "Nhập email và mật khẩu." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
  if (error || !data.user) return { loi: "Email hoặc mật khẩu chưa đúng." };
  const { data: nv } = await sb().from("nhan_vien").select("hoat_dong").eq("user_id", data.user.id).maybeSingle();
  if (!nv || !nv.hoat_dong) {
    await supabase.auth.signOut();
    return { loi: "Tài khoản này chưa được cấp quyền dùng phần mềm hoặc đã bị khoá. Nhờ chủ phòng khám kiểm tra." };
  }
  redirect("/");
}

export async function dangXuat() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dang-nhap");
}

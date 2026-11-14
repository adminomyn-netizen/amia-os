"use server";

import { headers } from "next/headers";
import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { loiMatKhauMoi } from "@/lib/mat-khau";

/** Vai trò nắm quyền cao không tự đặt lại khi chưa đăng nhập; đăng nhập rồi thì đổi ở trang Tài khoản. */
const KHONG_TU_DAT_LAI = new Set(["chu", "ky_thuat"]);

/** Chặn dò mật khẩu hàng loạt: mỗi địa chỉ mạng tối đa 5 lần trong 15 phút (bộ nhớ tiến trình). */
const LAN_THU = new Map<string, number[]>();
function quaGioiHan(khoa: string): boolean {
  const bayGio = Date.now();
  const ds = (LAN_THU.get(khoa) ?? []).filter((t) => bayGio - t < 15 * 60_000);
  ds.push(bayGio);
  LAN_THU.set(khoa, ds);
  return ds.length > 5;
}

/**
 * Quên mật khẩu, đặt lại ngay trên giao diện (chị Lâm 14/11/2026: "cho tính năng quên mật khẩu đổi thẳng trên giao diện luôn", "nhập đúng mail là được").
 * Chỉ cho nhân viên đang hoạt động; Chủ/Kỹ thuật không đặt lại kiểu này.
 */
export async function datLaiMatKhau(emailVao: string, moi: string): Promise<{ ok?: true; loi?: string }> {
  const email = emailVao.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { loi: "Email chưa đúng định dạng." };
  const loiMk = loiMatKhauMoi(moi);
  if (loiMk) return { loi: loiMk };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (quaGioiHan(ip)) return { loi: "Thử quá nhiều lần. Đợi 15 phút rồi thử lại." };

  const { data: nv } = await sb().from("nhan_vien").select("id, user_id, vai_tro, hoat_dong").eq("email", email).maybeSingle();
  if (!nv?.hoat_dong || !nv.user_id) return { loi: "Email này chưa có tài khoản đang hoạt động. Kiểm lại email hoặc nhờ quản lý." };
  if (KHONG_TU_DAT_LAI.has(nv.vai_tro)) return { loi: "Tài khoản này không tự đặt lại được ở đây. Nhờ bộ phận Kỹ thuật." };

  const { error } = await createAdminClient().auth.admin.updateUserById(nv.user_id, { password: moi });
  if (error) return { loi: "Không đặt lại được mật khẩu. Thử lại." };
  await sb().from("nhan_vien").update({ phai_doi_mat_khau: false }).eq("id", nv.id);
  console.warn(`[quen-mat-khau] dat lai mat khau nv=${nv.id} ip=${ip}`);
  return { ok: true };
}

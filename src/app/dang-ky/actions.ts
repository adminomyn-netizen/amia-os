"use server";

import { redirect } from "next/navigation";
import { sb, thongBaoLoi } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { coSdtHopLe, chuanSdt } from "@/lib/dinh-dang";

type KQ = { loi?: string } | undefined;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MK_TOI_THIEU = 8;
const TOI_DA_MOT_GIO = 40;

/** Đăng ký tự do (chị Lâm 27/10/2026): tạo tài khoản dùng được ngay, vai trò Nhân viên (chỉ dùng Nơi làm việc); Kỹ thuật chỉnh vai trò sau.
 *  Chống spam: ô bẫy ẩn, giới hạn số tài khoản mới mỗi giờ, công tắc cau_hinh dang_ky.mo. */
export async function dangKyTaiKhoan(_: KQ, fd: FormData): Promise<KQ> {
  if (String(fd.get("website") ?? "") !== "") return { loi: "Chưa gửi được. Vui lòng thử lại." };
  const hoTen = String(fd.get("ho_ten") ?? "").trim(), email = String(fd.get("email") ?? "").trim().toLowerCase();
  const sdt = chuanSdt(String(fd.get("dien_thoai") ?? "")), cn = String(fd.get("chi_nhanh_id") ?? ""), mk = String(fd.get("mat_khau") ?? ""), mk2 = String(fd.get("mat_khau2") ?? "");
  if (hoTen.length < 2 || hoTen.length > 100) return { loi: "Nhập họ tên (2 đến 100 ký tự)." };
  if (!EMAIL.test(email) || email.length > 160) return { loi: "Email chưa đúng định dạng." };
  if (!coSdtHopLe(sdt)) return { loi: "Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số)." };
  if (mk.length < MK_TOI_THIEU || mk.length > 72) return { loi: `Mật khẩu tối thiểu ${MK_TOI_THIEU} ký tự.` };
  if (mk !== mk2) return { loi: "Hai mật khẩu chưa giống nhau." };
  const db = sb();
  const [{ data: mo }, { data: c }, { count }] = await Promise.all([
    db.from("cau_hinh").select("gia_tri").eq("khoa", "dang_ky.mo").maybeSingle(),
    db.from("chi_nhanh").select("id").eq("id", cn).eq("hoat_dong", true).maybeSingle(),
    db.from("nhan_vien").select("id", { count: "exact", head: true }).eq("vai_tro", "nhan_vien").gte("tao_luc", new Date(Date.now() - 3600_000).toISOString()),
  ]);
  if ((mo?.gia_tri ?? "1") === "0") return { loi: "Hiện chưa mở đăng ký. Vui lòng liên hệ bộ phận Kỹ thuật." };
  if (!c) return { loi: "Chọn chi nhánh làm việc." };
  if ((count ?? 0) >= TOI_DA_MOT_GIO) return { loi: "Có quá nhiều đăng ký trong một giờ. Vui lòng thử lại sau hoặc liên hệ bộ phận Kỹ thuật." };
  const { data, error } = await createAdminClient().auth.admin.createUser({ email, password: mk, email_confirm: true, app_metadata: { vai_tro: "nhan_vien" }, user_metadata: { ho_ten: hoTen } });
  if (error || !data.user) return { loi: error?.message.includes("registered") ? "Email này đã có tài khoản. Hãy đăng nhập." : "Chưa tạo được tài khoản. Vui lòng thử lại." };
  const { error: e2 } = await db.from("nhan_vien").insert({ user_id: data.user.id, ho_ten: hoTen, email, dien_thoai: sdt, vai_tro: "nhan_vien", chi_nhanh_id: c.id, phai_doi_mat_khau: false });
  if (e2) {
    await createAdminClient().auth.admin.deleteUser(data.user.id);
    return { loi: thongBaoLoi(e2) };
  }
  redirect("/dang-nhap?dk=1");
}

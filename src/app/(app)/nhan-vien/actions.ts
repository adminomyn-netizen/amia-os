"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so } from "@/lib/form";
import { laVaiTro, NHOM_QUYEN } from "@/lib/quyen";
import { MK_MAC_DINH } from "@/lib/mat-khau";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/nhan-vien"); return { ok: true }; };
const MK_TOI_THIEU = 8;

export async function taoNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vaiTro = chuoi(fd, "vai_tro");
  if (!laVaiTro(vaiTro)) return { loi: "Chọn vai trò." };
  const hoTen = chuoi(fd, "ho_ten");
  const email = chuoi(fd, "email").toLowerCase();
  const matKhau = chuoi(fd, "mat_khau") || MK_MAC_DINH;
  if (!hoTen) return { loi: "Nhập họ tên." };
  let userId: string | null = null;
  if (email) {
    if (matKhau.length < MK_TOI_THIEU) return { loi: `Mật khẩu ban đầu tối thiểu ${MK_TOI_THIEU} ký tự.` };
    const { data, error } = await createAdminClient().auth.admin.createUser({ email, password: matKhau, email_confirm: true, app_metadata: { vai_tro: vaiTro }, user_metadata: { ho_ten: hoTen } });
    if (error || !data.user) return { loi: error?.message.includes("registered") ? "Email này đã có tài khoản." : "Không tạo được tài khoản đăng nhập." };
    userId = data.user.id;
  }
  const { error } = await sb().from("nhan_vien").insert({ user_id: userId, ho_ten: hoTen, email: email || null, dien_thoai: chuoiHoacNull(fd, "dien_thoai"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), phai_doi_mat_khau: !!userId });
  if (error) {
    if (userId) await createAdminClient().auth.admin.deleteUser(userId);
    return { loi: thongBaoLoi(error) };
  }
  return xong();
}

export async function suaNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const vaiTro = chuoi(fd, "vai_tro");
  if (!laVaiTro(vaiTro)) return { loi: "Chọn vai trò." };
  const db = sb();
  const { data: cu } = await db.from("nhan_vien").select("user_id, vai_tro").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy nhân viên." };
  const hoatDong = bat(fd, "hoat_dong");
  if (id === nd.nhanVienId && !hoatDong) return { loi: "Không tự khoá tài khoản của chính mình." };
  const { error } = await db.from("nhan_vien").update({
    ho_ten: chuoi(fd, "ho_ten"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"),
    chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), hoat_dong: hoatDong,
    chuc_danh_tai_chinh: chuoiHoacNull(fd, "chuc_danh_tai_chinh"), han_muc_duyet: chuoiHoacNull(fd, "han_muc_duyet") === null ? null : Math.max(0, Math.round(so(fd, "han_muc_duyet"))),
  }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  if (cu.user_id) {
    const a = createAdminClient().auth.admin;
    await a.updateUserById(cu.user_id, { app_metadata: { vai_tro: vaiTro }, ban_duration: hoatDong ? "none" : "876000h" });
  }
  return xong();
}

export async function datLaiMatKhau(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const matKhau = chuoi(fd, "mat_khau");
  if (matKhau.length < MK_TOI_THIEU) return { loi: `Mật khẩu tối thiểu ${MK_TOI_THIEU} ký tự.` };
  const { data: nv } = await sb().from("nhan_vien").select("user_id, vai_tro").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!nv?.user_id) return { loi: "Nhân viên này chưa có tài khoản đăng nhập." };
  const { error } = await createAdminClient().auth.admin.updateUserById(nv.user_id, { password: matKhau });
  if (error) return { loi: "Không đặt lại được mật khẩu." };
  await sb().from("nhan_vien").update({ phai_doi_mat_khau: true }).eq("id", chuoi(fd, "id"));
  return xong();
}

/** Kỹ thuật chọn đúng các tính năng một người được dùng. `mac_dinh=1` trả về quyền mặc định của vai trò. */
export async function datQuyen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const { data: nv } = await sb().from("nhan_vien").select("vai_tro").eq("id", id).maybeSingle();
  if (!nv) return { loi: "Không tìm thấy nhân viên." };
  if (nv.vai_tro === "ky_thuat") return { loi: "Kỹ thuật luôn có đủ mọi quyền, không chỉnh được." };
  const hopLe = new Set(NHOM_QUYEN.flatMap((g) => g.muc.map((m) => m.ma as string)));
  const chon = bat(fd, "mac_dinh") ? null : [...new Set(mang(fd, "quyen"))].filter((q) => hopLe.has(q));
  const { error } = await sb().from("nhan_vien").update({ quyen_rieng: chon }).eq("id", id);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Xoá hồ sơ nhân viên (chỉ Kỹ thuật). Người đã gắn với hoá đơn, lịch, phiếu cấp, hoa hồng... bị DB chặn → hướng dẫn khoá tài khoản thay vì xoá. Không tự xoá mình, không xoá Kỹ thuật. */
export async function xoaNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (id === nd.nhanVienId) return { loi: "Không tự xoá chính mình." };
  const db = sb();
  const { data: nv } = await db.from("nhan_vien").select("user_id, vai_tro").eq("id", id).maybeSingle();
  if (!nv) return { loi: "Không tìm thấy nhân viên." };
  if (nv.vai_tro === "ky_thuat") return { loi: "Không xoá được tài khoản Kỹ thuật." };
  const { error } = await db.from("nhan_vien").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { loi: "Nhân viên này đã có dữ liệu liên quan (hoá đơn, lịch hẹn, phiếu cấp, hoa hồng...) nên không xoá được. Hãy bấm Sửa rồi tắt \"Đang làm việc\" để khoá." };
    return { loi: thongBaoLoi(error) };
  }
  if (nv.user_id) await createAdminClient().auth.admin.deleteUser(nv.user_id);
  return xong();
}

/** Duyệt yêu cầu đăng ký (trang /dang-ky): tạo tài khoản với mật khẩu mặc định (buộc đổi ở lần đầu) rồi đánh dấu đã duyệt. Giành quyền xử lý trước để hai người bấm cùng lúc không tạo hai lần. */
export async function duyetYeuCauTaiKhoan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vaiTro = chuoi(fd, "vai_tro");
  if (!laVaiTro(vaiTro)) return { loi: "Chọn vai trò cho tài khoản." };
  const id = chuoi(fd, "id");
  const { data: yc } = await sb().from("yeu_cau_tai_khoan").update({ trang_thai: "da_duyet", nguoi_xu_ly_id: nd.nhanVienId, xu_ly_luc: new Date().toISOString() }).eq("id", id).eq("trang_thai", "cho_duyet").select("*").maybeSingle();
  if (!yc) return { loi: "Yêu cầu đã được xử lý hoặc không còn." };
  const tao = new FormData();
  tao.set("ho_ten", yc.ho_ten); tao.set("email", yc.email); tao.set("dien_thoai", yc.dien_thoai ?? ""); tao.set("vai_tro", vaiTro);
  tao.set("chuc_danh", yc.vi_tri ?? ""); tao.set("chi_nhanh_id", yc.chi_nhanh_id ?? "");
  const kq = await taoNhanVien(tao);
  if (kq.loi) {
    await sb().from("yeu_cau_tai_khoan").update({ trang_thai: "cho_duyet", nguoi_xu_ly_id: null, xu_ly_luc: null }).eq("id", id);
    return kq;
  }
  return xong();
}

export async function tuChoiYeuCauTaiKhoan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data } = await sb().from("yeu_cau_tai_khoan").update({ trang_thai: "tu_choi", nguoi_xu_ly_id: nd.nhanVienId, xu_ly_luc: new Date().toISOString(), ly_do: chuoiHoacNull(fd, "ly_do") }).eq("id", chuoi(fd, "id")).eq("trang_thai", "cho_duyet").select("id");
  if (!data?.length) return { loi: "Yêu cầu đã được xử lý hoặc không còn." };
  return xong();
}

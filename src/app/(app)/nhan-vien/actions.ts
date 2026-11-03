"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so } from "@/lib/form";
import { laVaiTro, NHOM_QUYEN } from "@/lib/quyen";
import { MK_MAC_DINH } from "@/lib/mat-khau";
import { vaiGanTheoChiNhanh } from "@/lib/vai-chi-nhanh";
import { TIEN_TO_VAI_CN } from "./truong-chi-nhanh";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/nhan-vien"); revalidatePath("/cai-dat/tai-khoan-dang-nhap"); return { ok: true }; };

/** Ghi "Quyền chi nhánh" (vai trò theo từng chi nhánh, bảng nhan_vien_chi_nhanh) từ các ô vai_cn_<chi nhánh>.
 *  Người "Mọi chi nhánh" hoặc Chủ / Kỹ thuật: xoá hết dòng thêm (họ dùng hồ sơ chính). Chi nhánh chính bỏ qua (dùng ô Vai trò).
 *  Biểu mẫu không gửi ô nào (form khác gọi tới) thì giữ nguyên. Chỉ nhận chi nhánh có thật, vai hợp lệ. */
async function luuVaiTheoChiNhanh(nvId: string, cnChinh: string | null, vaiChinh: string, fd: FormData, nguoiSua: string): Promise<string | null> {
  const db = sb();
  const coO = [...fd.keys()].some((k) => k.startsWith(TIEN_TO_VAI_CN));
  if (!cnChinh || !vaiGanTheoChiNhanh(vaiChinh)) {
    const { error } = await db.from("nhan_vien_chi_nhanh").delete().eq("nhan_vien_id", nvId);
    return error ? thongBaoLoi(error) : null;
  }
  if (!coO) return null;
  const { data: cn } = await db.from("chi_nhanh").select("id");
  const muon = (cn ?? []).filter((c) => c.id !== cnChinh).map((c) => ({ chi_nhanh_id: c.id, vai_tro: chuoi(fd, `${TIEN_TO_VAI_CN}${c.id}`) })).filter((g) => fd.has(`${TIEN_TO_VAI_CN}${g.chi_nhanh_id}`));
  const bo = muon.filter((g) => !vaiGanTheoChiNhanh(g.vai_tro)).map((g) => g.chi_nhanh_id).concat(cnChinh);
  const giu = muon.filter((g) => vaiGanTheoChiNhanh(g.vai_tro));
  const { error: e1 } = await db.from("nhan_vien_chi_nhanh").delete().eq("nhan_vien_id", nvId).in("chi_nhanh_id", bo);
  if (e1) return thongBaoLoi(e1);
  if (giu.length) {
    const { error: e2 } = await db.from("nhan_vien_chi_nhanh").upsert(giu.map((g) => ({ nhan_vien_id: nvId, chi_nhanh_id: g.chi_nhanh_id, vai_tro: g.vai_tro, nguoi_sua_id: nguoiSua, cap_nhat_luc: new Date().toISOString() })), { onConflict: "nhan_vien_id,chi_nhanh_id" });
    if (e2) return thongBaoLoi(e2);
  }
  return null;
}
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
  const cnChinh = chuoiHoacNull(fd, "chi_nhanh_id");
  const { data: moi, error } = await sb().from("nhan_vien").insert({ user_id: userId, ho_ten: hoTen, email: email || null, dien_thoai: chuoiHoacNull(fd, "dien_thoai"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), chi_nhanh_id: cnChinh, phai_doi_mat_khau: !!userId }).select("id").single();
  if (error || !moi) {
    if (userId) await createAdminClient().auth.admin.deleteUser(userId);
    return { loi: error ? thongBaoLoi(error) : "Không tạo được hồ sơ." };
  }
  const loiCn = await luuVaiTheoChiNhanh(moi.id, cnChinh, vaiTro, fd, nd.nhanVienId);
  if (loiCn) return { loi: `Đã tạo người dùng nhưng chưa lưu được quyền chi nhánh: ${loiCn}` };
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
  const ttLam = ["dang_lam", "tam_nghi", "nghi_viec", "khoa"].includes(chuoi(fd, "trang_thai_lam")) ? chuoi(fd, "trang_thai_lam") : "dang_lam";
  const khung = ["van_phong", "chi_nhanh", "khong_cham_cong"].includes(chuoi(fd, "khung_lam_viec")) ? chuoi(fd, "khung_lam_viec") : "chi_nhanh";
  // Nghỉ việc / khoá = không đăng nhập được (khoá thay cho xoá).
  const hoatDong = bat(fd, "hoat_dong") && ttLam !== "nghi_viec" && ttLam !== "khoa";
  const ttLuu = !bat(fd, "hoat_dong") && ttLam === "dang_lam" ? "khoa" : ttLam;
  if (id === nd.nhanVienId && !hoatDong) return { loi: "Không tự khoá tài khoản của chính mình." };
  const { error } = await db.from("nhan_vien").update({
    ho_ten: chuoi(fd, "ho_ten"), vai_tro: vaiTro, chuc_danh: chuoiHoacNull(fd, "chuc_danh"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"),
    chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), hoat_dong: hoatDong,
    trang_thai_lam: ttLuu, khung_lam_viec: khung, ngay_vao_lam: chuoiHoacNull(fd, "ngay_vao_lam"), ngay_vao_chinh_thuc: chuoiHoacNull(fd, "ngay_vao_chinh_thuc"), vai_tro_chuyen_mon: mang(fd, "vai_tro_chuyen_mon"),
    chuc_danh_tai_chinh: chuoiHoacNull(fd, "chuc_danh_tai_chinh"), han_muc_duyet: chuoiHoacNull(fd, "han_muc_duyet") === null ? null : Math.max(0, Math.round(so(fd, "han_muc_duyet"))),
  }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  const loiCn = await luuVaiTheoChiNhanh(id, chuoiHoacNull(fd, "chi_nhanh_id"), vaiTro, fd, nd.nhanVienId);
  if (loiCn) return { loi: `Đã lưu hồ sơ nhưng chưa lưu được quyền chi nhánh: ${loiCn}` };
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
  if (nv.vai_tro === "ky_thuat" || nv.vai_tro === "chu") return { loi: `${nv.vai_tro === "chu" ? "Chủ" : "Kỹ thuật"} luôn có đủ mọi quyền, không chỉnh được.` };
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
  if (nv.vai_tro === "ky_thuat" || nv.vai_tro === "chu") return { loi: "Không xoá được tài khoản Chủ / Kỹ thuật." };
  const { error } = await db.from("nhan_vien").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { loi: "Nhân viên này đã có dữ liệu liên quan (hoá đơn, lịch hẹn, phiếu cấp, hoa hồng...) nên không xoá được. Hãy bấm Sửa rồi tắt \"Đang làm việc\" để khoá." };
    return { loi: thongBaoLoi(error) };
  }
  if (nv.user_id) await createAdminClient().auth.admin.deleteUser(nv.user_id);
  return xong();
}

/** Công tắc đăng ký tự do ở /dang-ky (cau_hinh dang_ky.mo). Chỉ Kỹ thuật. */
export async function datDangKyTuDo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("cau_hinh").upsert({ khoa: "dang_ky.mo", gia_tri: chuoi(fd, "mo") === "1" ? "1" : "0", ghi_chu: "Cho phép người mới tự đăng ký tại /dang-ky (vai trò Nhân viên, dùng được ngay). 0 = tắt." }, { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  return xong();
}

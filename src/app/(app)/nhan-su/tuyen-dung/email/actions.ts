"use server";

import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi } from "@/lib/form";
import { emailHopLe, maHoaThu } from "@/lib/email-tuyen-dung";
import { biMatThu, guiBangGmail } from "@/lib/email-tuyen-dung-gui";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/nhan-su/tuyen-dung/email");

/** Kết nối Gmail: nhập địa chỉ Gmail và "mật khẩu ứng dụng" 16 ký tự (tạo ở tài khoản Google, bật xác minh 2 bước). Thử đăng nhập trước khi lưu. Chỉ tài khoản không gắn chi nhánh. */
export async function ketNoiGmail(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd || nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const email = chuoi(fd, "email").toLowerCase(), mk = chuoi(fd, "mat_khau").replace(/\s+/g, "");
  if (!emailHopLe(email) || !/@(gmail|googlemail)\.com$/.test(email)) return { loi: "Nhập đúng địa chỉ Gmail." };
  if (mk.length !== 16) return { loi: "Mật khẩu ứng dụng gồm 16 ký tự (không phải mật khẩu đăng nhập Gmail)." };
  if (!biMatThu()) return { loi: "Máy chủ chưa có khoá để mã hoá, báo kỹ thuật." };
  try {
    await nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: email, pass: mk } }).verify();
  } catch { return { loi: "Gmail không nhận mật khẩu này. Kiểm tra lại mật khẩu ứng dụng và xác minh 2 bước." }; }
  const { error } = await sb().from("thu_ket_noi").upsert({ id: true, email, mat_khau_ma_hoa: maHoaThu(mk, biMatThu()), nguoi_id: nd.nhanVienId ?? null, sua_luc: new Date().toISOString() });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function ngatGmail(): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd || nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("thu_ket_noi").delete().eq("id", true);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Sửa mẫu thư và bật/tắt tự gửi theo bước. */
export async function luuMauThu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd || nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const ma = chuoi(fd, "ma"), tieuDe = chuoi(fd, "tieu_de"), noiDung = chuoi(fd, "noi_dung");
  if (tieuDe.length < 2 || tieuDe.length > 200 || noiDung.length < 2 || noiDung.length > 5000) return { loi: "Nhập tiêu đề (2 đến 200 ký tự) và nội dung (2 đến 5000 ký tự)." };
  const { error } = await sb().from("tuyen_dung_mau_thu").update({ tieu_de: tieuDe, noi_dung: noiDung, tu_gui: bat(fd, "tu_gui"), hoat_dong: bat(fd, "hoat_dong"), sua_luc: new Date().toISOString() }).eq("ma", ma);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Gửi một thư đang chờ ngay bây giờ (hoặc gửi lại thư lỗi). */
export async function guiThuTrongHangDoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: t } = await db.from("tuyen_dung_hang_doi_thu").select("*").eq("id", id).maybeSingle();
  if (!t || !["cho_gui", "loi"].includes(t.trang_thai)) return { loi: "Thư này không còn ở trạng thái chờ gửi." };
  if (t.ung_vien_id) {
    const { data: uv } = await db.from("ung_vien").select("tin_id").eq("id", t.ung_vien_id).maybeSingle();
    const { data: tin } = uv ? await db.from("tin_tuyen_dung").select("chi_nhanh_id").eq("id", uv.tin_id).maybeSingle() : { data: null };
    if (nd.chiNhanhId && tin?.chi_nhanh_id && tin.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  }
  const loi = await guiBangGmail(t.den_email, t.tieu_de, t.noi_dung);
  await db.from("tuyen_dung_hang_doi_thu").update(loi ? { trang_thai: "loi", loi } : { trang_thai: "da_gui", loi: null, gui_luc: new Date().toISOString() }).eq("id", id);
  lamMoi();
  return loi ? { loi } : { ok: true };
}

export async function huyThuTrongHangDoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("tuyen_dung_hang_doi_thu").update({ trang_thai: "huy" }).eq("id", chuoi(fd, "id")).in("trang_thai", ["cho_gui", "loi"]);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

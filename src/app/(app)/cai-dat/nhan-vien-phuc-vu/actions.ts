"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/cai-dat/nhan-vien-phuc-vu"); revalidatePath("/nhan-vien"); return { ok: true }; };
const COT = "ho_ten, chuc_danh, nhom_nv, chi_nhanh_id, dien_thoai, hien_dat_lich, la_phuc_vu, email, hoat_dong, trang_thai_lam, user_id";

/** Thêm / sửa nhân viên phục vụ (SalonHero #/operators). Thêm = tạo hồ sơ MỚI không có tài khoản đăng nhập (vai trò Kỹ thuật viên).
 *  Email và Trạng thái (Hoạt động / Tạm dừng) chỉ sửa được ở đây với người CHƯA có tài khoản đăng nhập: với người đã có tài khoản, email là email đăng nhập và tạm dừng là khoá đăng nhập, nên sửa ở Tài khoản & phân quyền.
 *  Quyền nhanvien.quanly, ghi nhật ký trước/sau. */
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
  const moKhoa = !cu?.user_id; // chưa có tài khoản đăng nhập
  const mo: { email?: string | null; hoat_dong?: boolean; trang_thai_lam?: string } = {};
  if (moKhoa && fd.has("email")) {
    const email = chuoi(fd, "email").toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { loi: "Email chưa đúng dạng (vd ten@congty.vn)." };
    if (email) {
      const { data: trung } = await db.from("nhan_vien").select("id, ho_ten").ilike("email", email).neq("id", id || "00000000-0000-0000-0000-000000000000").limit(1);
      if (trung?.length) return { loi: `Email này đã gắn cho ${trung[0].ho_ten}.` };
    }
    mo.email = email || null;
  }
  if (moKhoa && fd.has("trang_thai")) {
    const tamDung = chuoi(fd, "trang_thai") === "tam_dung", tt = cu?.trang_thai_lam ?? "dang_lam";
    if (!tamDung && (tt === "nghi_viec" || tt === "khoa")) return { loi: "Người này đã nghỉ việc hoặc bị khoá. Mở lại ở mục Nhân viên (Tài khoản & phân quyền)." };
    mo.hoat_dong = !tamDung;
    mo.trang_thai_lam = tamDung ? (tt === "dang_lam" ? "tam_nghi" : tt) : (tt === "tam_nghi" ? "dang_lam" : tt);
  }
  const { data: moi, error } = id
    ? await db.from("nhan_vien").update({ ...row, ...mo }).eq("id", id).select("id").single()
    : await db.from("nhan_vien").insert({ ...row, ...mo, vai_tro: "ktv", la_phuc_vu: true }).select("id").single();
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: id ? "sua_nhan_vien_phuc_vu" : "them_nhan_vien_phuc_vu", doi_tuong: "nhan_vien", doi_tuong_id: moi.id, chi_tiet: { truoc: cu, sau: { ...row, ...mo } } });
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

/** Ảnh đại diện của nhân viên phục vụ (hộp Sửa): cùng quy tắc với ảnh đại diện cá nhân, chỉ nhận JPEG nhỏ đã cắt vuông ở trình duyệt. */
export async function datAnhNhanVienPhucVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const anh = fd.get("xoa") === "1" ? null : chuoi(fd, "anh");
  if (anh !== null && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(anh)) return { loi: "Ảnh không hợp lệ." };
  if (anh && anh.length > 100000) return { loi: "Ảnh quá lớn." };
  const db = sb();
  const { data: cu } = await db.from("nhan_vien").select("id").eq("id", id).eq("la_phuc_vu", true).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy nhân viên." };
  const { error } = await db.from("nhan_vien").update({ anh_dai_dien: anh }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_nhan_vien_phuc_vu", doi_tuong: "nhan_vien", doi_tuong_id: id, chi_tiet: { anh_dai_dien: anh ? "doi" : "go" } });
  return xong();
}

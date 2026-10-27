"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const NGAY_TRONG_TUAN = ["t2", "t3", "t4", "t5", "t6", "t7", "cn"];
const GIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function luuThongTinChung(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const mo = chuoi(fd, "gio_mo"), dong = chuoi(fd, "gio_dong");
  if (!GIO.test(mo) || !GIO.test(dong)) return { loi: "Giờ mở/đóng cửa nhập dạng 08:00." };
  if (mo >= dong) return { loi: "Giờ đóng cửa phải sau giờ mở cửa." };
  const ten = chuoi(fd, "ten_thuong_hieu");
  if (!ten) return { loi: "Nhập tên thương hiệu." };
  const { error } = await sb().from("cua_hang").update({
    ten_thuong_hieu: ten, ten_phap_nhan: chuoiHoacNull(fd, "ten_phap_nhan"), ma_so_thue: chuoiHoacNull(fd, "ma_so_thue"),
    dia_chi: chuoiHoacNull(fd, "dia_chi"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), email: chuoiHoacNull(fd, "email"), website: chuoiHoacNull(fd, "website"),
    gio_lam_viec: { mo, dong, nghi: mang(fd, "nghi").filter((x) => NGAY_TRONG_TUAN.includes(x)) }, cap_nhat_luc: new Date().toISOString(),
  }).eq("id", 1);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat/thong-tin-chung");
  return { ok: true };
}

export async function luuNganHang(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    ngan_hang: chuoi(fd, "ngan_hang"), so_tai_khoan: chuoi(fd, "so_tai_khoan").replace(/\s/g, ""), chu_tai_khoan: chuoi(fd, "chu_tai_khoan").toUpperCase(),
    chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), hoat_dong: bat(fd, "hoat_dong"),
  };
  if (!row.ngan_hang || !row.so_tai_khoan || !row.chu_tai_khoan) return { loi: "Nhập ngân hàng, số tài khoản và chủ tài khoản." };
  if (!/^\d{6,20}$/.test(row.so_tai_khoan)) return { loi: "Số tài khoản chỉ gồm chữ số (6–20 số)." };
  const { error } = id ? await sb().from("tai_khoan_ngan_hang").update(row).eq("id", id) : await sb().from("tai_khoan_ngan_hang").insert(row);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat/ngan-hang");
  return { ok: true };
}

export async function luuBangTin(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    tieu_de: chuoi(fd, "tieu_de"), noi_dung: chuoi(fd, "noi_dung"), ghim: bat(fd, "ghim"), hoat_dong: bat(fd, "hoat_dong"),
    hien_tu: chuoi(fd, "hien_tu") || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }), hien_den: chuoiHoacNull(fd, "hien_den"),
  };
  if (!row.tieu_de || !row.noi_dung) return { loi: "Nhập tiêu đề và nội dung." };
  if (row.hien_den && row.hien_den < row.hien_tu) return { loi: "Ngày kết thúc phải sau ngày bắt đầu." };
  const { error } = id ? await sb().from("bang_tin").update(row).eq("id", id) : await sb().from("bang_tin").insert({ ...row, tao_boi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat/bang-tin");
  revalidatePath("/trang-chu");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so, soHoacNull } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/kho");

export async function nhapKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const sl = so(fd, "so_luong");
  if (!(sl > 0)) return { loi: "Số lượng nhập phải lớn hơn 0." };
  const tong = soHoacNull(fd, "tong_tien");
  const donGia = tong != null && tong > 0 ? tong / sl : null;
  const { error } = await db.from("kho_so_cai").insert({ chi_nhanh_id: chuoi(fd, "chi_nhanh_id"), san_pham_id: chuoi(fd, "san_pham_id"), loai: "nhap", so_luong: sl, don_gia: donGia, so_lo: chuoiHoacNull(fd, "so_lo"), han_dung: chuoiHoacNull(fd, "han_dung"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  if (donGia != null) await db.from("san_pham").update({ gia_nhap_don_vi: donGia }).eq("id", chuoi(fd, "san_pham_id"));
  lamMoi();
  return { ok: true };
}

/** Kiểm kê: nhập số đếm thật, hệ thống ghi dòng chênh lệch (thừa/thiếu) vào sổ kho. */
export async function kiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const cn = chuoi(fd, "chi_nhanh_id"), spId = chuoi(fd, "san_pham_id");
  const that = so(fd, "so_thuc_te");
  if (chuoi(fd, "so_thuc_te") === "" || that < 0) return { loi: "Nhập số đếm thực tế (0 nếu hết)." };
  const { data: ton } = await db.rpc("ton_kho", { p_chi_nhanh: cn, p_san_pham: spId });
  const lech = that - Number(ton ?? 0);
  if (lech === 0) { lamMoi(); return { ok: true }; }
  const { error } = await db.from("kho_so_cai").insert({ chi_nhanh_id: cn, san_pham_id: spId, loai: "kiem_ke", so_luong: lech, ghi_chu: chuoiHoacNull(fd, "ghi_chu") ?? `Kiểm kê: sổ ${ton}, thực tế ${that}`, nguoi_id: nd.nhanVienId });
  lamMoi();
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

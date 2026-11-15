"use server";

import { revalidatePath, updateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so } from "@/lib/form";
import { MA_QUOC_GIA } from "@/lib/quoc-gia";

type KQ = { ok?: true; loi?: string };
const XONG = (): KQ => { updateTag("chi-nhanh"); revalidatePath("/cai-dat/chi-nhanh"); revalidatePath("/dat-lich"); revalidatePath("/danh-muc"); return { ok: true }; };
const COT = "ma, ten, mo_ta, dien_thoai, dia_chi, thanh_pho, phuong_quan, quoc_gia, hien_dat_lich, hoat_dong, thu_tu";

/** Thêm / sửa chi nhánh theo hộp "Sửa thông tin chi nhánh" của SalonHero. Quyền như cũ (nhanvien.quanly = Sửa chi nhánh); nhật ký ghi giá trị trước và sau. */
export async function luuChiNhanhCaiDat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), mo_ta: chuoiHoacNull(fd, "mo_ta"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), dia_chi: chuoiHoacNull(fd, "dia_chi"),
    thanh_pho: chuoiHoacNull(fd, "thanh_pho"), phuong_quan: chuoiHoacNull(fd, "phuong_quan"), quoc_gia: (chuoi(fd, "quoc_gia") || "VN").toUpperCase(), hien_dat_lich: chuoi(fd, "hien_dat_lich") !== "an", hoat_dong: bat(fd, "hoat_dong"), thu_tu: so(fd, "thu_tu") || 100,
  };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên chi nhánh." };
  if (!row.dia_chi) return { loi: "Nhập địa chỉ chi nhánh." };
  if (!MA_QUOC_GIA.has(row.quoc_gia)) return { loi: "Chọn quốc gia trong danh sách." };
  if ((row.mo_ta ?? "").length > 500) return { loi: "Mô tả tối đa 500 ký tự." };
  const db = sb();
  const { data: cu } = id ? await db.from("chi_nhanh").select(COT).eq("id", id).maybeSingle() : { data: null };
  if (id && !cu) return { loi: "Không có chi nhánh này." };
  const { data: moi, error } = id ? await db.from("chi_nhanh").update(row).eq("id", id).select("id").single() : await db.from("chi_nhanh").insert(row).select("id").single();
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: id ? "sua_chi_nhanh" : "them_chi_nhanh", doi_tuong: "chi_nhanh", doi_tuong_id: moi.id, chi_tiet: { truoc: cu, sau: row } });
  return XONG();
}

/** Xoá chi nhánh: chi nhánh đã có hoá đơn, thẻ, kho, lịch hẹn... bị khoá ngoại chặn ở DB → hướng người dùng tắt "Đang hoạt động". */
export async function xoaChiNhanhCaiDat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("chi_nhanh").select(COT).eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không có chi nhánh này." };
  const { error } = await db.from("chi_nhanh").delete().eq("id", id);
  if (error?.code === "23503") return { loi: "Chi nhánh này đã có hoá đơn, thẻ, kho hay lịch hẹn nên không xoá được. Hãy Sửa và tắt \"Đang hoạt động\" để ngừng dùng." };
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xoa_chi_nhanh", doi_tuong: "chi_nhanh", doi_tuong_id: id, chi_tiet: { truoc: cu } });
  return XONG();
}

/** SalonHero "Đóng tạm thời" / "Đóng vĩnh viễn" chi nhánh (rà nút 15/11/2026), AMIA không thêm cột mới:
 *  tam = ẩn khỏi web đặt lịch, vẫn hoạt động (vẫn bán, xem lịch cũ) · vinh_vien = tắt hoạt động + ẩn web đặt lịch (dữ liệu giữ nguyên) · mo_lai = bật lại cả hai. Ghi nhật ký trước/sau. */
export async function dongChiNhanh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), kieu = chuoi(fd, "kieu");
  const doi = kieu === "tam" ? { hien_dat_lich: false } : kieu === "vinh_vien" ? { hien_dat_lich: false, hoat_dong: false } : kieu === "mo_lai" ? { hien_dat_lich: true, hoat_dong: true } : null;
  if (!doi) return { loi: "Thao tác không hợp lệ." };
  const db = sb();
  const { data: cu } = await db.from("chi_nhanh").select("id, hien_dat_lich, hoat_dong").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không có chi nhánh này." };
  const { error } = await db.from("chi_nhanh").update(doi).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: `dong_chi_nhanh_${kieu}`, doi_tuong: "chi_nhanh", doi_tuong_id: id, chi_tiet: { truoc: cu, sau: doi } });
  return XONG();
}

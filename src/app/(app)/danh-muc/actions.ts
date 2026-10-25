"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import type { TablesInsert } from "@/lib/supabase/database.types";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/danh-muc"); return { ok: true }; };

export async function luuNhomDichVu(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { ten: chuoi(fd, "ten"), thu_tu: so(fd, "thu_tu") };
  if (!row.ten) return { loi: "Nhập tên nhóm." };
  const { error } = id ? await sb().from("dich_vu_nhom").update(row).eq("id", id) : await sb().from("dich_vu_nhom").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuDichVu(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row: TablesInsert<"dich_vu"> = {
    ma: chuoi(fd, "ma").toUpperCase(), nhom_id: chuoi(fd, "nhom_id"), ten: chuoi(fd, "ten"), don_vi_tinh: chuoi(fd, "don_vi_tinh") || "buổi",
    thoi_luong_phut: so(fd, "thoi_luong_phut") || 60, gia: so(fd, "gia"), gia_von: so(fd, "gia_von"), vat_pct: so(fd, "vat_pct"), hoat_dong: bat(fd, "hoat_dong"),
  };
  if (!row.ma || !row.ten || !row.nhom_id) return { loi: "Nhập mã, tên và chọn nhóm dịch vụ." };
  const { error } = id ? await sb().from("dich_vu").update(row).eq("id", id) : await sb().from("dich_vu").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuGoiThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const loai = chuoi(fd, "loai") === "tien" ? "tien" : "lan";
  const row: TablesInsert<"goi_the"> = {
    ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), loai, gia: so(fd, "gia"),
    so_buoi: loai === "lan" ? so(fd, "so_buoi") || null : null,
    gia_tri_the: loai === "tien" ? so(fd, "gia_tri_the") || null : null,
    han_dung_ngay: soHoacNull(fd, "han_dung_ngay") || null, hoat_dong: bat(fd, "hoat_dong"),
  };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên gói." };
  if (loai === "lan" && !row.so_buoi) return { loi: "Thẻ liệu trình bắt buộc nhập số buổi." };
  if (loai === "tien" && !row.gia_tri_the) return { loi: "Thẻ tiền bắt buộc nhập giá trị nạp vào thẻ." };
  const db = sb();
  let goiId = id;
  if (id) {
    const { error } = await db.from("goi_the").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data, error } = await db.from("goi_the").insert(row).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    goiId = data.id;
  }
  const dv = mang(fd, "dich_vu_ids");
  await db.from("goi_the_dich_vu").delete().eq("goi_id", goiId);
  if (dv.length) await db.from("goi_the_dich_vu").insert(dv.map((d) => ({ goi_id: goiId, dich_vu_id: d })));
  return xong();
}

export async function luuSanPham(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const nhomCap = chuoi(fd, "nhom_cap");
  const row: TablesInsert<"san_pham"> = {
    ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), nhom: chuoiHoacNull(fd, "nhom"),
    nhom_cap: nhomCap === "A" || nhomCap === "B" || nhomCap === "C" ? nhomCap : null,
    don_vi: chuoi(fd, "don_vi"), don_vi_mua: chuoiHoacNull(fd, "don_vi_mua"), he_so_quy_doi: so(fd, "he_so_quy_doi") || 1,
    gia_nhap_don_vi: soHoacNull(fd, "gia_nhap_don_vi"), gia_ban: so(fd, "gia_ban"),
    ban_le: bat(fd, "ban_le"), tieu_hao: bat(fd, "tieu_hao"), theo_doi_kho: bat(fd, "theo_doi_kho"), ton_toi_thieu: so(fd, "ton_toi_thieu"), hoat_dong: bat(fd, "hoat_dong"),
  };
  if (!row.ma || !row.ten || !row.don_vi) return { loi: "Nhập mã, tên và đơn vị dùng." };
  const { error } = id ? await sb().from("san_pham").update(row).eq("id", id) : await sb().from("san_pham").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuChiNhanh(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("nhanvien.quanly"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), dia_chi: chuoiHoacNull(fd, "dia_chi"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), hoat_dong: bat(fd, "hoat_dong") };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên chi nhánh." };
  const { error } = id ? await sb().from("chi_nhanh").update(row).eq("id", id) : await sb().from("chi_nhanh").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

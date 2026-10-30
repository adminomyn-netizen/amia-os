"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull } from "@/lib/form";
import { nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };
const MOC = ["30", "60"];

export async function luuMucTieuThuViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), nv = chuoi(fd, "nhan_vien_id"), moc = chuoi(fd, "moc"), noiDung = chuoi(fd, "noi_dung"), kq = chuoi(fd, "ket_qua") || "chua";
  if (!nv || !MOC.includes(moc)) return { loi: "Chọn nhân viên và mốc 30 hoặc 60 ngày." };
  if (noiDung.length < 2 || noiDung.length > 500) return { loi: "Nhập mục tiêu (2 đến 500 ký tự)." };
  if (!["chua", "dat", "chua_dat"].includes(kq)) return { loi: "Kết quả chưa hợp lệ." };
  if (!(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const dong = { nhan_vien_id: nv, moc: Number(moc), noi_dung: noiDung, tieu_chi: chuoiHoacNull(fd, "tieu_chi"), ket_qua: kq };
  if (id) {
    const { data: cu } = await db.from("thu_viec_muc_tieu").select("nhan_vien_id").eq("id", id).maybeSingle();
    if (!cu || !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id))) return { loi: KHONG_DU_QUYEN };
    const { error } = await db.from("thu_viec_muc_tieu").update(dong).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { error } = await db.from("thu_viec_muc_tieu").insert({ ...dong, nguoi_tao_id: nd.nhanVienId ?? null });
    if (error) return { loi: thongBaoLoi(error) };
  }
  revalidatePath("/nhan-su/thu-viec");
  return { ok: true };
}

export async function xoaMucTieuThuViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), db = sb();
  const { data: cu } = await db.from("thu_viec_muc_tieu").select("nhan_vien_id").eq("id", id).maybeSingle();
  if (!cu || !(await nvTrongPham(nd.chiNhanhId, cu.nhan_vien_id))) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("thu_viec_muc_tieu").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/thu-viec");
  return { ok: true };
}

/** Đánh giá thử việc: mỗi (nhân viên, mốc, vai) một bản, nộp lại thì ghi đè. Quyết định (lên chính thức/gia hạn/không đạt) chỉ do vai nhân sự ghi. */
export async function luuDanhGiaThuViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), moc = chuoi(fd, "moc"), vai = chuoi(fd, "vai"), diem = Number(chuoi(fd, "diem")), qd = chuoi(fd, "quyet_dinh");
  if (!nv || !MOC.includes(moc) || !["mentor", "quan_ly", "nhan_su"].includes(vai)) return { loi: "Chọn nhân viên, mốc và vai đánh giá." };
  if (!Number.isInteger(diem) || diem < 1 || diem > 5) return { loi: "Điểm từ 1 đến 5." };
  if (qd && (vai !== "nhan_su" || !["len_chinh_thuc", "gia_han", "khong_dat"].includes(qd))) return { loi: "Quyết định chỉ do vai Nhân sự ghi, chọn một trong ba lựa chọn." };
  if (!(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("thu_viec_danh_gia").upsert({ nhan_vien_id: nv, moc: Number(moc), vai, nguoi_danh_gia_id: nd.nhanVienId ?? null, diem, nhan_xet: chuoiHoacNull(fd, "nhan_xet"), quyet_dinh: qd || null }, { onConflict: "nhan_vien_id,moc,vai" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/thu-viec");
  return { ok: true };
}

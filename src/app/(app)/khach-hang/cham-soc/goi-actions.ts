"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, soHoacNull } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { CHI_TIET_GOI, LOAI_GOC, TRANG_THAI_GOI, type TrangThaiGoi } from "@/lib/cham-soc-hang-doi";

type KQ = { ok?: true; loi?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Ghi kết quả một cuộc gọi chăm sóc (sổ chỉ-thêm cham_soc_cuoc_goi). Dòng mới nhất của (khách, loại, ngày gốc) quyết định khách còn hiện ở hàng đợi hay không. */
export async function ghiKetQuaGoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id"), loai = chuoi(fd, "loai"), ngayGoc = chuoi(fd, "ngay_goc"), tt = chuoi(fd, "trang_thai") as TrangThaiGoi;
  if (!UUID.test(khachId) || !NGAY.test(ngayGoc) || !(LOAI_GOC as string[]).includes(loai)) return { loi: "Dữ liệu cuộc gọi không hợp lệ." };
  if (!TRANG_THAI_GOI.some((t) => t.ma === tt)) return { loi: "Chọn kết quả cuộc gọi." };
  const ngayGoiLai = chuoiHoacNull(fd, "ngay_goi_lai"), khongCan = bat(fd, "khong_can_goi_lai");
  if (ngayGoiLai && !NGAY.test(ngayGoiLai)) return { loi: "Ngày gọi lại không hợp lệ." };
  if (ngayGoiLai && khongCan) return { loi: "Chọn một trong hai: hẹn ngày gọi lại, hoặc không cần gọi lại." };
  if (tt === "hen_goi_lai" && !ngayGoiLai) return { loi: "Hẹn gọi lại thì phải chọn ngày gọi lại." };
  if (tt === "hen_goi_lai" && khongCan) return { loi: "Hẹn gọi lại thì không thể chọn \"không cần gọi lại\"." };
  if (ngayGoiLai && ngayGoiLai < homNayHCM()) return { loi: "Ngày gọi lại phải từ hôm nay trở đi." };
  const chiTiet = (chuoiHoacNull(fd, `ct_${tt}`) ?? "").slice(0, 120) || null;
  if (chiTiet && !CHI_TIET_GOI[tt].includes(chiTiet)) return { loi: "Chi tiết không thuộc kết quả đã chọn." };
  const noiDung = chuoiHoacNull(fd, "noi_dung")?.slice(0, 1000) ?? null;

  const db = sb();
  const { data: k } = await db.from("khach_hang").select("id, chi_nhanh_id").eq("id", khachId).maybeSingle();
  if (!k) return { loi: "Không tìm thấy khách." };
  const cnGui = chuoi(fd, "chi_nhanh_id");
  const cn = UUID.test(cnGui) ? cnGui : k.chi_nhanh_id;
  // Người gắn một chi nhánh chỉ ghi cho khách / lịch của chi nhánh đó.
  if (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId && cn !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const { data: moi, error } = await db.from("cham_soc_cuoc_goi").insert({
    khach_id: khachId, loai, ngay_goc: ngayGoc, trang_thai: tt, chi_tiet: chiTiet, noi_dung: noiDung, ngay_goi_lai: ngayGoiLai, khong_can_goi_lai: khongCan, chi_nhanh_id: cn, nguoi_id: nd.nhanVienId,
  }).select("id").single();
  if (error || !moi) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "ghi_cuoc_goi_cham_soc", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { cuoc_goi_id: moi.id, loai, trang_thai: tt } });
  revalidatePath("/khach-hang/cham-soc");
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

/** Đặt số ngày mặc định của hàng "Sau điều trị" (cấu hình chung). Chỉ người sửa danh mục. */
export async function luuNguongSauDieuTri(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const n = soHoacNull(fd, "ngay");
  if (n === null || !Number.isInteger(n) || n < 0 || n > 60) return { loi: "Số ngày phải từ 0 đến 60." };
  const { error } = await sb().from("cau_hinh").update({ gia_tri: String(n) }).eq("khoa", "cs_sau_dt_ngay");
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "dat_nguong_sau_dieu_tri", doi_tuong: "cau_hinh", chi_tiet: { ngay: n } });
  revalidatePath("/khach-hang/cham-soc");
  return { ok: true };
}

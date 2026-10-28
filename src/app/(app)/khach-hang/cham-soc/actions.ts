"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, soHoacNull } from "@/lib/form";
import { ngayVN } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const TRANG_THAI = ["da_goi", "da_hen", "bo_qua"];

/** Người gắn một chi nhánh chỉ xử lý được khách có thẻ ở chi nhánh đó. */
async function trongChiNhanh(nd: { chiNhanhId: string | null }, khachId: string) {
  if (!nd.chiNhanhId) return true;
  const { count } = await sb().from("the_khach").select("id", { count: "exact", head: true }).eq("khach_id", khachId).eq("chi_nhanh_id", nd.chiNhanhId);
  return (count ?? 0) > 0;
}

/** Ghi một nhắc vào khach_nhac (cơ chế nhắc chăm sóc có sẵn). Cùng nội dung đang nhắc thì dùng lại, không tạo trùng. */
async function taoNhac(nd: { hoTen: string }, khachId: string, chiNhanhId: string | null, noiDung: string, dichVu: string | null): Promise<{ id?: string; loi?: string }> {
  const db = sb();
  const { data: co } = await db.from("khach_nhac").select("id").eq("khach_id", khachId).eq("trang_thai", "dang_nhac").eq("noi_dung", noiDung).limit(1).maybeSingle();
  if (co) return { id: co.id };
  const { data, error } = await db.from("khach_nhac").insert({ khach_id: khachId, noi_dung: noiDung, trang_thai: "dang_nhac", ngay_nhac: new Date().toISOString(), nguoi_tao_ten: nd.hoTen, chi_nhanh_id: chiNhanhId, dich_vu_ten: dichVu, la_lich_su: false }).select("id").single();
  if (error || !data) return { loi: thongBaoLoi(error) };
  return { id: data.id };
}

/** Đặt trạng thái xử lý nhắc tái khám: đã gọi / đã hẹn / bỏ qua (kèm ghi chú). Gắn với (khách, ngày làm gần nhất) nên làm buổi mới thì nhắc mới tự mở lại. */
export async function datTrangThaiTaiKham(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id"), lanCuoi = chuoi(fd, "lan_cuoi"), tt = chuoi(fd, "trang_thai");
  if (!UUID.test(khachId) || !NGAY.test(lanCuoi)) return { loi: "Dữ liệu nhắc không hợp lệ." };
  if (!TRANG_THAI.includes(tt)) return { loi: "Chọn trạng thái: đã gọi, đã hẹn hoặc bỏ qua." };
  if (!(await trongChiNhanh(nd, khachId))) return { loi: KHONG_DU_QUYEN };
  const ghiChu = chuoiHoacNull(fd, "ghi_chu")?.slice(0, 300) ?? null;
  const { error } = await sb().from("tai_kham_xu_ly").upsert({ khach_id: khachId, lan_cuoi: lanCuoi, trang_thai: tt, ghi_chu: ghiChu, nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "khach_id,lan_cuoi" });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "tai_kham_trang_thai", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { lan_cuoi: lanCuoi, trang_thai: tt } });
  revalidatePath("/khach-hang/tai-kham");
  return { ok: true };
}

/** Ghi nhắc tái khám vào mục nhắc chăm sóc của khách (không gửi SMS/Zalo). */
export async function ghiNhacTaiKham(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id"), lanCuoi = chuoi(fd, "lan_cuoi"), denHan = chuoi(fd, "den_han");
  if (!UUID.test(khachId) || !NGAY.test(lanCuoi) || !NGAY.test(denHan)) return { loi: "Dữ liệu nhắc không hợp lệ." };
  if (!(await trongChiNhanh(nd, khachId))) return { loi: KHONG_DU_QUYEN };
  const goi = chuoi(fd, "ten_goi").slice(0, 120), cn = chuoi(fd, "chi_nhanh_id");
  const nhac = await taoNhac(nd, khachId, UUID.test(cn) ? cn : null, `Nhắc tái khám liệu trình ${goi}: đến hẹn ${ngayVN(denHan)} (lần làm gần nhất ${ngayVN(lanCuoi)}).`.slice(0, 400), goi || null);
  if (nhac.loi) return { loi: nhac.loi };
  const { error } = await sb().from("tai_kham_xu_ly").upsert({ khach_id: khachId, lan_cuoi: lanCuoi, nhac_id: nhac.id, nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "khach_id,lan_cuoi" });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "ghi_nhac_tai_kham", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { nhac_id: nhac.id } });
  revalidatePath("/khach-hang/tai-kham");
  return { ok: true };
}

/** Ghi nhắc cho thẻ sắp hết buổi / sắp hết hạn. */
export async function ghiNhacTheSapHet(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id"), theId = chuoi(fd, "the_id"), han = chuoi(fd, "han_dung");
  if (!UUID.test(khachId) || !UUID.test(theId)) return { loi: "Dữ liệu nhắc không hợp lệ." };
  if (!(await trongChiNhanh(nd, khachId))) return { loi: KHONG_DU_QUYEN };
  const { data: t } = await sb().from("v_the_khach").select("ma, loai, so_buoi_con, so_buoi_tong, so_du_tien, han_dung, chi_nhanh_id, khach_id, goi_id").eq("id", theId).maybeSingle();
  if (!t || t.khach_id !== khachId) return { loi: "Không tìm thấy thẻ của khách này." };
  const { data: g } = await sb().from("goi_the").select("ten").eq("id", t.goi_id ?? "").maybeSingle();
  const con = t.loai === "lan" ? ((t.so_buoi_tong ?? 0) >= 100000 ? "không giới hạn buổi" : `còn ${t.so_buoi_con} buổi`) : `còn ${Number(t.so_du_tien).toLocaleString("vi-VN")} đ`;
  const hanTxt = (t.han_dung ?? han) && (t.han_dung ?? han) >= "2000-01-01" ? `, hạn ${ngayVN(t.han_dung ?? han)}` : "";
  const nhac = await taoNhac(nd, khachId, t.chi_nhanh_id, `Thẻ ${g?.ten ?? t.ma} (${t.ma}) sắp hết: ${con}${hanTxt}. Nhắc khách gia hạn hoặc mua thẻ mới.`.slice(0, 400), g?.ten ?? null);
  if (nhac.loi) return { loi: nhac.loi };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "ghi_nhac_the_sap_het", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { the_id: theId, nhac_id: nhac.id } });
  revalidatePath("/khach-hang/the-sap-het");
  return { ok: true };
}

/** Đặt khoảng cách giữa 2 buổi (ngày) cho một gói thẻ; để trống = dùng mặc định chung. Chỉ người sửa danh mục. */
export async function luuKhoangCachGoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const goi = chuoi(fd, "goi_id");
  if (!UUID.test(goi)) return { loi: "Chọn gói thẻ." };
  const ngay = soHoacNull(fd, "ngay");
  if (ngay !== null && (!Number.isInteger(ngay) || ngay < 1 || ngay > 365)) return { loi: "Khoảng cách phải từ 1 đến 365 ngày." };
  const { error } = await sb().from("goi_the").update({ khoang_cach_ngay: ngay }).eq("id", goi);
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "dat_khoang_cach_goi", doi_tuong: "goi_the", doi_tuong_id: goi, chi_tiet: { ngay } });
  revalidatePath("/khach-hang/tai-kham");
  return { ok: true };
}

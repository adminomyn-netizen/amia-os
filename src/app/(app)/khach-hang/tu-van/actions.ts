"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { chuanSdt, homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string; id?: string };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Ghi mới hoặc sửa một phiếu tư vấn (có `id` là sửa). Nhu cầu phát sinh chỉ được THÊM (mỗi dòng một nhu cầu). DB tự ghi nhật ký cũ → mới và chặn xoá. Cần quyền sửa khách. */
export async function luuPhieuTuVan(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "khach.sua")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const ketQua = chuoi(fd, "ket_qua"), lyDo = chuoi(fd, "ly_do_khong_chot");
  if (!["cho_chot", "chot", "khong_chot"].includes(ketQua)) return { loi: "Chọn kết quả tư vấn." };
  if (ketQua === "khong_chot" && !lyDo) return { loi: "Ghi lý do khách không chốt." };
  const tvv = chuoi(fd, "tu_van_vien_id");
  if (!tvv) return { loi: "Chọn tư vấn viên." };
  const ngay = chuoi(fd, "ngay_tu_van") || homNayHCM(), henLai = chuoiHoacNull(fd, "ngay_hen_lai");
  if (!NGAY.test(ngay) || (henLai && !NGAY.test(henLai))) return { loi: "Ngày chưa hợp lệ." };
  const baoGia = Math.trunc(so(fd, "bao_gia"));
  if (baoGia < 0) return { loi: "Báo giá không âm." };
  const noiDung = {
    tu_van_vien_id: tvv, ngay_tu_van: ngay, dich_vu_id: chuoiHoacNull(fd, "dich_vu_id"), goi_quan_tam: chuoi(fd, "goi_quan_tam").slice(0, 200) || null,
    dat_van_de: chuoi(fd, "dat_van_de").slice(0, 1000) || null, phan_tich: chuoi(fd, "phan_tich").slice(0, 1000) || null, chung_minh: chuoi(fd, "chung_minh").slice(0, 1000) || null,
    ket_qua: ketQua, bao_gia: baoGia, ngay_hen_lai: henLai, ly_do_khong_chot: ketQua === "khong_chot" ? lyDo.slice(0, 500) : null, nguoi_ghi_id: nd.nhanVienId,
  };
  let phieuId = id, khachId: string;
  if (id) {
    const { data: p } = await db.from("phieu_tu_van").select("id, khach_id, chi_nhanh_id").eq("id", id).maybeSingle();
    if (!p || (nd.chiNhanhId && p.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy phiếu tư vấn." };
    khachId = p.khach_id;
    const { error } = await db.from("phieu_tu_van").update(noiDung).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const kId = chuoi(fd, "khach_id"), sdt = chuanSdt(chuoi(fd, "dien_thoai"));
    const { data: k } = kId ? await db.from("khach_hang").select("id, chi_nhanh_id").eq("id", kId).maybeSingle() : sdt ? await db.from("khach_hang").select("id, chi_nhanh_id").eq("dien_thoai", sdt).limit(1).maybeSingle() : { data: null };
    if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Chưa có khách với số điện thoại này. Thêm khách trước rồi ghi lại." };
    khachId = k.id;
    const ma = `TV${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "tv" })).data ?? 0)).padStart(6, "0")}`;
    const { data: moi, error } = await db.from("phieu_tu_van").insert({ ...noiDung, ma, khach_id: k.id, chi_nhanh_id: k.chi_nhanh_id }).select("id").single();
    if (error || !moi) return { loi: thongBaoLoi(error) };
    phieuId = moi.id;
  }
  const dong = chuoi(fd, "nhu_cau").split(/\r?\n/).map((x) => x.trim().slice(0, 300)).filter(Boolean).slice(0, 20);
  if (dong.length) {
    const { error } = await db.from("phieu_tu_van_nhu_cau").insert(dong.map((noi_dung) => ({ phieu_id: phieuId, noi_dung, nguoi_ghi_id: nd.nhanVienId })));
    if (error) return { loi: `Đã lưu phiếu nhưng chưa ghi được nhu cầu phát sinh: ${thongBaoLoi(error)}` };
  }
  revalidatePath("/khach-hang/tu-van"); revalidatePath(`/khach-hang/${khachId}`); revalidatePath("/bao-cao");
  return { ok: true, id: phieuId };
}

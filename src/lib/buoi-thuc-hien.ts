import "server-only";
import { revalidatePath } from "next/cache";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, mang, so } from "@/lib/form";
import { ngayVN } from "@/lib/dinh-dang";
import type { NguoiDung } from "@/lib/auth";

// Phần dùng chung của "Thực hiện buổi" (trừ buổi ngay) và luồng thu ngân → chuyên viên trị liệu (/the/cho-lam).
// Không phải server action (không "use server") để không lộ ra trình duyệt như một hành động gọi được.

const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Thẻ có thuộc phạm vi chi nhánh của người dùng không (người khoá chi nhánh không được thao tác thẻ chi nhánh khác dù biết id). */
export async function theTrongPhamVi(nd: NguoiDung, theId: string): Promise<boolean> {
  if (!theId) return false;
  const { data } = await sb().from("the_khach").select("chi_nhanh_id").eq("id", theId).maybeSingle();
  return !!data && (!nd.chiNhanhId || data.chi_nhanh_id === nd.chiNhanhId);
}

/** Kiểm "hẹn buổi kế tiếp" (ngày + nội dung, không bắt buộc) TRƯỚC khi trừ buổi, để lỗi nhập không xảy ra sau khi buổi đã trừ. */
export function docHenKeTiep(fd: FormData, ngayLam: string): { co: false } | { co: true; ngay: string; noiDung: string | null } | { loi: string } {
  const ngay = chuoi(fd, "ke_tiep_ngay"), noiDung = chuoiHoacNull(fd, "ke_tiep_noi_dung")?.slice(0, 300) ?? null;
  if (!ngay && !noiDung) return { co: false };
  if (!ngay) return { loi: "Hẹn buổi kế tiếp: chọn ngày hẹn (hoặc xoá nội dung nếu không hẹn)." };
  if (!NGAY.test(ngay)) return { loi: "Ngày hẹn buổi kế tiếp không hợp lệ." };
  if (ngay <= ngayLam) return { loi: "Ngày hẹn buổi kế tiếp phải sau ngày làm buổi này." };
  return { co: true, ngay, noiDung };
}

/** Ghi hẹn buổi kế tiếp của một thẻ + tạo nhắc ở khach_nhac (nhắc đúng ngày hẹn). KHÔNG đụng tới số buổi/tiền. Không tạo lich_hen (chưa có giờ/nhân viên). */
export async function ghiHenKeTiep(nd: NguoiDung, theId: string, buoiId: string | null, ngay: string, noiDung: string | null): Promise<{ loi?: string }> {
  const db = sb();
  const { data: t } = await db.from("the_khach").select("id, ma, khach_id, chi_nhanh_id, goi_id").eq("id", theId).maybeSingle();
  if (!t) return { loi: "Không tìm thấy thẻ." };
  const { data: g } = await db.from("goi_the").select("ten").eq("id", t.goi_id).maybeSingle();
  const ten = g?.ten ?? t.ma;
  const { data: nhac, error: e1 } = await db.from("khach_nhac").insert({
    khach_id: t.khach_id, noi_dung: `Hẹn buổi kế tiếp thẻ ${ten} (${t.ma}) ngày ${ngayVN(ngay)}${noiDung ? `: ${noiDung}` : "."}`.slice(0, 400), trang_thai: "dang_nhac",
    ngay_nhac: `${ngay}T08:00:00+07:00`, nguoi_tao_ten: nd.hoTen, chi_nhanh_id: t.chi_nhanh_id, dich_vu_ten: ten, la_lich_su: false,
  }).select("id").single();
  if (e1 || !nhac) return { loi: thongBaoLoi(e1) };
  const { error } = await db.from("the_buoi_ke_tiep").insert({ the_id: t.id, khach_id: t.khach_id, buoi_id: buoiId, ngay_hen: ngay, noi_dung: noiDung, chi_nhanh_id: t.chi_nhanh_id, nhac_id: nhac.id, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "hen_buoi_ke_tiep", doi_tuong: "khach_hang", doi_tuong_id: t.khach_id, chi_tiet: { the_id: t.id, ngay_hen: ngay, nhac_id: nhac.id } });
  revalidatePath("/khach-hang/tai-kham");
  return {};
}

/** Tham số thực tế của ca (số shot, số line, vùng làm). */
export function docThamSo(fd: FormData): Record<string, number | string> {
  const thamSo: Record<string, number | string> = {};
  for (const k of ["shot", "line"]) if (chuoi(fd, k)) thamSo[k] = so(fd, k);
  if (chuoi(fd, "vung")) thamSo.vung = chuoi(fd, "vung").slice(0, 200);
  return thamSo;
}

export type NguoiBuoi = { nv: string[]; tuVan: string[]; tinhTrang: string | null; deXuat: string | null };
/** Người làm (nhiều, người đầu = người chính), người tư vấn (nhiều) và nội dung tư vấn. Ô cũ `nv_id` (một người) vẫn đọc được. */
export function docNguoiBuoi(fd: FormData): NguoiBuoi | { loi: string } {
  const nv = [...new Set([...mang(fd, "nv_ids"), ...(chuoi(fd, "nv_id") ? [chuoi(fd, "nv_id")] : [])])];
  const tuVan = [...new Set(mang(fd, "tu_van_ids"))];
  const tinhTrang = chuoi(fd, "tu_van_tinh_trang").slice(0, 1000) || null, deXuat = chuoi(fd, "tu_van_de_xuat").slice(0, 1000) || null;
  if (nv.length === 0) return { loi: "Chọn người thực hiện." };
  if (nv.length > 7) return { loi: "Tối đa 7 người làm một buổi." };
  if (tuVan.length > 5) return { loi: "Tối đa 5 người tư vấn." };
  if ((tinhTrang || deXuat) && tuVan.length === 0) return { loi: "Có nội dung tư vấn thì chọn người tư vấn." };
  return { nv, tuVan, tinhTrang, deXuat };
}

export type PhieuBuoi = { phieuId: string; phieuMa: string; phieuBacSi: boolean };
/** Phiếu vật tư của buổi (đủ dòng định mức của dịch vụ); chuyên viên trị liệu kiểm, xác nhận, cuối ngày chốt mới xuất kho. */
/** `xacNhan`: chuyên viên trị liệu tự bấm "Đã làm xong" = đã kiểm vật tư theo định mức → xác nhận phiếu luôn, khỏi bấm "Xác nhận đã kiểm" lần hai
 *  (chuyên viên phản ánh qua chị Lâm 17/11/2026). Dùng khác định mức thì mở phiếu sửa dòng → phiếu tự về "chưa xác nhận" để xác nhận lại.
 *  Phiếu bác sĩ chỉ định dùng lại cho buổi thì KHÔNG tự xác nhận. */
export async function taoPhieuBuoi(nd: NguoiDung, buoi: string, xacNhan = false): Promise<{ phieu?: PhieuBuoi; canhBao?: string }> {
  const { data: pid, error } = await sb().rpc("tao_phieu_theo_buoi", { p_buoi: buoi, p_nguoi: nd.nhanVienId });
  if (error || typeof pid !== "string") return { canhBao: `CHƯA tạo được phiếu vật tư cho buổi này (${thongBaoLoi(error) || "không rõ lỗi"}). Đừng làm lại buổi; báo kho / quản lý ra phiếu.` };
  const { data: pc } = await sb().from("phieu_cap").select("ma, buoi_id, xac_nhan_luc").eq("id", pid).maybeSingle();
  if (xacNhan && pc && pc.buoi_id === buoi && !pc.xac_nhan_luc) {
    const { error: eXn } = await sb().rpc("xac_nhan_phieu_buoi", { p_id: pid, p_nguoi: nd.nhanVienId });
    if (eXn) console.error("taoPhieuBuoi xác nhận:", eXn.message); // không chặn: phiếu vẫn còn, chuyên viên xác nhận tay được
  }
  revalidatePath("/phieu-cap");
  return { phieu: { phieuId: pid, phieuMa: pc?.ma ?? "", phieuBacSi: !!pc && pc.buoi_id !== buoi } };
}

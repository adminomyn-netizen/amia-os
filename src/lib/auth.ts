import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { coQuyen, laVaiTro, type Quyen, type VaiTro } from "@/lib/quyen";
import { COOKIE_CHI_NHANH, tinhVaiHieuLuc, type CoSoDuocVao } from "@/lib/vai-chi-nhanh";
import { trangDau } from "@/lib/nav";

/** `vaiTro`, `quyen`, `chiNhanhId` là theo CHI NHÁNH ĐANG LÀM VIỆC (vai trò theo từng chi nhánh, migration 0280). `chiNhanhId` null = mọi chi nhánh.
 *  `dsCoSo` ≥ 2 phần tử thì đầu trang có nút đổi chi nhánh. */
export type NguoiDung = { userId: string; nhanVienId: string; hoTen: string; email: string; vaiTro: VaiTro; chiNhanhId: string | null; chucDanh: string | null; quyen: Quyen[]; anhDaiDien: string | null; phaiDoiMatKhau: boolean; dsCoSo: CoSoDuocVao[] };

/** Mỗi yêu cầu chỉ hỏi Supabase Auth + hồ sơ nhân viên MỘT lần (React cache). Không có hồ sơ đang hoạt động ⇒ null. */
export const layNguoiDungHienTai = cache(async (): Promise<NguoiDung | null> => {
  const supabase = await createClient();
  // getClaims kiểm chữ ký JWT ngay tại máy chủ (không gọi mạng Auth) → bớt một vòng đi về ở MỌI trang. Người bị khoá/xoá vẫn bị chặn vì hồ sơ nhân viên (hoat_dong) hỏi DB mỗi yêu cầu bên dưới.
  const { data: dataClaims, error: loiAuth } = await supabase.auth.getClaims();
  if (!dataClaims?.claims && loiAuth && (loiAuth.name === "AuthRetryableFetchError" || ((loiAuth as { status?: number }).status ?? 0) >= 500)) throw new Error("Hệ thống đang chậm, chưa kiểm được phiên đăng nhập. Tải lại trang sau vài giây.");
  const cl = dataClaims?.claims;
  if (!cl?.sub) return null;
  const user = { id: cl.sub, email: typeof cl.email === "string" ? cl.email : "" };
  const { data: nv, error: loiNv } = await createAdminClient().from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id, chuc_danh, hoat_dong, quyen_rieng, anh_dai_dien, phai_doi_mat_khau, them:nhan_vien_chi_nhanh!nhan_vien_chi_nhanh_nhan_vien_id_fkey(chi_nhanh_id, vai_tro)").eq("user_id", user.id).maybeSingle();
  // Lỗi đọc DB (quá tải, hết giờ chờ) khác với "không có hồ sơ": không được coi là chưa đăng nhập.
  if (loiNv) throw new Error("Hệ thống đang chậm, chưa đọc được hồ sơ. Tải lại trang sau vài giây.");
  if (!nv || !nv.hoat_dong || !laVaiTro(nv.vai_tro)) return null;
  // Chi nhánh đang làm việc lấy từ cookie nhưng KIỂM LẠI mỗi yêu cầu: không thuộc danh sách được vào thì về chi nhánh chính.
  const chon = (await cookies()).get(COOKIE_CHI_NHANH)?.value ?? null;
  const vai = tinhVaiHieuLuc({ vai_tro: nv.vai_tro, chi_nhanh_id: nv.chi_nhanh_id, quyen_rieng: nv.quyen_rieng }, nv.them, chon);
  return { userId: user.id, nhanVienId: nv.id, hoTen: nv.ho_ten, email: user.email, vaiTro: vai.vaiTro, chiNhanhId: vai.chiNhanhId, chucDanh: nv.chuc_danh, quyen: vai.quyen, anhDaiDien: nv.anh_dai_dien, phaiDoiMatKhau: nv.phai_doi_mat_khau, dsCoSo: vai.dsCoSo };
});

/** Trang: chưa đăng nhập → /dang-nhap; thiếu quyền → về trang đầu tiên được phép. */
export async function yeuCauQuyen(q: Quyen) {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.phaiDoiMatKhau) redirect("/tai-khoan?doi-mat-khau=1");
  if (!coQuyen(nd, q)) redirect(trangDau(nd, true));
  return nd;
}

/** Như yeuCauQuyen nhưng chỉ cần một trong các quyền. */
export async function yeuCauMotTrong(qs: Quyen[]) {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.phaiDoiMatKhau) redirect("/tai-khoan?doi-mat-khau=1");
  if (!qs.some((q) => coQuyen(nd, q))) redirect(trangDau(nd, true));
  return nd;
}

/** `choDoiMatKhau`: chỉ trang Tài khoản được mở khi còn phải đổi mật khẩu mặc định. */
export async function layNguoiDungDangNhap(choDoiMatKhau = false) {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.phaiDoiMatKhau && !choDoiMatKhau) redirect("/tai-khoan?doi-mat-khau=1");
  return nd;
}

/** Server Action: trả người dùng nếu có quyền, không thì null. Server Action là điểm POST công khai với ai đã đăng nhập — ẩn nút ở giao diện KHÔNG đủ. */
export async function kiemQuyen(q: Quyen) {
  const nd = await layNguoiDungHienTai();
  return nd && coQuyen(nd, q) ? nd : null;
}
export const KHONG_DU_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

/** Trang dành cho mọi nhân viên nội bộ (việc, báo cáo ngày, wiki, đề xuất) — chỉ loại Nhà đầu tư. */
export async function yeuCauNoiBo() {
  const nd = await layNguoiDungDangNhap();
  if (nd.vaiTro === "nha_dau_tu") redirect(trangDau(nd, true));
  return nd;
}

/** Server Action cho mọi nhân viên nội bộ. */
export async function kiemNoiBo() {
  const nd = await layNguoiDungHienTai();
  return nd && nd.vaiTro !== "nha_dau_tu" ? nd : null;
}

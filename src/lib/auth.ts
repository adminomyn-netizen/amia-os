import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coQuyen, laVaiTro, type Quyen, type VaiTro } from "@/lib/quyen";

export type NguoiDung = { userId: string; nhanVienId: string; hoTen: string; email: string; vaiTro: VaiTro; chiNhanhId: string | null };

/** Mỗi yêu cầu chỉ hỏi Supabase Auth + hồ sơ nhân viên MỘT lần (React cache). Không có hồ sơ đang hoạt động ⇒ null. */
export const layNguoiDungHienTai = cache(async (): Promise<NguoiDung | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: nv } = await createAdminClient().from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id, hoat_dong").eq("user_id", user.id).maybeSingle();
  if (!nv || !nv.hoat_dong || !laVaiTro(nv.vai_tro)) return null;
  return { userId: user.id, nhanVienId: nv.id, hoTen: nv.ho_ten, email: user.email ?? "", vaiTro: nv.vai_tro, chiNhanhId: nv.chi_nhanh_id };
});

/** Trang: chưa đăng nhập → /dang-nhap; thiếu quyền → về trang đầu tiên được phép. */
export async function yeuCauQuyen(q: Quyen) {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (!coQuyen(nd.vaiTro, q)) redirect(nd.vaiTro === "nha_dau_tu" || nd.vaiTro === "marketing" ? "/tong-quan" : "/tong-quan?khong-du-quyen=1");
  return nd;
}

export async function layNguoiDungDangNhap() {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  return nd;
}

/** Server Action: trả người dùng nếu có quyền, không thì null. Server Action là điểm POST công khai với ai đã đăng nhập — ẩn nút ở giao diện KHÔNG đủ. */
export async function kiemQuyen(q: Quyen) {
  const nd = await layNguoiDungHienTai();
  return nd && coQuyen(nd.vaiTro, q) ? nd : null;
}
export const KHONG_DU_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

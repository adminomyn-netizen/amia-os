"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { layNguoiDungHienTai } from "@/lib/auth";
import { COOKIE_CHI_NHANH } from "@/lib/vai-chi-nhanh";

/** Đổi chi nhánh đang làm việc (như nút "Chọn" ở đầu trang SalonHero). Chỉ nhận chi nhánh người này được gán; cookie chỉ là lựa chọn —
 *  mỗi yêu cầu sau vẫn kiểm lại trong layNguoiDungHienTai, nên sửa tay cookie không mở thêm được chi nhánh nào. */
export async function doiChiNhanhLamViec(fd: FormData): Promise<void> {
  const nd = await layNguoiDungHienTai();
  const id = String(fd.get("chi_nhanh_id") ?? "");
  if (!nd || !nd.dsCoSo.some((c) => c.chiNhanhId === id)) return;
  (await cookies()).set(COOKIE_CHI_NHANH, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

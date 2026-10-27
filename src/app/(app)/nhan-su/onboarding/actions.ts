"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so, bat } from "@/lib/form";

type KQ = { ok?: true; loi?: string };

export async function danhDauOnboarding(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("id, chi_nhanh_id").eq("id", chuoi(fd, "nhan_vien_id")).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId)) return { loi: KHONG_DU_QUYEN };
  const { error } = chuoi(fd, "huy") === "1"
    ? await db.from("onboarding_tien_do").delete().eq("nhan_vien_id", n.id).eq("muc_id", chuoi(fd, "muc_id"))
    : await db.from("onboarding_tien_do").upsert({ nhan_vien_id: n.id, muc_id: chuoi(fd, "muc_id"), nguoi_id: nd.nhanVienId }, { onConflict: "nhan_vien_id,muc_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

/** Thêm/sửa một mốc onboarding (tên + số ngày sau ngày vào làm). Mốc đang có người đánh dấu xong thì chỉ nên tắt (hoat_dong), không xoá. */
export async function luuMocOnboarding(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ten = chuoi(fd, "ten"), sau = Math.round(so(fd, "sau_ngay")), id = chuoi(fd, "id");
  if (!ten) return { loi: "Nhập tên mốc." };
  if (!(sau >= 0 && sau <= 365)) return { loi: "Số ngày sau ngày vào làm phải từ 0 đến 365." };
  const db = sb();
  const row = { ten, sau_ngay: sau, hoat_dong: id ? bat(fd, "hoat_dong") : true };
  if (id) {
    const { error } = await db.from("onboarding_muc").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data: cuoi } = await db.from("onboarding_muc").select("thu_tu").order("thu_tu", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("onboarding_muc").insert({ ...row, thu_tu: (cuoi?.thu_tu ?? 0) + 1 });
    if (error) return { loi: thongBaoLoi(error) };
  }
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

export async function xoaMocOnboarding(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { count } = await db.from("onboarding_tien_do").select("muc_id", { count: "exact", head: true }).eq("muc_id", id);
  if (count) return { loi: "Mốc này đã có người được đánh dấu xong nên không xoá được. Hãy tắt mốc (bỏ tick Đang dùng) để ẩn." };
  const { error } = await db.from("onboarding_muc").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

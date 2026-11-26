"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };

/** Đặt số dư đầu kỳ của quỹ (tiền có sẵn trước khi dùng phần mềm). Đổi số này là đổi mọi tồn quỹ về sau nên bắt buộc lý do và có nhật ký. Người có quyền Khoá kỳ. */
export async function datSoDuDauQuy(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ky.khoa");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const soDu = Math.round(so(fd, "so_du"));
  const lyDo = chuoi(fd, "ly_do");
  if (!Number.isInteger(soDu) || Math.abs(soDu) > 100_000_000_000) return { loi: "Số dư là số đồng, không quá 100 tỷ." };
  if (!lyDo) return { loi: "Nhập lý do (ghi vào nhật ký)." };
  const db = sb();
  const { data: q } = await db.from("quy").select("id, so_du_dau, chi_nhanh_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!q || (nd.chiNhanhId && q.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy quỹ." };
  const { error } = await db.from("quy").update({ so_du_dau: soDu, da_nhap_so_du: true }).eq("id", q.id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("quy_so_du_nhat_ky").insert({ quy_id: q.id, nguoi_id: nd.nhanVienId, truoc: Number(q.so_du_dau), sau: soDu, ly_do: lyDo });
  revalidatePath("/tai-chinh", "layout");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
export async function luuTiLe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai"), vai = chuoi(fd, "vai"), muc = chuoi(fd, "muc_id") || null, ti = so(fd, "ti_le");
  if (!["dich_vu", "san_pham", "goi_the"].includes(loai) || !["phuc_vu", "tu_van", "ban"].includes(vai)) return { loi: "Chọn loại và vai." };
  if (!(ti >= 0 && ti <= 100)) return { loi: "Tỉ lệ phải từ 0 đến 100%." };
  const db = sb();
  let q = db.from("hoa_hong_ti_le").select("id").eq("loai", loai).eq("vai", vai);
  q = muc ? q.eq("muc_id", muc) : q.is("muc_id", null);
  const { data: cu } = await q.maybeSingle();
  const { error } = cu ? await db.from("hoa_hong_ti_le").update({ ti_le: ti }).eq("id", cu.id) : await db.from("hoa_hong_ti_le").insert({ loai, vai, muc_id: muc, ti_le: ti });
  revalidatePath("/hoa-hong");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}
export async function xoaTiLe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  await sb().from("hoa_hong_ti_le").delete().eq("id", chuoi(fd, "id"));
  revalidatePath("/hoa-hong");
  return { ok: true };
}

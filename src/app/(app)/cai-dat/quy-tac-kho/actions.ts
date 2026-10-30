"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat } from "@/lib/form";
import { docChanHetTon, giaTriChanHetTon, KHOA_CHAN_HET_TON } from "@/lib/quy-tac-kho";

type KQ = { ok?: true; loi?: string };

/** Bật/tắt chặn bán khi hết tồn. Chỉ Chủ / Kỹ thuật (hethong.phanquyen); nhật ký ghi giá trị trước và sau. */
export async function luuQuyTacKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: cu } = await db.from("cau_hinh").select("gia_tri").eq("khoa", KHOA_CHAN_HET_TON).maybeSingle();
  const moi = bat(fd, "chan_het_ton");
  const { error } = await db.from("cau_hinh").upsert({ khoa: KHOA_CHAN_HET_TON, gia_tri: giaTriChanHetTon(moi) }, { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_quy_tac_kho", doi_tuong: "cau_hinh", chi_tiet: { truoc: docChanHetTon(cu?.gia_tri), sau: moi } });
  revalidatePath("/cai-dat/quy-tac-kho");
  return { ok: true };
}

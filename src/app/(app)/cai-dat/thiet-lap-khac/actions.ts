"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, so } from "@/lib/form";
import { dongThietLapKhac, layThietLapKhac, loiThietLapKhac, type CheDoThue } from "@/lib/thiet-lap-khac";

type KQ = { ok?: true; loi?: string };

/** Lưu thuế VAT, phụ phí, tự khoá hoá đơn, tip. Chỉ Chủ / Kỹ thuật (hethong.phanquyen); nhật ký ghi giá trị trước và sau. */
export async function luuThietLapKhac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const moi = {
    vatCheDo: chuoi(fd, "vat_che_do") as CheDoThue, vatPct: so(fd, "vat_pct"), khoaHdBat: bat(fd, "khoa_hd_bat"), khoaHdGio: Math.round(so(fd, "khoa_hd_gio")),
    phuPhiCheDo: chuoi(fd, "phu_phi_che_do") as CheDoThue, phuPhiPct: so(fd, "phu_phi_pct"), tipBat: bat(fd, "tip_bat"),
  };
  const loi = loiThietLapKhac(moi);
  if (loi) return { loi };
  const db = sb();
  const cu = await layThietLapKhac(db);
  const { error } = await db.from("cau_hinh").upsert(dongThietLapKhac(moi), { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_thiet_lap_khac", doi_tuong: "cau_hinh", chi_tiet: { truoc: cu, sau: moi } });
  revalidatePath("/cai-dat/thiet-lap-khac");
  return { ok: true };
}

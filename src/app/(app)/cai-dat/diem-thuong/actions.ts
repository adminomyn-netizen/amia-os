"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };

/** Sửa quy đổi điểm của MỘT hạng khách (x đồng = 1 điểm; 1 điểm = y đồng giảm). Chỉ Chủ / Kỹ thuật (hethong.phanquyen), ghi nhật ký giá trị trước và sau. */
export async function luuDiemHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const hang = chuoi(fd, "hang"), tich = Math.round(so(fd, "tien_moi_diem")), doi = Math.round(so(fd, "tien_doi_moi_diem"));
  if (!Number.isInteger(tich) || tich < 1000 || tich > 1_000_000_000) return { loi: "Số tiền cho 1 điểm từ 1.000đ đến 1 tỷ đồng." };
  if (!Number.isInteger(doi) || doi < 0 || doi > 10_000_000) return { loi: "Giá trị 1 điểm từ 0đ đến 10.000.000đ." };
  const db = sb();
  const { data: cu } = await db.from("hang_diem_cau_hinh").select("tien_moi_diem, tien_doi_moi_diem").eq("hang", hang).maybeSingle();
  if (!cu) return { loi: "Không có hạng khách này." };
  const { error } = await db.from("hang_diem_cau_hinh").update({ tien_moi_diem: tich, tien_doi_moi_diem: doi, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: nd.nhanVienId }).eq("hang", hang);
  if (!error) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_diem_theo_hang", doi_tuong: "hang_diem_cau_hinh", chi_tiet: { hang, truoc: { tien_moi_diem: Number(cu.tien_moi_diem), tien_doi_moi_diem: Number(cu.tien_doi_moi_diem) }, sau: { tien_moi_diem: tich, tien_doi_moi_diem: doi } } });
  revalidatePath("/cai-dat/diem-thuong");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

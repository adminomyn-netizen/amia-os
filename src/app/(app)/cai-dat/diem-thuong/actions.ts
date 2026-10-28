"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, so } from "@/lib/form";
import { HANG_KHACH } from "@/lib/diem-hang";
import { dongDiemKhachHang, layDiemKhachHang, loiDiemKhachHang, tiLeMotDiem, type DiemKhachHang, type Hang } from "@/lib/diem-khach-hang";

type KQ = { ok?: true; loi?: string };

/** Lưu cả màn "Điểm khách hàng" (nút Lưu thông tin). Chỉ Chủ / Kỹ thuật (hethong.phanquyen); nhật ký ghi giá trị trước và sau. */
export async function luuDiemKhachHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cap = (k: string) => ({ tien: Math.round(so(fd, `${k}_tien`)), diem: Math.round(so(fd, `${k}_diem`)) });
  const theoHang = (k: string) => Object.fromEntries(HANG_KHACH.map((h, i) => [h, cap(`${k}${i}`)])) as DiemKhachHang["tichHang"];
  const moi: DiemKhachHang = {
    tichBat: bat(fd, "tich_bat"), tichMacDinh: cap("tich_md"), tichHang: theoHang("tich"), tichDv: bat(fd, "tich_dv"), tichSp: bat(fd, "tich_sp"), tichThe: bat(fd, "tich_the"), doiThuNgan: bat(fd, "doi_thu_ngan"),
    doiBat: bat(fd, "doi_bat"), doiMacDinh: cap("doi_md"), doiHang: theoHang("doi"), tuDongHang: bat(fd, "tu_dong_hang"),
    nguong: Object.fromEntries(HANG_KHACH.map((h, i) => [h, Math.round(so(fd, `nguong${i}`))])) as Record<Hang, number>,
  };
  const loi = loiDiemKhachHang(moi);
  if (loi) return { loi };
  const db = sb();
  const cu = await layDiemKhachHang(db);
  const { error } = await db.from("cau_hinh").upsert(dongDiemKhachHang(moi), { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  const luc = new Date().toISOString();
  for (const h of HANG_KHACH) {
    const tich = tiLeMotDiem(moi.tichHang[h]) as number, doi = tiLeMotDiem(moi.doiHang[h]) as number;
    if (tich === cu.tichHang[h].tien && doi === cu.doiHang[h].tien) continue;
    const { error: e2 } = await db.from("hang_diem_cau_hinh").update({ tien_moi_diem: tich, tien_doi_moi_diem: doi, cap_nhat_luc: luc, cap_nhat_boi: nd.nhanVienId }).eq("hang", h);
    if (e2) return { loi: thongBaoLoi(e2) };
  }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_diem_khach_hang", doi_tuong: "cau_hinh", chi_tiet: { truoc: cu, sau: moi } });
  revalidatePath("/cai-dat/diem-thuong");
  revalidatePath("/cai-dat/thong-tin-chung");
  return { ok: true };
}

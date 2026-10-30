"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { guiChoNhanVien } from "@/lib/push";

type KQ = { ok?: true; loi?: string };

/** Nhập điểm KPI tháng cho một người. Nhân sự (hr.hoso) nhập cho ai cũng được; trưởng phòng chỉ nhập cho người cùng phòng. Mỗi (người, tháng) một điểm, nhập lại thì ghi đè. Nhập xong báo trưởng phòng và người được chấm. */
export async function luuDiemKpi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.xem");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), nam = Number(chuoi(fd, "nam")), thang = Number(chuoi(fd, "thang")), diem = so(fd, "diem");
  if (!nv || !Number.isInteger(nam) || nam < 2020 || nam > 2100 || !Number.isInteger(thang) || thang < 1 || thang > 12) return { loi: "Chọn nhân viên, năm và tháng." };
  if (diem < 0 || diem > 200) return { loi: "Điểm từ 0 đến 200." };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("ho_ten, phong_ban_id, chi_nhanh_id").eq("id", nv).maybeSingle();
  if (!n) return { loi: KHONG_DU_QUYEN };
  const { data: pb } = n.phong_ban_id ? await db.from("phong_ban").select("truong_phong_id").eq("id", n.phong_ban_id).maybeSingle() : { data: null };
  const laNhanSu = nd.quyen.includes("hr.hoso") && (!nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId);
  const laTruongPhong = !!pb?.truong_phong_id && pb.truong_phong_id === nd.nhanVienId;
  if (!laNhanSu && !laTruongPhong) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("kpi_diem").upsert({ nhan_vien_id: nv, nam, thang, diem, nguon: "nhap_tay", ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_nhap_id: nd.nhanVienId }, { onConflict: "nhan_vien_id,nam,thang" });
  if (error) return { loi: thongBaoLoi(error) };
  const nhan = [nv, pb?.truong_phong_id ?? ""].filter((x) => x && x !== nd.nhanVienId);
  await guiChoNhanVien(nhan, { tieuDe: "Điểm KPI tháng " + thang, noiDung: `${n.ho_ten}: ${diem} điểm KPI tháng ${thang}/${nam}. Xem xếp hạng thi đua.`, url: `/nhan-su/kpi?ky=thang&nam=${nam}&moc=${thang}`, tag: `kpi-${nam}-${thang}` });
  revalidatePath("/nhan-su/kpi");
  return { ok: true };
}

/** Mức thưởng cho hạng 1-3 (theo tháng/quý, phòng/cá nhân trong phòng/công ty). Chỉ nhân sự không gắn chi nhánh sửa vì mức thưởng dùng chung. */
export async function luuThuongKpi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd || nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const ky = chuoi(fd, "ky"), doiTuong = chuoi(fd, "doi_tuong"), hang = Number(chuoi(fd, "hang")), tien = Math.round(so(fd, "so_tien"));
  if (!["thang", "quy"].includes(ky) || !["phong", "ca_nhan_phong", "cong_ty"].includes(doiTuong) || ![1, 2, 3].includes(hang)) return { loi: "Chọn kỳ, đối tượng và hạng 1 đến 3." };
  if (tien < 0 || tien > 1_000_000_000) return { loi: "Số tiền chưa hợp lệ." };
  const { error } = await sb().from("kpi_thuong").upsert({ ky, doi_tuong: doiTuong, hang, so_tien: tien }, { onConflict: "ky,doi_tuong,hang" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/kpi");
  return { ok: true };
}

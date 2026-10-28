"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, so } from "@/lib/form";
import { dongWebDatLich, layWebDatLich, loiWebDatLich, type WebDatLich } from "@/lib/web-dat-lich";

type KQ = { ok?: true; loi?: string };

/** Lưu tuỳ chọn Web đặt Lịch. Mở/khoá trang ra Internet nên chỉ người quản lý (nhanvien.quanly), như nút "Đặt lịch online" cũ; nhật ký ghi giá trị trước và sau. */
export async function luuWebDatLich(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const moi: WebDatLich = {
    baoTruocPhut: Math.round(so(fd, "bao_truoc_phut")), toiDaNgay: Math.round(so(fd, "toi_da_ngay")), khoaTrang: bat(fd, "khoa_trang"),
    chonKtv: bat(fd, "chon_ktv"), hienDvSp: bat(fd, "hien_dv_sp"), hienBuoi: bat(fd, "hien_buoi"), hienGia: bat(fd, "hien_gia"), doiTuong: chuoi(fd, "doi_tuong"),
    khungPhut: Math.round(so(fd, "khung_phut")), toiDaLuot: Math.round(so(fd, "toi_da_luot")), thoiLuongPhut: Math.round(so(fd, "thoi_luong_phut")),
    trangThai: chuoi(fd, "trang_thai"), ngonNgu: chuoi(fd, "ngon_ngu"), mau: chuoi(fd, "mau"), macDinhMau: bat(fd, "mac_dinh_mau"),
    tatThongBao: bat(fd, "tat_thong_bao"), guiEmailNv: bat(fd, "gui_email_nv"), amThanh: bat(fd, "am_thanh"),
    emailNhan: chuoi(fd, "email_nhan").split(/[\s,;]+/).filter(Boolean),
  };
  const loi = loiWebDatLich(moi);
  if (loi) return { loi };
  const db = sb();
  const cu = await layWebDatLich(db);
  const { error } = await db.from("cau_hinh").upsert(dongWebDatLich(moi), { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_cau_hinh", doi_tuong: "cau_hinh", chi_tiet: { khoa: "dat_online", truoc: cu, sau: moi } });
  revalidatePath("/cai-dat/web-dat-lich");
  revalidatePath("/dat-lich");
  revalidatePath("/danh-muc");
  return { ok: true };
}

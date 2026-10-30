"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, soHoacNull } from "@/lib/form";
import { NGAY_ISO, nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };

/** Đơn nghỉ việc có nằm trong phạm vi người dùng không (đơn chưa bị từ chối/huỷ). */
async function donTrongPham(chiNhanhId: string | null, nghiViecId: string) {
  const { data } = await sb().from("nghi_viec").select("nhan_vien_id, trang_thai").eq("id", nghiViecId).maybeSingle();
  if (!data || !["cho_duyet", "da_duyet", "hoan_tat"].includes(data.trang_thai)) return null;
  return (await nvTrongPham(chiNhanhId, data.nhan_vien_id)) ? data : null;
}

/** Đánh dấu một mục bàn giao xong (hoặc bỏ đánh dấu). Đủ mọi mục đang dùng thì đơn nghỉ việc tự ghi "bàn giao xong". */
export async function danhDauBanGiao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = chuoi(fd, "nghi_viec_id"), muc = chuoi(fd, "muc_id"), huy = chuoi(fd, "huy") === "1";
  if (!(await donTrongPham(nd.chiNhanhId, don))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { error } = huy ? await db.from("ban_giao_tien_do").delete().eq("nghi_viec_id", don).eq("muc_id", muc)
    : await db.from("ban_giao_tien_do").upsert({ nghi_viec_id: don, muc_id: muc, nguoi_id: nd.nhanVienId ?? null }, { onConflict: "nghi_viec_id,muc_id" });
  if (error) return { loi: thongBaoLoi(error) };
  const [{ data: ms }, { data: td }] = await Promise.all([db.from("ban_giao_muc").select("id").eq("hoat_dong", true), db.from("ban_giao_tien_do").select("muc_id").eq("nghi_viec_id", don)]);
  const xong = new Set((td ?? []).map((t) => t.muc_id));
  await db.from("nghi_viec").update({ ban_giao_xong: (ms ?? []).length > 0 && (ms ?? []).every((m) => xong.has(m.id)) }).eq("id", don);
  revalidatePath("/nhan-su/offboarding");
  return { ok: true };
}

/** Chốt công, lương còn lại, tiền phép và tháng BHXH cuối cho người nghỉ. Lưu nháp được; có tích "chốt" thì ghi thời điểm chốt và không sửa tiếp. */
export async function luuChotNghiViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = chuoi(fd, "nghi_viec_id"), cong = chuoi(fd, "cong_den_ngay"), bh = chuoi(fd, "bhxh_chot_den");
  if (!(await donTrongPham(nd.chiNhanhId, don))) return { loi: KHONG_DU_QUYEN };
  if ((cong && !NGAY_ISO.test(cong)) || (bh && !NGAY_ISO.test(bh))) return { loi: "Ngày chưa đúng." };
  const luong = soHoacNull(fd, "luong_con_lai"), phep = soHoacNull(fd, "tien_phep_con");
  if ((luong !== null && luong < 0) || (phep !== null && phep < 0)) return { loi: "Số tiền không được âm." };
  const db = sb();
  const { data: cu } = await db.from("chot_nghi_viec").select("chot_luc").eq("nghi_viec_id", don).maybeSingle();
  if (cu?.chot_luc) return { loi: "Đã chốt, không sửa nữa." };
  const chot = chuoi(fd, "chot") === "1";
  if (chot && (!cong || luong === null || !bh)) return { loi: "Muốn chốt cần đủ ngày công cuối, lương còn lại và tháng BHXH cuối." };
  const { error } = await db.from("chot_nghi_viec").upsert({ nghi_viec_id: don, cong_den_ngay: cong || null, luong_con_lai: luong === null ? null : Math.round(luong), tien_phep_con: phep === null ? null : Math.round(phep), bhxh_chot_den: bh || null, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), chot_boi_id: chot ? nd.nhanVienId ?? null : null, chot_luc: chot ? new Date().toISOString() : null }, { onConflict: "nghi_viec_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/offboarding");
  return { ok: true };
}

export async function luuPhongVanThoiViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = chuoi(fd, "nghi_viec_id"), ngay = chuoi(fd, "ngay_pv");
  if (!(await donTrongPham(nd.chiNhanhId, don))) return { loi: KHONG_DU_QUYEN };
  if (!NGAY_ISO.test(ngay)) return { loi: "Nhập ngày phỏng vấn." };
  const qly = chuoi(fd, "co_the_quay_lai");
  const { error } = await sb().from("phong_van_thoi_viec").upsert({ nghi_viec_id: don, ngay_pv: ngay, nguoi_pv_id: nd.nhanVienId ?? null, ly_do_chinh: chuoiHoacNull(fd, "ly_do_chinh"), dieu_hai_long: chuoiHoacNull(fd, "dieu_hai_long"), dieu_chua_hai_long: chuoiHoacNull(fd, "dieu_chua_hai_long"), de_xuat: chuoiHoacNull(fd, "de_xuat"), co_the_quay_lai: qly === "" ? null : qly === "1" }, { onConflict: "nghi_viec_id" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/offboarding");
  return { ok: true };
}

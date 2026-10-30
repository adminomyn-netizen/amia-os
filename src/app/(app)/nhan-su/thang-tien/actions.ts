"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so, soHoacNull } from "@/lib/form";
import { NGAY_ISO, nvTrongPham } from "@/lib/hr-pham-vi";

type KQ = { ok?: true; loi?: string };

/** Khung cấp bậc: mã, tên, bậc, khoảng lương, điều kiện lên bậc. Chỉ người xem toàn công ty (không gắn chi nhánh) được sửa vì khung dùng chung. */
export async function luuCapBac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd || nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ma = chuoi(fd, "ma").toUpperCase(), ten = chuoi(fd, "ten"), bac = Math.round(so(fd, "bac"));
  if (!/^[A-Z0-9._-]{1,20}$/.test(ma) || ten.length < 2 || ten.length > 120) return { loi: "Nhập mã (chữ, số, tối đa 20 ký tự) và tên cấp bậc." };
  if (bac < 1 || bac > 99) return { loi: "Bậc từ 1 đến 99." };
  const tu = soHoacNull(fd, "luong_tu"), den = soHoacNull(fd, "luong_den");
  if (tu !== null && den !== null && den < tu) return { loi: "Lương đến phải lớn hơn hoặc bằng lương từ." };
  const dong = { ma, ten, bac, luong_tu: tu, luong_den: den, dieu_kien: chuoiHoacNull(fd, "dieu_kien"), hoat_dong: id ? bat(fd, "hoat_dong") : true };
  const { error } = id ? await sb().from("cap_bac").update(dong).eq("id", id) : await sb().from("cap_bac").insert(dong);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/thang-tien");
  return { ok: true };
}

/** Ghi một lần thăng chức/điều chuyển/hạ bậc/tăng lương. Có hiệu lực từ hôm nay trở về trước và chọn "cập nhật hồ sơ" thì chức danh/phòng của hồ sơ đổi theo. */
export async function luuThangChuc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), loai = chuoi(fd, "loai"), hl = chuoi(fd, "hieu_luc_tu");
  if (!nv || !["thang_chuc", "dieu_chuyen", "ha_bac", "tang_luong"].includes(loai) || !NGAY_ISO.test(hl)) return { loi: "Chọn nhân viên, loại thay đổi và ngày hiệu lực." };
  if (!(await nvTrongPham(nd.chiNhanhId, nv))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("chuc_danh, phong_ban_id").eq("id", nv).maybeSingle();
  if (!n) return { loi: KHONG_DU_QUYEN };
  const den = chuoiHoacNull(fd, "den_chuc_danh"), denPhong = chuoiHoacNull(fd, "den_phong_id"), capBac = chuoiHoacNull(fd, "cap_bac_id");
  if (!den && !denPhong && !capBac && loai !== "tang_luong") return { loi: "Nhập chức danh mới, phòng mới hoặc cấp bậc mới." };
  const { error } = await db.from("thang_chuc").insert({ nhan_vien_id: nv, loai, tu_chuc_danh: n.chuc_danh, den_chuc_danh: den, tu_phong_id: n.phong_ban_id, den_phong_id: denPhong, cap_bac_id: capBac, hieu_luc_tu: hl, so_quyet_dinh: chuoiHoacNull(fd, "so_quyet_dinh"), ly_do: chuoiHoacNull(fd, "ly_do"), nguoi_tao_id: nd.nhanVienId ?? null });
  if (error) return { loi: thongBaoLoi(error) };
  const hom = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  if (bat(fd, "cap_nhat_ho_so") && hl <= hom && (den || denPhong)) {
    const sua: { chuc_danh?: string; phong_ban_id?: string } = {};
    if (den) sua.chuc_danh = den;
    if (denPhong) sua.phong_ban_id = denPhong;
    const { error: e2 } = await db.from("nhan_vien").update(sua).eq("id", nv);
    if (e2) return { loi: `Đã ghi lịch sử nhưng chưa cập nhật được hồ sơ: ${thongBaoLoi(e2)}` };
  }
  revalidatePath("/nhan-su", "layout");
  return { ok: true };
}

"use server";

import { revalidatePath, updateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, mang } from "@/lib/form";
import { docThamSo } from "@/lib/khach-danh-sach";

type KQ = { ok?: true; loi?: string };
export type KqXemTruoc = { loi?: string; tong?: number; thayDoi?: number; daApDung?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAU = /^#[0-9a-f]{6}$/i;

/** Danh mục nhóm có trong bộ nhớ đệm của ô lọc: đổi nhóm thì làm mới ngay. */
function lamMoi() {
  updateTag("khach-tuy-chon-loc");
  revalidatePath("/khach-hang", "layout");
}

/** Tạo / sửa một nhóm (tên, màu, mô tả). Chỉ người sửa danh mục. Tên trùng chữ hoa/thường vẫn lưu được (chỉ cảnh báo ở màn hình, không tự gộp). */
export async function luuNhom(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const ten = chuoi(fd, "ten").replace(/\s+/g, " ");
  const mau = chuoi(fd, "mau");
  if (!ten) return { loi: "Nhập tên nhóm." };
  if (ten.length > 60) return { loi: "Tên nhóm tối đa 60 ký tự." };
  if (mau && !MAU.test(mau)) return { loi: "Màu phải có dạng #RRGGBB (ví dụ #03a9f4)." };
  if (id && !UUID.test(id)) return { loi: "Nhóm không hợp lệ." };
  const db = sb();
  const row = { ten, mau: mau ? mau.toLowerCase() : null, mo_ta: chuoiHoacNull(fd, "mo_ta")?.slice(0, 300) ?? null };
  if (id) {
    const { error } = await db.from("nhom_khach").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data, error } = await db.from("nhom_khach").insert(row).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "tao_nhom_khach", doi_tuong: "nhom_khach", doi_tuong_id: data.id, chi_tiet: { ten } });
    lamMoi();
    return { ok: true };
  }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_nhom_khach", doi_tuong: "nhom_khach", doi_tuong_id: id, chi_tiet: { ten, mau: row.mau } });
  lamMoi();
  return { ok: true };
}

/** Xoá mềm: ẩn nhóm (an=1) hoặc khôi phục (an=0). Các khách đã gắn nhóm giữ nguyên liên kết, nhóm hiện lại là có lại nhãn. */
export async function anNhom(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (!UUID.test(id)) return { loi: "Nhóm không hợp lệ." };
  const an = chuoi(fd, "an") === "1";
  const { error } = await sb().from("nhom_khach").update({ hoat_dong: !an }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: an ? "an_nhom_khach" : "khoi_phuc_nhom_khach", doi_tuong: "nhom_khach", doi_tuong_id: id });
  lamMoi();
  return { ok: true };
}

/** Đặt lại tập nhóm của MỘT khách (khách có nhiều nhóm): chỉ đụng tới nhóm đang hoạt động, nhóm đã ẩn giữ nguyên liên kết. */
export async function ganNhomChoKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id");
  if (!UUID.test(khachId)) return { loi: "Khách không hợp lệ." };
  const chon = [...new Set(mang(fd, "nhom"))].filter((x) => UUID.test(x));
  const db = sb();
  const [{ data: dang }, { data: hoatDong }] = await Promise.all([
    db.from("khach_nhom").select("nhom_id").eq("khach_id", khachId),
    db.from("nhom_khach").select("id").eq("hoat_dong", true),
  ]);
  const ds = new Set((hoatDong ?? []).map((n) => n.id));
  const moi = new Set(chon.filter((x) => ds.has(x)));
  const cu = new Set((dang ?? []).map((n) => n.nhom_id).filter((x) => ds.has(x)));
  const them = [...moi].filter((x) => !cu.has(x));
  const bo = [...cu].filter((x) => !moi.has(x));
  if (bo.length) { const { error } = await db.from("khach_nhom").delete().eq("khach_id", khachId).in("nhom_id", bo); if (error) return { loi: thongBaoLoi(error) }; }
  if (them.length) { const { error } = await db.from("khach_nhom").insert(them.map((nhom_id) => ({ khach_id: khachId, nhom_id }))); if (error) return { loi: thongBaoLoi(error) }; }
  if (them.length || bo.length) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "gan_nhom_khach", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { them, bo } });
  updateTag("khach-tuy-chon-loc");
  revalidatePath("/khach-hang", "layout");
  return { ok: true };
}

/**
 * Gán / bỏ một nhóm cho TẤT CẢ khách khớp bộ lọc đang chọn. `ap_dung` rỗng = chỉ xem trước (đếm số khách sẽ bị tác động).
 * Bộ lọc đọc lại ở máy chủ từ chuỗi địa chỉ (không tin JSON của trình duyệt); người gắn một chi nhánh bị khoá về chi nhánh đó.
 * Không xoá hay sửa khách: chỉ thêm / bớt liên kết khách–nhóm. Áp dụng ghi nhật ký (bộ lọc, nhóm, số khách).
 */
export async function ganHangLoat(fd: FormData): Promise<KqXemTruoc> {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nhom = chuoi(fd, "nhom");
  const che = chuoi(fd, "che_do");
  if (!UUID.test(nhom)) return { loi: "Chọn nhóm cần gán." };
  if (che !== "gan" && che !== "bo") return { loi: "Chọn gán hoặc bỏ nhóm." };
  const ts = docThamSo(new URLSearchParams(chuoi(fd, "bo_loc")));
  if (nd.chiNhanhId) ts.chi_nhanh = nd.chiNhanhId;
  const p: Record<string, string> = { ...ts } as Record<string, string>;
  const apDung = chuoi(fd, "ap_dung") === "1";
  const duKien = chuoi(fd, "du_kien");
  const { data, error } = await sb().rpc("gan_nhom_theo_loc", { p, p_nhom: nhom, p_che_do: che, p_ap_dung: apDung, ...(apDung && /^\d+$/.test(duKien) ? { p_du_kien: Number(duKien) } : {}) });
  if (error) return { loi: thongBaoLoi(error) };
  const kq = (data ?? {}) as { tong?: number; thay_doi?: number };
  if (apDung) {
    await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: che === "gan" ? "gan_nhom_hang_loat" : "bo_nhom_hang_loat", doi_tuong: "nhom_khach", doi_tuong_id: nhom, chi_tiet: { bo_loc: p, so_khach_khop: kq.tong ?? 0, so_thay_doi: kq.thay_doi ?? 0 } });
    updateTag("khach-tuy-chon-loc");
    revalidatePath("/khach-hang", "layout");
  }
  return { tong: kq.tong ?? 0, thayDoi: kq.thay_doi ?? 0, daApDung: apDung };
}

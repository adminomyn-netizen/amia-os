"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { guiChoNhanVien, nguoiCoQuyen } from "@/lib/push";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { xepThuTheoBuoc } from "@/lib/email-tuyen-dung-gui";
import { BUOC_UNG_VIEN, KENH_DANG, LOAI_TUYEN, TRANG_THAI_TIN, buocTiepTheoYeuCau } from "@/lib/tuyen-dung";

type KQ = { ok?: true; loi?: string };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const lamMoi = () => { revalidatePath("/nhan-su/tuyen-dung"); revalidatePath("/nhan-su", "layout"); };
const trong = (xs: readonly string[], v: string) => xs.includes(v);

/** Gửi yêu cầu tuyển dụng (quản lý/HCNS có quyền xem công). Hành chính nhân sự tiếp nhận rồi mới đăng tin. */
export async function guiYeuCauTuyen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.xem");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const viTri = chuoi(fd, "vi_tri"), loai = chuoi(fd, "loai_tuyen") || "Trong định biên", sl = so(fd, "so_luong") || 1, han = chuoi(fd, "han_can_nhan_su");
  if (viTri.length < 2 || viTri.length > 120) return { loi: "Nhập vị trí cần tuyển (2–120 ký tự)." };
  if (!trong(LOAI_TUYEN, loai)) return { loi: "Loại tuyển không hợp lệ." };
  if (sl < 1 || sl > 99) return { loi: "Số lượng từ 1 đến 99." };
  if (han && !NGAY.test(han)) return { loi: "Ngày cần nhân sự chưa đúng." };
  const db = sb();
  const ma = `YC-${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "yc" })).data ?? 0)).padStart(4, "0")}`;
  const { error } = await db.from("yeu_cau_tuyen_dung").insert({ ma, vi_tri: viTri, chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id") ?? nd.chiNhanhId, so_luong: sl, loai_tuyen: loai, thay_the_cho: chuoiHoacNull(fd, "thay_the_cho"), muc_luong: chuoiHoacNull(fd, "muc_luong"), yeu_cau_chinh: chuoiHoacNull(fd, "yeu_cau_chinh"), han_can_nhan_su: han || null, nguoi_yeu_cau_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  await guiChoNhanVien((await nguoiCoQuyen("cong.sua", null)).filter((u) => u !== nd.nhanVienId), { tieuDe: "Yêu cầu tuyển dụng mới", noiDung: `${nd.hoTen} gửi yêu cầu tuyển ${viTri}.`, url: "/nhan-su/tuyen-dung?tab=yeu-cau", tag: "tuyen-dung-yc" });
  lamMoi();
  return { ok: true };
}

/** Chuyển yêu cầu sang bước kế (đi tiến, không nhảy cóc). Từ chối phải có lý do. */
export async function chuyenYeuCau(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id"), den = chuoi(fd, "den"), ly = chuoi(fd, "ly_do");
  const { data: yc } = await db.from("yeu_cau_tuyen_dung").select("id, trang_thai, nguoi_yeu_cau_id, vi_tri").eq("id", id).maybeSingle();
  if (!yc) return { loi: "Không tìm thấy yêu cầu." };
  if (!buocTiepTheoYeuCau(yc.trang_thai).includes(den as never)) return { loi: `Yêu cầu đang "${yc.trang_thai}", không chuyển được sang "${den}".` };
  if (den === "Từ chối" && !ly) return { loi: "Nhập lý do từ chối." };
  const cap: TablesUpdate<"yeu_cau_tuyen_dung"> = { trang_thai: den };
  if (den === "Đã tiếp nhận") { cap.nguoi_tiep_nhan_id = nd.nhanVienId; cap.ngay_tiep_nhan = new Date().toISOString(); }
  if (den === "Từ chối") cap.ly_do_tu_choi = ly;
  if (den === "Hoàn thành") cap.ngay_hoan_thanh = new Date().toISOString();
  const { data, error } = await db.from("yeu_cau_tuyen_dung").update(cap).eq("id", id).eq("trang_thai", yc.trang_thai).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Yêu cầu vừa được người khác xử lý." };
  if (yc.nguoi_yeu_cau_id && yc.nguoi_yeu_cau_id !== nd.nhanVienId) await guiChoNhanVien([yc.nguoi_yeu_cau_id], { tieuDe: "Yêu cầu tuyển dụng có cập nhật", noiDung: `Yêu cầu tuyển ${yc.vi_tri}: ${den.toLowerCase()}.`, url: "/nhan-su/tuyen-dung?tab=yeu-cau", tag: `tuyen-dung-yc-${id}` });
  lamMoi();
  return { ok: true };
}

export async function luuTinTuyen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), viTri = chuoi(fd, "vi_tri"), han = chuoi(fd, "han_nop"), tt = chuoi(fd, "trang_thai") || "Đang tuyển", sl = so(fd, "so_luong_can") || 1;
  if (viTri.length < 2 || viTri.length > 120) return { loi: "Nhập vị trí (2–120 ký tự)." };
  if (han && !NGAY.test(han)) return { loi: "Hạn nộp chưa đúng." };
  if (!trong(TRANG_THAI_TIN, tt)) return { loi: "Trạng thái tin không hợp lệ." };
  if (sl < 1 || sl > 99) return { loi: "Số lượng cần từ 1 đến 99." };
  const row = { vi_tri: viTri, chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), yeu_cau_id: chuoiHoacNull(fd, "yeu_cau_id"), so_luong_can: sl, han_nop: han || null, mo_ta: chuoiHoacNull(fd, "mo_ta"), trang_thai: tt };
  const db = sb();
  const { error } = id ? await db.from("tin_tuyen_dung").update(row).eq("id", id) : await db.from("tin_tuyen_dung").insert(row);
  if (error) return { loi: thongBaoLoi(error) };
  // Có tin đăng cho yêu cầu đã tiếp nhận thì yêu cầu chuyển sang "Đang đăng tin".
  if (row.yeu_cau_id) await db.from("yeu_cau_tuyen_dung").update({ trang_thai: "Đang đăng tin" }).eq("id", row.yeu_cau_id).eq("trang_thai", "Đã tiếp nhận");
  lamMoi();
  return { ok: true };
}

export async function xoaTinTuyen(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("cong.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { count } = await db.from("ung_vien").select("id", { count: "exact", head: true }).eq("tin_id", id);
  if ((count ?? 0) > 0) return { loi: "Tin đã có ứng viên, không xoá được. Đóng tin thay vì xoá." };
  const { error } = await db.from("tin_tuyen_dung").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function luuUngVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id"), ten = chuoi(fd, "ho_ten"), buoc = chuoi(fd, "trang_thai") || "Mới nộp", pv = chuoi(fd, "ngay_phong_van"), nv = chuoi(fd, "ngay_nhan_viec"), ly = chuoi(fd, "ly_do_khong_dat");
  if (ten.length < 2 || ten.length > 80) return { loi: "Nhập họ tên ứng viên (2–80 ký tự)." };
  if (!chuoi(fd, "tin_id")) return { loi: "Chọn tin tuyển dụng." };
  if (!trong(BUOC_UNG_VIEN, buoc)) return { loi: "Bước tuyển dụng không hợp lệ." };
  if ((pv && !NGAY.test(pv)) || (nv && !NGAY.test(nv))) return { loi: "Ngày chưa đúng." };
  if (buoc === "Nhận việc" && !nv) return { loi: "Ứng viên nhận việc phải có ngày nhận việc." };
  if (buoc === "Không đạt" && !ly) return { loi: "Ứng viên không đạt phải ghi lý do." };
  const row = { tin_id: chuoi(fd, "tin_id"), ho_ten: ten, dien_thoai: chuoiHoacNull(fd, "dien_thoai"), email: chuoiHoacNull(fd, "email"), nguon: chuoiHoacNull(fd, "nguon"), trang_thai: buoc, ngay_phong_van: pv || null, ngay_nhan_viec: nv || null, ly_do_khong_dat: ly || null, ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  const truoc = id ? (await db.from("ung_vien").select("trang_thai").eq("id", id).maybeSingle()).data?.trang_thai : null;
  const { data: luu, error } = id ? await db.from("ung_vien").update(row).eq("id", id).select("id").maybeSingle() : await db.from("ung_vien").insert(row).select("id").maybeSingle();
  if (error) return { loi: thongBaoLoi(error) };
  // Sang bước mới (hoặc ứng viên mới) có mẫu thư thì xếp thư vào hàng đợi; mẫu bật "tự gửi" thì gửi luôn.
  if (luu && truoc !== buoc) await xepThuTheoBuoc(luu.id, nd.nhanVienId ?? null);
  lamMoi();
  return { ok: true };
}

export async function xoaUngVien(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("cong.sua"))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("ung_vien").delete().eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Ghi một bài đăng tin theo kênh (kèm link và chi phí) để báo cáo chi phí mỗi người nhận việc. */
export async function luuDangKenh(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("cong.sua"))) return { loi: KHONG_DU_QUYEN };
  const kenh = chuoi(fd, "kenh"), ngay = chuoi(fd, "ngay_dang"), chiPhi = so(fd, "chi_phi");
  if (!chuoi(fd, "tin_id")) return { loi: "Chọn tin tuyển dụng." };
  if (!trong(KENH_DANG, kenh)) return { loi: "Chọn kênh đăng." };
  if (ngay && !NGAY.test(ngay)) return { loi: "Ngày đăng chưa đúng." };
  if (chiPhi < 0) return { loi: "Chi phí không âm." };
  const { error } = await sb().from("dang_tin_kenh").insert({ tin_id: chuoi(fd, "tin_id"), kenh, link_bai: chuoiHoacNull(fd, "link_bai"), ngay_dang: ngay || new Date().toISOString().slice(0, 10), chi_phi: chiPhi, ghi_chu: chuoiHoacNull(fd, "ghi_chu") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function goDangKenh(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("cong.sua"))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("dang_tin_kenh").update({ trang_thai: "Đã gỡ" }).eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

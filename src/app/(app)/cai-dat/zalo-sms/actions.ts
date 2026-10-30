"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi } from "@/lib/form";
import { gopCauHinh, giaiMaCauHinh, laKenhNoi, maHoaCauHinh, THONG_TIN_KENH } from "@/lib/ket-noi-ben-thu-ba";
import { biMatKetNoi, guiThuNghiem } from "@/lib/ket-noi-ben-thu-ba-may-chu";
import { bienLa, laKenhTin } from "@/lib/tin-nhan";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/cai-dat/zalo-sms");

/** Chỉ người sửa được danh mục và KHÔNG gắn chi nhánh mới đổi kết nối / mẫu tin (kết nối dùng chung cả công ty). */
async function nguoiSua() {
  const nd = await kiemQuyen("danhmuc.sua");
  return nd && !nd.chiNhanhId ? nd : null;
}

/** Lưu khoá của một kênh. Khoá được mã hoá trước khi lưu; ô để trống thì giữ khoá cũ. Chưa gọi nhà cung cấp để kiểm khoá. */
export async function luuKetNoi(fd: FormData): Promise<KQ> {
  const nd = await nguoiSua();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const kenh = chuoi(fd, "kenh");
  if (!laKenhNoi(kenh)) return { loi: "Kênh không hợp lệ." };
  if (!biMatKetNoi()) return { loi: "Máy chủ chưa có khoá để mã hoá, báo kỹ thuật." };
  const db = sb();
  const { data: cu } = await db.from("ket_noi_ben_thu_ba").select("cau_hinh_ma_hoa").eq("kenh", kenh).maybeSingle();
  const nhap: Record<string, string> = {};
  for (const t of THONG_TIN_KENH[kenh].truong) nhap[t.ten] = chuoi(fd, t.ten);
  const kq = gopCauHinh(kenh, nhap, cu ? giaiMaCauHinh(cu.cau_hinh_ma_hoa, biMatKetNoi()) : null);
  if ("loi" in kq) return { loi: kq.loi };
  const { error } = await db.from("ket_noi_ben_thu_ba").upsert({
    kenh, cau_hinh_ma_hoa: maHoaCauHinh(kq.cauHinh, biMatKetNoi()), ten_hien_thi: THONG_TIN_KENH[kenh].ten, trang_thai: "da_noi", nguoi_id: nd.nhanVienId ?? null, sua_luc: new Date().toISOString(),
  });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function ngatKetNoi(fd: FormData): Promise<KQ> {
  const nd = await nguoiSua();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const kenh = chuoi(fd, "kenh");
  if (!laKenhNoi(kenh)) return { loi: "Kênh không hợp lệ." };
  const { error } = await sb().from("ket_noi_ben_thu_ba").delete().eq("kenh", kenh);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Gửi thử một tin. Chưa có thư viện gọi nhà cung cấp nên hiện lời báo chưa gửi được, không giả vờ thành công. */
export async function guiThu(fd: FormData): Promise<KQ> {
  const nd = await nguoiSua();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const kenh = chuoi(fd, "kenh");
  if (!laKenhNoi(kenh)) return { loi: "Kênh không hợp lệ." };
  const loi = await guiThuNghiem(kenh, chuoi(fd, "den"));
  return loi ? { loi } : { ok: true };
}

/** Sửa mẫu tin và bật/tắt. Mẫu mới cài đều tắt. */
export async function luuMauTin(fd: FormData): Promise<KQ> {
  const nd = await nguoiSua();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ma = chuoi(fd, "ma"), ten = chuoi(fd, "ten"), noiDung = chuoi(fd, "noi_dung"), kenh = chuoi(fd, "kenh");
  if (!laKenhTin(kenh)) return { loi: "Chọn kênh gửi." };
  if (ten.length < 2 || ten.length > 100 || noiDung.length < 2 || noiDung.length > 1000) return { loi: "Nhập tên (2 đến 100 ký tự) và nội dung (2 đến 1000 ký tự)." };
  const la = bienLa(noiDung);
  if (la.length) return { loi: `Biến không dùng được: ${la.map((b) => `{{${b}}}`).join(" ")}.` };
  const { error } = await sb().from("tin_nhan_mau").update({ kenh, ten, noi_dung: noiDung, bat: bat(fd, "bat"), sua_luc: new Date().toISOString() }).eq("ma", ma);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Huỷ một tin đang chờ. Người gắn chi nhánh chỉ huỷ được tin của chi nhánh mình (hoặc tin chưa gắn chi nhánh). */
export async function huyTinTrongHangDoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: t } = await db.from("tin_nhan_hang_doi").select("id, chi_nhanh_id, trang_thai").eq("id", id).maybeSingle();
  if (!t || t.trang_thai !== "cho_gui") return { loi: "Tin này không còn ở trạng thái chờ gửi." };
  if (nd.chiNhanhId && t.chi_nhanh_id && t.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("tin_nhan_hang_doi").update({ trang_thai: "huy" }).eq("id", id).eq("trang_thai", "cho_gui");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

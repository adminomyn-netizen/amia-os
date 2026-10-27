"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so, soHoacNull } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/kho-mua-sam", "layout"); };
const dem = async (k: string, tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(6, "0")}`;

export async function luuNhaCungCap(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("mua.tao"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    ten: chuoi(fd, "ten"), nguoi_lien_he: chuoiHoacNull(fd, "nguoi_lien_he"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), email: chuoiHoacNull(fd, "email"),
    dia_chi: chuoiHoacNull(fd, "dia_chi"), ma_so_thue: chuoiHoacNull(fd, "ma_so_thue"), so_ngay_no: Math.max(0, Math.min(365, Math.round(soHoacNull(fd, "so_ngay_no") ?? 30))), ghi_chu: chuoiHoacNull(fd, "ghi_chu"),
  };
  if (!row.ten) return { loi: "Nhập tên nhà cung cấp." };
  const { error } = id ? await sb().from("nha_cung_cap").update({ ...row, hoat_dong: chuoi(fd, "hoat_dong") !== "0" }).eq("id", id) : await sb().from("nha_cung_cap").insert({ ...row, ma: await dem("ncc", "NCC") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function taoDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), ncc = chuoi(fd, "ncc_id");
  if (!cn || !ncc) return { loi: "Chọn chi nhánh nhận hàng và nhà cung cấp." };
  const { data: n } = await sb().from("nha_cung_cap").select("id").eq("id", ncc).eq("hoat_dong", true).maybeSingle();
  if (!n) return { loi: "Nhà cung cấp không hợp lệ hoặc đã ngừng." };
  const dk = chuoiHoacNull(fd, "ngay_du_kien");
  const { error } = await sb().from("don_mua").insert({ ma: await dem("don_mua", "DM"), chi_nhanh_id: cn, ncc_id: ncc, ngay_du_kien: dk, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_tao_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Đọc đơn và chặn theo chi nhánh của người thao tác. */
async function layDon(id: string, chiNhanhId: string | null) {
  const { data } = await sb().from("don_mua").select("*").eq("id", id).maybeSingle();
  return data && (!chiNhanhId || data.chi_nhanh_id === chiNhanhId) ? data : null;
}

export async function themDongDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don) return { loi: "Không tìm thấy đơn mua." };
  if (don.trang_thai !== "nhap") return { loi: "Chỉ sửa được đơn đang ở trạng thái nháp." };
  const sl = so(fd, "so_luong"), gia = so(fd, "don_gia"), sp = chuoi(fd, "san_pham_id");
  if (!sp || !(sl > 0)) return { loi: "Chọn sản phẩm và nhập số lượng lớn hơn 0." };
  if (!Number.isInteger(gia) || gia < 0) return { loi: "Đơn giá là số đồng, không âm." };
  const { error } = await sb().from("don_mua_dong").upsert({ don_mua_id: don.id, san_pham_id: sp, so_luong: sl, don_gia: gia }, { onConflict: "don_mua_id,san_pham_id" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function xoaDongDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don || don.trang_thai !== "nhap") return { loi: "Chỉ xoá được dòng khi đơn còn là nháp." };
  const { error } = await sb().from("don_mua_dong").delete().eq("id", chuoi(fd, "dong_id")).eq("don_mua_id", don.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function guiDuyetDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don || don.trang_thai !== "nhap") return { loi: "Đơn không ở trạng thái nháp." };
  const { count } = await sb().from("don_mua_dong").select("id", { count: "exact", head: true }).eq("don_mua_id", don.id);
  if (!count) return { loi: "Thêm ít nhất một dòng hàng trước khi gửi duyệt." };
  const { error } = await sb().from("don_mua").update({ trang_thai: "cho_duyet", ly_do: null }).eq("id", don.id).eq("trang_thai", "nhap");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Duyệt: người lập đơn không tự duyệt đơn của mình (trừ Kỹ thuật). Điều kiện trạng thái nằm ngay trong câu lệnh nên hai người bấm cùng lúc chỉ một lần thắng. */
export async function duyetDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don || don.trang_thai !== "cho_duyet") return { loi: "Đơn không ở trạng thái chờ duyệt." };
  if (don.nguoi_tao_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người lập đơn không tự duyệt đơn của mình." };
  const { data, error } = await sb().from("don_mua").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString() }).eq("id", don.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Đơn vừa được xử lý bởi người khác." };
  lamMoi();
  return { ok: true };
}

export async function tuChoiDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don || don.trang_thai !== "cho_duyet") return { loi: "Đơn không ở trạng thái chờ duyệt." };
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do từ chối." };
  const { error } = await sb().from("don_mua").update({ trang_thai: "nhap", ly_do: `Bị từ chối: ${ly}` }).eq("id", don.id).eq("trang_thai", "cho_duyet");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function huyDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don || !["nhap", "cho_duyet", "da_duyet"].includes(don.trang_thai)) return { loi: "Đơn đã nhận hàng hoặc đã huỷ, không huỷ được." };
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do huỷ." };
  const { error } = await sb().from("don_mua").update({ trang_thai: "huy", ly_do: ly }).eq("id", don.id).in("trang_thai", ["nhap", "cho_duyet", "da_duyet"]);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Nhận hàng: một giao dịch trong DB (sổ kho + số đã nhận + công nợ + trạng thái). `dong` là JSON [{dong_id, so_luong, so_lo, han_dung}]. */
export async function nhanHangDonMua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const don = await layDon(chuoi(fd, "don_id"), nd.chiNhanhId);
  if (!don) return { loi: "Không tìm thấy đơn mua." };
  let dong: unknown;
  try { dong = JSON.parse(chuoi(fd, "dong")); } catch { return { loi: "Dữ liệu nhận hàng không đọc được." }; }
  if (!Array.isArray(dong) || dong.every((d) => !(Number(d?.so_luong) > 0))) return { loi: "Nhập số lượng nhận cho ít nhất một dòng." };
  const { error } = await sb().rpc("nhan_hang_don_mua", { p_don: don.id, p_nguoi: nd.nhanVienId, p_dong: dong });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function thanhToanNcc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tien = so(fd, "so_tien"), ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!Number.isInteger(tien) || tien <= 0) return { loi: "Số tiền phải là số đồng lớn hơn 0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay > homNayHCM()) return { loi: "Ngày thanh toán không được ở tương lai." };
  const { data: quy } = await sb().from("quy").select("id, chi_nhanh_id").eq("id", chuoi(fd, "quy_id")).eq("hoat_dong", true).maybeSingle();
  if (!quy || (nd.chiNhanhId && quy.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Chọn quỹ hợp lệ." };
  const { error } = await sb().rpc("thanh_toan_ncc", { p_ncc: chuoi(fd, "ncc_id"), p_quy: quy.id, p_so_tien: tien, p_ngay: ngay, p_ghi_chu: chuoi(fd, "ghi_chu"), p_nguoi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  revalidatePath("/tai-chinh/so-quy");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/tai-chinh", "layout"); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const tien = (fd: FormData, k: string) => Math.max(0, Math.round(so(fd, k)));
const loiTrung = (e: { code?: string } | null) => (e?.code === "23505" ? "Hoá đơn này (cùng nhà cung cấp, số và ký hiệu) đã được ghi." : null);
const maHv = async () => `HV${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: "hd_dau_vao" })).data ?? 0)).padStart(6, "0")}`;
const linkOk = (l: string | null) => !l || /^https?:\/\//.test(l);

/** Khoản trả trước / hàng đã nhận mà hoá đơn chưa về: phải có hạn nhận, quá hạn thì báo "Hoá đơn chưa về quá hạn". */
export async function taoKhoanChoHoaDon(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const han = chuoi(fd, "han_nhan");
  if (!chuoi(fd, "ncc_id") || !NGAY.test(han) || !chuoi(fd, "muc_dich")) return { loi: "Chọn nhà cung cấp, nhập mục đích và hạn nhận hoá đơn." };
  const { error } = await sb().from("hoa_don_dau_vao").insert({ ma: await maHv(), ncc_id: chuoi(fd, "ncc_id"), don_mua_id: chuoiHoacNull(fd, "don_mua_id"), tien_hang: tien(fd, "tien_hang"), han_nhan: han, muc_dich: chuoi(fd, "muc_dich"), nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function ghiHoaDonDauVao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), soHd = chuoi(fd, "so_hd"), ngay = chuoi(fd, "ngay_hd"), link = chuoiHoacNull(fd, "link_file");
  if (!soHd || !NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Nhập số hoá đơn và ngày hoá đơn (không ở tương lai)." };
  if (!linkOk(link)) return { loi: "Link file phải bắt đầu bằng https://" };
  if (!(tien(fd, "tien_hang") > 0)) return { loi: "Nhập tiền hàng (chưa gồm thuế) lớn hơn 0." };
  const row = { so_hd: soHd, ky_hieu: chuoiHoacNull(fd, "ky_hieu"), ngay_hd: ngay, tien_hang: tien(fd, "tien_hang"), thue_gtgt: tien(fd, "thue_gtgt"), link_file: link, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), trang_thai: "da_nhan" };
  const db = sb();
  if (id) {
    const { data, error } = await db.from("hoa_don_dau_vao").update(row).eq("id", id).eq("trang_thai", "cho_hoa_don").select("id");
    if (error) return { loi: loiTrung(error) ?? thongBaoLoi(error) };
    if (!data?.length) return { loi: "Khoản này không còn ở trạng thái chờ hoá đơn." };
  } else {
    if (!chuoi(fd, "ncc_id")) return { loi: "Chọn nhà cung cấp." };
    const { error } = await db.from("hoa_don_dau_vao").insert({ ...row, ma: await maHv(), ncc_id: chuoi(fd, "ncc_id"), don_mua_id: chuoiHoacNull(fd, "don_mua_id"), nguoi_id: nd.nhanVienId });
    if (error) return { loi: loiTrung(error) ?? thongBaoLoi(error) };
  }
  lamMoi();
  return { ok: true };
}

/** Đối chiếu độc lập (người khác người ghi): có đơn mua thì so tiền hàng với giá trị hàng đã nhận; lệch thì ghi nhận sai lệch kèm giải trình. */
export async function doiChieuHoaDon(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: h } = await db.from("hoa_don_dau_vao").select("*").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!h || !["da_nhan", "sai_lech"].includes(h.trang_thai)) return { loi: "Hoá đơn không ở trạng thái cần đối chiếu." };
  if (h.nguoi_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người đối chiếu phải khác người ghi hoá đơn." };
  const chuThich = chuoiHoacNull(fd, "ghi_chu");
  let khop = true;
  if (h.don_mua_id) {
    const { data: dong } = await db.from("don_mua_dong").select("da_nhan, don_gia").eq("don_mua_id", h.don_mua_id);
    const nhan = (dong ?? []).reduce((a, d) => a + Math.round(Number(d.da_nhan) * Number(d.don_gia)), 0);
    khop = Math.abs(Number(h.tien_hang) - nhan) <= 1;
    if (!khop && !chuThich) return { loi: `Tiền hàng trên hoá đơn lệch giá trị hàng đã nhận (${nhan.toLocaleString("vi-VN")} đ). Ghi giải trình để ghi nhận sai lệch.` };
  }
  const { error } = await db.from("hoa_don_dau_vao").update({ trang_thai: khop ? "da_doi_chieu" : "sai_lech", doi_chieu_boi: nd.nhanVienId, doi_chieu_luc: new Date().toISOString(), ghi_chu: chuThich ?? h.ghi_chu }).eq("id", h.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function huyHoaDonDauVao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!chuoi(fd, "ly_do")) return { loi: "Ghi lý do huỷ." };
  const { data, error } = await sb().from("hoa_don_dau_vao").update({ trang_thai: "huy", ghi_chu: chuoi(fd, "ly_do") }).eq("id", chuoi(fd, "id")).in("trang_thai", ["cho_hoa_don", "da_nhan", "sai_lech"]).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Hoá đơn đã đối chiếu hoặc đã huỷ." };
  lamMoi();
  return { ok: true };
}

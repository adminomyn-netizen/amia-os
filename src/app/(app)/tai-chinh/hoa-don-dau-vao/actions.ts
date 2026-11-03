"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { randomUUID } from "node:crypto";
import { homNayHCM } from "@/lib/dinh-dang";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanMst, KHO_HDDV, kiemTraTepHddv, loaiTep, mstHopLe, thueSuatHopLe } from "@/lib/hoa-don-dau-vao";

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
  const { error } = await sb().from("hoa_don_dau_vao").insert({ ma: await maHv(), ncc_id: chuoi(fd, "ncc_id"), don_mua_id: chuoiHoacNull(fd, "don_mua_id"), tien_hang: tien(fd, "tien_hang"), han_nhan: han, muc_dich: chuoi(fd, "muc_dich"), nguoi_id: nd.nhanVienId, chi_nhanh_id: nd.chiNhanhId ?? chuoiHoacNull(fd, "chi_nhanh_id") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Tìm nhà cung cấp theo MST rồi theo tên; chưa có thì tạo mới (SalonHero nhập thẳng tên + MST người bán trên form hoá đơn). */
async function nccTheoHoaDon(fd: FormData): Promise<{ id?: string; loi?: string }> {
  const db = sb();
  const chon = chuoi(fd, "ncc_id");
  if (chon) return { id: chon };
  const mst = chuanMst(chuoi(fd, "ma_so_thue")), ten = chuoi(fd, "ten_ncc");
  if (mst && !mstHopLe(mst)) return { loi: "Mã số thuế gồm 10 số (hoặc 10 số - 3 số chi nhánh)." };
  if (!ten && !mst) return { loi: "Nhập tên nhà cung cấp hoặc mã số thuế." };
  if (mst) { const { data } = await db.from("nha_cung_cap").select("id").eq("ma_so_thue", mst).limit(1); if (data?.[0]) return { id: data[0].id }; }
  if (ten) { const { data } = await db.from("nha_cung_cap").select("id").ilike("ten", ten.replace(/[%_\\]/g, (c) => `\\${c}`)).limit(1); if (data?.[0]) return { id: data[0].id }; }
  if (!ten) return { loi: "Chưa có nhà cung cấp mang mã số thuế này. Nhập thêm tên nhà cung cấp." };
  const ma = `NCC${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "ncc" })).data ?? 0)).padStart(6, "0")}`;
  const { data, error } = await db.from("nha_cung_cap").insert({ ma, ten, ma_so_thue: mst || null, dia_chi: chuoiHoacNull(fd, "dia_chi"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), email: chuoiHoacNull(fd, "email") }).select("id").single();
  if (error || !data) return { loi: thongBaoLoi(error) };
  return { id: data.id };
}

/** Ghi hoá đơn đầu vào như form SalonHero: Tổng số tiền (gồm thuế) + Tiền thuế + Thuế suất; tiền hàng = tổng − thuế.
 *  Có id: điền hoá đơn cho khoản đang chờ, hoặc sửa hoá đơn chưa đối chiếu. */
export async function ghiHoaDonDauVao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), soHd = chuoi(fd, "so_hd"), ngay = chuoi(fd, "ngay_hd"), link = chuoiHoacNull(fd, "link_tra_cuu");
  if (!soHd || !NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Nhập số hoá đơn và ngày hoá đơn (không ở tương lai)." };
  if (!linkOk(link)) return { loi: "Link tra cứu phải bắt đầu bằng https://" };
  const tong = tien(fd, "tong_tien"), thue = tien(fd, "thue_gtgt"), ts = chuoi(fd, "thue_suat");
  if (!(tong > 0)) return { loi: "Nhập tổng số tiền hoá đơn lớn hơn 0." };
  if (thue >= tong) return { loi: "Tiền thuế phải nhỏ hơn tổng số tiền." };
  if (ts && !thueSuatHopLe(ts)) return { loi: "Chọn thuế suất trong danh sách." };
  const cnId = nd.chiNhanhId ?? chuoiHoacNull(fd, "chi_nhanh_id");
  const row = {
    so_hd: soHd, ky_hieu: chuoiHoacNull(fd, "ky_hieu"), ngay_hd: ngay, tien_hang: tong - thue, thue_gtgt: thue, thue_suat: ts || null,
    ma_tra_cuu: chuoiHoacNull(fd, "ma_tra_cuu"), link_tra_cuu: link, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), ...(cnId ? { chi_nhanh_id: cnId } : {}),
  };
  const db = sb();
  if (id) {
    const { data, error } = await db.from("hoa_don_dau_vao").update({ ...row, trang_thai: "da_nhan" }).eq("id", id).in("trang_thai", ["cho_hoa_don", "da_nhan", "sai_lech"]).select("id");
    if (error) return { loi: loiTrung(error) ?? thongBaoLoi(error) };
    if (!data?.length) return { loi: "Hoá đơn đã đối chiếu hoặc đã huỷ, không sửa được." };
  } else {
    if (!cnId) return { loi: "Chọn chi nhánh." };
    const ncc = await nccTheoHoaDon(fd);
    if (!ncc.id) return { loi: ncc.loi ?? "Chọn nhà cung cấp." };
    const { error } = await db.from("hoa_don_dau_vao").insert({ ...row, trang_thai: "da_nhan", ma: await maHv(), ncc_id: ncc.id, don_mua_id: chuoiHoacNull(fd, "don_mua_id"), nguoi_id: nd.nhanVienId });
    if (error) return { loi: loiTrung(error) ?? thongBaoLoi(error) };
  }
  lamMoi();
  return { ok: true };
}

/** Tệp hoá đơn (PDF, XML, Zip) bước 1: kiểm loại/dung lượng rồi cấp link tải thẳng lên kho riêng tư. */
export async function xinLinkTepHddv(fd: FormData): Promise<KQ & { duongDan?: string; token?: string }> {
  if (!(await kiemQuyen("quy.ghi"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten_tep");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Dữ liệu không hợp lệ." };
  const sai = kiemTraTepHddv(ten, Number(chuoi(fd, "kich_thuoc")));
  if (sai) return { loi: sai };
  const { data: h } = await sb().from("hoa_don_dau_vao").select("id, trang_thai").eq("id", id).maybeSingle();
  if (!h || h.trang_thai === "huy") return { loi: "Không tìm thấy hoá đơn." };
  const duongDan = `${id}/${randomUUID()}.${loaiTep(ten)!.duoi}`;
  const { data, error } = await createAdminClient().storage.from(KHO_HDDV).createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa mở được kho tệp. Thử lại sau." };
  return { ok: true, duongDan, token: data.token } as KQ & { duongDan: string; token: string };
}

/** Bước 2: tệp đã lên kho thì kiểm có thật, đúng dung lượng, rồi gắn vào hoá đơn (tệp cũ bị thay thì xoá khỏi kho). */
export async function xacNhanTepHddv(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("quy.ghi"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), duongDan = chuoi(fd, "duong_dan"), tenTep = chuoi(fd, "ten_tep").slice(0, 200) || "hoa-don";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !duongDan.startsWith(`${id}/`) || duongDan.includes("..")) return { loi: "Dữ liệu không hợp lệ." };
  const db = sb(), kho = createAdminClient().storage.from(KHO_HDDV);
  const ten = duongDan.slice(id.length + 1);
  const { data: ds } = await kho.list(id, { search: ten, limit: 5 });
  const tep = (ds ?? []).find((x) => x.name === ten);
  if (!tep) return { loi: "Chưa thấy tệp trong kho. Thử tải lại." };
  const sai = kiemTraTepHddv(tenTep, Number((tep.metadata as { size?: number } | undefined)?.size ?? 0));
  if (sai) { await kho.remove([duongDan]); return { loi: sai }; }
  const { data: cu } = await db.from("hoa_don_dau_vao").select("tep_duong_dan").eq("id", id).maybeSingle();
  const { error } = await db.from("hoa_don_dau_vao").update({ tep_duong_dan: duongDan, tep_ten: tenTep }).eq("id", id).neq("trang_thai", "huy");
  if (error) { await kho.remove([duongDan]); return { loi: thongBaoLoi(error) }; }
  if (cu?.tep_duong_dan && cu.tep_duong_dan !== duongDan) await kho.remove([cu.tep_duong_dan]);
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

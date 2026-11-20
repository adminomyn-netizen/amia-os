"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { boSuaHoaDon } from "../ban-hang/actions";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { lapPhieuThuNo } from "@/lib/thu-no";
import { kiemTaiKhoanKhoan, loaiViKhoanThu, PHUONG_THUC_TIEN } from "@/lib/ban-hang";
import { chuanTenNganHang, coNganHang } from "@/lib/ngan-hang-ten";

type KQ = { ok?: true; loi?: string };
const PT_THU_NO = PHUONG_THUC_TIEN.map((p) => p.gia_tri);

/** Tài khoản nhận của khoản thu nợ chuyển khoản / quẹt thẻ (0323): bắt buộc chọn; "Khác" = ngoài danh sách (chỉ ghi tên "Khác").
 *  Kiểm tài khoản đang dùng, đúng chức năng, đúng chi nhánh của MỌI hoá đơn được thu. */
async function taiKhoanThuNo(fd: FormData, pt: string, chiNhanhIds: string[]): Promise<{ loi: string } | { tkId: string | null; nganHang: string | null }> {
  if (!coNganHang(pt)) return { tkId: null, nganHang: null };
  const v = chuoi(fd, "tai_khoan_id");
  if (!v) return { loi: "Chọn tài khoản nhận tiền." };
  if (v === "Khác") return { tkId: null, nganHang: "Khác" };
  const { data: tk } = /^[0-9a-f-]{36}$/i.test(v) ? await sb().from("tai_khoan_ngan_hang").select("id, ngan_hang, hoat_dong, chi_nhanh_id, dung_chuyen_khoan, dung_quet_the").eq("id", v).maybeSingle() : { data: null };
  for (const cn of chiNhanhIds) { const l = kiemTaiKhoanKhoan(pt, tk ?? undefined, cn); if (l) return { loi: l }; }
  return tk ? { tkId: tk.id, nganHang: chuanTenNganHang(tk.ngan_hang) } : { loi: "Chọn tài khoản nhận tiền." };
}

export async function thuNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const pt = chuoi(fd, "phuong_thuc");
  const soTien = so(fd, "so_tien");
  if (!PT_THU_NO.includes(pt) && pt !== "the_tien") return { loi: "Chọn phương thức thu." };
  const theId = pt === "the_tien" ? chuoi(fd, "the_id") : "";
  if (pt === "the_tien" && !/^[0-9a-f-]{36}$/i.test(theId)) return { loi: "Chọn thẻ tiền / tiền cọc để trừ." };
  const loaiVi = loaiViKhoanThu(pt, chuoi(fd, "loai_vi"));
  if (loaiVi === undefined) return { loi: "Thu bằng ví điện tử phải chọn loại ví." };
  if (soTien <= 0) return { loi: "Nhập số tiền thu." };
  const id = chuoi(fd, "hoa_don_id");
  const { data: h } = await sb().from("hoa_don").select("trang_thai, con_no, chi_nhanh_id, la_lich_su").eq("id", id).maybeSingle();
  if (!h || h.trang_thai !== "hoan_thanh") return { loi: "Chỉ thu nợ được trên hoá đơn đã hoàn thành." };
  if (soTien > Number(h.con_no)) return { loi: "Số thu lớn hơn số còn nợ." };
  if (pt === "the_tien" && h.la_lich_su) return { loi: "Đơn chuyển từ SalonHero không trừ thẻ ở đây được." };
  const tk = await taiKhoanThuNo(fd, pt, [h.chi_nhanh_id]);
  if ("loi" in tk) return { loi: tk.loi };
  const { error } = await sb().from("thanh_toan").insert({ hoa_don_id: id, loai: "thu", phuong_thuc: pt, the_id: theId || null, loai_vi: loaiVi, so_tien: soTien, ngan_hang: tk.nganHang, tai_khoan_id: tk.tkId, nguoi_id: nd.nhanVienId, ghi_chu: chuoi(fd, "ghi_chu") || (pt === "the_tien" ? "Thu nợ bằng thẻ tiền" : "Thu nợ"), ngay: chuoi(fd, "ngay") || undefined });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Nút "Trả nợ" của báo cáo Khách hàng nợ (như SalonHero): thu NỐT toàn bộ số còn nợ của các hoá đơn được chọn.
 *  Cùng quyền "no.thu" và cùng sổ thu tiền (thanh_toan, chỉ-thêm) như thuNo; ghi một lần để hoặc thu hết hoặc không thu gì. */
export async function thuNoNhieuDon(fd: FormData): Promise<KQ & { soDon?: number; tong?: number }> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const pt = chuoi(fd, "phuong_thuc"), ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!PT_THU_NO.includes(pt)) return { loi: "Chọn phương thức thu." };
  const loaiVi = loaiViKhoanThu(pt, chuoi(fd, "loai_vi"));
  if (loaiVi === undefined) return { loi: "Thu bằng ví điện tử phải chọn loại ví." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay > homNayHCM()) return { loi: "Ngày thu không hợp lệ (không được ở tương lai)." };
  const ids = fd.getAll("hoa_don_id").map(String);
  const db = sb();
  const { data: hds, error: loiDoc } = await db.from("hoa_don").select("id, ma, trang_thai, con_no, chi_nhanh_id").in("id", ids.slice(0, 200));
  if (loiDoc) return { loi: thongBaoLoi(loiDoc) };
  const phieu = lapPhieuThuNo(ids, hds ?? [], nd.chiNhanhId);
  if (phieu.loi !== undefined) return { loi: phieu.loi };
  const tk = await taiKhoanThuNo(fd, pt, [...new Set((hds ?? []).filter((x) => phieu.dong.some((d) => d.hoa_don_id === x.id)).map((x) => x.chi_nhanh_id))]);
  if ("loi" in tk) return { loi: tk.loi };
  const { error } = await db.from("thanh_toan").insert(phieu.dong.map((d) => ({ hoa_don_id: d.hoa_don_id, loai: "thu", phuong_thuc: pt, loai_vi: loaiVi, so_tien: d.so_tien, ngan_hang: tk.nganHang, tai_khoan_id: tk.tkId, nguoi_id: nd.nhanVienId, ghi_chu: chuoi(fd, "ghi_chu") || "Thu nợ", ngay })));
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "thu_no_nhieu_don", doi_tuong: "hoa_don", chi_tiet: { so_don: phieu.dong.length, tong: phieu.tong, phuong_thuc: pt, ngay, ma: phieu.dong.map((d) => d.ma) } });
  revalidatePath("/bao-cao");
  revalidatePath("/hoa-don");
  return { ok: true, soDon: phieu.dong.length, tong: phieu.tong };
}

export async function huyHoaDon(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ban.huy");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const { error } = await sb().rpc("huy_hoa_don", { p_id: id, p_ly_do: chuoi(fd, "ly_do"), p_nguoi: nd.nhanVienId });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Ghi nhận đã xuất hoá đơn VAT (SalonHero: "Có hoá đơn VAT"). Bỏ trống số hoá đơn = gỡ ghi nhận (ghi sai). Mỗi lần đổi đều để dấu vết. */
export async function ghiNhanVat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hd.vat");
  if (!nd || !coQuyen(nd, "ban.sua_khoa")) return { loi: KHONG_DU_QUYEN };  // sửa hoá đơn đã khoá = quyền riêng của SalonHero (pos.editLockedOrder)
  const id = chuoi(fd, "hoa_don_id");
  const soHd = chuoi(fd, "vat_hd_so").trim().slice(0, 30);
  const kyHieu = chuoi(fd, "vat_hd_ky_hieu").trim().slice(0, 20);
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("trang_thai, chi_nhanh_id, vat_hd_so").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  if (h.trang_thai !== "hoan_thanh") return { loi: "Chỉ ghi nhận hoá đơn VAT cho hoá đơn đã hoàn thành." };
  const { error } = await db.from("hoa_don").update(soHd
    ? { vat_hd_so: soHd, vat_hd_ky_hieu: kyHieu || null, vat_hd_luc: new Date().toISOString(), vat_hd_nguoi_id: nd.nhanVienId }
    : { vat_hd_so: null, vat_hd_ky_hieu: null, vat_hd_luc: null, vat_hd_nguoi_id: null, vat_hd_ngay: null, vat_hd_mau_so: null, vat_hd_tra_cuu: null }).eq("id", id);
  if (!error) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: soHd ? "ghi_hd_vat" : "go_hd_vat", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { truoc: h.vat_hd_so, sau: soHd || null, ky_hieu: kyHieu || null } });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** "Xác nhận với Kế toán" như SalonHero (confirmWithAccountant): chỉ hoá đơn đã hoàn thành, chưa xác nhận. SalonHero chỉ lưu ngày; AMIA lưu thêm người xác nhận.
 *  Không khoá sửa (mở lại để sửa thì tự bỏ xác nhận, xem moLaiHoaDon); Chủ / Kỹ thuật bỏ xác nhận tay bằng boXacNhanKeToan. Quyền riêng "hd.ke_toan" (Kế toán, Quản lý, Chủ). */
export async function xacNhanKeToan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hd.ke_toan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("ma, trang_thai, chi_nhanh_id, ke_toan_xac_nhan_luc").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  if (h.trang_thai !== "hoan_thanh") return { loi: "Chỉ xác nhận được hoá đơn đã hoàn thành." };
  if (h.ke_toan_xac_nhan_luc) return { loi: "Hoá đơn này đã được xác nhận với kế toán." };
  const luc = new Date().toISOString();
  // Điều kiện "chưa xác nhận" nằm trong câu update: hai người bấm cùng lúc thì chỉ một lần được ghi.
  const { data: ghi, error } = await db.from("hoa_don").update({ ke_toan_xac_nhan_luc: luc, ke_toan_xac_nhan_nguoi_id: nd.nhanVienId }).eq("id", id).eq("trang_thai", "hoan_thanh").is("ke_toan_xac_nhan_luc", null).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!ghi?.length) return { loi: "Hoá đơn vừa được người khác xác nhận hoặc đã đổi trạng thái. Tải lại trang." };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xac_nhan_ke_toan", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { ma: h.ma, luc } });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return { ok: true };
}

/** "Bỏ xác nhận với Kế toán" (chị Lâm 10/11/2026: "cần nút bỏ xác nhận"): chỉ Chủ và Kỹ thuật (quyền "hd.bo_ke_toan"). Xoá người + lúc xác nhận,
 *  ghi nhật ký giữ lại lần xác nhận cũ và người bỏ. Điều kiện "đang xác nhận đúng lúc đó" nằm trong câu update: hai người bấm cùng lúc thì chỉ một lần được ghi. */
export async function boXacNhanKeToan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hd.bo_ke_toan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("ma, chi_nhanh_id, ke_toan_xac_nhan_luc, ke_toan_xac_nhan_nguoi_id").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  if (!h.ke_toan_xac_nhan_luc) return { loi: "Hoá đơn này chưa được xác nhận với kế toán." };
  const { data: ghi, error } = await db.from("hoa_don").update({ ke_toan_xac_nhan_luc: null, ke_toan_xac_nhan_nguoi_id: null }).eq("id", id).eq("ke_toan_xac_nhan_luc", h.ke_toan_xac_nhan_luc).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!ghi?.length) return { loi: "Xác nhận của hoá đơn vừa được người khác thay đổi. Tải lại trang." };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "bo_xac_nhan_ke_toan", doi_tuong: "hoa_don", doi_tuong_id: id,
    chi_tiet: { ly_do: "chu_bo_xac_nhan", ma: h.ma, luc: new Date().toISOString(), truoc_luc: h.ke_toan_xac_nhan_luc, truoc_nguoi_id: h.ke_toan_xac_nhan_nguoi_id } });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return { ok: true };
}

/** Ghi / sửa đánh giá 1–5 sao cho từng nhân viên PHỤC VỤ của hoá đơn đã hoàn thành (thu ngân, lễ tân: người có quyền bán hàng hoặc đặt lịch). Mỗi cặp đơn–nhân viên một đánh giá; DB kiểm lại và ghi nhật ký cũ → mới. */
export async function luuDanhGia(json: string): Promise<KQ> {
  const nd = (await kiemQuyen("ban.tao")) ?? (await kiemQuyen("lich.sua"));
  if (!nd) return { loi: KHONG_DU_QUYEN };
  let d: { hoaDonId: string; dg: { nhanVienId: string; diem: number; yKien: string }[] };
  try { d = JSON.parse(json); } catch { return { loi: "Dữ liệu không đọc được." }; }
  if (!Array.isArray(d.dg) || d.dg.length === 0 || d.dg.length > 50) return { loi: "Chưa có đánh giá nào để lưu." };
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("id, trang_thai, chi_nhanh_id").eq("id", d.hoaDonId).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  if (h.trang_thai !== "hoan_thanh") return { loi: "Chỉ đánh giá nhân viên trên hoá đơn đã hoàn thành." };
  const { data: cu } = await db.from("danh_gia_nhan_vien").select("nhan_vien_id, diem, y_kien").eq("hoa_don_id", h.id);
  const truoc = new Map((cu ?? []).map((x) => [x.nhan_vien_id, x]));
  let luu = 0;
  for (const x of d.dg) {
    const diem = Number(x.diem), yKien = String(x.yKien ?? "").trim().slice(0, 1000) || null;
    if (!Number.isInteger(diem) || diem < 1 || diem > 5) return { loi: "Số sao phải từ 1 đến 5." };
    const c = truoc.get(x.nhanVienId);
    if (c && c.diem === diem && (c.y_kien ?? null) === yKien) continue;   // không đổi thì không ghi, nhật ký không thừa dòng
    const { error } = c
      ? await db.from("danh_gia_nhan_vien").update({ diem, y_kien: yKien, nguoi_ghi_id: nd.nhanVienId }).eq("hoa_don_id", h.id).eq("nhan_vien_id", x.nhanVienId)
      : await db.from("danh_gia_nhan_vien").insert({ hoa_don_id: h.id, nhan_vien_id: x.nhanVienId, diem, y_kien: yKien, nguoi_ghi_id: nd.nhanVienId });
    if (error) return { loi: thongBaoLoi(error) };
    luu++;
  }
  revalidatePath(`/hoa-don/${h.id}`);
  revalidatePath("/bao-cao");
  return luu ? { ok: true } : { loi: "Chưa có thay đổi nào để lưu." };
}

/** "Điều chỉnh nợ" (SalonHero modify_debt, hiện chữ "Xoá nợ"): đặt số nợ mới nhỏ hơn nợ hiện tại, bắt lý do. Chỉ Chủ (no.xoa). Không vào sổ quỹ. */
/** Sửa hoá đơn đã chốt (SalonHero nút "Sửa", quyền pos.update): DB ghi dòng đảo khoản thu / thẻ / kho rồi đưa về nháp; mở Thu ngân để sửa và chốt lại (giữ mã, giữ ngày). */
export async function moLaiHoaDon(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("ban.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("chi_nhanh_id, ke_toan_xac_nhan_luc, ke_toan_xac_nhan_nguoi_id").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  const lyDo = chuoi(fd, "ly_do").trim();
  if (!lyDo) return { loi: "Ghi lý do sửa hoá đơn." };
  const { error } = await db.rpc("mo_lai_hoa_don", { p_id: id, p_ly_do: lyDo.slice(0, 500), p_nguoi: nd.nhanVienId });
  // Đã xác nhận với kế toán mà mở lại để sửa: số tiền sẽ đổi nên bỏ xác nhận cũ (kế toán xác nhận lại sau khi chốt), ghi nhật ký giữ lại lần xác nhận trước.
  if (!error && h.ke_toan_xac_nhan_luc) {
    await db.from("hoa_don").update({ ke_toan_xac_nhan_luc: null, ke_toan_xac_nhan_nguoi_id: null }).eq("id", id);
    await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "bo_xac_nhan_ke_toan", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { ly_do: "mo_lai_de_sua", truoc_luc: h.ke_toan_xac_nhan_luc, truoc_nguoi_id: h.ke_toan_xac_nhan_nguoi_id } });
  }
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  if (error) return { loi: thongBaoLoi(error) };
  redirect(`/ban-hang?sua=${id}`);
}

/** "Bỏ sửa" ở trang hoá đơn đang sửa: trả về đã chốt như cũ (cùng hàm với nút ở khung Chờ thanh toán, xem ban-hang/actions boSuaHoaDon). */
export async function boSuaHoaDonForm(fd: FormData): Promise<KQ> {
  const r = await boSuaHoaDon(chuoi(fd, "hoa_don_id"));
  return "loi" in r && r.loi ? { loi: r.loi } : { ok: true };
}

export async function dieuChinhNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.xoa");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("chi_nhanh_id").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  const lyDo = chuoi(fd, "ly_do").trim();
  if (!lyDo) return { loi: "Ghi lý do điều chỉnh nợ." };
  const { error } = await db.rpc("dieu_chinh_no", { p_id: id, p_no_moi: so(fd, "no_moi"), p_ly_do: lyDo.slice(0, 500), p_nguoi: nd.nhanVienId });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** "Huỷ trả nợ" (SalonHero revertPaymentDebt): chỉ dòng cuối của lịch sử nợ, cả lần trả nợ lẫn lần xoá nợ. Quyền như thu nợ (thu ngân, quản lý, kế toán, chủ).
 *  Lần trả nợ được huỷ bằng dòng hoàn cùng ngày, cùng hình thức (sổ cái chỉ thêm, dòng gốc vẫn còn). */
export async function huyLanTraNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("chi_nhanh_id").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  const { error } = await db.rpc("huy_lan_tra_no", { p_id: id, p_ref: chuoi(fd, "ref"), p_nguoi: nd.nhanVienId, p_ly_do: chuoi(fd, "ly_do").trim().slice(0, 300) || undefined });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  revalidatePath("/bao-cao");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

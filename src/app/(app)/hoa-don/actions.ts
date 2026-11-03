"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { lapPhieuThuNo } from "@/lib/thu-no";
import { loaiViKhoanThu, PHUONG_THUC_TIEN } from "@/lib/ban-hang";

type KQ = { ok?: true; loi?: string };
const PT_THU_NO = PHUONG_THUC_TIEN.map((p) => p.gia_tri);

export async function thuNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const pt = chuoi(fd, "phuong_thuc");
  const soTien = so(fd, "so_tien");
  if (!PT_THU_NO.includes(pt)) return { loi: "Chọn phương thức thu." };
  const loaiVi = loaiViKhoanThu(pt, chuoi(fd, "loai_vi"));
  if (loaiVi === undefined) return { loi: "Thu bằng ví điện tử phải chọn loại ví." };
  if (soTien <= 0) return { loi: "Nhập số tiền thu." };
  const id = chuoi(fd, "hoa_don_id");
  const { data: h } = await sb().from("hoa_don").select("trang_thai, con_no").eq("id", id).maybeSingle();
  if (!h || h.trang_thai !== "hoan_thanh") return { loi: "Chỉ thu nợ được trên hoá đơn đã hoàn thành." };
  if (soTien > Number(h.con_no)) return { loi: "Số thu lớn hơn số còn nợ." };
  const { error } = await sb().from("thanh_toan").insert({ hoa_don_id: id, loai: "thu", phuong_thuc: pt, loai_vi: loaiVi, so_tien: soTien, nguoi_id: nd.nhanVienId, ghi_chu: chuoi(fd, "ghi_chu") || "Thu nợ", ngay: chuoi(fd, "ngay") || undefined });
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
  const { error } = await db.from("thanh_toan").insert(phieu.dong.map((d) => ({ hoa_don_id: d.hoa_don_id, loai: "thu", phuong_thuc: pt, loai_vi: loaiVi, so_tien: d.so_tien, nguoi_id: nd.nhanVienId, ghi_chu: chuoi(fd, "ghi_chu") || "Thu nợ", ngay })));
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

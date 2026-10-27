"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so, soHoacNull } from "@/lib/form";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { HAN_NHAP_TOI_THIEU } from "@/lib/kho";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/kho", "layout"); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
/** Người gắn một chi nhánh chỉ làm việc trong chi nhánh đó; người không gắn (quản lý chung) làm ở mọi chi nhánh. */
const trongPhamVi = (nd: { chiNhanhId: string | null }, cn: string) => !nd.chiNhanhId || nd.chiNhanhId === cn;
const goi = async (ham: string, tham: Record<string, unknown>): Promise<KQ> => {
  const { error } = await (sb().rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ error: { message: string; code?: string } | null }>)(ham, tham);
  if (error) return { loi: thongBaoLoi(error as never) };
  lamMoi();
  return { ok: true };
};

export async function nhapKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const cn = chuoi(fd, "chi_nhanh_id"), han = chuoiHoacNull(fd, "han_dung");
  if (!trongPhamVi(nd, cn)) return { loi: KHONG_DU_QUYEN };
  const sl = so(fd, "so_luong");
  if (!(sl > 0)) return { loi: "Số lượng nhập phải lớn hơn 0." };
  if (han && !NGAY.test(han)) return { loi: "Hạn dùng chưa đúng." };
  if (han && han < congNgay(homNayHCM(), HAN_NHAP_TOI_THIEU) && !bat(fd, "ngoai_le")) {
    return { loi: `Hàng còn dưới ${HAN_NHAP_TOI_THIEU} ngày hạn dùng. Chỉ nhập khi đã được đồng ý ngoại lệ: bật “Ngoại lệ hạn dùng” và ghi lý do vào ghi chú.` };
  }
  if (han && han < homNayHCM()) return { loi: "Hàng đã hết hạn, không nhập kho." };
  if (bat(fd, "ngoai_le") && !chuoi(fd, "ghi_chu")) return { loi: "Ngoại lệ hạn dùng phải ghi lý do vào ghi chú." };
  const tong = soHoacNull(fd, "tong_tien");
  const donGia = tong != null && tong > 0 ? tong / sl : null;
  const { error } = await db.from("kho_so_cai").insert({ chi_nhanh_id: cn, san_pham_id: chuoi(fd, "san_pham_id"), loai: "nhap", so_luong: sl, don_gia: donGia, so_lo: chuoiHoacNull(fd, "so_lo"), han_dung: han, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  if (donGia != null) await db.from("san_pham").update({ gia_nhap_don_vi: donGia }).eq("id", chuoi(fd, "san_pham_id"));
  lamMoi();
  return { ok: true };
}

// ─── Chuyển kho ─────────────────────────────────────────────────────────────
export async function guiChuyenKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tu = nd.chiNhanhId ?? chuoi(fd, "tu_chi_nhanh_id"), den = chuoi(fd, "den_chi_nhanh_id"), han = chuoiHoacNull(fd, "han_dung");
  if (!tu || !den || tu === den) return { loi: "Chọn kho đi và kho đến khác nhau." };
  if (!(so(fd, "so_luong") > 0)) return { loi: "Số lượng chuyển phải lớn hơn 0." };
  if (han && !NGAY.test(han)) return { loi: "Hạn dùng chưa đúng." };
  return goi("gui_chuyen_kho", { p_tu: tu, p_den: den, p_sp: chuoi(fd, "san_pham_id"), p_sl: so(fd, "so_luong"), p_lo: chuoi(fd, "so_lo"), p_han: han, p_ghi_chu: chuoi(fd, "ghi_chu"), p_nguoi: nd.nhanVienId });
}

export async function nhanChuyenKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: p } = await sb().from("phieu_chuyen_kho").select("den_chi_nhanh_id, nguoi_gui_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!p || !trongPhamVi(nd, p.den_chi_nhanh_id)) return { loi: "Chỉ kho nhận xác nhận phiếu này." };
  if (p.nguoi_gui_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người nhận phải khác người gửi." };
  if (chuoi(fd, "so_thuc_nhan") === "") return { loi: "Nhập số lượng thực nhận (0 nếu không nhận được gì)." };
  return goi("nhan_chuyen_kho", { p_phieu: chuoi(fd, "id"), p_sl_thuc: so(fd, "so_thuc_nhan"), p_ly_do: chuoi(fd, "ly_do"), p_nguoi: nd.nhanVienId });
}

export async function xuLyLechChuyenKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  return goi("xu_ly_lech_chuyen_kho", { p_phieu: chuoi(fd, "id"), p_cach: chuoi(fd, "cach"), p_nguoi: nd.nhanVienId });
}

export async function huyChuyenKho(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: p } = await sb().from("phieu_chuyen_kho").select("tu_chi_nhanh_id, nguoi_gui_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!p || !trongPhamVi(nd, p.tu_chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  return goi("huy_chuyen_kho", { p_phieu: chuoi(fd, "id"), p_nguoi: nd.nhanVienId });
}

// ─── Kiểm kê có duyệt ───────────────────────────────────────────────────────
export async function taoKiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!cn || !NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Chọn chi nhánh và ngày kiểm kê (không ở tương lai)." };
  const loai = chuoi(fd, "loai") === "dot_xuat" ? "dot_xuat" : "thang";
  if (loai === "dot_xuat" && !chuoi(fd, "ghi_chu")) return { loi: "Kiểm kê đột xuất cần ghi lý do." };
  return goi("tao_phieu_kiem_ke", { p_cn: cn, p_ngay: ngay, p_loai: loai, p_nguoi: nd.nhanVienId, p_nguoi_2: chuoi(fd, "nguoi_dem_2_id") || null, p_ghi_chu: chuoi(fd, "ghi_chu") });
}

async function layPhieuKiemKe(id: string) {
  const { data } = await sb().from("phieu_kiem_ke").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function luuSoDem(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieuKiemKe(chuoi(fd, "id"));
  if (!p || !trongPhamVi(nd, p.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  if (p.trang_thai !== "dang_dem") return { loi: "Phiếu đã gửi duyệt, không sửa số đếm nữa." };
  const db = sb();
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith("thuc_")) continue;
    const t = String(v).trim().replace(",", ".");
    const gt = t === "" ? null : Number(t);
    if (gt !== null && (!Number.isFinite(gt) || gt < 0)) return { loi: "Số đếm phải là số không âm." };
    const { error } = await db.from("phieu_kiem_ke_dong").update({ ton_thuc: gt }).eq("phieu_id", p.id).eq("san_pham_id", k.slice(5));
    if (error) return { loi: thongBaoLoi(error) };
  }
  lamMoi();
  return { ok: true };
}

export async function guiDuyetKiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieuKiemKe(chuoi(fd, "id"));
  if (!p || !trongPhamVi(nd, p.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { count } = await db.from("phieu_kiem_ke_dong").select("id", { count: "exact", head: true }).eq("phieu_id", p.id).not("ton_thuc", "is", null);
  if (!count) return { loi: "Chưa nhập số đếm nào." };
  const { data, error } = await db.from("phieu_kiem_ke").update({ trang_thai: "cho_duyet" }).eq("id", p.id).eq("trang_thai", "dang_dem").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu đã gửi duyệt." };
  lamMoi();
  return { ok: true };
}

export async function duyetKiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieuKiemKe(chuoi(fd, "id"));
  if (!p || !trongPhamVi(nd, p.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  return goi("duyet_phieu_kiem_ke", { p_phieu: p.id, p_nguoi: nd.nhanVienId, p_bo_qua_kiem: nd.vaiTro === "ky_thuat" });
}

/** Từ chối: đưa phiếu về "Đang đếm" để đếm lại, ghi lý do. Sổ kho không đổi. */
export async function tuChoiKiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieuKiemKe(chuoi(fd, "id"));
  if (!p || !trongPhamVi(nd, p.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  if (!chuoi(fd, "ly_do")) return { loi: "Ghi lý do từ chối." };
  const { data, error } = await sb().from("phieu_kiem_ke").update({ trang_thai: "dang_dem", ly_do: chuoi(fd, "ly_do") }).eq("id", p.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu không còn chờ duyệt." };
  lamMoi();
  return { ok: true };
}

export async function huyKiemKe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieuKiemKe(chuoi(fd, "id"));
  if (!p || !trongPhamVi(nd, p.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("phieu_kiem_ke").update({ trang_thai: "tu_choi", ly_do: chuoi(fd, "ly_do") || "Huỷ phiếu" }).eq("id", p.id).in("trang_thai", ["dang_dem", "cho_duyet"]).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu đã xử lý." };
  lamMoi();
  return { ok: true };
}

// ─── Xử lý vật tư ───────────────────────────────────────────────────────────
export async function taoXuLyVatTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), loai = chuoi(fd, "loai"), ly = chuoi(fd, "ly_do"), han = chuoiHoacNull(fd, "han_dung");
  if (!cn || !["huy", "hao_hut", "tra_ncc", "dieu_chinh_giam", "dieu_chinh_tang"].includes(loai)) return { loi: "Chọn chi nhánh và loại xử lý." };
  if (!(so(fd, "so_luong") > 0) || !ly) return { loi: "Nhập số lượng lớn hơn 0 và lý do." };
  if (loai === "tra_ncc" && !chuoi(fd, "ncc_id")) return { loi: "Trả nhà cung cấp cần chọn nhà cung cấp." };
  if (han && !NGAY.test(han)) return { loi: "Hạn dùng chưa đúng." };
  const db = sb();
  const ma = `XL${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "xu_ly_vt" })).data ?? 0)).padStart(6, "0")}`;
  const { error } = await db.from("xu_ly_vat_tu").insert({ ma, chi_nhanh_id: cn, san_pham_id: chuoi(fd, "san_pham_id"), loai, so_luong: so(fd, "so_luong"), so_lo: chuoiHoacNull(fd, "so_lo"), han_dung: han, ncc_id: chuoiHoacNull(fd, "ncc_id"), ly_do: ly, nguoi_lap_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function duyetXuLyVatTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: x } = await sb().from("xu_ly_vat_tu").select("chi_nhanh_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!x || !trongPhamVi(nd, x.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  return goi("duyet_xu_ly_vat_tu", { p_id: chuoi(fd, "id"), p_nguoi: nd.nhanVienId, p_bo_qua_kiem: nd.vaiTro === "ky_thuat" });
}

export async function tuChoiXuLyVatTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!chuoi(fd, "ly_do")) return { loi: "Ghi lý do từ chối." };
  const db = sb();
  const { data: x } = await db.from("xu_ly_vat_tu").select("chi_nhanh_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!x || !trongPhamVi(nd, x.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await db.from("xu_ly_vat_tu").update({ trang_thai: "tu_choi", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do_tu_choi: chuoi(fd, "ly_do") }).eq("id", chuoi(fd, "id")).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu không còn chờ duyệt." };
  lamMoi();
  return { ok: true };
}

export async function huyXuLyVatTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("xu_ly_vat_tu").update({ trang_thai: "huy" }).eq("id", chuoi(fd, "id")).eq("nguoi_lap_id", nd.nhanVienId).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Chỉ người lập huỷ được phiếu đang chờ duyệt." };
  lamMoi();
  return { ok: true };
}

// ─── Xuất khẩn cấp y tế ─────────────────────────────────────────────────────
export async function xuatKhanCap(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), han = chuoiHoacNull(fd, "han_dung");
  if (!cn) return { loi: "Chọn chi nhánh." };
  if (!chuoi(fd, "nguoi_quyet_dinh_id")) return { loi: "Chọn người quyết định xuất (quản lý chi nhánh)." };
  if (han && !NGAY.test(han)) return { loi: "Hạn dùng chưa đúng." };
  return goi("xuat_khan_cap", { p_cn: cn, p_sp: chuoi(fd, "san_pham_id"), p_sl: so(fd, "so_luong"), p_lo: chuoi(fd, "so_lo"), p_han: han, p_khach: chuoi(fd, "khach_id") || null, p_ly_do: chuoi(fd, "ly_do_lam_sang"), p_quyet_dinh: chuoi(fd, "nguoi_quyet_dinh_id"), p_de_nghi: chuoi(fd, "nguoi_de_nghi"), p_nhan: chuoi(fd, "nguoi_nhan"), p_nguoi: nd.nhanVienId });
}

export async function hauKiemXuatKhan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "trang_thai");
  if (!["da_hau_kiem", "vuot_tham_quyen"].includes(tt) || !chuoi(fd, "ket_luan")) return { loi: "Chọn kết luận và ghi nhận xét hậu kiểm." };
  const db = sb();
  const { data: x } = await db.from("phieu_xuat_khan").select("chi_nhanh_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!x || !trongPhamVi(nd, x.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await db.from("phieu_xuat_khan").update({ trang_thai: tt, hau_kiem_boi: nd.nhanVienId, hau_kiem_luc: new Date().toISOString(), ket_luan: chuoi(fd, "ket_luan") }).eq("id", chuoi(fd, "id")).eq("trang_thai", "cho_hau_kiem").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu đã hậu kiểm." };
  lamMoi();
  return { ok: true };
}

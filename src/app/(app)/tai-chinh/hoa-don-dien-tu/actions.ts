"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { kiemGhiHddt, kiemKetNoi } from "@/lib/hoa-don-dien-tu";
import { biMatHddt, khoaDeLuu } from "@/lib/hoa-don-dien-tu-ket-noi";
import { kiemTenXuat, nguoiMuaMacDinh, nguoiMuaXuat, quyetSuaTenXuat } from "@/lib/hoa-don-dien-tu-xuat";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/tai-chinh/hoa-don-dien-tu"); revalidatePath("/hoa-don"); };

/** Cùng điều kiện với ghi nhận HĐ VAT ở trang hoá đơn: quyền hd.vat VÀ quyền sửa hoá đơn đã khoá (hoá đơn hoàn thành là hoá đơn khoá). Người gắn chi nhánh chỉ ghi được hoá đơn chi nhánh mình. */
async function nguoiGhi() {
  const nd = await kiemQuyen("hd.vat");
  return nd && coQuyen(nd, "ban.sua_khoa") ? nd : null;
}

/** Hoá đơn ghi được: còn hoàn thành, thuộc chi nhánh của người ghi, và tháng của hoá đơn chưa khoá kỳ kế toán. */
async function hoaDonGhiDuoc(id: string, chiNhanhId: string | null): Promise<{ loi: string } | { ok: { vat_hd_luc: string | null; vat_hd_so: string | null } }> {
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("trang_thai, chi_nhanh_id, ngay_hd, vat_hd_luc, vat_hd_so").eq("id", id).maybeSingle();
  if (!h || (chiNhanhId && h.chi_nhanh_id !== chiNhanhId)) return { loi: "Không tìm thấy hoá đơn." };
  if (h.trang_thai !== "hoan_thanh") return { loi: "Chỉ ghi hoá đơn điện tử cho hoá đơn đã hoàn thành (không phải nháp hoặc đã huỷ)." };
  const { data: ky } = await db.from("ky_ke_toan").select("trang_thai").eq("thang", h.ngay_hd.slice(0, 7)).maybeSingle();
  if (ky?.trang_thai === "da_khoa") return { loi: `Kỳ kế toán tháng ${h.ngay_hd.slice(5, 7)}/${h.ngay_hd.slice(0, 4)} đã khoá, không ghi thêm được.` };
  return { ok: h };
}

/** Ghi số hoá đơn điện tử (đã xuất ở phần mềm của nhà cung cấp) vào hoá đơn bán. moi=1: hoá đơn chưa có số; moi=0: sửa số đã ghi. Chưa gọi API nhà cung cấp. */
export async function ghiHoaDonDienTu(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id"), laMoi = chuoi(fd, "moi") !== "0";
  const kt = kiemGhiHddt({ so: chuoi(fd, "vat_hd_so"), ngay: chuoi(fd, "vat_hd_ngay"), kyHieu: chuoi(fd, "vat_hd_ky_hieu"), mauSo: chuoi(fd, "vat_hd_mau_so"), traCuu: chuoi(fd, "vat_hd_tra_cuu") });
  if ("loi" in kt) return { loi: kt.loi };
  const d = await hoaDonGhiDuoc(id, nd.chiNhanhId);
  if ("loi" in d) return d;
  const cu = d.ok.vat_hd_so;
  const dat = { vat_hd_so: kt.ok.so, vat_hd_ngay: kt.ok.ngay, vat_hd_ky_hieu: kt.ok.kyHieu, vat_hd_mau_so: kt.ok.mauSo, vat_hd_tra_cuu: kt.ok.traCuu, vat_hd_luc: new Date().toISOString(), vat_hd_nguoi_id: nd.nhanVienId };
  const q = sb().from("hoa_don").update(dat).eq("id", id).eq("trang_thai", "hoan_thanh");
  const { data, error } = await (laMoi ? q.is("vat_hd_luc", null) : q.not("vat_hd_luc", "is", null)).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: laMoi ? "Hoá đơn này vừa được người khác ghi số, tải lại trang để xem." : "Hoá đơn này chưa có số để sửa, tải lại trang." };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: laMoi ? "ghi_hd_dien_tu" : "sua_hd_dien_tu", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { truoc: cu, sau: kt.ok.so, ky_hieu: kt.ok.kyHieu, mau_so: kt.ok.mauSo, ngay: kt.ok.ngay } });
  lamMoi();
  return { ok: true };
}

/** Gỡ số hoá đơn điện tử đã ghi nhầm (hoá đơn quay lại danh sách "Cần xuất"). Để dấu vết trong nhật ký. */
export async function goHoaDonDienTu(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const d = await hoaDonGhiDuoc(id, nd.chiNhanhId);
  if ("loi" in d) return d;
  const { data, error } = await sb().from("hoa_don").update({ vat_hd_so: null, vat_hd_ngay: null, vat_hd_ky_hieu: null, vat_hd_mau_so: null, vat_hd_tra_cuu: null, vat_hd_luc: null, vat_hd_nguoi_id: null }).eq("id", id).eq("trang_thai", "hoan_thanh").not("vat_hd_luc", "is", null).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Hoá đơn này chưa có số để gỡ." };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "go_hd_dien_tu", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { truoc: d.ok.vat_hd_so, sau: null } });
  lamMoi();
  return { ok: true };
}

/** Kết nối nhà cung cấp: chỉ tài khoản KHÔNG gắn chi nhánh, có quyền hd.vat và khoá kỳ. Ô khoá để trống = giữ khoá cũ. Chưa gọi thử API nhà cung cấp. */
export async function luuKetNoiHoaDonDienTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hd.vat");
  if (!nd || nd.chiNhanhId || !coQuyen(nd, "ky.khoa")) return { loi: KHONG_DU_QUYEN };
  const kt = kiemKetNoi({ nhaCungCap: chuoi(fd, "nha_cung_cap"), maSoThue: chuoi(fd, "ma_so_thue"), tenDangNhap: chuoi(fd, "ten_dang_nhap"), mauSo: chuoi(fd, "mau_so_mac_dinh"), kyHieu: chuoi(fd, "ky_hieu_mac_dinh"), diaChi: chuoi(fd, "dia_chi_may_chu") });
  if ("loi" in kt) return { loi: kt.loi };
  const khoa = String(fd.get("khoa") ?? "").trim();
  if (khoa.length > 500) return { loi: "Khoá dài quá 500 ký tự." };
  if (khoa && !biMatHddt()) return { loi: "Máy chủ chưa có khoá để mã hoá, báo kỹ thuật." };
  const dat = { id: true, ...kt.ok, ...(khoa ? khoaDeLuu(khoa) : {}), nguoi_id: nd.nhanVienId ?? null, sua_luc: new Date().toISOString() };
  const { error } = await sb().from("ket_noi_hoa_don_dien_tu").upsert(dat);
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "luu_ket_noi_hddt", doi_tuong: "ket_noi_hoa_don_dien_tu", chi_tiet: { nha_cung_cap: kt.ok.nha_cung_cap, doi_khoa: !!khoa } });
  lamMoi();
  return { ok: true };
}

export async function ngatKetNoiHoaDonDienTu(): Promise<KQ> {
  const nd = await kiemQuyen("hd.vat");
  if (!nd || nd.chiNhanhId || !coQuyen(nd, "ky.khoa")) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("ket_noi_hoa_don_dien_tu").delete().eq("id", true);
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "ngat_ket_noi_hddt", doi_tuong: "ket_noi_hoa_don_dien_tu" });
  lamMoi();
  return { ok: true };
}

// ── Sửa tên trên hoá đơn xuất (chỉ cho bảng xuất Excel; KHÔNG đổi đơn bán, dòng hàng hay hồ sơ khách) ──
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KHACH_COT = "ho_ten, cong_ty, ma_so_thue, dia_chi";

export type DuLieuSuaTen = {
  macDinh: { ten: string; mst: string; diaChi: string };
  nguoiMua: { ten: string; mst: string; diaChi: string };
  dong: { id: string; tenGoc: string; tenXuat: string }[];
};

/** Dữ liệu cho hộp "Sửa tên khi xuất": tên đang dùng (đã sửa hoặc mặc định) cùng tên gốc để so. Cùng quyền, cùng khoá chi nhánh với ghi số hoá đơn điện tử. */
export async function layTenXuat(hoaDonId: string): Promise<{ loi: string } | { ok: DuLieuSuaTen }> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await hoaDonGhiDuoc(hoaDonId, nd.chiNhanhId);
  if ("loi" in d) return d;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("khach_id").eq("id", hoaDonId).maybeSingle();
  const [{ data: k }, { data: tc }, { data: dong }] = await Promise.all([
    h?.khach_id ? db.from("khach_hang").select(KHACH_COT).eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("hoa_don_xuat_tuy_chinh").select("ten_nguoi_mua, ma_so_thue, dia_chi").eq("hoa_don_id", hoaDonId).maybeSingle(),
    db.from("hoa_don_dong").select("id, ten").eq("hoa_don_id", hoaDonId).order("tao_luc").order("id"),
  ]);
  const ids = (dong ?? []).map((x) => x.id);
  const { data: sua } = ids.length ? await db.from("hoa_don_xuat_dong").select("hoa_don_dong_id, ten_xuat").in("hoa_don_dong_id", ids) : { data: [] };
  const tenSua = new Map((sua ?? []).map((x) => [x.hoa_don_dong_id, x.ten_xuat]));
  return { ok: { macDinh: nguoiMuaMacDinh(k ?? undefined), nguoiMua: nguoiMuaXuat(k ?? undefined, tc ?? undefined), dong: (dong ?? []).map((x) => ({ id: x.id, tenGoc: x.ten, tenXuat: tenSua.get(x.id) ?? x.ten })) } };
}

/** Lưu tên xuất riêng. Ô trống hoặc giống tên mặc định = bỏ bản sửa (quay về tên trong đơn / hồ sơ khách). Mọi dòng hàng gửi lên phải thuộc ĐÚNG hoá đơn này (không tin id từ trình duyệt). */
export async function luuTenXuat(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const d = await hoaDonGhiDuoc(id, nd.chiNhanhId);
  if ("loi" in d) return d;
  const gui: { id: string; ten: string }[] = [];
  for (const [k, v] of fd.entries()) if (k.startsWith("d:")) gui.push({ id: k.slice(2), ten: String(v) });
  if (gui.length > 500 || gui.some((x) => !UUID.test(x.id))) return { loi: "Dòng hàng gửi lên chưa hợp lệ." };
  const kt = kiemTenXuat({ tenNguoiMua: chuoi(fd, "ten_nguoi_mua"), mst: chuoi(fd, "ma_so_thue"), diaChi: chuoi(fd, "dia_chi"), dong: gui });
  if ("loi" in kt) return { loi: kt.loi };
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("khach_id").eq("id", id).maybeSingle();
  const [{ data: k }, { data: dongThat }] = await Promise.all([
    h?.khach_id ? db.from("khach_hang").select(KHACH_COT).eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("hoa_don_dong").select("id, ten").eq("hoa_don_id", id),
  ]);
  const tenGoc = new Map((dongThat ?? []).map((x) => [x.id, x.ten]));
  if (kt.ok.dong.some((x) => !tenGoc.has(x.id))) return { loi: "Có dòng hàng không thuộc hoá đơn này, tải lại trang." };
  const q = quyetSuaTenXuat(kt.ok, nguoiMuaMacDinh(k ?? undefined), tenGoc);
  const bay = new Date().toISOString();
  const loi = [
    q.nguoiMua ? (await db.from("hoa_don_xuat_tuy_chinh").upsert({ hoa_don_id: id, ...q.nguoiMua, sua_boi: nd.nhanVienId ?? null, sua_luc: bay })).error : (await db.from("hoa_don_xuat_tuy_chinh").delete().eq("hoa_don_id", id)).error,
    q.dongLuu.length ? (await db.from("hoa_don_xuat_dong").upsert(q.dongLuu.map((x) => ({ hoa_don_dong_id: x.id, ten_xuat: x.ten, sua_boi: nd.nhanVienId ?? null, sua_luc: bay })))).error : null,
    q.dongXoa.length ? (await db.from("hoa_don_xuat_dong").delete().in("hoa_don_dong_id", q.dongXoa)).error : null,
  ].find(Boolean);
  if (loi) return { loi: thongBaoLoi(loi) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_ten_hd_xuat", doi_tuong: "hoa_don", doi_tuong_id: id, chi_tiet: { sua_nguoi_mua: q.nguoiMua ? Object.keys(q.nguoiMua).filter((c) => (q.nguoiMua as Record<string, string | null>)[c]) : [], so_dong_sua: q.dongLuu.length, so_dong_bo_sua: q.dongXoa.length } });
  lamMoi();
  return { ok: true };
}

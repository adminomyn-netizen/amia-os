"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { docCauHinh, khoaTen } from "@/lib/cs-hoa-hong";
import { layBangThang, NHOM_HH } from "@/lib/cs-hoa-hong-tai";

type KQ = { ok?: true; loi?: string };
const THANG = (fd: FormData) => { const nam = Math.round(so(fd, "nam")), thang = Math.round(so(fd, "thang")); return nam >= 2026 && thang >= 1 && thang <= 12 && `${nam}-${String(thang).padStart(2, "0")}` >= "2026-11" ? { nam, thang } : null; };
const xong = () => { revalidateTag("cs-hh-thang", "max"); revalidatePath("/hoa-hong", "layout"); revalidatePath("/thu-nhap-cua-toi"); };
const nhatKy = (nguoi: string, hanhDong: string, chiTiet: Record<string, unknown>) => sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nguoi, hanh_dong: hanhDong, doi_tuong: "cs_hoa_hong", chi_tiet: chiTiet as never });

/** Số chi nhánh theo Kế toán chốt (để trống = dùng số phần mềm tính). */
export async function luuSoChiNhanh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const t = THANG(fd), cn = chuoi(fd, "chi_nhanh_id");
  if (!t || !cn) return { loi: "Thiếu tháng hoặc chi nhánh." };
  const dong = { chi_nhanh_id: cn, ...t, doanh_so_chot: soHoacNull(fd, "doanh_so_chot"), doanh_so_dv_chot: soHoacNull(fd, "doanh_so_dv_chot"), chi_phi_qc: soHoacNull(fd, "chi_phi_qc"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), sua_boi: nd.nhanVienId, sua_luc: new Date().toISOString() };
  const { error } = await sb().from("cs_hh_thang_cn").upsert(dong);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_so_thang_cs_hh", dong); xong();
  return { ok: true };
}

/** Chỉ tiêu tư vấn (giao trước ngày 05) và điều kiện thưởng gián tiếp của một người trong tháng. */
export async function luuSoNhanVien(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const t = THANG(fd), nv = chuoi(fd, "nhan_vien_id");
  if (!t || !nv) return { loi: "Thiếu tháng hoặc nhân viên." };
  const dong = { nhan_vien_id: nv, ...t, chi_tieu: soHoacNull(fd, "chi_tieu"), dat_dieu_kien: bat(fd, "dat_dieu_kien"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), sua_boi: nd.nhanVienId, sua_luc: new Date().toISOString() };
  const { error } = await sb().from("cs_hh_thang_nv").upsert(dong);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_chi_tieu_cs_hh", dong); xong();
  return { ok: true };
}

/** Giám đốc chi nhánh đánh dấu ca không tính phí (bảo hành, làm lại, tặng, dùng thử, thiếu phiếu/chữ ký) hoặc bỏ đánh dấu. */
export async function datCaKhongTinh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dong = chuoi(fd, "dong_id"), lyDo = chuoi(fd, "ly_do");
  if (!dong) return { loi: "Thiếu ca." };
  const db = sb();
  const { error } = lyDo ? await db.from("phi_tl_loai_tru").upsert({ dong_id: dong, ly_do: lyDo, nguoi_id: nd.nhanVienId }) : await db.from("phi_tl_loai_tru").delete().eq("dong_id", dong);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, lyDo ? "ca_khong_tinh_phi" : "bo_ca_khong_tinh_phi", { dong_id: dong, ly_do: lyDo }); xong();
  return { ok: true };
}

/** Chốt hoa hồng tháng: ghi số từng khoản của từng người vào cs_hh_chot; bảng lương tháng đó lấy số này. Chốt lại thì thay số cũ. */
export async function chotThang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const t = THANG(fd);
  if (!t) return { loi: "Tháng không hợp lệ." };
  const db = sb();
  const { data: ky } = await db.from("ky_luong").select("trang_thai").eq("nam", t.nam).eq("thang", t.thang).maybeSingle();
  if (ky && ky.trang_thai !== "nhap") return { loi: "Kỳ lương tháng này đã gửi duyệt, không chốt lại hoa hồng được." };
  const b = await layBangThang(t.nam, t.thang, homNayHCM(), true);
  if (b.tamTinh && !bat(fd, "chot_som")) return { loi: "Tháng chưa kết thúc. Tick \"Chốt dù tháng chưa hết\" nếu vẫn muốn chốt." };
  const dong = b.nhanVien.flatMap((r) => r.khoan.filter((k) => k.tien !== 0).map((k) => ({ nam: t.nam, thang: t.thang, nhan_vien_id: r.id, khoan: k.ma, so_tien: k.tien, chi_tiet: { nhan: k.nhan, ds: k.ds ?? null, tl: k.tl ?? null, ghi_chu: k.ghiChu ?? null }, nguoi_id: nd.nhanVienId })));
  const { error: e1 } = await db.from("cs_hh_chot").delete().eq("nam", t.nam).eq("thang", t.thang);
  if (e1) return { loi: thongBaoLoi(e1) };
  if (dong.length) { const { error } = await db.from("cs_hh_chot").insert(dong); if (error) return { loi: thongBaoLoi(error) }; }
  await nhatKy(nd.nhanVienId, "chot_cs_hoa_hong", { ...t, so_dong: dong.length, tong: dong.reduce((s, x) => s + x.so_tien, 0) }); xong();
  return { ok: true };
}

/** Bỏ chốt (khi kỳ lương còn đang lập). */
export async function boChotThang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const t = THANG(fd);
  if (!t) return { loi: "Tháng không hợp lệ." };
  const db = sb();
  const { data: ky } = await db.from("ky_luong").select("trang_thai").eq("nam", t.nam).eq("thang", t.thang).maybeSingle();
  if (ky && ky.trang_thai !== "nhap") return { loi: "Kỳ lương tháng này đã gửi duyệt." };
  const { error } = await db.from("cs_hh_chot").delete().eq("nam", t.nam).eq("thang", t.thang);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "bo_chot_cs_hoa_hong", t); xong();
  return { ok: true };
}

/* ---------------- Cài đặt chính sách ---------------- */

const pt = (fd: FormData, k: string) => so(fd, k) / 100;

/** Sửa tỉ lệ của bộ chính sách đang hiệu lực (nhập theo %, lưu dạng số thập phân). */
export async function luuTiLeCs(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("cs_hoa_hong").select("cau_hinh").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy bộ chính sách." };
  const c = docCauHinh(cu.cau_hinh);
  const bac = (tien: string) => [[1_800_000_000, pt(fd, `${tien}_1`)], [2_800_000_000, pt(fd, `${tien}_2`)], [null, pt(fd, `${tien}_3`)]] as [number | null, number][];
  const moi = {
    tv: { km: pt(fd, "tv_km"), san: pt(fd, "tv_san"), goi_km: pt(fd, "tv_goi_km"), goi_duoi_km: pt(fd, "tv_goi_duoi_km"), my_pham: pt(fd, "tv_my_pham"), khach_moi_tu_khai_thac: pt(fd, "tv_kmtkt"), vuot_chi_tieu: pt(fd, "tv_vct") },
    telesale: { bac: bac("ts"), so_ngay: Math.round(so(fd, "ts_so_ngay")) || c.telesale.so_ngay },
    gian_tiep: { moc: [{ tu: so(fd, "gt_moc1"), nv: so(fd, "gt_nv1"), ql: so(fd, "gt_ql1") }, { tu: so(fd, "gt_moc2"), nv: so(fd, "gt_nv2"), ql: so(fd, "gt_ql2") }] },
    gd: { bac: bac("gd"), tru_gia_san: pt(fd, "gd_tru") },
    mkt: { bac: bac("mkt"), tran_qc: pt(fd, "mkt_tran") },
    phi_tl: { tran_bs: pt(fd, "phi_tran_bs"), tran_tlv: pt(fd, "phi_tran_tlv"), phu_bs: so(fd, "phi_phu_bs") },
  };
  const vals = [...Object.values(moi.tv), ...[moi.telesale, moi.gd, moi.mkt].flatMap((x) => x.bac.map((b) => b[1])), moi.gd.tru_gia_san, moi.mkt.tran_qc, moi.phi_tl.tran_bs, moi.phi_tl.tran_tlv];
  if (vals.some((v) => !(v >= 0 && v <= 1))) return { loi: "Tỉ lệ phải từ 0 đến 100%." };
  const { error } = await db.from("cs_hoa_hong").update({ cau_hinh: moi, sua_boi: nd.nhanVienId, sua_luc: new Date().toISOString() }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_ti_le_cs_hh", { truoc: c, sau: moi }); xong();
  return { ok: true };
}

/** Danh mục gói, thẻ: giá khuyến mại và gói/dịch vụ tương ứng trong phần mềm. */
export async function luuDanhMuc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten"), km = so(fd, "gia_khuyen_mai");
  if (!ten || !(km > 0)) return { loi: "Nhập tên và giá khuyến mại." };
  const dong = { ten, gia_khuyen_mai: km, goi_id: chuoiHoacNull(fd, "goi_id"), dich_vu_id: chuoiHoacNull(fd, "dich_vu_id"), thu_tu: Math.round(so(fd, "thu_tu")) };
  const db = sb();
  const { error } = id ? await db.from("cs_hh_danh_muc").update(dong).eq("id", id) : await db.from("cs_hh_danh_muc").insert(dong);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_danh_muc_cs_hh", { id, ...dong }); xong();
  return { ok: true };
}

export async function xoaDanhMuc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("cs_hh_danh_muc").delete().eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "xoa_danh_muc_cs_hh", { id: chuoi(fd, "id") }); xong();
  return { ok: true };
}

/** Nhóm hưởng theo chính sách của một nhân viên. */
export async function luuNhomHh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), nhom = chuoi(fd, "nhom_hh");
  if (nhom && !(nhom in NHOM_HH)) return { loi: "Nhóm không hợp lệ." };
  const { error } = await sb().from("nhan_vien").update({ nhom_hh: nhom || null }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_nhom_hh", { nhan_vien_id: id, nhom_hh: nhom || null }); xong();
  return { ok: true };
}

/** Đơn giá phí trị liệu và các dịch vụ / tên dòng ghép vào. */
export async function luuDonGia(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), donGia = so(fd, "don_gia");
  if (!(donGia >= 0)) return { loi: "Đơn giá không hợp lệ." };
  const tenGhep = chuoi(fd, "ten_ghep").split("\n").map(khoaTen).filter(Boolean);
  const { error } = await sb().from("phi_tl_don_gia").update({ don_gia: donGia, dich_vu_ids: mang(fd, "dich_vu_ids"), ten_ghep: [...new Set(tenGhep)] }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_don_gia_phi_tl", { id, don_gia: donGia }); xong();
  return { ok: true };
}

/** Ghép nhanh một tên dòng dịch vụ (đang "chưa có đơn giá") vào một dòng đơn giá. */
export async function ghepTenDonGia(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "don_gia_id"), ten = khoaTen(chuoi(fd, "ten"));
  if (!id || !ten) return { loi: "Chọn dòng đơn giá." };
  const db = sb();
  const { data: cu } = await db.from("phi_tl_don_gia").select("ten_ghep").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy dòng đơn giá." };
  const { error } = await db.from("phi_tl_don_gia").update({ ten_ghep: [...new Set([...cu.ten_ghep, ten])] }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "ghep_ten_phi_tl", { id, ten }); xong();
  return { ok: true };
}

/** Giá khuyến mại / giá tối thiểu của một dịch vụ hoặc gói (theo Bảng giá khách hàng PL02 và Chính sách giá PL03). */
export async function luuGiaMuc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const bang = chuoi(fd, "bang") === "goi_the" ? "goi_the" : "dich_vu", id = chuoi(fd, "id");
  const km = soHoacNull(fd, "gia_khuyen_mai"), tt = soHoacNull(fd, "gia_toi_thieu");
  if (km != null && tt != null && tt > km) return { loi: "Giá tối thiểu không được cao hơn giá khuyến mại." };
  const { error } = await sb().from(bang).update({ gia_khuyen_mai: km, gia_toi_thieu: tt }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await nhatKy(nd.nhanVienId, "sua_gia_km", { bang, id, km, tt }); xong();
  return { ok: true };
}

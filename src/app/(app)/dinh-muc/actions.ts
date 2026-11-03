"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, so } from "@/lib/form";
import { phanTichDinhMuc, tinhGiaVonDinhMuc } from "@/lib/dinh-muc";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/dinh-muc");

export async function luuDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { dich_vu_id: chuoi(fd, "dich_vu_id"), san_pham_id: chuoi(fd, "san_pham_id"), so_luong: so(fd, "so_luong"), chon_theo_chi_dinh: bat(fd, "chon_theo_chi_dinh"), ghi_chu: chuoi(fd, "ghi_chu") || null };
  if (!row.san_pham_id) return { loi: "Chọn vật tư." };
  if (!(row.so_luong > 0)) return { loi: "Số lượng định mức phải lớn hơn 0." };
  const { error } = id ? await sb().from("dinh_muc").update(row).eq("id", id) : await sb().from("dinh_muc").insert(row);
  lamMoi();
  return error ? { loi: error.code === "23505" ? "Vật tư này đã có trong định mức của dịch vụ." : thongBaoLoi(error) } : { ok: true };
}

export async function xoaDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  await sb().from("dinh_muc").delete().eq("id", chuoi(fd, "id"));
  lamMoi();
  return { ok: true };
}

/** Dán nhiều dòng "Dịch vụ ⇥ Vật tư ⇥ Số lượng ⇥ Theo chỉ định (1/0)" (từ Excel/Google Sheet). Khớp theo tên hoặc mã; dòng không khớp được liệt kê, dòng khớp vẫn được lưu.
 *  Bật "Chỉ kiểm tra" để xem kết quả trước, chưa lưu gì. */
export async function nhapDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const [{ data: dv }, { data: sp }] = await Promise.all([db.from("dich_vu").select("id, ma, ten"), db.from("san_pham").select("id, ma, ten")]);
  const { rows, loi } = phanTichDinhMuc(chuoi(fd, "van_ban"), dv ?? [], sp ?? []);
  if (bat(fd, "chi_kiem")) return { loi: `Kiểm tra xong, CHƯA lưu: ${rows.length} dòng hợp lệ, ${loi.length} dòng lỗi.${loi.length ? " " + loi.slice(0, 8).join("; ") + (loi.length > 8 ? "…" : "") : " Tắt \"Chỉ kiểm tra\" rồi nhập để lưu."}` };
  if (rows.length) {
    const { error } = await db.from("dinh_muc").upsert(rows, { onConflict: "dich_vu_id,san_pham_id" });
    if (error) return { loi: thongBaoLoi(error) };
  }
  lamMoi();
  if (loi.length) return { loi: `Đã lưu ${rows.length} dòng. ${loi.length} dòng lỗi: ${loi.slice(0, 8).join("; ")}${loi.length > 8 ? "…" : ""}` };
  return { ok: true };
}

/** Ghi giá vốn vật tư theo định mức vào giá vốn của dịch vụ. Tính lại ở máy chủ từ định mức hiện có (không tin số từ trình duyệt); thiếu giá nhập của vật tư cố định thì từ chối. */
export async function apDungGiaVonDichVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: dv } = await db.from("dich_vu").select("id, ma, ten, gia_von").eq("id", id).maybeSingle();
  if (!dv) return { loi: "Không tìm thấy dịch vụ." };
  const { data: dm } = await db.from("dinh_muc").select("so_luong, chon_theo_chi_dinh, san_pham_id").eq("dich_vu_id", id);
  if (!dm?.length) return { loi: "Dịch vụ này chưa có định mức." };
  const { data: sp } = await db.from("san_pham").select("id, nhom_cap, gia_nhap_don_vi").in("id", dm.map((x) => x.san_pham_id));
  const spMap = new Map((sp ?? []).map((s) => [s.id, s]));
  const kq = tinhGiaVonDinhMuc(dm.map((x) => ({ so_luong: Number(x.so_luong), chon_theo_chi_dinh: x.chon_theo_chi_dinh, nhom_cap: spMap.get(x.san_pham_id)?.nhom_cap ?? null, gia_nhap_don_vi: spMap.get(x.san_pham_id)?.gia_nhap_don_vi == null ? null : Number(spMap.get(x.san_pham_id)!.gia_nhap_don_vi) })));
  if (kq.coDinhThieuGia > 0) return { loi: `Còn ${kq.coDinhThieuGia} vật tư cấp cố định chưa có giá nhập, chưa ghi giá vốn được. Nhập giá ở Chuẩn hoá vật tư trước.` };
  const moi = Math.round(kq.coDinh);
  const { error } = await db.from("dich_vu").update({ gia_von: moi }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "ap_dung_gia_von_dinh_muc", doi_tuong: "dich_vu", doi_tuong_id: id, chi_tiet: { ma: dv.ma, truoc: dv.gia_von, sau: moi } });
  revalidatePath("/danh-muc");
  lamMoi();
  return { ok: true };
}

// ---- SAO CHÉP ĐỊNH MỨC TỪ DỊCH VỤ KHÁC (như nút của SalonHero): xem trước rồi mới ghi; chỉ THÊM vật tư dịch vụ đích chưa có, không đổi số lượng đang có ----
export type DongSaoChepDm = { san_pham_id: string; ten: string; don_vi: string; so_luong: number; chon_theo_chi_dinh: boolean; da_co: boolean };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function docSaoChep(fd: FormData): Promise<{ loi: string } | { dich: string; nguon: string; dong: DongSaoChepDm[] }> {
  const nguon = chuoi(fd, "nguon"), dich = chuoi(fd, "dich");
  if (!UUID.test(nguon) || !UUID.test(dich)) return { loi: "Chọn dịch vụ nguồn." };
  if (nguon === dich) return { loi: "Dịch vụ nguồn và đích đang giống nhau." };
  const db = sb();
  const [{ data: a }, { data: b }] = await Promise.all([db.from("dinh_muc").select("san_pham_id, so_luong, chon_theo_chi_dinh").eq("dich_vu_id", nguon), db.from("dinh_muc").select("san_pham_id").eq("dich_vu_id", dich)]);
  if (!a?.length) return { loi: "Dịch vụ nguồn chưa có định mức để sao chép." };
  const co = new Set((b ?? []).map((x) => x.san_pham_id));
  const { data: sp } = await db.from("san_pham").select("id, ten, don_vi").in("id", a.map((x) => x.san_pham_id));
  const m = new Map((sp ?? []).map((x) => [x.id, x]));
  return { dich, nguon, dong: a.map((x) => ({ san_pham_id: x.san_pham_id, ten: m.get(x.san_pham_id)?.ten ?? "", don_vi: m.get(x.san_pham_id)?.don_vi ?? "", so_luong: Number(x.so_luong), chon_theo_chi_dinh: x.chon_theo_chi_dinh, da_co: co.has(x.san_pham_id) })).sort((x, y) => x.ten.localeCompare(y.ten, "vi")) };
}
export async function xemTruocSaoChepDinhMuc(fd: FormData): Promise<{ loi?: string; dong?: DongSaoChepDm[] }> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const kq = await docSaoChep(fd);
  return "loi" in kq ? { loi: kq.loi } : { dong: kq.dong };
}
export async function apDungSaoChepDinhMuc(fd: FormData): Promise<KQ & { them?: number; boQua?: number }> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const kq = await docSaoChep(fd);
  if ("loi" in kq) return { loi: kq.loi };
  const moi = kq.dong.filter((d) => !d.da_co);
  if (moi.length) {
    const { error } = await sb().from("dinh_muc").insert(moi.map((d) => ({ dich_vu_id: kq.dich, san_pham_id: d.san_pham_id, so_luong: d.so_luong, chon_theo_chi_dinh: d.chon_theo_chi_dinh })));
    if (error) return { loi: error.code === "23505" ? "Có người vừa thêm vật tư cho dịch vụ này, tải lại trang rồi thử lại." : thongBaoLoi(error) };
  }
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sao_chep_dinh_muc", doi_tuong: "dich_vu", doi_tuong_id: kq.dich, chi_tiet: { tu: kq.nguon, them: moi.length, bo_qua: kq.dong.length - moi.length } });
  lamMoi();
  return { ok: true, them: moi.length, boQua: kq.dong.length - moi.length };
}

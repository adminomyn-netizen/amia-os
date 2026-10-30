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

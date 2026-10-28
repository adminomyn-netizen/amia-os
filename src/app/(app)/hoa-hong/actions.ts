"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";
import { docDoiTuong } from "@/lib/hoa-hong";

type KQ = { ok?: true; loi?: string };
const VAI = ["phuc_vu", "tu_van", "ban", "gioi_thieu"];
export type DongXemTruoc = { loai: string; vai: string; muc_id: string | null; ti_le: number; so_tien: number | null; ti_le_cu: number | null; so_tien_cu: number | null; hanh_dong: "them" | "ghi_de" | "giu_nguyen" };

/** Thêm hoặc sửa một dòng tỉ lệ. Dòng được xác định bởi (loại, vai, mục, đối tượng): sửa dòng của nhân viên/nhóm không bao giờ đè lên dòng chung. */
export async function luuTiLe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai"), vai = chuoi(fd, "vai"), muc = chuoi(fd, "muc_id") || null, ti = so(fd, "ti_le"), tien = Math.round(so(fd, "so_tien") || 0);
  const dt = docDoiTuong(chuoi(fd, "doi_tuong"));
  if (!["dich_vu", "san_pham", "goi_the"].includes(loai) || !VAI.includes(vai)) return { loi: "Chọn loại và vai." };
  if (!dt) return { loi: "Đối tượng áp dụng không hợp lệ." };
  if (!(ti >= 0 && ti <= 100)) return { loi: "Tỉ lệ phải từ 0 đến 100%." };
  if (!(tien >= 0 && tien <= 1_000_000_000)) return { loi: "Số tiền cố định không hợp lệ." };
  const db = sb();
  let q = db.from("hoa_hong_ti_le").select("id, ti_le, so_tien").eq("loai", loai).eq("vai", vai);
  q = muc ? q.eq("muc_id", muc) : q.is("muc_id", null);
  q = dt.kieu === "nhan_vien" ? q.eq("nhan_vien_id", dt.khoa) : q.is("nhan_vien_id", null);
  q = dt.kieu === "nhom" ? q.eq("nhom_chuc_danh", dt.khoa) : q.is("nhom_chuc_danh", null);
  const { data: cu } = await q.maybeSingle();
  const dong = { ti_le: ti, so_tien: tien || null };
  const { error } = cu ? await db.from("hoa_hong_ti_le").update(dong).eq("id", cu.id)
    : await db.from("hoa_hong_ti_le").insert({ loai, vai, muc_id: muc, ...dong, nhan_vien_id: dt.kieu === "nhan_vien" ? dt.khoa : null, nhom_chuc_danh: dt.kieu === "nhom" ? dt.khoa : null });
  if (!error) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: cu ? "sua_ti_le_hoa_hong" : "them_ti_le_hoa_hong", doi_tuong: "hoa_hong_ti_le", doi_tuong_id: cu?.id ?? null, chi_tiet: { loai, vai, muc_id: muc, doi_tuong: dt, truoc: cu ? { ti_le: Number(cu.ti_le), so_tien: cu.so_tien } : null, sau: { ti_le: ti, so_tien: tien || null } } });
  revalidatePath("/hoa-hong");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function xoaTiLe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: cu } = await db.from("hoa_hong_ti_le").select("*").eq("id", id).maybeSingle();
  const { error } = await db.from("hoa_hong_ti_le").delete().eq("id", id);
  if (!error && cu) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xoa_ti_le_hoa_hong", doi_tuong: "hoa_hong_ti_le", doi_tuong_id: cu.id, chi_tiet: { loai: cu.loai, vai: cu.vai, muc_id: cu.muc_id, nhan_vien_id: cu.nhan_vien_id, nhom_chuc_danh: cu.nhom_chuc_danh, ti_le: Number(cu.ti_le), so_tien: cu.so_tien } });
  revalidatePath("/hoa-hong");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Xem trước sao chép cài đặt từ A sang B (chưa ghi gì). */
export async function xemTruocSaoChep(fd: FormData): Promise<{ loi?: string; dong?: DongXemTruoc[] }> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const a = docDoiTuong(chuoi(fd, "nguon")), b = docDoiTuong(chuoi(fd, "dich"));
  if (!a || !b) return { loi: "Chọn nguồn và đích." };
  const { data, error } = await sb().rpc("hh_xem_truoc_sao_chep", { p_nguon_kieu: a.kieu, p_nguon_khoa: a.khoa, p_dich_kieu: b.kieu, p_dich_khoa: b.khoa });
  if (error) return { loi: error.message.includes("là một") ? "Nguồn và đích đang giống nhau." : thongBaoLoi(error) };
  return { dong: (data ?? []).map((r) => ({ ...r, ti_le: Number(r.ti_le), ti_le_cu: r.ti_le_cu == null ? null : Number(r.ti_le_cu), so_tien: r.so_tien == null ? null : Number(r.so_tien), so_tien_cu: r.so_tien_cu == null ? null : Number(r.so_tien_cu), hanh_dong: r.hanh_dong as DongXemTruoc["hanh_dong"] })) };
}

/** Áp dụng sao chép trong một giao dịch và ghi nhật ký (từ, tới, số dòng thêm/ghi đè/giữ nguyên). */
export async function apDungSaoChep(fd: FormData): Promise<KQ & { them?: number; ghiDe?: number; giuNguyen?: number }> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const a = docDoiTuong(chuoi(fd, "nguon")), b = docDoiTuong(chuoi(fd, "dich"));
  if (!a || !b) return { loi: "Chọn nguồn và đích." };
  const ghiDe = chuoi(fd, "ghi_de") === "1";
  const db = sb();
  const { data, error } = await db.rpc("hh_sao_chep", { p_nguon_kieu: a.kieu, p_nguon_khoa: a.khoa, p_dich_kieu: b.kieu, p_dich_khoa: b.khoa, p_ghi_de: ghiDe });
  if (error) return { loi: error.message.includes("là một") ? "Nguồn và đích đang giống nhau." : thongBaoLoi(error) };
  const r = data?.[0] ?? { them: 0, ghi_de: 0, giu_nguyen: 0 };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sao_chep_hoa_hong", doi_tuong: "hoa_hong_ti_le", chi_tiet: { tu: a, toi: b, cho_ghi_de: ghiDe, them: r.them, ghi_de: r.ghi_de, giu_nguyen: r.giu_nguyen } });
  revalidatePath("/hoa-hong");
  return { ok: true, them: r.them, ghiDe: r.ghi_de, giuNguyen: r.giu_nguyen };
}

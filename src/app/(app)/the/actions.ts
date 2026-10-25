"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { chuanSdt, homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const lamMoi = (id?: string) => { revalidatePath("/the"); if (id) revalidatePath(`/the/${id}`); };

export async function thucHienBuoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.thuchien");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const thamSo: Record<string, number | string> = {};
  for (const k of ["shot", "line"]) if (chuoi(fd, k)) thamSo[k] = so(fd, k);
  if (chuoi(fd, "vung")) thamSo.vung = chuoi(fd, "vung");
  const { error } = await sb().rpc("thuc_hien_buoi", {
    p_the: theId, p_dich_vu: chuoi(fd, "dich_vu_id"), p_nv: chuoi(fd, "nv_id"), p_bac_si: tuyChon(chuoi(fd, "bac_si_id")), p_lich: tuyChon(chuoi(fd, "lich_id")),
    p_ngay: chuoi(fd, "ngay") || homNayHCM(), p_tham_so: thamSo, p_ghi_chu: tuyChon(chuoi(fd, "ghi_chu")), p_nguoi: nd.nhanVienId,
  });
  lamMoi(theId); revalidatePath("/lich-hen");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function huyBuoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("huy_buoi", { p_buoi: chuoi(fd, "buoi_id"), p_ly_do: chuoi(fd, "ly_do"), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "the_id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function dieuChinhThe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const buoi = Math.trunc(so(fd, "so_buoi"));
  const tien = so(fd, "so_tien");
  const lyDo = chuoi(fd, "ly_do");
  if (!lyDo) return { loi: "Điều chỉnh thẻ phải ghi lý do." };
  if (!buoi && !tien) return { loi: "Nhập số buổi hoặc số tiền cần cộng/trừ." };
  const { data: v } = await sb().from("v_the_khach").select("so_buoi_con, so_du_tien, loai").eq("id", theId).maybeSingle();
  if (!v) return { loi: "Không tìm thấy thẻ." };
  if ((v.so_buoi_con ?? 0) + buoi < 0 || Number(v.so_du_tien ?? 0) + tien < 0) return { loi: "Điều chỉnh làm số dư âm." };
  const { error } = await sb().from("the_so_cai").insert({ the_id: theId, loai: "dieu_chinh", so_buoi: v.loai === "lan" ? buoi : 0, so_tien: v.loai === "tien" ? tien : 0, ghi_chu: lyDo, nguoi_id: nd.nhanVienId });
  lamMoi(theId);
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function doiTrangThaiThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("the.dieuchinh"))) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "trang_thai");
  if (!["hoat_dong", "khoa"].includes(tt)) return { loi: "Trạng thái không hợp lệ." };
  const { error } = await sb().from("the_khach").update({ trang_thai: tt }).eq("id", chuoi(fd, "the_id")).neq("trang_thai", "thu_hoi");
  lamMoi(chuoi(fd, "the_id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Cấp thẻ tay (tặng, chuyển đổi từ phần mềm cũ): không có hoá đơn nên KHÔNG tính doanh thu. */
export async function capTheTay(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const kh = chuoi(fd, "khach");
  const { data: k } = await db.from("khach_hang").select("id, chi_nhanh_id").or(`ma.eq.${kh.toUpperCase()},dien_thoai.eq.${chuanSdt(kh)}`).maybeSingle();
  if (!k) return { loi: "Không tìm thấy khách theo mã hoặc số điện thoại đó." };
  const { data: g } = await db.from("goi_the").select("*").eq("id", chuoi(fd, "goi_id")).maybeSingle();
  if (!g) return { loi: "Chọn gói thẻ." };
  const soBuoi = g.loai === "lan" ? Math.trunc(so(fd, "so_buoi")) || g.so_buoi || 0 : null;
  const soTien = g.loai === "tien" ? so(fd, "so_tien") || g.gia_tri_the || 0 : null;
  if (g.loai === "lan" && !soBuoi) return { loi: "Nhập số buổi." };
  if (g.loai === "tien" && !soTien) return { loi: "Nhập số dư." };
  const ma = "TH" + String(Number((await db.rpc("so_tiep_theo", { p_khoa: "the" })).data ?? 0)).padStart(6, "0");
  const { data: t, error } = await db.from("the_khach").insert({
    ma, khach_id: k.id, goi_id: g.id, chi_nhanh_id: k.chi_nhanh_id, loai: g.loai, so_buoi_tong: soBuoi, tong_tien: soTien, gia_tri_buoi: 0, cap_tay: true,
    han_dung: chuoiHoacNull(fd, "han_dung"), ghi_chu: chuoiHoacNull(fd, "ly_do"),
  }).select("id").single();
  if (error || !t) return { loi: thongBaoLoi(error) };
  await db.from("the_so_cai").insert({ the_id: t.id, loai: g.loai === "lan" ? "cap" : "nap", so_buoi: soBuoi ?? 0, so_tien: soTien ?? 0, nguoi_id: nd.nhanVienId, ghi_chu: `Cấp tay: ${chuoi(fd, "ly_do") || "không ghi lý do"}` });
  lamMoi();
  return { ok: true };
}

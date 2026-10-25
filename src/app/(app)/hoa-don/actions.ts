"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const PT_THU_NO = ["tien_mat", "chuyen_khoan", "quet_the"];

export async function thuNo(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("no.thu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const pt = chuoi(fd, "phuong_thuc");
  const soTien = so(fd, "so_tien");
  if (!PT_THU_NO.includes(pt)) return { loi: "Chọn phương thức thu." };
  if (soTien <= 0) return { loi: "Nhập số tiền thu." };
  const id = chuoi(fd, "hoa_don_id");
  const { data: h } = await sb().from("hoa_don").select("trang_thai, con_no").eq("id", id).maybeSingle();
  if (!h || h.trang_thai !== "hoan_thanh") return { loi: "Chỉ thu nợ được trên hoá đơn đã hoàn thành." };
  if (soTien > Number(h.con_no)) return { loi: "Số thu lớn hơn số còn nợ." };
  const { error } = await sb().from("thanh_toan").insert({ hoa_don_id: id, loai: "thu", phuong_thuc: pt, so_tien: soTien, nguoi_id: nd.nhanVienId, ghi_chu: chuoi(fd, "ghi_chu") || "Thu nợ", ngay: chuoi(fd, "ngay") || undefined });
  revalidatePath(`/hoa-don/${id}`);
  revalidatePath("/hoa-don");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
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

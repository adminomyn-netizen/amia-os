"use server";

import { revalidatePath } from "next/cache";
import { kiemNoiBo, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, so } from "@/lib/form";
import { CHI_ANH_NAM, laNguoiSuaQuyTrinh } from "@/lib/quy-trinh-duyet-server";
import { CHUC_DANH_TC } from "@/lib/de-xuat";
import type { Json } from "@/lib/supabase/database.types";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/cai-dat", "layout"); revalidatePath("/noi-lam-viec", "layout"); };
const VAI_DU_PHONG = ["ke_toan", "quan_ly", "chu"];

/** CHỈ anh Nam (kiểm theo ID trong cau_hinh, không theo vai trò): chị Lâm chốt 26/11/2026. Mọi sửa đều ghi nhật ký kèm lý do. */
async function chiAnhNam() {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN } as const;
  if (!(await laNguoiSuaQuyTrinh(nd.nhanVienId))) return { loi: CHI_ANH_NAM } as const;
  return { nd } as const;
}
const ghiNhatKy = async (nguoi: string, hanhDong: string, ma: string | null, truoc: unknown, sau: unknown, lyDo: string) =>
  sb().from("quy_trinh_duyet_nhat_ky").insert({ nguoi_id: nguoi, hanh_dong: hanhDong, quy_trinh_ma: ma, truoc: (truoc ?? null) as Json, sau: (sau ?? null) as Json, ly_do: lyDo });

/** Cột "Ai duyệt" gộp một ô: chuc_danh:<mã> | quan_ly_chi_nhanh | vai_tro:<vai> | nhan_vien:<id>. */
function tachNguoiDuyet(v: string): { loai: string; giaTri: string | null } | null {
  if (v === "quan_ly_chi_nhanh") return { loai: v, giaTri: null };
  const [loai, gt] = v.split(":");
  if (!gt) return null;
  if (loai === "chuc_danh" && CHUC_DANH_TC[gt]) return { loai, giaTri: gt };
  if (loai === "vai_tro" && ["chu", "quan_ly", "ke_toan", "thu_ngan", "le_tan"].includes(gt)) return { loai, giaTri: gt };
  if (loai === "nhan_vien" && /^[0-9a-f-]{36}$/.test(gt)) return { loai, giaTri: gt };
  return null;
}

export async function luuBuocQuyTrinh(fd: FormData): Promise<KQ> {
  const g = await chiAnhNam();
  if ("loi" in g) return { loi: g.loi };
  const lyDo = chuoi(fd, "ly_do");
  if (!lyDo) return { loi: "Nhập lý do sửa (ghi vào nhật ký)." };
  const ma = chuoi(fd, "quy_trinh_ma"), id = chuoi(fd, "id");
  const thuTu = Math.round(so(fd, "thu_tu")), sla = Math.round(so(fd, "sla_ngay") || 1);
  if (!Number.isInteger(thuTu) || thuTu < 1 || thuTu > 50) return { loi: "Thứ tự bước từ 1 đến 50." };
  if (!Number.isInteger(sla) || sla < 0 || sla > 30) return { loi: "Hạn xử lý mỗi bước từ 0 đến 30 ngày." };
  const ten = chuoi(fd, "ten");
  if (!ten) return { loi: "Nhập tên bước." };
  const nguoi = tachNguoiDuyet(chuoi(fd, "nguoi_duyet"));
  if (!nguoi) return { loi: "Chọn người duyệt." };
  const duPhong = chuoi(fd, "du_phong");
  if (duPhong && !VAI_DU_PHONG.includes(duPhong)) return { loi: "Vai trò dự phòng không hợp lệ." };
  const nguong = chuoi(fd, "nguong_quy_tac") || null;
  const db = sb();
  if (nguong) { const { data } = await db.from("quy_tac_duyet").select("ma").eq("ma", nguong).maybeSingle(); if (!data) return { loi: "Ngưỡng không tồn tại." }; }
  const row = { quy_trinh_ma: ma, thu_tu: thuTu, ten, nguoi_duyet_loai: nguoi.loai, nguoi_duyet_gia_tri: nguoi.giaTri, du_phong_vai_tro: nguoi.loai === "chuc_danh" && duPhong ? [duPhong] : [], nguong_quy_tac: nguong, kiem_han_muc: bat(fd, "kiem_han_muc"), sla_ngay: sla };
  let truoc: unknown = null;
  if (id) {
    const { data: cu } = await db.from("quy_trinh_duyet_buoc").select("*").eq("id", id).maybeSingle();
    if (!cu) return { loi: "Không tìm thấy bước." };
    truoc = cu;
    const { error } = await db.from("quy_trinh_duyet_buoc").update(row).eq("id", id);
    if (error) return { loi: error.code === "23505" ? "Đã có bước khác ở vị trí này. Đổi số thứ tự." : thongBaoLoi(error) };
  } else {
    const { error } = await db.from("quy_trinh_duyet_buoc").insert(row);
    if (error) return { loi: error.code === "23505" ? "Đã có bước ở vị trí này. Đổi số thứ tự." : thongBaoLoi(error) };
  }
  await db.from("quy_trinh_duyet").update({ cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: g.nd.nhanVienId }).eq("ma", ma);
  await ghiNhatKy(g.nd.nhanVienId, id ? "sua_buoc" : "them_buoc", ma, truoc, row, lyDo);
  lamMoi();
  return { ok: true };
}

export async function xoaBuocQuyTrinh(fd: FormData): Promise<KQ> {
  const g = await chiAnhNam();
  if ("loi" in g) return { loi: g.loi };
  const lyDo = chuoi(fd, "ly_do");
  if (!lyDo) return { loi: "Nhập lý do xoá (ghi vào nhật ký)." };
  const db = sb();
  const { data: cu } = await db.from("quy_trinh_duyet_buoc").select("*").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy bước." };
  const { error } = await db.from("quy_trinh_duyet_buoc").delete().eq("id", cu.id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("quy_trinh_duyet").update({ cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: g.nd.nhanVienId }).eq("ma", cu.quy_trinh_ma);
  await ghiNhatKy(g.nd.nhanVienId, "xoa_buoc", cu.quy_trinh_ma, cu, null, lyDo);
  lamMoi();
  return { ok: true };
}

/** Tắt quy trình = đề xuất mới của loại đó duyệt 1 cấp như trước (đề xuất đang chạy giữ nguyên chuỗi đã chép). */
export async function batTatQuyTrinh(fd: FormData): Promise<KQ> {
  const g = await chiAnhNam();
  if ("loi" in g) return { loi: g.loi };
  const lyDo = chuoi(fd, "ly_do");
  if (!lyDo) return { loi: "Nhập lý do (ghi vào nhật ký)." };
  const ma = chuoi(fd, "ma"), bat_ = chuoi(fd, "hoat_dong") === "1";
  const { error } = await sb().from("quy_trinh_duyet").update({ hoat_dong: bat_, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: g.nd.nhanVienId }).eq("ma", ma);
  if (error) return { loi: thongBaoLoi(error) };
  await ghiNhatKy(g.nd.nhanVienId, bat_ ? "bat_quy_trinh" : "tat_quy_trinh", ma, { hoat_dong: !bat_ }, { hoat_dong: bat_ }, lyDo);
  lamMoi();
  return { ok: true };
}

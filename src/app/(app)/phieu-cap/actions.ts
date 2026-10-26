"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { guiChoNhanVien, nguoiCoQuyen } from "@/lib/push";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";
import { chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string; id?: string };
const lamMoi = (id?: string) => { revalidatePath("/phieu-cap"); if (id) revalidatePath(`/phieu-cap/${id}`); revalidatePath("/lich-hen"); };

export async function taoPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.chidinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const lich = chuoi(fd, "lich_id");
  const khach = chuoi(fd, "khach_id");
  const dv = chuoi(fd, "dich_vu_id");
  if (!khach || !dv || !chuoi(fd, "bac_si_id")) return { loi: "Chọn khách, dịch vụ và bác sĩ chỉ định." };
  let chiNhanh = chuoi(fd, "chi_nhanh_id");
  if (lich) {
    const { data: l } = await db.from("lich_hen").select("chi_nhanh_id, khach_id").eq("id", lich).maybeSingle();
    if (!l || l.khach_id !== khach) return { loi: "Lịch hẹn không khớp khách." };
    chiNhanh = l.chi_nhanh_id;
  }
  if (!chiNhanh) return { loi: "Thiếu chi nhánh." };
  let chiDinh: unknown[] = [];
  try { chiDinh = JSON.parse(chuoi(fd, "chi_dinh") || "[]"); } catch { return { loi: "Chỉ định vật tư không đọc được." }; }
  const { data, error } = await db.rpc("tao_phieu_cap", { p_chi_nhanh: chiNhanh, p_lich: tuyChon(lich), p_khach: khach, p_dich_vu: dv, p_bac_si: chuoi(fd, "bac_si_id"), p_ktv: tuyChon(chuoi(fd, "ktv_id")), p_chi_dinh: chiDinh as never, p_nguoi: nd.nhanVienId });
  lamMoi();
  if (error) return { loi: thongBaoLoi(error) };
  const phieuId = String(data);
  // Báo cho kho (người có quyền cấp vật tư của chi nhánh này) để cấp trước ca.
  after(async () => {
    const [nguoi, { data: k }, { data: d }] = await Promise.all([nguoiCoQuyen("phieu.cap", chiNhanh), db.from("khach_hang").select("ho_ten").eq("id", khach).maybeSingle(), db.from("dich_vu").select("ten").eq("id", dv).maybeSingle()]);
    await guiChoNhanVien(nguoi.filter((x) => x !== nd.nhanVienId), { tieuDe: "Phiếu cấp vật tư mới", noiDung: `${d?.ten ?? "Dịch vụ"} · ${k?.ho_ten ?? "khách"}. Cần cấp trước ca.`, url: `/phieu-cap/${phieuId}`, tag: `phieu-${phieuId}` });
  });
  return { ok: true, id: phieuId };
}

export async function capPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.cap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("cap_phieu", { p_id: chuoi(fd, "id"), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  // Báo cho bác sĩ chỉ định và KTV thực hiện: vật tư đã sẵn sàng để nhận.
  const id = chuoi(fd, "id");
  after(async () => {
    const { data: p } = await sb().from("phieu_cap").select("ma, ktv_id, bac_si_id").eq("id", id).maybeSingle();
    if (p) await guiChoNhanVien([p.ktv_id, p.bac_si_id].filter((x): x is string => !!x && x !== nd.nhanVienId), { tieuDe: "Vật tư đã được cấp", noiDung: `Phiếu ${p.ma} đã cấp xong, nhận tại kho để vào ca.`, url: `/phieu-cap/${id}`, tag: `phieu-${id}` });
  });
  return { ok: true };
}

export async function nhanPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.nhan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dem = chuoi(fd, "dem_truoc");
  const { error } = await sb().rpc("nhan_phieu", { p_id: chuoi(fd, "id"), p_nguoi: nd.nhanVienId, p_dem_truoc: (dem === "" ? null : Math.trunc(so(fd, "dem_truoc"))) as unknown as number });
  lamMoi(chuoi(fd, "id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function capThemPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.cap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("cap_them_phieu", { p_id: chuoi(fd, "id"), p_san_pham: chuoi(fd, "san_pham_id"), p_so_luong: so(fd, "so_luong"), p_ly_do: chuoi(fd, "ly_do"), p_bac_si_xn: tuyChon(chuoi(fd, "bac_si_xn")), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function hoanTatPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.nhan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  let dong: unknown[] = [];
  try { dong = JSON.parse(chuoi(fd, "dong") || "[]"); } catch { return { loi: "Số trả không đọc được." }; }
  const dem = chuoi(fd, "dem_sau");
  const { error } = await sb().rpc("hoan_tat_phieu", { p_id: chuoi(fd, "id"), p_dong: dong as never, p_dem_sau: (dem === "" ? null : Math.trunc(so(fd, "dem_sau"))) as unknown as number, p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function doiChieuPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.doichieu");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("doi_chieu_phieu", { p_id: chuoi(fd, "id"), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function huyPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("phieu.cap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("huy_phieu", { p_id: chuoi(fd, "id"), p_ly_do: chuoi(fd, "ly_do"), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

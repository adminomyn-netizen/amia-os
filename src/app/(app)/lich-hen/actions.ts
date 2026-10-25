"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, mang, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/lich-hen");
const MUI = "+07:00";

export async function luuLichHen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  const khachId = chuoi(fd, "khach_id");
  const ngay = chuoi(fd, "ngay");
  const gio = chuoi(fd, "gio");
  const dv = mang(fd, "dich_vu_ids");
  if (!khachId) return { loi: "Chọn khách hàng." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Chọn ngày và giờ hẹn." };
  if (dv.length === 0) return { loi: "Chọn ít nhất một dịch vụ." };
  const phut = so(fd, "thoi_luong") || 60;
  if (phut < 5 || phut > 600) return { loi: "Thời lượng phải từ 5 đến 600 phút." };
  const batDau = new Date(`${ngay}T${gio}:00${MUI}`);
  const ketThuc = new Date(batDau.getTime() + phut * 60000);
  const nv = chuoiHoacNull(fd, "nhan_vien_id");
  if (nv) {
    let q = db.from("lich_hen").select("id, bat_dau, ket_thuc").eq("nhan_vien_id", nv).not("trang_thai", "in", "(huy,khong_den)").lt("bat_dau", ketThuc.toISOString()).gt("ket_thuc", batDau.toISOString());
    if (id) q = q.neq("id", id);
    const { data: trung } = await q.limit(1);
    if (trung?.length) return { loi: "Nhân viên này đã có lịch trùng giờ. Chọn giờ khác hoặc người khác." };
  }
  const row = { khach_id: khachId, chi_nhanh_id: chuoi(fd, "chi_nhanh_id"), bat_dau: batDau.toISOString(), ket_thuc: ketThuc.toISOString(), nhan_vien_id: nv, phong: chuoiHoacNull(fd, "phong"), nguon: chuoiHoacNull(fd, "nguon"), ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  if (!row.chi_nhanh_id) return { loi: "Chọn chi nhánh." };
  let lichId = id;
  if (id) {
    const { error } = await db.from("lich_hen").update(row).eq("id", id).in("trang_thai", ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"]);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data, error } = await db.from("lich_hen").insert({ ...row, tao_boi: nd.nhanVienId }).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    lichId = data.id;
  }
  await db.from("lich_hen_dich_vu").delete().eq("lich_id", lichId);
  await db.from("lich_hen_dich_vu").insert(dv.map((d) => ({ lich_id: lichId, dich_vu_id: d })));
  lamMoi();
  return { ok: true };
}

const CHUYEN: Record<string, string[]> = {
  chua_xac_nhan: ["da_xac_nhan", "huy"], da_xac_nhan: ["cho_phuc_vu", "huy", "khong_den"], cho_phuc_vu: ["dang_phuc_vu", "huy", "khong_den"],
  dang_phuc_vu: ["hoan_thanh", "cho_phuc_vu"], hoan_thanh: [], huy: [], khong_den: ["da_xac_nhan"],
};
export async function doiTrangThaiLich(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("lich.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  const moi = chuoi(fd, "trang_thai");
  const { data: l } = await db.from("lich_hen").select("trang_thai").eq("id", id).maybeSingle();
  if (!l) return { loi: "Không tìm thấy lịch hẹn." };
  if (!(CHUYEN[l.trang_thai] ?? []).includes(moi)) return { loi: "Không chuyển được sang trạng thái này." };
  if (moi === "huy" && !chuoi(fd, "ly_do")) return { loi: "Huỷ lịch phải ghi lý do." };
  const { error } = await db.from("lich_hen").update({ trang_thai: moi, ly_do_huy: moi === "huy" ? chuoi(fd, "ly_do") : null }).eq("id", id);
  lamMoi();
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { timKhachMaSdt } from "@/lib/tim-khach-ma-sdt";
import { cacNgayNhac, docCacKhoang, laKieuLapNhac, TOI_DA_LAN_NHAC, type QuyTacNhac } from "@/lib/nhac-cham-soc";

type KQ = { ok?: true; loi?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lamMoi = (khachId?: string) => { revalidatePath("/khach-hang/nhac-nho"); if (khachId) revalidatePath(`/khach-hang/${khachId}`); };

/** Tạo nhắc chăm sóc tay (SalonHero "Lịch nhắc chăm sóc", quyền reminder.create ≈ khach.sua của AMIA):
 *  khách, dịch vụ, ngày + giờ nhắc, lặp (không / đều theo Ngày-Tuần-Tháng mỗi N, M lần / không đều), người phụ trách, nội dung;
 *  tick "Lưu cài đặt này cho dịch vụ" thì quy tắc lặp được lưu vào dịch vụ, lần sau chọn dịch vụ đó hộp tự điền. */
export async function taoNhacTay(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  let khach: { id: string; chi_nhanh_id: string | null } | null = null;
  const khachId = chuoi(fd, "khach_id");
  if (UUID.test(khachId)) khach = (await db.from("khach_hang").select("id, chi_nhanh_id").eq("id", khachId).maybeSingle()).data;
  else { const r = await timKhachMaSdt(chuoi(fd, "khach")); if (!r.k) return { loi: r.loi }; khach = r.k; }
  if (!khach || (nd.chiNhanhId && khach.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy khách." };

  const ngay = chuoi(fd, "ngay"), gio = chuoi(fd, "gio") || "09:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return { loi: "Chọn ngày nhắc." };
  if (!/^\d{2}:\d{2}$/.test(gio)) return { loi: "Giờ nhắc không hợp lệ." };
  const kieu = chuoi(fd, "kieu_lap") || "SINGLE";
  if (!laKieuLapNhac(kieu)) return { loi: "Kiểu lặp không hợp lệ." };
  const moi = Math.trunc(Number(chuoi(fd, "moi") || 1)), soLan = Math.trunc(Number(chuoi(fd, "so_lan") || 2));
  let cacKhoang: number[] = [];
  if (kieu === "DAY" || kieu === "WEEK" || kieu === "MONTH") {
    if (!Number.isInteger(moi) || moi < 1 || moi > 365) return { loi: "Lặp mỗi bao lâu: từ 1 đến 365." };
    if (!Number.isInteger(soLan) || soLan < 2 || soLan > TOI_DA_LAN_NHAC) return { loi: `Số lần nhắc từ 2 đến ${TOI_DA_LAN_NHAC}.` };
  }
  if (kieu === "UNEQUAL") { const k = docCacKhoang(chuoi(fd, "cac_khoang")); if (typeof k === "string") return { loi: k }; cacKhoang = k; }
  const quyTac: QuyTacNhac = { kieu, moi: kieu === "UNEQUAL" ? 1 : moi, so_lan: kieu === "UNEQUAL" ? cacKhoang.length + 1 : soLan, cac_khoang: cacKhoang };
  const cac = cacNgayNhac(ngay, gio, quyTac);

  const dvId = chuoi(fd, "dich_vu_id");
  const dv = UUID.test(dvId) ? (await db.from("dich_vu").select("id, ten").eq("id", dvId).maybeSingle()).data : null;
  if (dvId && !dv) return { loi: "Không tìm thấy dịch vụ." };
  const noiDung = chuoi(fd, "noi_dung").slice(0, 400);
  if (!noiDung && !dv) return { loi: "Chọn dịch vụ hoặc ghi nội dung nhắc." };
  const ptId = chuoi(fd, "phu_trach_id");
  const pt = UUID.test(ptId) ? (await db.from("nhan_vien").select("id, ho_ten").eq("id", ptId).maybeSingle()).data : null;
  if (ptId && !pt) return { loi: "Không tìm thấy người phụ trách." };

  const { data: nhac, error } = await db.from("khach_nhac").insert({
    khach_id: khach.id, chi_nhanh_id: khach.chi_nhanh_id, noi_dung: noiDung || `Nhắc chăm sóc: ${dv?.ten ?? ""}`, trang_thai: "dang_nhac", la_lich_su: false,
    ngay_nhac: cac[0], cac_ngay_nhac: cac, kieu_lap: kieu, so_lan_lap: kieu === "SINGLE" ? null : cac.length - 1, lap_khoang: kieu === "SINGLE" || kieu === "UNEQUAL" ? null : moi,
    dich_vu_id: dv?.id ?? null, dich_vu_ten: dv?.ten ?? null, nguoi_tao_id: nd.nhanVienId, nguoi_tao_ten: nd.hoTen, nguoi_phu_trach_id: pt?.id ?? null, nguoi_phu_trach_ten: pt?.ho_ten ?? null,
  }).select("id").single();
  if (error || !nhac) return { loi: thongBaoLoi(error) };
  // "Lưu cài đặt này cho dịch vụ" (SalonHero rule_in_reminder). Cột dich_vu.quy_tac_nhac cố ý không khai trong database.types.ts (khai vào sẽ vỡ kiểu ở trang Danh mục, nơi rải cả hàng dịch vụ vào biểu mẫu).
  let luuQt = false;
  if (chuoi(fd, "luu_quy_tac") === "1" && dv && kieu !== "SINGLE") {
    const { error: e2 } = await db.from("dich_vu").update({ quy_tac_nhac: quyTac } as never).eq("id", dv.id);
    luuQt = !e2;
  }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "tao_nhac_cham_soc", doi_tuong: "khach_hang", doi_tuong_id: khach.id, chi_tiet: { nhac_id: nhac.id, so_lan: cac.length, luu_quy_tac_dich_vu: luuQt } });
  lamMoi(khach.id);
  return { ok: true };
}

/** Đổi trạng thái nhắc: Chưa thực hiện / Đã thực hiện / Huỷ (như SalonHero). Không xoá nhắc. */
export async function doiTrangThaiNhac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), tt = chuoi(fd, "trang_thai");
  if (!UUID.test(id)) return { loi: "Thiếu nhắc." };
  if (!["dang_nhac", "da_xong", "huy"].includes(tt)) return { loi: "Trạng thái không hợp lệ." };
  const db = sb();
  const { data: n } = await db.from("khach_nhac").select("id, khach_id, chi_nhanh_id, trang_thai").eq("id", id).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy nhắc." };
  if (n.trang_thai === tt) return { ok: true };
  const bay = new Date().toISOString();
  const { error } = await db.from("khach_nhac").update({ trang_thai: tt, hoan_thanh_luc: tt === "da_xong" ? bay : null, xu_ly_boi: nd.nhanVienId, xu_ly_luc: bay }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "doi_trang_thai_nhac", doi_tuong: "khach_hang", doi_tuong_id: n.khach_id, chi_tiet: { nhac_id: id, tu: n.trang_thai, sang: tt } });
  lamMoi(n.khach_id);
  return { ok: true };
}

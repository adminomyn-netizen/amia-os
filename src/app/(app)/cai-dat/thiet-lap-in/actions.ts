"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { TAT_CA, chuanHoaIn, docIn, khoaIn, laLoaiIn, loiIn } from "@/lib/thiet-lap-in";

type KQ = { ok?: true; loi?: string };

/** Lưu thiết lập in của một loại tờ in (hoá đơn / lịch hẹn) cho một chi nhánh hoặc cho tất cả. Chỉ Chủ / Kỹ thuật; nhật ký ghi giá trị trước và sau. */
export async function luuThietLapIn(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai"), cn = chuoi(fd, "cn");
  if (!laLoaiIn(loai)) return { loi: "Chọn loại tờ in." };
  let tho: unknown;
  try { tho = JSON.parse(chuoi(fd, "cau_hinh")); } catch { return { loi: "Cấu hình gửi lên chưa đúng." }; }
  const moi = chuanHoaIn(loai, tho);
  const loi = loiIn(moi);
  if (loi) return { loi };
  const db = sb();
  if (cn !== TAT_CA && !(await db.from("chi_nhanh").select("id").eq("id", cn).maybeSingle()).data) return { loi: "Không có chi nhánh này." };
  const { data: rows } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", [khoaIn(loai, cn), khoaIn(loai, TAT_CA)]);
  const cu = docIn(loai, rows, cn);
  const { error } = await db.from("cau_hinh").upsert({ khoa: khoaIn(loai, cn), gia_tri: JSON.stringify(moi), ghi_chu: `Thiết lập in ${loai === "hoa_don" ? "hoá đơn" : "lịch hẹn"} (${cn === TAT_CA ? "mọi chi nhánh" : "một chi nhánh"})` }, { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_thiet_lap_in", doi_tuong: "cau_hinh", chi_tiet: { loai, chi_nhanh: cn, truoc: cu.cauHinh, sau: moi } });
  revalidatePath("/cai-dat/thiet-lap-in");
  return { ok: true };
}

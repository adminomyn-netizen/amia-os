import "server-only";
import { sb } from "@/lib/db";
import { coQuyen } from "@/lib/quyen";
import type { NguoiDung } from "@/lib/auth";
import { docLocHoaDon, khachKhopTim } from "@/lib/loc-hoa-don";
import { canXuatHddt, type LocHddt } from "@/lib/hoa-don-dien-tu";

export const COT_HDDT = "id, ma, ngay_hd, trang_thai, tong_phai_thu, khach_id, chi_nhanh_id, nguoi_lap_id, vat_pct, vat_tien, vat_hd_luc, vat_hd_so, vat_hd_ngay, vat_hd_ky_hieu, vat_hd_mau_so, vat_hd_tra_cuu, vat_hd_nguoi_id, la_so_du_dau, tao_luc";
export const TOI_DA_DONG = 200;

/** Khách có mã số thuế (khách yêu cầu hoá đơn công ty). Số này nhỏ nên lấy hết một lần rồi đưa vào điều kiện lọc. */
async function khachCoMst(): Promise<string[]> {
  const { data } = await sb().from("khach_hang").select("id").not("ma_so_thue", "is", null).neq("ma_so_thue", "").limit(1000);
  return (data ?? []).map((k) => k.id);
}

/** Danh sách hoá đơn cho hai tab. Phạm vi lấy ở MÁY CHỦ từ người dùng: gắn chi nhánh thì chỉ thấy chi nhánh mình; không có quyền xem toàn cơ sở thì chỉ thấy hoá đơn mình lập (như /hoa-don). */
export async function layHoaDonHddt(nd: Pick<NguoiDung, "chiNhanhId" | "nhanVienId" | "quyen" | "vaiTro">, loc: LocHddt, kieu: "can" | "da", toiDa = TOI_DA_DONG) {
  const db = sb();
  const mst = kieu === "can" ? await khachCoMst() : [];
  let q = db.from("hoa_don").select(COT_HDDT).eq("trang_thai", "hoan_thanh").gte("ngay_hd", loc.tu).lte("ngay_hd", loc.den);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (!coQuyen(nd, "ban.toan_co_so")) q = q.eq("nguoi_lap_id", nd.nhanVienId ?? "");
  if (kieu === "can") q = q.is("vat_hd_luc", null).eq("la_so_du_dau", false).or(["vat_pct.gt.0", "vat_tien.gt.0", mst.length ? `khach_id.in.(${mst.join(",")})` : ""].filter(Boolean).join(","));
  else q = q.not("vat_hd_luc", "is", null);
  if (loc.q) {
    const khachIds = await khachKhopTim(db, docLocHoaDon({ q: loc.q }));
    const an = loc.q.replace(/[%,()]/g, " ");
    q = q.or([`ma.ilike.%${an}%`, kieu === "da" ? `vat_hd_so.ilike.%${an}%` : "", khachIds.length ? `khach_id.in.(${khachIds.join(",")})` : ""].filter(Boolean).join(","));
  }
  const { data, error } = await q.order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).order("id").limit(toiDa + 1);
  if (error) throw new Error(error.message);
  const dong = data ?? [];
  const khachMst = new Set(mst);
  const loc2 = kieu === "can" ? dong.filter((h) => canXuatHddt(h, !!h.khach_id && khachMst.has(h.khach_id))) : dong;
  return { dong: loc2.slice(0, toiDa), conNua: dong.length > toiDa };
}

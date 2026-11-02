import { sb } from "@/lib/db";
import { boDau, congNgay } from "@/lib/dinh-dang";

export const TINH_TRANG_DUNG_THE = [{ ma: "", nhan: "Tất cả" }, { ma: "sap_het", nhan: "Sắp hết tiền/lần" }, { ma: "tuan", nhan: "Hết hạn sau 1 tuần" }, { ma: "thang", nhan: "Hết hạn sau 1 tháng" }];
export const LOAI_DUNG_THE = [{ ma: "", nhan: "Tất cả loại thẻ" }, { ma: "lan", nhan: "Thẻ liệu trình" }, { ma: "tien", nhan: "Thẻ tiền" }];

type Loc = { cn?: string | null; tt: string; loai: string; tuKhoa: string; hom: string };

/** Điều kiện tìm khách/mã thẻ (cần tra bảng khách trước); trả chuỗi cho .or() hoặc null nếu không tìm. */
export async function dieuKienTim(tuKhoa: string): Promise<string | null> {
  if (!tuKhoa) return null;
  const { data: kt } = await sb().from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(tuKhoa)}%,dien_thoai.ilike.%${tuKhoa.replace(/^0/, "")}%,ma.ilike.%${tuKhoa}%`).limit(300);
  const ids = (kt ?? []).map((k) => k.id);
  return ids.length ? `ma.ilike.%${tuKhoa}%,khach_id.in.(${ids.join(",")})` : `ma.ilike.%${tuKhoa}%`;
}

type B<T> = { eq: (c: string, v: string) => T; gte: (c: string, v: string) => T; lte: (c: string, v: string) => T; or: (f: string) => T };
/** Điều kiện lọc của "Danh sách khách dùng thẻ", dùng chung cho màn hình, các ô tổng và Xuất Excel để số khớp nhau. */
export function ganLoc<T extends B<T>>(q: T, f: Loc, dieuKienTimKiem: string | null): T {
  if (f.cn) q = q.eq("chi_nhanh_id", f.cn);
  if (f.loai) q = q.eq("loai", f.loai);
  if (f.tt === "sap_het") q = q.eq("tinh_trang", "sap_het");
  if (f.tt === "tuan" || f.tt === "thang") q = q.gte("han_dung", f.hom).lte("han_dung", congNgay(f.hom, f.tt === "tuan" ? 7 : 30));
  if (dieuKienTimKiem) q = q.or(dieuKienTimKiem);
  return q;
}

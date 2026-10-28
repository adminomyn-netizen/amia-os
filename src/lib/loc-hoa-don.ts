// Bộ lọc danh sách hoá đơn dùng CHUNG cho màn /hoa-don và tệp Excel xuất ra, để số dòng xuất luôn khớp đúng thứ đang xem.
import { homNayHCM } from "@/lib/dinh-dang";
import type { sb } from "@/lib/db";

export type LocHoaDon = { tu: string; den: string; tt: string; no: boolean; q: string; vat: "" | "co" | "chua" };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export function docLocHoaDon(sp: Record<string, string | undefined>): LocHoaDon {
  const homNay = homNayHCM();
  return {
    tu: NGAY.test(sp.tu ?? "") ? sp.tu! : homNay.slice(0, 8) + "01",
    den: NGAY.test(sp.den ?? "") ? sp.den! : homNay,
    tt: ["nhap", "hoan_thanh", "huy"].includes(sp.tt ?? "") ? sp.tt! : "",
    no: sp.no === "1",
    q: (sp.q ?? "").trim().slice(0, 80),
    vat: sp.vat === "co" || sp.vat === "chua" ? sp.vat : "",
  };
}

/** Các bộ lọc cần dùng của query builder PostgREST (khai báo theo cấu trúc để dùng được cho mọi câu select). */
interface BoLoc<T> {
  gte(cot: string, v: string): T; lte(cot: string, v: string): T; eq(cot: string, v: string): T; gt(cot: string, v: number): T;
  or(dk: string): T; is(cot: string, v: null): T; not(cot: string, op: string, v: null): T;
}

/** Khách khớp ô tìm (tên / SĐT) — tra trước, rồi đưa vào apLocHoaDon. */
export async function khachKhopTim(db: ReturnType<typeof sb>, loc: LocHoaDon): Promise<string[]> {
  if (!loc.q) return [];
  const an = loc.q.replace(/[%,()]/g, " ");
  const { data } = await db.from("khach_hang").select("id").or(`ho_ten.ilike.%${an}%,dien_thoai.like.%${loc.q.replace(/\D/g, "") || "~"}%`).limit(50);
  return (data ?? []).map((k) => k.id);
}

/** Áp bộ lọc lên câu truy vấn hoa_don (hàm thường, KHÔNG async: builder là thenable, trả qua async sẽ chạy truy vấn sớm).
 *  Chi nhánh: người gắn chi nhánh chỉ thấy chi nhánh của mình (bắt buộc ở máy chủ). */
export function apLocHoaDon<T extends BoLoc<T>>(q: T, loc: LocHoaDon, chiNhanhId: string | null, khachIds: string[]): T {
  let r = q.gte("ngay_hd", loc.tu).lte("ngay_hd", loc.den);
  if (chiNhanhId) r = r.eq("chi_nhanh_id", chiNhanhId);
  if (loc.tt) r = r.eq("trang_thai", loc.tt);
  if (loc.no) r = r.gt("con_no", 0).eq("trang_thai", "hoan_thanh");
  if (loc.vat === "co") r = r.not("vat_hd_luc", "is", null);
  if (loc.vat === "chua") r = r.is("vat_hd_luc", null).eq("trang_thai", "hoan_thanh");
  if (loc.q) r = r.or([`ma.ilike.%${loc.q.replace(/[%,()]/g, " ")}%`, khachIds.length ? `khach_id.in.(${khachIds.join(",")})` : ""].filter(Boolean).join(","));
  return r;
}

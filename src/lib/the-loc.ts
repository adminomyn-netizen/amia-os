import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";

/** Bộ lọc thẻ dùng chung cho trang Thẻ và nút Xuất Excel (chị Diệu Thuý 19/11/2026: lọc khách chăm sóc da hết thẻ / sắp hết buổi ở CN Vinh). */
export const TT_THE: { ma: string; nhan: string; tinh: string[] }[] = [
  { ma: "dang", nhan: "Còn dùng (gồm sắp hết)", tinh: ["hoat_dong", "sap_het", "khoa"] },
  { ma: "sap_het", nhan: "Sắp hết buổi", tinh: ["sap_het"] },
  { ma: "het_buoi", nhan: "Đã dùng hết buổi / tiền", tinh: ["hoan_thanh"] },
  { ma: "het_han", nhan: "Hết hạn", tinh: ["het_han"] },
  { ma: "het", nhan: "Đã dùng hết hoặc hết hạn", tinh: ["hoan_thanh", "het_han"] },
  { ma: "tat_ca", nhan: "Tất cả (gồm thu hồi)", tinh: ["hoat_dong", "sap_het", "khoa", "hoan_thanh", "het_han", "thu_hoi"] },
];
export const NHAN_TINH_TRANG_THE: Record<string, string> = { hoat_dong: "Đang dùng", sap_het: "Sắp hết buổi", khoa: "Đang khoá", hoan_thanh: "Đã dùng hết", het_han: "Hết hạn", thu_hoi: "Đã thu hồi" };

export type LocThe = { tab: "lan" | "tien"; tt: string; dv: string; cn: string; q: string };
export function docLocThe(sp: { tab?: string; q?: string; het?: string; tt?: string; dv?: string; cn?: string }): LocThe {
  const tt = TT_THE.some((t) => t.ma === sp.tt) ? (sp.tt as string) : sp.het === "1" ? "tat_ca" : "dang";
  return { tab: sp.tab === "tien" ? "tien" : "lan", tt, dv: (sp.dv ?? "").trim().slice(0, 80), cn: /^[0-9a-f-]{36}$/i.test(sp.cn ?? "") ? (sp.cn as string) : "", q: (sp.q ?? "").trim().replace(/[%,()*\\]/g, " ").trim() };
}
export const tinhTrangCuaLoc = (tt: string) => (TT_THE.find((t) => t.ma === tt) ?? TT_THE[0]).tinh;

/** Mã gói thẻ khớp từ khoá (tên gói hoặc tên dịch vụ gắn trong gói), không phân biệt dấu/hoa thường. Rỗng từ khoá = null (không lọc). */
const KHONG_CO = "00000000-0000-0000-0000-000000000000";
export async function goiTheoDichVu(tuKhoa: string): Promise<string[] | null> {
  const k = boDau(tuKhoa.trim());
  if (!k) return null;
  const db = sb();
  const [{ data: goi }, { data: lk }, { data: dv }] = await Promise.all([
    db.from("goi_the").select("id, ten").limit(5000),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id").limit(20000),
    db.from("dich_vu").select("id, ten").limit(5000),
  ]);
  const dvKhop = new Set((dv ?? []).filter((d) => boDau(d.ten).includes(k)).map((d) => d.id));
  const ids = new Set((goi ?? []).filter((g) => boDau(g.ten).includes(k)).map((g) => g.id));
  for (const l of lk ?? []) if (dvKhop.has(l.dich_vu_id)) ids.add(l.goi_id);
  const ra = [...ids].slice(0, 400);
  return ra.length ? ra : [KHONG_CO];
}

// Quản lý kho hàng bán (SalonHero #/inventory, đọc 29/10/2026): phân loại tồn theo 4 nhóm đếm và tổng giá trị kho.
// Tất cả (423) = sản phẩm bán lẻ; "Còn hàng" gồm cả "Sắp hết" (SalonHero: 29 + 354 + 40 = 423, Sắp hết 11 là một phần của Còn hàng).
export type TinhTrangKho = "tat_ca" | "con" | "sap_het" | "het" | "am";
export const TINH_TRANG_KHO: { ma: TinhTrangKho; nhan: string }[] = [
  { ma: "tat_ca", nhan: "Tất cả" }, { ma: "con", nhan: "Còn hàng" }, { ma: "sap_het", nhan: "Sắp hết" }, { ma: "het", nhan: "Hết hàng" }, { ma: "am", nhan: "Bị âm" },
];
export const laTinhTrang = (v: string | undefined): v is TinhTrangKho => TINH_TRANG_KHO.some((t) => t.ma === v);

/** Một dòng thuộc nhóm nào: tồn < 0 = Bị âm; = 0 = Hết hàng; > 0 = Còn hàng, trong đó tồn <= mức tối thiểu (đã đặt > 0) = Sắp hết. */
export function khopTinhTrang(ton: number, toiThieu: number, tt: TinhTrangKho): boolean {
  if (tt === "tat_ca") return true;
  if (tt === "am") return ton < 0;
  if (tt === "het") return ton === 0;
  if (tt === "con") return ton > 0;
  return ton > 0 && toiThieu > 0 && ton <= toiThieu;
}
export function demTinhTrang(dong: { ton: number; toiThieu: number }[]): Record<TinhTrangKho, number> {
  const r: Record<TinhTrangKho, number> = { tat_ca: dong.length, con: 0, sap_het: 0, het: 0, am: 0 };
  for (const d of dong) for (const t of ["con", "sap_het", "het", "am"] as const) if (khopTinhTrang(d.ton, d.toiThieu, t)) r[t]++;
  return r;
}
/** Tổng giá trị kho theo giá nhập: cộng cả tồn âm như SalonHero (số âm kéo tổng xuống); hàng chưa có giá nhập tính 0. */
export const tongGiaTriKho = (dong: { ton: number; gia: number | null }[]): number => dong.reduce((s, d) => s + Math.round(d.ton * (d.gia ?? 0)), 0);

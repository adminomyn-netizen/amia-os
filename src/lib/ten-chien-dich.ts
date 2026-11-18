/** Tên chiến dịch để hiện cho người đọc: bỏ mã số quảng cáo Meta dài (≥ 12 chữ số) lẫn trong tên, gọn dấu gạch thừa. Không hiện mã nội bộ (meta-n-…, pancake-…). */
export function tenChienDich(ten: string | null | undefined): string {
  const t = String(ten ?? "").replace(/\s*-?\s*\b\d{12,}\b\s*/g, " - ").replace(/(\s*-\s*){2,}/g, " - ").replace(/^\s*-\s*|\s*-\s*$/g, "").replace(/\s{2,}/g, " ").trim();
  return t || String(ten ?? "");
}

import { congNgay, homNayHCM } from "@/lib/dinh-dang";

/** Khoảng ngày của báo cáo từ ?tu & ?den; mặc định từ mùng 1 tháng này đến hôm nay. Giới hạn 366 ngày. */
export function khoangNgay(tu?: string, den?: string) {
  const homNay = homNayHCM();
  const hop = (s?: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s ?? "") ? s! : null);
  let t = hop(tu) ?? `${homNay.slice(0, 8)}01`;
  let d = hop(den) ?? homNay;
  if (t > d) [t, d] = [d, t];
  if (congNgay(t, 366) < d) t = congNgay(d, -366);
  return { tu: t, den: d, homNay };
}

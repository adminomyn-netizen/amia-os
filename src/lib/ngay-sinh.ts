/** Ngày sinh khách hợp lệ: đúng dạng yyyy-mm-dd, là ngày có thật, từ 1900 và TRƯỚC hôm nay (ngày sinh = hôm nay/tương lai là bấm nhầm ô ngày). */
export function ngaySinhHopLe(ngay: string, homNay: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return false;
  const d = new Date(`${ngay}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== ngay) return false;
  return ngay >= "1900-01-01" && ngay < homNay;
}

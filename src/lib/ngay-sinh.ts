// Ngày sinh khách. Khách chỉ biết ngày + tháng (chị Lâm 10/11/2026: "cho ngày sinh không có năm nhé") lưu ngay_sinh với NĂM QUY ƯỚC 1904
// (năm nhuận, giữ được 29/02); DB có cột sinh tự động khach_hang.ngay_sinh_khong_nam (migration 0327). Sinh nhật chỉ dùng ngày/tháng nên chạy nguyên;
// chỗ tính TUỔI / năm sinh phải qua các hàm dưới để không ra "122 tuổi".

export const NAM_KHONG_RO = 1904;

/** Ngày sinh không rõ năm (năm quy ước 1904). */
export const khongRoNam = (ngay: string | null | undefined): boolean => !!ngay && ngay.startsWith(`${NAM_KHONG_RO}-`);

/** Ngày sinh khách hợp lệ: đúng dạng yyyy-mm-dd, là ngày có thật, từ 1900 và TRƯỚC hôm nay (ngày sinh = hôm nay/tương lai là bấm nhầm ô ngày).
 * Ngày không rõ năm (1904-mm-dd) chỉ cần ngày/tháng có thật. */
export function ngaySinhHopLe(ngay: string, homNay: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return false;
  const d = new Date(`${ngay}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== ngay) return false;
  return ngay >= "1900-01-01" && ngay < homNay;
}

/** Ngày + tháng (không năm) → chuỗi lưu "1904-mm-dd"; null nếu ngày/tháng không có thật (vd 31/04, 30/02). */
export function ngaySinhKhongNam(ngay: number, thang: number): string | null {
  if (!Number.isInteger(ngay) || !Number.isInteger(thang) || thang < 1 || thang > 12 || ngay < 1) return null;
  const s = `${NAM_KHONG_RO}-${String(thang).padStart(2, "0")}-${String(ngay).padStart(2, "0")}`;
  return new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s ? s : null;
}

/** Hiển thị: "20/11/1990", hoặc "20/11 (không rõ năm)"; "" nếu trống. */
export function ngaySinhVN(ngay: string | null | undefined): string {
  if (!ngay) return "";
  const [y, m, d] = ngay.slice(0, 10).split("-");
  return khongRoNam(ngay) ? `${d}/${m} (không rõ năm)` : `${d}/${m}/${y}`;
}

/** Năm sinh (chuỗi) hoặc null khi trống / không rõ năm. */
export const namSinh = (ngay: string | null | undefined): string | null => (ngay && !khongRoNam(ngay) ? ngay.slice(0, 4) : null);

/** Tuổi khách tròn trong NĂM của `homNay` (dùng ở danh sách sinh nhật: "sinh nhật năm nay tròn X tuổi"); null khi trống / không rõ năm. */
export function tuoiSinhNhatNam(ngay: string | null | undefined, homNay: string): number | null {
  const n = namSinh(ngay);
  const t = n && /^\d{4}$/.test(n) ? Number(homNay.slice(0, 4)) - Number(n) : NaN;
  return t >= 0 && t <= 120 ? t : null; // năm vô lý chuyển từ SalonHero (2030, 2525 Phật lịch…) không hiện tuổi âm
}

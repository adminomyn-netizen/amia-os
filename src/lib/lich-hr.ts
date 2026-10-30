/** Tính ngày cho trang Lịch nhân sự. Ngày dạng "YYYY-MM-DD" theo giờ Việt Nam; hàm thuần để kiểm thử. */
const MS = 86400000;
export const soNgayGiua = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / MS);

/** Sinh nhật kế tiếp (kể cả hôm nay) tính từ ngày sinh; 29/2 năm không nhuận đổi thành 28/2. */
export function sinhNhatTiep(ngaySinh: string, hom: string): string {
  const [, m, d] = ngaySinh.split("-").map(Number);
  const nam = Number(hom.slice(0, 4));
  const dung = (y: number) => (new Date(Date.UTC(y, m - 1, d)).getUTCMonth() === m - 1 ? d : 28);
  const mk = (y: number) => `${y}-${String(m).padStart(2, "0")}-${String(dung(y)).padStart(2, "0")}`;
  const nayNay = mk(nam);
  return nayNay >= hom ? nayNay : mk(nam + 1);
}
/** Tuổi sẽ tròn ở sinh nhật kế tiếp. */
export const tuoiSapToi = (ngaySinh: string, hom: string) => Number(sinhNhatTiep(ngaySinh, hom).slice(0, 4)) - Number(ngaySinh.slice(0, 4));

export const cuoiThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).toISOString().slice(0, 10);

/** Các kỳ đánh giá KPI sắp tới: cuối mỗi tháng; cuối tháng 3/6/9/12 là kỳ quý (đánh giá + xét thưởng quý). */
export function kyDanhGiaSapToi(hom: string, soKy = 6): { ngay: string; loai: "thang" | "quy"; nhan: string }[] {
  const ra: { ngay: string; loai: "thang" | "quy"; nhan: string }[] = [];
  let nam = Number(hom.slice(0, 4)), thang = Number(hom.slice(5, 7));
  while (ra.length < soKy) {
    const ngay = cuoiThang(nam, thang);
    if (ngay >= hom) ra.push(thang % 3 === 0 ? { ngay, loai: "quy", nhan: `Quý ${thang / 3}/${nam}` } : { ngay, loai: "thang", nhan: `Tháng ${thang}/${nam}` });
    thang += 1;
    if (thang > 12) { thang = 1; nam += 1; }
  }
  return ra;
}

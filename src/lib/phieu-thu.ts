/** Phiếu thu tiền trả nợ (như SalonHero print_payment_debt): số phiếu = số tự tăng của dòng thanh toán, kèm số tiền bằng chữ. */
export const maPhieuThu = (soPhieu: number | string | null | undefined) => (soPhieu == null || soPhieu === "" ? "" : `PT${String(soPhieu).padStart(6, "0")}`);

const SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const HANG = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

/** Đọc một nhóm 3 chữ số. `day` = có nhóm đứng trước (phải đọc đủ "không trăm", "linh"). */
function docBa(n: number, day: boolean): string {
  const tram = Math.floor(n / 100), chuc = Math.floor((n % 100) / 10), dv = n % 10;
  const ra: string[] = [];
  if (tram > 0 || day) ra.push(`${SO[tram]} trăm`);
  if (chuc > 1) ra.push(`${SO[chuc]} mươi`);
  else if (chuc === 1) ra.push("mười");
  else if (dv > 0 && (tram > 0 || day)) ra.push("linh");
  if (dv > 0) ra.push(dv === 1 && chuc > 1 ? "mốt" : dv === 5 && chuc > 0 ? "lăm" : dv === 4 && chuc > 1 ? "tư" : SO[dv]);
  return ra.join(" ");
}

/** Số tiền bằng chữ tiếng Việt, viết hoa chữ đầu, kết thúc "đồng". Ví dụ 1.250.000 → "Một triệu hai trăm năm mươi nghìn đồng". */
export function docSoTien(soTien: number): string {
  let n = Math.round(Math.abs(soTien));
  if (n === 0) return "Không đồng";
  const nhom: number[] = [];
  while (n > 0) { nhom.push(n % 1000); n = Math.floor(n / 1000); }
  const phan: string[] = [];
  for (let i = nhom.length - 1; i >= 0; i--) {
    if (nhom[i] === 0) continue;
    phan.push(`${docBa(nhom[i], i < nhom.length - 1)} ${HANG[i]}`.trim());
  }
  const chu = `${soTien < 0 ? "âm " : ""}${phan.join(" ")} đồng`;
  return chu.charAt(0).toUpperCase() + chu.slice(1);
}

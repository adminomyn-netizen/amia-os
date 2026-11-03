import "server-only";
import ExcelJS from "exceljs";

// Đọc tệp Excel mẫu của SalonHero (services.xlsx, products.xlsx, cards.xlsx): hàng tiêu đề có tên khoá trong ngoặc, vd "Tên dịch vụ (service_name)".
export const TOI_DA_DONG = 1000;
export const TOI_DA_BYTE = 5 * 1024 * 1024;
export type DongExcel = { so: number; o: Record<string, string> };

const chuOCell = (v: unknown): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const x = v as { richText?: { text: string }[]; result?: unknown; text?: unknown };
    if (x.richText) return x.richText.map((t) => t.text).join("").trim();
    if (x.result != null) return String(x.result).trim();
    if (x.text != null) return String(x.text).trim();
    return "";
  }
  return String(v).trim();
};

/** Số từ ô Excel: nhận 1000000, "1.000.000", "1,000,000", "12,5". Không hiểu thì NaN. */
export function soTuChu(s: string): number {
  const t = s.replace(/\s+/g, "").replace(/[đ₫]/gi, "");
  if (!t) return NaN;
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ""));
  if (t.includes(",") && t.includes(".")) return Number(t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, ""));
  return Number(t.replace(",", "."));
}

/** `khoa`: các tên khoá cần tìm ở hàng tiêu đề; `dau`: số thứ tự (từ 1) của hàng dữ liệu đầu tiên. Dòng trống bị bỏ. */
export async function docExcelDanhMuc(buf: Buffer, khoa: string[], dau: number): Promise<{ dong: DongExcel[]; thieu: string[] } | { loi: string }> {
  if (buf.length > TOI_DA_BYTE) return { loi: "Tệp quá lớn (tối đa 5 MB)." };
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) return { loi: "Tệp phải là Excel .xlsx (tải tệp mẫu để dùng đúng định dạng)." };
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buf as unknown as ArrayBuffer); } catch { return { loi: "Không đọc được tệp. Hãy dùng tệp .xlsx đúng mẫu." }; }
  const ws = wb.worksheets[0];
  if (!ws) return { loi: "Tệp không có trang tính nào." };
  const cot = new Map<string, number>();
  ws.getRow(1).eachCell((c, i) => {
    const t = chuOCell(c.value).toLowerCase();
    for (const k of khoa) if (!cot.has(k) && new RegExp(`(^|[^a-z0-9_])${k}([^a-z0-9_]|$)`).test(t)) cot.set(k, i);
  });
  const thieu = khoa.filter((k) => !cot.has(k));
  const dong: DongExcel[] = [];
  for (let n = dau; n <= ws.rowCount; n++) {
    const r = ws.getRow(n), o: Record<string, string> = {};
    let coChu = false;
    for (const [k, i] of cot) { o[k] = chuOCell(r.getCell(i).value); if (o[k]) coChu = true; }
    if (coChu) dong.push({ so: n, o });
    if (dong.length > TOI_DA_DONG) return { loi: `Tệp có quá ${TOI_DA_DONG} dòng. Chia nhỏ rồi nhập từng phần.` };
  }
  return { dong, thieu };
}

/** Ô còn nguyên chữ hướng dẫn của tệp mẫu ("<nếu không có xin để trống>") coi như trống. */
export const boHuongDan = (s: string) => (/^</.test(s.trim()) ? "" : s.trim());
export const laCo = (s: string) => /^(có|co|x|1|yes|true)(?![\p{L}\d])/iu.test(s.trim());

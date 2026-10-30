import "server-only";
import ExcelJS from "exceljs";
import { tachBang } from "@/lib/hoa-hong-nhap";

/** Đọc tệp .xlsx / .csv của bảng tỉ lệ hoa hồng thành bảng ô chữ. Tệp .xlsx lấy sheet tên "Tỉ lệ" nếu có, không thì sheet đầu.
 *  Ô định dạng phần trăm (0,1 hiện 10%) được đổi về "10%" để không đọc nhầm thành 0,1%. */
const CHO_PHEP_DUOI = [".xlsx", ".csv"];
export const TOI_DA_BYTE = 5 * 1024 * 1024;

function chuOCell(c: ExcelJS.Cell): string {
  let v: unknown = c.value;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    v = o.richText ? o.richText.map((x) => x.text).join("") : o.result ?? o.text ?? "";
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return c.numFmt?.includes("%") ? `${Math.round(v * 1e8) / 1e6}%` : String(v);
  return String(v ?? "").trim();
}

export async function docTepTiLe(tep: File): Promise<{ bang?: string[][]; loi?: string }> {
  const ten = tep.name.toLowerCase();
  if (!CHO_PHEP_DUOI.some((d) => ten.endsWith(d))) return { loi: "Chỉ nhận tệp .xlsx hoặc .csv." };
  if (tep.size > TOI_DA_BYTE) return { loi: "Tệp quá lớn (tối đa 5 MB)." };
  if (ten.endsWith(".csv")) return { bang: tachBang(await tep.text()) };
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await tep.arrayBuffer());
    const ws = wb.worksheets.find((w) => w.name.trim().toLowerCase() === "tỉ lệ") ?? wb.worksheets[0];
    if (!ws) return { loi: "Tệp không có trang tính nào." };
    const bang: string[][] = [];
    for (let i = 1; i <= ws.rowCount; i++) {
      const hang = ws.getRow(i), o: string[] = [];
      for (let j = 1; j <= Math.max(ws.columnCount, 7); j++) o.push(chuOCell(hang.getCell(j)));
      bang.push(o);
    }
    return { bang };
  } catch {
    return { loi: "Không đọc được tệp. Hãy lưu lại dạng .xlsx (Excel) rồi chọn lại." };
  }
}

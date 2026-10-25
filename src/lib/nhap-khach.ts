import "server-only";
import ExcelJS from "exceljs";
import { chuanSdt, coSdtHopLe } from "@/lib/dinh-dang";

export type KhachNhap = { ho_ten: string; dien_thoai: string; zalo: string | null; email: string | null; ngay_sinh: string | null; gioi_tinh: string | null; dia_chi: string | null; ghi_chu: string | null; dong: number };
export type LoiNhap = { dong: number; viec: string };

const bo = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const TIEU_DE: Record<keyof Omit<KhachNhap, "dong">, string[]> = {
  ho_ten: ["ho ten", "ten khach hang", "ten khach", "khach hang", "ho va ten", "ten"],
  dien_thoai: ["so dien thoai", "dien thoai", "sdt", "phone", "so dt", "mobile"],
  zalo: ["zalo"], email: ["email", "mail"], ngay_sinh: ["ngay sinh", "sinh nhat", "birthday"], gioi_tinh: ["gioi tinh", "gioi"], dia_chi: ["dia chi", "address"], ghi_chu: ["ghi chu", "note"],
};

function ngay(v: unknown): string | null {
  if (v instanceof Date && !isNaN(+v)) return v.toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
const gt = (v: unknown) => { const s = bo(String(v ?? "")); return ["nu", "female", "f"].includes(s) ? "nữ" : ["nam", "male", "m"].includes(s) ? "nam" : s ? "khác" : null; };
const chu = (v: unknown) => { if (v && typeof v === "object" && "text" in (v as object)) v = (v as { text: unknown }).text; const s = String(v ?? "").trim(); return s || null; };

/** Đọc file Excel khách: nhận tiêu đề cột linh hoạt (có/không dấu). Trả khách hợp lệ + danh sách dòng lỗi (thiếu tên, SĐT sai, trùng SĐT trong file). Không ghi DB. */
export async function docKhachTuExcel(buf: ArrayBuffer): Promise<{ khach: KhachNhap[]; loi: LoiNhap[]; cotThieu: string[]; tongDong: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return { khach: [], loi: [{ dong: 0, viec: "File không có trang tính nào." }], cotThieu: [], tongDong: 0 };
  const tieuDe = ws.getRow(1);
  const cot = new Map<string, number>();
  tieuDe.eachCell((c, i) => { const t = bo(String(chu(c.value) ?? "")); for (const [k, ds] of Object.entries(TIEU_DE)) if (!cot.has(k) && ds.includes(t)) cot.set(k, i); });
  const cotThieu = (["ho_ten", "dien_thoai"] as const).filter((k) => !cot.has(k)).map((k) => (k === "ho_ten" ? "Họ tên" : "Số điện thoại"));
  if (cotThieu.length) return { khach: [], loi: [], cotThieu, tongDong: 0 };
  const khach: KhachNhap[] = [], loi: LoiNhap[] = [], thay = new Set<string>();
  const lay = (r: ExcelJS.Row, k: string) => (cot.has(k) ? r.getCell(cot.get(k)!).value : null);
  let tong = 0;
  ws.eachRow((r, so) => {
    if (so === 1) return;
    const ten = chu(lay(r, "ho_ten")), sdt = chuanSdt(String(chu(lay(r, "dien_thoai")) ?? ""));
    if (!ten && !sdt) return;
    tong++;
    if (!ten) return void loi.push({ dong: so, viec: "Thiếu họ tên" });
    if (!coSdtHopLe(sdt)) return void loi.push({ dong: so, viec: `Số điện thoại "${chu(lay(r, "dien_thoai")) ?? ""}" chưa hợp lệ` });
    if (thay.has(sdt)) return void loi.push({ dong: so, viec: `Số ${sdt} bị lặp trong file (giữ dòng đầu)` });
    thay.add(sdt);
    khach.push({ ho_ten: ten, dien_thoai: sdt, zalo: chu(lay(r, "zalo")), email: chu(lay(r, "email")), ngay_sinh: ngay(lay(r, "ngay_sinh")), gioi_tinh: gt(lay(r, "gioi_tinh")), dia_chi: chu(lay(r, "dia_chi")), ghi_chu: chu(lay(r, "ghi_chu")), dong: so });
  });
  return { khach, loi, cotThieu: [], tongDong: tong };
}

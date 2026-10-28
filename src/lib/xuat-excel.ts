import ExcelJS from "exceljs";
import type { sb } from "@/lib/db";

/** Bộ ghi tệp Excel dùng chung cho các nút "Xuất Excel" của báo cáo: dựng sổ làm việc từ các bảng, ghi nhật ký truy cập, trả phản hồi tải về. */
export type Cot = { nhan: string; khoa: string; rong?: number; tien?: boolean; so?: boolean };
export type BangXuat = { ten: string; cot: Cot[]; dong: Record<string, unknown>[] };

export const ngayXuat = (s: string | null | undefined) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "");

/** Đọc hết dữ liệu qua API (mỗi lần tối đa 1.000 dòng). */
export async function docHet<T>(lay: (tu: number, den: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const ra: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await lay(i, i + 999);
    if (error) throw new Error(error.message);
    ra.push(...(data ?? []));
    if (!data || data.length < 1000) return ra;
  }
}

export async function phanHoiExcel(db: ReturnType<typeof sb>, nd: { nhanVienId: string }, bangs: BangXuat[], o: { tenTep: string; doiTuong: string; chiTiet?: Record<string, unknown> }) {
  const wb = new ExcelJS.Workbook();
  for (const b of bangs) {
    const ws = wb.addWorksheet(b.ten.slice(0, 31));
    ws.columns = b.cot.map((c) => ({ header: c.nhan, key: c.khoa, width: c.rong ?? (c.tien ? 18 : 12) }));
    for (const r of b.dong) ws.addRow(Object.fromEntries(b.cot.map((c) => [c.khoa, c.tien || c.so ? Number(r[c.khoa] ?? 0) : (r[c.khoa] ?? "")])));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    b.cot.forEach((c, i) => { if (c.tien || c.so) ws.getColumn(i + 1).numFmt = "#,##0"; });
  }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: o.doiTuong, chi_tiet: { ...o.chiTiet, so_dong: bangs.reduce((s, b) => s + b.dong.length, 0) } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${o.tenTep}.xlsx"`, "Cache-Control": "no-store" } });
}

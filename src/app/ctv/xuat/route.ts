import ExcelJS from "exceljs";
import { sb } from "@/lib/db";
import { layCtv } from "@/lib/ctv-phien";
import { kyCtv, LOAI_BT } from "@/lib/ctv";
import { ngayVN } from "@/lib/dinh-dang";

/** Xuất Excel đối soát của CTV ĐANG ĐĂNG NHẬP (phiên cổng CTV). Không nhận id nguồn từ URL; tên khách đã che, không có dịch vụ. */
export async function GET(req: Request) {
  const ctv = await layCtv();
  if (!ctv) return new Response("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại Cổng CTV.", { status: 401 });
  const u = new URL(req.url);
  const { tu, den } = kyCtv("tuy-chon", u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
  const { data, error } = await sb().rpc("ctv_doi_soat", { p_dt: ctv.id, p_tu: tu, p_den: den });
  if (error) return new Response("Chưa đọc được số liệu, vui lòng thử lại.", { status: 500 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Đối soát");
  ws.addRow([`Đối soát hoa hồng · ${ctv.ten} · mã ${ctv.ma_ref} · kỳ ${ngayVN(tu)} – ${ngayVN(den)}`]).font = { bold: true };
  ws.addRow([]);
  const dau = ws.addRow(["Ngày hoá đơn", "Ngày ghi", "Mã hoá đơn", "Khách (đã che)", "Loại", "Doanh số tính HH", "Tỷ lệ", "Hoa hồng"]);
  dau.font = { bold: true };
  for (const r of data ?? []) ws.addRow([ngayVN(r.ngay_hd), ngayVN(r.ngay_ghi), r.ma_hd ?? "", r.ten_che, LOAI_BT[r.loai]?.ten ?? r.loai, Number(r.doanh_so), r.ty_le, Number(r.hoa_hong)]);
  const tong = ws.addRow(["Tổng", "", "", "", "", (data ?? []).reduce((a, r) => a + Number(r.doanh_so), 0), "", (data ?? []).reduce((a, r) => a + Number(r.hoa_hong), 0)]);
  tong.font = { bold: true };
  [14, 12, 14, 20, 16, 18, 10, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.getColumn(6).numFmt = "#,##0"; ws.getColumn(8).numFmt = "#,##0";
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="doi-soat-${ctv.ma_ref}-${tu}-${den}.xlsx"`, "Cache-Control": "no-store" } });
}

import ExcelJS from "exceljs";
import type { SanPhamKho } from "@/lib/kho-hang-ban-doc";

/** Tệp "Xuất Excel" của Quản lý kho hàng bán, dựng y như tệp SalonHero (so_luong_trong_kho): tiêu đề gộp A1:H2, dòng Chi nhánh ở C3:D3, bảng bắt đầu ở dòng 5.
 *  Cột "Nhãn hiệu": AMIA OS chưa có nhãn hiệu sản phẩm nên để trống. */
export const COT_KHO_HANG_BAN = ["Mã sản phẩm", "Tên sản phẩm", "Nhãn hiệu", "Chi nhánh", "Số lượng còn lại", "Giá nhập", "Giá bán", "Nhóm sản phẩm"] as const;

export function dungExcelKhoHangBan(ds: SanPhamKho[], tenChiNhanh: string): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = [{ width: 19 }, { width: 40 }, { width: 14 }, { width: 26 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 28 }];
  ws.mergeCells("A1:H2");
  const tieuDe = ws.getCell("A1");
  tieuDe.value = "SỐ LƯỢNG SẢN PHẨM TRONG KHO";
  tieuDe.font = { bold: true, size: 14 };
  tieuDe.alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("C3").value = "Chi nhánh"; ws.getCell("C3").font = { bold: true };
  ws.getCell("D3").value = tenChiNhanh;
  const dau = ws.getRow(5);
  dau.values = [...COT_KHO_HANG_BAN];
  dau.font = { bold: true };
  dau.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  for (const s of ds) ws.addRow([s.ma_vach || s.ma, s.ten, "", tenChiNhanh, s.ton, s.gia_nhap_don_vi ?? 0, s.gia_ban, s.nhom ?? ""]);
  for (const c of [5, 6, 7]) ws.getColumn(c).numFmt = "#,##0";
  ws.views = [{ state: "frozen", ySplit: 5 }];
  return wb;
}

import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { COT_KHO_HANG_BAN, dungExcelKhoHangBan } from "../src/lib/kho-hang-ban-xlsx";
import type { SanPhamKho } from "../src/lib/kho-hang-ban-doc";

const sp = (o: Partial<SanPhamKho>): SanPhamKho => ({ id: "1", ma: "SP1", ma_vach: null, ten: "Kem", nhom: "Thermo", don_vi: "Chai", ton_toi_thieu: 0, gia_nhap_don_vi: null, gia_ban: 650000, ton: 0, ...o });

describe("Xuất Excel kho hàng bán (như tệp SalonHero so_luong_trong_kho)", () => {
  it("bố cục: tiêu đề gộp A1:H2, Chi nhánh ở C3:D3, tiêu đề cột dòng 5, dữ liệu từ dòng 6", async () => {
    const wb = dungExcelKhoHangBan([sp({ ma_vach: "8809654401544", ten: "Thermo Nexo DP Booster 2.5ml", ton: -10, gia_nhap_don_vi: 120000 }), sp({ id: "2", ma: "AB-01", ten: "Máy xông mặt" })], "Amia Beauty Center TP Vinh");
    const lai = new ExcelJS.Workbook();
    await lai.xlsx.load((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    const ws = lai.worksheets[0];
    expect(ws.model.merges).toEqual(["A1:H2"]);
    expect(ws.getCell("A1").value).toBe("SỐ LƯỢNG SẢN PHẨM TRONG KHO");
    expect([ws.getCell("C3").value, ws.getCell("D3").value]).toEqual(["Chi nhánh", "Amia Beauty Center TP Vinh"]);
    expect((ws.getRow(5).values as unknown[]).slice(1)).toEqual([...COT_KHO_HANG_BAN]);
    expect(COT_KHO_HANG_BAN).toEqual(["Mã sản phẩm", "Tên sản phẩm", "Nhãn hiệu", "Chi nhánh", "Số lượng còn lại", "Giá nhập", "Giá bán", "Nhóm sản phẩm"]);
    expect((ws.getRow(6).values as unknown[]).slice(1)).toEqual(["8809654401544", "Thermo Nexo DP Booster 2.5ml", "", "Amia Beauty Center TP Vinh", -10, 120000, 650000, "Thermo"]);
    // không có mã vạch thì lấy mã nội bộ; chưa có giá nhập thì 0 (như SalonHero)
    expect((ws.getRow(7).values as unknown[]).slice(1, 7)).toEqual(["AB-01", "Máy xông mặt", "", "Amia Beauty Center TP Vinh", 0, 0]);
    expect(ws.rowCount).toBe(7);
  });
});

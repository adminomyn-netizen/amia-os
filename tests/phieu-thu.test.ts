import { describe, expect, it } from "vitest";
import { docSoTien, maPhieuThu } from "@/lib/phieu-thu";

describe("phiếu thu trả nợ", () => {
  it("số phiếu PT + 6 chữ số", () => {
    expect(maPhieuThu(42)).toBe("PT000042");
    expect(maPhieuThu(1234567)).toBe("PT1234567");
    expect(maPhieuThu(null)).toBe("");
  });
  it("đọc số tiền bằng chữ", () => {
    expect(docSoTien(0)).toBe("Không đồng");
    expect(docSoTien(15_000)).toBe("Mười lăm nghìn đồng");
    expect(docSoTien(21_000)).toBe("Hai mươi mốt nghìn đồng");
    expect(docSoTien(105_000)).toBe("Một trăm linh năm nghìn đồng");
    expect(docSoTien(1_250_000)).toBe("Một triệu hai trăm năm mươi nghìn đồng");
    expect(docSoTien(1_120_000)).toBe("Một triệu một trăm hai mươi nghìn đồng");
    expect(docSoTien(2_005_000)).toBe("Hai triệu không trăm linh năm nghìn đồng");
    expect(docSoTien(34_500)).toBe("Ba mươi tư nghìn năm trăm đồng");
    expect(docSoTien(1_000_000_000)).toBe("Một tỷ đồng");
  });
});

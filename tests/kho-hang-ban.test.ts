import { describe, expect, it } from "vitest";
import { demTinhTrang, khopTinhTrang, tongGiaTriKho } from "@/lib/kho-hang-ban";

describe("kho hàng bán: nhóm đếm như SalonHero", () => {
  const d = [{ ton: 7, toiThieu: 0 }, { ton: 3, toiThieu: 5 }, { ton: 0, toiThieu: 5 }, { ton: -6, toiThieu: 0 }, { ton: 0, toiThieu: 0 }];
  it("Còn hàng gồm cả Sắp hết; Còn + Hết + Âm = Tất cả", () => {
    const n = demTinhTrang(d);
    expect(n).toEqual({ tat_ca: 5, con: 2, sap_het: 1, het: 2, am: 1 });
    expect(n.con + n.het + n.am).toBe(n.tat_ca);
  });
  it("Sắp hết cần mức tối thiểu > 0 và tồn > 0", () => {
    expect(khopTinhTrang(3, 5, "sap_het")).toBe(true); expect(khopTinhTrang(3, 0, "sap_het")).toBe(false); expect(khopTinhTrang(0, 5, "sap_het")).toBe(false);
  });
  it("tổng giá trị cộng cả tồn âm, hàng chưa có giá tính 0", () => {
    expect(tongGiaTriKho([{ ton: 2, gia: 1000 }, { ton: -3, gia: 5000 }, { ton: 9, gia: null }])).toBe(-13000);
  });
});

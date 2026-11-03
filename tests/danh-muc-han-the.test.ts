import { describe, expect, it } from "vitest";
import { nhanHanThe, tinhHanThe, vatThanhChon, vatTuChon } from "@/lib/danh-muc";

describe("Thời hạn loại thẻ tháng + ngày (SalonHero time_limit + time_limit_by_day)", () => {
  it("hiện như SalonHero", () => {
    expect(nhanHanThe(18, 0)).toBe("1 năm 6 tháng");
    expect(nhanHanThe(6, null)).toBe("6 tháng");
    expect(nhanHanThe(99, 99)).toBe("8 năm 3 tháng 99 ngày");
    expect(nhanHanThe(34, 0)).toBe("2 năm 10 tháng");
    expect(nhanHanThe(12, 0)).toBe("1 năm");
    expect(nhanHanThe(0, 11)).toBe("11 ngày");
    expect(nhanHanThe(null, null)).toBe("Không hạn");
  });
  it("tính hạn theo lịch (khớp hàm Postgres tinh_han_the)", () => {
    expect(tinhHanThe(1, 0, "2026-01-31")).toBe("2026-02-28");
    expect(tinhHanThe(1, 0, "2028-01-31")).toBe("2028-02-29");
    expect(tinhHanThe(12, 0, "2026-11-03")).toBe("2027-11-03");
    expect(tinhHanThe(4, 11, "2026-11-03")).toBe("2027-03-14");
    expect(tinhHanThe(null, 99, "2026-11-03")).toBe("2027-02-10");
    expect(tinhHanThe(0, 0, "2026-11-03")).toBeNull();
    expect(tinhHanThe(3, 0, "sai")).toBeNull();
    expect(tinhHanThe(13, 1, "2026-12-31")).toBe("2028-02-01");
  });
});
describe("VAT sản phẩm dùng chung quy ước dịch vụ", () => {
  it("6 mức", () => {
    expect(vatTuChon("8")).toEqual({ vat_pct: 8, vat_loai: null });
    expect(vatTuChon("khong_ke_khai")).toEqual({ vat_pct: 0, vat_loai: "khong_ke_khai" });
    expect(vatTuChon("7")).toBeNull();
    expect(vatThanhChon(0, "khong_chiu_thue")).toBe("khong_chiu_thue");
  });
});

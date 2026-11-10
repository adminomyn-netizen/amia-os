import { describe, expect, it } from "vitest";
import { ngaySinhHopLe } from "@/lib/ngay-sinh";

describe("ngaySinhHopLe", () => {
  const hom = "2026-11-10";
  it("nhận ngày sinh trước hôm nay", () => { expect(ngaySinhHopLe("1990-11-10", hom)).toBe(true); expect(ngaySinhHopLe("2026-11-09", hom)).toBe(true); });
  it("chặn ngày sinh = hôm nay hoặc tương lai (bấm nhầm nút Hôm nay)", () => { expect(ngaySinhHopLe("2026-11-10", hom)).toBe(false); expect(ngaySinhHopLe("2027-01-01", hom)).toBe(false); });
  it("chặn ngày không có thật / sai dạng / trước 1900", () => {
    expect(ngaySinhHopLe("1990-02-30", hom)).toBe(false); expect(ngaySinhHopLe("10/11/1990", hom)).toBe(false); expect(ngaySinhHopLe("1072-06-02", hom)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { duocKetThucBuoi, VAI_TRO, type VaiTro } from "@/lib/quyen";

describe("Kết thúc (trả khách) — chỉ chuyên viên trị liệu (chị Lâm 11/11/2026)", () => {
  it("chuyên viên trị liệu bấm được", () => expect(duocKetThucBuoi({ vaiTro: "ktv" })).toBe(true));
  it("Chủ và Kỹ thuật giữ quyền gỡ lượt kẹt", () => {
    expect(duocKetThucBuoi({ vaiTro: "chu" })).toBe(true);
    expect(duocKetThucBuoi({ vaiTro: "ky_thuat" })).toBe(true);
  });
  it("Thu ngân, Lễ tân, Tư vấn, Kế toán, Quản lý và mọi vai khác không bấm được", () => {
    const duoc = new Set<VaiTro>(["ktv", "chu", "ky_thuat"]);
    for (const v of VAI_TRO) expect(duocKetThucBuoi({ vaiTro: v })).toBe(duoc.has(v));
    for (const v of ["thu_ngan", "le_tan", "tu_van", "ke_toan", "quan_ly"] as const) expect(duocKetThucBuoi({ vaiTro: v })).toBe(false);
  });
  it("chưa đăng nhập: không", () => expect(duocKetThucBuoi(null)).toBe(false));
});

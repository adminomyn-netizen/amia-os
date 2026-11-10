import { describe, expect, it } from "vitest";
import { quyenHieuLuc } from "@/lib/quyen";

// "Xác nhận với Kế toán" (chị Lâm 10/11/2026): Kế toán, Quản lý, Chủ (và Kỹ thuật) bấm được; Thu ngân và vai khác không.
describe("quyền hd.ke_toan", () => {
  it("Kế toán, Quản lý, Chủ, Kỹ thuật có; Thu ngân, Lễ tân, Chỉ xem không có", () => {
    for (const v of ["ke_toan", "quan_ly", "chu", "ky_thuat"] as const) expect(quyenHieuLuc(v, null)).toContain("hd.ke_toan");
    for (const v of ["thu_ngan", "le_tan", "chi_xem", "tu_van"] as const) expect(quyenHieuLuc(v, null)).not.toContain("hd.ke_toan");
  });
  it("cấp riêng được qua danh sách quyền riêng", () => {
    expect(quyenHieuLuc("thu_ngan", ["ban.xem", "hd.ke_toan"])).toContain("hd.ke_toan");
  });
  it("Bỏ xác nhận (hd.bo_ke_toan): chỉ Chủ và Kỹ thuật, không cấp riêng được", () => {
    for (const v of ["chu", "ky_thuat"] as const) expect(quyenHieuLuc(v, null)).toContain("hd.bo_ke_toan");
    for (const v of ["quan_ly", "ke_toan", "thu_ngan", "chi_xem"] as const) expect(quyenHieuLuc(v, null)).not.toContain("hd.bo_ke_toan");
    expect(quyenHieuLuc("quan_ly", ["hd.ke_toan", "hd.bo_ke_toan"])).not.toContain("hd.bo_ke_toan");
  });
});

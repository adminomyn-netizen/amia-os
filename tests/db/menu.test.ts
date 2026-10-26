import { describe, expect, it } from "vitest";
import { locMenu, trangDau } from "../../src/lib/nav";
import { VAI_TRO, quyenHieuLuc, type VaiTro } from "../../src/lib/quyen";

const nguoi = (vaiTro: VaiTro, rieng?: string[] | null) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, rieng) });
const ten = (v: VaiTro, r?: string[] | null) => locMenu(nguoi(v, r)).map((m) => m.ten);

describe("menu theo vai trò", () => {
  it("mọi vai trò (kể cả khi bị gỡ hết quyền) đều có Trang chủ và vào đó đầu tiên, không vòng lặp chuyển trang", () => {
    for (const v of VAI_TRO) { expect(ten(v)[0]).toBe("Trang chủ"); expect(trangDau(nguoi(v))).toBe("/trang-chu"); }
    expect(trangDau(nguoi("ktv", []))).toBe("/trang-chu");
    expect(ten("ktv", [])).toEqual(["Trang chủ"]);
  });
  it("Tổng quan (dashboard) và Nhân viên theo quyền: bác sĩ không có, Quản lý có Tổng quan nhưng không có Nhân viên, Kỹ thuật có cả hai", () => {
    expect(ten("bac_si")).not.toContain("Tổng quan");
    expect(ten("quan_ly")).toContain("Tổng quan");
    expect(ten("quan_ly")).not.toContain("Nhân viên");
    expect(ten("ky_thuat")).toEqual(expect.arrayContaining(["Tổng quan", "Nhân viên"]));
    expect(ten("ktv", ["tongquan.xem"])).toContain("Tổng quan");
  });
});

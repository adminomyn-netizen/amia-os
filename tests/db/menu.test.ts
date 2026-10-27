import { describe, expect, it } from "vitest";
import { locMenu, trangDau } from "../../src/lib/nav";
import { MODULE } from "../../src/lib/module";
import { VAI_TRO, quyenHieuLuc, type VaiTro } from "../../src/lib/quyen";

const nguoi = (vaiTro: VaiTro, rieng?: string[] | null) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, rieng) });
const ten = (v: VaiTro, r?: string[] | null) => locMenu(nguoi(v, r)).map((m) => m.ten);

describe("menu theo vai trò", () => {
  it("mọi vai trò (kể cả khi bị gỡ hết quyền) đều có Trang chủ và vào đó đầu tiên, không vòng lặp chuyển trang", () => {
    for (const v of VAI_TRO) { expect(ten(v)[0]).toBe("Trang chủ"); expect(trangDau(nguoi(v))).toBe("/trang-chu"); }
    expect(trangDau(nguoi("ktv", []))).toBe("/trang-chu");
    expect(ten("ktv", [])).toEqual(["Trang chủ"]);
  });
  it("Tổng quan (dashboard) và Cài đặt theo quyền: bác sĩ không có Tổng quan, Quản lý có Tổng quan, Kỹ thuật có cả hai", () => {
    expect(ten("bac_si")).not.toContain("Tổng quan");
    expect(ten("quan_ly")).toContain("Tổng quan");
    expect(ten("ky_thuat")).toEqual(expect.arrayContaining(["Tổng quan", "Cài đặt", "Nhân sự"]));
    expect(ten("bac_si")).not.toContain("Tài chính - Kế toán");
    expect(ten("ktv", ["tongquan.xem"])).toContain("Tổng quan");
  });
});

describe("các mục lớn và thẻ chức năng", () => {
  it("Tài khoản & phân quyền chỉ hiện cho vai trò có quyền hệ thống (Kỹ thuật), Quản lý không thấy thẻ này", () => {
    const the = MODULE.flatMap((m) => m.nhom.flatMap((g) => g.the)).filter((t) => t.duongDan === "/nhan-vien");
    expect(the.length).toBeGreaterThan(0);
    for (const t of the) {
      expect(t.quyen).toEqual(["hethong.phanquyen"]);
      expect(t.quyen!.some((q) => nguoi("ky_thuat").quyen.includes(q))).toBe(true);
      expect(t.quyen!.some((q) => nguoi("quan_ly").quyen.includes(q))).toBe(false);
    }
  });
  it("mỗi thẻ đã có đường dẫn thì đánh dấu Sẵn sàng; thẻ chưa có đường dẫn thì không", () => {
    for (const t of MODULE.flatMap((m) => m.nhom.flatMap((g) => g.the))) expect(!!t.duongDan).toBe(t.trangThai === "san_sang");
  });
});

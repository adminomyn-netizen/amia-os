import { describe, expect, it } from "vitest";
import { locMenu, trangDau } from "../../src/lib/nav";
import { MODULE } from "../../src/lib/module";
import { VAI_TRO, quyenHieuLuc, type VaiTro } from "../../src/lib/quyen";

const nguoi = (vaiTro: VaiTro, rieng?: string[] | null) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, rieng) });
const ten = (v: VaiTro, r?: string[] | null) => locMenu(nguoi(v, r)).map((m) => m.ten);

const dashboard = (v: VaiTro, r?: string[] | null) => locMenu(nguoi(v, r)).find((m) => m.ten === "Dashboard")?.duong_dan;

describe("menu theo vai trò (12 mục như BeDental, chị Lâm 10/11/2026)", () => {
  it("mọi vai trò (kể cả khi bị gỡ hết quyền) đều có Dashboard đứng đầu, không vòng lặp chuyển trang", () => {
    for (const v of VAI_TRO) {
      expect(ten(v)[0]).toBe("Dashboard");
      expect(trangDau(nguoi(v))).toBe(nguoi(v).quyen.includes("tongquan.xem") ? "/tong-quan" : "/trang-chu");
    }
    expect(trangDau(nguoi("ktv", []))).toBe("/trang-chu");
    expect(ten("ktv", [])).toEqual(["Dashboard"]);
  });
  it("mỗi tên mục chỉ một lần, tối đa 12 mục, đúng thứ tự BeDental", () => {
    const thuTu = ["Dashboard", "Lịch hẹn", "Nơi làm việc", "Khách hàng", "POS / Bán hàng", "Tài chính - Kế toán", "Kho & Mua sắm", "Nhân sự", "Văn bản & Hợp đồng", "Báo cáo", "Marketing", "Cài đặt"];
    expect(ten("chu")).toEqual(thuTu);
    for (const v of VAI_TRO) { const t = ten(v); expect(new Set(t).size).toBe(t.length); expect(t.length).toBeLessThanOrEqual(12); }
  });
  it("Dashboard theo quyền: bác sĩ ra Trang chủ, Quản lý ra Tổng quan; POS: Thu ngân ra màn bán, Lễ tân ra Hoá đơn", () => {
    expect(dashboard("bac_si")).toBe("/trang-chu");
    expect(dashboard("quan_ly")).toBe("/tong-quan");
    expect(dashboard("ktv", ["tongquan.xem"])).toBe("/tong-quan");
    expect(ten("ky_thuat")).toEqual(expect.arrayContaining(["Cài đặt", "Nhân sự"]));
    expect(ten("bac_si")).not.toContain("Tài chính - Kế toán");
    expect(locMenu(nguoi("thu_ngan")).find((m) => m.ten === "POS / Bán hàng")?.duong_dan).toBe("/ban-hang");
    expect(locMenu(nguoi("le_tan")).find((m) => m.ten === "POS / Bán hàng")?.duong_dan).toBe("/hoa-don");
  });
});

describe("vai trò Nhân viên (đăng ký tự do)", () => {
  it("chỉ có quyền dùng Nơi làm việc: thấy Dashboard (Trang chủ), Nơi làm việc, Nhân sự (thu nhập của tôi)", () => {
    expect(nguoi("nhan_vien").quyen).toEqual(["noibo.dung"]);
    expect(ten("nhan_vien")).toEqual(["Dashboard", "Nơi làm việc", "Nhân sự"]);
  });
});

describe("các mục lớn và thẻ chức năng", () => {
  it("Tài khoản & phân quyền chỉ hiện cho vai trò có quyền hệ thống (Kỹ thuật), Quản lý không thấy thẻ này", () => {
    const the = MODULE.flatMap((m) => m.nhom.flatMap((g) => g.the)).filter((t) => t.duongDan === "/nhan-vien");
    expect(the.length).toBeGreaterThan(0);
    for (const t of the) {
      expect(t.quyen).toEqual(["hethong.phanquyen"]);
      expect(t.quyen!.some((q) => nguoi("ky_thuat").quyen.includes(q))).toBe(true);
      expect(t.quyen!.some((q) => nguoi("chu").quyen.includes(q))).toBe(true);
      expect(t.quyen!.some((q) => nguoi("quan_ly").quyen.includes(q))).toBe(false);
    }
  });
  it("mỗi thẻ đã có đường dẫn thì đánh dấu Sẵn sàng; thẻ chưa có đường dẫn thì không", () => {
    for (const t of MODULE.flatMap((m) => m.nhom.flatMap((g) => g.the))) expect(!!t.duongDan).toBe(t.trangThai === "san_sang");
  });
});

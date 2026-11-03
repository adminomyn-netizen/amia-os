import { describe, expect, it } from "vitest";
import { docKhachDiCung, dongKhachDiCung, TOI_DA_KHACH_DI_CUNG } from "@/lib/lich-hen-nhom";

const DV = "11111111-1111-4111-8111-111111111111", NV = "22222222-2222-4222-8222-222222222222";

describe("Khách đi cùng (lịch nhiều khách)", () => {
  it("rỗng / không gửi = lịch một khách", () => {
    expect(docKhachDiCung("")).toEqual([]);
    expect(docKhachDiCung("[]")).toEqual([]);
  });
  it("đọc đủ trường, tên trống thì đặt Khách N, bỏ dịch vụ trùng", () => {
    const kq = docKhachDiCung(JSON.stringify([{ ten: " ", dichVuIds: [DV, DV], nhanVienId: NV, phong: " P1 ", thoiLuong: 45 }]));
    expect(kq).toEqual([{ ten: "Khách 2", dichVuIds: [DV], nhanVienId: NV, phong: "P1", thoiLuong: 45 }]);
  });
  it("báo lỗi tiếng Việt khi thiếu dịch vụ, mã lạ, thời lượng sai, quá số khách", () => {
    expect(docKhachDiCung(JSON.stringify([{ dichVuIds: [] }]))).toBe("Khách 2: chọn ít nhất một dịch vụ.");
    expect(docKhachDiCung(JSON.stringify([{ dichVuIds: [DV] }, { dichVuIds: ["x"] }]))).toBe("Khách 3: dịch vụ không hợp lệ.");
    expect(docKhachDiCung(JSON.stringify([{ dichVuIds: [DV], nhanVienId: "abc" }]))).toBe("Khách 2: người thực hiện không hợp lệ.");
    expect(docKhachDiCung(JSON.stringify([{ dichVuIds: [DV], thoiLuong: 2 }]))).toBe("Khách 2: thời lượng phải từ 5 đến 600 phút.");
    expect(docKhachDiCung(JSON.stringify(Array(TOI_DA_KHACH_DI_CUNG + 1).fill({ dichVuIds: [DV] })))).toBe("Một lịch tối đa 20 khách.");
    expect(docKhachDiCung("{")).toBe("Danh sách khách đi cùng không hợp lệ.");
  });
  it("dòng ghi bảng đánh thứ tự từ 2", () => {
    const ds = docKhachDiCung(JSON.stringify([{ dichVuIds: [DV] }, { ten: "Bạn chị A", dichVuIds: [DV] }]));
    if (typeof ds === "string") throw new Error(ds);
    expect(dongKhachDiCung("L", ds).map((d) => [d.thu_tu, d.ten])).toEqual([[2, "Khách 2"], [3, "Bạn chị A"]]);
  });
});

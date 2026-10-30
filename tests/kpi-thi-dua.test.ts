import { describe, expect, it } from "vitest";
import { thangCuaKy, tienThuong, xepHangCaNhan, xepHangPhong, xepHangTrongPhong } from "@/lib/kpi-thi-dua";

const nguoi = new Map([["a", { ten: "An", phongId: "p1" }], ["b", { ten: "Bình", phongId: "p1" }], ["c", { ten: "Chi", phongId: "p2" }], ["d", { ten: "Dũng", phongId: null }]]);
const diem = [
  { nhan_vien_id: "a", nam: 2026, thang: 10, diem: 90 }, { nhan_vien_id: "b", nam: 2026, thang: 10, diem: 80 }, { nhan_vien_id: "c", nam: 2026, thang: 10, diem: 90 },
  { nhan_vien_id: "a", nam: 2026, thang: 7, diem: 70 }, { nhan_vien_id: "x", nam: 2026, thang: 10, diem: 99 },
];
describe("KPI thi đua", () => {
  it("quý gồm đúng 3 tháng", () => { expect(thangCuaKy("quy", 4)).toEqual([10, 11, 12]); expect(thangCuaKy("thang", 5)).toEqual([5]); });
  it("hạng cá nhân: cùng điểm cùng hạng, người lạ không vào bảng", () => {
    const kq = xepHangCaNhan(diem, 2026, "thang", 10, nguoi);
    expect(kq.map((x) => [x.id, x.hang])).toEqual([["a", 1], ["c", 1], ["b", 3]]);
  });
  it("quý trung bình các tháng có điểm", () => {
    const kq = xepHangCaNhan(diem, 2026, "quy", 4, nguoi);
    expect(kq.find((x) => x.id === "a")).toMatchObject({ diem: 90, soThang: 1 });
    expect(xepHangCaNhan(diem, 2026, "quy", 3, nguoi)[0]).toMatchObject({ id: "a", diem: 70 });
  });
  it("hạng phòng theo trung bình, hạng trong phòng tính lại", () => {
    const cn = xepHangCaNhan(diem, 2026, "thang", 10, nguoi);
    expect(xepHangPhong(cn, (id) => id).map((p) => [p.id, p.diem, p.hang])).toEqual([["p2", 90, 1], ["p1", 85, 2]]);
    expect(xepHangTrongPhong(cn, "p1").map((x) => [x.id, x.hang])).toEqual([["a", 1], ["b", 2]]);
  });
  it("tiền thưởng chỉ có cho hạng 1 đến 3", () => {
    const bang = [{ ky: "thang", doi_tuong: "phong", hang: 1, so_tien: "500000" }];
    expect(tienThuong(bang, "thang", "phong", 1)).toBe(500000);
    expect(tienThuong(bang, "thang", "phong", 2)).toBe(0);
    expect(tienThuong(bang, "thang", "phong", 4)).toBe(0);
  });
});

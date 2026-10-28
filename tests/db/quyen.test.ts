import { describe, expect, it } from "vitest";
import { QUYEN_THEO_VAI_TRO, VAI_TRO, coQuyen, quyenHieuLuc, type VaiTro } from "../../src/lib/quyen";

const nguoi = (vaiTro: VaiTro, rieng?: string[] | null) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, rieng) });

describe("ma trận quyền", () => {
  it("chỉ Chủ và Kỹ thuật nắm phân quyền hệ thống, và có mọi quyền khác", () => {
    const nam = VAI_TRO.filter((v) => coQuyen(nguoi(v), "hethong.phanquyen"));
    expect(nam).toEqual(["chu", "ky_thuat"]);
    for (const q of QUYEN_THEO_VAI_TRO.quan_ly) { expect(coQuyen(nguoi("ky_thuat"), q)).toBe(true); expect(coQuyen(nguoi("chu"), q)).toBe(true); }
  });

  it("Quản lý / Leader có sẵn mọi tính năng nghiệp vụ, trừ phân quyền hệ thống", () => {
    for (const v of ["quan_ly"] as const) for (const q of QUYEN_THEO_VAI_TRO.ky_thuat.filter((x) => x !== "hethong.phanquyen")) expect(coQuyen(nguoi(v), q)).toBe(true);
  });

  it("danh sách riêng thay hẳn mặc định; không ghi thì theo vai trò", () => {
    expect(coQuyen(nguoi("ktv"), "tongquan.xem")).toBe(false);
    expect(coQuyen(nguoi("ktv", ["tongquan.xem", "khach.xem"]), "tongquan.xem")).toBe(true);
    expect(coQuyen(nguoi("ktv", ["tongquan.xem", "khach.xem"]), "the.thuchien")).toBe(false);
    expect(coQuyen(nguoi("ktv", null), "the.thuchien")).toBe(true);
  });

  it("không ai ngoài Kỹ thuật có quyền hệ thống dù danh sách riêng ghi vào; Kỹ thuật không bị cắt quyền", () => {
    expect(coQuyen(nguoi("quan_ly", ["hethong.phanquyen", "khach.xem"]), "hethong.phanquyen")).toBe(false);
    expect(coQuyen(nguoi("ky_thuat", []), "hethong.phanquyen")).toBe(true);
    expect(coQuyen(nguoi("chu", []), "hethong.phanquyen")).toBe(true);
    expect(coQuyen(nguoi("ky_thuat", ["khach.xem"]), "kho.nhap")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { docKy, khoangKy } from "@/lib/ky-xep-hang";

describe("khoangKy (bảng xếp hạng Dashboard)", () => {
  it("hôm nay: một ngày", () => {
    expect(khoangKy("hom-nay", "2026-11-10")).toEqual({ tu: "2026-11-10", den: "2026-11-10", nhan: "hôm nay 10/11" });
  });
  it("tuần này: thứ Hai → hôm nay (kể cả vắt qua tháng / năm)", () => {
    expect(khoangKy("tuan-nay", "2026-11-10")).toMatchObject({ tu: "2026-11-09", den: "2026-11-10" }); // thứ Ba
    expect(khoangKy("tuan-nay", "2026-11-09")).toMatchObject({ tu: "2026-11-09", den: "2026-11-09" }); // thứ Hai
    expect(khoangKy("tuan-nay", "2026-11-15")).toMatchObject({ tu: "2026-11-09" }); // Chủ nhật
    expect(khoangKy("tuan-nay", "2027-01-02")).toMatchObject({ tu: "2026-12-28" });
  });
  it("docKy: lạ thì về hôm nay", () => {
    expect(docKy(undefined)).toBe("hom-nay");
    expect(docKy("xyz")).toBe("hom-nay");
    expect(docKy("thang-truoc")).toBe("thang-truoc");
  });
  it("tháng này: đầu tháng → hôm nay", () => {
    expect(khoangKy("thang-nay", "2026-11-10")).toEqual({ tu: "2026-11-01", den: "2026-11-10", nhan: "tháng 11" });
  });
  it("tháng trước: trọn tháng, gồm ngày cuối tháng", () => {
    expect(khoangKy("thang-truoc", "2026-11-10")).toEqual({ tu: "2026-10-01", den: "2026-10-31", nhan: "tháng 10" });
    expect(khoangKy("thang-truoc", "2026-03-31")).toEqual({ tu: "2026-02-01", den: "2026-02-28", nhan: "tháng 2" });
    expect(khoangKy("thang-truoc", "2027-01-05")).toEqual({ tu: "2026-12-01", den: "2026-12-31", nhan: "tháng 12" });
  });
});

import { docKyDt, khoangKyDt, kyTruoc } from "@/lib/ky-xep-hang";

describe("kỳ tab Doanh thu (chị Lâm 11/11/2026)", () => {
  const H = "2026-11-11";
  it("docKyDt: mặc định Tháng này, nhận đủ 7 kỳ", () => {
    expect(docKyDt(undefined)).toBe("thang-nay");
    expect(docKyDt("abc")).toBe("thang-nay");
    for (const k of ["hom-nay", "hom-qua", "tuan-nay", "thang-nay", "thang-truoc", "90-ngay", "tuy-chinh"]) expect(docKyDt(k)).toBe(k);
  });
  it("hôm nay / hôm qua / tuần này / tháng này / tháng trước / 90 ngày", () => {
    expect(khoangKyDt("hom-nay", H)).toEqual({ tu: H, den: H, nhan: "hôm nay" });
    expect(khoangKyDt("hom-qua", H)).toEqual({ tu: "2026-11-10", den: "2026-11-10", nhan: "hôm qua 10/11" });
    expect(khoangKyDt("hom-qua", "2026-03-01")).toMatchObject({ tu: "2026-02-28" });
    expect(khoangKyDt("tuan-nay", H)).toMatchObject({ tu: "2026-11-09", den: H, nhan: "tuần này" });
    expect(khoangKyDt("thang-nay", H)).toMatchObject({ tu: "2026-11-01", den: H });
    expect(khoangKyDt("thang-truoc", H)).toMatchObject({ tu: "2026-10-01", den: "2026-10-31" });
    expect(khoangKyDt("90-ngay", H)).toEqual({ tu: "2026-08-14", den: H, nhan: "90 ngày qua" }); // gồm hai đầu = 90 ngày
  });
  it("tùy chỉnh: đúng thì giữ, đảo thì đổi chỗ, quá hôm nay thì chặn, sai thì về tháng này, dài quá 366 ngày thì cắt", () => {
    expect(khoangKyDt("tuy-chinh", H, "2026-11-01", "2026-11-05")).toEqual({ tu: "2026-11-01", den: "2026-11-05", nhan: "01/11–05/11" });
    expect(khoangKyDt("tuy-chinh", H, "2026-11-05", "2026-11-01")).toMatchObject({ tu: "2026-11-01", den: "2026-11-05" });
    expect(khoangKyDt("tuy-chinh", H, "2026-11-01", "2026-12-31")).toMatchObject({ tu: "2026-11-01", den: H });
    expect(khoangKyDt("tuy-chinh", H, "2026-11-03", undefined)).toMatchObject({ tu: "2026-11-03", den: "2026-11-03", nhan: "03/11" });
    expect(khoangKyDt("tuy-chinh", H, "xyz", "2026-02-30")).toMatchObject({ tu: "2026-11-01", den: H });
    expect(khoangKyDt("tuy-chinh", H, "2024-01-01", H)).toEqual({ tu: "2025-11-11", den: H, nhan: "11/11/2025–11/11/2026", catBot: true });
  });
  it("kỳ so sánh", () => {
    expect(kyTruoc("thang-nay", "2026-11-01", H)).toEqual({ tu: "2026-10-01", den: "2026-10-11" });
    expect(kyTruoc("thang-nay", "2026-03-01", "2026-03-31")).toEqual({ tu: "2026-02-01", den: "2026-02-28" });
    expect(kyTruoc("thang-truoc", "2026-10-01", "2026-10-31")).toEqual({ tu: "2026-09-01", den: "2026-09-30" });
    expect(kyTruoc("hom-nay", H, H)).toEqual({ tu: "2026-11-10", den: "2026-11-10" });
    expect(kyTruoc("tuan-nay", "2026-11-09", H)).toEqual({ tu: "2026-11-02", den: "2026-11-04" });
    expect(kyTruoc("90-ngay", "2026-08-14", H)).toEqual({ tu: "2026-05-16", den: "2026-08-13" });
  });
});

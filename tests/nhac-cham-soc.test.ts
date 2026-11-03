import { describe, expect, it } from "vitest";
import { cacNgayNhac, docCacKhoang, docQuyTac, moTaLapNhac } from "@/lib/nhac-cham-soc";

const ngay = (ds: string[]) => ds.map((x) => new Date(new Date(x).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " "));

describe("nhắc chăm sóc: các lần nhắc", () => {
  it("không lặp: 1 lần, giờ Việt Nam", () => {
    expect(ngay(cacNgayNhac("2026-11-05", "09:30", { kieu: "SINGLE" }))).toEqual(["2026-11-05 09:30"]);
  });
  it("mỗi 1 tuần × 2 lần (quy tắc thẻ CSD của SalonHero)", () => {
    expect(ngay(cacNgayNhac("2026-11-05", "09:00", { kieu: "WEEK", moi: 1, so_lan: 2 }))).toEqual(["2026-11-05 09:00", "2026-11-12 09:00"]);
  });
  it("mỗi 10 ngày × 3 lần qua tháng; theo tháng 31 → cuối tháng ngắn", () => {
    expect(ngay(cacNgayNhac("2026-11-25", "08:00", { kieu: "DAY", moi: 10, so_lan: 3 }))).toEqual(["2026-11-25 08:00", "2026-12-05 08:00", "2026-12-15 08:00"]);
    expect(ngay(cacNgayNhac("2027-01-31", "08:00", { kieu: "MONTH", moi: 1, so_lan: 3 }))).toEqual(["2027-01-31 08:00", "2027-02-28 08:00", "2027-03-31 08:00"]);
  });
  it("lặp không đều: cộng dồn từng khoảng", () => {
    expect(ngay(cacNgayNhac("2026-11-01", "10:00", { kieu: "UNEQUAL", cac_khoang: [7, 14] }))).toEqual(["2026-11-01 10:00", "2026-11-08 10:00", "2026-11-22 10:00"]);
  });
  it("đọc khoảng ngày và quy tắc lưu", () => {
    expect(docCacKhoang("7, 14 ;30")).toEqual([7, 14, 30]);
    expect(typeof docCacKhoang("7, 0")).toBe("string");
    expect(typeof docCacKhoang("")).toBe("string");
    expect(docQuyTac({ kieu: "WEEK", moi: "1", so_lan: 2 })).toEqual({ kieu: "WEEK", moi: 1, so_lan: 2, cac_khoang: [] });
    expect(docQuyTac({ kieu: "SINGLE" })).toBeNull();
    expect(docQuyTac("x")).toBeNull();
  });
  it("mô tả lặp: nhắc mới và nhắc SalonHero cũ", () => {
    expect(moTaLapNhac({ kieu_lap: "WEEK", lap_khoang: 2, cac_ngay_nhac: ["a", "b", "c"] })).toBe("Mỗi 2 tuần · 3 lần");
    expect(moTaLapNhac({ kieu_lap: "WEEK", so_lan_lap: 1, cac_ngay_nhac: null })).toBe("Hằng tuần · 2 lần");
    expect(moTaLapNhac({ kieu_lap: "SINGLE" })).toBe("");
  });
});

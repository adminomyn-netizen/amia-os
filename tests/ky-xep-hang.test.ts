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

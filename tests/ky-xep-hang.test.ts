import { describe, expect, it } from "vitest";
import { khoangKy } from "@/lib/ky-xep-hang";

describe("khoangKy (bảng xếp hạng Dashboard)", () => {
  it("tháng này: đầu tháng → hôm nay", () => {
    expect(khoangKy("thang-nay", "2026-11-10")).toEqual({ tu: "2026-11-01", den: "2026-11-10", nhan: "tháng 11" });
  });
  it("tháng trước: trọn tháng, gồm ngày cuối tháng", () => {
    expect(khoangKy("thang-truoc", "2026-11-10")).toEqual({ tu: "2026-10-01", den: "2026-10-31", nhan: "tháng 10" });
    expect(khoangKy("thang-truoc", "2026-03-31")).toEqual({ tu: "2026-02-01", den: "2026-02-28", nhan: "tháng 2" });
    expect(khoangKy("thang-truoc", "2027-01-05")).toEqual({ tu: "2026-12-01", den: "2026-12-31", nhan: "tháng 12" });
  });
});

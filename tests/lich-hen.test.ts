import { describe, expect, it } from "vitest";
import { moTaLap, ngayLap, nhanNguon } from "@/lib/lich-hen";

describe("lịch lặp", () => {
  it("theo ngày / tuần, qua tháng và năm", () => {
    expect(ngayLap("2026-12-30", "DAILY", 1, 3)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01"]);
    expect(ngayLap("2026-10-28", "WEEKLY", 2, 3)).toEqual(["2026-10-28", "2026-11-11", "2026-11-25"]);
  });
  it("theo tháng: ngày 31 rơi vào tháng ngắn thì lấy ngày cuối tháng", () => {
    expect(ngayLap("2026-01-31", "MONTHLY", 1, 4)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(ngayLap("2027-11-30", "MONTHLY", 3, 2)).toEqual(["2027-11-30", "2028-02-29"]);
  });
  it("nhãn nguồn và mô tả lặp", () => {
    expect(nhanNguon("PHONE")).toBe("Gọi điện");
    expect(nhanNguon("Zalo cũ")).toBe("Zalo cũ");
    expect(nhanNguon(null)).toBe("");
    expect(moTaLap({ kieu_lap: "WEEKLY", lap_khoang: 2, lap_tong: 4, lap_thu_tu: 1 })).toBe("Lặp theo tuần, 2 tuần/lần · buổi 1/4");
    expect(moTaLap({ kieu_lap: "MONTHLY" })).toBe("Lặp theo tháng");
    expect(moTaLap({ kieu_lap: null })).toBe("");
  });
});

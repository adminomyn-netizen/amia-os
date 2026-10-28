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

import { cacNgayTrong, chuTatTen, nhanCotNgay, nhanNgayDai, thuCuaNgay } from "@/lib/lich-hen";
describe("lưới lịch hẹn kiểu SalonHero", () => {
  it("nhãn cột ngày", () => {
    expect(nhanCotNgay("2026-10-28", "2026-10-28")).toBe("Hôm nay (28/10)");
    expect(nhanCotNgay("2026-10-29", "2026-10-28")).toBe("Thứ 5 (29/10)");
    expect(nhanCotNgay("2026-11-01", "2026-10-28")).toBe("C.Nhật (01/11)");
    expect(thuCuaNgay("2026-10-31")).toBe(6);
    expect(nhanNgayDai("2026-10-28", "2026-10-28")).toBe("Thứ 4, 28/10/2026 (Hôm nay)");
  });
  it("khoảng ngày 8 ngày, qua tháng", () => {
    expect(cacNgayTrong("2026-10-28", "2026-11-04")).toHaveLength(8);
    expect(cacNgayTrong("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(cacNgayTrong("2026-01-01", "2026-12-31", 31)).toHaveLength(31);
  });
  it("chữ tắt tên nhân viên", () => {
    expect(chuTatTen("MSC.0134. Đinh Thị Hôngg Mây")).toBe("MĐ");
    expect(chuTatTen("MSC.TV-25.0115.Nguyễn Thị Thư")).toBe("TN");
    expect(chuTatTen("Tuyết Nhung KTV")).toBe("KT");
  });
});

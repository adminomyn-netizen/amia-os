import { describe, expect, it } from "vitest";
import { khongRoNam, namSinh, ngaySinhHopLe, ngaySinhKhongNam, ngaySinhVN, tuoiSinhNhatNam } from "@/lib/ngay-sinh";

describe("ngaySinhHopLe", () => {
  const hom = "2026-11-10";
  it("nhận ngày sinh trước hôm nay", () => { expect(ngaySinhHopLe("1990-11-10", hom)).toBe(true); expect(ngaySinhHopLe("2026-11-09", hom)).toBe(true); });
  it("chặn ngày sinh = hôm nay hoặc tương lai (bấm nhầm nút Hôm nay)", () => { expect(ngaySinhHopLe("2026-11-10", hom)).toBe(false); expect(ngaySinhHopLe("2027-01-01", hom)).toBe(false); });
  it("chặn ngày không có thật / sai dạng / trước 1900", () => {
    expect(ngaySinhHopLe("1990-02-30", hom)).toBe(false); expect(ngaySinhHopLe("10/11/1990", hom)).toBe(false); expect(ngaySinhHopLe("1072-06-02", hom)).toBe(false);
  });
  it("nhận ngày sinh không rõ năm (1904-mm-dd), kể cả 29/02", () => { expect(ngaySinhHopLe("1904-11-20", hom)).toBe(true); expect(ngaySinhHopLe("1904-02-29", hom)).toBe(true); });
});

describe("ngày sinh không rõ năm", () => {
  it("ngày + tháng → 1904-mm-dd; ngày không có thật → null", () => {
    expect(ngaySinhKhongNam(20, 11)).toBe("1904-11-20"); expect(ngaySinhKhongNam(29, 2)).toBe("1904-02-29");
    expect(ngaySinhKhongNam(31, 4)).toBeNull(); expect(ngaySinhKhongNam(30, 2)).toBeNull(); expect(ngaySinhKhongNam(1, 13)).toBeNull(); expect(ngaySinhKhongNam(0, 1)).toBeNull();
  });
  it("hiển thị + nhận diện", () => {
    expect(ngaySinhVN("1904-11-20")).toBe("20/11 (không rõ năm)"); expect(ngaySinhVN("1990-11-20")).toBe("20/11/1990"); expect(ngaySinhVN(null)).toBe("");
    expect(khongRoNam("1904-11-20")).toBe(true); expect(khongRoNam("1990-11-20")).toBe(false); expect(khongRoNam(null)).toBe(false);
  });
  it("không tính tuổi / năm sinh cho khách không rõ năm hoặc năm vô lý", () => {
    const hom = "2026-11-10";
    expect(tuoiSinhNhatNam("1904-11-20", hom)).toBeNull(); expect(tuoiSinhNhatNam("1990-11-20", hom)).toBe(36);
    expect(tuoiSinhNhatNam("2030-12-01", hom)).toBeNull(); expect(tuoiSinhNhatNam("2525-10-12", hom)).toBeNull(); expect(tuoiSinhNhatNam(null, hom)).toBeNull();
    expect(namSinh("1904-11-20")).toBeNull(); expect(namSinh("1990-11-20")).toBe("1990");
  });
});

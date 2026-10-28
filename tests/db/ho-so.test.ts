import { describe, expect, it } from "vitest";
import { giayToConThieu, kiemTraHoSo, ngayToiSinhNhat, nhomThamNien, nhomTuoi, thamNien, tuoi, tyLeDienHoSo } from "@/lib/ho-so";

describe("hồ sơ nhân sự", () => {
  it("thâm niên và nhóm thâm niên theo tháng tròn", () => {
    expect(thamNien("2025-03-03", "2026-10-28")).toBe("1 năm 7 tháng");
    expect(thamNien("2026-10-20", "2026-10-28")).toBe("Mới vào");
    expect(nhomThamNien("2026-08-01", "2026-10-28")).toBe("Dưới 3 tháng");
    expect(nhomThamNien("2018-01-01", "2026-10-28")).toBe("Trên 7 năm");
    expect(nhomThamNien(null, "2026-10-28")).toBe("Chưa có ngày vào");
  });
  it("tuổi và nhóm tuổi", () => {
    expect(tuoi("1995-11-02", "2026-10-28")).toBe(30);
    expect(nhomTuoi(30)).toBe("30 – 34");
    expect(nhomTuoi(null)).toBe("Chưa có ngày sinh");
  });
  it("sinh nhật kế tiếp, qua năm và 29/2", () => {
    expect(ngayToiSinhNhat("1990-10-28", "2026-10-28")).toBe(0);
    expect(ngayToiSinhNhat("1990-11-02", "2026-10-28")).toBe(5);
    expect(ngayToiSinhNhat("1990-01-02", "2026-12-30")).toBe(3);
    expect(ngayToiSinhNhat("1992-02-29", "2027-02-27")).toBe(1);
  });
  it("kiểm tra giấy tờ: CCCD, MST, BHXH, tài khoản; trống thì hợp lệ", () => {
    expect(kiemTraHoSo({})).toBeNull();
    expect(kiemTraHoSo({ cccd: "012345678901" })).toBeNull();
    expect(kiemTraHoSo({ cccd: "123" })).toMatch(/CCCD/);
    expect(kiemTraHoSo({ ma_so_thue: "8123456789" })).toBeNull();
    expect(kiemTraHoSo({ ma_so_thue: "81234" })).toMatch(/thuế/);
    expect(kiemTraHoSo({ so_bhxh: "123" })).toMatch(/BHXH/);
    expect(kiemTraHoSo({ so_tai_khoan: "12ab" })).toMatch(/tài khoản/);
    expect(kiemTraHoSo({ ngay_sinh: "2026-13-45" })).toMatch(/Ngày sinh/);
  });
  it("giấy tờ bắt buộc còn thiếu và % hồ sơ", () => {
    expect(giayToConThieu([]).length).toBe(5);
    expect(giayToConThieu([{ loai: "CCCD mặt trước", da_go: false, trang_thai: "Đã xác nhận" }, { loai: "CCCD mặt sau", da_go: false, trang_thai: "Cần bổ sung" }]).length).toBe(4);
    expect(tyLeDienHoSo(null)).toBe(0);
    expect(tyLeDienHoSo({ gioi_tinh: "Nữ", ngay_sinh: "1995-01-01" })).toBe(13);
  });
});

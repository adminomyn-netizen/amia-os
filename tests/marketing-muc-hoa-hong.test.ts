import { describe, expect, it } from "vitest";
import { docMucHoaHong, nhanMucHoaHong } from "@/lib/marketing";

describe("mức hoa hồng giới thiệu mặc định (như SalonHero: %, tiền, điểm)", () => {
  it("nhận đúng ba kiểu, chuẩn hoá giá trị", () => {
    expect(docMucHoaHong("phan_tram", 12.5)).toEqual({ kieu: "phan_tram", giaTri: 12.5 });
    expect(docMucHoaHong("tien", 20000.4)).toEqual({ kieu: "tien", giaTri: 20000 });
    expect(docMucHoaHong("diem", 3)).toEqual({ kieu: "diem", giaTri: 3 });
  });
  it("chặn giá trị sai", () => {
    expect(docMucHoaHong("phan_tram", 101)).toHaveProperty("loi");
    expect(docMucHoaHong("tien", -1)).toHaveProperty("loi");
    expect(docMucHoaHong("khac", 1)).toHaveProperty("loi");
  });
  it("nhãn hiển thị", () => {
    expect(nhanMucHoaHong("phan_tram", 10)).toBe("10%");
    expect(nhanMucHoaHong("diem", 5)).toBe("5 điểm");
    expect(nhanMucHoaHong("tien", 20000)).toMatch(/^20\.000 đ$/);
  });
});

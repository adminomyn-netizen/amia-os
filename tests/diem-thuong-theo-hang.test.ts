import { describe, expect, it } from "vitest";
import { diemRaTien, diemTichDuoc, type CauHinhHang } from "../src/lib/diem-hang";

const ch: CauHinhHang[] = [{ hang: "Thường", tienMoiDiem: 100000, tienDoiMoiDiem: 10000 }, { hang: "Kim cương", tienMoiDiem: 50000, tienDoiMoiDiem: 20000 }];
describe("điểm thưởng theo hạng (hàm thuần)", () => {
  it("tích điểm làm tròn xuống theo hạng", () => {
    expect(diemTichDuoc(ch, "Thường", 360000)).toBe(3);
    expect(diemTichDuoc(ch, "Thường", 99999)).toBe(0);
    expect(diemTichDuoc(ch, "Kim cương", 360000)).toBe(7);
  });
  it("hạng chưa cấu hình, số tiền hoặc điểm không dương → 0", () => {
    expect(diemTichDuoc(ch, "Vàng", 1000000)).toBe(0);
    expect(diemTichDuoc(ch, "Thường", 0)).toBe(0);
    expect(diemTichDuoc(ch, "Thường", -5)).toBe(0);
    expect(diemRaTien(ch, "Vàng", 10)).toBe(0);
    expect(diemRaTien(ch, "Thường", 0)).toBe(0);
  });
  it("quy điểm ra tiền theo hạng", () => {
    expect(diemRaTien(ch, "Thường", 15)).toBe(150000);
    expect(diemRaTien(ch, "Kim cương", 15)).toBe(300000);
  });
});

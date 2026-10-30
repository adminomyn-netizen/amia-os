import { describe, expect, it } from "vitest";
import { chiaDoanhThuNguoiHuong } from "@/lib/ban-hang";

const rong = { phuc_vu: [], tu_van: [], ban: [] };
describe("chia doanh thu cho người hưởng ở Thu ngân", () => {
  it("chia theo phần trăm từng vai, gộp một người nhiều dòng", () => {
    const kq = chiaDoanhThuNguoiHuong([
      { thanh: 1_000_000, nv: { ...rong, phuc_vu: [{ id: "a", ti: 60 }, { id: "b", ti: 40 }], ban: [{ id: "c", ti: 100 }] } },
      { thanh: 500_000, nv: { ...rong, phuc_vu: [{ id: "a", ti: 100 }] } },
    ]);
    expect(kq.find((x) => x.id === "a")).toMatchObject({ tong: 1_100_000, vai: { phuc_vu: 1_100_000, ban: 0 } });
    expect(kq.find((x) => x.id === "b")?.tong).toBe(400_000);
    expect(kq.find((x) => x.id === "c")?.vai.ban).toBe(1_000_000);
    expect(kq[0].id).toBe("a");
  });
  it("dòng không gán ai thì không ra dòng nào; thành tiền âm tính là 0", () => {
    expect(chiaDoanhThuNguoiHuong([{ thanh: 100, nv: rong }])).toEqual([]);
    expect(chiaDoanhThuNguoiHuong([{ thanh: -50, nv: { ...rong, ban: [{ id: "x", ti: 100 }] } }])[0].tong).toBe(0);
  });
});

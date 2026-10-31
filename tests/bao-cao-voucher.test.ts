import { describe, expect, it } from "vitest";
import { tongHopVoucher, type LuotVoucher, type ThongTinVoucher } from "@/lib/bao-cao-voucher";

const v: ThongTinVoucher[] = [
  { id: "A", ten: "Khai trương", tuNgay: "2026-10-01", denNgay: "2026-10-31", soLuong: 10, biKhoa: false },
  { id: "B", ten: "Không ai dùng", tuNgay: "2026-10-01", denNgay: "2026-10-31", soLuong: 5, biKhoa: false },
];
const don = new Map([
  ["h1", { id: "h1", tongHang: 1_000_000, tongPhaiThu: 900_000 }],
  ["h2", { id: "h2", tongHang: 2_000_000, tongPhaiThu: 1_800_000 }],
  ["h3", { id: "h3", tongHang: 500_000, tongPhaiThu: 450_000 }],
]);
const l = (h: string, loai: "dung" | "hoan", tien: number, khach: string | null): LuotVoucher => ({ voucher_id: "A", hoa_don_id: h, loai, so_tien: tien, khach_id: khach });

describe("tổng hợp hiệu quả voucher", () => {
  const luot = [l("h1", "dung", 100_000, "k1"), l("h2", "dung", 200_000, "k1"), l("h3", "dung", 50_000, "k2"), l("h3", "hoan", 50_000, "k2")];
  const r = tongHopVoucher(luot, don, v, luot);
  const a = r.find((x) => x.id === "A")!;
  it("đơn đã hoàn (huỷ) không tính", () => {
    expect(a.soLuot).toBe(2);
    expect(a.soHoan).toBe(1);
    expect(a.tienGiam).toBe(300_000);
  });
  it("đếm khách khác nhau, doanh thu và tỉ lệ giảm", () => {
    expect(a.soKhach).toBe(1);
    expect(a.doanhThu).toBe(2_700_000);
    expect(a.tiLeGiam).toBeCloseTo(10, 5);
  });
  it("tỉ lệ đã dùng theo số phát hành, lượt hoàn trừ ra", () => {
    expect(a.daDungTatCa).toBe(2);
    expect(a.tiLeDung).toBeCloseTo(20, 5);
  });
  it("voucher chưa ai dùng vẫn hiện với số 0, đứng sau voucher có lượt", () => {
    expect(r[0].id).toBe("A");
    const b = r.find((x) => x.id === "B")!;
    expect([b.soLuot, b.tienGiam, b.tiLeGiam, b.tiLeDung]).toEqual([0, 0, 0, 0]);
  });
});

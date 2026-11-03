import { describe, expect, it } from "vitest";
import { chiaNoTheoDong, giamTheoPct, kiemGioiThieuDong, kiemNoDong, lamSachDongNhap, nhomNguonGt } from "@/lib/ban-hang";

const ID = "11111111-1111-4111-8111-111111111111";
describe("Thu ngân đợt 3: giảm % dòng, chia nợ theo dòng, người giới thiệu theo dòng", () => {
  it("giảm % theo dòng làm tròn đồng, kẹp 0..100%", () => {
    expect(giamTheoPct(333_333, 1, 5)).toBe(16_667);
    expect(giamTheoPct(100_000, 3, 15)).toBe(45_000);
    expect(giamTheoPct(100_000, 1, 150)).toBe(100_000);
    expect(giamTheoPct(100_000, 1, -5)).toBe(0);
  });
  it("chia nợ theo tỉ lệ thành tiền, phần lẻ dồn vào dòng cuối có tiền, cộng đúng số nợ", () => {
    const ra = chiaNoTheoDong([1_000_000, 2_000_000, 0], 1_000_001);
    expect(ra).toEqual([333_333, 666_668, 0]);
    expect(ra.reduce((a, b) => a + b, 0)).toBe(1_000_001);
    expect(chiaNoTheoDong([0, 0], 500)).toEqual([0, 500]);
    expect(chiaNoTheoDong([100], 0)).toEqual([0]);
  });
  it("máy chủ kiểm nợ theo dòng", () => {
    expect(kiemNoDong([undefined, undefined], 1000)).toEqual({ ok: true, no: null });
    expect(kiemNoDong([400, 600], 1000)).toEqual({ ok: true, no: [400, 600] });
    expect(kiemNoDong([400, 500], 1000).ok).toBe(false);
    expect(kiemNoDong([-1, 1001], 1000).ok).toBe(false);
    expect(kiemNoDong([10], 0).ok).toBe(false);
  });
  it("máy chủ kiểm người giới thiệu dòng", () => {
    const co = (id: string) => id === ID;
    expect(kiemGioiThieuDong(null, co)).toEqual({ ok: true, gt: null });
    expect(kiemGioiThieuDong({ id: ID, kieu: "phan_tram", giaTri: 10 }, co)).toEqual({ ok: true, gt: { id: ID, kieu: "phan_tram", giaTri: 10 } });
    expect(kiemGioiThieuDong({ id: ID, kieu: "phan_tram", giaTri: 120 }, co).ok).toBe(false);
    expect(kiemGioiThieuDong({ id: ID, kieu: "tien", giaTri: 1.5 }, co).ok).toBe(false);
    expect(kiemGioiThieuDong({ id: "khac", kieu: "tien", giaTri: 1000 }, co).ok).toBe(false);
  });
  it("nhóm nguồn giới thiệu như SalonHero", () => {
    expect(nhomNguonGt("khach_cu", "CUSTOMER")).toBe("khach");
    expect(nhomNguonGt("khac", "STAFF")).toBe("nhan_vien");
    expect(nhomNguonGt("khac", "OTHER")).toBe("khac");
  });
  it("đơn nháp giữ ghi chú dòng và người giới thiệu", () => {
    const [d] = lamSachDongNhap([{ loai: "dich_vu", ref: ID, sl: 1, giam: 0, nv: {}, ghiChu: "ghi chú", gt: { id: ID, kieu: "tien", giaTri: 20000 } }]);
    expect(d.ghiChu).toBe("ghi chú");
    expect(d.gt).toEqual({ id: ID, kieu: "tien", giaTri: 20000 });
  });
});

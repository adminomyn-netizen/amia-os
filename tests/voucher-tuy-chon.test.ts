import { describe, expect, it } from "vitest";
import { giamTheoDong, type VoucherTim } from "@/lib/voucher";
import { tinhGiamVoucher } from "@/lib/ban-hang";

const dong = [
  { loai: "dich_vu", ref: "dv-a", thanh: 1_000_000 }, { loai: "dich_vu", ref: "dv-b", thanh: 500_000 }, { loai: "san_pham", ref: "sp-1", thanh: 300_000 }, { loai: "goi_the", ref: "g-1", thanh: 2_000_000 },
];
describe("voucher giới hạn Tùy chọn", () => {
  it("chỉ tính trên đúng các dịch vụ được chọn", () => {
    const v = { loai_giam: "phan_tram" as const, gia_tri: 10, giam_toi_da: null, gioi_han: "tuy_chon" as const, dich_vu_ids: ["dv-a"] };
    expect(tinhGiamVoucher(v, dong)).toBe(100_000);
    expect(tinhGiamVoucher({ ...v, dich_vu_ids: ["dv-a", "dv-b"] }, dong)).toBe(150_000);
    expect(tinhGiamVoucher({ ...v, dich_vu_ids: ["dv-khac"] }, dong)).toBe(0);
  });
  it("giảm tiền không vượt phần tiền hàng được chọn; dòng sản phẩm/thẻ không bao giờ tính", () => {
    const v = { loai_giam: "tien" as const, gia_tri: 800_000, giam_toi_da: null, gioi_han: "tuy_chon" as const, dich_vu_ids: ["dv-b", "sp-1", "g-1"] };
    expect(tinhGiamVoucher(v, dong)).toBe(500_000);
  });
  it("giới hạn khác vẫn chạy như cũ (không cần ref)", () => {
    expect(tinhGiamVoucher({ loai_giam: "phan_tram", gia_tri: 10, giam_toi_da: 50_000, gioi_han: "dich_vu", dich_vu_ids: null }, dong)).toBe(50_000);
    expect(tinhGiamVoucher({ loai_giam: "tien", gia_tri: 100, giam_toi_da: null, gioi_han: "tong_don" }, [{ loai: "san_pham", thanh: 50 }])).toBe(50);
  });
  it("giamTheoDong báo lỗi khi không có dịch vụ nào được chọn trong đơn", () => {
    const v = { id: "v", maId: "m", ma: "KM", ten: "t", donToiThieu: 0, tuNgay: "2026-01-01", denNgay: "2026-12-31", tuDong: false, giamGia: "10%", apDung: "",
      def: { loai_giam: "phan_tram", gia_tri: 10, giam_toi_da: null, gioi_han: "tuy_chon", dich_vu_ids: ["dv-khac"] } } as VoucherTim;
    const kq = giamTheoDong(v, dong);
    expect(kq.ok).toBe(false);
  });
});

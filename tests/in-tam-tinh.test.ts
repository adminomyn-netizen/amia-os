import { describe, expect, it } from "vitest";
import { nhanVienDongTamTinh, thanhToanTamTinh } from "@/lib/in-hoa-don";
import { nhanKhoanThu } from "@/lib/ban-hang";

const nhan = { thanhToan: "Thanh toán", hinhThuc: (pt: string, vi?: string) => nhanKhoanThu(pt, vi) };

describe("hoá đơn tạm tính: hình thức thanh toán đang nhập trong giỏ", () => {
  it("in từng hình thức > 0, thẻ tiền vào tổng trừ thẻ + số dư sau trừ", () => {
    const kq = thanhToanTamTinh([
      { phuong_thuc: "tien_mat", so_tien: 500_000 },
      { phuong_thuc: "quet_the", so_tien: 0 },
      { phuong_thuc: "chuyen_khoan", so_tien: 1_000_000, ngan_hang: "Vietcombank" },
      { phuong_thuc: "the_tien", so_tien: 300_000, the_id: "t1" },
    ], nhan, [{ id: "t1", ten: "Thẻ 5 triệu", ma: "M1", soDu: 2_000_000 }]);
    expect(kq.thanhToan).toEqual([
      { nhan: "Thanh toán - Tiền mặt", soTien: 500_000 },
      { nhan: "Thanh toán - Chuyển khoản (Vietcombank)", soTien: 1_000_000 },
    ]);
    expect(kq.tienTruThe).toBe(300_000);
    expect(kq.theSauTt[0]).toContain("Thẻ 5 triệu (#M1): số dư");
    expect(kq.theSauTt[0]).toContain("1.700.000");
  });
  it("chưa nhập khoản nào: in sẵn Tiền mặt / Quẹt thẻ / Chuyển khoản để trống", () => {
    const kq = thanhToanTamTinh([{ phuong_thuc: "tien_mat", so_tien: 0 }], nhan);
    expect(kq.thanhToan.map((x) => x.nhan)).toEqual(["Thanh toán - Tiền mặt", "Thanh toán - Quẹt thẻ", "Thanh toán - Chuyển khoản"]);
    expect(kq.thanhToan.every((x) => x.soTien === null)).toBe(true);
    expect(kq.tienTruThe).toBe(0);
  });
  it("chỉ trừ thẻ: không in 3 dòng trống", () => {
    expect(thanhToanTamTinh([{ phuong_thuc: "the_tien", so_tien: 100, the_id: "x" }], nhan).thanhToan).toEqual([]);
  });
  it("nhân viên từng dòng: phục vụ → bán → tư vấn, không lặp", () => {
    const ten = (id: string) => ({ a: "Lan", b: "Hoa", c: "Mai" } as Record<string, string>)[id];
    expect(nhanVienDongTamTinh({ tu_van: [{ id: "c" }], phuc_vu: [{ id: "a" }], ban: [{ id: "b" }, { id: "a" }] }, ten)).toEqual(["Lan", "Hoa", "Mai"]);
  });
});

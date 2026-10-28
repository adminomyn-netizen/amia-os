import { describe, expect, it } from "vitest";
import { vietBaoCaoSang, type BaoCaoSang } from "@/lib/bao-cao-sang";

const mau: BaoCaoSang = {
  ngay: "2026-10-29", chi_nhanh_id: null,
  hom_qua: { ngay: "2026-10-28", so_hoa_don: 12, lich_hoan_thanh: 20, lich_huy: 3, lich_khong_den: 1, khach_moi: 5 },
  hom_nay: { ngay: "2026-10-29", so_lich: 25, sinh_nhat: 3, sinh_nhat_ten: ["An", "Bình"], nhac_den_han: 4, nhac_qua_han: 2, the_sap_het: 10, tai_kham: 5 },
};
describe("vietBaoCaoSang", () => {
  it("đủ hôm qua và hôm nay, không có tiền hay số điện thoại", () => {
    const t = vietBaoCaoSang(mau, null);
    expect(t).toContain("BÁO CÁO SÁNG 29/10/2026 · Tất cả chi nhánh");
    expect(t).toContain("Hôm qua (28/10/2026): 12 hoá đơn · 20 lịch hoàn thành · 3 lịch huỷ · 1 khách không đến · 5 khách mới.");
    expect(t).toContain("3 khách sinh nhật (An, Bình, …)");
    expect(t).toContain("(còn 2 nhắc quá hạn chưa xử lý)");
    expect(t).not.toMatch(/đ\b|\d{9,}/);
  });
  it("không sinh nhật và không nhắc quá hạn thì viết gọn", () => {
    const t = vietBaoCaoSang({ ...mau, hom_nay: { ...mau.hom_nay, sinh_nhat: 0, sinh_nhat_ten: [], nhac_qua_han: 0 } }, "Vinh");
    expect(t).toContain("· Vinh");
    expect(t).toContain("không có khách sinh nhật");
    expect(t).not.toContain("quá hạn");
  });
});

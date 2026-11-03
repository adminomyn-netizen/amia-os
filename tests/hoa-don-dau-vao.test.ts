import { describe, expect, it } from "vitest";
import { kiemTraTepHddv, locHddv, mstHopLe, nhanThueSuat, tongHddv } from "@/lib/hoa-don-dau-vao";

const dong = (o: Partial<Parameters<typeof locHddv>[0][number]> & { trang_thai?: string; thue_gtgt?: number; tong_tien?: number | null }) => ({
  ngay_hd: "2026-11-02", tao_luc: "2026-11-02T03:00:00Z", chi_nhanh_id: "vinh", ma_so_thue: "0101234567", ten_ncc: "Công ty Dược Phẩm Á Châu", so_hd: "123", ky_hieu: "1C26TAA", ma_tra_cuu: "ABC",
  trang_thai: "da_nhan", thue_gtgt: 80000, tong_tien: 1080000, ...o,
});

describe("hoá đơn đầu vào như SalonHero", () => {
  it("lọc chi nhánh, khoảng ngày hoá đơn, tìm tên công ty không dấu / MST", () => {
    const ds = [dong({}), dong({ chi_nhanh_id: "dalat" }), dong({ ngay_hd: "2026-10-01" }), dong({ ngay_hd: null, tao_luc: "2026-11-01T18:00:00Z" })];
    expect(locHddv(ds, { cn: "vinh", tu: "2026-11-01", den: "2026-11-03" })).toHaveLength(2);
    expect(locHddv(ds, { tu: "2026-11-01", den: "2026-11-03", q: "duoc pham" })).toHaveLength(3);
    expect(locHddv(ds, { tu: "2026-11-01", den: "2026-11-03", q: "0101234" })).toHaveLength(3);
    expect(locHddv(ds, { tu: "2026-11-01", den: "2026-11-03", q: "không có" })).toHaveLength(0);
  });
  it("2 ô tổng bỏ hoá đơn huỷ và khoản chờ hoá đơn", () => {
    const t = tongHddv([dong({}), dong({ trang_thai: "huy" }), dong({ trang_thai: "cho_hoa_don", thue_gtgt: 0, tong_tien: 500000 }), dong({ trang_thai: "da_doi_chieu", thue_gtgt: 20000, tong_tien: 220000 })]);
    expect(t).toEqual({ vat: 100000, tong: 1300000 });
  });
  it("chỉ nhận PDF, XML, Zip tối đa 10 MB; MST 10 hoặc 13 ký tự", () => {
    expect(kiemTraTepHddv("hd.PDF", 1000)).toBeNull();
    expect(kiemTraTepHddv("hd.zip", 11 * 1024 * 1024)).toMatch(/10 MB/);
    expect(kiemTraTepHddv("hd.exe", 10)).toMatch(/PDF/);
    expect(mstHopLe("0101234567")).toBe(true); expect(mstHopLe("0101234567-001")).toBe(true); expect(mstHopLe("12345")).toBe(false);
    expect(nhanThueSuat("8")).toBe("8%"); expect(nhanThueSuat("KCT")).toBe("KCT");
  });
});

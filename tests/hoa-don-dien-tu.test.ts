import { describe, expect, it } from "vitest";
import { canXuatHddt, docLocHddt, hienKhoa, kiemGhiHddt, kiemKetNoi, ngayHopLe } from "../src/lib/hoa-don-dien-tu";

const hd = (o: Partial<Parameters<typeof canXuatHddt>[0]> = {}) => ({ trang_thai: "hoan_thanh", vat_hd_luc: null, vat_hd_so: null, vat_pct: 0, vat_tien: 0, la_so_du_dau: false, ...o });

describe("hoá đơn cần xuất hoá đơn điện tử", () => {
  it("cần xuất khi có VAT trên đơn hoặc khách có mã số thuế", () => {
    expect(canXuatHddt(hd({ vat_pct: 10 }), false)).toBe(true);
    expect(canXuatHddt(hd({ vat_tien: "50000" }), false)).toBe(true);
    expect(canXuatHddt(hd(), true)).toBe(true);
  });
  it("không cần khi không có VAT và khách không có mã số thuế", () => {
    expect(canXuatHddt(hd(), false)).toBe(false);
    expect(canXuatHddt(hd({ vat_pct: null, vat_tien: null }), false)).toBe(false);
  });
  it("không cần khi nháp, đã huỷ, số dư đầu kỳ, hoặc đã có số hoá đơn", () => {
    expect(canXuatHddt(hd({ trang_thai: "nhap", vat_pct: 10 }), true)).toBe(false);
    expect(canXuatHddt(hd({ trang_thai: "huy", vat_pct: 10 }), true)).toBe(false);
    expect(canXuatHddt(hd({ la_so_du_dau: true, vat_pct: 10 }), true)).toBe(false);
    expect(canXuatHddt(hd({ vat_hd_luc: "2026-10-30T01:00:00Z", vat_pct: 10 }), true)).toBe(false);
    expect(canXuatHddt(hd({ vat_hd_so: "0000123", vat_pct: 10 }), true)).toBe(false);
  });
});

describe("kiểm dữ liệu ghi số hoá đơn điện tử", () => {
  const ok = { so: " 0000123 ", ngay: "2026-10-29", kyHieu: "1C26TAA", mauSo: "1", traCuu: "" };
  it("làm sạch và nhận dữ liệu đúng", () => {
    const r = kiemGhiHddt(ok, "2026-10-30");
    expect("ok" in r && r.ok).toEqual({ so: "0000123", ngay: "2026-10-29", kyHieu: "1C26TAA", mauSo: "1", traCuu: null });
  });
  it("chặn số rỗng, ngày sai hoặc ở tương lai, chuỗi quá dài", () => {
    expect(kiemGhiHddt({ ...ok, so: "  " }, "2026-10-30")).toEqual({ loi: "Nhập số hoá đơn." });
    expect(kiemGhiHddt({ ...ok, ngay: "2026-02-30" }, "2026-10-30")).toHaveProperty("loi");
    expect(kiemGhiHddt({ ...ok, ngay: "2026-10-31" }, "2026-10-30")).toEqual({ loi: "Ngày xuất không được ở tương lai." });
    expect(kiemGhiHddt({ ...ok, so: "1".repeat(31) }, "2026-10-30")).toHaveProperty("loi");
    expect(kiemGhiHddt({ ...ok, kyHieu: "K".repeat(21) }, "2026-10-30")).toHaveProperty("loi");
  });
  it("đường dẫn tra cứu phải là https, mã tra cứu thường thì nhận", () => {
    expect(kiemGhiHddt({ ...ok, traCuu: "http://a.vn/x" }, "2026-10-30")).toHaveProperty("loi");
    expect(kiemGhiHddt({ ...ok, traCuu: "javascript:alert(1)" }, "2026-10-30")).toHaveProperty("ok");
    expect(kiemGhiHddt({ ...ok, traCuu: "https://tracuu.vn/?m=ABC" }, "2026-10-30")).toHaveProperty("ok");
    expect(kiemGhiHddt({ ...ok, traCuu: "ABCD1234XYZ" }, "2026-10-30")).toHaveProperty("ok");
  });
});

describe("kiểm thông tin kết nối", () => {
  const ok = { nhaCungCap: "misa", maSoThue: "0123456789", tenDangNhap: "ketoan", mauSo: "1", kyHieu: "1C26TAA", diaChi: "" };
  it("nhận dữ liệu đúng", () => {
    const r = kiemKetNoi(ok);
    expect("ok" in r && r.ok.nha_cung_cap).toBe("misa");
    expect(kiemKetNoi({ ...ok, maSoThue: "0123456789-001" })).toHaveProperty("ok");
  });
  it("chặn nhà cung cấp lạ, mã số thuế sai, địa chỉ không https", () => {
    expect(kiemKetNoi({ ...ok, nhaCungCap: "abc" })).toHaveProperty("loi");
    expect(kiemKetNoi({ ...ok, maSoThue: "12345" })).toHaveProperty("loi");
    expect(kiemKetNoi({ ...ok, diaChi: "http://may-chu.vn" })).toHaveProperty("loi");
    expect(kiemKetNoi({ ...ok, diaChi: "https://may-chu.vn/api" })).toHaveProperty("ok");
  });
});

describe("bộ lọc và hiển thị", () => {
  it("ngày hợp lệ, mặc định từ đầu tháng", () => {
    expect(ngayHopLe("2026-02-29")).toBe(false);
    expect(ngayHopLe("2024-02-29")).toBe(true);
    expect(docLocHddt({ tab: "da", tu: "x" }, "2026-10-30")).toEqual({ tab: "da", tu: "2026-10-01", den: "2026-10-30", q: "" });
    expect(docLocHddt({ tab: "lạ" }, "2026-10-30").tab).toBe("can");
  });
  it("chỉ hiện 4 ký tự cuối của khoá", () => {
    expect(hienKhoa("a1b2")).toBe("đã lưu, kết thúc …a1b2");
    expect(hienKhoa(null)).toBe("chưa có");
  });
});

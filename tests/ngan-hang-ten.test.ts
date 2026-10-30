import { describe, expect, it } from "vitest";
import { chuanTenNganHang, coNganHang } from "../src/lib/ngan-hang-ten";
import { DANH_SACH_NGAN_HANG } from "../src/lib/ngan-hang";
import { chuanTenNganHang as chuanScript, chuanBiNganHangSh, nganHangKhoan } from "../scripts/chuyen-salonhero/lib.mjs";

describe("chuẩn hoá tên ngân hàng", () => {
  it("bỏ chữ Ngân hàng, về dạng ngắn", () => {
    expect(chuanTenNganHang("Ngân hàng Vietcombank")).toBe("Vietcombank");
    expect(chuanTenNganHang("Ngân hàng Techcombank")).toBe("Techcombank");
    expect(chuanTenNganHang("Ngân hàng Sacombank")).toBe("Sacombank");
    expect(chuanTenNganHang("Ngân hàng TPBank")).toBe("TPBank");
    expect(chuanTenNganHang("Ngân hàng VietinBank")).toBe("VietinBank");
    expect(chuanTenNganHang("Ngân hàng OCB")).toBe("OCB");
  });
  it("hiểu viết tắt, hoa thường, tên đầy đủ", () => {
    expect(chuanTenNganHang("VCB")).toBe("Vietcombank");
    expect(chuanTenNganHang("  techcombank  ")).toBe("Techcombank");
    expect(chuanTenNganHang("Ngân hàng TMCP Ngoại thương Việt Nam")).toBe("Vietcombank");
    expect(chuanTenNganHang("Ngân hàng Đông Á")).toBe("DongA Bank");
    expect(chuanTenNganHang("Ngân hàng Petrolimex (PGBank)")).toBe("PGBank");
  });
  it("rỗng thì null; tên lạ giữ nguyên chữ", () => {
    expect(chuanTenNganHang("")).toBeNull();
    expect(chuanTenNganHang(null)).toBeNull();
    expect(chuanTenNganHang("   ")).toBeNull();
    expect(chuanTenNganHang("Ngân hàng Lạ Lùng")).toBe("Lạ Lùng");
  });
  it("mọi tên trong danh sách SalonHero đều có tên ngắn không còn chữ Ngân hàng, và bản script cho kết quả giống hệt", () => {
    for (const t of DANH_SACH_NGAN_HANG) {
      const n = chuanTenNganHang(t);
      expect(n, t).toBeTruthy();
      expect(n!.toLowerCase().startsWith("ngân hàng"), t).toBe(false);
      expect(chuanScript(t), t).toBe(n);
    }
    for (const t of ["VCB", "tcb", "", "Ngân hàng Lạ Lùng", "Sài Gòn Thương Tín"]) expect(chuanScript(t)).toBe(chuanTenNganHang(t));
  });
  it("chỉ chuyển khoản và quẹt thẻ có ngân hàng", () => {
    expect(coNganHang("chuyen_khoan")).toBe(true);
    expect(coNganHang("quet_the")).toBe(true);
    expect(coNganHang("tien_mat")).toBe(false);
    expect(coNganHang("the_tien")).toBe(false);
  });
});

const ev = (payment_type: string, amount_paid: number, bank_name = "") => ({ payment_type, amount_paid, bank_name, is_deleted: 0 });
describe("bù ngân hàng cho dữ liệu SalonHero (script)", () => {
  it("lấy ngân hàng ở chính khoản thu, không lấy ngân hàng chung của hoá đơn khi hai bên khác nhau", () => {
    const ch = chuanBiNganHangSh({ l: { payment_type: "TRANSFER", bank_name: "Ngân hàng Techcombank" }, d: { paymentHistory: [ev("TRANSFER", 1000, "Ngân hàng Vietcombank"), ev("TRANSFER", 500, "Ngân hàng Techcombank")] } });
    expect(nganHangKhoan(ch, "chuyen_khoan", 1000)).toEqual({ ten: "Vietcombank", nguon: "su_kien" });
    expect(nganHangKhoan(ch, "chuyen_khoan", 500)).toEqual({ ten: "Techcombank", nguon: "su_kien" });
  });
  it("khoản bù không có sự kiện thì lấy ngân hàng chung của hoá đơn", () => {
    const ch = chuanBiNganHangSh({ l: { payment_type: "CARD", bank_name: "Ngân hàng Sacombank" }, d: { paymentHistory: [] } });
    expect(nganHangKhoan(ch, "quet_the", 700)).toEqual({ ten: "Sacombank", nguon: "hoa_don" });
  });
  it("tiền mặt và trừ thẻ tiền không có ngân hàng", () => {
    const ch = chuanBiNganHangSh({ l: { payment_type: "TRANSFER", bank_name: "Ngân hàng BIDV" }, d: { paymentHistory: [] } });
    expect(nganHangKhoan(ch, "tien_mat", 100).ten).toBeNull();
    expect(nganHangKhoan(ch, "the_tien", 100).ten).toBeNull();
  });
  it("hoá đơn nhiều cách trả: tách được theo từng khoản; không có ngân hàng thì null", () => {
    const multi = JSON.stringify([{ payment_type: "CASH", amount_paid: 18, bank_name: "" }, { payment_type: "TRANSFER", amount_paid: 50, bank_name: "Ngân hàng Vietcombank" }]);
    const a = chuanBiNganHangSh({ l: { payment_type: "MULTIPLE", amount_paid_multi: multi }, d: { paymentHistory: [ev("CASH", 18), ev("TRANSFER", 50)] } });
    expect(nganHangKhoan(a, "chuyen_khoan", 50)).toEqual({ ten: "Vietcombank", nguon: "multi" });
    const b = chuanBiNganHangSh({ l: { payment_type: "MULTIPLE" }, d: { paymentHistory: [ev("CARD", 50)] } });
    expect(nganHangKhoan(b, "quet_the", 50)).toEqual({ ten: null, nguon: "khong_ro" });
  });
  it("cùng phương thức + số tiền nhưng hai ngân hàng khác nhau thì không đoán", () => {
    const ch = chuanBiNganHangSh({ l: { payment_type: "MULTIPLE" }, d: { paymentHistory: [ev("TRANSFER", 100, "Ngân hàng BIDV"), ev("TRANSFER", 100, "Ngân hàng Sacombank")] } });
    expect(nganHangKhoan(ch, "chuyen_khoan", 100)).toEqual({ ten: null, nguon: "mo_ho" });
  });
  it("sự kiện đã xoá không tính", () => {
    const ch = chuanBiNganHangSh({ l: { payment_type: "MULTIPLE" }, d: { paymentHistory: [{ ...ev("TRANSFER", 100, "Ngân hàng BIDV"), is_deleted: 1 }] } });
    expect(nganHangKhoan(ch, "chuyen_khoan", 100).ten).toBeNull();
  });
});

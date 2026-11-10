import { describe, expect, it } from "vitest";
import { MAC_DINH_IN, chuanHoaIn, docIn, khoaIn, loiIn, TAT_CA } from "@/lib/thiet-lap-in";
import { binNganHang, crc16, taoNoiDungVietQr } from "@/lib/vietqr";

describe("thiết lập in", () => {
  it("chưa có cấu hình thì dùng mặc định theo loại", () => {
    expect(docIn("hoa_don", null, "cn1")).toEqual({ cauHinh: MAC_DINH_IN.hoa_don, nguon: "mac_dinh" });
    expect(MAC_DINH_IN.hoa_don).toMatchObject({ khoGiay: "A5", logo: true, gioiTinhNamSinh: false, diemTichLuy: false, chiInHoanThanh: false });
    expect(MAC_DINH_IN.lich_hen).toMatchObject({ khoGiay: "80mm", thongTinCuaHang: false });
  });
  it("chi nhánh có riêng thì thắng cấu hình chung, rồi tới mặc định", () => {
    const rows = [{ khoa: khoaIn("hoa_don", TAT_CA), gia_tri: JSON.stringify({ khoGiay: "A4" }) }, { khoa: khoaIn("hoa_don", "cn1"), gia_tri: JSON.stringify({ khoGiay: "80mm", banSao: 2 }) }];
    expect(docIn("hoa_don", rows, "cn1")).toMatchObject({ nguon: "chi_nhanh", cauHinh: { khoGiay: "80mm", banSao: 2 } });
    expect(docIn("hoa_don", rows, "cn2")).toMatchObject({ nguon: "chung", cauHinh: { khoGiay: "A4" } });
    expect(docIn("lich_hen", rows, "cn1").nguon).toBe("mac_dinh");
  });
  it("JSON hỏng hoặc giá trị lạ không làm hỏng bản in", () => {
    expect(docIn("hoa_don", [{ khoa: khoaIn("hoa_don", TAT_CA), gia_tri: "{hỏng" }], "x").nguon).toBe("mac_dinh");
    expect(chuanHoaIn("hoa_don", { khoGiay: "A0", banSao: 9, logo: "có", noiDungCuoi: 5 })).toEqual(MAC_DINH_IN.hoa_don);
  });
  it("kiểm tra đầu vào", () => {
    const c = MAC_DINH_IN.hoa_don;
    expect(loiIn(c)).toBe("");
    expect(loiIn({ ...c, coLogo: 10 })).toMatch(/logo/);
    expect(loiIn({ ...c, qr: true })).toMatch(/QRCode/);
    expect(loiIn({ ...c, qr: true, qrNganHang: "Vietcombank", qrSoTk: "123" })).toMatch(/chữ số/);
    expect(loiIn({ ...c, qr: true, qrNganHang: "Vietcombank", qrSoTk: "0123456789", qrGhiChu: "a-b" })).toMatch(/ký tự đặc biệt/);
    expect(loiIn({ ...c, qr: true, qrNganHang: "Vietcombank", qrSoTk: "0123456789", qrGhiChu: "Thanh toan HD" })).toBe("");
    expect(loiIn({ ...c, qr: true, qrNganHang: "Vietcombank", qrSoTk: "0123456789", qrGhiChu: "TT <ORDER_CODE> <CUSTOMER_NAME>" })).toBe("");
    expect(loiIn({ ...c, qr: true, qrNoiDung: "https://example.vn" })).toBe("");
  });
});

describe("VietQR", () => {
  it("CRC-16/CCITT-FALSE đúng vector chuẩn", () => { expect(crc16("123456789")).toBe("29B1"); });
  it("nội dung mã: đúng cấu trúc, CRC khớp, có/không số tiền", () => {
    const bin = binNganHang("Vietcombank")!;
    const tinh = taoNoiDungVietQr({ bin, soTk: "0123456789", soTien: 500000, ghiChu: "HD001" });
    expect(tinh.startsWith("000201010212")).toBe(true);
    expect(tinh).toContain("0010A00000072701240006970436011001234567890208QRIBFTTA");
    expect(tinh).toContain("5406500000"); expect(tinh).toContain("5303704"); expect(tinh).toContain("5802VN"); expect(tinh).toContain("0805HD001");
    expect(tinh.slice(-8, -4)).toBe("6304"); expect(tinh.slice(-4)).toBe(crc16(tinh.slice(0, -4)));
    expect(taoNoiDungVietQr({ bin, soTk: "0123456789" }).startsWith("000201010211")).toBe(true);
    expect(binNganHang("NganHangLa")).toBeNull();
  });
});

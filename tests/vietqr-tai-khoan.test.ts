import { describe, expect, it } from "vitest";
import { noiDungCkDon, qrCuaKhoanThu, type TaiKhoanNhan } from "@/lib/ban-hang";
import { DANH_SACH_NGAN_HANG } from "@/lib/ngan-hang";
import { NGAN_HANG_QR, binTheoTenNganHang, crc16, docTlv, noiDungChuyenKhoan, vietQrTaiKhoan } from "@/lib/vietqr";

// Mã QR của tài khoản nhận tiền (chị Lâm 10/11/2026: "bê cả mã QR qua đây"). Số tài khoản trong test là số GIẢ.
describe("QR tài khoản nhận tiền", () => {
  it("5 ngân hàng AMIA đang dùng ở SalonHero đều ra BIN Napas (tên như SalonHero ghi)", () => {
    expect(binTheoTenNganHang("Ngân hàng Sacombank")).toBe("970403");
    expect(binTheoTenNganHang("Ngân hàng Vietcombank")).toBe("970436");
    expect(binTheoTenNganHang("Ngân hàng TPBank")).toBe("970423");
    expect(binTheoTenNganHang("Ngân hàng Techcombank")).toBe("970407");
    expect(binTheoTenNganHang("Ngân hàng OCB")).toBe("970448");
    expect(binTheoTenNganHang("Ngân hàng LPBank")).toBe("970449");
    expect(binTheoTenNganHang("Ngân hàng Woori")).toBe("970457");
    expect(binTheoTenNganHang("Ngân hàng Deutsche Bank AG")).toBeNull(); // không có trong danh sách SalonHero: không dựng QR
    expect(binTheoTenNganHang("")).toBeNull();
  });

  it("nội dung chuyển khoản: bỏ dấu, bỏ ký tự đặc biệt, ≤ 25 ký tự", () => {
    expect(noiDungChuyenKhoan("HĐ-2611/0207 Phạm Thị Hiệp")).toBe("HD 2611 0207 Pham Thi Hie");
    expect(noiDungChuyenKhoan("  ")).toBe("");
    expect(noiDungChuyenKhoan(null)).toBe("");
  });

  it("giải mã ngược chuỗi: đúng BIN, số TK, số tiền, nội dung, CRC", () => {
    const s = vietQrTaiKhoan({ ngan_hang: "Ngân hàng Vietcombank", so_tai_khoan: "0123 456 789" }, 1_250_000.4, "HD26110207")!;
    const goc = docTlv(s);
    expect(goc["00"]).toBe("01");
    expect(goc["01"]).toBe("12"); // có số tiền = mã động
    const tk = docTlv(goc["38"]);
    expect(tk["00"]).toBe("A000000727");
    expect(tk["02"]).toBe("QRIBFTTA");
    const nh = docTlv(tk["01"]);
    expect(nh).toEqual({ "00": "970436", "01": "0123456789" });
    expect(goc["53"]).toBe("704");
    expect(goc["54"]).toBe("1250000");
    expect(goc["58"]).toBe("VN");
    expect(docTlv(goc["62"])["08"]).toBe("HD26110207");
    expect(goc["63"]).toBe(crc16(s.slice(0, -4)));
    expect(s.slice(-8, -4)).toBe("6304");
  });

  it("không số tiền = mã tĩnh (khách tự nhập tiền); thiếu số / ngân hàng lạ thì null", () => {
    const s = vietQrTaiKhoan({ ngan_hang: "Ngân hàng OCB", so_tai_khoan: "0001112223" })!;
    const goc = docTlv(s);
    expect(goc["01"]).toBe("11");
    expect(goc["54"]).toBeUndefined();
    expect(goc["62"]).toBeUndefined();
    expect(goc["63"]).toBe(crc16(s.slice(0, -4)));
    expect(vietQrTaiKhoan({ ngan_hang: "Ngân hàng OCB", so_tai_khoan: "" })).toBeNull();
    expect(vietQrTaiKhoan({ ngan_hang: "Ngân hàng Deutsche Bank AG", so_tai_khoan: "0001112223" })).toBeNull();
  });
});

describe("QR của đơn đang dựng (Thu ngân / màn hình khách / tạm tính)", () => {
  const tk: TaiKhoanNhan[] = [
    { id: "a", ten: "Ngân hàng Vietcombank", chu: "A", so: "0001112223", chiNhanhId: null, cx: true, qt: true, macDinh: true },
    { id: "b", ten: "Ngân hàng OCB", chu: "B", so: "0004445556", chiNhanhId: null, cx: true, qt: false, macDinh: false },
    { id: "c", ten: "Ngân hàng TPBank", chu: "C", chiNhanhId: null, cx: true, qt: false, macDinh: false },
  ];
  it("gom theo tài khoản, bỏ quẹt thẻ / tiền mặt / khoản 0đ / tài khoản thiếu số / Khác", () => {
    const qr = qrCuaKhoanThu([
      { phuong_thuc: "tien_mat", so_tien: 100 }, { phuong_thuc: "chuyen_khoan", so_tien: 300, tai_khoan_id: "a" }, { phuong_thuc: "quet_the", so_tien: 50, tai_khoan_id: "a" },
      { phuong_thuc: "chuyen_khoan", so_tien: 200, tai_khoan_id: "b" }, { phuong_thuc: "chuyen_khoan", so_tien: 100, tai_khoan_id: "a" },
      { phuong_thuc: "chuyen_khoan", so_tien: 0, tai_khoan_id: "b" }, { phuong_thuc: "chuyen_khoan", so_tien: 70, tai_khoan_id: "c" }, { phuong_thuc: "chuyen_khoan", so_tien: 90, ngan_hang: "Khác" },
    ], tk, "HD1");
    expect(qr.map((q) => [q.tkId, q.soTien, q.tk.so, q.noiDung])).toEqual([["a", 400, "0001112223", "HD1"], ["b", 200, "0004445556", "HD1"]]);
  });
  it("nội dung: mã hoá đơn, không thì AMIA + mã khách", () => {
    expect(noiDungCkDon("HD123", "KH1")).toBe("HD123");
    expect(noiDungCkDon("", "AVI26006375")).toBe("AMIA AVI26006375");
    expect(noiDungCkDon(null, null)).toBe("AMIA");
  });
});

describe("danh sách ngân hàng QR = ô chọn của SalonHero", () => {
  it("đủ 63 mục, mã SalonHero + tên không trùng, BIN 6 số", () => {
    expect(NGAN_HANG_QR).toHaveLength(63);
    expect(new Set(NGAN_HANG_QR.map((b) => b.sh)).size).toBe(63);
    expect(new Set(NGAN_HANG_QR.map((b) => b.ma)).size).toBe(63);
    for (const b of NGAN_HANG_QR) expect(b.bin).toMatch(/^\d{6}$/);
    expect(NGAN_HANG_QR.slice(0, 3).map((b) => b.sh)).toEqual(["ICB", "VCB", "BIDV"]);
    expect(NGAN_HANG_QR.at(-1)).toMatchObject({ sh: "CBB", bin: "970444" });
  });
  it("mọi ngân hàng của ô Tên ngân hàng (tài khoản) đều dựng được QR, trừ 3 ngân hàng nước ngoài SalonHero không có trong danh sách QR", () => {
    expect(DANH_SACH_NGAN_HANG.filter((t) => !binTheoTenNganHang(t))).toEqual(["Ngân hàng ANZ Bank", "Ngân hàng Deutsche Bank AG", "Commonwealth Bank"]);
  });
});

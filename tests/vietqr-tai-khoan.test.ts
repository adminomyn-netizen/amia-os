import { describe, expect, it } from "vitest";
import { qrThuNgan, type TaiKhoanNhan } from "@/lib/ban-hang";
import { DANH_SACH_NGAN_HANG } from "@/lib/ngan-hang";
import { NGAN_HANG_QR, binTheoTenNganHang, chuoiQrIn, crc16, docTlv, ghiChuCkIn, noiDungChuyenKhoan, soTienQrIn, vietQrTaiKhoan } from "@/lib/vietqr";

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
  // Như SalonHero: "Mời quét mã" chỉ khi payment_type = TRANSFER (một hình thức), số tiền = khoản chuyển nếu thu thiếu, không thì tổng; KHÔNG addInfo.
  it("một hình thức Chuyển khoản → một mã, không nội dung", () => {
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 300, tai_khoan_id: "a" }], tk, 1000)).toEqual({ tkId: "a", tk: { nganHang: "Ngân hàng Vietcombank", chu: "A", so: "0001112223" }, soTien: 300 });
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 0, tai_khoan_id: "a" }], tk, 1000)?.soTien).toBe(1000);
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 1500, tai_khoan_id: "a" }], tk, 1000)?.soTien).toBe(1000);
    expect(qrThuNgan([{ phuong_thuc: "tien_mat", so_tien: 0 }, { phuong_thuc: "chuyen_khoan", so_tien: 1000, tai_khoan_id: "b" }], tk, 1000)?.tkId).toBe("b");
    // trừ thẻ tiền không tính là hình thức; tổng = phải thu − trừ thẻ
    expect(qrThuNgan([{ phuong_thuc: "the_tien", so_tien: 400 }, { phuong_thuc: "chuyen_khoan", so_tien: 600, tai_khoan_id: "a" }], tk, 1000)?.soTien).toBe(600);
  });
  it("nhiều hình thức / nhiều khoản chuyển khoản / chưa chọn tài khoản → không có mã", () => {
    expect(qrThuNgan([{ phuong_thuc: "tien_mat", so_tien: 100 }, { phuong_thuc: "chuyen_khoan", so_tien: 900, tai_khoan_id: "a" }], tk, 1000)).toBeNull();
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 500, tai_khoan_id: "a" }, { phuong_thuc: "chuyen_khoan", so_tien: 500, tai_khoan_id: "b" }], tk, 1000)).toBeNull();
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 70, tai_khoan_id: "c" }], tk, 1000)).toBeNull();
    expect(qrThuNgan([{ phuong_thuc: "chuyen_khoan", so_tien: 90, ngan_hang: "Khác" }], tk, 1000)).toBeNull();
    expect(qrThuNgan([{ phuong_thuc: "quet_the", so_tien: 1000, tai_khoan_id: "a" }], tk, 1000)).toBeNull();
  });
});

// Tờ in (hoá đơn đã chốt + tạm tính) y như SalonHero directive "print": tài khoản của Thiết lập in, getQROrderBankTransferAmount, getQRCodeNoteContent.
describe("QR cuối tờ in", () => {
  it("số tiền: một hình thức → đã thu nếu thu thiếu, không thì tổng; nhiều hình thức → khoản chuyển khoản, không có thì 0", () => {
    expect(soTienQrIn([{ phuong_thuc: "tien_mat", so_tien: 1000 }], 1000)).toBe(1000);
    expect(soTienQrIn([{ phuong_thuc: "tien_mat", so_tien: 400 }], 1000)).toBe(400);
    expect(soTienQrIn([], 1000)).toBe(1000);
    expect(soTienQrIn([{ phuong_thuc: "tien_mat", so_tien: "300" }, { phuong_thuc: "chuyen_khoan", so_tien: "700" }], 1000)).toBe(700);
    expect(soTienQrIn([{ phuong_thuc: "tien_mat", so_tien: 300 }, { phuong_thuc: "quet_the", so_tien: 700 }], 1000)).toBe(0);
  });
  it("nội dung = Ghi chú chuyển khoản, thay <ORDER_CODE> / <CUSTOMER_NAME>, bỏ dấu; trống thì không có", () => {
    expect(ghiChuCkIn("TT <ORDER_CODE>", "HD2611-07", "Lê Thị Hoa")).toBe("TT HD2611 07");
    expect(ghiChuCkIn("<CUSTOMER_NAME>", "HD1", "Lê Thị Hoa")).toBe("Le Thi Hoa");
    expect(ghiChuCkIn("TT <ORDER_CODE>", "", null)).toBe("TT");
    expect(ghiChuCkIn("  ", "HD1", "A")).toBe("");
  });
  const cfg = { qr: true, qrNganHang: "Vietcombank", qrSoTk: "0001112223", qrGhiChu: "", qrNoiDung: "" };
  it("chỉ khi bật QRCode; ghi chú trống thì không có trường 62", () => {
    expect(chuoiQrIn({ ...cfg, qr: false }, { soTien: 1000 })).toBe("");
    const t = docTlv(chuoiQrIn(cfg, { soTien: 1000, maHd: "HD1" }));
    expect(t["54"]).toBe("1000");
    expect(t["62"]).toBeUndefined();
    const t2 = docTlv(chuoiQrIn({ ...cfg, qrGhiChu: "AMIA <ORDER_CODE>" }, { soTien: 0, maHd: "HD1" }));
    expect(t2["54"]).toBeUndefined();
    expect(docTlv(t2["62"])["08"]).toBe("AMIA HD1");
    expect(chuoiQrIn({ ...cfg, qrNoiDung: "https://example.vn" }, { soTien: 1 })).toBe("https://example.vn");
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

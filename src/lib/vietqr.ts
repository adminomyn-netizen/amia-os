// Mã VietQR (chuẩn EMVCo/Napas "chuyển nhanh 247 tới tài khoản") dựng ngay trên máy chủ, KHÔNG gọi dịch vụ ngoài.
// Chỉ liệt kê ngân hàng có mã BIN đã chắc chắn; ngân hàng khác thì người dùng nhập "nội dung QRCode" có sẵn. Sai mã BIN là tiền chuyển nhầm ngân hàng nên không đoán.
export const NGAN_HANG_QR: { ma: string; nhan: string; bin: string }[] = [
  { ma: "VietinBank", nhan: "VietinBank", bin: "970415" }, { ma: "Vietcombank", nhan: "Vietcombank", bin: "970436" }, { ma: "BIDV", nhan: "BIDV", bin: "970418" },
  { ma: "Agribank", nhan: "Agribank", bin: "970405" }, { ma: "OCB", nhan: "OCB", bin: "970448" }, { ma: "MBBank", nhan: "MBBank", bin: "970422" },
  { ma: "Techcombank", nhan: "Techcombank", bin: "970407" }, { ma: "ACB", nhan: "ACB", bin: "970416" }, { ma: "VPBank", nhan: "VPBank", bin: "970432" },
  { ma: "TPBank", nhan: "TPBank", bin: "970423" }, { ma: "Sacombank", nhan: "Sacombank", bin: "970403" }, { ma: "HDBank", nhan: "HDBank", bin: "970437" },
  { ma: "SCB", nhan: "SCB", bin: "970429" }, { ma: "VIB", nhan: "VIB", bin: "970441" }, { ma: "SHB", nhan: "SHB", bin: "970443" },
  { ma: "Eximbank", nhan: "Eximbank", bin: "970431" }, { ma: "MSB", nhan: "MSB", bin: "970426" }, { ma: "SeABank", nhan: "SeABank", bin: "970440" },
  { ma: "LienVietPostBank", nhan: "LienVietPostBank", bin: "970449" }, { ma: "BacABank", nhan: "BacABank", bin: "970409" },
];
export const binNganHang = (ma: string) => NGAN_HANG_QR.find((b) => b.ma === ma)?.bin ?? null;

/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF) — kiểm: "123456789" → 29B1. */
export function crc16(s: string): string {
  let c = 0xffff;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}
const tlv = (id: string, v: string) => `${id}${String(v.length).padStart(2, "0")}${v}`;

/** Chuỗi nội dung của mã VietQR chuyển tới số tài khoản. `soTien` > 0 thì mã có sẵn số tiền (mã động), không thì khách tự nhập. */
export function taoNoiDungVietQr(o: { bin: string; soTk: string; soTien?: number; ghiChu?: string }): string {
  const nganHang = tlv("00", o.bin) + tlv("01", o.soTk);
  const taiKhoan = tlv("00", "A000000727") + tlv("01", nganHang) + tlv("02", "QRIBFTTA");
  const coTien = !!o.soTien && o.soTien > 0;
  const thanh = tlv("00", "01") + tlv("01", coTien ? "12" : "11") + tlv("38", taiKhoan) + tlv("53", "704") + (coTien ? tlv("54", String(Math.round(o.soTien!))) : "") + tlv("58", "VN") + (o.ghiChu ? tlv("62", tlv("08", o.ghiChu)) : "");
  const goc = `${thanh}6304`;
  return goc + crc16(goc);
}

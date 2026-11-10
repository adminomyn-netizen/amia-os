// Mã VietQR (chuẩn EMVCo/Napas "chuyển nhanh 247 tới tài khoản") dựng ngay trên máy chủ, KHÔNG gọi dịch vụ ngoài.
import { chuanTenNganHang } from "@/lib/ngan-hang-ten";
// ĐỦ 63 ngân hàng / ví của ô "Ngân Hàng" (QRCode thanh toán) trong SalonHero Thiết lập in, ĐÚNG THỨ TỰ và đúng chữ (chị Lâm 10/11/2026: "dropdown rất nhiều, bê qua hết").
// `sh` = mã SalonHero gửi img.vietqr.io; `bin` = mã Napas đối chiếu danh sách công khai api.vietqr.io/v2/banks ngày 10/11/2026
// (Oceanbank nay là MBV 970414; DongABank 970406 theo mã Napas cũ của Đông Á, danh sách mới không còn tên này). Sai BIN là chuyển nhầm ngân hàng nên không thêm mục ngoài danh sách.
export const NGAN_HANG_QR: { ma: string; nhan: string; sh: string; bin: string }[] = [
  { ma: "VietinBank", nhan: "VietinBank", sh: "ICB", bin: "970415" }, { ma: "Vietcombank", nhan: "Vietcombank", sh: "VCB", bin: "970436" }, { ma: "BIDV", nhan: "BIDV", sh: "BIDV", bin: "970418" },
  { ma: "Agribank", nhan: "Agribank", sh: "VBA", bin: "970405" }, { ma: "OCB", nhan: "OCB", sh: "OCB", bin: "970448" }, { ma: "MBBank", nhan: "MBBank", sh: "MB", bin: "970422" },
  { ma: "Techcombank", nhan: "Techcombank", sh: "TCB", bin: "970407" }, { ma: "ACB", nhan: "ACB", sh: "ACB", bin: "970416" }, { ma: "VPBank", nhan: "VPBank", sh: "VPB", bin: "970432" },
  { ma: "TPBank", nhan: "TPBank", sh: "TPB", bin: "970423" }, { ma: "Sacombank", nhan: "Sacombank", sh: "STB", bin: "970403" }, { ma: "HDBank", nhan: "HDBank", sh: "HDB", bin: "970437" },
  { ma: "VietCapitalBank", nhan: "VietCapitalBank", sh: "VCCB", bin: "970454" }, { ma: "SCB", nhan: "SCB", sh: "SCB", bin: "970429" }, { ma: "VIB", nhan: "VIB", sh: "VIB", bin: "970441" },
  { ma: "SHB", nhan: "SHB", sh: "SHB", bin: "970443" }, { ma: "Eximbank", nhan: "Eximbank", sh: "EIB", bin: "970431" }, { ma: "MSB", nhan: "MSB", sh: "MSB", bin: "970426" },
  { ma: "CAKE", nhan: "CAKE", sh: "CAKE", bin: "546034" }, { ma: "Ubank", nhan: "Ubank", sh: "Ubank", bin: "546035" }, { ma: "Timo", nhan: "Timo", sh: "TIMO", bin: "963388" },
  { ma: "ViettelMoney", nhan: "ViettelMoney", sh: "VTLMONEY", bin: "971005" }, { ma: "VNPTMoney", nhan: "VNPTMoney", sh: "VNPTMONEY", bin: "971011" }, { ma: "SaigonBank", nhan: "SaigonBank", sh: "SGICB", bin: "970400" },
  { ma: "BacABank", nhan: "BacABank", sh: "BAB", bin: "970409" }, { ma: "PVcomBank", nhan: "PVcomBank", sh: "PVCB", bin: "970412" }, { ma: "Oceanbank", nhan: "Oceanbank", sh: "Oceanbank", bin: "970414" },
  { ma: "NCB", nhan: "NCB", sh: "NCB", bin: "970419" }, { ma: "ShinhanBank", nhan: "ShinhanBank", sh: "SHBVN", bin: "970424" }, { ma: "ABBANK", nhan: "ABBANK", sh: "ABB", bin: "970425" },
  { ma: "VietABank", nhan: "VietABank", sh: "VAB", bin: "970427" }, { ma: "NamABank", nhan: "NamABank", sh: "NAB", bin: "970428" }, { ma: "PGBank", nhan: "PGBank", sh: "PGB", bin: "970430" },
  { ma: "VietBank", nhan: "VietBank", sh: "VIETBANK", bin: "970433" }, { ma: "BaoVietBank", nhan: "BaoVietBank", sh: "BVB", bin: "970438" }, { ma: "SeABank", nhan: "SeABank", sh: "SEAB", bin: "970440" },
  { ma: "COOPBANK", nhan: "COOPBANK", sh: "COOPBANK", bin: "970446" }, { ma: "LienVietPostBank", nhan: "LienVietPostBank", sh: "LPB", bin: "970449" }, { ma: "KienLongBank", nhan: "KienLongBank", sh: "KLB", bin: "970452" },
  { ma: "KBank", nhan: "KBank", sh: "KBank", bin: "668888" }, { ma: "KookminHN", nhan: "KookminHN", sh: "KBHN", bin: "970462" }, { ma: "KEBHanaHCM", nhan: "KEBHanaHCM", sh: "KEBHANAHCM", bin: "970466" },
  { ma: "KEBHANAHN", nhan: "KEBHANAHN", sh: "KEBHANAHN", bin: "970467" }, { ma: "MAFC", nhan: "MAFC", sh: "MAFC", bin: "977777" }, { ma: "Citibank", nhan: "Citibank", sh: "CITIBANK", bin: "533948" },
  { ma: "KookminHCM", nhan: "KookminHCM", sh: "KBHCM", bin: "970463" }, { ma: "VBSP", nhan: "VBSP", sh: "VBSP", bin: "999888" }, { ma: "Woori", nhan: "Woori", sh: "WVN", bin: "970457" },
  { ma: "VRB", nhan: "VRB", sh: "VRB", bin: "970421" }, { ma: "UnitedOverseas", nhan: "UnitedOverseas", sh: "UOB", bin: "970458" }, { ma: "StandardChartered", nhan: "StandardChartered", sh: "SCVN", bin: "970410" },
  { ma: "PublicBank", nhan: "PublicBank", sh: "PBVN", bin: "970439" }, { ma: "Nonghyup", nhan: "Nonghyup", sh: "NHB HN", bin: "801011" }, { ma: "IndovinaBank", nhan: "IndovinaBank", sh: "IVB", bin: "970434" },
  { ma: "IBKHCM", nhan: "IBKHCM", sh: "IBK - HCM", bin: "970456" }, { ma: "IBKHN", nhan: "IBKHN", sh: "IBK - HN", bin: "970455" }, { ma: "HSBC", nhan: "HSBC", sh: "HSBC", bin: "458761" },
  { ma: "HongLeong", nhan: "HongLeong", sh: "HLBVN", bin: "970442" }, { ma: "GPBank", nhan: "GPBank", sh: "GPB", bin: "970408" }, { ma: "DongABank", nhan: "DongABank", sh: "DOB", bin: "970406" },
  { ma: "DBSBank", nhan: "DBSBank", sh: "DBS", bin: "796500" }, { ma: "CIMB", nhan: "CIMB", sh: "CIMB", bin: "422589" }, { ma: "CBBank", nhan: "CBBank", sh: "CBB", bin: "970444" },
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

// ── Mã QR cho TÀI KHOẢN NHẬN TIỀN (Cài đặt › Tài khoản Ngân Hàng) — chị Lâm 10/11/2026 "bê cả mã QR qua đây" ──
// SalonHero không lưu ảnh QR: nó ghép ảnh VietQR động từ mã ngân hàng + số tài khoản + số tiền (img.vietqr.io …-compact2.jpg?amount=…&accountName=…)
// ở hộp thanh toán khi chọn Chuyển khoản, ở màn hình khách và ở bản in (nếu bật QR trong thiết lập in). AMIA dựng CÙNG chuỗi VietQR ngay trong app (không gọi dịch vụ ngoài).

/** Tên ngắn (chuanTenNganHang) khác mã trong NGAN_HANG_QR. */
const BI_DANH_QR: Record<string, string> = {
  LPBank: "LienVietPostBank", "DongA Bank": "DongABank", ABBank: "ABBANK", "Bao Viet Bank": "BaoVietBank", BVBank: "VietCapitalBank", "Shinhan Bank": "ShinhanBank",
  "Nam A Bank": "NamABank", OceanBank: "Oceanbank", SGB: "SaigonBank", "Standard Chartered": "StandardChartered",
};

/** Mã ngân hàng trong NGAN_HANG_QR (ô "Ngân hàng" của Thiết lập in) theo tên lưu ở tai_khoan_ngan_hang; null nếu chưa có BIN. */
export function maQrCuaTen(ten: string | null | undefined): string | null {
  const ngan = chuanTenNganHang(ten);
  const ma = ngan ? BI_DANH_QR[ngan] ?? ngan : null;
  return ma && NGAN_HANG_QR.some((b) => b.ma === ma) ? ma : null;
}

/** BIN Napas của tài khoản theo tên ngân hàng lưu trong tai_khoan_ngan_hang ("Ngân hàng Vietcombank" …). null = chưa có BIN chắc chắn → không dựng QR (không đoán). */
export function binTheoTenNganHang(ten: string | null | undefined): string | null {
  const ma = maQrCuaTen(ten);
  return ma ? binNganHang(ma) : null;
}

/** Nội dung chuyển khoản trong mã (trường 62/08): bỏ dấu, chỉ chữ + số + khoảng trắng (như SalonHero getQRCodeNoteContent), tối đa 25 ký tự (giới hạn của trường "mục đích giao dịch" EMVCo). */
export function noiDungChuyenKhoan(s: string | null | undefined): string {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 25).trim();
}

/** Chuỗi VietQR chuyển tới một tài khoản nhận tiền; null nếu thiếu số tài khoản hợp lệ hoặc ngân hàng chưa có BIN. */
export function vietQrTaiKhoan(tk: { ngan_hang: string; so_tai_khoan: string }, soTien?: number, noiDung?: string): string | null {
  const bin = binTheoTenNganHang(tk.ngan_hang);
  const so = String(tk.so_tai_khoan ?? "").replace(/\D/g, "");
  if (!bin || !/^\d{6,19}$/.test(so)) return null;
  const ghiChu = noiDungChuyenKhoan(noiDung);
  return taoNoiDungVietQr({ bin, soTk: so, soTien: soTien && soTien > 0 ? Math.round(soTien) : undefined, ghiChu: ghiChu || undefined });
}

/** Đọc ngược chuỗi EMVCo (TLV) — dùng ở test và để hiện "mã này chuyển tới đâu". */
export function docTlv(s: string): Record<string, string> {
  const ra: Record<string, string> = {};
  for (let i = 0; i + 4 <= s.length; ) {
    const id = s.slice(i, i + 2), n = Number(s.slice(i + 2, i + 4));
    if (!Number.isFinite(n)) break;
    ra[id] = s.slice(i + 4, i + 4 + n);
    i += 4 + n;
  }
  return ra;
}

// ── Mã QR cuối TỜ IN (hoá đơn đã chốt + tạm tính) — y như SalonHero (directive "print": img.vietqr.io/<ngân hàng Thiết lập in>-<số TK>-compact2.jpg?amount=…&accountName=…&addInfo=…) ──
// Chỉ in khi Thiết lập in bật QRCode; ngân hàng / số TK lấy từ Thiết lập in (KHÔNG phải tài khoản thu ngân chọn lúc thanh toán).

/** Số tiền trong mã ở tờ in (SalonHero getQROrderBankTransferAmount): đơn MỘT hình thức → đã thu nếu 0 < đã thu < tổng, không thì tổng
 *  (kể cả đơn trả tiền mặt); đơn NHIỀU hình thức → khoản chuyển khoản đầu tiên, không có thì 0 (mã không kèm số tiền).
 *  `thu`: các khoản THU (không gồm hoàn, không gồm trừ thẻ tiền); `tong`: phải thu sau trừ thẻ tiền (= order.total của SalonHero). */
export function soTienQrIn(thu: { phuong_thuc: string; so_tien: number | string }[], tong: number): number {
  const co = thu.filter((t) => Number(t.so_tien) > 0);
  if (new Set(co.map((t) => t.phuong_thuc)).size > 1) return Number(co.find((t) => t.phuong_thuc === "chuyen_khoan")?.so_tien ?? 0);
  const daThu = co.reduce((a, t) => a + Number(t.so_tien), 0);
  return daThu > 0 && daThu < tong ? daThu : Math.max(tong, 0);
}

/** Nội dung chuyển khoản ở tờ in (SalonHero getQRCodeNoteContent): "Ghi chú chuyển khoản" của Thiết lập in, thay <ORDER_CODE> = mã hoá đơn,
 *  <CUSTOMER_NAME> = tên khách, rồi bỏ dấu / ký tự đặc biệt. Ghi chú trống → không có nội dung. Tạm tính chưa có mã hoá đơn thì <ORDER_CODE> để trống. */
export function ghiChuCkIn(mau: string | null | undefined, maHd: string | null | undefined, tenKhach: string | null | undefined): string {
  const m = String(mau ?? "").trim();
  if (!m) return "";
  return noiDungChuyenKhoan(m.replace("<ORDER_CODE>", maHd ?? "").replace("<CUSTOMER_NAME>", tenKhach ?? ""));
}

/** Chuỗi QR cuối tờ in theo Thiết lập in: "nội dung QRCode" tự nhập được ưu tiên; không thì VietQR tới tài khoản của Thiết lập in. "" = không in mã. */
export function chuoiQrIn(cfg: { qr: boolean; qrNganHang: string; qrSoTk: string; qrGhiChu: string; qrNoiDung: string }, o: { soTien: number; maHd?: string | null; tenKhach?: string | null }): string {
  if (!cfg.qr) return "";
  if (cfg.qrNoiDung.trim()) return cfg.qrNoiDung.trim();
  const bin = binNganHang(cfg.qrNganHang);
  if (!bin || !cfg.qrSoTk) return "";
  const ghiChu = ghiChuCkIn(cfg.qrGhiChu, o.maHd, o.tenKhach);
  return taoNoiDungVietQr({ bin, soTk: cfg.qrSoTk, soTien: o.soTien > 0 ? Math.round(o.soTien) : undefined, ghiChu: ghiChu || undefined });
}

// Thiết lập in (SalonHero #/print-setting, đọc 29/10/2026): mỗi chi nhánh (hoặc "Tất cả chi nhánh") có một bộ cấu hình cho Hoá đơn và một bộ cho Lịch hẹn.
// Lưu JSON ở cau_hinh, khoá in.<hoa_don|lich_hen>.<tat_ca|id chi nhánh>; chưa có thì lấy "tat_ca", chưa có nữa thì lấy mặc định bên dưới. Chỉ là cấu hình hiển thị, không phát sinh dịch vụ in có phí.
export type LoaiIn = "hoa_don" | "lich_hen";
export const KHO_GIAY = [{ gia_tri: "57mm", nhan: "57 mm" }, { gia_tri: "58mm", nhan: "58 mm" }, { gia_tri: "80mm", nhan: "80 mm" }, { gia_tri: "A4", nhan: "A4" }, { gia_tri: "A5", nhan: "A5" }] as const;
export type KhoGiay = (typeof KHO_GIAY)[number]["gia_tri"];

export type CauHinhIn = {
  khoGiay: KhoGiay; banSao: number; logo: boolean; thongTinCuaHang: boolean; coLogo: number;
  nhanVienPhucVu: boolean; gioVaoRa: boolean; sdtKhach: boolean; ghiChu: boolean; gioiTinhNamSinh: boolean; chuKyKhach: boolean; thuNgan: boolean; diemTichLuy: boolean; chiInHoanThanh: boolean;
  noiDungCuoi: string; /** Câu cam kết in dưới chữ ký (SalonHero: "…KHÔNG HOÀN LẠI…"); để trống thì không in. */ cauKhongHoanLai: string; qr: boolean; qrNganHang: string; qrSoTk: string; qrChuTk: string; qrGhiChu: string; qrNoiDung: string; ngonNgu: "vi" | "en";
};
/** Câu SalonHero in dưới chữ ký hoá đơn. Chị Lâm 10/11/2026 bảo bổ sung bản in cho đủ như SalonHero nên bật mặc định; sửa/xoá ở Cài đặt › Thiết lập in. */
export const CAU_KHONG_HOAN_LAI = "Số tiền thanh toán hoá đơn sẽ KHÔNG HOÀN LẠI trong bất cứ trường hợp nào";
/** Hoá đơn: các ô tích lấy đúng như SalonHero của AMIA hiện nay; "Nội dung kết thúc tờ in" giữ câu cảm ơn của AMIA, câu "KHÔNG HOÀN LẠI" là ô riêng (cauKhongHoanLai). */
export const MAC_DINH_IN: Record<LoaiIn, CauHinhIn> = {
  hoa_don: {
    khoGiay: "A5", banSao: 0, logo: true, thongTinCuaHang: true, coLogo: 0, nhanVienPhucVu: true, gioVaoRa: true, sdtKhach: true, ghiChu: true, gioiTinhNamSinh: false, chuKyKhach: true, thuNgan: true, diemTichLuy: false, chiInHoanThanh: false,
    noiDungCuoi: "Cảm ơn quý khách đã tin tưởng AMIA.", cauKhongHoanLai: CAU_KHONG_HOAN_LAI, qr: false, qrNganHang: "", qrSoTk: "", qrChuTk: "", qrGhiChu: "", qrNoiDung: "", ngonNgu: "vi",
  },
  lich_hen: {
    khoGiay: "80mm", banSao: 0, logo: true, thongTinCuaHang: false, coLogo: 0, nhanVienPhucVu: false, gioVaoRa: false, sdtKhach: false, ghiChu: false, gioiTinhNamSinh: false, chuKyKhach: false, thuNgan: false, diemTichLuy: false, chiInHoanThanh: false,
    noiDungCuoi: "Xin cảm ơn quý khách!\nHân hạnh được phục vụ quý khách!", cauKhongHoanLai: "", qr: false, qrNganHang: "", qrSoTk: "", qrChuTk: "", qrGhiChu: "", qrNoiDung: "", ngonNgu: "vi",
  },
};
export const TAT_CA = "tat_ca";
export const khoaIn = (loai: LoaiIn, cn: string) => `in.${loai}.${cn}`;
export const laLoaiIn = (v: unknown): v is LoaiIn => v === "hoa_don" || v === "lich_hen";

const BOOL = ["logo", "thongTinCuaHang", "nhanVienPhucVu", "gioVaoRa", "sdtKhach", "ghiChu", "gioiTinhNamSinh", "chuKyKhach", "thuNgan", "diemTichLuy", "chiInHoanThanh", "qr"] as const;
const CHU = ["noiDungCuoi", "cauKhongHoanLai", "qrNganHang", "qrSoTk", "qrChuTk", "qrGhiChu", "qrNoiDung"] as const;
/** Đọc JSON từ DB: trường nào hỏng/thiếu thì lấy mặc định. */
export function chuanHoaIn(loai: LoaiIn, raw: unknown): CauHinhIn {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const ra: CauHinhIn = { ...MAC_DINH_IN[loai] };
  if (KHO_GIAY.some((k) => k.gia_tri === r.khoGiay)) ra.khoGiay = r.khoGiay as KhoGiay;
  if (Number.isInteger(r.banSao) && (r.banSao as number) >= 0 && (r.banSao as number) <= 3) ra.banSao = r.banSao as number;
  if (Number.isInteger(r.coLogo) && (r.coLogo as number) >= 0 && (r.coLogo as number) <= 400) ra.coLogo = r.coLogo as number;
  for (const k of BOOL) if (typeof r[k] === "boolean") ra[k] = r[k] as boolean;
  for (const k of CHU) if (typeof r[k] === "string") ra[k] = (r[k] as string).slice(0, 500);
  if (r.ngonNgu === "vi" || r.ngonNgu === "en") ra.ngonNgu = r.ngonNgu;
  return ra;
}
export function docIn(loai: LoaiIn, rows: { khoa: string; gia_tri: string }[] | null, cn: string): { cauHinh: CauHinhIn; nguon: "chi_nhanh" | "chung" | "mac_dinh" } {
  const m = new Map((rows ?? []).map((x) => [x.khoa, x.gia_tri]));
  for (const [k, nguon] of [[khoaIn(loai, cn), "chi_nhanh"], [khoaIn(loai, TAT_CA), "chung"]] as const) {
    const v = m.get(k);
    if (v) { try { return { cauHinh: chuanHoaIn(loai, JSON.parse(v)), nguon }; } catch { /* JSON hỏng thì bỏ qua, xuống mức sau */ } }
  }
  return { cauHinh: MAC_DINH_IN[loai], nguon: "mac_dinh" };
}

/** Kiểm tra trước khi lưu; trả lỗi tiếng Việt hoặc chuỗi rỗng. */
export function loiIn(c: CauHinhIn): string {
  if (!KHO_GIAY.some((k) => k.gia_tri === c.khoGiay)) return "Chọn kích thước giấy in.";
  if (!Number.isInteger(c.banSao) || c.banSao < 0 || c.banSao > 3) return "Bản sao từ 0 đến 3.";
  if (!Number.isInteger(c.coLogo) || c.coLogo < 0 || (c.coLogo > 0 && c.coLogo < 20) || c.coLogo > 400) return "Kích thước logo từ 20 đến 400 px (để trống = cỡ mặc định).";
  if (c.noiDungCuoi.length > 300) return "Nội dung kết thúc tờ in tối đa 300 ký tự.";
  if (c.cauKhongHoanLai.length > 300) return "Câu cam kết dưới chữ ký tối đa 300 ký tự.";
  if (c.qrNoiDung.length > 400) return "Nội dung QRCode tối đa 400 ký tự.";
  if (c.qrSoTk && !/^\d{6,20}$/.test(c.qrSoTk)) return "Số tài khoản chỉ gồm chữ số (6–20 số).";
  if (c.qrChuTk.length > 50) return "Chủ tài khoản tối đa 50 ký tự.";
  // Như SalonHero: ghi chú được chèn <ORDER_CODE> / <CUSTOMER_NAME> (thay lúc in); còn lại chỉ chữ, số, dấu cách. Nội dung trong mã cắt 25 ký tự (giới hạn trường 62/08 EMVCo).
  if (c.qrGhiChu && (c.qrGhiChu.length > 50 || !/^[\p{L}\p{N} ]*$/u.test(c.qrGhiChu.replace(/<ORDER_CODE>|<CUSTOMER_NAME>/g, "")))) return "Ghi chú chuyển khoản tối đa 50 ký tự, chỉ chữ, số, dấu cách và <ORDER_CODE> / <CUSTOMER_NAME> (không ký tự đặc biệt).";
  if (c.qr && !c.qrNoiDung.trim() && !(c.qrNganHang && c.qrSoTk)) return "Bật QRCode thì chọn ngân hàng và nhập số tài khoản, hoặc nhập nội dung QRCode.";
  return "";
}

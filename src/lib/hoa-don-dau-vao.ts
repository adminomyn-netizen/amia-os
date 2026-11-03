/** Hoá đơn đầu vào (y SalonHero #/expense-invoice): thuế suất, kiểm tệp tải lên, lọc danh sách. Dùng chung cho trang, server action và đường tải về. */

export const KHO_HDDV = "hoa-don-dau-vao";
export const TEP_TOI_DA = 10 * 1024 * 1024;

export const THUE_SUAT = [
  { gia_tri: "10", nhan: "10%" }, { gia_tri: "8", nhan: "8%" }, { gia_tri: "5", nhan: "5%" }, { gia_tri: "0", nhan: "0%" },
  { gia_tri: "KCT", nhan: "KCT (Không chịu thuế)" }, { gia_tri: "KKKNT", nhan: "KKKNT (Không kê khai)" },
] as const;
export const nhanThueSuat = (v: string | null | undefined) => (v ? (THUE_SUAT.find((t) => t.gia_tri === v)?.nhan.split(" ")[0] ?? v) : "");
export const thueSuatHopLe = (v: string) => THUE_SUAT.some((t) => t.gia_tri === v);

const DUOI: Record<string, string> = { pdf: "application/pdf", xml: "application/xml", zip: "application/zip" };
/** Loại tệp theo đuôi tên (trình duyệt hay báo sai/thiếu mime với XML, Zip). Trả null nếu không phải PDF/XML/Zip. */
export function loaiTep(ten: string): { duoi: string; mime: string } | null {
  const duoi = (ten.split(".").pop() ?? "").toLowerCase();
  return DUOI[duoi] ? { duoi, mime: DUOI[duoi] } : null;
}
export function kiemTraTepHddv(ten: string, kichThuoc: number): string | null {
  if (!loaiTep(ten)) return "Chỉ nhận tệp PDF, XML hoặc Zip.";
  if (!(kichThuoc > 0)) return "Tệp rỗng.";
  if (kichThuoc > TEP_TOI_DA) return "Tệp quá 10 MB.";
  return null;
}

/** Mã số thuế VN: 10 số, hoặc 10 số + "-" + 3 số (chi nhánh). Bỏ khoảng trắng. */
export const chuanMst = (s: string) => s.replace(/\s+/g, "");
export const mstHopLe = (s: string) => /^\d{10}(-\d{3})?$/.test(s) || /^\d{12}$/.test(s);

type Dong = { ngay_hd: string | null; tao_luc: string; chi_nhanh_id: string | null; ma_so_thue?: string | null; ten_ncc?: string | null; so_hd: string | null; ky_hieu: string | null; ma_tra_cuu: string | null };
const bo = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

/** Lọc như SalonHero: chi nhánh, khoảng ngày hoá đơn (dòng chưa có hoá đơn tính theo ngày tạo), ô tìm tên công ty / MST / số HĐ / mã tra cứu. */
export function locHddv<T extends Dong>(ds: T[], o: { cn?: string; tu: string; den: string; q?: string }): T[] {
  const tim = bo((o.q ?? "").trim());
  return ds.filter((r) => {
    if (o.cn && r.chi_nhanh_id !== o.cn) return false;
    const ngay = r.ngay_hd ?? new Date(new Date(r.tao_luc).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
    if (ngay < o.tu || ngay > o.den) return false;
    if (tim && !bo(`${r.ten_ncc ?? ""} ${r.ma_so_thue ?? ""} ${r.so_hd ?? ""} ${r.ky_hieu ?? ""} ${r.ma_tra_cuu ?? ""}`).includes(tim)) return false;
    return true;
  });
}

/** 2 ô tổng của SalonHero: tổng tiền thuế VAT và tổng tiền hoá đơn (gồm thuế), bỏ dòng đã huỷ và khoản chưa có hoá đơn. */
export function tongHddv(ds: { trang_thai: string; thue_gtgt: number; tong_tien: number | null }[]) {
  const co = ds.filter((r) => r.trang_thai !== "huy" && r.trang_thai !== "cho_hoa_don");
  return { vat: co.reduce((a, r) => a + Number(r.thue_gtgt), 0), tong: co.reduce((a, r) => a + Number(r.tong_tien ?? 0), 0) };
}

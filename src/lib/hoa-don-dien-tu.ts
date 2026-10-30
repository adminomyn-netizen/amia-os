// Hoá đơn điện tử (khung): hàm thuần dùng chung cho trang, hành động và tệp Excel. KHÔNG chạm DB, KHÔNG gọi nhà cung cấp.
import { homNayHCM } from "@/lib/dinh-dang";
import { docNhomLoc, type NhomLoc } from "@/lib/hoa-don-dien-tu-ngan-hang";

export const NHA_CUNG_CAP = [
  { gia_tri: "viettel", nhan: "Viettel S-Invoice" },
  { gia_tri: "misa", nhan: "MISA meInvoice" },
  { gia_tri: "vnpt", nhan: "VNPT Invoice" },
  { gia_tri: "khac", nhan: "Nhà cung cấp khác" },
] as const;
export const tenNhaCungCap = (ma: string | null | undefined) => NHA_CUNG_CAP.find((n) => n.gia_tri === ma)?.nhan ?? "";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
export const ngayHopLe = (s: string) => { if (!NGAY.test(s)) return false; const d = new Date(s + "T00:00:00Z"); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };

export type DongCanXet = { trang_thai: string; vat_hd_luc: string | null; vat_hd_so: string | null; vat_pct: number | string | null; vat_tien: number | string | null; la_so_du_dau?: boolean | null };

/** Hoá đơn "cần xuất" hoá đơn điện tử: đã hoàn thành, chưa ghi hoá đơn điện tử, và (có VAT trên đơn HOẶC khách có mã số thuế). Số dư đầu kỳ không phải bán hàng nên bỏ. */
export function canXuatHddt(h: DongCanXet, khachCoMst: boolean): boolean {
  if (h.trang_thai !== "hoan_thanh" || h.la_so_du_dau) return false;
  if (h.vat_hd_luc || (h.vat_hd_so ?? "").trim() !== "") return false;
  return Number(h.vat_pct ?? 0) > 0 || Number(h.vat_tien ?? 0) > 0 || khachCoMst;
}

export type NhapGhiHddt = { so: string; ngay: string; kyHieu: string; mauSo: string; traCuu: string };
export type DaChuanHoa = { so: string; ngay: string; kyHieu: string | null; mauSo: string | null; traCuu: string | null };

/** Kiểm dữ liệu người nhập khi ghi số hoá đơn điện tử. Trả lời báo lỗi bằng tiếng Việt đời thường, hoặc dữ liệu đã làm sạch. */
export function kiemGhiHddt(n: NhapGhiHddt, homNay = homNayHCM()): { loi: string } | { ok: DaChuanHoa } {
  const so = n.so.trim(), kyHieu = n.kyHieu.trim(), mauSo = n.mauSo.trim(), traCuu = n.traCuu.trim();
  if (!so) return { loi: "Nhập số hoá đơn." };
  if (so.length > 30) return { loi: "Số hoá đơn dài quá 30 ký tự." };
  if (!ngayHopLe(n.ngay)) return { loi: "Chọn ngày xuất hoá đơn." };
  if (n.ngay > homNay) return { loi: "Ngày xuất không được ở tương lai." };
  if (kyHieu.length > 20 || mauSo.length > 20) return { loi: "Ký hiệu và mẫu số tối đa 20 ký tự." };
  if (traCuu.length > 300) return { loi: "Mã hoặc đường dẫn tra cứu dài quá 300 ký tự." };
  if (/^http/i.test(traCuu) && !/^https:\/\/\S+$/i.test(traCuu)) return { loi: "Đường dẫn tra cứu phải bắt đầu bằng https://" };
  return { ok: { so, ngay: n.ngay, kyHieu: kyHieu || null, mauSo: mauSo || null, traCuu: traCuu || null } };
}

export type NhapKetNoi = { nhaCungCap: string; maSoThue: string; tenDangNhap: string; mauSo: string; kyHieu: string; diaChi: string };
export function kiemKetNoi(n: NhapKetNoi): { loi: string } | { ok: { nha_cung_cap: string; ma_so_thue: string; ten_dang_nhap: string | null; mau_so_mac_dinh: string | null; ky_hieu_mac_dinh: string | null; dia_chi_may_chu: string | null } } {
  const mst = n.maSoThue.trim().replace(/\s+/g, "");
  if (!NHA_CUNG_CAP.some((c) => c.gia_tri === n.nhaCungCap)) return { loi: "Chọn nhà cung cấp hoá đơn điện tử." };
  if (!/^\d{10}(-\d{3})?$/.test(mst)) return { loi: "Mã số thuế gồm 10 số (hoặc 13 số, dạng 0123456789-001)." };
  if (n.tenDangNhap.trim().length > 100) return { loi: "Tên đăng nhập dài quá 100 ký tự." };
  if (n.mauSo.trim().length > 20 || n.kyHieu.trim().length > 20) return { loi: "Mẫu số và ký hiệu tối đa 20 ký tự." };
  const diaChi = n.diaChi.trim();
  if (diaChi && (!/^https:\/\/\S+$/i.test(diaChi) || diaChi.length > 300)) return { loi: "Địa chỉ máy chủ phải bắt đầu bằng https://" };
  return { ok: { nha_cung_cap: n.nhaCungCap, ma_so_thue: mst, ten_dang_nhap: n.tenDangNhap.trim() || null, mau_so_mac_dinh: n.mauSo.trim() || null, ky_hieu_mac_dinh: n.kyHieu.trim() || null, dia_chi_may_chu: diaChi || null } };
}

/** Bộ lọc của hai tab danh sách: khoảng ngày bán + ô tìm. Ngày sai thì lấy mặc định (từ đầu tháng đến hôm nay). */
export type LocHddt = { tab: "can" | "da" | "ket-noi"; tu: string; den: string; q: string; /** Nơi nhận tiền (chỉ ngăn "Cần xuất"): null = tất cả; mặc định Techcombank + Vietcombank. */ nh: NhomLoc[] | null };
export function docLocHddt(sp: Record<string, string | undefined>, homNay = homNayHCM()): LocHddt {
  return {
    tab: sp.tab === "da" || sp.tab === "ket-noi" ? sp.tab : "can",
    tu: ngayHopLe(sp.tu ?? "") ? sp.tu! : homNay.slice(0, 8) + "01",
    den: ngayHopLe(sp.den ?? "") ? sp.den! : homNay,
    q: (sp.q ?? "").trim().slice(0, 80),
    nh: docNhomLoc(sp.nh),
  };
}

/** Chuỗi hiện "đã lưu khoá": chỉ 4 ký tự cuối, không bao giờ hiện cả khoá. */
export const hienKhoa = (cuoi4: string | null | undefined) => (cuoi4 ? `đã lưu, kết thúc …${cuoi4}` : "chưa có");

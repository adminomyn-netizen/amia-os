// MẪU HOÁ ĐƠN GTGT lập trong AMIA OS (đợt 4, 03/11/2026) — hàm THUẦN (không chạm DB), có test ở tests/hoa-don-gtgt.test.ts.
// Dựng nội dung hoá đơn từ một hoá đơn bán đã chốt + XML theo cấu trúc hoá đơn điện tử của Tổng cục Thuế (QĐ 1450/QĐ-TCT, TT 78/2021):
//   HDon › DLHDon › TTChung (PBan, THDon, KHMSHDon, KHHDon, SHDon, NLap, DVTTe, HTTToan) + NDHDon (NBan, NMua, DSHHDVu › HHDVu, TToan).
// Tên thẻ và thứ tự đối chiếu với một hoá đơn GTGT THẬT đã được CQT cấp mã (PBan 2.0.1, TSuat dạng "10%") và lược đồ HDon.xsd công khai.
// Chưa có: chữ ký số (DSCKS), mã CQT (MCCQT), MST tổ chức cung cấp giải pháp (MSTTCGP) — nhà cung cấp HĐĐT điền khi ký và gửi.
import { docSoTien } from "@/lib/phieu-thu";

export const THUE_SUAT = [
  { gia_tri: "10", nhan: "10%" }, { gia_tri: "8", nhan: "8%" }, { gia_tri: "5", nhan: "5%" }, { gia_tri: "0", nhan: "0%" },
  { gia_tri: "KCT", nhan: "Không chịu thuế (KCT)" }, { gia_tri: "KKKNT", nhan: "Không kê khai, tính nộp thuế (KKKNT)" },
] as const;
export type ThueSuat = (typeof THUE_SUAT)[number]["gia_tri"];
export const laThueSuat = (v: string): v is ThueSuat => THUE_SUAT.some((t) => t.gia_tri === v);
const tiLe = (t: ThueSuat) => (t === "KCT" || t === "KKKNT" ? 0 : Number(t) / 100);
/** Cách ghi thuế suất trên hoá đơn và trong XML (giống hoá đơn thật: "10%", "KCT"). */
export const nhanThueSuat = (t: string) => (/^\d+$/.test(t) ? `${t}%` : t);

export const LOAI_NGUOI_MUA = [{ gia_tri: "doanh_nghiep", nhan: "Doanh nghiệp" }, { gia_tri: "ca_nhan", nhan: "Cá nhân" }, { gia_tri: "khach_le", nhan: "Khách lẻ" }] as const;
export type LoaiNguoiMua = (typeof LOAI_NGUOI_MUA)[number]["gia_tri"];
export const HINH_THUC_TT = [{ gia_tri: "TM", nhan: "Tiền mặt" }, { gia_tri: "CK", nhan: "Chuyển khoản" }, { gia_tri: "TM/CK", nhan: "Tiền mặt/Chuyển khoản" }] as const;
export const nhanHinhThuc = (v: string) => HINH_THUC_TT.find((h) => h.gia_tri === v)?.nhan ?? v;
/** Hình thức thanh toán suy từ các khoản thu của đơn: tiền mặt → TM; quẹt thẻ, chuyển khoản, ví → CK; có cả hai → TM/CK. Không có khoản thu → TM/CK. */
export function hinhThucTuThu(phuongThuc: string[]): string {
  const tm = phuongThuc.includes("tien_mat"), ck = phuongThuc.some((p) => p !== "tien_mat" && p !== "the_tien");
  return tm && !ck ? "TM" : ck && !tm ? "CK" : "TM/CK";
}

export const MST_RE = /^[0-9]{10}(-[0-9]{3})?$/;
export const KY_HIEU_RE = /^[CKM][0-9]{2}[TDLMNBGH][A-Z0-9]{2}$/;
export const TEN_MAU_SO: Record<string, string> = { "1": "Hóa đơn giá trị gia tăng", "2": "Hóa đơn bán hàng" };

export type NguoiBan = { ten: string; mst: string; dia_chi: string; dien_thoai?: string | null; email?: string | null; so_tai_khoan?: string | null; ngan_hang?: string | null };
export type NguoiMua = { loai: LoaiNguoiMua; ten_don_vi: string; mst: string; cccd: string; dia_chi: string; ho_ten: string; dien_thoai: string; email: string };
/** tinh_chat theo QĐ 1450: 1 hàng hoá/dịch vụ, 3 chiết khấu thương mại. */
export type DongGtgt = { stt: number; tinh_chat: 1 | 3; ten: string; dvt: string; sl: number; don_gia: number; ck: number; thanh_tien: number; thue_suat: string };
export type NoiDungGtgt = {
  nguoi_mua: NguoiMua; dong: DongGtgt[]; thue_suat: string; hinh_thuc_tt: string; ghi_chu: string;
  /** gia_da_gom_thue: đơn không cộng VAT riêng → tiền khách trả đã gồm thuế, hoá đơn tách ngược ra tiền trước thuế + tiền thuế. */
  gia_da_gom_thue: boolean;
  tong: { truoc_thue: number; tien_thue: number; ck_tm: number; thanh_toan: number; bang_chu: string };
  /** Trả bằng thẻ tiền (để kế toán biết), tiền tip không đưa lên hoá đơn. */
  tru_the: number; tip: number;
  canh_bao: string[];
};

export type DonNguon = {
  vat_pct: number | string | null; vat_tien: number | string | null; giam_gia_don: number | string | null; giam_voucher: number | string | null; giam_diem: number | string | null;
  phu_phi: number | string | null; tip: number | string | null; tong_phai_thu: number | string | null; tien_tru_the: number | string | null;
};
export type DongNguon = { ten: string; loai: string; so_luong: number | string; don_gia: number | string; giam_gia: number | string; thanh_tien: number | string | null; dvt?: string | null };

const n = (v: unknown) => Number(v ?? 0) || 0;
const tron2 = (x: number) => Math.round(x * 100) / 100;
const DVT_MAC_DINH: Record<string, string> = { dich_vu: "Lần", goi_the: "Thẻ", san_pham: "Cái" };

/** Thuế suất của hoá đơn: đơn đã cộng VAT riêng thì lấy đúng % trên đơn; không thì theo lựa chọn (nháp) hoặc mặc định của chi nhánh. */
export function thueSuatHoaDon(don: Pick<DonNguon, "vat_pct" | "vat_tien">, chon: string | null | undefined, macDinh: string): string {
  if (n(don.vat_tien) > 0) return String(Math.round(n(don.vat_pct) * 100) / 100);
  return chon && laThueSuat(chon) ? chon : laThueSuat(macDinh) ? macDinh : "10";
}

/** Dựng nội dung hoá đơn GTGT từ hoá đơn bán. Không làm tròn lặng lẽ: tổng thanh toán khác tiền khách phải trả (trừ tip) thì ghi cảnh báo. */
export function dungNoiDung(don: DonNguon, dongNguon: DongNguon[], o: { nguoiMua: NguoiMua; thueSuat: string; hinhThuc: string; ghiChu?: string }): NoiDungGtgt {
  const canhBao: string[] = [];
  const coVatRieng = n(don.vat_tien) > 0;
  const ts = o.thueSuat;
  const r = laThueSuat(ts) ? tiLe(ts) : n(ts) / 100;
  if (!laThueSuat(ts)) canhBao.push(`Thuế suất ${ts}% trên đơn không thuộc mức 0/5/8/10% của hoá đơn GTGT — kiểm lại trước khi xuất.`);
  const f = coVatRieng ? 1 : 1 / (1 + r);
  const tip = n(don.tip), G = n(don.tong_phai_thu) - tip;
  const dong: DongGtgt[] = [];
  for (const d of dongNguon) {
    const sl = n(d.so_luong), dg = n(d.don_gia), gg = n(d.giam_gia), tt = d.thanh_tien == null ? dg * sl - gg : n(d.thanh_tien);
    if (dg === 0 && tt === 0) continue; // buổi trừ thẻ / dòng 0 đồng: không lên hoá đơn
    const thanhTien = Math.round(tt * f), donGia = tron2(dg * f);
    dong.push({ stt: dong.length + 1, tinh_chat: 1, ten: d.ten, dvt: d.dvt?.trim() || DVT_MAC_DINH[d.loai] || "Lần", sl, don_gia: donGia, ck: tron2(donGia * sl - thanhTien), thanh_tien: thanhTien, thue_suat: nhanThueSuat(ts) });
  }
  const phuPhi = Math.round(n(don.phu_phi) * f);
  if (phuPhi) dong.push({ stt: dong.length + 1, tinh_chat: 1, ten: "Phụ phí dịch vụ", dvt: "Lần", sl: 1, don_gia: phuPhi, ck: 0, thanh_tien: phuPhi, thue_suat: nhanThueSuat(ts) });
  const ckTm = Math.round((n(don.giam_gia_don) + n(don.giam_voucher) + n(don.giam_diem)) * f);
  if (ckTm) dong.push({ stt: dong.length + 1, tinh_chat: 3, ten: "Chiết khấu thương mại", dvt: "", sl: 0, don_gia: 0, ck: 0, thanh_tien: ckTm, thue_suat: nhanThueSuat(ts) });
  const truocThue = dong.reduce((t, d) => t + (d.tinh_chat === 3 ? -d.thanh_tien : d.thanh_tien), 0);
  const tienThue = coVatRieng ? n(don.vat_tien) : r > 0 ? G - truocThue : 0;
  const thanhToan = truocThue + tienThue;
  if (thanhToan !== G) canhBao.push(`Tổng trên hoá đơn GTGT (${thanhToan.toLocaleString("vi-VN")}) khác số khách phải trả trừ tip (${G.toLocaleString("vi-VN")}). Kiểm lại dòng hàng/giảm giá của đơn.`);
  if (coVatRieng && r > 0 && Math.abs(tienThue - Math.round(truocThue * r)) > 2) canhBao.push(`Tiền thuế trên đơn (${tienThue.toLocaleString("vi-VN")}) khác ${nhanThueSuat(ts)} × tiền trước thuế (${Math.round(truocThue * r).toLocaleString("vi-VN")}) — đơn tính VAT trước phụ phí/voucher.`);
  if (!dong.some((d) => d.tinh_chat === 1)) canhBao.push("Hoá đơn này không có dòng hàng có tiền (chỉ có buổi trừ thẻ), không cần xuất hoá đơn GTGT.");
  return {
    nguoi_mua: o.nguoiMua, dong, thue_suat: nhanThueSuat(ts), hinh_thuc_tt: o.hinhThuc, ghi_chu: (o.ghiChu ?? "").trim(), gia_da_gom_thue: !coVatRieng && r > 0,
    tong: { truoc_thue: truocThue, tien_thue: tienThue, ck_tm: ckTm, thanh_toan: thanhToan, bang_chu: docSoTien(thanhToan) },
    tru_the: n(don.tien_tru_the), tip, canh_bao: canhBao,
  };
}

// ── Kiểm dữ liệu nhập ──
const gon = (v: unknown) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

export type NhapNguoiBan = { ten_don_vi: string; ma_so_thue: string; dia_chi: string; dien_thoai: string; email: string; so_tai_khoan: string; ngan_hang: string; mau_so: string; ky_hieu: string; thue_suat: string };
/** Thông tin người bán theo chi nhánh. Được để trống từng ô (chị điền dần); chỉ kiểm dạng khi có chữ. Xuất hoá đơn mới đòi đủ tên, MST, địa chỉ, ký hiệu. */
export function kiemNguoiBan(x: Record<string, unknown>): { loi: string } | { ok: NhapNguoiBan } {
  const v: NhapNguoiBan = { ten_don_vi: gon(x.ten_don_vi), ma_so_thue: gon(x.ma_so_thue).replace(/\s/g, ""), dia_chi: gon(x.dia_chi), dien_thoai: gon(x.dien_thoai), email: gon(x.email), so_tai_khoan: gon(x.so_tai_khoan).replace(/\s/g, ""), ngan_hang: gon(x.ngan_hang), mau_so: gon(x.mau_so) || "1", ky_hieu: gon(x.ky_hieu).toUpperCase().replace(/^[1-6](?=[CKM]\d{2})/, ""), thue_suat: gon(x.thue_suat) || "10" };
  if (v.ten_don_vi.length > 400 || v.dia_chi.length > 400) return { loi: "Tên đơn vị và địa chỉ tối đa 400 ký tự." };
  if (v.ma_so_thue && !MST_RE.test(v.ma_so_thue)) return { loi: "Mã số thuế người bán gồm 10 số, hoặc 13 số dạng 0123456789-001." };
  if (!/^[1-6]$/.test(v.mau_so)) return { loi: "Mẫu số hoá đơn là một chữ số 1–6 (hoá đơn GTGT là 1)." };
  if (v.ky_hieu && !KY_HIEU_RE.test(v.ky_hieu)) return { loi: "Ký hiệu hoá đơn gồm 6 ký tự theo Thông tư 78, ví dụ C26TAA (C = có mã CQT, 26 = năm 2026, T = loại đăng ký, AA do doanh nghiệp tự đặt)." };
  if (!laThueSuat(v.thue_suat)) return { loi: "Thuế suất mặc định chưa hợp lệ." };
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { loi: "Email người bán chưa đúng dạng." };
  if ([v.dien_thoai, v.so_tai_khoan, v.ngan_hang, v.email].some((s) => s.length > 200)) return { loi: "Một ô quá dài (tối đa 200 ký tự)." };
  return { ok: v };
}
export const thieuNguoiBan = (b: { [K in "ten_don_vi" | "ma_so_thue" | "dia_chi" | "ky_hieu"]?: string | null } | null | undefined) =>
  [["tên đơn vị", b?.ten_don_vi], ["mã số thuế", b?.ma_so_thue], ["địa chỉ", b?.dia_chi], ["ký hiệu hoá đơn", b?.ky_hieu]].filter(([, v]) => !String(v ?? "").trim()).map(([t]) => t as string);

/** Người mua như hộp "Khởi tạo hoá đơn điện tử" của SalonHero: Doanh nghiệp (MST bắt buộc, tên DN, địa chỉ DN) / Cá nhân (CCCD tuỳ chọn) / Khách lẻ. */
export function kiemNguoiMua(x: Record<string, unknown>): { loi: string } | { ok: NguoiMua } {
  const loai = (LOAI_NGUOI_MUA.some((l) => l.gia_tri === x.loai) ? x.loai : "ca_nhan") as LoaiNguoiMua;
  const v: NguoiMua = { loai, ten_don_vi: gon(x.ten_don_vi), mst: gon(x.mst).replace(/\s/g, ""), cccd: gon(x.cccd).replace(/\s/g, ""), dia_chi: gon(x.dia_chi), ho_ten: gon(x.ho_ten), dien_thoai: gon(x.dien_thoai), email: gon(x.email) };
  if (loai === "doanh_nghiep") {
    if (!v.mst) return { loi: "Xuất cho doanh nghiệp phải có mã số thuế." };
    if (!v.ten_don_vi) return { loi: "Xuất cho doanh nghiệp phải có tên doanh nghiệp." };
    if (!v.dia_chi) return { loi: "Xuất cho doanh nghiệp phải có địa chỉ doanh nghiệp." };
  }
  if (v.mst && !MST_RE.test(v.mst)) return { loi: "Mã số thuế người mua gồm 10 số, hoặc 13 số dạng 0123456789-001." };
  if (v.cccd && !/^[0-9]{12}$/.test(v.cccd)) return { loi: "Số CCCD gồm 12 chữ số." };
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { loi: "Email người mua chưa đúng dạng." };
  if ([v.ten_don_vi, v.dia_chi].some((s) => s.length > 400) || [v.ho_ten, v.dien_thoai, v.email].some((s) => s.length > 200)) return { loi: "Một ô quá dài." };
  if (loai === "khach_le") return { ok: { ...v, ten_don_vi: "", mst: "", cccd: "" } };
  return { ok: v };
}

/** Người mua mặc định từ hồ sơ khách + tên đã sửa ở "Sửa tên khi xuất". */
export function nguoiMuaTuKhach(k: { ho_ten?: string | null; cong_ty?: string | null; ma_so_thue?: string | null; dia_chi?: string | null; dien_thoai?: string | null; email?: string | null } | null | undefined,
  sua?: { ten_nguoi_mua?: string | null; ma_so_thue?: string | null; dia_chi?: string | null } | null): NguoiMua {
  if (!k) return { loai: "khach_le", ten_don_vi: "", mst: "", cccd: "", dia_chi: "", ho_ten: "", dien_thoai: "", email: "" };
  const mst = gon(sua?.ma_so_thue) || gon(k.ma_so_thue), dn = gon(sua?.ten_nguoi_mua) || gon(k.cong_ty);
  const laDn = !!mst && !!dn;
  return { loai: laDn ? "doanh_nghiep" : "ca_nhan", ten_don_vi: laDn ? dn : "", mst: laDn ? mst : "", cccd: "", dia_chi: gon(sua?.dia_chi) || gon(k.dia_chi), ho_ten: gon(k.ho_ten), dien_thoai: gon(k.dien_thoai), email: gon(k.email) };
}

// ── XML ──
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const so = (x: number) => (Number.isInteger(x) ? String(x) : String(tron2(x)));
const the = (ten: string, gt: string | number | null | undefined, batBuoc = false) => {
  const s = gt == null ? "" : typeof gt === "number" ? so(gt) : gt.trim();
  return s || batBuoc ? `<${ten}>${esc(s)}</${ten}>` : "";
};

export type ThongTinHoaDon = { mau_so: string; ky_hieu: string; so: number; ngay_lap: string };
/** XML hoá đơn theo cấu trúc HĐĐT của Tổng cục Thuế (chưa ký số). Thứ tự thẻ theo lược đồ HDon. */
export function taoXml(tt: ThongTinHoaDon, ban: NguoiBan, nd: NoiDungGtgt): string {
  const m = nd.nguoi_mua;
  const tenMua = m.loai === "doanh_nghiep" ? m.ten_don_vi : "";
  const nguoiMuaHang = m.loai === "khach_le" ? (m.ho_ten || "Người mua không lấy hóa đơn") : m.ho_ten;
  const hang = nd.dong.map((d) => `<HHDVu>${the("TChat", String(d.tinh_chat), true)}${the("STT", d.stt, true)}${the("THHDVu", d.ten, true)}${d.tinh_chat === 1 ? `${the("DVTinh", d.dvt)}${the("SLuong", d.sl, true)}${the("DGia", d.don_gia, true)}${the("STCKhau", d.ck, true)}` : ""}${the("ThTien", d.thanh_tien, true)}${the("TSuat", d.thue_suat, true)}</HHDVu>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<HDon><DLHDon Id="data">`
    + `<TTChung>${the("PBan", "2.0.1", true)}${the("THDon", TEN_MAU_SO[tt.mau_so] ?? "Hóa đơn", true)}${the("KHMSHDon", tt.mau_so, true)}${the("KHHDon", tt.ky_hieu, true)}${the("SHDon", tt.so, true)}${the("NLap", tt.ngay_lap, true)}${the("DVTTe", "VND", true)}${the("HTTToan", nhanHinhThuc(nd.hinh_thuc_tt))}</TTChung>`
    + `<NDHDon>`
    + `<NBan>${the("Ten", ban.ten, true)}${the("MST", ban.mst, true)}${the("DChi", ban.dia_chi, true)}${the("SDThoai", ban.dien_thoai)}${the("DCTDTu", ban.email)}${the("STKNHang", ban.so_tai_khoan)}${the("TNHang", ban.ngan_hang)}</NBan>`
    + `<NMua>${the("Ten", tenMua)}${the("MST", m.loai === "doanh_nghiep" ? m.mst : "")}${the("DChi", m.dia_chi)}${the("SDThoai", m.dien_thoai)}${the("CCCDan", m.loai === "ca_nhan" ? m.cccd : "")}${the("DCTDTu", m.email)}${the("HVTNMHang", nguoiMuaHang)}</NMua>`
    + `<DSHHDVu>${hang}</DSHHDVu>`
    + `<TToan><THTTLTSuat><LTSuat>${the("TSuat", nd.thue_suat, true)}${the("ThTien", nd.tong.truoc_thue, true)}${the("TThue", nd.tong.tien_thue, true)}</LTSuat></THTTLTSuat>`
    + `${the("TgTCThue", nd.tong.truoc_thue, true)}${the("TgTThue", nd.tong.tien_thue, true)}${the("TTCKTMai", nd.tong.ck_tm, true)}${the("TgTTTBSo", nd.tong.thanh_toan, true)}${the("TgTTTBChu", nd.tong.bang_chu, true)}</TToan>`
    + `</NDHDon></DLHDon></HDon>\n`;
}
export const tenTepXml = (tt: Pick<ThongTinHoaDon, "mau_so" | "ky_hieu" | "so">, mst: string) => `${mst}_${tt.mau_so}${tt.ky_hieu}_${String(tt.so).padStart(8, "0")}.xml`;
export const soHienThi = (so: number | string | null | undefined) => (so == null || so === "" ? "" : String(so).padStart(8, "0"));

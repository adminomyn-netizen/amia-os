// Lọc hoá đơn điện tử theo nơi nhận tiền. Danh sách tài khoản nhận tiền KHÔNG cố định trong mã: lấy từ bảng tai_khoan_ngan_hang (Cài đặt › Tài khoản Ngân Hàng).
// Hàm thuần: không chạm DB; nhận danh sách tên ngắn của các tài khoản đang hoạt động ("OCB", "Techcombank", "Vietcombank"…).
import { chuanTenNganHang, coNganHang } from "@/lib/ngan-hang-ten";

/** Mã nhóm lọc: tên ngắn của một tài khoản trong danh sách, hoặc một trong ba mã đặc biệt dưới đây. */
export type NhomLoc = string;
export const KHAC = "_khac", CHUA_RO = "_chua_ro", TIEN_MAT = "_tm";
export const NHAN_CHUA_RO = "Tài khoản công ty (chưa rõ)";

/** Các chip lọc: từng tài khoản đang dùng (đúng thứ tự danh sách), rồi Ngân hàng khác (không có trong danh sách), Tài khoản công ty (chưa rõ), Tiền mặt. */
export function dsNhomLoc(taiKhoan: string[]): { ma: NhomLoc; nhan: string }[] {
  return [...taiKhoan.map((t) => ({ ma: t, nhan: t })), { ma: KHAC, nhan: "Ngân hàng khác" }, { ma: CHUA_RO, nhan: NHAN_CHUA_RO }, { ma: TIEN_MAT, nhan: "Tiền mặt" }];
}
/** Mặc định (chị Dung): chọn mọi tài khoản trong danh sách; thanh toán chưa rõ ngân hàng coi là vào tài khoản công ty nên cũng nằm trong mặc định. */
export const locMacDinh = (taiKhoan: string[]): NhomLoc[] => [...taiKhoan, CHUA_RO];

/** Đọc ?nh=… : không có → mặc định; "all" → null (không lọc); danh sách mã cách nhau dấu phẩy → các nhóm còn tồn tại (không còn mã nào hợp lệ → mặc định). */
export function docNhomLoc(raw: string | null | undefined, taiKhoan: string[]): NhomLoc[] | null {
  const s = (raw ?? "").trim();
  if (!s) return locMacDinh(taiKhoan);
  if (s === "all") return null;
  const hopLe = new Set(dsNhomLoc(taiKhoan).map((n) => n.ma));
  const ds = [...new Set(s.split(",").map((x) => x.trim()).filter((x) => hopLe.has(x)))];
  return ds.length ? ds : locMacDinh(taiKhoan);
}
export const ghiNhomLoc = (nh: NhomLoc[] | null) => (nh === null ? "all" : nh.join(","));

/** Tên ngắn các tài khoản nhận tiền từ các dòng tai_khoan_ngan_hang (bỏ trùng, giữ thứ tự). */
export const tenTaiKhoan = (dong: { ngan_hang: string }[]): string[] => [...new Set(dong.map((d) => chuanTenNganHang(d.ngan_hang)).filter((t): t is string => !!t))];

export type KhoanThuHddt = { loai: string; phuong_thuc: string; so_tien: number | string; ngan_hang: string | null };
export type TomTatThu = {
  /** Chuyển khoản + quẹt thẻ gộp theo ngân hàng (ten null = chưa rõ ngân hàng), đã trừ hoàn; chỉ giữ số dương. */
  nganHang: { ten: string | null; tien: number }[];
  tienMat: number;
  theTien: number;
  nhom: NhomLoc[];
};

/** Nhóm lọc của một ngân hàng: có trong danh sách tài khoản → chính nó; không ghi ngân hàng → chưa rõ (coi là tài khoản công ty); còn lại → ngân hàng khác. */
export function nhomCuaNganHang(ten: string | null | undefined, taiKhoan: string[]): NhomLoc {
  const t = chuanTenNganHang(ten);
  return !t ? CHUA_RO : taiKhoan.includes(t) ? t : KHAC;
}

/** Gom các dòng thanh_toan của MỘT hoá đơn: tổng tiền theo từng ngân hàng, tiền mặt, trừ thẻ tiền. Hoá đơn "thuộc nhóm X" nếu có khoản thu ròng dương vào nhóm đó. */
export function tomTatThu(khoan: KhoanThuHddt[], taiKhoan: string[] = []): TomTatThu {
  const nh = new Map<string, number>(), KHONG_RO = "\u0000";
  let tm = 0, tt = 0;
  for (const k of khoan) {
    const dau = k.loai === "hoan" ? -1 : 1, tien = Number(k.so_tien) * dau;
    if (!Number.isFinite(tien)) continue;
    if (k.phuong_thuc === "tien_mat") tm += tien;
    else if (k.phuong_thuc === "the_tien") tt += tien;
    else if (coNganHang(k.phuong_thuc)) { const ten = chuanTenNganHang(k.ngan_hang) ?? KHONG_RO; nh.set(ten, (nh.get(ten) ?? 0) + tien); }
  }
  const nganHang = [...nh.entries()].filter(([, v]) => v > 0).map(([ten, tien]) => ({ ten: ten === KHONG_RO ? null : ten, tien })).sort((a, b) => b.tien - a.tien || String(a.ten).localeCompare(String(b.ten)));
  const co = new Set<NhomLoc>();
  for (const x of nganHang) co.add(nhomCuaNganHang(x.ten, taiKhoan));
  if (tm > 0) co.add(TIEN_MAT);
  return { nganHang, tienMat: Math.max(tm, 0), theTien: Math.max(tt, 0), nhom: dsNhomLoc(taiKhoan).map((n) => n.ma).filter((m) => co.has(m)) };
}

/** Hoá đơn có qua lọc không: lọc null = lấy hết; ngược lại cần có ít nhất một nhóm trùng. */
export const khopNhomLoc = (tt: TomTatThu, loc: NhomLoc[] | null) => loc === null || tt.nhom.some((m) => loc.includes(m));

/** Chữ ngắn cho dòng: "Techcombank 2.000.000 · Tiền mặt 500.000". */
export function chuThu(tt: TomTatThu, dinhDang: (n: number) => string): string[] {
  const ra = tt.nganHang.map((x) => `${x.ten ?? NHAN_CHUA_RO} ${dinhDang(x.tien)}`);
  if (tt.tienMat > 0) ra.push(`Tiền mặt ${dinhDang(tt.tienMat)}`);
  if (tt.theTien > 0) ra.push(`Trừ thẻ tiền ${dinhDang(tt.theTien)}`);
  return ra;
}

/** Bấm một chip lọc: đang "Tất cả" thì chỉ chọn nhóm đó; đang chọn thì bỏ ra (bỏ hết = Tất cả); chưa chọn thì thêm vào (giữ thứ tự chip). */
export function chuyenNhomLoc(dang: NhomLoc[] | null, ma: NhomLoc, taiKhoan: string[]): NhomLoc[] | null {
  if (dang === null) return [ma];
  if (dang.includes(ma)) { const con = dang.filter((x) => x !== ma); return con.length ? con : null; }
  return dsNhomLoc(taiKhoan).map((n) => n.ma).filter((m) => m === ma || dang.includes(m));
}

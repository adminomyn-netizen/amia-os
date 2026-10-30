// Lọc hoá đơn điện tử theo nơi nhận tiền (Techcombank / Vietcombank / ngân hàng khác / tiền mặt). Hàm thuần: không chạm DB.
import { chuanTenNganHang, coNganHang } from "@/lib/ngan-hang-ten";

export type NhomLoc = "tech" | "vcb" | "khac" | "tm";
export const NHOM_LOC: { ma: NhomLoc; nhan: string }[] = [
  { ma: "tech", nhan: "Techcombank" }, { ma: "vcb", nhan: "Vietcombank" }, { ma: "khac", nhan: "Ngân hàng khác" }, { ma: "tm", nhan: "Tiền mặt" },
];
/** Chị Dung (kế toán) chốt: mặc định chỉ xem các khoản thu vào Techcombank và Vietcombank. */
export const LOC_MAC_DINH: NhomLoc[] = ["tech", "vcb"];
const HOP_LE = new Set<string>(NHOM_LOC.map((n) => n.ma));

/** Đọc ?nh=… : không có → mặc định; "all" → null (không lọc); danh sách mã cách nhau dấu phẩy → các nhóm hợp lệ (không còn mã nào hợp lệ → mặc định). */
export function docNhomLoc(raw: string | null | undefined): NhomLoc[] | null {
  const s = (raw ?? "").trim();
  if (!s) return [...LOC_MAC_DINH];
  if (s === "all") return null;
  const ds = [...new Set(s.split(",").map((x) => x.trim()).filter((x) => HOP_LE.has(x)))] as NhomLoc[];
  return ds.length ? ds : [...LOC_MAC_DINH];
}
export const ghiNhomLoc = (nh: NhomLoc[] | null) => (nh === null ? "all" : nh.join(","));

export type KhoanThuHddt = { loai: string; phuong_thuc: string; so_tien: number | string; ngan_hang: string | null };
export type TomTatThu = {
  /** Chuyển khoản + quẹt thẻ gộp theo ngân hàng (ten null = chưa rõ ngân hàng), đã trừ hoàn; chỉ giữ số dương. */
  nganHang: { ten: string | null; tien: number }[];
  tienMat: number;
  theTien: number;
  nhom: NhomLoc[];
};

/** Nhóm lọc của một ngân hàng: Techcombank, Vietcombank, còn lại (kể cả chưa rõ ngân hàng) là "khac". */
export function nhomCuaNganHang(ten: string | null | undefined): NhomLoc {
  const t = chuanTenNganHang(ten);
  return t === "Techcombank" ? "tech" : t === "Vietcombank" ? "vcb" : "khac";
}

/** Gom các dòng thanh_toan của MỘT hoá đơn: tổng tiền theo từng ngân hàng, tiền mặt, trừ thẻ tiền. Hoá đơn "thuộc nhóm X" nếu có khoản thu ròng dương vào nhóm đó. */
export function tomTatThu(khoan: KhoanThuHddt[]): TomTatThu {
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
  const nhom = new Set<NhomLoc>();
  for (const x of nganHang) nhom.add(nhomCuaNganHang(x.ten));
  if (tm > 0) nhom.add("tm");
  return { nganHang, tienMat: Math.max(tm, 0), theTien: Math.max(tt, 0), nhom: NHOM_LOC.map((n) => n.ma).filter((m) => nhom.has(m)) };
}

/** Hoá đơn có qua lọc không: lọc null = lấy hết; ngược lại cần có ít nhất một nhóm trùng. */
export const khopNhomLoc = (tt: TomTatThu, loc: NhomLoc[] | null) => loc === null || tt.nhom.some((m) => loc.includes(m));

/** Chữ ngắn cho dòng: "Techcombank 2.000.000 · Tiền mặt 500.000". */
export function chuThu(tt: TomTatThu, dinhDang: (n: number) => string): string[] {
  const ra = tt.nganHang.map((x) => `${x.ten ?? "Ngân hàng chưa rõ"} ${dinhDang(x.tien)}`);
  if (tt.tienMat > 0) ra.push(`Tiền mặt ${dinhDang(tt.tienMat)}`);
  if (tt.theTien > 0) ra.push(`Trừ thẻ tiền ${dinhDang(tt.theTien)}`);
  return ra;
}

/** Bấm một chip lọc: đang "Tất cả" thì chỉ chọn nhóm đó; đang chọn thì bỏ ra (bỏ hết = Tất cả); chưa chọn thì thêm vào. */
export function chuyenNhomLoc(dang: NhomLoc[] | null, ma: NhomLoc): NhomLoc[] | null {
  if (dang === null) return [ma];
  if (dang.includes(ma)) { const con = dang.filter((x) => x !== ma); return con.length ? con : null; }
  return NHOM_LOC.map((n) => n.ma).filter((m) => m === ma || dang.includes(m));
}

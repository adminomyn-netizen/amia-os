// Báo cáo hiệu quả voucher (thẻ giảm giá) ở tab Báo cáo. Nguồn: hoá đơn có giam_voucher > 0 trong khoảng ngày + sổ lượt dùng voucher_luot_dung (chỉ thêm dòng).
// Một lượt "dùng" bị "hoàn" (huỷ hoá đơn) thì không tính. Doanh thu = tổng khách phải trả của các đơn còn hiệu lực dùng voucher đó.
import type { sb } from "@/lib/db";

type Db = ReturnType<typeof sb>;
export type LuotVoucher = { voucher_id: string; hoa_don_id: string; loai: "dung" | "hoan"; so_tien: number; khach_id: string | null };
export type DonVoucher = { id: string; tongHang: number; tongPhaiThu: number };
export type ThongTinVoucher = { id: string; ten: string; tuNgay: string; denNgay: string; soLuong: number; biKhoa: boolean };
export type DongVoucher = {
  id: string; ten: string; tuNgay: string; denNgay: string; biKhoa: boolean; soLuong: number;
  soLuot: number; soKhach: number; tienGiam: number; tongHang: number; doanhThu: number; soHoan: number;
  /** Tiền giảm / tổng tiền hàng của các đơn dùng voucher (%). */
  tiLeGiam: number;
  /** Số lượt đã dùng từ trước tới nay (không chỉ trong khoảng lọc) / số lượng phát hành (%). */
  daDungTatCa: number; tiLeDung: number;
};

/** Gom theo từng voucher. `luotTrongKy`: lượt của các đơn trong khoảng lọc; `luotTatCa`: mọi lượt của các voucher đó (để tính tỉ lệ đã dùng). */
export function tongHopVoucher(luotTrongKy: LuotVoucher[], don: Map<string, DonVoucher>, ds: ThongTinVoucher[], luotTatCa: LuotVoucher[]): DongVoucher[] {
  const ra: DongVoucher[] = [];
  for (const v of ds) {
    const dung = luotTrongKy.filter((l) => l.voucher_id === v.id && l.loai === "dung");
    const hoan = new Set(luotTrongKy.filter((l) => l.voucher_id === v.id && l.loai === "hoan").map((l) => l.hoa_don_id));
    const con = dung.filter((l) => !hoan.has(l.hoa_don_id));
    const khach = new Set(con.map((l) => l.khach_id).filter(Boolean));
    const tienGiam = con.reduce((s, l) => s + Number(l.so_tien), 0);
    const tongHang = con.reduce((s, l) => s + (don.get(l.hoa_don_id)?.tongHang ?? 0), 0);
    const doanhThu = con.reduce((s, l) => s + (don.get(l.hoa_don_id)?.tongPhaiThu ?? 0), 0);
    const tatCa = luotTatCa.filter((l) => l.voucher_id === v.id).reduce((s, l) => s + (l.loai === "dung" ? 1 : -1), 0);
    ra.push({
      id: v.id, ten: v.ten, tuNgay: v.tuNgay, denNgay: v.denNgay, biKhoa: v.biKhoa, soLuong: v.soLuong,
      soLuot: con.length, soKhach: khach.size, tienGiam, tongHang, doanhThu, soHoan: hoan.size,
      tiLeGiam: tongHang > 0 ? (tienGiam / tongHang) * 100 : 0,
      daDungTatCa: tatCa, tiLeDung: v.soLuong > 0 ? (tatCa / v.soLuong) * 100 : 0,
    });
  }
  return ra.sort((a, b) => b.soLuot - a.soLuot || b.tienGiam - a.tienGiam || a.ten.localeCompare(b.ten, "vi"));
}

const CHUNK = 150;
/** Đọc dữ liệu rồi gom. Voucher hiện ra nếu có lượt dùng trong khoảng lọc, hoặc đang trong thời gian chạy (kể cả chưa ai dùng, để thấy voucher "không hiệu quả"). */
export async function layBaoCaoVoucher(db: Db, tu: string, den: string, cn?: string) {
  let q = db.from("hoa_don").select("id, tong_hang, tong_phai_thu").gt("giam_voucher", 0).gte("ngay_hd", tu).lte("ngay_hd", den);
  if (cn) q = q.eq("chi_nhanh_id", cn);
  const { data: hd } = await q.limit(5000);
  const don = new Map((hd ?? []).map((h) => [h.id, { id: h.id, tongHang: Number(h.tong_hang), tongPhaiThu: Number(h.tong_phai_thu) }]));
  const luot: LuotVoucher[] = [];
  const ids = [...don.keys()];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data } = await db.from("voucher_luot_dung").select("voucher_id, hoa_don_id, loai, so_tien, khach_id").in("hoa_don_id", ids.slice(i, i + CHUNK));
    luot.push(...((data ?? []) as LuotVoucher[]));
  }
  // Lượt "hoan" của đơn đã huỷ vẫn nằm trong luot (cùng hoa_don_id), nên đơn huỷ tự bị loại; đơn huỷ vẫn nằm trong don nhưng không còn lượt "dung" hiệu lực.
  const co = new Set(luot.map((l) => l.voucher_id));
  const { data: vs } = await db.from("voucher").select("id, ten, tu_ngay, den_ngay, so_luong, bi_khoa").or(`id.in.(${[...co].join(",") || "00000000-0000-0000-0000-000000000000"}),and(tu_ngay.lte.${den},den_ngay.gte.${tu})`);
  const ds: ThongTinVoucher[] = (vs ?? []).map((v) => ({ id: v.id, ten: v.ten, tuNgay: v.tu_ngay, denNgay: v.den_ngay, soLuong: v.so_luong, biKhoa: v.bi_khoa }));
  const tatCa: LuotVoucher[] = [];
  const vIds = ds.map((v) => v.id);
  for (let i = 0; i < vIds.length; i += CHUNK) {
    const { data } = await db.from("voucher_luot_dung").select("voucher_id, hoa_don_id, loai, so_tien, khach_id").in("voucher_id", vIds.slice(i, i + CHUNK)).limit(20000);
    tatCa.push(...((data ?? []) as LuotVoucher[]));
  }
  return tongHopVoucher(luot, don, ds, tatCa);
}

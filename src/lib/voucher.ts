// Thẻ giảm giá / voucher ở Thu ngân (migration 0080, theo SalonHero). Chỉ dùng ở máy chủ.
// DB kiểm lại lần cuối khi chốt đơn (chot_hoa_don_voucher); ở đây kiểm sớm để báo lỗi dễ hiểu và để màn Bán hàng hiện danh sách voucher dùng được.
import type { sb } from "@/lib/db";
import { GIOI_HAN_VOUCHER, tinhGiamVoucher, type GioiHanVoucher, type VoucherDon } from "@/lib/ban-hang";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";

export const chuanMaVoucher = (s: string | null | undefined) => (s ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
export const NHAN_THU = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "C.Nhật"];
export const nhanGioiHan = (g: string) => GIOI_HAN_VOUCHER.find((x) => x.gia_tri === g)?.nhan ?? g;
/** Chữ "Giảm giá" hiện ở danh sách: 10% (tối đa 200.000 ₫) hoặc số tiền. */
export const chuGiamGia = (v: { loai_giam: string; gia_tri: number | string; giam_toi_da: number | string | null }) =>
  v.loai_giam === "phan_tram" ? `${Number(v.gia_tri)}%${v.giam_toi_da ? ` (tối đa ${tienVN(Number(v.giam_toi_da))})` : ""}` : tienVN(Number(v.gia_tri));

export type VoucherTim = {
  id: string; maId: string; ma: string; ten: string; donToiThieu: number; def: VoucherDon; tuNgay: string; denNgay: string; tuDong: boolean;
  /** Chữ hiện ở cột "Giảm giá" và "Áp dụng cho" của hộp chọn voucher. */
  giamGia: string; apDung: string;
};
type Ctx = { chiNhanhId: string; khachId: string | null };
type Db = ReturnType<typeof sb>;
type VRow = { id: string; ten: string; tu_ngay: string; den_ngay: string; loai_giam: string; gia_tri: number; giam_toi_da: number | null; so_luong: number; loai_ma: string; gioi_han: string; don_toi_thieu: number;
  so_lan_toi_da_khach: number | null; hang_khach: string[] | null; khach_moi_cu: string | null; chi_nhanh_ids: string[] | null; ngay_trong_tuan: number[] | null; hien_thi_tim_kiem: string; bi_khoa: boolean };

const thuHomNay = () => { const d = new Date(`${homNayHCM()}T00:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; };
const dem = (l: { loai: string }[] | null) => (l ?? []).reduce((s, x) => s + (x.loai === "dung" ? 1 : -1), 0);

/** Kiểm các điều kiện không phụ thuộc dòng hàng. Trả lời lỗi bằng tiếng Việt, hoặc "" nếu dùng được. `maId` null = kiểm cho cả voucher (danh sách). */
async function kiemDieuKien(db: Db, v: VRow, maId: string | null, ma: string, c: Ctx): Promise<string> {
  if (v.bi_khoa) return `Voucher ${ma} đang bị khoá.`;
  const nay = homNayHCM();
  if (v.tu_ngay > nay) return `Voucher ${ma} chưa đến ngày dùng (từ ${ngayVN(v.tu_ngay)}).`;
  if (v.den_ngay < nay) return `Voucher ${ma} đã hết hạn ngày ${ngayVN(v.den_ngay)}.`;
  if (v.chi_nhanh_ids && !v.chi_nhanh_ids.includes(c.chiNhanhId)) return `Voucher ${ma} không áp dụng cho chi nhánh này.`;
  if (v.ngay_trong_tuan && !v.ngay_trong_tuan.includes(thuHomNay())) return `Voucher ${ma} không áp dụng cho ngày hôm nay trong tuần.`;
  const { data: l } = await db.from("voucher_luot_dung").select("loai, ma_id, khach_id").eq("voucher_id", v.id);
  if (dem(l) >= v.so_luong || (v.loai_ma === "nhieu_ma" && maId && dem((l ?? []).filter((x) => x.ma_id === maId)) >= 1)) return `Voucher ${ma} đã hết mã (hết lượt dùng).`;
  if (v.hang_khach || v.khach_moi_cu || v.so_lan_toi_da_khach) {
    if (!c.khachId) return `Voucher ${ma} chỉ áp dụng khi đã chọn khách hàng.`;
    if (v.hang_khach) {
      const { data: k } = await db.from("v_khach_hang").select("hang").eq("id", c.khachId).maybeSingle();
      if (!k?.hang || !v.hang_khach.includes(k.hang)) return `Voucher ${ma} không áp dụng cho hạng khách này (hạng ${k?.hang ?? "chưa có"}).`;
    }
    if (v.khach_moi_cu) {
      const { count } = await db.from("hoa_don").select("id", { count: "exact", head: true }).eq("khach_id", c.khachId).eq("trang_thai", "hoan_thanh");
      if ((count ?? 0) > 0 !== (v.khach_moi_cu === "cu")) return `Voucher ${ma} chỉ áp dụng cho khách ${v.khach_moi_cu === "moi" ? "mới" : "quay lại"}.`;
    }
    if (v.so_lan_toi_da_khach && dem((l ?? []).filter((x) => x.khach_id === c.khachId)) >= v.so_lan_toi_da_khach) return `Khách này đã dùng voucher ${ma} đủ ${v.so_lan_toi_da_khach} lần.`;
  }
  return "";
}

const thanh = (v: VRow, ma: string, maId: string): VoucherTim => ({
  id: v.id, maId, ma, ten: v.ten, donToiThieu: Number(v.don_toi_thieu), tuNgay: v.tu_ngay, denNgay: v.den_ngay, tuDong: v.hien_thi_tim_kiem === "tu_dong",
  def: { loai_giam: v.loai_giam as VoucherDon["loai_giam"], gia_tri: Number(v.gia_tri), giam_toi_da: v.giam_toi_da == null ? null : Number(v.giam_toi_da), gioi_han: v.gioi_han as GioiHanVoucher },
  giamGia: chuGiamGia(v), apDung: `${nhanGioiHan(v.gioi_han)}${Number(v.don_toi_thieu) > 0 ? ` · đơn từ ${tienVN(Number(v.don_toi_thieu))}` : ""}`,
});

/** Nút "Kiểm tra mã": tìm mã, kiểm hạn, chi nhánh, hạng khách, lượt dùng. Chưa xét dòng hàng. */
export async function timVoucher(db: Db, maNhap: string, c: Ctx): Promise<{ ok: true; v: VoucherTim } | { ok: false; loi: string }> {
  const ma = chuanMaVoucher(maNhap);
  if (!ma) return { ok: false, loi: "Nhập mã voucher." };
  if (!c.chiNhanhId) return { ok: false, loi: "Chọn chi nhánh bán trước khi kiểm tra mã." };
  const { data: m } = await db.from("voucher_ma").select("id, voucher_id").eq("ma", ma).maybeSingle();
  const { data: v } = m ? await db.from("voucher").select("*").eq("id", m.voucher_id).maybeSingle() : { data: null };
  if (!m || !v) return { ok: false, loi: `Không có voucher ${ma}.` };
  const loi = await kiemDieuKien(db, v as VRow, m.id, ma, c);
  return loi ? { ok: false, loi } : { ok: true, v: thanh(v as VRow, ma, m.id) };
}

/** Danh sách trong hộp "Áp dụng voucher": voucher đang dùng được ở chi nhánh/khách này, "Hiển thị trên tìm kiếm thu ngân" khác "Không", loại 1 mã dùng nhiều lần (loại nhiều mã phải gõ mã). */
export async function dsVoucherThuNgan(db: Db, c: Ctx): Promise<VoucherTim[]> {
  const nay = homNayHCM();
  const { data: vs } = await db.from("voucher").select("*").eq("loai_ma", "mot_ma").neq("hien_thi_tim_kiem", "khong").eq("bi_khoa", false).lte("tu_ngay", nay).gte("den_ngay", nay).order("den_ngay").limit(50);
  const ra: VoucherTim[] = [];
  for (const v of (vs ?? []) as VRow[]) {
    const { data: m } = await db.from("voucher_ma").select("id, ma").eq("voucher_id", v.id).limit(1).maybeSingle();
    if (m && !(await kiemDieuKien(db, v, m.id, m.ma, c))) ra.push(thanh(v, m.ma, m.id));
  }
  return ra;
}

/** Voucher áp vào các dòng cụ thể: kiểm đơn tối thiểu và dòng áp dụng, trả tiền giảm. */
export function giamTheoDong(v: VoucherTim, dong: { loai: string; thanh: number }[]): { ok: true; tien: number } | { ok: false; loi: string } {
  const hang = dong.reduce((s, d) => s + d.thanh, 0);
  if (hang < v.donToiThieu) return { ok: false, loi: `Voucher ${v.ma} chỉ áp dụng cho đơn từ ${tienVN(v.donToiThieu)}.` };
  const tien = tinhGiamVoucher(v.def, dong);
  if (tien <= 0) return { ok: false, loi: `Voucher ${v.ma} không áp dụng được cho dòng hàng nào của đơn (giới hạn: ${nhanGioiHan(v.def.gioi_han)}).` };
  return { ok: true, tien };
}

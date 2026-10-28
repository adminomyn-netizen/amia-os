// Báo cáo "Đánh giá nhân viên" theo đơn hàng (migration 0082). Dùng chung cho trang Báo cáo và nút Xuất Excel để số trên màn hình và trong tệp luôn khớp.
// Theo SalonHero (Báo cáo › Đánh giá nhân viên): Ngày · Mã hóa đơn · Tên Nhân Viên · Đánh giá · Ý kiến đánh giá · Dịch vụ đã thực hiện; lọc theo số sao và tìm theo tên nhân viên.
// Khoảng ngày lọc theo NGÀY HOÁ ĐƠN; chỉ tính hoá đơn còn hoàn thành (huỷ rồi thì đánh giá không tính).
import type { sb } from "@/lib/db";

type Db = ReturnType<typeof sb>;
export type DongDanhGia = { id: string; ngay: string; hoaDonId: string; ma: string; nhanVienId: string; ten: string; diem: number; yKien: string; chiNhanhId: string; dichVu: string; luc: string };
export type TongNhanVien = { nhanVienId: string; ten: string; so: number; tb: number; phanBo: [number, number, number, number, number] };

const cum = <T,>(ds: T[], n: number) => Array.from({ length: Math.ceil(ds.length / n) }, (_, i) => ds.slice(i * n, i * n + n));

/** Mọi đánh giá của hoá đơn hoàn thành trong khoảng ngày (tối đa 5.000 dòng mới nhất). */
export async function layDanhGia(db: Db, tu: string, den: string, cn: string | undefined): Promise<DongDanhGia[]> {
  let q = db.from("danh_gia_nhan_vien").select("id, diem, y_kien, nhan_vien_id, hoa_don_id, tao_luc, sua_luc, hoa_don!inner(ma, ngay_hd, chi_nhanh_id, trang_thai)")
    .eq("hoa_don.trang_thai", "hoan_thanh").gte("hoa_don.ngay_hd", tu).lte("hoa_don.ngay_hd", den);
  if (cn) q = q.eq("hoa_don.chi_nhanh_id", cn);
  const { data, error } = await q.order("tao_luc", { ascending: false }).limit(5000);
  if (error) throw new Error(error.message);
  const ds = data ?? [];
  const idNv = [...new Set(ds.map((d) => d.nhan_vien_id))];
  const idHd = [...new Set(ds.map((d) => d.hoa_don_id))];
  const ten = new Map<string, string>();
  for (const c of cum(idNv, 200)) for (const n of (await db.from("nhan_vien").select("id, ho_ten").in("id", c)).data ?? []) ten.set(n.id, n.ho_ten);
  // Dịch vụ đã thực hiện = các dòng hàng mà nhân viên đó đứng vai Phục vụ.
  const dv = new Map<string, string[]>();
  for (const c of cum(idHd, 100)) {
    const { data: dong } = await db.from("hoa_don_dong").select("id, hoa_don_id, ten").in("hoa_don_id", c);
    const idDong = (dong ?? []).map((d) => d.id);
    const { data: chia } = idDong.length ? await db.from("dong_nhan_vien").select("dong_id, nhan_vien_id").eq("vai", "phuc_vu").in("dong_id", idDong) : { data: [] };
    const hdCua = new Map((dong ?? []).map((d) => [d.id, d]));
    for (const x of chia ?? []) { const d = hdCua.get(x.dong_id); if (d) dv.set(`${d.hoa_don_id}|${x.nhan_vien_id}`, [...(dv.get(`${d.hoa_don_id}|${x.nhan_vien_id}`) ?? []), d.ten]); }
  }
  return ds.map((d) => ({
    id: d.id, ngay: d.hoa_don.ngay_hd, hoaDonId: d.hoa_don_id, ma: d.hoa_don.ma, nhanVienId: d.nhan_vien_id, ten: ten.get(d.nhan_vien_id) ?? "", diem: d.diem, yKien: d.y_kien ?? "",
    chiNhanhId: d.hoa_don.chi_nhanh_id, dichVu: (dv.get(`${d.hoa_don_id}|${d.nhan_vien_id}`) ?? []).join(", "), luc: d.sua_luc ?? d.tao_luc,
  })).sort((a, b) => (a.ngay === b.ngay ? b.luc.localeCompare(a.luc) : b.ngay.localeCompare(a.ngay)));
}

/** Trung bình sao, số đánh giá, phân bố 1–5 theo từng nhân viên (nhiều đánh giá nhất trước). */
export function tongTheoNhanVien(ds: DongDanhGia[]): TongNhanVien[] {
  const m = new Map<string, TongNhanVien & { tong: number }>();
  for (const d of ds) {
    const t = m.get(d.nhanVienId) ?? { nhanVienId: d.nhanVienId, ten: d.ten, so: 0, tb: 0, phanBo: [0, 0, 0, 0, 0] as TongNhanVien["phanBo"], tong: 0 };
    t.so += 1; t.tong += d.diem; t.phanBo[d.diem - 1] += 1;
    m.set(d.nhanVienId, t);
  }
  return [...m.values()].map(({ tong, ...t }) => ({ ...t, tb: tong / t.so })).sort((a, b) => b.so - a.so || b.tb - a.tb);
}
export const trungBinh = (ds: { diem: number }[]) => (ds.length ? ds.reduce((s, d) => s + d.diem, 0) / ds.length : 0);
export const chuSao = (n: number) => n.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

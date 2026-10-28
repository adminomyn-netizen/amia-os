// Quy đổi điểm thưởng theo hạng khách (cấu hình bảng hang_diem_cau_hinh, migration 0088). Hàm thuần: cùng công thức với hàm DB diem_tich_duoc / diem_ra_tien.
// CHƯA gắn vào Thu ngân: app chưa tự tích điểm cho hoá đơn mới (chờ chị Lâm chốt luật); đổi điểm ở Thu ngân vẫn theo cài đặt chung diem.doi_*.
import type { sb } from "@/lib/db";

export const HANG_KHACH = ["Thường", "Bạc", "Vàng", "Bạch kim", "Kim cương"] as const;
export type CauHinhHang = { hang: string; tienMoiDiem: number; tienDoiMoiDiem: number };

/** Điểm tích được khi chi `soTien` đồng ở hạng `hang` (làm tròn xuống). Hạng chưa cấu hình hoặc số tiền ≤ 0 → 0. */
export function diemTichDuoc(cauHinh: CauHinhHang[], hang: string, soTien: number): number {
  const c = cauHinh.find((x) => x.hang === hang);
  return c && soTien > 0 && c.tienMoiDiem > 0 ? Math.floor(soTien / c.tienMoiDiem) : 0;
}
/** Số tiền giảm khi đổi `diem` điểm ở hạng `hang`. */
export function diemRaTien(cauHinh: CauHinhHang[], hang: string, diem: number): number {
  const c = cauHinh.find((x) => x.hang === hang);
  return c && diem > 0 ? Math.round(diem * c.tienDoiMoiDiem) : 0;
}

export async function docCauHinhHang(db: ReturnType<typeof sb>): Promise<CauHinhHang[]> {
  const [{ data }, { data: hang }] = await Promise.all([db.from("hang_diem_cau_hinh").select("hang, tien_moi_diem, tien_doi_moi_diem"), db.from("hang_khach").select("ten, thu_tu").order("thu_tu")]);
  const m = new Map((data ?? []).map((r) => [r.hang, r]));
  return (hang ?? []).flatMap((h) => { const r = m.get(h.ten); return r ? [{ hang: h.ten, tienMoiDiem: Number(r.tien_moi_diem), tienDoiMoiDiem: Number(r.tien_doi_moi_diem) }] : []; });
}

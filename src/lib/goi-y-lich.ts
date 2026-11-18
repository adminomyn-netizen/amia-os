import "server-only";
import { sb } from "@/lib/db";

/** Gợi ý lịch hẹn sắp đến theo dịch vụ (chị Diệu Thuý 18/11/2026, migration 0342 ds_goi_y_lich). */
export type DongGoiYLich = {
  tong: number; khach_id: string; ma: string; ho_ten: string; dien_thoai: string; dich_vu_id: string; ten_dich_vu: string; loai: "buoi_ke" | "tai_kham";
  so_ngay: number; lan_cuoi: string; den_han: string; so_ngay_con: number; ke_tiep_ngay: string | null; lich_sap_toi: string | null;
  trang_thai: string | null; ghi_chu: string | null; nhac_id: string | null; chi_nhanh_id: string | null;
};

export const NHAN_LOAI_GOI_Y: Record<string, string> = { buoi_ke: "Buổi kế tiếp", tai_kham: "Tái khám / chăm sóc sau" };

export type LocGoiY = { cn?: string | null; dichVu?: string; nhom?: string; loai?: string; baoTruoc?: number; treToiDa?: number; tt?: string; khach?: string; gioiHan?: number };

export async function docGoiYLich(l: LocGoiY): Promise<DongGoiYLich[]> {
  const { data, error } = await sb().rpc("ds_goi_y_lich", {
    ...(l.cn ? { p_cn: l.cn } : {}), ...(l.dichVu ? { p_dich_vu: l.dichVu } : {}), ...(l.nhom ? { p_nhom: l.nhom } : {}), ...(l.loai ? { p_loai: l.loai } : {}),
    ...(l.baoTruoc != null ? { p_bao_truoc: l.baoTruoc } : {}), ...(l.treToiDa != null ? { p_tre_toi_da: l.treToiDa } : {}), p_tt: l.tt ?? "can",
    ...(l.khach ? { p_khach: l.khach } : {}), p_gioi_han: l.gioiHan ?? 500,
  });
  if (error) { console.error("[ds_goi_y_lich]", error.message); throw new Error("Không đọc được gợi ý lịch hẹn, thử lại."); }
  return (data ?? []) as unknown as DongGoiYLich[];
}

/** Số khách đến hạn hôm nay hoặc đã quá hạn mà chưa xử lý (cho cảnh báo / nút ở trang Lịch hẹn). Lỗi thì trả 0, không làm vỡ trang. */
export async function demGoiYLichDenHan(cn: string | null): Promise<number> {
  try { return Number((await docGoiYLich({ cn, baoTruoc: 0, gioiHan: 1 }))[0]?.tong ?? 0); } catch { return 0; }
}

/** Ngưỡng mặc định (cau_hinh). */
export async function docNguongGoiY() {
  const { data } = await sb().from("cau_hinh").select("khoa, gia_tri").in("khoa", ["goi_y_lich_bao_truoc_ngay", "goi_y_lich_tre_toi_da_ngay"]);
  const m = new Map((data ?? []).map((r) => [r.khoa, Number(r.gia_tri)]));
  return { baoTruoc: m.get("goi_y_lich_bao_truoc_ngay") ?? 3, treToiDa: m.get("goi_y_lich_tre_toi_da_ngay") ?? 60 };
}

/** "150 ngày" → "5 tháng" cho dễ đọc. */
export const docSoNgay = (n: number) => (n >= 28 && n % 30 === 0 ? `${n / 30} tháng` : n % 7 === 0 && n >= 7 && n < 28 ? `${n / 7} tuần` : `${n} ngày`);

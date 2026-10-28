// "Các thiết lập khác" của SalonHero (#/othersettings): ngày tháng, tiền tệ & thuế. Lưu ở cau_hinh, khoá bắt đầu bằng "tl.".
// Giá trị mặc định = giá trị SalonHero đang dùng của AMIA (đọc 29/10/2026): VAT "Tuỳ chọn tại thu ngân" 10%, không khoá hoá đơn, phụ phí 0%, tip Tắt.
// CHƯA nối vào màn Thu ngân: AMIA hiện để ô VAT mặc định 0% và luôn có ô Tip; nối thì tổng tiền hoá đơn mới sẽ đổi → chờ chị Lâm chốt (xem sao-luu/chi-chinh-sau.md).
import type { sb } from "@/lib/db";

export const CHE_DO_THUE = [
  { gia_tri: "khong", nhan: "Không áp dụng cho mọi hoá đơn" },
  { gia_tri: "ap_dung", nhan: "Áp dụng cho mọi hoá đơn" },
  { gia_tri: "tuy_chon", nhan: "Tuỳ chọn tại thu ngân" },
] as const;
export type CheDoThue = (typeof CHE_DO_THUE)[number]["gia_tri"];
export const PHAN_TRAM_PHU_PHI = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 20, 25, 30] as const;

export type ThietLapKhac = { vatCheDo: CheDoThue; vatPct: number; khoaHdBat: boolean; khoaHdGio: number; phuPhiCheDo: CheDoThue; phuPhiPct: number; tipBat: boolean };
export const THIET_LAP_KHAC_MAC_DINH: ThietLapKhac = { vatCheDo: "tuy_chon", vatPct: 10, khoaHdBat: false, khoaHdGio: 0, phuPhiCheDo: "tuy_chon", phuPhiPct: 0, tipBat: false };

const KHOA = { vatCheDo: "tl.vat_che_do", vatPct: "tl.vat_pct", khoaHdBat: "tl.khoa_hd_bat", khoaHdGio: "tl.khoa_hd_gio", phuPhiCheDo: "tl.phu_phi_che_do", phuPhiPct: "tl.phu_phi_pct", tipBat: "tl.tip_bat" } as const;
const GHI_CHU: Record<keyof ThietLapKhac, string> = {
  vatCheDo: "Thuế VAT trên hoá đơn: khong | ap_dung | tuy_chon (SalonHero: Tuỳ chọn tại thu ngân)", vatPct: "% VAT trên tổng hoá đơn (SalonHero: 10)",
  khoaHdBat: "1 = tự khoá hoá đơn sau số giờ bên dưới (chưa áp dụng trong app)", khoaHdGio: "Số giờ tự khoá hoá đơn (SalonHero: 0)",
  phuPhiCheDo: "Phụ phí dịch vụ trên hoá đơn: khong | ap_dung | tuy_chon", phuPhiPct: "% phụ phí dịch vụ (SalonHero: 0)", tipBat: "1 = bật tiền tip (SalonHero: Tắt)",
};
export const KHOA_THIET_LAP_KHAC = Object.values(KHOA);

export function docThietLapKhac(dong: { khoa: string; gia_tri: string }[] | null): ThietLapKhac {
  const m = new Map((dong ?? []).map((x) => [x.khoa, x.gia_tri]));
  const d = THIET_LAP_KHAC_MAC_DINH;
  const che = (v: string | undefined, mac: CheDoThue): CheDoThue => (CHE_DO_THUE.some((c) => c.gia_tri === v) ? (v as CheDoThue) : mac);
  const so = (v: string | undefined, mac: number) => { const n = Number(v); return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : mac; };
  return {
    vatCheDo: che(m.get(KHOA.vatCheDo), d.vatCheDo), vatPct: so(m.get(KHOA.vatPct), d.vatPct), khoaHdBat: m.get(KHOA.khoaHdBat) === "1", khoaHdGio: so(m.get(KHOA.khoaHdGio), d.khoaHdGio),
    phuPhiCheDo: che(m.get(KHOA.phuPhiCheDo), d.phuPhiCheDo), phuPhiPct: so(m.get(KHOA.phuPhiPct), d.phuPhiPct), tipBat: m.get(KHOA.tipBat) === "1",
  };
}

export async function layThietLapKhac(db: ReturnType<typeof sb>): Promise<ThietLapKhac> {
  const { data } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", KHOA_THIET_LAP_KHAC);
  return docThietLapKhac(data);
}

/** Kiểm tra giá trị người dùng gửi lên; trả lỗi tiếng Việt hoặc chuỗi rỗng. */
export function loiThietLapKhac(t: ThietLapKhac): string {
  if (!CHE_DO_THUE.some((c) => c.gia_tri === t.vatCheDo) || !CHE_DO_THUE.some((c) => c.gia_tri === t.phuPhiCheDo)) return "Chế độ thuế hoặc phụ phí chưa đúng.";
  if (!(t.vatPct >= 0 && t.vatPct <= 100)) return "VAT là số từ 0 đến 100 (%).";
  if (!Number.isInteger(t.khoaHdGio) || t.khoaHdGio < 0 || t.khoaHdGio > 8760) return "Số giờ tự khoá hoá đơn là số nguyên từ 0 đến 8760.";
  if (t.khoaHdBat && t.khoaHdGio < 1) return "Bật tự khoá hoá đơn thì nhập số giờ từ 1 trở lên.";
  if (!PHAN_TRAM_PHU_PHI.includes(t.phuPhiPct as (typeof PHAN_TRAM_PHU_PHI)[number])) return "Phụ phí chọn trong các mức 0% đến 30%.";
  return "";
}

export const dongThietLapKhac = (t: ThietLapKhac) => (Object.keys(KHOA) as (keyof ThietLapKhac)[]).map((k) => ({ khoa: KHOA[k], gia_tri: typeof t[k] === "boolean" ? (t[k] ? "1" : "0") : String(t[k]), ghi_chu: GHI_CHU[k] }));

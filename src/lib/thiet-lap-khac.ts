// "Các thiết lập khác" của SalonHero (#/othersettings): ngày tháng, tiền tệ & thuế. Lưu ở cau_hinh, khoá bắt đầu bằng "tl.".
// Giá trị mặc định = giá trị SalonHero đang dùng của AMIA (đọc 29/10/2026): VAT "Tuỳ chọn tại thu ngân" 10%, không khoá hoá đơn, phụ phí 0%, tip Tắt.
// Chị Lâm chốt 03/11/2026 "SalonHero làm sao AMIA làm y vậy": Thu ngân đọc các cài đặt này qua docCaiDatThuNgan() + macDinhThuNgan() bên dưới.
// Tự khoá hoá đơn: lưu thêm khoá hoa_don.khoa_sua_sau_gio (= số giờ khi bật, 0 khi tắt) — hàm Postgres mo_lai_hoa_don (0201/0209/0210) đọc khoá này
// và chặn "Sửa" hoá đơn đã chốt quá N giờ; public.hoa_don_da_khoa(id) / so_gio_khoa_hoa_don() (migration 0245) để màn hình hỏi trước.
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
  khoaHdBat: "1 = tự khoá hoá đơn sau số giờ bên dưới (áp dụng qua hoa_don.khoa_sua_sau_gio)", khoaHdGio: "Số giờ tự khoá hoá đơn (SalonHero: 0)",
  phuPhiCheDo: "Phụ phí dịch vụ trên hoá đơn: khong | ap_dung | tuy_chon", phuPhiPct: "% phụ phí dịch vụ (SalonHero: 0)", tipBat: "1 = bật tiền tip (SalonHero: Tắt)",
};
export const KHOA_THIET_LAP_KHAC = Object.values(KHOA);
/** Khoá cấu hình mà hàm Postgres mo_lai_hoa_don đọc để khoá sửa hoá đơn đã chốt quá N giờ (0 = không khoá). */
export const KHOA_GIO_KHOA_HD = "hoa_don.khoa_sua_sau_gio";

export function docThietLapKhac(dong: { khoa: string; gia_tri: string }[] | null): ThietLapKhac {
  const m = new Map((dong ?? []).map((x) => [x.khoa, x.gia_tri]));
  const d = THIET_LAP_KHAC_MAC_DINH;
  // Chưa lưu ô tự khoá ở màn này nhưng DB đã có hoa_don.khoa_sua_sau_gio (đặt bằng migration / tay) → hiện đúng số đang có hiệu lực.
  const gioDb = Number(m.get(KHOA_GIO_KHOA_HD));
  if (!m.has(KHOA.khoaHdBat) && Number.isInteger(gioDb) && gioDb > 0) { m.set(KHOA.khoaHdBat, "1"); m.set(KHOA.khoaHdGio, String(gioDb)); }
  const che = (v: string | undefined, mac: CheDoThue): CheDoThue => (CHE_DO_THUE.some((c) => c.gia_tri === v) ? (v as CheDoThue) : mac);
  const so = (v: string | undefined, mac: number) => { const n = Number(v); return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : mac; };
  return {
    vatCheDo: che(m.get(KHOA.vatCheDo), d.vatCheDo), vatPct: so(m.get(KHOA.vatPct), d.vatPct), khoaHdBat: m.get(KHOA.khoaHdBat) === "1", khoaHdGio: so(m.get(KHOA.khoaHdGio), d.khoaHdGio),
    phuPhiCheDo: che(m.get(KHOA.phuPhiCheDo), d.phuPhiCheDo), phuPhiPct: so(m.get(KHOA.phuPhiPct), d.phuPhiPct), tipBat: m.get(KHOA.tipBat) === "1",
  };
}

export async function layThietLapKhac(db: ReturnType<typeof sb>): Promise<ThietLapKhac> {
  const { data } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", [...KHOA_THIET_LAP_KHAC, KHOA_GIO_KHOA_HD]);
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

export const dongThietLapKhac = (t: ThietLapKhac) => [
  ...(Object.keys(KHOA) as (keyof ThietLapKhac)[]).map((k) => ({ khoa: KHOA[k], gia_tri: typeof t[k] === "boolean" ? (t[k] ? "1" : "0") : String(t[k]), ghi_chu: GHI_CHU[k] })),
  { khoa: KHOA_GIO_KHOA_HD, gia_tri: String(t.khoaHdBat ? t.khoaHdGio : 0), ghi_chu: "Số giờ sau khi chốt thì khoá Sửa hoá đơn (0 = không khoá). Ghi theo Cài đặt › Các thiết lập khác › Tự động khoá hoá đơn; mo_lai_hoa_don đọc khoá này." },
];

// ─── Cho màn Thu ngân (agent Thu ngân nối) ──────────────────────────────────
/** Cài đặt Thu ngân cần đọc: VAT, phụ phí, tip, tự khoá. Một lần đọc cau_hinh. */
export type CaiDatThuNgan = { vatCheDo: CheDoThue; vatPct: number; phuPhiCheDo: CheDoThue; phuPhiPct: number; tipBat: boolean; tuKhoaGio: number };
export async function docCaiDatThuNgan(db: ReturnType<typeof sb>): Promise<CaiDatThuNgan> {
  const t = await layThietLapKhac(db);
  return { vatCheDo: t.vatCheDo, vatPct: t.vatPct, phuPhiCheDo: t.phuPhiCheDo, phuPhiPct: t.phuPhiPct, tipBat: t.tipBat, tuKhoaGio: t.khoaHdBat ? t.khoaHdGio : 0 };
}

/** Cách màn Thu ngân áp cài đặt, như SalonHero:
 *  - VAT / phụ phí "Không áp dụng cho mọi hoá đơn" → 0, ẩn ô; "Áp dụng cho mọi hoá đơn" → tự áp % đã cài, không cho sửa;
 *    "Tuỳ chọn tại thu ngân" → mặc định chưa áp (0), thu ngân bật để áp đúng % đã cài.
 *  - Tip Tắt → ẩn ô tip (tip = 0); Bật → hiện ô tip nhập tay.
 *  hoa_don.vat_pct lưu %; hoa_don.phu_phi lưu SỐ TIỀN → dùng tienPhuPhi() để ra số tiền. */
export type ApDungThuNgan = {
  vat: { hien: boolean; choBatTat: boolean; pctKhiBat: number; pctMacDinh: number };
  phuPhi: { hien: boolean; choBatTat: boolean; pctKhiBat: number; pctMacDinh: number };
  tip: { hien: boolean };
};
export function macDinhThuNgan(c: Pick<CaiDatThuNgan, "vatCheDo" | "vatPct" | "phuPhiCheDo" | "phuPhiPct" | "tipBat">): ApDungThuNgan {
  const mot = (che: CheDoThue, pct: number) => ({ hien: che !== "khong" && pct > 0, choBatTat: che === "tuy_chon" && pct > 0, pctKhiBat: che === "khong" ? 0 : pct, pctMacDinh: che === "ap_dung" ? pct : 0 });
  return { vat: mot(c.vatCheDo, c.vatPct), phuPhi: mot(c.phuPhiCheDo, c.phuPhiPct), tip: { hien: c.tipBat } };
}

/** Số tiền phụ phí dịch vụ = % × tiền sau giảm giá đơn (cùng cơ sở với VAT trong tinhDon của ban-hang.ts), làm tròn đồng. */
export const tienPhuPhi = (sauGiam: number, pct: number) => (sauGiam > 0 && pct > 0 ? Math.round((sauGiam * pct) / 100) : 0);

/** Hoá đơn đã bị khoá sửa chưa (cùng luật hàm Postgres hoa_don_da_khoa / mo_lai_hoa_don): đã chốt và quá N giờ kể từ lúc chốt; N = 0 là không khoá. */
export function hoaDonDaKhoa(chotLuc: string | Date | null | undefined, soGio: number, bayGio: Date = new Date()): boolean {
  if (!chotLuc || !(soGio > 0)) return false;
  const t = new Date(chotLuc).getTime();
  return Number.isFinite(t) && t < bayGio.getTime() - soGio * 3_600_000;
}

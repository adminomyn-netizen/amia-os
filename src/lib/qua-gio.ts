// Quá giờ dịch vụ (chị Lâm 10/11/2026: "quá thời gian dịch vụ nó nổi thông báo ting ting ting liền").
// Phần tính toán thuần (không chạm DB), dùng chung cho chuông quá giờ trên trình duyệt, API /api/qua-gio và báo cáo "Thời gian dịch vụ".
import type { VaiTro } from "@/lib/quyen";

/** Một ca đang làm (lịch "Đang phục vụ") gửi xuống trình duyệt. */
export type CaDangLam = {
  id: string;
  khach: string;
  dichVu: string;
  nguoiLam: string;
  phong: string | null;
  /** Mốc bắt đầu làm (ISO). */
  batDau: string;
  /** true = lịch mở ca trước khi có mốc tự ghi (lấy giờ hẹn / giờ khách đến thay). */
  uocTinh: boolean;
  /** Thời lượng chuẩn (phút) = thời lượng đã đặt cho lịch. */
  chuanPhut: number;
};

const PHUT = 60_000;

/** Tổng thời lượng (phút) của các dịch vụ trên lịch, đọc từ danh mục dịch vụ (dich_vu.thoi_luong_phut × số lượng). 0 = không có số. */
export const tongPhutDichVu = (dv: { thoi_luong_phut: number | null | undefined; so_luong?: number | null }[]) =>
  dv.reduce((s, d) => s + Math.max(0, d.thoi_luong_phut ?? 0) * Math.max(1, d.so_luong ?? 1), 0);

/** Thời lượng chuẩn của một lịch (phút) = tổng thời lượng dịch vụ trong danh mục (theo bảng quy trình); lịch không có số đó thì lấy khoảng giờ đã đặt
 *  (ket_thuc − bat_dau). Lịch nhiều khách lấy khách lâu nhất. Tối thiểu 1 phút. */
export function thoiLuongChuan(p: { phutDichVu: number; batDau: string; ketThuc: string; khachDiCung?: (number | null | undefined)[] }): number {
  const datLich = Math.round((Date.parse(p.ketThuc) - Date.parse(p.batDau)) / PHUT);
  const chinh = p.phutDichVu > 0 ? p.phutDichVu : Number.isFinite(datLich) ? datLich : 0;
  return Math.max(1, chinh, ...(p.khachDiCung ?? []).map((x) => x ?? 0));
}

/** Mốc bắt đầu làm của ca: mốc tự ghi lúc bấm "Đang phục vụ"; lịch mở ca trước khi có mốc này thì lấy giờ muộn hơn giữa giờ hẹn và giờ khách đến. */
export function mocBatDau(l: { bat_dau_lam_luc: string | null; bat_dau: string; checkin_luc: string | null }): { batDau: string; uocTinh: boolean } {
  if (l.bat_dau_lam_luc) return { batDau: l.bat_dau_lam_luc, uocTinh: false };
  const den = l.checkin_luc && Date.parse(l.checkin_luc) > Date.parse(l.bat_dau) ? l.checkin_luc : l.bat_dau;
  return { batDau: den, uocTinh: true };
}

/** Số phút đã làm tính tới `bayGio` (làm tròn xuống). */
export const phutDaLam = (batDau: string, bayGio: number) => Math.max(0, Math.floor((bayGio - Date.parse(batDau)) / PHUT));
/** Số phút quá giờ (0 = chưa quá). Quá giờ khi thời gian làm VƯỢT thời lượng chuẩn. */
export const phutQuaGio = (ca: Pick<CaDangLam, "batDau" | "chuanPhut">, bayGio: number) => Math.max(0, phutDaLam(ca.batDau, bayGio) - ca.chuanPhut);
/** Giờ (ms) mà ca bắt đầu bị tính là quá giờ. */
export const mocQuaGio = (ca: Pick<CaDangLam, "batDau" | "chuanPhut">) => Date.parse(ca.batDau) + ca.chuanPhut * PHUT;

/** Nhắc lại mỗi 5 phút khi ca vẫn quá giờ mà chưa ai bấm "Đã biết". */
export const CHU_KY_NHAC_MS = 5 * PHUT;

/** Trạng thái đã báo của MỘT ca, lưu ở trình duyệt (mọi tab dùng chung): lần kêu cuối + đã bấm "Đã biết" chưa. */
export type DaBao = { keu?: number; biet?: boolean };

/** Có nên kêu cho ca này lúc `bayGio` không: phải đang quá giờ, chưa bấm "Đã biết", và chưa kêu trong một chu kỳ gần nhất. */
export function canKeu(ca: Pick<CaDangLam, "batDau" | "chuanPhut">, daBao: DaBao | undefined, bayGio: number, chuKy = CHU_KY_NHAC_MS): boolean {
  if (bayGio < mocQuaGio(ca)) return false;
  if (daBao?.biet) return false;
  return !daBao?.keu || bayGio - daBao.keu >= chuKy;
}

/** Dọn trạng thái đã báo: chỉ giữ các ca còn đang làm (ca xong/huỷ thì bỏ), để localStorage không phình. */
export function donDaBao(luu: Record<string, DaBao>, conDangLam: string[]): Record<string, DaBao> {
  const con = new Set(conDangLam);
  return Object.fromEntries(Object.entries(luu).filter(([id]) => con.has(id)));
}

/** "1 giờ 05 phút" / "12 phút". */
export function nhanPhut(phut: number): string {
  const p = Math.max(0, Math.round(phut));
  if (p < 60) return `${p} phút`;
  const g = Math.floor(p / 60), du = p % 60;
  return du ? `${g} giờ ${String(du).padStart(2, "0")} phút` : `${g} giờ`;
}

/** Ai được báo quá giờ: lễ tân, quản lý, chủ thấy MỌI ca của chi nhánh; người có quyền xem lịch khác (chuyên viên trị liệu, bác sĩ, thu ngân, tư vấn…)
 *  chỉ thấy ca mình làm; chỉ xem / nhà đầu tư không nhận. */
export type PhamViQuaGio = "chi_nhanh" | "cua_toi" | "khong";
const VAI_CA_CHI_NHANH: readonly VaiTro[] = ["chu", "quan_ly", "le_tan"];
const VAI_KHONG_BAO: readonly VaiTro[] = ["chi_xem", "nha_dau_tu"];
export function phamViQuaGio(nd: { vaiTro: VaiTro; quyen: readonly string[] }): PhamViQuaGio {
  if (VAI_KHONG_BAO.includes(nd.vaiTro) || !nd.quyen.includes("lich.xem")) return "khong";
  return VAI_CA_CHI_NHANH.includes(nd.vaiTro) ? "chi_nhanh" : "cua_toi";
}

/** Một dòng báo cáo Thời gian dịch vụ. */
export type DongThoiGian = { batDauLam: string | null; ketThucLam: string | null; chuanPhut: number };
/** Thực tế (phút) và quá giờ (phút) của một ca đã có đủ mốc; thiếu mốc thì null. */
export function tinhThucTe(d: DongThoiGian): { thucTe: number | null; qua: number | null } {
  if (!d.batDauLam || !d.ketThucLam) return { thucTe: null, qua: null };
  const thucTe = Math.max(0, Math.round((Date.parse(d.ketThucLam) - Date.parse(d.batDauLam)) / PHUT));
  return { thucTe, qua: Math.max(0, thucTe - d.chuanPhut) };
}

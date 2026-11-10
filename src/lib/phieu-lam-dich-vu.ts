// Phiếu làm dịch vụ (chị Diệu Thuý 10/11/2026 mục 11): in cho chuyên viên trị liệu cầm vào phòng — khách, mã khách, dịch vụ, buổi thứ mấy, còn bao nhiêu buổi.
// Phần tính thuần, không đọc DB, để test được.

/** Thẻ "không giới hạn" chuyển từ SalonHero ghi tổng 999999 buổi. */
export const KHONG_GIOI_HAN = 999_999;

/** Buổi thứ mấy của thẻ và còn lại bao nhiêu buổi SAU buổi này.
 *  - Lượt đang chờ / đang làm (chưa trừ buổi): buổi thứ = đã dùng + 1, còn lại = còn − 1.
 *  - Buổi đã làm (đã trừ): `sauDo` = số buổi đã làm của cùng thẻ ghi SAU buổi này → buổi thứ = đã dùng − sauDo, còn lại = còn + sauDo.
 *  Thẻ không có tổng hoặc không giới hạn: không đánh số. */
export function soBuoiPhieu(o: { tong: number | null; con: number | null; daTru: boolean; sauDo?: number }): { thu: number | null; tong: number | null; conSau: number | null } {
  const tong = o.tong == null || o.tong >= KHONG_GIOI_HAN ? null : o.tong;
  const con = o.con == null ? null : Math.max(0, o.con);
  if (tong == null || con == null) return { thu: null, tong: null, conSau: con == null || o.tong == null ? null : o.daTru ? con + (o.sauDo ?? 0) : Math.max(0, con - 1) };
  const daDung = Math.max(0, tong - con);
  if (o.daTru) {
    const sau = Math.max(0, o.sauDo ?? 0);
    return { thu: Math.max(1, daDung - sau), tong, conSau: Math.min(tong, con + sau) };
  }
  return { thu: Math.min(tong, daDung + 1), tong, conSau: Math.max(0, con - 1) };
}

/** "Buổi 3/10" · "Buổi 3" · "" */
export const nhanBuoiThu = (s: { thu: number | null; tong: number | null }) => (s.thu == null ? "" : `Buổi ${s.thu}${s.tong != null ? `/${s.tong}` : ""}`);

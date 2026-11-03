// Một lịch hẹn nhiều khách (câu 14, như SalonHero booking_group_members). Khách 1 = khách chính của lịch; Khách 2, 3… = "khách đi cùng" ở bảng lich_hen_khach.
// Thanh toán: MỘT hoá đơn cho cả nhóm, gắn khách chính (SalonHero createOrderBooking).

export type KhachDiCung = { ten: string; dichVuIds: string[]; nhanVienId: string | null; phong: string | null; thoiLuong: number | null };
export const TOI_DA_KHACH_DI_CUNG = 19; // cả lịch tối đa 20 khách
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Đọc danh sách khách đi cùng gửi từ hộp Đặt lịch (JSON). Sai thì trả câu báo lỗi tiếng Việt. */
export function docKhachDiCung(chu: string): KhachDiCung[] | string {
  let tho: unknown;
  try { tho = JSON.parse(chu || "[]"); } catch { return "Danh sách khách đi cùng không hợp lệ."; }
  if (!Array.isArray(tho)) return "Danh sách khách đi cùng không hợp lệ.";
  if (tho.length > TOI_DA_KHACH_DI_CUNG) return `Một lịch tối đa ${TOI_DA_KHACH_DI_CUNG + 1} khách.`;
  const ra: KhachDiCung[] = [];
  for (const [i, x] of tho.entries()) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const nhan = `Khách ${i + 2}`;
    const ten = String(o.ten ?? "").trim().slice(0, 80) || nhan;
    const dv = Array.isArray(o.dichVuIds) ? [...new Set(o.dichVuIds.map(String))] : [];
    if (dv.some((d) => !UUID.test(d))) return `${nhan}: dịch vụ không hợp lệ.`;
    if (dv.length === 0) return `${nhan}: chọn ít nhất một dịch vụ.`;
    const nv = o.nhanVienId ? String(o.nhanVienId) : null;
    if (nv && !UUID.test(nv)) return `${nhan}: người thực hiện không hợp lệ.`;
    const phong = o.phong ? String(o.phong).trim().slice(0, 80) || null : null;
    const tl = o.thoiLuong === null || o.thoiLuong === undefined || o.thoiLuong === "" ? null : Number(o.thoiLuong);
    if (tl !== null && (!Number.isInteger(tl) || tl < 5 || tl > 600)) return `${nhan}: thời lượng phải từ 5 đến 600 phút.`;
    ra.push({ ten, dichVuIds: dv, nhanVienId: nv, phong, thoiLuong: tl });
  }
  return ra;
}

/** Dòng ghi vào lich_hen_khach cho một lịch. */
export const dongKhachDiCung = (lichId: string, ds: KhachDiCung[]) =>
  ds.map((k, i) => ({ lich_id: lichId, thu_tu: i + 2, ten: k.ten, dich_vu_ids: k.dichVuIds, nhan_vien_id: k.nhanVienId, phong: k.phong, thoi_luong_phut: k.thoiLuong }));

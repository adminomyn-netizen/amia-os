// Một đơn làm dịch vụ gửi NHIỀU dịch vụ cho chuyên viên trị liệu một lần (chị Thuý / chị Lâm 11/11/2026).
// Mỗi dòng = một dịch vụ của một thẻ liệu trình (thẻ gồm nhiều dịch vụ thì tick được từng dịch vụ); mỗi dòng thành một lượt Chờ làm,
// Kết thúc mới trừ 1 buổi. Hàm ở đây thuần (không DB) để dùng chung trình duyệt + máy chủ và kiểm thử được.

/** Một dòng gửi chuyên viên: thẻ + dịch vụ, người làm riêng (rỗng = dùng người làm chung của đơn).
 *  `soLuong` = số buổi trừ của dòng (nhiều người cùng làm một dịch vụ trên một thẻ, quản lý cơ sở 15/11/2026); không ghi = 1. */
export type DongGuiCv = { theId: string; dvId: string; nvIds?: string[]; soLuong?: number;
  /** Khách làm cùng dịch vụ thêm lần trong ngày khi lần trước CÒN đang chờ / đang làm (chi nhánh Vinh 18/11/2026): không tạo lượt mới
   *  (chỉ mục một-lượt-mở giữ nguyên) mà cộng `soLuong` lần vào lượt đó. `slCu` = số buổi của lượt lúc thu ngân chọn: lượt đã đổi thì máy chủ chặn
   *  (bấm gửi hai lần không cộng hai lần). */
  luotId?: string; slCu?: number };

export const TOI_DA_DONG_GUI = 20;
/** Số buổi tối đa một dòng (một lượt) — khớp ràng buộc buoi_cho_lam.so_luong (0333) với biên an toàn. */
export const TOI_DA_SO_LUONG_DONG = 20;
/** Số buổi của một dòng: số nguyên 1..TOI_DA_SO_LUONG_DONG, sai thì 1. */
export const soLuongDong = (v: unknown) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 ? Math.min(n, TOI_DA_SO_LUONG_DONG) : 1; };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Thẻ của gói CHƯA gắn dịch vụ nào (vd EXION, chị Lâm 11/11/2026): dòng tick là chính thẻ, dvId = "goi:<id gói>".
 *  Máy chủ đổi sang dịch vụ mang tên gói (tạo một lần nếu danh mục chưa có) rồi mới gửi chuyên viên trị liệu. */
export const dvTheoGoi = (goiId: string) => `goi:${goiId}`;
/** id gói nếu dvId là dòng "chính thẻ", ngược lại null. */
export const goiCuaDv = (dvId: string): string | null => (dvId.startsWith("goi:") && UUID.test(dvId.slice(4)) ? dvId.slice(4) : null);

/** Hộp "Gửi chuyên viên làm" của MỘT thẻ (chị Lâm 11/11/2026: "cái nào có dịch vụ thì hiển thị thẳng dịch vụ, cái nào là thẻ không có dịch vụ thì
 *  cho cái thẻ hiện ra và ẩn ô dịch vụ đi"). `dichVu` = CHỈ dịch vụ gắn với gói của thẻ.
 *  - không dịch vụ + có gói → gửi chính thẻ (goi:<id gói>), ẩn ô dịch vụ;  - đúng 1 dịch vụ → gửi thẳng dịch vụ đó, ẩn ô;
 *  - nhiều dịch vụ (hoặc thẻ không có gói) → ô chọn trong đúng danh sách đó. */
export type CheDoDvThe = { kieu: "the"; dvId: string } | { kieu: "mot"; dvId: string; ten: string } | { kieu: "chon" };
export function cheDoDvThe(dichVu: { gia_tri: string; nhan: string }[], goiId?: string | null): CheDoDvThe {
  if (!dichVu.length && goiId && UUID.test(goiId)) return { kieu: "the", dvId: dvTheoGoi(goiId) };
  if (dichVu.length === 1) return { kieu: "mot", dvId: dichVu[0].gia_tri, ten: dichVu[0].nhan };
  return { kieu: "chon" };
}

/** Đọc ô `dong` (JSON) của biểu mẫu: bỏ dòng hỏng, gộp dòng trùng (cùng thẻ + dịch vụ [+ lượt đang chờ], giữ dòng đầu), số lần (buổi) của dòng ở `soLuong`. */
export function docDongGui(tho: string): { dong: DongGuiCv[] } | { loi: string } {
  let x: unknown;
  try { x = JSON.parse(tho || "[]"); } catch { return { loi: "Danh sách dịch vụ không đọc được, tải lại trang rồi chọn lại." }; }
  if (!Array.isArray(x)) return { loi: "Danh sách dịch vụ không đọc được, tải lại trang rồi chọn lại." };
  const dong: DongGuiCv[] = [];
  for (const d of x as Record<string, unknown>[]) {
    const theId = String(d?.theId ?? ""), dvId = String(d?.dvId ?? "");
    if (!UUID.test(theId) || !(UUID.test(dvId) || goiCuaDv(dvId))) continue;
    const sl = soLuongDong(d?.soLuong ?? 1);
    const luotId = UUID.test(String(d?.luotId ?? "")) ? String(d.luotId) : "";
    if (dong.some((o) => o.theId === theId && o.dvId === dvId && (o.luotId ?? "") === luotId)) continue; // gửi trùng không cộng dồn: số lần (buổi) nằm ở soLuong
    if (luotId) {
      // Thêm lần vào lượt đang chờ: người làm theo lượt đó, bắt buộc có slCu hợp lệ.
      const slCu = Math.floor(Number(d?.slCu));
      if (!Number.isFinite(slCu) || slCu < 1) continue;
      dong.push({ theId, dvId, luotId, slCu, ...(sl > 1 ? { soLuong: sl } : {}) });
      continue;
    }
    const nvIds = Array.isArray(d?.nvIds) ? [...new Set((d.nvIds as unknown[]).map(String).filter((v) => UUID.test(v)))].slice(0, 7) : [];
    dong.push({ theId, dvId, ...(nvIds.length ? { nvIds } : {}), ...(sl > 1 ? { soLuong: sl } : {}) });
  }
  if (!dong.length) return { loi: "Tick ít nhất một dịch vụ khách làm hôm nay." };
  if (dong.length > TOI_DA_DONG_GUI) return { loi: `Mỗi lần gửi tối đa ${TOI_DA_DONG_GUI} dịch vụ.` };
  return { dong };
}

/** Thẻ được chọn quá số buổi còn lại (đã trừ các lượt đang chờ / đang làm của thẻ đó) → mỗi thẻ một câu báo. Rỗng = hợp lệ. */
export function kiemBuoiThe(dong: Pick<DongGuiCv, "theId" | "soLuong">[], the: Map<string, { ten: string; buoiCon: number; dangMo: number }>): string[] {
  const dem = new Map<string, number>();
  for (const d of dong) dem.set(d.theId, (dem.get(d.theId) ?? 0) + soLuongDong(d.soLuong ?? 1));
  const loi: string[] = [];
  for (const [theId, n] of dem) {
    const t = the.get(theId);
    if (!t) { loi.push("Có thẻ không còn dùng được, tải lại rồi chọn lại."); continue; }
    const con = Math.max(0, t.buoiCon - t.dangMo);
    if (n > con) loi.push(`${t.ten}: chọn ${n} buổi nhưng thẻ chỉ còn ${con} buổi${t.dangMo ? ` (còn ${t.buoiCon}, ${t.dangMo} buổi đang chờ / đang làm)` : ""}. Bỏ bớt ${n - con} buổi.`);
  }
  return loi;
}

/** Người làm của một dòng: người riêng của dòng, không có thì người làm chung. */
export const nguoiLamDong = (d: DongGuiCv, chung: string[]) => (d.nvIds?.length ? d.nvIds : chung);

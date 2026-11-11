// Một đơn làm dịch vụ gửi NHIỀU dịch vụ cho chuyên viên trị liệu một lần (chị Thuý / chị Lâm 11/11/2026).
// Mỗi dòng = một dịch vụ của một thẻ liệu trình (thẻ gồm nhiều dịch vụ thì tick được từng dịch vụ); mỗi dòng thành một lượt Chờ làm,
// Kết thúc mới trừ 1 buổi. Hàm ở đây thuần (không DB) để dùng chung trình duyệt + máy chủ và kiểm thử được.

/** Một dòng gửi chuyên viên: thẻ + dịch vụ, người làm riêng (rỗng = dùng người làm chung của đơn). */
export type DongGuiCv = { theId: string; dvId: string; nvIds?: string[] };

export const TOI_DA_DONG_GUI = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Thẻ của gói CHƯA gắn dịch vụ nào (vd EXION, chị Lâm 11/11/2026): dòng tick là chính thẻ, dvId = "goi:<id gói>".
 *  Máy chủ đổi sang dịch vụ mang tên gói (tạo một lần nếu danh mục chưa có) rồi mới gửi chuyên viên trị liệu. */
export const dvTheoGoi = (goiId: string) => `goi:${goiId}`;
/** id gói nếu dvId là dòng "chính thẻ", ngược lại null. */
export const goiCuaDv = (dvId: string): string | null => (dvId.startsWith("goi:") && UUID.test(dvId.slice(4)) ? dvId.slice(4) : null);

/** Đọc ô `dong` (JSON) của biểu mẫu: bỏ dòng hỏng, gộp dòng trùng (cùng thẻ + dịch vụ). */
export function docDongGui(tho: string): { dong: DongGuiCv[] } | { loi: string } {
  let x: unknown;
  try { x = JSON.parse(tho || "[]"); } catch { return { loi: "Danh sách dịch vụ không đọc được, tải lại trang rồi chọn lại." }; }
  if (!Array.isArray(x)) return { loi: "Danh sách dịch vụ không đọc được, tải lại trang rồi chọn lại." };
  const dong: DongGuiCv[] = [];
  for (const d of x as Record<string, unknown>[]) {
    const theId = String(d?.theId ?? ""), dvId = String(d?.dvId ?? "");
    if (!UUID.test(theId) || !(UUID.test(dvId) || goiCuaDv(dvId))) continue;
    if (dong.some((o) => o.theId === theId && o.dvId === dvId)) continue;
    const nvIds = Array.isArray(d?.nvIds) ? [...new Set((d.nvIds as unknown[]).map(String).filter((v) => UUID.test(v)))].slice(0, 7) : [];
    dong.push({ theId, dvId, ...(nvIds.length ? { nvIds } : {}) });
  }
  if (!dong.length) return { loi: "Tick ít nhất một dịch vụ khách làm hôm nay." };
  if (dong.length > TOI_DA_DONG_GUI) return { loi: `Mỗi lần gửi tối đa ${TOI_DA_DONG_GUI} dịch vụ.` };
  return { dong };
}

/** Thẻ được chọn quá số buổi còn lại (đã trừ các lượt đang chờ / đang làm của thẻ đó) → mỗi thẻ một câu báo. Rỗng = hợp lệ. */
export function kiemBuoiThe(dong: Pick<DongGuiCv, "theId">[], the: Map<string, { ten: string; buoiCon: number; dangMo: number }>): string[] {
  const dem = new Map<string, number>();
  for (const d of dong) dem.set(d.theId, (dem.get(d.theId) ?? 0) + 1);
  const loi: string[] = [];
  for (const [theId, n] of dem) {
    const t = the.get(theId);
    if (!t) { loi.push("Có thẻ không còn dùng được, tải lại rồi chọn lại."); continue; }
    const con = Math.max(0, t.buoiCon - t.dangMo);
    if (n > con) loi.push(`${t.ten}: chọn ${n} dịch vụ nhưng thẻ chỉ còn ${con} buổi${t.dangMo ? ` (còn ${t.buoiCon}, ${t.dangMo} lượt đang chờ / đang làm)` : ""}. Bỏ bớt ${n - con} dịch vụ.`);
  }
  return loi;
}

/** Người làm của một dòng: người riêng của dòng, không có thì người làm chung. */
export const nguoiLamDong = (d: DongGuiCv, chung: string[]) => (d.nvIds?.length ? d.nvIds : chung);

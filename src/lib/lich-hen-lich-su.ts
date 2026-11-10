// Lịch sử sửa lịch hẹn (bảng lich_hen_lich_su, migration 0319): nhãn hành động và đọc cột thay_doi (jsonb) an toàn.
export const NHAN_HANH_DONG_SUA: Record<string, string> = { tao: "Tạo lịch", sua: "Sửa", doi_lich: "Đổi lịch", doi_trang_thai: "Đổi trạng thái", huy: "Huỷ lịch" };
export type DongThayDoi = { nhan: string; cu: string; moi: string };

/** Đọc thay_doi = [{ truong, nhan, cu, moi }]; dữ liệu lạ thì bỏ qua dòng đó. Chuỗi dài (ghi chú) cắt bớt để hiện gọn. */
export function dongThayDoi(v: unknown, toiDa = 160): DongThayDoi[] {
  if (!Array.isArray(v)) return [];
  const cat = (x: unknown) => { const t = typeof x === "string" ? x : x == null ? "" : String(x); return t.length > toiDa ? `${t.slice(0, toiDa)}…` : t; };
  return v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object").map((x) => ({ nhan: cat(x.nhan ?? x.truong), cu: cat(x.cu), moi: cat(x.moi) })).filter((x) => x.nhan);
}

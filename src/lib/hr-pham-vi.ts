import { sb } from "@/lib/db";

/** Nhân viên có nằm trong phạm vi người dùng không: người gắn chi nhánh chỉ đụng nhân viên cùng chi nhánh (khoá ở máy chủ, không tin id từ trình duyệt). */
export async function nvTrongPham(chiNhanhId: string | null, nhanVienId: string) {
  if (!nhanVienId) return false;
  const { data } = await sb().from("nhan_vien").select("chi_nhanh_id").eq("id", nhanVienId).maybeSingle();
  return !!data && (!chiNhanhId || data.chi_nhanh_id === chiNhanhId);
}

/** Danh sách nhân viên trong phạm vi để chọn trong biểu mẫu và lọc bảng. */
export async function dsNvTrongPham(chiNhanhId: string | null, chiConLam = true) {
  let q = sb().from("nhan_vien").select("id, ho_ten, ma_nv, phong_ban_id, chuc_danh, hoat_dong, ngay_nghi_viec").order("ho_ten");
  if (chiConLam) q = q.eq("hoat_dong", true);
  if (chiNhanhId) q = q.eq("chi_nhanh_id", chiNhanhId);
  const { data } = await q;
  return data ?? [];
}

export const luaChonNv = (nv: { id: string; ho_ten: string; ma_nv: string | null }[]) => nv.map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten}${n.ma_nv ? ` (${n.ma_nv})` : ""}` }));
/** Lựa chọn người đang làm; giữ người đang gắn sẵn trên bản ghi (kể cả đã nghỉ) để sửa không mất giá trị. */
export const luaChonNvGiu = (nv: { id: string; ho_ten: string; ma_nv: string | null; hoat_dong: boolean | null }[], giu?: string | null) => nv.filter((n) => n.hoat_dong || n.id === giu).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten}${n.ma_nv ? ` (${n.ma_nv})` : ""}${n.hoat_dong ? "" : " (đã nghỉ)"}` }));
export const NGAY_ISO = /^\d{4}-\d{2}-\d{2}$/;

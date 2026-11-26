import { sb } from "@/lib/db";
import type { BuocDuyet } from "@/lib/quy-trinh-duyet";

export const CHI_ANH_NAM = "Chỉ anh Nam (Kỹ thuật) được sửa quy trình phê duyệt, ngưỡng duyệt, chức danh tài chính và hạn mức duyệt. Cần đổi thì nhắn anh Nam.";

/** Người được sửa quy trình = các nhan_vien.id trong cau_hinh 'quy_trinh_duyet.nguoi_sua' (chị Lâm chốt 26/11/2026: chỉ anh Nam). Kiểm theo ID, không theo vai trò. */
export async function laNguoiSuaQuyTrinh(nhanVienId: string): Promise<boolean> {
  const { data } = await sb().from("cau_hinh").select("gia_tri").eq("khoa", "quy_trinh_duyet.nguoi_sua").maybeSingle();
  return (data?.gia_tri ?? "").split(",").map((x) => x.trim()).filter(Boolean).includes(nhanVienId);
}

/** Các bước duyệt (đã chép lúc gửi) của nhiều đề xuất, gom theo đề xuất, đúng thứ tự. */
export async function taiBuocDeXuat(ids: string[]): Promise<Map<string, BuocDuyet[]>> {
  const kq = new Map<string, BuocDuyet[]>();
  if (!ids.length) return kq;
  const { data } = await sb().from("de_xuat_buoc_duyet").select("*").in("de_xuat_id", ids).order("thu_tu");
  for (const r of data ?? []) {
    const ds = kq.get(r.de_xuat_id) ?? [];
    ds.push(r as unknown as BuocDuyet);
    kq.set(r.de_xuat_id, ds);
  }
  return kq;
}

/** Hàm "có ai đang giữ chức danh này không" (chỉ tính người còn làm việc). */
export async function coNguoiGiuChucDanhFn(): Promise<(cd: string) => boolean> {
  const { data } = await sb().from("nhan_vien").select("chuc_danh_tai_chinh").eq("hoat_dong", true).not("chuc_danh_tai_chinh", "is", null);
  const co = new Set((data ?? []).map((x) => x.chuc_danh_tai_chinh as string));
  return (cd) => co.has(cd);
}

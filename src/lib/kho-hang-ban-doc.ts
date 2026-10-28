import type { sb } from "@/lib/db";
import { docHet } from "@/lib/xuat-excel";

/** Sản phẩm bán lẻ đang hoạt động kèm số tồn (tổng sổ kho; `cn` rỗng = mọi chi nhánh). Dùng chung cho màn Quản lý kho hàng bán và nút Xuất Excel để hai nơi luôn cùng một danh sách. */
export type SanPhamKho = { id: string; ma: string; ma_vach: string | null; ten: string; nhom: string | null; don_vi: string; ton_toi_thieu: number; gia_nhap_don_vi: number | null; gia_ban: number; ton: number };

export async function docSanPhamKhoHangBan(db: ReturnType<typeof sb>, cn: string): Promise<SanPhamKho[]> {
  const [sp, ton] = await Promise.all([
    docHet((a, b) => db.from("san_pham").select("id, ma, ma_vach, ten, nhom, don_vi, ton_toi_thieu, gia_nhap_don_vi, gia_ban").eq("hoat_dong", true).eq("ban_le", true).order("ten").order("id").range(a, b)),
    docHet((a, b) => (cn ? db.from("v_ton_kho").select("san_pham_id, ton").eq("chi_nhanh_id", cn) : db.from("v_ton_kho").select("san_pham_id, ton")).order("san_pham_id").range(a, b)),
  ]);
  const tonMap = new Map<string, number>();
  for (const t of ton) tonMap.set(t.san_pham_id!, (tonMap.get(t.san_pham_id!) ?? 0) + Number(t.ton));
  return sp.map((s) => ({ ...s, ton_toi_thieu: Number(s.ton_toi_thieu ?? 0), gia_nhap_don_vi: s.gia_nhap_don_vi == null ? null : Number(s.gia_nhap_don_vi), gia_ban: Number(s.gia_ban), ton: tonMap.get(s.id) ?? 0 }));
}

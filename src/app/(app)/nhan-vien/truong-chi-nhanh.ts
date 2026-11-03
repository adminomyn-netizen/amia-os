import type { Truong } from "@/components/ui/BieuMau";
import { NHAN_VAI_TRO, VAI_TRO } from "@/lib/quyen";
import { vaiGanTheoChiNhanh } from "@/lib/vai-chi-nhanh";

export const TIEN_TO_VAI_CN = "vai_cn_";

/** Ô "Quyền chi nhánh" như SalonHero: mỗi chi nhánh một ô chọn vai hoặc "Không có quyền". Chi nhánh chính dùng ô Vai trò ở trên;
 *  các ô này chỉ hiện khi đã chọn một chi nhánh chính (người "Mọi chi nhánh" đã vào được mọi nơi với một vai), và không hiện ô của chính chi nhánh chính. */
export function truongVaiTheoChiNhanh(cn: readonly { id: string; ten: string }[]): Truong[] {
  const luaChon = [{ gia_tri: "", nhan: "Không có quyền" }, ...VAI_TRO.filter(vaiGanTheoChiNhanh).map((v) => ({ gia_tri: v, nhan: NHAN_VAI_TRO[v] }))];
  const ids = cn.map((c) => c.id);
  // Ô của chính chi nhánh chính bị ẩn (vai ở đó = ô Vai trò): chỉ hiện khi chi nhánh chính là một chi nhánh KHÁC.
  return cn.map((c) => ({ ten: `${TIEN_TO_VAI_CN}${c.id}`, nhan: `Quyền tại ${c.ten}`, loai: "chon" as const, luaChon, hienKhi: { ten: "chi_nhanh_id", la: ids.filter((x) => x !== c.id) }, ghiChu: "Vai ở chi nhánh này ngoài chi nhánh chính. Chủ / Kỹ thuật không gán theo chi nhánh." }));
}

/** Giá trị ban đầu cho các ô trên từ các dòng nhan_vien_chi_nhanh của một người. */
export function giaTriVaiTheoChiNhanh(them: readonly { chi_nhanh_id: string; vai_tro: string }[] | null | undefined): Record<string, string> {
  return Object.fromEntries((them ?? []).map((g) => [`${TIEN_TO_VAI_CN}${g.chi_nhanh_id}`, g.vai_tro]));
}

import type { LuaChon } from "@/components/ui/Chon";
import { laVaiTro, NHAN_VAI_TRO } from "@/lib/quyen";

/** "MSC.CT-24.0017.Nguyễn Hoài Thương" → "Nguyễn Hoài Thương" (bỏ tiền tố mã nhân viên khi hiển thị trong ô chọn). */
export const tenGonNv = (t: string) => t.replace(/^MSC[^.]*\.[^.]*\./, "");

/** Lựa chọn nhân viên cho ô Chon: tên gọn, gom theo vai (Bác sĩ, Chuyên viên trị liệu…), sắp theo vai rồi tên. */
export function luaChonNhanVien(ds: { id: string; ho_ten: string; vai_tro?: string | null }[]): LuaChon[] {
  const nhom = (v?: string | null) => (v && laVaiTro(v) ? NHAN_VAI_TRO[v] : "Khác");
  return [...ds]
    .map((n) => ({ gia_tri: n.id, nhan: tenGonNv(n.ho_ten), nhom: nhom(n.vai_tro) }))
    .sort((a, b) => a.nhom.localeCompare(b.nhom, "vi") || a.nhan.localeCompare(b.nhan, "vi"));
}

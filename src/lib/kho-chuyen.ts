import type { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { TT_CHUYEN } from "@/lib/kho";

/** Lọc phiếu chuyển kho như SalonHero (tình trạng, người tạo, khoảng thời gian gửi). Dùng chung cho màn Chuyển kho và Xuất Excel. */
export type LocChuyen = { tu?: string; den?: string; tt?: string; nguoi?: string };
const UUID = /^[0-9a-f-]{36}$/i;

export function locPhieuChuyen(db: ReturnType<typeof sb>, nd: { chiNhanhId: string | null }, l: LocChuyen, gioiHan: number) {
  // Mặc định 90 ngày gần nhất (không phải từ mùng 1) để phiếu đang chuyển gửi cuối tháng trước vẫn hiện, chờ kho nhận xác nhận.
  const { tu, den } = khoangNgay(l.tu || congNgay(homNayHCM(), -90), l.den);
  let q = db.from("phieu_chuyen_kho").select("*").gte("gui_luc", `${tu}T00:00:00+07:00`).lt("gui_luc", `${congNgay(den, 1)}T00:00:00+07:00`).order("gui_luc", { ascending: false }).limit(gioiHan);
  if (nd.chiNhanhId) q = q.or(`tu_chi_nhanh_id.eq.${nd.chiNhanhId},den_chi_nhanh_id.eq.${nd.chiNhanhId}`);
  if (l.tt && l.tt in TT_CHUYEN) q = q.eq("trang_thai", l.tt);
  if (l.nguoi && UUID.test(l.nguoi)) q = q.eq("nguoi_gui_id", l.nguoi);
  const thamSo = new URLSearchParams(Object.entries({ tu, den, tt: l.tt, nguoi: l.nguoi }).filter((e): e is [string, string] => !!e[1])).toString();
  return { q, tu, den, thamSo };
}

import "server-only";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, tienVN } from "@/lib/dinh-dang";
import { coQuyen, type CoQuyen } from "@/lib/quyen";

/** `ma` = loại việc (khoá trạng thái đã đọc/đã xoá của từng nhân viên). */
export type CanhBao = { ma: "lich" | "phieu" | "the" | "no" | "kho"; nhan: string; href: string };

/** Việc đang chờ người này xử lý (theo quyền và chi nhánh của họ): dùng cho chuông thông báo và Trang chủ. */
export async function layCanhBao(nd: CoQuyen & { chiNhanhId: string | null }): Promise<CanhBao[]> {
  const db = sb(), cn = nd.chiNhanhId, homNay = homNayHCM();
  const ra: CanhBao[] = [];
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  const loc = <T extends { eq: (c: string, v: string) => T }>(q: T) => (cn ? q.eq("chi_nhanh_id", cn) : q);
  const [lich, phieu, the, no, kho] = await Promise.all([
    coQuyen(nd, "lich.xem") ? loc(db.from("lich_hen").select("id", { count: "exact", head: true }).gte("bat_dau", tu).lt("bat_dau", den).eq("trang_thai", "chua_xac_nhan")) : null,
    coQuyen(nd, "phieu.xem") ? loc(db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"])) : null,
    coQuyen(nd, "the.xem") ? loc(db.from("v_the_khach").select("id", { count: "exact", head: true }).eq("tinh_trang", "sap_het").eq("loai", "lan")) : null,
    coQuyen(nd, "baocao.tien") ? loc(db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0)) : null,
    coQuyen(nd, "kho.xem") ? loc(db.from("v_ton_kho").select("san_pham_id", { count: "exact", head: true }).eq("duoi_muc_toi_thieu", true)) : null,
  ]);
  if ((lich?.count ?? 0) > 0) ra.push({ ma: "lich", nhan: `${lich!.count} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if ((phieu?.count ?? 0) > 0) ra.push({ ma: "phieu", nhan: `${phieu!.count} phiếu cấp vật tư đang chờ kho cấp hoặc KTV nhận`, href: "/phieu-cap" });
  if ((the?.count ?? 0) > 0) ra.push({ ma: "the", nhan: `${the!.count} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  const dsNo = (no?.data ?? []) as { con_no: number }[];
  if (dsNo.length > 0) ra.push({ ma: "no", nhan: `${dsNo.length} hoá đơn còn nợ, tổng ${tienVN(dsNo.reduce((s, r) => s + Number(r.con_no), 0))}`, href: "/bao-cao?tab=no" });
  if ((kho?.count ?? 0) > 0) ra.push({ ma: "kho", nhan: `${kho!.count} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
  return ra;
}

import type { sb } from "@/lib/db";
import { tuyChon } from "@/lib/db";

/** Danh sách PHIẾU nhập / PHIẾU xuất kho kiểu SalonHero (#/inventory › Phiếu nhập, Phiếu xuất), hàm CSDL bc_phieu_kho (migration 0256).
 *  Dùng chung cho màn hình và nút Xuất Excel để số luôn khớp. `tatCa` = tối đa 20.000 phiếu cho Excel. */
type Db = ReturnType<typeof sb>;
export type HuongPhieu = "nhap" | "xuat";
export type LocPhieu = { tu: string; den: string; cn?: string; tt?: string; nguoi?: string; pl?: string; q?: string; trang?: number; so?: number };

export const TINH_TRANG_PHIEU: Record<HuongPhieu, string[]> = { nhap: ["Hoàn thành"], xuat: ["Hoàn thành", "Chờ duyệt", "Bị từ chối", "Đã huỷ"] };
export const PHAN_LOAI_PHIEU: Record<HuongPhieu, string[]> = {
  nhap: ["Nhập mua hàng"],
  xuat: ["Xuất tiêu hao", "Xuất sang kho nội bộ", "Xuất trả hàng NCC", "Xuất huỷ", "Xuất khẩn cấp", "Xuất điều chỉnh", "Xuất khác"],
};
const UUID = /^[0-9a-f-]{36}$/i;

export async function layPhieuKho(db: Db, huong: HuongPhieu, l: LocPhieu, tatCa = false) {
  const so = l.so ?? 20;
  const { data, error } = await db.rpc("bc_phieu_kho", {
    p_huong: huong, p_tu: l.tu, p_den: l.den, p_cn: tuyChon(l.cn), p_tt: tuyChon(TINH_TRANG_PHIEU[huong].includes(l.tt ?? "") ? l.tt : ""),
    p_nguoi: tuyChon(UUID.test(l.nguoi ?? "") ? l.nguoi : ""), p_pl: tuyChon(PHAN_LOAI_PHIEU[huong].includes(l.pl ?? "") ? l.pl : ""), p_tim: tuyChon(l.q?.trim().slice(0, 80)),
    p_so: tatCa ? 20000 : so, p_tu_dong: tatCa ? 0 : (Math.max(1, l.trang ?? 1) - 1) * so,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => ({ ...r, so_mat_hang: Number(r.so_mat_hang), tong_sl: Number(r.tong_sl), tong_tien: Number(r.tong_tien ?? 0) }));
  return { rows, tong: { dong: Number(data?.[0]?.tong_dong ?? 0), tien: Number(data?.[0]?.tong_tien_tat_ca ?? 0) } };
}

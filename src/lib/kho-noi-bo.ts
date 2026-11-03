import type { sb } from "@/lib/db";
import { boDau, congNgay } from "@/lib/dinh-dang";
import { docHet } from "@/lib/xuat-excel";

/** Dữ liệu "Quản lý kho nội bộ" (SalonHero #/internal_stock), dùng chung cho màn và Xuất Excel.
 *  Hai nguồn: (1) vật tư tiêu hao (không bán lẻ) — tồn theo sổ kho chính; (2) sản phẩm bán lẻ đã "Nhập từ kho hàng bán" — tồn theo sổ kho nội bộ (migration 0256).
 *  Lọc như SalonHero: chi nhánh, phân nhóm, ô tìm tên/mã, khoảng ngày (chỉ những mặt hàng có phát sinh nhập/xuất trong khoảng). */
export type LocNoiBo = { cn: string; nhom?: string; q?: string; tu?: string; den?: string };
export type DongNoiBo = {
  khoa: string; cnId: string; nguon: "vat_tu" | "tu_hang_ban"; ton: number;
  sp: { id: string; ma: string; ten: string; nhom: string | null; don_vi: string; gia_nhap_don_vi: number | null; dung_tich: number | null; dung_tich_dv: string | null; anh: string | null };
};
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export async function docKhoNoiBo(db: ReturnType<typeof sb>, l: LocNoiBo) {
  const tu = NGAY.test(l.tu ?? "") ? l.tu! : "", den = NGAY.test(l.den ?? "") ? l.den! : "";
  const [spAll, ton, tonNb] = await Promise.all([
    docHet((a, b) => db.from("san_pham").select("id, ma, ten, nhom, don_vi, gia_nhap_don_vi, dung_tich, dung_tich_dv, anh, ban_le").eq("hoat_dong", true).order("id").range(a, b)),
    docHet((a, b) => (l.cn ? db.from("v_ton_kho").select("chi_nhanh_id, san_pham_id, ton").eq("chi_nhanh_id", l.cn) : db.from("v_ton_kho").select("chi_nhanh_id, san_pham_id, ton")).order("san_pham_id").range(a, b)),
    docHet((a, b) => (l.cn ? db.from("v_ton_kho_noi_bo").select("chi_nhanh_id, san_pham_id, ton").eq("chi_nhanh_id", l.cn) : db.from("v_ton_kho_noi_bo").select("chi_nhanh_id, san_pham_id, ton")).order("san_pham_id").range(a, b)),
  ]);
  const sanPham = new Map(spAll.map((s) => [s.id, { ...s, gia_nhap_don_vi: s.gia_nhap_don_vi == null ? null : Number(s.gia_nhap_don_vi), dung_tich: s.dung_tich == null ? null : Number(s.dung_tich) }]));
  let dong: DongNoiBo[] = [
    ...ton.filter((t) => !sanPham.get(t.san_pham_id!)?.ban_le && sanPham.has(t.san_pham_id!) && Number(t.ton) !== 0)
      .map((t) => ({ khoa: `vt-${t.chi_nhanh_id}-${t.san_pham_id}`, cnId: t.chi_nhanh_id!, nguon: "vat_tu" as const, sp: sanPham.get(t.san_pham_id!)!, ton: Number(t.ton) })),
    ...tonNb.filter((t) => sanPham.has(t.san_pham_id!) && Number(t.ton) !== 0)
      .map((t) => ({ khoa: `nb-${t.chi_nhanh_id}-${t.san_pham_id}`, cnId: t.chi_nhanh_id!, nguon: "tu_hang_ban" as const, sp: sanPham.get(t.san_pham_id!)!, ton: Number(t.ton) })),
  ];
  const tim = boDau((l.q ?? "").trim().slice(0, 80));
  if (tim) dong = dong.filter((d) => boDau(`${d.sp.ten} ${d.sp.ma}`).includes(tim));
  if (tu || den) {
    const a = tu || "2000-01-01", b = den || "2999-12-31";
    const tuTs = `${a}T00:00:00+07:00`, denTs = `${congNgay(b, 1)}T00:00:00+07:00`;
    const ids = [...new Set(dong.map((d) => d.sp.id))];
    const [ps, psNb] = await Promise.all([
      ids.length ? docHet((x, y) => { let q = db.from("kho_so_cai").select("chi_nhanh_id, san_pham_id").in("san_pham_id", ids).gte("tao_luc", tuTs).lt("tao_luc", denTs); if (l.cn) q = q.eq("chi_nhanh_id", l.cn); return q.order("id").range(x, y); }) : Promise.resolve([]),
      ids.length ? docHet((x, y) => { let q = db.from("kho_noi_bo_so_cai").select("chi_nhanh_id, san_pham_id").in("san_pham_id", ids).gte("tao_luc", tuTs).lt("tao_luc", denTs); if (l.cn) q = q.eq("chi_nhanh_id", l.cn); return q.order("id").range(x, y); }) : Promise.resolve([]),
    ]);
    const co = new Set([...ps.map((p) => `vt-${p.chi_nhanh_id}-${p.san_pham_id}`), ...psNb.map((p) => `nb-${p.chi_nhanh_id}-${p.san_pham_id}`)]);
    dong = dong.filter((d) => co.has(d.khoa));
  }
  dong.sort((x, y) => x.sp.ten.localeCompare(y.sp.ten, "vi"));
  return { dong, tu, den };
}

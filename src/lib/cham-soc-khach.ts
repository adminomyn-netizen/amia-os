import { chiNhanhHoatDong } from "@/lib/chi-nhanh";
import "server-only";
import { sb } from "@/lib/db";
import type { NguoiDung } from "@/lib/auth";
import { DONG_MOI_TRANG } from "@/lib/cham-soc-hang-doi";

export type DongTaiKham = {
  tong: number; khach_id: string; ma: string; ho_ten: string; dien_thoai: string; the_id: string; ma_the: string; ten_goi: string; so_the: number; so_buoi_con: number; khong_gioi_han: boolean;
  han_dung: string | null; lan_cuoi: string; khoang_cach: number; den_han: string; so_ngay_tre: number; trang_thai: string | null; ghi_chu: string | null; chi_nhanh_id: string; nhac_id: string | null;
};
export type DongTheSapHet = {
  tong: number; the_id: string; ma_the: string; khach_id: string; ma: string; ho_ten: string; dien_thoai: string; ten_goi: string; loai: string; so_buoi_con: number; so_du_tien: number;
  han_dung: string | null; so_ngay_con: number | null; ly_do: string; chi_nhanh_id: string; ngay_cap: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chi nhánh đang xem: người gắn một chi nhánh bị KHOÁ ở chi nhánh đó; lãnh đạo không gắn chi nhánh chọn bằng ?cn=… hoặc xem tất cả. */
export async function chiNhanhXem(nd: Pick<NguoiDung, "chiNhanhId">, cn: string | undefined) {
  const ds = (await chiNhanhHoatDong().catch(() => [])).map((c) => ({ id: c.id, ten: c.ten }));
  if (nd.chiNhanhId) return { cn: nd.chiNhanhId, ds: ds.filter((c) => c.id === nd.chiNhanhId), khoa: true };
  return { cn: cn && UUID.test(cn) && ds.some((c) => c.id === cn) ? cn : null, ds, khoa: false };
}

/** Số nguyên trong khoảng, sai thì dùng mặc định (tham số địa chỉ không bao giờ làm vỡ trang). */
export const soTrongKhoang = (v: string | undefined, tu: number, den: number, mac: number | null): number | undefined => {
  if (v === undefined || v === "" || !/^-?\d{1,4}$/.test(v)) return mac ?? undefined;
  const n = Number(v);
  return n >= tu && n <= den ? n : (mac ?? undefined);
};

export async function docTaiKham(cn: string | null, baoTruoc?: number, treToiDa?: number, khach?: string, gioiHan = 300): Promise<DongTaiKham[]> {
  const { data, error } = await sb().rpc("ds_tai_kham", { ...(cn ? { p_cn: cn } : {}), ...(baoTruoc != null ? { p_bao_truoc: baoTruoc } : {}), ...(treToiDa != null ? { p_tre_toi_da: treToiDa } : {}), ...(khach ? { p_khach: khach } : {}), p_gioi_han: gioiHan });
  if (error) { console.error("[ds_tai_kham]", error.message); throw new Error("Không đọc được danh sách tái khám, thử lại."); }
  return (data ?? []) as unknown as DongTaiKham[];
}

export async function docTheSapHet(cn: string | null, buoi?: number, ngay?: number, khach?: string, gioiHan = 300): Promise<DongTheSapHet[]> {
  const { data, error } = await sb().rpc("ds_the_sap_het", { ...(cn ? { p_cn: cn } : {}), ...(buoi != null ? { p_buoi: buoi } : {}), ...(ngay != null ? { p_ngay: ngay } : {}), ...(khach ? { p_khach: khach } : {}), p_gioi_han: gioiHan });
  if (error) { console.error("[ds_the_sap_het]", error.message); throw new Error("Không đọc được danh sách thẻ sắp hết, thử lại."); }
  return (data ?? []) as unknown as DongTheSapHet[];
}

/** Ngưỡng đang áp dụng (từ cau_hinh) cho ô nhập ở các trang. */
export async function docNguongCSKH() {
  const { data } = await sb().from("cau_hinh").select("khoa, gia_tri").in("khoa", ["tai_kham_ngay_mac_dinh", "tai_kham_bao_truoc_ngay", "tai_kham_tre_toi_da_ngay", "the_sap_het_buoi", "the_sap_het_ngay", "cs_sau_dt_ngay"]);
  const m = new Map((data ?? []).map((r) => [r.khoa, Number(r.gia_tri)]));
  return { macDinhNgay: m.get("tai_kham_ngay_mac_dinh") ?? 30, baoTruoc: m.get("tai_kham_bao_truoc_ngay") ?? 7, treToiDa: m.get("tai_kham_tre_toi_da_ngay") ?? 90, sapHetBuoi: m.get("the_sap_het_buoi") ?? 2, sapHetNgay: m.get("the_sap_het_ngay") ?? 30, sauDieuTriNgay: m.get("cs_sau_dt_ngay") ?? 3 };
}

export type DongChamSoc = {
  tong: number; hang: string; loai: string; khach_id: string; ma: string; ho_ten: string; dien_thoai: string; chi_nhanh_id: string | null; ngay_goc: string; lich_id: string | null; moc: number | null;
  hen_ngay: string | null; gio: string | null; lich_tt: string | null; dich_vu: string | null; goi_tt: string | null; goi_luc: string | null; goi_chi_tiet: string | null; goi_noi_dung: string | null;
  goi_nguoi: string | null; so_lan_goi: number;
};

/** Một trang của hàng đợi chăm sóc (hàm CSDL ds_cham_soc, ≤ 50 dòng/trang). */
export async function docChamSoc(loai: string, cn: string | null, sauDt: number | undefined, trang: number): Promise<DongChamSoc[]> {
  const { data, error } = await sb().rpc("ds_cham_soc", { p_loai: loai, ...(cn ? { p_cn: cn } : {}), ...(sauDt != null ? { p_sau_dt: sauDt } : {}), p_tu: (Math.max(1, trang) - 1) * DONG_MOI_TRANG, p_so: DONG_MOI_TRANG });
  if (error) { console.error("[ds_cham_soc]", error.message); throw new Error("Không đọc được danh sách chăm sóc, thử lại."); }
  return (data ?? []) as unknown as DongChamSoc[];
}

/** Số khách ở từng hàng đợi (cho các nút lọc). */
export async function demChamSoc(cn: string | null, sauDt: number | undefined): Promise<Record<string, number>> {
  const { data, error } = await sb().rpc("dem_cham_soc", { ...(cn ? { p_cn: cn } : {}), ...(sauDt != null ? { p_sau_dt: sauDt } : {}) });
  if (error) { console.error("[dem_cham_soc]", error.message); throw new Error("Không đếm được danh sách chăm sóc, thử lại."); }
  return Object.fromEntries((data ?? []).map((r) => [r.hang, Number(r.so)]));
}

export type DongHenKeTiep = { id: string; khach_id: string; the_id: string; ngay_hen: string; noi_dung: string | null; chi_nhanh_id: string | null; ho_ten: string; ma: string; dien_thoai: string; ma_the: string; da_co_lich: boolean };

/** Các buổi kế tiếp đã hẹn (ghi lúc trừ buổi thẻ) từ `tu` ngày trước đến nay trở đi; đánh dấu khách đã có lịch hẹn sắp tới. */
export async function docHenKeTiep(cn: string | null, homNay: string, lui = 14): Promise<DongHenKeTiep[]> {
  const db = sb();
  const tu = new Date(new Date(`${homNay}T00:00:00Z`).getTime() - lui * 86400e3).toISOString().slice(0, 10);
  let q = db.from("the_buoi_ke_tiep").select("id, khach_id, the_id, ngay_hen, noi_dung, chi_nhanh_id, khach_hang(ma, ho_ten, dien_thoai), the_khach(ma)").gte("ngay_hen", tu).order("ngay_hen").limit(200);
  if (cn) q = q.eq("chi_nhanh_id", cn);
  const { data, error } = await q;
  if (error) { console.error("[the_buoi_ke_tiep]", error.message); return []; }
  const ds = data ?? [];
  const ids = [...new Set(ds.map((r) => r.khach_id))];
  const coLich = new Set<string>();
  if (ids.length) {
    const { data: lich } = await db.from("lich_hen").select("khach_id").in("khach_id", ids).gte("bat_dau", new Date().toISOString()).in("trang_thai", ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu", "dang_phuc_vu"]);
    for (const l of lich ?? []) coLich.add(l.khach_id);
  }
  return ds.map((r) => ({ id: r.id, khach_id: r.khach_id, the_id: r.the_id, ngay_hen: r.ngay_hen, noi_dung: r.noi_dung, chi_nhanh_id: r.chi_nhanh_id, ho_ten: r.khach_hang?.ho_ten ?? "", ma: r.khach_hang?.ma ?? "", dien_thoai: r.khach_hang?.dien_thoai ?? "", ma_the: r.the_khach?.ma ?? "", da_co_lich: coLich.has(r.khach_id) }));
}

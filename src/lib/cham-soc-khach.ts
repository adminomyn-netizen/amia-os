import "server-only";
import { sb } from "@/lib/db";
import type { NguoiDung } from "@/lib/auth";

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
  const { data } = await sb().from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
  const ds = data ?? [];
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
  const { data } = await sb().from("cau_hinh").select("khoa, gia_tri").in("khoa", ["tai_kham_ngay_mac_dinh", "tai_kham_bao_truoc_ngay", "tai_kham_tre_toi_da_ngay", "the_sap_het_buoi", "the_sap_het_ngay"]);
  const m = new Map((data ?? []).map((r) => [r.khoa, Number(r.gia_tri)]));
  return { macDinhNgay: m.get("tai_kham_ngay_mac_dinh") ?? 30, baoTruoc: m.get("tai_kham_bao_truoc_ngay") ?? 7, treToiDa: m.get("tai_kham_tre_toi_da_ngay") ?? 90, sapHetBuoi: m.get("the_sap_het_buoi") ?? 2, sapHetNgay: m.get("the_sap_het_ngay") ?? 30 };
}

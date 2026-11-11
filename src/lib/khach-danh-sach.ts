import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import { chuanSdt } from "@/lib/dinh-dang";

import { KHOA_LOC, type KhoaLoc } from "@/lib/khach";

export type ThamSoKhach = Partial<Record<KhoaLoc | "q" | "sx", string>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const SO = /^\d{1,12}$/;
/** Kiểu của từng ô: giá trị sai kiểu bị bỏ (không gửi xuống CSDL) thay vì làm lỗi cả danh sách. */
const KIEU: Partial<Record<KhoaLoc, RegExp>> = {
  phu_trach: UUID, chi_nhanh: UUID, nhan_vien: UUID, nhom: /^(khong|[0-9a-f-]{36}(,[0-9a-f-]{36}){0,49})$/i, nhom_kieu: /^(mot|tat_ca)$/,
  diem_tu: SO, diem_den: SO, tuoi_tu: /^\d{1,3}$/, tuoi_den: /^\d{1,3}$/, ds_tu: SO, ds_den: SO,
  den_tu: NGAY, den_den: NGAY, tao_tu: NGAY, tao_den: NGAY,
  the: /^(co|khong)$/, no: /^(co|khong)$/, nhieu_cn: /^1$/, hien_sh_xoa: /^1$/, sinh_nhat: /^(hom_nay|7_ngay|thang|[1-9]|1[0-2])$/, sinh_ngay: /^([1-9]|[12]\d|3[01])$/,
};

/** Luật chị Lâm 29/10: mọi vai trừ Chủ chỉ thấy khách của chi nhánh được gán. Ghi đè tham số lọc (người dùng không tự đổi được). */
export function khoaCnKhach(t: ThamSoKhach, nd: { chiNhanhId: string | null }): ThamSoKhach {
  return nd.chiNhanhId ? { ...t, chi_nhanh: nd.chiNhanhId, nhieu_cn: undefined } : t;
}

/** Đọc tham số lọc từ địa chỉ (API/xuất Excel), bỏ giá trị rỗng hoặc sai kiểu. */
export function docThamSo(u: URLSearchParams): ThamSoKhach {
  const t: ThamSoKhach = { q: (u.get("q") ?? "").trim().slice(0, 80), sx: u.get("sx") ?? "ten" };
  for (const k of KHOA_LOC) {
    const v = (u.get(k) ?? "").trim().slice(0, 120);
    if (v && (!KIEU[k] || KIEU[k]!.test(v))) t[k] = v;
  }
  return t;
}

export type DongKhach = {
  id: string; ma: string; ho_ten: string; dien_thoai: string; zalo: string | null; email: string | null; gioi_tinh: string | null; ngay_sinh: string | null;
  dia_chi: string | null; nguon: string | null; nguon_chi_tiet: string | null; trang_thai: string | null; hang: string | null; nguoi_phu_trach_id: string | null;
  chi_nhanh_id: string | null; so_the_dang_dung: number | null; chi_12_thang: number | null; tao_luc: string; tinh_thanh: string | null; quan_huyen: string | null;
  diem_so_du: number; facebook: string | null; co_so_goc: string | null; nhom: { ten: string; mau: string | null }[];
  /** 0330: hồ sơ dựng lại cho khách đã bị xoá bên SalonHero (ho_ten đã đổi thành "Khách đã xoá bên SalonHero"). */
  an_sh_xoa?: boolean;
};

/** Lọc + sắp xếp + phân trang ở CSDL (hàm loc_khach, migration 0066, bản tải nhanh 0230). Trả `tong` = số khách khớp toàn bộ bộ lọc. */
export async function locKhach(t: ThamSoKhach, tu: number, so: number): Promise<{ ds: DongKhach[]; tong: number } | null> {
  const p: Record<string, string> = { ...t } as Record<string, string>;
  if (t.q) p.q_sdt = chuanSdt(t.q);
  const { data, error } = await sb().rpc("loc_khach", { p, p_tu: tu, p_so: so });
  if (error) { console.error("[loc_khach]", error.message); return null; }
  const rows = (data ?? []) as { tong: number; dong: DongKhach }[];
  // Trang vượt quá cuối: không có dòng nên không biết tổng; trả `tu` để nút "Tải thêm" tự ẩn.
  return { ds: rows.map((r) => r.dong), tong: rows.length ? Number(rows[0].tong) : tu };
}

export type SoLieuKhach = { tong: number; moiHomNay: number; sinhNhatHomNay: number; sinhNhatThang: number };

async function tinhSoLieu(): Promise<SoLieuKhach> {
  const { data } = await sb().rpc("so_lieu_khach");
  const s = (data ?? {}) as Record<string, number>;
  return { tong: s.tong ?? 0, moiHomNay: s.moi_hom_nay ?? 0, sinhNhatHomNay: s.sinh_nhat_hom_nay ?? 0, sinhNhatThang: s.sinh_nhat_thang ?? 0 };
}
/** 4 số đầu trang danh sách khách (giờ Việt Nam), đếm bằng một lượt ở CSDL. Nhớ 1 phút. */
export const soLieuKhach = unstable_cache(tinhSoLieu, ["khach-so-lieu-dau-trang-2"], { revalidate: 60 });

export type NhomKhach = { id: string; ten: string; mau: string | null; so: number };
export type TuyChonLoc = { tinh: { tinh: string; so: number; quan: string[] | null }[]; dich_vu: string[]; san_pham?: string[] };

async function docTuyChon(): Promise<{ nhom: NhomKhach[]; tuyChon: TuyChonLoc }> {
  const db = sb();
  const [{ data: nh }, { data: tc }] = await Promise.all([
    db.from("nhom_khach").select("id, ten, mau, khach_nhom(count)").eq("hoat_dong", true).order("ten"),
    db.rpc("tuy_chon_loc_khach"),
  ]);
  const nhom = (nh ?? []).map((n) => ({ id: n.id, ten: n.ten, mau: n.mau, so: (n.khach_nhom as unknown as { count: number }[])?.[0]?.count ?? 0 })).sort((a, b) => b.so - a.so || a.ten.localeCompare(b.ten, "vi"));
  return { nhom, tuyChon: (tc ?? { tinh: [], dich_vu: [], san_pham: [] }) as TuyChonLoc };
}
/** Nhóm (kể cả đã ẩn) cho màn quản lý nhóm, kèm số khách. Không nhớ đệm: màn này cần số mới nhất. */
export async function docNhomQuanLy(): Promise<(NhomKhach & { hoat_dong: boolean; mo_ta: string | null })[]> {
  const { data } = await sb().from("nhom_khach").select("id, ten, mau, mo_ta, hoat_dong, khach_nhom(count)").order("ten");
  return (data ?? []).map((n) => ({ id: n.id, ten: n.ten, mau: n.mau, mo_ta: n.mo_ta, hoat_dong: n.hoat_dong, so: (n.khach_nhom as unknown as { count: number }[])?.[0]?.count ?? 0 }));
}

/** Nhóm trùng tên chỉ khác hoa/thường hoặc dấu cách thừa (vd LUXURY / Luxury): chỉ để CẢNH BÁO gợi ý gộp, không tự gộp. */
export function nhomTrungTen<T extends { id: string; ten: string; hoat_dong: boolean }>(ds: T[]): T[][] {
  const m = new Map<string, T[]>();
  for (const n of ds) { if (!n.hoat_dong) continue; const k = n.ten.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi"); m.set(k, [...(m.get(k) ?? []), n]); }
  return [...m.values()].filter((g) => g.length > 1);
}

/** Danh mục cho ô lọc: nhóm khách (kèm số khách), tỉnh → quận, tên dịch vụ đã bán. Nhớ 5 phút. */
export const tuyChonLocKhach = unstable_cache(docTuyChon, ["khach-tuy-chon-loc-2"], { revalidate: 300, tags: ["khach-tuy-chon-loc"] });

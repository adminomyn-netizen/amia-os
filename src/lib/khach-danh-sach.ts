import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import { chuanSdt, homNayHCM } from "@/lib/dinh-dang";

/** Tham số lọc/sắp xếp danh sách khách: dùng chung cho danh sách bên trái và nút Xuất Excel để hai nơi luôn khớp nhau. */
export type ThamSoKhach = { q?: string; trang_thai?: string; nguon?: string; hang?: string; phu_trach?: string; sx?: string };

/** Cột lấy cho tệp Excel. CỐ Ý không có `ghi_chu` (ghi chú chung từ SalonHero có thể chứa nội dung điều trị). */
export const COT_KHACH = "id, ma, ho_ten, dien_thoai, zalo, email, gioi_tinh, ngay_sinh, dia_chi, nguon, nguon_chi_tiet, trang_thai, hang, nguoi_phu_trach_id, chi_nhanh_id, so_the_dang_dung, chi_12_thang, tao_luc" as const;

type Loc = { or: (f: string) => unknown; eq: (c: string, v: string) => unknown; order: (c: string, o?: { ascending: boolean }) => unknown };

/** Áp bộ lọc + thứ tự lên một truy vấn v_khach_hang. Tìm kiếm: tên, mã, email, số điện thoại. */
export function apLocKhach<T>(truyVan: T, t: ThamSoKhach): T {
  let q = truyVan as unknown as Loc;
  const tuKhoa = (t.q ?? "").trim().slice(0, 80);
  if (tuKhoa) {
    const so = chuanSdt(tuKhoa);
    const an = tuKhoa.replace(/[%,()*\\]/g, " ").trim();
    const dk = [`ho_ten.ilike.%${an}%`, `ma.ilike.%${an}%`, /[a-z@]/i.test(an) ? `email.ilike.%${an}%` : "", so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean);
    if (an) q = q.or(dk.join(",")) as Loc;
  }
  if (t.trang_thai) q = q.eq("trang_thai", t.trang_thai) as Loc;
  if (t.nguon) q = q.eq("nguon", t.nguon) as Loc;
  if (t.phu_trach) q = q.eq("nguoi_phu_trach_id", t.phu_trach) as Loc;
  if (t.hang) q = q.eq("hang", t.hang) as Loc;
  const sx = t.sx ?? "ten";
  if (sx === "moi") q = q.order("tao_luc", { ascending: false }) as Loc;
  else if (sx === "chi") q = q.order("chi_12_thang", { ascending: false }) as Loc;
  else q = q.order("ho_ten", { ascending: sx !== "ten_giam" }) as Loc;
  q = q.order("id") as Loc;
  return q as unknown as T;
}

export type SoLieuKhach = { tong: number; moiHomNay: number; sinhNhatHomNay: number; sinhNhatThang: number };

async function tinhSoLieu(homNay: string): Promise<SoLieuKhach> {
  const db = sb();
  const [{ count: tong }, { count: moi }, { count: coNgaySinh }] = await Promise.all([
    db.from("khach_hang").select("id", { count: "exact", head: true }),
    db.from("khach_hang").select("id", { count: "exact", head: true }).gte("tao_luc", `${homNay}T00:00:00+07:00`),
    db.from("khach_hang").select("id", { count: "exact", head: true }).not("ngay_sinh", "is", null),
  ]);
  // PostgREST không lọc theo tháng/ngày của một cột ngày và đợt này không được thêm hàm SQL, nên đọc cột ngày sinh theo từng trang 1000 dòng rồi đếm.
  const thang = homNay.slice(5, 7), ngay = homNay.slice(5);
  const soTrang = Math.min(30, Math.ceil((coNgaySinh ?? 0) / 1000));
  const cacTrang = await Promise.all(Array.from({ length: soTrang }, (_, i) => db.from("khach_hang").select("ngay_sinh").not("ngay_sinh", "is", null).order("id").range(i * 1000, i * 1000 + 999)));
  let sinhThang = 0, sinhNgay = 0;
  for (const tr of cacTrang) for (const r of tr.data ?? []) {
    const nm = (r.ngay_sinh ?? "").slice(5);
    if (nm.slice(0, 2) === thang) { sinhThang++; if (nm === ngay) sinhNgay++; }
  }
  return { tong: tong ?? 0, moiHomNay: moi ?? 0, sinhNhatHomNay: sinhNgay, sinhNhatThang: sinhThang };
}
const soLieuCoDem = unstable_cache(tinhSoLieu, ["khach-so-lieu-dau-trang"], { revalidate: 120 });
/** 4 số đầu trang danh sách khách (giờ Việt Nam). Nhớ 2 phút để mở trang không phải đọc lại cả cột ngày sinh. */
export const soLieuKhach = () => soLieuCoDem(homNayHCM());

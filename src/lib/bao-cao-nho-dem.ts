import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import type { Database } from "@/lib/supabase/database.types";

type Ham = Database["public"]["Functions"];

// Số liệu trang chủ tính trên hàng chục nghìn dòng hoá đơn: giữ 45 giây dùng chung cho mọi người xem cùng chi nhánh (nhiều người mở trang chủ cùng lúc chỉ tính MỘT lần).
// Chỉ lưu SỐ LIỆU THÔ; ai được xem phần nào vẫn do từng trang lọc sau khi lấy. Lỗi thì ném ra để KHÔNG bị lưu đệm.
const GIAY = 45;

/** Đọc kết quả TÍNH SẴN (bảng so_lieu_tinh_san, pg_cron 2 phút/lần — migration 0305) của đúng hàm + tham số; không có hoặc cũ quá 10 phút thì trả undefined
 *  để nơi gọi tự tính trực tiếp như cũ. Đây là đường chính của trang chủ: 1 truy vấn khoá chính vài ms thay vì chạy hàm báo cáo (3–28 s lúc máy CSDL bận). */
export async function docTinhSan<T>(ham: string, thamSo: Record<string, string | number | null>): Promise<T | undefined> {
  try {
    const { data } = await sb().from("so_lieu_tinh_san").select("ket_qua, luc").eq("ham", ham).eq("tham_so", JSON.stringify(thamSo)).maybeSingle();
    if (!data || Date.now() - new Date(data.luc).getTime() > 10 * 60_000) return undefined;
    return data.ket_qua as T;
  } catch { return undefined; }
}

const bcNhanVienNhoSong = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_nhan_vien"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-nhan-vien-nho-v1"], { revalidate: GIAY });

const bcDoanhThuNgayNhoSong = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-doanh-thu-ngay-nho-v1"], { revalidate: GIAY });

/** Tổng thu bằng ví điện tử (Momo, VNPay, Shopee Pay, GrabPay, ví khác) và Ship COD theo ngày (0199) — cho ô "Cơ cấu thu" ở trang chủ. */
const bcDoanhThuNgayViNhoSong = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay_vi"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-doanh-thu-ngay-vi-nho-v1"], { revalidate: GIAY });

/** Top dịch vụ/sản phẩm bán chạy tháng này (ô "Top" ở trang chủ) — tính trên hàng chục nghìn dòng hoá đơn, 0,3–4 s lúc nguội. */
const topBanThangSong = unstable_cache(async (tu: string, cn: string | null): Promise<Ham["top_ban_thang"]["Returns"]> => {
  const { data, error } = await sb().rpc("top_ban_thang", { p_tu: tu, ...(cn ? { p_cn: cn } : {}) });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["top-ban-thang-nho-v1"], { revalidate: GIAY });

/** Top khách chi tiêu 12 tháng (ô "Top khách" ở trang chủ). */
const topKhachSong = unstable_cache(async (so: number, cn: string | null): Promise<Ham["top_khach_chi_12_thang"]["Returns"]> => {
  const { data, error } = await sb().rpc("top_khach_chi_12_thang", { p_so: so, ...(cn ? { p_cn: cn } : {}) });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["top-khach-nho-v1"], { revalidate: GIAY });

export const bcNhanVienNho = async (tu: string, den: string, cn: string | null): Promise<Ham["bc_nhan_vien"]["Returns"]> =>
  (await docTinhSan<Ham["bc_nhan_vien"]["Returns"]>("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: cn })) ?? bcNhanVienNhoSong(tu, den, cn);

export const bcDoanhThuNgayNho = async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay"]["Returns"]> =>
  (await docTinhSan<Ham["bc_doanh_thu_ngay"]["Returns"]>("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn })) ?? bcDoanhThuNgayNhoSong(tu, den, cn);

export const bcDoanhThuNgayViNho = async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay_vi"]["Returns"]> =>
  (await docTinhSan<Ham["bc_doanh_thu_ngay_vi"]["Returns"]>("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: cn })) ?? bcDoanhThuNgayViNhoSong(tu, den, cn);

export const topBanThangNho = async (tu: string, cn: string | null): Promise<Ham["top_ban_thang"]["Returns"]> =>
  (await docTinhSan<Ham["top_ban_thang"]["Returns"]>("top_ban_thang", { p_tu: tu, p_cn: cn })) ?? topBanThangSong(tu, cn);
export const topKhachNho = async (so: number, cn: string | null): Promise<Ham["top_khach_chi_12_thang"]["Returns"]> =>
  (await docTinhSan<Ham["top_khach_chi_12_thang"]["Returns"]>("top_khach_chi_12_thang", { p_so: so, p_cn: cn })) ?? topKhachSong(so, cn);

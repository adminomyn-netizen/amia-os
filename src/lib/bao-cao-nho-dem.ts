import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import type { Database } from "@/lib/supabase/database.types";

type Ham = Database["public"]["Functions"];

// Số liệu trang chủ tính trên hàng chục nghìn dòng hoá đơn: giữ 45 giây dùng chung cho mọi người xem cùng chi nhánh (nhiều người mở trang chủ cùng lúc chỉ tính MỘT lần).
// Chỉ lưu SỐ LIỆU THÔ; ai được xem phần nào vẫn do từng trang lọc sau khi lấy. Lỗi thì ném ra để KHÔNG bị lưu đệm.
const GIAY = 45;

export const bcNhanVienNho = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_nhan_vien"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-nhan-vien-nho-v1"], { revalidate: GIAY });

export const bcDoanhThuNgayNho = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-doanh-thu-ngay-nho-v1"], { revalidate: GIAY });

/** Tổng thu bằng ví điện tử (Momo, VNPay, Shopee Pay, GrabPay, ví khác) và Ship COD theo ngày (0199) — cho ô "Cơ cấu thu" ở trang chủ. */
export const bcDoanhThuNgayViNho = unstable_cache(async (tu: string, den: string, cn: string | null): Promise<Ham["bc_doanh_thu_ngay_vi"]["Returns"]> => {
  const { data, error } = await sb().rpc("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  return data ?? [];
}, ["bc-doanh-thu-ngay-vi-nho-v1"], { revalidate: GIAY });

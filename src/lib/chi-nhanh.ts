import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";

export type ChiNhanhNho = { id: string; ma: string; ten: string; thu_tu: number; hoat_dong: boolean };

async function docTatCa(): Promise<ChiNhanhNho[]> {
  const { data, error } = await sb().from("chi_nhanh").select("id, ma, ten, thu_tu, hoat_dong").order("thu_tu").order("ma");
  // Lỗi thì ném ra để KHÔNG nhớ đệm một danh sách rỗng.
  if (error) throw new Error(`[chi_nhanh] ${error.message}`);
  return data ?? [];
}

/** Danh sách chi nhánh (rất ít đổi, dùng ở khung mọi trang): nhớ 2 phút, xoá ngay khi lưu/xoá chi nhánh (updateTag "chi-nhanh"). Dùng chung mọi người dùng — không chứa dữ liệu riêng của ai. */
export const tatCaChiNhanh = unstable_cache(docTatCa, ["chi-nhanh-tat-ca"], { revalidate: 120, tags: ["chi-nhanh"] });

/** Chi nhánh đang hoạt động, xếp theo thứ tự hiển thị (giống `.eq("hoat_dong", true).order("thu_tu").order("ma")`). */
export const chiNhanhHoatDong = async () => (await tatCaChiNhanh()).filter((c) => c.hoat_dong);

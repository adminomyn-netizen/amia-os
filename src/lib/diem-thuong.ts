// Đổi điểm thưởng thành giảm giá ở Thu ngân. Tỉ lệ lấy đúng SalonHero (convert2money: 1 điểm = 10.000đ); công tắc bật/tắt ở cau_hinh
// (SalonHero đang TẮT đổi điểm nên mặc định tắt — Chủ bật ở Cài đặt › Thông tin chung). Chỉ dùng ở máy chủ.
import type { sb } from "@/lib/db";

export type CauHinhDiem = { bat: boolean; tienMoiDiem: number };
export const DIEM_MAC_DINH: CauHinhDiem = { bat: false, tienMoiDiem: 10000 };

export async function cauHinhDiem(db: ReturnType<typeof sb>): Promise<CauHinhDiem> {
  const { data } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", ["diem.doi_bat", "diem.doi_tien"]);
  const m = new Map((data ?? []).map((x) => [x.khoa, x.gia_tri]));
  const tien = Math.round(Number(m.get("diem.doi_tien")));
  return { bat: m.get("diem.doi_bat") === "1", tienMoiDiem: Number.isInteger(tien) && tien > 0 ? tien : DIEM_MAC_DINH.tienMoiDiem };
}

// Đổi điểm thưởng thành giảm giá ở Thu ngân. Tỉ lệ lấy đúng SalonHero (convert2money: 1 điểm = 10.000đ); công tắc bật/tắt ở cau_hinh
// (SalonHero đang TẮT đổi điểm nên mặc định tắt — Chủ bật ở Cài đặt › Thông tin chung). Chỉ dùng ở máy chủ.
// Màn "Điểm khách hàng" có hiệu lực ở đây (0214, đợt 3): "Có lựa chọn đổi điểm cho thu ngân" (diem.doi_thu_ngan = 0 thì Thu ngân không cho đổi)
// và "1 điểm đổi bao nhiêu tiền" theo HẠNG khách (hang_diem_cau_hinh.tien_doi_moi_diem); hạng chưa cấu hình thì theo diem.doi_tien.
import type { sb } from "@/lib/db";

export type CauHinhDiem = { bat: boolean; tienMoiDiem: number };
export const DIEM_MAC_DINH: CauHinhDiem = { bat: false, tienMoiDiem: 10000 };

/** Cấu hình đổi điểm; truyền hạng khách thì lấy tỉ lệ đổi của hạng đó (như SalonHero quy đổi điểm → tiền theo hạng). */
export async function cauHinhDiem(db: ReturnType<typeof sb>, hang?: string | null): Promise<CauHinhDiem> {
  const [{ data }, { data: h }] = await Promise.all([
    db.from("cau_hinh").select("khoa, gia_tri").in("khoa", ["diem.doi_bat", "diem.doi_tien", "diem.doi_thu_ngan"]),
    hang ? db.from("hang_diem_cau_hinh").select("tien_doi_moi_diem").eq("hang", hang).maybeSingle() : Promise.resolve({ data: null as { tien_doi_moi_diem: number } | null }),
  ]);
  const m = new Map((data ?? []).map((x) => [x.khoa, x.gia_tri]));
  const tienHang = Math.round(Number(h?.tien_doi_moi_diem));
  const tien = Number.isInteger(tienHang) && tienHang > 0 ? tienHang : Math.round(Number(m.get("diem.doi_tien")));
  return { bat: m.get("diem.doi_bat") === "1" && m.get("diem.doi_thu_ngan") !== "0", tienMoiDiem: Number.isInteger(tien) && tien > 0 ? tien : DIEM_MAC_DINH.tienMoiDiem };
}

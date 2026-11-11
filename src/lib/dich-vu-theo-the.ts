import "server-only";
import { sb, thongBaoLoi } from "@/lib/db";

// Gói thẻ liệu trình CHƯA gắn dịch vụ nào (chị Lâm 11/11/2026, thẻ EXION của khách KHAVI18002448: "chọn mà nó không tự động ra dịch vụ").
// SalonHero ghi mỗi lần dùng thẻ thành một dòng dịch vụ MANG TÊN GÓI; AMIA làm giống vậy: lượt làm buổi của thẻ đó dùng dịch vụ tên gói.
// Danh mục chưa có thì tạo MỘT lần (nhóm "DỊCH VỤ THEO THẺ", ẩn ở thu ngân + đặt lịch, giá 0 — doanh thu buổi vẫn lấy theo thẻ),
// để Kết thúc / trừ buổi / phiếu vật tư / hoa hồng / báo cáo chạy như mọi dịch vụ. KHÔNG thêm liên kết gói ↔ dịch vụ
// (thêm vào thì dịch vụ khác thu ngân chọn tay cho thẻ đó sẽ bị chặn khi Kết thúc). Chị đổi tên / giá / nhóm ở Danh mục được.

export const NHOM_DV_THEO_THE = "DỊCH VỤ THEO THẺ";

async function nhomDvTheoThe(): Promise<string | null> {
  const db = sb();
  const { data: co } = await db.from("dich_vu_nhom").select("id").eq("ten", NHOM_DV_THEO_THE).order("thu_tu").limit(1);
  if (co?.[0]) return co[0].id;
  const { data: cuoi } = await db.from("dich_vu_nhom").select("thu_tu").lt("thu_tu", 900).order("thu_tu", { ascending: false }).limit(1);
  const { data: moi } = await db.from("dich_vu_nhom").insert({ ten: NHOM_DV_THEO_THE, thu_tu: (cuoi?.[0]?.thu_tu ?? 0) + 1 }).select("id").maybeSingle();
  return moi?.id ?? null;
}

async function maDvMoi(): Promise<string> {
  const db = sb();
  for (let i = 0; i < 20; i++) {
    const ma = "DV" + String(Number((await db.rpc("so_tiep_theo", { p_khoa: "dich_vu" })).data ?? 0)).padStart(6, "0");
    const { count } = await db.from("dich_vu").select("id", { count: "exact", head: true }).eq("ma", ma);
    if (!count) return ma;
  }
  return "DV" + Date.now().toString().slice(-8);
}

/** Dịch vụ dùng cho lượt làm buổi của thẻ thuộc gói `goiId` khi thu ngân tick dòng "chính thẻ":
 *  gói có liên kết (dịch vụ đã ngưng) → dịch vụ liên kết; danh mục có dịch vụ trùng tên gói → dịch vụ đó; không thì tạo. */
export async function dichVuCuaGoi(goiId: string): Promise<{ id: string } | { loi: string }> {
  const db = sb();
  const { data: g } = await db.from("goi_the").select("id, ten, loai, thoi_gian_1_lan_phut").eq("id", goiId).maybeSingle();
  if (!g) return { loi: "Không tìm thấy gói của thẻ." };
  const { data: lk } = await db.from("goi_the_dich_vu").select("dich_vu_id, dich_vu(hoat_dong)").eq("goi_id", goiId);
  if (lk?.length) {
    const hd = lk.find((x) => (x.dich_vu as { hoat_dong?: boolean } | null)?.hoat_dong) ?? lk[0];
    return { id: hd.dich_vu_id };
  }
  const ten = String(g.ten).trim();
  const { data: trung } = await db.from("dich_vu").select("id").eq("ten", ten).order("hoat_dong", { ascending: false }).order("tao_luc").limit(1);
  if (trung?.[0]) return { id: trung[0].id };
  const nhom = await nhomDvTheoThe();
  if (!nhom) return { loi: `${ten}: chưa tạo được dịch vụ cho thẻ, thử lại.` };
  const phut = Number(g.thoi_gian_1_lan_phut) > 0 && Number(g.thoi_gian_1_lan_phut) <= 24 * 60 ? Number(g.thoi_gian_1_lan_phut) : 60;
  const { data: moi, error } = await db.from("dich_vu").insert({
    ma: await maDvMoi(), nhom_id: nhom, ten, don_vi_tinh: "buổi", thoi_luong_phut: phut, gia: 0, hoat_dong: true, noi_hien_thi: "an",
    mo_ta: `Tự tạo khi làm buổi thẻ "${ten}" (gói chưa gắn dịch vụ). Đổi tên / giá / nhóm ở Danh mục nếu cần.`,
  }).select("id").maybeSingle();
  if (error || !moi) return { loi: `${ten}: chưa tạo được dịch vụ cho thẻ (${thongBaoLoi(error) || "lỗi"}).` };
  return { id: moi.id };
}

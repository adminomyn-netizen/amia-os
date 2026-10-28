import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { homNayHCM } from "@/lib/dinh-dang";

export const BANG = [
  ["khach_hang", "Khách hàng", "xanh"], ["hoa_don", "Hoá đơn", "luc"], ["the_khach", "Thẻ khách", "tim"], ["buoi_thuc_hien", "Buổi liệu trình", "cam"],
  ["kho_so_cai", "Sổ cái kho", "hong"], ["cham_cong", "Chấm công", "xanh"], ["nhat_ky_truy_cap", "Nhật ký truy cập", "luc"],
] as const;

/** Mốc thời gian để đo "dựng trang"; gọi ở đầu trang. */
export const mocDo = () => performance.now();

/** Đo hiệu suất toàn ứng dụng tại thời điểm gọi: độ trễ CSDL, người dùng hoạt động, thiết bị nhận thông báo, quy mô dữ liệu, truy cập 7 ngày. */
export async function doHieuSuatApp(batDau: number) {
  const db = sb(), hom = homNayHCM();
  const do1 = async () => { const t = performance.now(); await db.from("nhan_vien").select("id", { head: true, count: "exact" }); return performance.now() - t; };
  const doNang = async () => { const t = performance.now(); await db.rpc("bc_doanh_thu_ngay", { p_tu: hom.slice(0, 8) + "01", p_den: hom }); return performance.now() - t; };
  const bay = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [nhe, nang, dem, nk, { data: us }, { count: thietBi }, { data: nhacCuoi }] = await Promise.all([
    do1(), doNang(),
    Promise.all(BANG.map(async ([b]) => (await db.from(b).select("id", { count: "exact", head: true })).count ?? 0)),
    db.from("nhat_ky_truy_cap").select("luc").gte("luc", bay).limit(5000),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 }).then((r) => ({ data: r.data?.users ?? [] })),
    db.from("dang_ky_thong_bao").select("id", { count: "exact", head: true }),
    db.from("nhac_da_gui").select("gui_luc").order("gui_luc", { ascending: false }).limit(1),
  ]);
  const now = Date.now();
  const dn24 = us.filter((u) => u.last_sign_in_at && now - Date.parse(u.last_sign_in_at) < 86_400_000).length;
  const dn7 = us.filter((u) => u.last_sign_in_at && now - Date.parse(u.last_sign_in_at) < 7 * 86_400_000).length;
  const theoNgay = new Map<string, number>();
  for (const r of nk.data ?? []) { const n = new Date(Date.parse(r.luc) + 7 * 3_600_000).toISOString().slice(0, 10); theoNgay.set(n, (theoNgay.get(n) ?? 0) + 1); }
  const ngay7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(now + 7 * 3_600_000 - (6 - i) * 86_400_000).toISOString().slice(0, 10); return { d, so: theoNgay.get(d) ?? 0 }; });
  const max7 = Math.max(1, ...ngay7.map((x) => x.so)), maxB = Math.max(1, ...dem);
  const dung = Math.round(performance.now() - batDau);
  return { nhe, nang, dung, dem, dn24, dn7, tongTk: us.length, thietBi: thietBi ?? 0, nhacCuoi: nhacCuoi?.[0]?.gui_luc ?? null, ngay7, max7, maxB };
}

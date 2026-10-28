import { sb } from "@/lib/db";
import { thuCuaNgay } from "@/lib/nhan-su";

export type Ca = { id: string; ten: string; gio_vao: string; gio_ra: string; dung_sai_phut: number };
/** `ca` null = hôm đó không phải chấm công; `lyDo` nói rõ vì sao (hiện cho người dùng thay vì để họ đoán). */
export type CaNgay = { ca: Ca | null; lyDo: string | null };
const COT = "id, ten, gio_vao, gio_ra, dung_sai_phut";
const KHONG = (lyDo: string): CaNgay => ({ ca: null, lyDo });
const NHAN_PHIEU: Record<string, string> = { nghi: "nghỉ", cong_tac: "đi công tác", lam_online: "làm việc online" };

/** Ca của một người trong một ngày theo quy định thời gian làm việc của MSC:
 *  1. Lịch phân ca (có ca → theo ca; ngày nghỉ được xếp → nghỉ) luôn được ưu tiên, kể cả Chủ nhật và ngày lễ (trực).
 *  2. Không có lịch: ngày lễ, phiếu nghỉ / công tác / làm online cả ngày đã duyệt, Chủ nhật → không chấm công. Thứ Bảy khối văn phòng làm xen kẽ nên phải được xếp ca.
 *  3. Còn lại: ca mặc định theo khung làm việc (văn phòng 08:00–17:00, chi nhánh 08:00–18:30). Khung "Không chấm công" luôn null. */
export async function caCuaNgayChiTiet(nv: string, ngay: string): Promise<CaNgay> {
  const db = sb();
  const [{ data: n }, { data: pc }] = await Promise.all([
    db.from("nhan_vien").select("khung_lam_viec, trang_thai_lam").eq("id", nv).maybeSingle(),
    db.from("phan_ca").select("nghi, ca_id").eq("nhan_vien_id", nv).eq("ngay", ngay).maybeSingle(),
  ]);
  if (!n) return KHONG("Chưa có hồ sơ nhân viên của bạn, nhờ bộ phận nhân sự tạo.");
  if (n.khung_lam_viec === "khong_cham_cong") return KHONG("Tài khoản của bạn thuộc khung Không chấm công (tính đủ công chuẩn mỗi tháng) nên không cần chấm công. Nếu cần chấm công, nhờ bộ phận nhân sự đổi khung làm việc.");
  if (n.trang_thai_lam !== "dang_lam") return KHONG("Hồ sơ của bạn đang ở trạng thái không đi làm.");
  if (pc?.nghi) return KHONG("Hôm nay là ngày nghỉ theo lịch phân ca của bạn.");
  if (pc?.ca_id) { const { data } = await db.from("ca_lam").select(COT).eq("id", pc.ca_id).maybeSingle(); if (data) return { ca: data, lyDo: null }; }
  const [{ data: le }, { data: ph }] = await Promise.all([
    db.from("ngay_le").select("ten").eq("ngay", ngay).maybeSingle(),
    db.from("phieu_hr").select("loai, tu_ngay, den_ngay, so_ngay").eq("nhan_vien_id", nv).eq("trang_thai", "da_duyet").in("loai", ["nghi", "cong_tac", "lam_online"]).lte("tu_ngay", ngay).gte("den_ngay", ngay),
  ]);
  if (le) return KHONG(`Hôm nay là ngày lễ: ${le.ten}.`);
  // Nghỉ nửa ngày (một ngày, dưới 1 công) vẫn có ca, người đó chỉ chấm nửa còn lại.
  const caNgay = (ph ?? []).find((p) => p.tu_ngay !== p.den_ngay || Number(p.so_ngay) >= 1);
  if (caNgay) return KHONG(`Hôm nay bạn có phiếu ${NHAN_PHIEU[caNgay.loai]} đã duyệt nên không cần chấm công.`);
  const thu = thuCuaNgay(ngay);
  if (thu === 0) return KHONG("Chủ nhật là ngày nghỉ. Nếu cần làm việc, nhờ quản lý xếp ca (Phân ca) hoặc tạo phiếu Làm thêm giờ.");
  if (thu === 6 && n.khung_lam_viec === "van_phong") return KHONG("Thứ Bảy khối văn phòng làm xen kẽ theo lịch. Bạn chưa được xếp ca hôm nay, nhờ quản lý xếp ca (Phân ca) nếu cần làm.");
  const { data } = await db.from("ca_lam").select(COT).eq("ma", n.khung_lam_viec === "van_phong" ? "VP_HC" : "CN_DAI").maybeSingle();
  return data ? { ca: data, lyDo: null } : KHONG("Chưa cấu hình ca làm mặc định, nhờ bộ phận nhân sự thêm ca.");
}

export async function caCuaNgay(nv: string, ngay: string): Promise<Ca | null> { return (await caCuaNgayChiTiet(nv, ngay)).ca; }

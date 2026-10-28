import { sb } from "@/lib/db";
import { thuCuaNgay } from "@/lib/nhan-su";

export type Ca = { id: string; ten: string; gio_vao: string; gio_ra: string; dung_sai_phut: number };
/** `ca` null = hôm đó không phải chấm công; `lyDo` nói rõ vì sao (hiện cho người dùng thay vì để họ đoán). */
export type CaNgay = { ca: Ca | null; lyDo: string | null; chiNhanhId?: string | null };
const COT = "id, ten, gio_vao, gio_ra, dung_sai_phut";
const KHONG = (lyDo: string): CaNgay => ({ ca: null, lyDo });
const NHAN_PHIEU: Record<string, string> = { nghi: "nghỉ", cong_tac: "đi công tác", lam_online: "làm việc online" };

/** Ca của nhiều người trong một ngày (`nvIds` rỗng/không truyền = mọi nhân viên đang làm) theo quy định thời gian làm việc của MSC:
 *  1. Lịch phân ca (có ca → theo ca; ngày nghỉ được xếp → nghỉ) luôn được ưu tiên, kể cả Chủ nhật và ngày lễ (trực).
 *  2. Không có lịch: ngày lễ, phiếu nghỉ / công tác / làm online cả ngày đã duyệt, Chủ nhật → không chấm công. Thứ Bảy khối văn phòng làm xen kẽ nên phải được xếp ca.
 *  3. Còn lại: ca mặc định theo khung làm việc (văn phòng 08:00–17:00, chi nhánh 08:00–18:30). Khung "Không chấm công" luôn null.
 *  Một chỗ tính duy nhất: trang chấm công, chuông nhắc và thông báo đẩy đều gọi hàm này nên không bao giờ lệch nhau. */
export async function caCuaNhieuNguoi(ngay: string, nvIds?: string[]): Promise<Map<string, CaNgay>> {
  const db = sb();
  let qNv = db.from("nhan_vien").select("id, khung_lam_viec, trang_thai_lam, chi_nhanh_id");
  qNv = nvIds?.length ? qNv.in("id", nvIds) : qNv.eq("hoat_dong", true);
  const [{ data: nvs }, { data: pcs }, { data: cas }, { data: le }, { data: phs }] = await Promise.all([
    qNv,
    db.from("phan_ca").select("nhan_vien_id, nghi, ca_id").eq("ngay", ngay),
    db.from("ca_lam").select(`${COT}, ma`),
    db.from("ngay_le").select("ten").eq("ngay", ngay).maybeSingle(),
    db.from("phieu_hr").select("nhan_vien_id, loai, tu_ngay, den_ngay, so_ngay").eq("trang_thai", "da_duyet").in("loai", ["nghi", "cong_tac", "lam_online"]).lte("tu_ngay", ngay).gte("den_ngay", ngay),
  ]);
  const caTheoId = new Map((cas ?? []).map((c) => [c.id, c])), caTheoMa = new Map((cas ?? []).map((c) => [c.ma, c]));
  const pcTheoNv = new Map((pcs ?? []).map((p) => [p.nhan_vien_id, p]));
  const phTheoNv = new Map<string, NonNullable<typeof phs>[number]>();
  // Nghỉ nửa ngày (một ngày, dưới 1 công) vẫn có ca, người đó chỉ chấm nửa còn lại.
  for (const p of phs ?? []) if (p.tu_ngay !== p.den_ngay || Number(p.so_ngay) >= 1) phTheoNv.set(p.nhan_vien_id, p);
  const thu = thuCuaNgay(ngay);
  const ra = new Map<string, CaNgay>();
  for (const n of nvs ?? []) {
    const pc = pcTheoNv.get(n.id), ph = phTheoNv.get(n.id);
    let kq: CaNgay;
    if (n.khung_lam_viec === "khong_cham_cong") kq = KHONG("Tài khoản của bạn thuộc khung Không chấm công (tính đủ công chuẩn mỗi tháng) nên không cần chấm công. Nếu cần chấm công, nhờ bộ phận nhân sự đổi khung làm việc.");
    else if (n.trang_thai_lam !== "dang_lam") kq = KHONG("Hồ sơ của bạn đang ở trạng thái không đi làm.");
    else if (pc?.nghi) kq = KHONG("Hôm nay là ngày nghỉ theo lịch phân ca của bạn.");
    else if (pc?.ca_id && caTheoId.get(pc.ca_id)) kq = { ca: caTheoId.get(pc.ca_id)!, lyDo: null };
    else if (le) kq = KHONG(`Hôm nay là ngày lễ: ${le.ten}.`);
    else if (ph) kq = KHONG(`Hôm nay bạn có phiếu ${NHAN_PHIEU[ph.loai]} đã duyệt nên không cần chấm công.`);
    else if (thu === 0) kq = KHONG("Chủ nhật là ngày nghỉ. Nếu cần làm việc, nhờ quản lý xếp ca (Phân ca) hoặc tạo phiếu Làm thêm giờ.");
    else if (thu === 6 && n.khung_lam_viec === "van_phong") kq = KHONG("Thứ Bảy khối văn phòng làm xen kẽ theo lịch. Bạn chưa được xếp ca hôm nay, nhờ quản lý xếp ca (Phân ca) nếu cần làm.");
    else {
      const mac = caTheoMa.get(n.khung_lam_viec === "van_phong" ? "VP_HC" : "CN_DAI");
      kq = mac ? { ca: mac, lyDo: null } : KHONG("Chưa cấu hình ca làm mặc định, nhờ bộ phận nhân sự thêm ca.");
    }
    ra.set(n.id, { ...kq, chiNhanhId: n.chi_nhanh_id });
  }
  return ra;
}

export async function caCuaNgayChiTiet(nv: string, ngay: string): Promise<CaNgay> {
  return (await caCuaNhieuNguoi(ngay, [nv])).get(nv) ?? KHONG("Chưa có hồ sơ nhân viên của bạn, nhờ bộ phận nhân sự tạo.");
}
export async function caCuaNgay(nv: string, ngay: string): Promise<Ca | null> { return (await caCuaNgayChiTiet(nv, ngay)).ca; }

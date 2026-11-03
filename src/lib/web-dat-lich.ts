// Các tuỳ chọn "Web đặt Lịch" của SalonHero (#/setting-public-booking, đọc 29/10 và 03/11/2026).
// Khoá cũ của trang /dat-lich (không có bản sao thứ hai): đặt trước tối thiểu = dat_online.bao_truoc_phut, giới hạn số ngày = dat_online.toi_da_ngay (Không giới hạn = 60),
//   khoá trang = ngược của dat_online.mo. Mọi tuỳ chọn còn lại ở JSON dat_online.tuy_chon.
// Từ đợt 4 (03/11/2026, migration 0270) TẤT CẢ tuỳ chọn đều có hiệu lực trên /dat-lich: hàm khung_gio_online + dat_lich_online trong DB đọc khungPhut, toiDaLuot,
//   gioiHanRieng, thoiLuongPhut, hienDvSp, chonKtv, doiTuong, trangThai; trang đọc hienBuoi, hienGia, ngonNgu, mau, anhBia; thông báo đọc tatThongBao, amThanh, guiEmailNv, emailNhan.
import type { sb } from "@/lib/db";

export type LuaChonWeb = { gia_tri: string; nhan: string };
export const DOI_TUONG: LuaChonWeb[] = [{ gia_tri: "ca", nhan: "Cả khách nam và nữ" }, { gia_tri: "nu", nhan: "Chỉ khách nữ" }, { gia_tri: "nam", nhan: "Chỉ khách nam" }];
export const KHUNG_GIO: LuaChonWeb[] = [["10", "10 phút"], ["15", "15 phút"], ["30", "30 phút"], ["60", "1 giờ"], ["90", "1 giờ 30phút"], ["120", "2 giờ"], ["180", "3 giờ"], ["240", "4 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const DAT_TRUOC: LuaChonWeb[] = [["0", "Không hạn chế"], ["15", "15 phút"], ["30", "30 phút"], ["60", "1 giờ"], ["120", "2 giờ"], ["240", "4 giờ"], ["360", "6 giờ"], ["480", "8 giờ"], ["720", "12 giờ"], ["1440", "24 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const GIOI_HAN_NGAY: LuaChonWeb[] = [["3", "3 ngày"], ["5", "5 ngày"], ["7", "1 tuần"], ["14", "2 tuần"], ["30", "1 tháng"], ["60", "Không giới hạn"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const THOI_LUONG: LuaChonWeb[] = [["0", "0 phút"], ["15", "15 phút"], ["30", "30 phút"], ["45", "45 phút"], ["60", "60 phút"], ["75", "75 phút"], ["90", "90 phút"], ["120", "2 giờ"], ["240", "4 giờ"], ["360", "6 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const TRANG_THAI: LuaChonWeb[] = [{ gia_tri: "chua_xac_nhan", nhan: "Chưa xác nhận" }, { gia_tri: "da_xac_nhan", nhan: "Đã xác nhận" }];
export const NGON_NGU: LuaChonWeb[] = [{ gia_tri: "vi", nhan: "Tiếng Việt" }, { gia_tri: "en", nhan: "English" }];

/** Một dòng "Tùy chọn giới hạn số lịch đặt" (SalonHero custom_limit_booking): khung giờ bắt đầu trong [tu, den) của các thứ đã chọn (rỗng = mọi thứ), tại chi nhánh (null = mọi chi nhánh), tối đa `so` lượt. */
export type GioiHan = { tu: string; den: string; so: number; thu: string[]; cn: string | null };
export const THU_WEB = ["t2", "t3", "t4", "t5", "t6", "t7", "cn"] as const;

export type WebDatLich = {
  baoTruocPhut: number; toiDaNgay: number; khoaTrang: boolean;
  chonKtv: boolean; hienDvSp: boolean; hienBuoi: boolean; hienGia: boolean; doiTuong: string; khungPhut: number; toiDaLuot: number; thoiLuongPhut: number;
  trangThai: string; ngonNgu: string; mau: string; macDinhMau: boolean; tatThongBao: boolean; guiEmailNv: boolean; emailNhan: string[]; amThanh: boolean;
  gioiHanRieng: GioiHan[]; /** Đường dẫn ảnh bìa trong kho blog-anh (null = ảnh bìa mặc định theo màu). */ anhBia: string | null;
};
export const WEB_MAC_DINH: WebDatLich = {
  baoTruocPhut: 120, toiDaNgay: 60, khoaTrang: true,
  chonKtv: false, hienDvSp: false, hienBuoi: true, hienGia: false, doiTuong: "ca", khungPhut: 15, toiDaLuot: 10, thoiLuongPhut: 30,
  trangThai: "chua_xac_nhan", ngonNgu: "vi", mau: "#207f7e", macDinhMau: false, tatThongBao: false, guiEmailNv: true, emailNhan: [], amThanh: true,
  gioiHanRieng: [], anhBia: null,
};
const GIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Lọc các dòng giới hạn riêng: bỏ dòng hỏng, tối đa 30 dòng. */
export function docGioiHan(v: unknown): GioiHan[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x): GioiHan[] => {
    if (!x || typeof x !== "object") return [];
    const r = x as Record<string, unknown>;
    if (typeof r.tu !== "string" || typeof r.den !== "string" || !GIO.test(r.tu) || !GIO.test(r.den) || typeof r.so !== "number" || !Number.isInteger(r.so)) return [];
    const thu = Array.isArray(r.thu) ? r.thu.filter((t): t is string => typeof t === "string" && (THU_WEB as readonly string[]).includes(t)) : [];
    return [{ tu: r.tu, den: r.den, so: r.so, thu, cn: typeof r.cn === "string" && UUID.test(r.cn) ? r.cn : null }];
  }).slice(0, 30);
}
/** Thời lượng lịch khi khách không chọn dịch vụ (SalonHero: 0 phút → 30 phút). */
export const thoiLuongMacDinh = (t: WebDatLich) => (t.thoiLuongPhut >= 5 ? t.thoiLuongPhut : 30);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAU = /^#[0-9a-fA-F]{6}$/;
const thuocDs = (ds: LuaChonWeb[], v: string) => ds.some((d) => d.gia_tri === v);

/** Đọc cau_hinh → cấu hình. Giá trị hỏng rơi về mặc định, không ném lỗi. */
export function docWebDatLich(dong: { khoa: string; gia_tri: string }[] | null): WebDatLich {
  const m = new Map((dong ?? []).map((x) => [x.khoa, x.gia_tri]));
  const d = WEB_MAC_DINH;
  const so = (v: string | undefined, mac: number) => { const n = Number(v); return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : mac; };
  let j: Partial<WebDatLich> = {};
  try { const x = JSON.parse(m.get("dat_online.tuy_chon") ?? "{}"); if (x && typeof x === "object" && !Array.isArray(x)) j = x; } catch { /* giữ mặc định */ }
  const b = (v: unknown, mac: boolean) => (typeof v === "boolean" ? v : mac);
  const s = (v: unknown, ds: LuaChonWeb[], mac: string) => (typeof v === "string" && thuocDs(ds, v) ? v : mac);
  return {
    baoTruocPhut: so(m.get("dat_online.bao_truoc_phut"), d.baoTruocPhut), toiDaNgay: Math.max(1, so(m.get("dat_online.toi_da_ngay"), d.toiDaNgay)), khoaTrang: m.get("dat_online.mo") !== "1",
    chonKtv: b(j.chonKtv, d.chonKtv), hienDvSp: b(j.hienDvSp, d.hienDvSp), hienBuoi: b(j.hienBuoi, d.hienBuoi), hienGia: b(j.hienGia, d.hienGia),
    doiTuong: s(j.doiTuong, DOI_TUONG, d.doiTuong), khungPhut: Number(s(String(j.khungPhut ?? ""), KHUNG_GIO, String(d.khungPhut))), toiDaLuot: typeof j.toiDaLuot === "number" && j.toiDaLuot >= 1 && j.toiDaLuot <= 999 ? Math.round(j.toiDaLuot) : d.toiDaLuot,
    thoiLuongPhut: Number(s(String(j.thoiLuongPhut ?? ""), THOI_LUONG, String(d.thoiLuongPhut))), trangThai: s(j.trangThai, TRANG_THAI, d.trangThai), ngonNgu: s(j.ngonNgu, NGON_NGU, d.ngonNgu),
    mau: typeof j.mau === "string" && MAU.test(j.mau) ? j.mau : d.mau, macDinhMau: b(j.macDinhMau, d.macDinhMau), tatThongBao: b(j.tatThongBao, d.tatThongBao), guiEmailNv: b(j.guiEmailNv, d.guiEmailNv),
    emailNhan: Array.isArray(j.emailNhan) ? j.emailNhan.filter((e): e is string => typeof e === "string" && EMAIL.test(e)).slice(0, 20) : [], amThanh: b(j.amThanh, d.amThanh),
    gioiHanRieng: docGioiHan(j.gioiHanRieng), anhBia: typeof j.anhBia === "string" && /^dat-lich\/[\w.-]+$/.test(j.anhBia) ? j.anhBia : null,
  };
}

export const KHOA_WEB_DAT_LICH = ["dat_online.bao_truoc_phut", "dat_online.toi_da_ngay", "dat_online.mo", "dat_online.tuy_chon"];

/** Kiểm tra giá trị gửi lên; trả lỗi tiếng Việt hoặc chuỗi rỗng. */
export function loiWebDatLich(t: WebDatLich): string {
  if (!Number.isInteger(t.baoTruocPhut) || t.baoTruocPhut < 0 || t.baoTruocPhut > 10080) return "Đặt trước tối thiểu từ 0 đến 10.080 phút.";
  if (!Number.isInteger(t.toiDaNgay) || t.toiDaNgay < 1 || t.toiDaNgay > 60) return "Chỉ nhận đặt trong 1 đến 60 ngày tới.";
  if (!thuocDs(DOI_TUONG, t.doiTuong) || !thuocDs(TRANG_THAI, t.trangThai) || !thuocDs(NGON_NGU, t.ngonNgu)) return "Một ô chọn chưa đúng giá trị.";
  if (!thuocDs(KHUNG_GIO, String(t.khungPhut)) || !thuocDs(THOI_LUONG, String(t.thoiLuongPhut))) return "Khung giờ hoặc thời gian làm dịch vụ chưa đúng.";
  if (!Number.isInteger(t.toiDaLuot) || t.toiDaLuot < 1 || t.toiDaLuot > 999) return "Số lượt khách tối đa cho 1 khung giờ từ 1 đến 999.";
  if (!MAU.test(t.mau)) return "Màu nhập dạng #207f7e.";
  if (t.emailNhan.length > 20 || t.emailNhan.some((e) => !EMAIL.test(e))) return "Email nhận thông báo chưa đúng (tối đa 20 địa chỉ).";
  if (t.gioiHanRieng.length > 30) return "Tối đa 30 dòng giới hạn số lịch đặt.";
  for (const [i, g] of t.gioiHanRieng.entries()) {
    if (!GIO.test(g.tu) || !GIO.test(g.den) || g.tu >= g.den) return `Dòng giới hạn ${i + 1}: giờ kết thúc phải sau giờ bắt đầu (dạng 08:00).`;
    if (!Number.isInteger(g.so) || g.so < 0 || g.so > 99) return `Dòng giới hạn ${i + 1}: số lịch từ 0 đến 99.`;
  }
  return "";
}

export function dongWebDatLich(t: WebDatLich) {
  const { baoTruocPhut, toiDaNgay, khoaTrang, ...rest } = t;
  return [
    { khoa: "dat_online.bao_truoc_phut", gia_tri: String(baoTruocPhut), ghi_chu: "Khách phải đặt trước giờ hẹn ít nhất bao nhiêu phút (0 = không hạn chế)" },
    { khoa: "dat_online.toi_da_ngay", gia_tri: String(toiDaNgay), ghi_chu: "Khách chỉ đặt được trong bấy nhiêu ngày tới (60 = không giới hạn)" },
    { khoa: "dat_online.mo", gia_tri: khoaTrang ? "0" : "1", ghi_chu: "1 = mở trang đặt lịch cho khách; 0 = khoá" },
    { khoa: "dat_online.tuy_chon", gia_tri: JSON.stringify(rest), ghi_chu: "Tuỳ chọn Web đặt Lịch như SalonHero (mọi tuỳ chọn có hiệu lực trên /dat-lich từ migration 0270)" },
  ];
}

export async function layWebDatLich(db: ReturnType<typeof sb>): Promise<WebDatLich> {
  const { data } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", KHOA_WEB_DAT_LICH);
  return docWebDatLich(data);
}

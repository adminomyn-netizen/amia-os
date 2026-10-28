// Các tuỳ chọn "Web đặt Lịch" của SalonHero (#/setting-public-booking, đọc 29/10/2026).
// BA tuỳ chọn ĐÃ CÓ HIỆU LỰC vì dùng chung khoá cũ của trang /dat-lich (không có bản sao thứ hai):
//   • Cho phép đặt lịch trước giờ bắt đầu  = dat_online.bao_truoc_phut (phút; "Không hạn chế" = 0)
//   • Giới hạn số ngày đặt lịch trước      = dat_online.toi_da_ngay (ngày; "Không giới hạn" = 60, mức tối đa của hàm đặt lịch)
//   • Khoá trang web đặt lịch              = ngược của dat_online.mo
// Các tuỳ chọn còn lại ĐÃ LƯU (JSON ở khoá dat_online.tuy_chon) nhưng trang /dat-lich CHƯA dùng; giá trị mặc định = SalonHero của AMIA.
import type { sb } from "@/lib/db";

export type LuaChonWeb = { gia_tri: string; nhan: string };
export const DOI_TUONG: LuaChonWeb[] = [{ gia_tri: "ca", nhan: "Cả khách nam và nữ" }, { gia_tri: "nu", nhan: "Chỉ khách nữ" }, { gia_tri: "nam", nhan: "Chỉ khách nam" }];
export const KHUNG_GIO: LuaChonWeb[] = [["10", "10 phút"], ["15", "15 phút"], ["30", "30 phút"], ["60", "1 giờ"], ["90", "1 giờ 30phút"], ["120", "2 giờ"], ["180", "3 giờ"], ["240", "4 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const DAT_TRUOC: LuaChonWeb[] = [["0", "Không hạn chế"], ["15", "15 phút"], ["30", "30 phút"], ["60", "1 giờ"], ["120", "2 giờ"], ["240", "4 giờ"], ["360", "6 giờ"], ["480", "8 giờ"], ["720", "12 giờ"], ["1440", "24 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const GIOI_HAN_NGAY: LuaChonWeb[] = [["3", "3 ngày"], ["5", "5 ngày"], ["7", "1 tuần"], ["14", "2 tuần"], ["30", "1 tháng"], ["60", "Không giới hạn"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const THOI_LUONG: LuaChonWeb[] = [["0", "0 phút"], ["15", "15 phút"], ["30", "30 phút"], ["45", "45 phút"], ["60", "60 phút"], ["75", "75 phút"], ["90", "90 phút"], ["120", "2 giờ"], ["240", "4 giờ"], ["360", "6 giờ"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
export const TRANG_THAI: LuaChonWeb[] = [{ gia_tri: "chua_xac_nhan", nhan: "Chưa xác nhận" }, { gia_tri: "da_xac_nhan", nhan: "Đã xác nhận" }];
export const NGON_NGU: LuaChonWeb[] = [{ gia_tri: "vi", nhan: "Tiếng Việt" }, { gia_tri: "en", nhan: "English" }];

export type WebDatLich = {
  // có hiệu lực
  baoTruocPhut: number; toiDaNgay: number; khoaTrang: boolean;
  // đã lưu, chưa áp dụng
  chonKtv: boolean; hienDvSp: boolean; hienBuoi: boolean; hienGia: boolean; doiTuong: string; khungPhut: number; toiDaLuot: number; thoiLuongPhut: number;
  trangThai: string; ngonNgu: string; mau: string; macDinhMau: boolean; tatThongBao: boolean; guiEmailNv: boolean; emailNhan: string[]; amThanh: boolean;
};
export const WEB_MAC_DINH: WebDatLich = {
  baoTruocPhut: 120, toiDaNgay: 60, khoaTrang: true,
  chonKtv: false, hienDvSp: false, hienBuoi: true, hienGia: false, doiTuong: "ca", khungPhut: 15, toiDaLuot: 10, thoiLuongPhut: 30,
  trangThai: "chua_xac_nhan", ngonNgu: "vi", mau: "#207f7e", macDinhMau: false, tatThongBao: false, guiEmailNv: true, emailNhan: [], amThanh: true,
};
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
  return "";
}

export function dongWebDatLich(t: WebDatLich) {
  const { baoTruocPhut, toiDaNgay, khoaTrang, ...rest } = t;
  return [
    { khoa: "dat_online.bao_truoc_phut", gia_tri: String(baoTruocPhut), ghi_chu: "Khách phải đặt trước giờ hẹn ít nhất bao nhiêu phút (0 = không hạn chế)" },
    { khoa: "dat_online.toi_da_ngay", gia_tri: String(toiDaNgay), ghi_chu: "Khách chỉ đặt được trong bấy nhiêu ngày tới (60 = không giới hạn)" },
    { khoa: "dat_online.mo", gia_tri: khoaTrang ? "0" : "1", ghi_chu: "1 = mở trang đặt lịch cho khách; 0 = khoá" },
    { khoa: "dat_online.tuy_chon", gia_tri: JSON.stringify(rest), ghi_chu: "Tuỳ chọn Web đặt Lịch như SalonHero, đã lưu nhưng trang /dat-lich chưa dùng" },
  ];
}

export async function layWebDatLich(db: ReturnType<typeof sb>): Promise<WebDatLich> {
  const { data } = await db.from("cau_hinh").select("khoa, gia_tri").in("khoa", KHOA_WEB_DAT_LICH);
  return docWebDatLich(data);
}

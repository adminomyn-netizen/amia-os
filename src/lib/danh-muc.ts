// Hằng số + hàm thuần cho Danh mục (dịch vụ, sản phẩm, loại thẻ): đối chiếu SalonHero #/service, #/product, #/cards (03/11/2026).
// Các cột mới chỉ LƯU và HIỂN THỊ; chưa nối vào thu ngân, hoá đơn, kho.
import type { LuaChon } from "@/components/ui/Chon";

const lc = (ds: [string, string][]): LuaChon[] => ds.map(([gia_tri, nhan]) => ({ gia_tri, nhan }));

/** Đơn vị tính của dịch vụ: 6 đơn vị đã có ở AMIA + 17 đơn vị trong danh sách chọn của SalonHero (đọc thật 03/11/2026). */
export const DON_VI_DICH_VU: LuaChon[] = [...["buổi", "vùng", "shot", "line", "lần", "liệu trình", "chuyến", "khách", "khoá", "phòng", "chỗ", "ghế", "giờ", "phút", "tháng", "năm", "món", "đĩa", "gói", "đêm", "phần"]].map((x) => ({ gia_tri: x, nhan: x }));

export const DOI_TUONG = lc([["ca_hai", "Nam và nữ"], ["nam", "Nam"], ["nu", "Nữ"]]);
export const NHAN_DOI_TUONG: Record<string, string> = { ca_hai: "Nam và nữ", nam: "Nam", nu: "Nữ" };

/** "Tùy chọn nơi hiển thị" của SalonHero (4 lựa chọn). */
export const NOI_HIEN_THI = lc([["tat_ca", "Hiển thị ở cả thu ngân và đặt lịch"], ["thu_ngan", "Chỉ hiển thị ở thu ngân"], ["dat_lich", "Chỉ hiển thị ở đặt lịch"], ["an", "Không hiển thị ở cả thu ngân và đặt lịch"]]);
export const NHAN_NOI_HIEN_THI: Record<string, string> = { tat_ca: "Thu ngân + đặt lịch", thu_ngan: "Chỉ thu ngân", dat_lich: "Chỉ đặt lịch", an: "Ẩn" };

/** VAT dạng chọn: 10/8/5/0 ghi vào vat_pct, hai mã đặc biệt ghi vào vat_loai (vat_pct = 0). */
export const VAT_CHON = lc([["10", "10%"], ["8", "8%"], ["5", "5%"], ["0", "0%"], ["khong_chiu_thue", "Không chịu thuế"], ["khong_ke_khai", "Không kê khai"]]);
export const vatThanhChon = (pct: number | string | null | undefined, loai: string | null | undefined): string => (loai ? loai : String(Number(pct ?? 0)));
export function vatTuChon(chon: string): { vat_pct: number; vat_loai: string | null } | null {
  if (chon === "khong_chiu_thue" || chon === "khong_ke_khai") return { vat_pct: 0, vat_loai: chon };
  const n = Number(chon);
  return [0, 5, 8, 10].includes(n) ? { vat_pct: n, vat_loai: null } : null;
}
export const nhanVat = (pct: number | string | null | undefined, loai: string | null | undefined) => VAT_CHON.find((v) => v.gia_tri === vatThanhChon(pct, loai))?.nhan ?? `${Number(pct ?? 0)}%`;

/** Thời lượng: giờ (0–10) + phút (bước 5) và tổng phút. */
export const GIO_CHON: LuaChon[] = Array.from({ length: 11 }, (_, i) => ({ gia_tri: String(i), nhan: `${i} tiếng` }));
export const PHUT_CHON: LuaChon[] = Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i * 5), nhan: `${i * 5} phút` }));
export const tachGioPhut = (tong: number) => ({ tg_gio: String(Math.floor(tong / 60)), tg_phut: String(tong % 60) });
export const nhanThoiLuong = (tong: number) => (tong >= 60 ? `${Math.floor(tong / 60)} giờ${tong % 60 ? ` ${tong % 60} phút` : ""}` : `${tong} phút`);

/** Sản phẩm. */
export const HINH_THUC_NHAP = lc([["mua_dut", "Mua đứt"], ["ky_gui", "Ký gửi"], ["cam_do", "Cầm đồ"], ["khac", "Khác"]]);
export const DON_VI_DUNG_TICH: LuaChon[] = [{ gia_tri: "", nhan: "Chưa chọn" }, ...["ml", "L", "cm", "m", "Gr", "Kg", "Lần", "Cái", "Chiếc", "Túi", "Viên", "Tấm", "Miếng", "Tuýp", "Bộ", "Gói", "Que", "Bình", "Hũ", "Quả", "Hộp", "Trụ", "Mũi", "Xấp", "Cây", "UI", "cc"].map((x) => ({ gia_tri: x, nhan: x }))];

/** Loại thẻ. Thẻ lần không giới hạn dùng đúng quy ước sẵn có của thẻ khách: số buổi ≥ 999999. */
export const SO_BUOI_KHONG_GIOI_HAN = 999999;
export const laKhongGioiHan = (soBuoi: number | null | undefined) => (soBuoi ?? 0) >= SO_BUOI_KHONG_GIOI_HAN;
export const HAN_TINH_TU = lc([["ngay_cap", "Từ ngày cấp thẻ"], ["ngay_tao", "Từ ngày tạo thẻ"]]);
export const CHE_DO_SUA_LAN = lc([["tuy_y", "Tuỳ ý sửa số lần tại thu ngân"], ["tu_dong", "Tự cập nhật số lần = giá bán thẻ : giá trị 1 lần"], ["co_dinh", "Số lần trong thẻ cố định, không được sửa"]]);
export const CHE_DO_SUA_TIEN = lc([["tuy_y", "Tuỳ ý sửa số tiền tại thu ngân"], ["tu_dong", "Tự cập nhật số tiền trong thẻ bằng giá bán thẻ"], ["co_dinh", "Số tiền trong thẻ cố định, không được sửa"]]);
export const MAU_THE: LuaChon[] = [{ gia_tri: "", nhan: "Không đặt màu" }, ...([["#B8860B", "Vàng đồng"], ["#8A8D91", "Bạc"], ["#1F2A44", "Xanh đêm"], ["#2E6B4F", "Xanh lục"], ["#8C2F39", "Đỏ rượu"], ["#6B4E8A", "Tím"], ["#C27C8A", "Hồng"], ["#2B2B2B", "Đen"]] as [string, string][]).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))];

/** Đường dẫn công khai của ảnh danh mục (kho 'danh-muc-anh'). */
export const urlAnhDanhMuc = (duong: string | null | undefined): string | null => (duong ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/danh-muc-anh/${duong}` : null);

/** Thời hạn loại thẻ như SalonHero: THÁNG + NGÀY (time_limit + time_limit_by_day). Hiện như SalonHero: "1 năm 6 tháng", "8 năm 3 tháng 99 ngày". */
export function nhanHanThe(thang: number | null | undefined, ngay: number | null | undefined): string {
  const t = Math.max(0, Math.trunc(Number(thang) || 0)), n = Math.max(0, Math.trunc(Number(ngay) || 0));
  if (!t && !n) return "Không hạn";
  const nam = Math.floor(t / 12), th = t % 12;
  return [nam ? `${nam} năm` : "", th ? `${th} tháng` : "", n ? `${n} ngày` : ""].filter(Boolean).join(" ");
}
/** Hạn thẻ = ngày bắt đầu + N tháng (theo lịch: 31/01 + 1 tháng = 28/29/02) + M ngày. Giống hàm Postgres public.tinh_han_the. Trả null khi không hạn. */
export function tinhHanThe(thang: number | null | undefined, ngay: number | null | undefined, tu: string): string | null {
  const t = Math.max(0, Math.trunc(Number(thang) || 0)), n = Math.max(0, Math.trunc(Number(ngay) || 0));
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tu);
  if (!m || (!t && !n)) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1 + t, d = Number(m[3]);
  const nam = y + Math.floor(mo / 12), thang0 = mo % 12;
  const cuoiThang = new Date(Date.UTC(nam, thang0 + 1, 0)).getUTCDate();
  const kq = new Date(Date.UTC(nam, thang0, Math.min(d, cuoiThang)) + n * 86_400_000);
  return kq.toISOString().slice(0, 10);
}
/** "Thời gian làm 1 lần dịch vụ" của loại thẻ lần: đúng các mốc trong ô chọn của SalonHero (0–180 phút). */
export const THOI_GIAN_1_LAN: LuaChon[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 120, 150, 180].map((p) => ({ gia_tri: String(p), nhan: `${p} phút` }));
/** VAT của sản phẩm: như dịch vụ (SalonHero dùng cùng danh sách mức thuế cho sản phẩm). */
export const VAT_CHON_SAN_PHAM = VAT_CHON;

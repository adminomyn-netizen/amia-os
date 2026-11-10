// Bản in hoá đơn dịch vụ theo mẫu SalonHero (chị Lâm gửi ảnh bản in 10/11/2026): phần chữ thuần, không đọc DB, để test được.
import { tienVN } from "@/lib/dinh-dang";

/** Thông tin cơ sở in đầu tờ hoá đơn. Chưa có bảng cấu hình cơ sở trong DB nên đặt hằng số ở một chỗ (tên như trang đăng nhập, giấy phép như trang Đặt lịch). */
export const CO_SO = { ten: "AMIA Beauty Center", linhVuc: "Phòng khám da liễu", giayPhep: "1233/NA-GPHĐ" } as const;

export type NgonNgu = "vi" | "en";

/** Tình trạng in dưới tiêu đề "HOÁ ĐƠN DỊCH VỤ", như SalonHero "(Chưa thanh toán)". Hoàn thành mà còn nợ thì chưa phải "Đã thanh toán". */
export function nhanTrangThaiHd(trangThai: string | null | undefined, conNo: number, daThu: number, nn: NgonNgu = "vi"): string {
  const en = nn === "en";
  if (trangThai === "huy") return en ? "Cancelled" : "Đã huỷ";
  if (trangThai !== "hoan_thanh") return en ? "Unpaid" : "Chưa thanh toán";
  if (conNo > 0) return daThu > 0 ? (en ? "Partially paid" : "Thanh toán một phần") : (en ? "Unpaid" : "Chưa thanh toán");
  return en ? "Paid" : "Đã thanh toán";
}

/** Tổng tiền trừ vào thẻ của đơn: đơn chuyển từ SalonHero lấy hoa_don.tien_tru_the; đơn AMIA cộng các khoản "the_tien" (thu − hoàn). Cùng công thức báo cáo thu ngân (0068). */
export function tienTruThe(laLichSu: boolean, tienTruTheHd: number | null | undefined, tt: { loai: string; phuong_thuc: string; so_tien: number | string }[]): number {
  if (laLichSu) return Number(tienTruTheHd ?? 0);
  return tt.filter((t) => t.phuong_thuc === "the_tien").reduce((a, t) => a + (t.loai === "thu" ? 1 : -1) * Number(t.so_tien), 0);
}

/** Một dòng "Tình trạng thẻ": "Tên gói (#M24713): còn 3/10 buổi" hoặc "…: số dư 2.000.000 đ". */
export function moTaThe(t: { ten: string; ma: string; loai: string; buoiCon: number; buoiTong: number | null; soDu: number }, nn: NgonNgu = "vi"): string {
  const en = nn === "en";
  const ma = t.ma ? ` (#${t.ma})` : "";
  if (t.loai === "tien") return `${t.ten}${ma}: ${en ? "balance" : "số dư"} ${tienVN(t.soDu)}`;
  const tong = t.buoiTong != null ? `/${t.buoiTong}` : "";
  return `${t.ten}${ma}: ${en ? "" : "còn "}${t.buoiCon}${tong} ${en ? "sessions left" : "buổi"}`;
}

/** Dòng dùng buổi thẻ (đơn SalonHero: dòng dịch vụ có the_khach_sh_id) in "Sử dụng <dịch vụ>" như SalonHero. */
export const tenDongIn = (ten: string, dungThe: boolean, nn: NgonNgu = "vi") => (dungThe ? `${nn === "en" ? "Use" : "Sử dụng"} ${ten}` : ten);

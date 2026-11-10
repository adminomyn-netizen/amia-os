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

/** Các khoản thu thu ngân đang nhập trong giỏ (chưa chốt), để in "HOÁ ĐƠN TẠM TÍNH" cùng bố cục hoá đơn thật (chị Lâm 10/11/2026: "các hình thức thanh toán hoá đơn đâu rồi").
 *  - Khoản > 0 (trừ thẻ tiền) in "Thanh toán - <hình thức>" như hoá đơn đã chốt; thẻ tiền cộng vào "Tổng tiền trừ vào thẻ" + số dư thẻ sau khi trừ.
 *  - Chưa nhập khoản nào: in sẵn 3 hình thức nhanh (Tiền mặt / Quẹt thẻ / Chuyển khoản) để trống tiền cho khách chọn (chị chỉnh sau). */
export type KhoanTamTinh = { phuong_thuc: string; so_tien: number; the_id?: string; loai_vi?: string; ngan_hang?: string };
export function thanhToanTamTinh(
  thu: KhoanTamTinh[],
  nhan: { thanhToan: string; hinhThuc: (pt: string, loaiVi?: string) => string },
  the: { id: string; ten: string; ma: string; soDu: number }[] = [],
  nn: NgonNgu = "vi",
): { thanhToan: { nhan: string; soTien: number | null }[]; tienTruThe: number; theSauTt: string[] } {
  const co = thu.filter((t) => t.so_tien > 0);
  const tien = co.filter((t) => t.phuong_thuc !== "the_tien");
  const truThe = co.filter((t) => t.phuong_thuc === "the_tien");
  const thanhToan = tien.length || truThe.length
    ? tien.map((t) => ({ nhan: `${nhan.thanhToan} - ${nhan.hinhThuc(t.phuong_thuc, t.loai_vi)}${t.ngan_hang ? ` (${t.ngan_hang})` : ""}`, soTien: t.so_tien }))
    : ["tien_mat", "quet_the", "chuyen_khoan"].map((pt) => ({ nhan: `${nhan.thanhToan} - ${nhan.hinhThuc(pt)}`, soTien: null }));
  const theSauTt = truThe.map((t) => {
    const x = the.find((y) => y.id === t.the_id);
    return x ? moTaThe({ ten: x.ten, ma: x.ma, loai: "tien", buoiCon: 0, buoiTong: null, soDu: Math.max(x.soDu - t.so_tien, 0) }, nn) : "";
  }).filter(Boolean);
  return { thanhToan, tienTruThe: truThe.reduce((a, t) => a + t.so_tien, 0), theSauTt };
}

/** Tên người hưởng của một dòng giỏ theo thứ tự in: phục vụ → bán → tư vấn (như dungToInHoaDon). */
export function nhanVienDongTamTinh(nv: Partial<Record<"phuc_vu" | "ban" | "tu_van", { id: string }[]>>, ten: (id: string) => string | undefined): string[] {
  const ra: string[] = [];
  for (const v of ["phuc_vu", "ban", "tu_van"] as const) for (const x of nv[v] ?? []) { const t = ten(x.id); if (t && !ra.includes(t)) ra.push(t); }
  return ra;
}

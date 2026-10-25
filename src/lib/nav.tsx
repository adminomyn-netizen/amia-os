import { LayoutDashboard, CalendarDays, ShoppingBag, Receipt, Users, CreditCard, PackageCheck, Warehouse, BarChart3, ListTree, UserCog, FlaskConical, HandCoins } from "lucide-react";
import type { ComponentType } from "react";
import { coQuyen, type Quyen, type VaiTro } from "@/lib/quyen";

export type MucMenu = { ten: string; duong_dan: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; nhom: string; quyen: Quyen; moTa: string };

export const MENU: MucMenu[] = [
  { ten: "Tổng quan", duong_dan: "/tong-quan", icon: LayoutDashboard, nhom: "Hằng ngày", quyen: "baocao.xem", moTa: "Doanh thu, nợ, buổi đã làm hôm nay" },
  { ten: "Lịch hẹn", duong_dan: "/lich-hen", icon: CalendarDays, nhom: "Hằng ngày", quyen: "lich.xem", moTa: "Đặt, đổi, huỷ lịch; mở ca" },
  { ten: "Bán hàng", duong_dan: "/ban-hang", icon: ShoppingBag, nhom: "Hằng ngày", quyen: "ban.tao", moTa: "Thu ngân: dịch vụ, thẻ, sản phẩm" },
  { ten: "Hoá đơn", duong_dan: "/hoa-don", icon: Receipt, nhom: "Hằng ngày", quyen: "ban.xem", moTa: "Danh sách hoá đơn, thu nợ, huỷ" },
  { ten: "Khách hàng", duong_dan: "/khach-hang", icon: Users, nhom: "Hằng ngày", quyen: "khach.xem", moTa: "Hồ sơ, ghi chú điều trị, ảnh" },
  { ten: "Thẻ liệu trình", duong_dan: "/the", icon: CreditCard, nhom: "Hằng ngày", quyen: "the.xem", moTa: "Thẻ lần, thẻ tiền, thực hiện buổi" },
  { ten: "Phiếu cấp vật tư", duong_dan: "/phieu-cap", icon: PackageCheck, nhom: "Vật tư", quyen: "phieu.xem", moTa: "Cấp vật tư trước ca, trả, đối chiếu" },
  { ten: "Định mức", duong_dan: "/dinh-muc", icon: FlaskConical, nhom: "Vật tư", quyen: "danhmuc.xem", moTa: "Vật tư dùng cho từng dịch vụ" },
  { ten: "Kho", duong_dan: "/kho", icon: Warehouse, nhom: "Vật tư", quyen: "kho.xem", moTa: "Tồn kho, nhập kho" },
  { ten: "Báo cáo", duong_dan: "/bao-cao", icon: BarChart3, nhom: "Báo cáo", quyen: "baocao.xem", moTa: "Doanh thu, nhân viên, nợ, vật tư" },
  { ten: "Hoa hồng", duong_dan: "/hoa-hong", icon: HandCoins, nhom: "Báo cáo", quyen: "baocao.tien", moTa: "Hoa hồng bán hàng theo nhân viên" },
  { ten: "Danh mục", duong_dan: "/danh-muc", icon: ListTree, nhom: "Cài đặt", quyen: "danhmuc.xem", moTa: "Dịch vụ, gói thẻ, sản phẩm" },
  { ten: "Nhân viên", duong_dan: "/nhan-vien", icon: UserCog, nhom: "Cài đặt", quyen: "nhanvien.quanly", moTa: "Tài khoản, vai trò, chi nhánh" },
];

export const locMenu = (vt: VaiTro) => MENU.filter((m) => coQuyen(vt, m.quyen));
export function gomTheoNhom(ds: MucMenu[]) {
  const ra: { nhom: string; muc: MucMenu[] }[] = [];
  for (const m of ds) {
    const g = ra.find((x) => x.nhom === m.nhom);
    if (g) g.muc.push(m);
    else ra.push({ nhom: m.nhom, muc: [m] });
  }
  return ra;
}

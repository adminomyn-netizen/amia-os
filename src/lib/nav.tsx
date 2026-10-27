import { Home, LayoutDashboard, CalendarDays, ShoppingBag, Receipt, Users, CreditCard, Warehouse, BarChart3, Settings, Briefcase, Landmark, UsersRound, FileText, Megaphone } from "lucide-react";
import type { ComponentType } from "react";
import { coQuyen, type CoQuyen, type Quyen } from "@/lib/quyen";
import { MODULE } from "@/lib/module";

export type MucMenu = { ten: string; duong_dan: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; nhom: string; quyen: Quyen | Quyen[] | null; moTa: string };

export const MENU: MucMenu[] = [
  { ten: "Trang chủ", duong_dan: "/trang-chu", icon: Home, nhom: "Hằng ngày", quyen: null, moTa: "Việc của tôi hôm nay, hiệu suất, lối tắt" },
  { ten: "Tổng quan", duong_dan: "/tong-quan", icon: LayoutDashboard, nhom: "Hằng ngày", quyen: "tongquan.xem", moTa: "Bảng điều hành: doanh thu, khách, thẻ, kho" },
  { ten: "Lịch hẹn", duong_dan: "/lich-hen", icon: CalendarDays, nhom: "Hằng ngày", quyen: "lich.xem", moTa: "Đặt, đổi, huỷ lịch; mở ca" },
  { ten: "Bán hàng", duong_dan: "/ban-hang", icon: ShoppingBag, nhom: "Hằng ngày", quyen: "ban.tao", moTa: "Thu ngân: dịch vụ, thẻ, sản phẩm" },
  { ten: "Hoá đơn", duong_dan: "/hoa-don", icon: Receipt, nhom: "Hằng ngày", quyen: "ban.xem", moTa: "Danh sách hoá đơn, thu nợ, huỷ" },
  { ten: "Khách hàng", duong_dan: "/khach-hang", icon: Users, nhom: "Hằng ngày", quyen: "khach.xem", moTa: "Hồ sơ, ghi chú điều trị, ảnh" },
  { ten: "Thẻ liệu trình", duong_dan: "/the", icon: CreditCard, nhom: "Hằng ngày", quyen: "the.xem", moTa: "Thẻ lần, thẻ tiền, thực hiện buổi" },
  { ten: "Nơi làm việc", duong_dan: "/noi-lam-viec", icon: Briefcase, nhom: "Vận hành", quyen: ["lich.xem", "khach.xem", "the.xem", "phieu.xem", "ban.xem"], moTa: "Việc cần làm, chấm công, đề xuất, wiki" },
  { ten: "Kho & Mua sắm", duong_dan: "/kho-mua-sam", icon: Warehouse, nhom: "Vận hành", quyen: ["kho.xem", "phieu.xem"], moTa: "Tồn kho, vật tư cấp theo ca, mua hàng, kiểm kê" },
  { ten: "Tài chính - Kế toán", duong_dan: "/tai-chinh", icon: Landmark, nhom: "Vận hành", quyen: ["baocao.tien", "no.thu"], moTa: "Sổ quỹ, công nợ, hoá đơn, quyết toán" },
  { ten: "Nhân sự", duong_dan: "/nhan-su", icon: UsersRound, nhom: "Vận hành", quyen: ["nhanvien.quanly", "baocao.tien"], moTa: "Hồ sơ, chấm công, ca, nghỉ phép, lương" },
  { ten: "Văn bản & Hợp đồng", duong_dan: "/van-ban", icon: FileText, nhom: "Vận hành", quyen: ["nhanvien.quanly"], moTa: "Hợp đồng, quyết định, quy định" },
  { ten: "Marketing", duong_dan: "/marketing", icon: Megaphone, nhom: "Phát triển", quyen: ["khach.sua"], moTa: "Khách tiềm năng, nguồn giới thiệu, chiến dịch" },
  { ten: "Báo cáo", duong_dan: "/bao-cao", icon: BarChart3, nhom: "Phát triển", quyen: "baocao.xem", moTa: "Doanh thu, nhân viên, nợ, vật tư" },
  { ten: "Cài đặt", duong_dan: "/cai-dat", icon: Settings, nhom: "Hệ thống", quyen: ["danhmuc.xem", "nhanvien.quanly", "hethong.phanquyen", "baocao.tien"], moTa: "Danh mục, hoa hồng, phân quyền, chi nhánh" },
];

const duQuyen = (nd: CoQuyen, q: Quyen | Quyen[] | null) => q === null || (Array.isArray(q) ? q.some((x) => coQuyen(nd, x)) : coQuyen(nd, q));
export const locMenu = (nd: CoQuyen) => MENU.filter((m) => duQuyen(nd, m.quyen));
/** Trang đầu tiên người này vào được (không vòng lặp chuyển trang); không có mục nào thì về Tài khoản. */
export const trangDau = (nd: CoQuyen, khongDuQuyen = false) => {
  const d = locMenu(nd)[0]?.duong_dan ?? "/tai-khoan";
  return khongDuQuyen ? `${d}?khong-du-quyen=1` : d;
};
export function gomTheoNhom(ds: MucMenu[]) {
  const ra: { nhom: string; muc: MucMenu[] }[] = [];
  for (const m of ds) {
    const g = ra.find((x) => x.nhom === m.nhom);
    if (g) g.muc.push(m);
    else ra.push({ nhom: m.nhom, muc: [m] });
  }
  return ra;
}

/** Mục menu sáng khi đang ở chính trang đó, hoặc ở một trang con thuộc mục lớn (vd /kho thuộc "Kho & Mua sắm"); trang nằm trong nhiều mục lớn thì tính cho mục đầu tiên. */
export function mucDangChon(pathname: string, duongDan: string) {
  const khop = (p: string) => pathname === p || pathname.startsWith(p + "/");
  if (khop(duongDan)) return true;
  const mod = MODULE.find((m) => m.duongDan === duongDan);
  if (!mod) return false;
  return mod.nhom.some((g) => g.the.some((t) => {
    const p = t.duongDan?.split("?")[0];
    if (!p || !khop(p) || MENU.some((x) => x.duong_dan === p)) return false;
    return MODULE.find((m) => m.nhom.some((h) => h.the.some((u) => u.duongDan?.split("?")[0] === p)))?.duongDan === duongDan;
  }));
}

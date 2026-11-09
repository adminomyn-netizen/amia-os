import { LayoutDashboard, CalendarDays, ShoppingBag, Users, Warehouse, BarChart3, Settings, Briefcase, Landmark, FileText, Megaphone, IdCard } from "lucide-react";
import type { ComponentType } from "react";
import { coQuyen, type CoQuyen, type Quyen } from "@/lib/quyen";
import { MODULE } from "@/lib/module";

export type MucMenu = { ten: string; duong_dan: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; nhom: string; quyen: Quyen | Quyen[] | null; moTa: string; ngan?: string };

// 12 mục lớn như BeDental (chị Lâm 10/11/2026). Mục trùng tên = cùng một mục, mỗi người chỉ thấy BẢN ĐẦU TIÊN mình có quyền
// (vd Dashboard: Quản lý → Tổng quan, nhân viên → Trang chủ; Bán hàng: Thu ngân → màn bán, Lễ tân → Hoá đơn).
export const MENU: MucMenu[] = [
  { ten: "Dashboard", duong_dan: "/tong-quan", icon: LayoutDashboard, nhom: "Hằng ngày", quyen: "tongquan.xem", moTa: "Bảng điều hành: doanh thu, khách, thẻ, kho" },
  { ten: "Dashboard", duong_dan: "/trang-chu", icon: LayoutDashboard, nhom: "Hằng ngày", quyen: null, moTa: "Việc của tôi hôm nay, hiệu suất, lối tắt" },
  { ten: "Lịch hẹn", duong_dan: "/lich-hen", icon: CalendarDays, nhom: "Hằng ngày", quyen: "lich.xem", moTa: "Đặt, đổi, huỷ lịch; mở ca" },
  { ten: "Nơi làm việc", duong_dan: "/noi-lam-viec", icon: Briefcase, nhom: "Hằng ngày", quyen: ["noibo.dung", "lich.xem", "khach.xem", "the.xem", "phieu.xem", "ban.xem"], moTa: "Việc hôm nay, khiếu nại, quy trình, đề xuất, thu nhập" },
  { ten: "Khách hàng", duong_dan: "/khach-hang", icon: Users, nhom: "Hằng ngày", quyen: "khach.xem", moTa: "Hồ sơ, thẻ liệu trình, nhóm, chăm sóc" },
  { ten: "POS / Bán hàng", ngan: "Bán hàng", duong_dan: "/ban-hang", icon: ShoppingBag, nhom: "Hằng ngày", quyen: "ban.tao", moTa: "Thu ngân: dịch vụ, thẻ, sản phẩm; hoá đơn" },
  { ten: "POS / Bán hàng", ngan: "Bán hàng", duong_dan: "/hoa-don", icon: ShoppingBag, nhom: "Hằng ngày", quyen: "ban.xem", moTa: "Danh sách hoá đơn" },
  { ten: "Tài chính - Kế toán", ngan: "Tài chính", duong_dan: "/tai-chinh", icon: Landmark, nhom: "Vận hành", quyen: ["quy.xem", "baocao.tien", "no.thu"], moTa: "Sổ quỹ, công nợ, hoá đơn, hoa hồng, khoá kỳ" },
  { ten: "Kho & Mua sắm", ngan: "Kho", duong_dan: "/kho-mua-sam", icon: Warehouse, nhom: "Vận hành", quyen: ["kho.xem", "phieu.xem"], moTa: "Tồn kho, vật tư cấp theo ca, mua hàng, nhà cung cấp" },
  { ten: "Nhân sự", duong_dan: "/nhan-su", icon: IdCard, nhom: "Vận hành", quyen: ["noibo.dung", "nhanvien.quanly", "hethong.phanquyen"], moTa: "Thu nhập, tài khoản; hồ sơ, chấm công, lương ở MSC OS" },
  { ten: "Văn bản & Hợp đồng", ngan: "Văn bản", duong_dan: "/van-ban", icon: FileText, nhom: "Vận hành", quyen: ["vb.xem"], moTa: "Hợp đồng, quyết định, quy định" },
  { ten: "Báo cáo", duong_dan: "/bao-cao", icon: BarChart3, nhom: "Phát triển", quyen: "baocao.xem", moTa: "Doanh thu, nhân viên, nợ, vật tư" },
  { ten: "Marketing", duong_dan: "/marketing", icon: Megaphone, nhom: "Phát triển", quyen: ["mkt.xem", "lead.xu_ly"], moTa: "Lead, hộp thư, chiến dịch, cộng tác viên, link/QR, báo cáo" },
  { ten: "Cài đặt", duong_dan: "/cai-dat", icon: Settings, nhom: "Hệ thống", quyen: ["danhmuc.xem", "nhanvien.quanly", "hethong.phanquyen", "baocao.tien"], moTa: "Danh mục, hoa hồng, phân quyền, thiết lập" },
];

const duQuyen = (nd: CoQuyen, q: Quyen | Quyen[] | null) => q === null || (Array.isArray(q) ? q.some((x) => coQuyen(nd, x)) : coQuyen(nd, q));
/** Mục người này thấy: đủ quyền, mỗi tên chỉ một bản (bản đầu tiên). Nơi làm việc và Marketing hiện lại từ 10/11/2026 (ẩn 7/11). */
export const locMenu = (nd: CoQuyen) => {
  const daCo = new Set<string>();
  return MENU.filter((m) => {
    if (daCo.has(m.ten) || !duQuyen(nd, m.quyen)) return false;
    daCo.add(m.ten);
    return true;
  });
};
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
  // Mục trùng tên (Dashboard, POS / Bán hàng) là một mục: trang của bản kia cũng làm mục này sáng.
  const ten = MENU.find((x) => x.duong_dan === duongDan)?.ten;
  if (ten && MENU.some((x) => x.ten === ten && khop(x.duong_dan))) return true;
  const mod = MODULE.find((m) => m.duongDan === duongDan);
  if (!mod) return false;
  return mod.nhom.some((g) => g.the.some((t) => {
    const p = t.duongDan?.split("?")[0];
    if (!p || !khop(p) || MENU.some((x) => x.duong_dan === p && x.ten !== ten)) return false;
    return MODULE.find((m) => m.nhom.some((h) => h.the.some((u) => u.duongDan?.split("?")[0] === p)))?.duongDan === duongDan;
  }));
}

/** Thứ tự các mục lớn trên thanh menu ngang (máy tính): mục dùng nhiều nhất đứng trước, màn hình hẹp thì mục cuối gom vào nút "Thêm". */
const THU_TU_NGANG = ["/tong-quan", "/trang-chu", "/lich-hen", "/noi-lam-viec", "/khach-hang", "/ban-hang", "/hoa-don", "/tai-chinh", "/kho-mua-sam", "/nhan-su", "/van-ban", "/bao-cao", "/marketing", "/cai-dat"];
export const sapXepNgang = <T extends { duong_dan: string }>(ds: T[]) => [...ds].sort((a, b) => THU_TU_NGANG.indexOf(a.duong_dan) - THU_TU_NGANG.indexOf(b.duong_dan));

export const coMotQuyen = (nd: CoQuyen, qs?: Quyen[] | null) => !qs || qs.length === 0 || qs.some((q) => coQuyen(nd, q));

/** Chức năng con của một mục lớn (thả xuống từ thanh menu): chỉ thẻ đã dùng được và người này có quyền, gom theo nhóm của trang tổng quan. */
export function chucNangCon(nd: CoQuyen, duongDan: string) {
  const m = MODULE.find((x) => x.duongDan === duongDan);
  if (!m) return [];
  return m.nhom
    .map((g) => ({ nhan: g.nhan, the: g.the.filter((t) => t.duongDan && coMotQuyen(nd, t.quyen)).map((t) => ({ ten: t.ten, duongDan: t.duongDan!, moTa: t.moTa })) }))
    .filter((g) => g.the.length > 0);
}

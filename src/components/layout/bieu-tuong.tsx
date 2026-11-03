import { ArrowLeftRight, BookOpen, Boxes, CalendarClock, CalendarOff, ChartColumn, ClipboardCheck, ClipboardList, Clock, CreditCard, FilePenLine, FileText, HandCoins, LayoutGrid, Lock, Megaphone, Percent, PiggyBank, Receipt, ShoppingCart, Truck, UserPlus, Users, Wallet } from "lucide-react";
import { Award, Building2, Calculator, CalendarCheck, KeyRound, Landmark as NganHang, MessageSquareText, Newspaper, Package, Printer, ScanSearch, ShieldCheck, SlidersHorizontal, Sparkles, Store, TicketPercent, UserCheck } from "lucide-react";
import { createElement, type ComponentType } from "react";

type BieuTuong = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Chọn biểu tượng cho thẻ chức năng theo tên (khớp từ đầu tiên trong danh sách); không khớp thì dùng biểu tượng chung. */
const BANG: [RegExp, BieuTuong][] = [
  [/^thông tin chung/i, Store],
  [/^chi nhánh/i, Building2],
  [/^ngày tháng|thiết lập khác/i, SlidersHorizontal],
  [/^thiết lập in/i, Printer],
  [/tài khoản ngân hàng/i, NganHang],
  [/^blog/i, Newspaper],
  [/^bảng tin/i, Megaphone],
  [/^web đặt lịch/i, CalendarCheck],
  [/voucher/i, TicketPercent],
  [/chi phí dịch vụ/i, Calculator],
  [/^danh mục dịch vụ/i, Sparkles],
  [/^danh mục sản phẩm/i, Package],
  [/^rà soát/i, ScanSearch],
  [/^vai trò|phân quyền/i, ShieldCheck],
  [/tài khoản đăng nhập/i, KeyRound],
  [/zalo|sms/i, MessageSquareText],
  [/^điểm khách|tích điểm/i, Award],
  [/^nhân viên phục vụ/i, UserCheck],
  [/chấm công|giờ làm/i, Clock],
  [/ca kíp|ca làm|lịch|ca /i, CalendarClock],
  [/nghỉ|phép/i, CalendarOff],
  [/hoa hồng/i, Percent],
  [/ngân sách/i, PiggyBank],
  [/công nợ|nợ/i, HandCoins],
  [/hoá đơn/i, Receipt],
  [/khoá kỳ/i, Lock],
  [/phê duyệt|duyệt/i, ClipboardCheck],
  [/kiểm kê/i, ClipboardList],
  [/chuyển kho|chuyển quỹ/i, ArrowLeftRight],
  [/nhà cung cấp/i, Truck],
  [/mua|đơn hàng/i, ShoppingCart],
  [/kho|tồn|vật tư|lô |định mức|xuất/i, Boxes],
  [/lương|thanh toán|tạm ứng|quỹ|thu|chi/i, Wallet],
  [/hợp đồng|văn bản|quyết định/i, FilePenLine],
  [/wiki|quy định|kiến thức|quy trình/i, BookOpen],
  [/báo cáo|thống kê/i, ChartColumn],
  [/tuyển|ứng viên|onboarding|nhân viên mới/i, UserPlus],
  [/khách|lead|đối tác|giới thiệu|hồ sơ/i, Users],
  [/chiến dịch|quảng cáo|nội dung|link|marketing/i, Megaphone],
  [/thẻ|liệu trình/i, CreditCard],
  [/tài liệu|phiếu|đề xuất/i, FileText],
];
const chon = (ten: string): BieuTuong => BANG.find(([re]) => re.test(ten))?.[1] ?? LayoutGrid;

export function BieuTuongChucNang({ ten, className }: { ten: string; className?: string }) {
  return createElement(chon(ten), { strokeWidth: 1.6, className });
}

import { ArrowLeftRight, BookOpen, Boxes, CalendarClock, CalendarOff, ChartColumn, ClipboardCheck, ClipboardList, Clock, CreditCard, FilePenLine, FileText, HandCoins, LayoutGrid, Lock, Megaphone, Percent, PiggyBank, Receipt, ShoppingCart, Truck, UserPlus, Users, Wallet } from "lucide-react";
import { createElement, type ComponentType } from "react";

type BieuTuong = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Chọn biểu tượng cho thẻ chức năng theo tên (khớp từ đầu tiên trong danh sách); không khớp thì dùng biểu tượng chung. */
const BANG: [RegExp, BieuTuong][] = [
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

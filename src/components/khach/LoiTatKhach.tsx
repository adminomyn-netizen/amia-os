"use client";

import { AlarmClock, BarChart3, CalendarClock, CreditCard, History, MessagesSquare, PhoneCall, Tags, TicketX, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { LinkNhe } from "@/components/ui/LinkNhe";
import { useMoManKhach } from "./KhungHaiCot";

const ICON: Record<string, LucideIcon> = { "thong-ke": BarChart3, "gan-day": History, "tu-van": MessagesSquare, nhom: Tags, "cham-soc": PhoneCall, "nhac-nho": AlarmClock, "tai-kham": CalendarClock, "dung-the": CreditCard, "the-sap-het": TicketX };

/** Lối tắt các màn con Khách hàng: ô biểu tượng nhiều màu, cuộn ngang trong khung trên điện thoại.
 *  Không tự tải trước hàng loạt (LinkNhe: chỉ khi rê chuột / chạm); bấm là ô sáng + cột nội dung hiện khung chờ ngay. */
export function LoiTatKhach({ muc }: { muc: { href: string; nhan: string; mau: string }[] }) {
  const { dangMo, mo } = useMoManKhach();
  const pathname = usePathname();
  return (
    <nav aria-label="Các màn khách hàng" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
      {muc.map(({ href, nhan, mau }) => {
        const Icon = ICON[href.split("/").pop() ?? ""] ?? BarChart3;
        const sang = dangMo ? dangMo === href : pathname === href;
        return (
          <LinkNhe key={href} href={href} aria-current={pathname === href ? "page" : undefined} aria-busy={dangMo === href || undefined}
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) mo(href); }}
            className={`group flex h-10 shrink-0 items-center gap-2 rounded-the border bg-giay-sang py-1 pl-1 pr-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgb(10_43_38/0.06)] transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-nhan hover:text-muc hover:shadow-[0_6px_14px_-4px_rgb(10_43_38/0.16)] active:translate-y-0 ${sang ? "border-nhan text-nhan-dam" : "border-vien text-muc-2"}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-nho ${mau}`}>
              <Icon aria-hidden strokeWidth={1.8} className={`h-4 w-4 ${dangMo === href ? "animate-pulse" : ""}`} />
            </span>{nhan}
          </LinkNhe>
        );
      })}
    </nav>
  );
}

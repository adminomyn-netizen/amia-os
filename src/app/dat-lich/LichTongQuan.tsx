"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type ToolbarProps } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const doiNgay = (d: string) => new Date(`${d}T00:00:00`);
const khoaNgay = (d: Date) => format(d, "yyyy-MM-dd");
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }), getDay, locales: { vi, en: enUS } });

/** Lịch tổng quan dạng tháng (React Big Calendar) cho trang đặt lịch: ngày đặt được nổi màu, ngày đang chọn tô đậm kèm giờ hẹn, hôm nay viền vàng; bấm một ngày đặt được là chọn ngày đó. Có chú thích màu bên dưới. */
export function LichTongQuan({ nn, homNay, ngayDatDuoc, ngay, gio, onChon }: {
  nn: "vi" | "en"; homNay: string; ngayDatDuoc: string[]; ngay: string; gio: string; onChon: (d: string) => void;
}) {
  const [thang, setThang] = useState(() => doiNgay(ngay));
  const datDuoc = useMemo(() => new Set(ngayDatDuoc), [ngayDatDuoc]);
  const loc = nn === "en" ? enUS : vi;
  const chon = (d: Date) => { const k = khoaNgay(d); if (datDuoc.has(k)) onChon(k); };
  const thangNay = format(doiNgay(homNay), "yyyy-MM"), thangCuoi = format(doiNgay(ngayDatDuoc[ngayDatDuoc.length - 1] ?? homNay), "yyyy-MM");
  const dangXem = format(thang, "yyyy-MM");

  const ThanhCongCu = ({ label, onNavigate }: ToolbarProps<object>) => (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button type="button" aria-label={nn === "en" ? "Previous month" : "Tháng trước"} disabled={dangXem <= thangNay} onClick={() => onNavigate("PREV")} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram disabled:opacity-30"><ChevronLeft size={18} /></button>
      <div className="text-center">
        <p className="text-[16px] font-bold capitalize text-muc">{label}</p>
        <p className="text-[11.5px] text-muc-3">{nn === "en" ? `${ngayDatDuoc.length} days open for booking` : `${ngayDatDuoc.length} ngày đang nhận đặt`}</p>
      </div>
      <button type="button" aria-label={nn === "en" ? "Next month" : "Tháng sau"} disabled={dangXem >= thangCuoi} onClick={() => onNavigate("NEXT")} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram disabled:opacity-30"><ChevronRight size={18} /></button>
    </div>
  );

  return (
    <div className="lich-dat">
      <Calendar
        localizer={localizer} culture={nn} date={thang} onNavigate={setThang} views={["month"]} view="month" onView={() => {}}
        events={[]} selectable style={{ height: 372 }}
        components={{
          toolbar: ThanhCongCu,
          month: {
            dateHeader: ({ date, label }: { date: Date; label: string }) => {
              const k = khoaNgay(date), laChon = k === ngay, duoc = datDuoc.has(k);
              return (
                <button type="button" disabled={!duoc} onClick={() => chon(date)} aria-label={format(date, "dd/MM/yyyy")} aria-pressed={laChon}
                  className={`flex w-full flex-col items-center gap-0.5 pt-1 ${laChon ? "text-white" : duoc ? "text-nhan-dam" : "text-muc-3"}`}>
                  <span className={`text-[14px] tabular-nums ${duoc ? "font-bold" : ""}`}>{label}</span>
                  {laChon && gio
                    ? <span className="rounded-[4px] bg-white/95 px-1.5 text-[10.5px] font-bold tabular-nums text-nhan-dam">{gio}</span>
                    : duoc && !laChon ? <span className="h-1 w-1 rounded-[1px] bg-nhan" aria-hidden /> : null}
                </button>
              );
            },
          },
        }}
        formats={{ monthHeaderFormat: (d: Date) => format(d, nn === "en" ? "MMMM yyyy" : "'Tháng' M, yyyy", { locale: loc }), weekdayFormat: (d: Date) => format(d, "EEEEEE", { locale: loc }) }}
        onSelectSlot={({ start }) => chon(start)} onDrillDown={chon}
        dayPropGetter={(d) => {
          const k = khoaNgay(d);
          return { className: [k === ngay ? "lich-chon" : datDuoc.has(k) ? "lich-duoc" : "lich-khoa", k === homNay ? "lich-hom-nay" : ""].join(" ") };
        }}
      />
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muc-3">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-nhan-nhat ring-1 ring-nhan/30" aria-hidden />{nn === "en" ? "Open" : "Còn nhận đặt"}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px]" style={{ background: "var(--gradient-vang)" }} aria-hidden />{nn === "en" ? "Selected" : "Ngày đã chọn"}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] ring-2 ring-dat" aria-hidden />{nn === "en" ? "Today" : "Hôm nay"}</li>
      </ul>
    </div>
  );
}

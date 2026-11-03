"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type ToolbarProps } from "react-big-calendar";
import { addMinutes, format, getDay, parse, startOfWeek } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const doiNgay = (d: string) => new Date(`${d}T00:00:00`);
const khoaNgay = (d: Date) => format(d, "yyyy-MM-dd");
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }), getDay, locales: { vi, en: enUS } });

type SuKien = { title: string; start: Date; end: Date };

/** Lịch tổng quan dạng tháng (React Big Calendar) cho trang đặt lịch: ngày đặt được nổi màu, ngày đang chọn tô đậm, giờ hẹn đã chọn hiện thành sự kiện; bấm một ngày đặt được là chọn ngày đó. */
export function LichTongQuan({ nn, homNay, ngayDatDuoc, ngay, gio, tongPhut, nhanHen, onChon }: {
  nn: "vi" | "en"; homNay: string; ngayDatDuoc: string[]; ngay: string; gio: string; tongPhut: number; nhanHen: string; onChon: (d: string) => void;
}) {
  const [thang, setThang] = useState(() => doiNgay(ngay));
  const datDuoc = useMemo(() => new Set(ngayDatDuoc), [ngayDatDuoc]);
  const suKien: SuKien[] = useMemo(() => {
    if (!gio) return [];
    const bd = new Date(`${ngay}T${gio}:00`);
    return [{ title: `${gio} · ${nhanHen}`, start: bd, end: addMinutes(bd, Math.max(15, tongPhut)) }];
  }, [ngay, gio, tongPhut, nhanHen]);
  const chon = (d: Date) => { const k = khoaNgay(d); if (datDuoc.has(k)) onChon(k); };

  const ThanhCongCu = ({ label, onNavigate }: ToolbarProps<SuKien>) => (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button type="button" aria-label={nn === "en" ? "Previous month" : "Tháng trước"} onClick={() => onNavigate("PREV")} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram"><ChevronLeft size={18} /></button>
      <p className="text-[15px] font-bold capitalize text-muc">{label}</p>
      <button type="button" aria-label={nn === "en" ? "Next month" : "Tháng sau"} onClick={() => onNavigate("NEXT")} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram"><ChevronRight size={18} /></button>
    </div>
  );

  return (
    <div className="lich-dat">
      <Calendar<SuKien>
        localizer={localizer} culture={nn} date={thang} onNavigate={setThang} views={["month"]} view="month" onView={() => {}}
        events={suKien} startAccessor="start" endAccessor="end" selectable popup={false} style={{ height: 360 }}
        components={{
          toolbar: ThanhCongCu,
          month: {
            dateHeader: ({ date, label }: { date: Date; label: string }) => {
              const k = khoaNgay(date), laChon = k === ngay, duoc = datDuoc.has(k);
              return (
                <button type="button" disabled={!duoc} onClick={() => chon(date)} aria-label={format(date, "dd/MM/yyyy")} aria-pressed={laChon}
                  className={`text-[13px] tabular-nums ${laChon ? "font-bold text-white" : duoc ? "font-bold text-nhan-dam" : "text-muc-3"}`}>{label}</button>
              );
            },
          },
        }}
        formats={{ monthHeaderFormat: (d: Date) => format(d, nn === "en" ? "MMMM yyyy" : "'Tháng' M, yyyy", { locale: nn === "en" ? enUS : vi }), weekdayFormat: (d: Date) => format(d, "EEEEEE", { locale: nn === "en" ? enUS : vi }) }}
        onSelectSlot={({ start }) => chon(start)} onDrillDown={chon} onSelectEvent={(e) => chon(e.start)}
        dayPropGetter={(d) => {
          const k = khoaNgay(d);
          return { className: [k === ngay ? "lich-chon" : datDuoc.has(k) ? "lich-duoc" : "lich-khoa", k === homNay ? "lich-hom-nay" : ""].join(" ") };
        }}
        messages={{ showMore: (n: number) => `+${n}` }}
      />
    </div>
  );
}

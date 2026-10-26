"use client";

import { useEffect, useState } from "react";

const GIO = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const NGAY = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

/** Đồng hồ thời gian thực theo giờ Hồ Chí Minh (UTC+7), chạy theo giây. Chỉ vẽ sau khi tải xong để không lệch giữa máy chủ và trình duyệt. */
export function DongHo() {
  const [bay, setBay] = useState<Date | null>(null);
  useEffect(() => {
    const dat = () => setBay(new Date());
    dat();
    const t = setInterval(dat, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden text-right leading-tight sm:block" title="Giờ Hồ Chí Minh (UTC+7)" aria-label="Giờ hiện tại, múi giờ Hồ Chí Minh">
      <div className="text-[15px] font-medium tabular-nums text-muc" suppressHydrationWarning>{bay ? GIO.format(bay) : "--:--:--"}</div>
      <div className="text-[11px] uppercase tracking-[0.06em] text-muc-3" suppressHydrationWarning>{bay ? NGAY.format(bay) : "Giờ HCM"}</div>
    </div>
  );
}

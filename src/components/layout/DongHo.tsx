"use client";

import { useEffect, useState } from "react";

const HCM = { timeZone: "Asia/Ho_Chi_Minh" } as const;
const GIO = new Intl.DateTimeFormat("en-GB", { ...HCM, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const NGAY = new Intl.DateTimeFormat("vi-VN", { ...HCM, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

/** Đồng hồ thời gian thực giờ Hồ Chí Minh (UTC+7) trong khung tối có viền vàng: số lớn dễ đọc, giây màu vàng, kèm thứ ngày tháng.
 *  Đặt ở Trang chủ: chỉ chạy khi đang xem trang đó và tab đang hiện, quay lại là lấy giờ thật ngay. Chỉ vẽ sau khi tải xong để giờ máy chủ và trình duyệt không lệch nhau. */
export function DongHo() {
  const [bay, setBay] = useState<Date | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const dat = () => setBay(new Date());
    // Chỉ chạy khi tab đang hiện; quay lại tab thì lấy giờ thật ngay rồi chạy tiếp (rời trang là hết chạy vì component gỡ ra).
    const chay = () => { clearInterval(t); if (document.visibilityState === "visible") { dat(); t = setInterval(dat, 1000); } };
    chay();
    document.addEventListener("visibilitychange", chay);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", chay); };
  }, []);
  const [h, m, s] = (bay ? GIO.format(bay) : "--:--:--").split(":");
  return (
    <div className="dong-ho" role="timer" aria-label={bay ? `Bây giờ là ${h} giờ ${m} phút, giờ Hồ Chí Minh` : "Giờ Hồ Chí Minh"} suppressHydrationWarning>
      <div className="dong-ho-so" aria-hidden suppressHydrationWarning>
        <span>{h}</span><i>:</i><span>{m}</span><i className="hidden min-[420px]:inline">:</i><b className="hidden min-[420px]:inline">{s}</b>
      </div>
      <div className="dong-ho-phu hidden sm:block" aria-hidden suppressHydrationWarning>
        <span className="dong-ho-nhan">Giờ Hồ Chí Minh · UTC+7</span>
        <span className="dong-ho-ngay">{bay ? NGAY.format(bay) : "—"}</span>
      </div>
    </div>
  );
}

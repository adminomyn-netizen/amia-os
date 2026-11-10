"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { NUT_CHU, O_NHAP } from "@/components/ui/dinh-dang";
import type { timKhach } from "@/app/(app)/ban-hang/actions";

export type KhachChon = { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string; /** Nguồn giới thiệu của khách (khach_hang.doi_tac_id) để Thu ngân gợi ý. */ doi_tac_id?: string | null };

/** Ô tìm khách theo tên / SĐT / mã (gợi ý sau 250 ms). Dùng ở Thu ngân và Lịch hẹn. */
export function ChonKhach({ khach, onDoi, tim, tuFocus }: { khach: KhachChon | null; onDoi: (k: KhachChon | null) => void; tim: typeof timKhach; /** Mở là đặt con trỏ vào ô tìm (Đơn làm dịch vụ: chọn khách trước). */ tuFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [kq, setKq] = useState<KhachChon[]>([]);
  const lanDau = useRef(true);
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(async () => setKq(q.trim().length >= 2 ? ((await tim(q)) as KhachChon[]) : []), 250);
    return () => clearTimeout(t);
  }, [q, tim]);
  if (khach) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-the border border-vien bg-giay-sang px-4 py-3">
        <div><div className="text-[15px] font-medium text-muc">{khach.ho_ten}</div><div className="text-[13px] text-muc-3">{khach.ma}{khach.dien_thoai ? ` · ${khach.dien_thoai}` : ""}</div></div>
        <button type="button" className={NUT_CHU} onClick={() => onDoi(null)}>Đổi khách</button>
      </div>
    );
  }
  return (
    <div className="relative">
      <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm khách theo tên, số điện thoại hoặc mã (bỏ trống nếu bán lẻ không cần khách)" aria-label="Tìm khách" autoFocus={tuFocus} className={`${O_NHAP} pl-9`} />
      {kq.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-the border border-vien bg-giay-sang shadow-[0_14px_32px_rgba(5,40,36,0.18)]">
          {kq.map((k) => (
            <li key={k.id}><button type="button" onClick={() => { onDoi(k); setQ(""); setKq([]); }} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-giay-tram"><span className="font-medium text-muc">{k.ho_ten}</span><span className="text-muc-3">{k.ma} · {k.dien_thoai}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}


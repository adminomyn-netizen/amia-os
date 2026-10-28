"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Phần mở rộng của Báo cáo sáng: mặc định gập (trang chủ gọn), bấm "Xem thêm" thì nối dài ra, bấm lại để thu gọn. */
export function MoRongBaoCao({ children }: { children: React.ReactNode }) {
  const [mo, setMo] = useState(false);
  return (
    <div className="space-y-5">
      {mo && <div className="space-y-5">{children}</div>}
      <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} className="flex w-full items-center justify-center gap-1.5 rounded-nho border border-vien bg-giay-sang py-2 text-[13px] font-medium text-nhan-dam hover:bg-giay-tram">
        {mo ? <>Thu gọn <ChevronUp className="h-4 w-4" aria-hidden /></> : <>Xem thêm: hôm qua và khách sinh nhật <ChevronDown className="h-4 w-4" aria-hidden /></>}
      </button>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";

/** Tab con của Bảng xếp hạng (Nhân viên / Dịch vụ & Thẻ / Sản phẩm / Khách hàng): đổi ngay trên máy, không tải lại —
 *  mọi bảng đã dựng sẵn ở máy chủ, chỉ ẩn/hiện. Gọn trên điện thoại (chị Lâm 10/11/2026). */
export function TabXepHang({ muc }: { muc: { ma: string; ten: string; noiDung: ReactNode }[] }) {
  const [chon, setChon] = useState(muc[0]?.ma);
  return (
    <div>
      <div role="tablist" aria-label="Nhóm xếp hạng" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {muc.map((m) => (
          <button key={m.ma} type="button" role="tab" id={`xh-tab-${m.ma}`} aria-controls={`xh-${m.ma}`} aria-selected={chon === m.ma} onClick={() => setChon(m.ma)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium ${chon === m.ma ? "bg-nhan-nhat text-nhan-dam ring-1 ring-nhan/40" : "text-muc-3 hover:text-muc"}`}>
            {m.ten}
          </button>
        ))}
      </div>
      {muc.map((m) => (
        <div key={m.ma} role="tabpanel" id={`xh-${m.ma}`} aria-labelledby={`xh-tab-${m.ma}`} hidden={chon !== m.ma} className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {m.noiDung}
        </div>
      ))}
    </div>
  );
}

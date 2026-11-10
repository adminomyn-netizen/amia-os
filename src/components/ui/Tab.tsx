"use client";

import Link, { useLinkStatus } from "next/link";
import { useState } from "react";

/** Dải tab dạng liên kết (đổi tab = đổi ?tab=…, máy chủ dựng lại đúng phần cần).
 *  Bấm là tab sáng lên NGAY và có vạch chạy, không phải chờ máy chủ trả trang (chị Lâm 10/11: bấm là chuyển, dưới 1s). */
export function Tab({ muc, dang, goc, them = "" }: { muc: { ma: string; ten: string }[]; dang: string; goc: string; them?: string }) {
  const [chon, setChon] = useState(dang);
  const [truoc, setTruoc] = useState(dang);
  if (truoc !== dang) { setTruoc(dang); setChon(dang); }
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-vien">
      {muc.map((m) => (
        <Link key={m.ma} href={`${goc}?tab=${m.ma}${them}`} role="tab" aria-selected={chon === m.ma} scroll={false} onClick={() => setChon(m.ma)}
          className={`relative -mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${chon === m.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>
          {m.ten}<DangTai />
        </Link>
      ))}
    </div>
  );
}

function DangTai() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="absolute inset-x-2 -bottom-0.5 h-0.5 animate-pulse rounded-full bg-nhan" /> : null;
}

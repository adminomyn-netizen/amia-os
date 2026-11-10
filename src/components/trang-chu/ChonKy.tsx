"use client";

import Link, { useLinkStatus } from "next/link";
import { useState } from "react";
import { DS_KY, type KyXh } from "@/lib/ky-xep-hang";

/** Chọn kỳ xem cho tab Hôm nay của Tổng quan (Hôm nay / Tuần này / Tháng này / Tháng trước): chỉ số doanh thu + bảng xếp hạng đi theo kỳ.
 *  Bấm là nút sáng ngay + vạch chờ (như dải Tab), máy chủ chỉ dựng lại hai khối đó. */
export function ChonKy({ dang, goc }: { dang: KyXh; goc: string }) {
  const [chon, setChon] = useState(dang);
  const [truoc, setTruoc] = useState(dang);
  if (truoc !== dang) { setTruoc(dang); setChon(dang); }
  return (
    <div role="group" aria-label="Kỳ xem số liệu" className="mb-5 flex gap-1 overflow-x-auto rounded-vua bg-vien/40 p-1 sm:inline-flex">
      {DS_KY.map((k) => (
        <Link key={k.ma} href={`${goc}&ky=${k.ma}`} scroll={false} aria-current={chon === k.ma ? "true" : undefined} onClick={() => setChon(k.ma)}
          className={`relative flex-1 whitespace-nowrap rounded-nho px-2 py-1.5 text-center text-[13.5px] sm:px-3.5 font-medium sm:flex-none ${chon === k.ma ? "bg-giay-sang text-nhan-dam shadow-sm" : "text-muc-3 hover:text-muc"}`}>
          {k.ten}<DangTai />
        </Link>
      ))}
    </div>
  );
}

function DangTai() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="absolute inset-x-3 bottom-0.5 h-0.5 animate-pulse rounded-full bg-nhan" /> : null;
}

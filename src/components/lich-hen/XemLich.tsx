"use client";

import { useState } from "react";
import Link from "next/link";
import { Hop } from "@/components/ui/Hop";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

/** Hộp "Xem lịch" như SalonHero: chi tiết một lịch hẹn (khách, giờ, dịch vụ, người làm, trạng thái, nguồn, chỗ, ghi chú, hoá đơn…) ngay trên màn Lịch hẹn.
 *  `dong` = cặp nhãn - giá trị dựng sẵn ở máy chủ (cùng nguồn với phiếu In lịch hẹn); dòng trống không hiện. */
export function XemLich({ tieuDe, dong, khachId, hoaDon }: { tieuDe: string; dong: [string, string][]; khachId: string; hoaDon?: { id: string; ma: string } | null }) {
  const [mo, setMo] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setMo(true)} className="rounded-nho border border-vien-dam px-3 py-1.5 text-[13px] font-medium text-muc-2 hover:bg-giay-tram">Xem lịch</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={tieuDe} rong="rong">
        <dl className="grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[160px_1fr]">
          {dong.filter(([, v]) => v).map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-3">{n}</dt><dd className="min-w-0 break-words font-medium text-muc">{v}</dd></div>)}
          {hoaDon && <div className="contents"><dt className="text-muc-3">Hoá đơn</dt><dd><Link href={`/hoa-don/${hoaDon.id}`} className="font-medium text-nhan-dam hover:underline">#{hoaDon.ma}</Link></dd></div>}
        </dl>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <Link href={`/khach-hang/${khachId}`} className={`${NUT_PHU} inline-flex items-center`}>Hồ sơ khách</Link>
          <button type="button" className={NUT_CHINH} onClick={() => setMo(false)}>Đóng</button>
        </div>
      </Hop>
    </>
  );
}

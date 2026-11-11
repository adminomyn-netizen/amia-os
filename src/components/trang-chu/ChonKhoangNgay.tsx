"use client";

import { useRouter } from "next/navigation";
import { NgayChon } from "@/components/ui/NgayChon";

/** Kỳ "Tùy chỉnh" của tab Doanh thu: từ ngày – đến ngày, đổi là đổi địa chỉ (?ky=tuy-chinh&tu=&den=), máy chủ tính lại; gửi link cho người khác vẫn đúng kỳ. */
export function ChonKhoangNgay({ goc, tu, den }: { goc: string; tu: string; den: string }) {
  const router = useRouter();
  const di = (t: string, d: string) => router.push(`${goc}&ky=tuy-chinh&tu=${t}&den=${d}`, { scroll: false });
  return (
    <div className="-mt-2 mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
      <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => v && di(v, den)} />
      <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => v && di(tu, v)} />
    </div>
  );
}

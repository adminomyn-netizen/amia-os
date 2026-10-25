"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHU } from "@/components/ui/dinh-dang";

/** Nút thao tác một chạm (không hộp thoại) cho lễ tân: lỗi hiện ngay dưới nút. */
export function NutNhanh({ nhan, action, du, chinh }: { nhan: string; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }>; du: Record<string, string>; chinh?: boolean }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" disabled={dang} className={chinh ? "nut-vang h-8 rounded-nho px-3 text-[13px] disabled:opacity-60" : NUT_CHU}
        onClick={() => { setLoi(""); bat(async () => { const fd = new FormData(); Object.entries(du).forEach(([k, v]) => fd.set(k, v)); const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else router.refresh(); }); }}>{dang ? "Đang lưu" : nhan}</button>
      {loi && <span role="alert" className="mt-1 max-w-[260px] text-[12px] leading-snug text-loi">{loi}</span>}
    </span>
  );
}

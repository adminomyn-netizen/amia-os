"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { O_NHAP } from "@/components/ui/dinh-dang";

/** Tìm nguồn / mã / SĐT + ô "Mới tạo 7 ngày" (rà trước mỗi đợt chi trả) + Xuất Excel theo đúng bộ lọc. */
export function LocNguon({ q, moi, xuat }: { q: string; moi: boolean; xuat: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [tim, setTim] = useState(q);
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); router.push(`/marketing/doi-tac?${u}`); };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <form onSubmit={(e) => { e.preventDefault(); dat("q", tim.trim()); }} className="min-w-[220px] flex-1">
        <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm nguồn / mã / SĐT" aria-label="Tìm nguồn giới thiệu" className={O_NHAP} />
      </form>
      <label className="flex items-center gap-2 text-[14px] text-muc-2" title="Nguồn mới tạo trong 7 ngày: rà trước mỗi đợt chi trả">
        <input type="checkbox" checked={moi} onChange={(e) => dat("moi", e.target.checked ? "1" : "")} className="h-4 w-4 accent-[var(--nhan)]" />Mới tạo 7 ngày
      </label>
      <a href={xuat} download className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";

/** Bộ lọc hai tab "Cần xuất" / "Đã xuất": khoảng ngày bán + ô tìm. Giữ nguyên tab đang xem. */
export function LocHoaDonDienTu({ tu, den, tab }: { tu: string; den: string; tab: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const lanDau = useRef(true);
  const dat = (k: string, v: string) => {
    const u = new URLSearchParams(sp.toString());
    u.set("tab", tab);
    if (v) u.set(k, v); else u.delete(k);
    router.push(`/tai-chinh/hoa-don-dien-tu?${u}`);
  };
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(() => dat("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat("tu", v)} />
      <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat("den", v)} />
      <div className="relative"><Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số hoá đơn, mã đơn, khách" aria-label="Tìm hoá đơn" className={`${O_NHAP} pl-9`} /></div>
    </div>
  );
}

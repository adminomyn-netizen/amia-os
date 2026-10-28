"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";

export function LocHoaDon({ tu, den }: { tu: string; den: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const lanDau = useRef(true);
  const dat = (k: string, v: string) => {
    const u = new URLSearchParams(sp.toString());
    if (v) u.set(k, v); else u.delete(k);
    u.delete("trang");
    router.push(`/hoa-don?${u}`);
  };
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(() => dat("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const trangThai = sp.get("no") === "1" ? "no" : sp.get("tt") ?? "";
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
      <div className="relative"><Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã hoá đơn, tên hoặc SĐT khách" aria-label="Tìm hoá đơn" className={`${O_NHAP} pl-9`} /></div>
      <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat("tu", v)} />
      <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat("den", v)} />
      <Chon ariaLabel="Trạng thái" giaTri={trangThai} onDoi={(v) => { const u = new URLSearchParams(sp.toString()); u.delete("tt"); u.delete("no"); u.delete("trang"); if (v === "no") u.set("no", "1"); else if (v) u.set("tt", v); router.push(`/hoa-don?${u}`); }}
        luaChon={[{ gia_tri: "", nhan: "Mọi trạng thái" }, { gia_tri: "hoan_thanh", nhan: "Hoàn thành" }, { gia_tri: "no", nhan: "Còn nợ" }, { gia_tri: "huy", nhan: "Đã huỷ" }]} />
      <Chon ariaLabel="Hoá đơn VAT" giaTri={sp.get("vat") ?? ""} onDoi={(v) => dat("vat", v)}
        luaChon={[{ gia_tri: "", nhan: "HĐ VAT: tất cả" }, { gia_tri: "co", nhan: "Đã có hoá đơn VAT" }, { gia_tri: "chua", nhan: "Chưa có hoá đơn VAT" }]} />
    </div>
  );
}

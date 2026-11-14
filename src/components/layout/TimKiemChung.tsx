"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { timChung, type KqTim } from "@/app/(app)/tim-kiem/actions";

/** Ô tìm chung ở đầu trang: gõ từ 2 ký tự là gợi ý chức năng, khách, hoá đơn, sản phẩm, nhân viên. `toi` = đặt trên nền thanh menu tối. */
export function TimKiemChung({ toi = false, rong = "w-44 xl:w-64" }: { toi?: boolean; rong?: string }) {
  const [tu, setTu] = useState("");
  const [kq, setKq] = useState<KqTim[] | null>(null);
  const [mo, setMo] = useState(false);
  const [, chuyen] = useTransition();
  const goc = useRef<HTMLDivElement>(null);
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("mousedown", ngoai); document.addEventListener("keydown", phim);
    return () => { document.removeEventListener("mousedown", ngoai); document.removeEventListener("keydown", phim); clearTimeout(hen.current); };
  }, []);

  const doi = (v: string) => {
    setTu(v); setMo(true); clearTimeout(hen.current);
    if (v.trim().length < 2) { setKq(null); return; }
    hen.current = setTimeout(() => chuyen(async () => setKq(await timChung(v))), 220);
  };
  const dong = () => { setMo(false); setTu(""); setKq(null); };

  return (
    <div ref={goc} className={`relative ${rong} min-w-0`} role="search">
      <Search strokeWidth={1.8} aria-hidden className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${toi ? "text-menu-chu-phu" : "text-muc-3"}`} />
      <input id="tim-chung" type="search" value={tu} onChange={(e) => doi(e.target.value)} onFocus={() => setMo(true)} autoComplete="off" aria-label="Tìm khách hàng, lịch hẹn, hoá đơn, chức năng"
        placeholder="Tìm khách hàng, hoá đơn…" className={`h-10 w-full rounded-nho border pl-9 pr-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-nhan ${toi ? "border-menu-vien bg-menu-hover text-menu-sang placeholder:text-menu-chu-phu" : "border-vien bg-giay-sang text-muc placeholder:text-muc-3"}`} />
      {mo && tu.trim().length >= 2 && (
        <div style={{ position: "absolute" }} className="the-noi the-noi-thap vao absolute left-0 top-full z-50 mt-2 max-h-[70dvh] w-[min(420px,calc(100vw-24px))] overflow-y-auto p-2">
          {kq === null ? <p className="px-3 py-3 text-[13.5px] text-muc-3">Đang tìm…</p> : kq.length === 0 ? <p className="px-3 py-3 text-[13.5px] text-muc-3">Không thấy kết quả nào cho “{tu.trim()}”.</p> : kq.map((g) => (
            <section key={g.nhom} className="py-1">
              <h3 className="nhan-muc px-3 pb-1 pt-2">{g.nhom}</h3>
              <ul>{g.muc.map((m) => (
                <li key={m.href + m.ten}><Link href={m.href} onClick={dong} className="block rounded-nho px-3 py-2 hover:bg-giay-tram"><span className="block text-[14px] text-muc">{m.ten}</span>{m.phu && <span className="block truncate text-[12px] text-muc-3">{m.phu}</span>}</Link></li>
              ))}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

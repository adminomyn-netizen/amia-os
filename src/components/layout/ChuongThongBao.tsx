"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

type Muc = { nhan: string; href: string };

/** Chuông thông báo: số việc đang chờ (lịch chưa xác nhận, phiếu cấp, thẻ sắp hết, nợ, kho thấp). Tự làm mới mỗi phút và khi mở. */
export function ChuongThongBao() {
  const [ds, setDs] = useState<Muc[] | null>(null);
  const [mo, setMo] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const lamMoi = useCallback(() => {
    fetch("/api/canh-bao", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setDs(j.ds as Muc[]); }).catch(() => { /* mất mạng: giữ số cũ */ });
  }, []);
  useEffect(() => {
    const dau = setTimeout(lamMoi, 0);
    const t = setInterval(() => { if (document.visibilityState === "visible") lamMoi(); }, 60000);
    return () => { clearTimeout(dau); clearInterval(t); };
  }, [lamMoi]);
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("mousedown", ngoai); document.addEventListener("keydown", phim);
    return () => { document.removeEventListener("mousedown", ngoai); document.removeEventListener("keydown", phim); };
  }, [mo]);
  const n = ds?.length ?? 0;
  return (
    <div ref={goc} className="relative">
      <button type="button" onClick={() => { setMo((x) => !x); lamMoi(); }} aria-haspopup="menu" aria-expanded={mo} aria-label={n ? `Thông báo, ${n} việc đang chờ` : "Thông báo"} title="Việc đang chờ xử lý"
        className="nut-nguoi relative flex h-10 w-10 items-center justify-center rounded-nho text-muc-2">
        <Bell strokeWidth={1.7} className="h-[21px] w-[21px]" />
        {n > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-loi px-1 text-[11px] font-semibold leading-none text-white" style={{ borderRadius: 9, boxShadow: "0 0 0 2px #fff" }}>{n}</span>}
      </button>
      {mo && (
        <div role="menu" aria-label="Thông báo" style={{ position: "absolute" }} className="the-noi the-noi-thap vao right-0 top-full z-50 mt-2.5 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden">
          <div className="border-b border-vien px-5 pb-3 pt-5 text-[15px] font-semibold text-muc">Việc đang chờ{n ? ` (${n})` : ""}</div>
          {ds === null ? <p className="px-5 py-6 text-[14px] text-muc-3">Đang tải…</p> : n === 0 ? <p className="px-5 py-6 text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">
              {ds.map((m) => <li key={m.href + m.nhan}><Link href={m.href} role="menuitem" onClick={() => setMo(false)} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px] text-muc hover:bg-giay-tram"><span>{m.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

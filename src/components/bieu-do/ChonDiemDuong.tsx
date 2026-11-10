"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type CotChiTiet = { nhan: string; dong: { ten: string; mau: string; gt: string }[]; href?: string };

/**
 * Lớp bấm/rê đè lên biểu đồ đường: mỗi ngày một cột trong suốt. Máy tính rê chuột là hiện số của ngày;
 * điện thoại chạm là hiện, chạm lại hoặc chạm ra ngoài để ẩn. Khung số có nút mở chi tiết (vd hoá đơn của ngày).
 * `trai`/`phai`: lề trái/phải của vùng vẽ tính theo % chiều rộng SVG (để cột khớp đúng điểm).
 */
export function ChonDiemDuong({ cot, trai, phai, tren, duoi }: { cot: CotChiTiet[]; trai: number; phai: number; tren: number; duoi: number }) {
  const [ro, setRo] = useState<number | null>(null);
  const [ghim, setGhim] = useState<number | null>(null);
  const goc = useRef<HTMLDivElement>(null);
  const dang = ro ?? ghim;
  useEffect(() => {
    if (ghim == null) return;
    const ngoai = (e: PointerEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setGhim(null); };
    document.addEventListener("pointerdown", ngoai);
    return () => document.removeEventListener("pointerdown", ngoai);
  }, [ghim]);
  const n = cot.length;
  const viTri = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const c = dang != null ? cot[dang] : null;
  return (
    <div ref={goc} className="absolute" style={{ left: `${trai}%`, right: `${phai}%`, top: `${tren}%`, bottom: `${duoi}%` }}>
      {cot.map((d, i) => (
        <button key={i} type="button" aria-label={`${d.nhan}: ${d.dong.map((x) => `${x.ten} ${x.gt}`).join(", ")}`}
          className="absolute inset-y-0 cursor-pointer outline-none focus-visible:bg-nhan/10"
          style={{ left: `${viTri(i)}%`, width: `${n === 1 ? 100 : 100 / (n - 1)}%`, transform: "translateX(-50%)" }}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setRo(i); }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setRo(null); }}
          onFocus={() => setRo(i)} onBlur={() => setRo(null)}
          onClick={() => setGhim((g) => (g === i ? null : i))} />
      ))}
      {c && dang != null && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-muc-3/50" style={{ left: `${viTri(dang)}%` }} />
          <div role="status" className="the-noi the-noi-thap absolute top-0 z-30 w-max max-w-[220px] px-3 py-2 text-left text-[13px]"
            style={{ left: `${viTri(dang)}%`, transform: viTri(dang) > 60 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}>
            <p className="font-semibold text-muc">{c.nhan}</p>
            {c.dong.map((x) => (
              <p key={x.ten} className="mt-0.5 flex items-center gap-1.5 tabular-nums text-muc"><span aria-hidden className="h-2 w-2 shrink-0 rounded-sm" style={{ background: x.mau }} /><span className="text-muc-2">{x.ten}:</span><span className="font-semibold">{x.gt}</span></p>
            ))}
            {c.href && <Link href={c.href} className="mt-1.5 inline-block font-medium text-nhan-dam hover:underline">Xem hoá đơn ngày này ›</Link>}
          </div>
        </>
      )}
    </div>
  );
}

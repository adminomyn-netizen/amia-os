"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { tienGon, tienVN } from "@/lib/dinh-dang";

export type CotNgay = { ngay: string; doanhThu: number; thucThu: number; soDon: number; soBuoi: number };

const THU = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const thuCua = (ngay: string) => THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()];
const ddmm = (ngay: string) => `${ngay.slice(8)}/${ngay.slice(5, 7)}`;
/** Mốc trục đẹp (1, 2, 2,5, 5 × 10^n) để 4 vạch ngang chia đều, đỉnh trục ≥ cột cao nhất. */
function mocTruc(max: number) {
  if (max <= 0) return [0, 1, 2, 3, 4].map((i) => i * 250_000);
  const tho = max / 4, mu = 10 ** Math.floor(Math.log10(tho));
  const buoc = [1, 2, 2.5, 5, 10].map((h) => h * mu).find((b) => b >= tho) ?? 10 * mu;
  return [0, 1, 2, 3, 4].map((i) => i * buoc);
}

/** Biểu đồ cột doanh thu theo ngày: rê chuột (máy tính) hoặc chạm (điện thoại) vào cột để xem ngày, doanh thu, thực thu, số hoá đơn, số buổi;
 *  trục trái ghi số tiền gọn. Cột hôm nay tô vàng. Chạm lại cột đang chọn hoặc chạm ra ngoài thì ẩn khung số. */
export function CotDoanhThuNgay({ du, homNay }: { du: CotNgay[]; homNay: string }) {
  const [chon, setChon] = useState<number | null>(null);
  // Vẽ theo đúng bề rộng thật của khung (chữ trục luôn cỡ thật, biểu đồ không phình cao trên màn rộng hay teo chữ trên điện thoại).
  const khung = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = khung.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const moc = mocTruc(Math.max(0, ...du.map((d) => d.doanhThu)));
  const dinh = moc[moc.length - 1] || 1;
  const H = 230, L = 46, R = 8, T = 10, B = 24;
  const rong = (W - L - R) / Math.max(1, du.length);
  const y = (v: number) => T + (1 - v / dinh) * (H - T - B);
  const d = chon != null ? du[chon] : null;
  const tongKy = du.reduce((s, x) => s + x.doanhThu, 0);
  return (
    <div ref={khung} className="relative" onPointerLeave={(e) => { if (e.pointerType === "mouse") setChon(null); }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full touch-manipulation select-none" role="img"
        aria-label={`Doanh thu ${du.length} ngày gần nhất, tổng ${tienVN(tongKy)}: ${du.map((x) => `${ddmm(x.ngay)} ${tienVN(x.doanhThu)}`).join(", ")}`}>
        {moc.map((m) => (
          <g key={m}>
            <line x1={L} x2={W - R} y1={y(m)} y2={y(m)} stroke="var(--vien)" strokeDasharray={m === 0 ? "" : "3 4"} />
            <text x={L - 6} y={y(m) + 3.5} textAnchor="end" className="fill-[var(--muc-3)] text-[11.5px] tabular-nums">{m === 0 ? "0" : tienGon(m)}</text>
          </g>
        ))}
        {du.map((x, i) => {
          const h = Math.max(x.doanhThu > 0 ? 2 : 0, y(0) - y(x.doanhThu)), la = x.ngay === homNay, dang = chon === i;
          return (
            <g key={x.ngay}>
              <rect x={L + i * rong + rong * 0.18} y={y(0) - h} width={rong * 0.64} height={h} rx="3"
                fill={la ? "var(--dat)" : "var(--sac-luc-mau)"} opacity={chon == null || dang ? (la ? 1 : 0.75) : 0.35} />
              <text x={L + i * rong + rong / 2} y={H - 7} textAnchor="middle" className={`text-[11.5px] ${dang || la ? "fill-[var(--muc)] font-semibold" : "fill-[var(--muc-3)]"}`}>{x.ngay.slice(8)}</text>
              {/* Vùng bấm phủ cả chiều cao cột (cột thấp vẫn dễ chạm). */}
              <rect x={L + i * rong} y={T} width={rong} height={H - T} fill="transparent" className="cursor-pointer outline-none"
                // Chuột: rê là hiện. Chạm (điện thoại): chạm là hiện, chạm lại cột đó thì ẩn — không dùng mouseenter vì máy cảm ứng giả lập nó ngay trước cú chạm.
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setChon(i); }}
                onPointerDown={(e) => { if (e.pointerType !== "mouse") setChon((c) => (c === i ? null : i)); }}
                tabIndex={0} role="button" aria-label={`${thuCua(x.ngay)} ${ddmm(x.ngay)}: doanh thu ${tienVN(x.doanhThu)}, ${x.soDon} hoá đơn`}
                onFocus={() => setChon(i)} onBlur={() => setChon(null)} />
            </g>
          );
        })}
      </svg>
      {d && (
        <div role="tooltip" className="the-noi the-noi-nang absolute top-0 z-10 w-[190px] px-3 py-2.5 text-left"
          style={{ position: "absolute", left: `clamp(0px, calc(${((L + (chon! + 0.5) * rong) / W) * 100}% - 95px), calc(100% - 190px))` }}>
          <p className="text-[13px] font-semibold text-muc">{thuCua(d.ngay)}, {ddmm(d.ngay)}{d.ngay === homNay ? " · hôm nay" : ""}</p>
          <dl className="mt-1 space-y-0.5 text-[12.5px]">
            <div className="flex justify-between gap-3"><dt className="text-muc-3">Doanh thu</dt><dd className="font-semibold tabular-nums text-muc">{tienVN(d.doanhThu)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muc-3">Thực thu</dt><dd className="tabular-nums text-muc">{tienVN(d.thucThu)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muc-3">Hoá đơn</dt><dd className="tabular-nums text-muc">{d.soDon}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muc-3">Buổi thẻ đã làm</dt><dd className="tabular-nums text-muc">{d.soBuoi}</dd></div>
          </dl>
          <Link href={`/hoa-don?tu=${d.ngay}&den=${d.ngay}&tt=hoan_thanh`} className="pointer-events-auto mt-1.5 inline-block text-[12.5px] font-medium text-nhan-dam hover:underline">Xem hoá đơn ngày này ›</Link>
        </div>
      )}
      <p className="mt-1 text-[12px] text-muc-3">Tổng {du.length} ngày: <b className="font-semibold tabular-nums text-muc-2">{tienVN(tongKy)}</b> · rê chuột hoặc chạm vào cột để xem từng ngày</p>
    </div>
  );
}

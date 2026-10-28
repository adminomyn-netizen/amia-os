"use client";

import { useState } from "react";

export type DiemNgay = { ngay: string; doanhThu: number; thucThu: number; noMoi: number };
const SO = new Intl.NumberFormat("vi-VN");
const tien = (n: number) => `${SO.format(Math.round(n))} đ`;
const gon = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} tỷ` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));
const DUONG = [
  { khoa: "thucThu", nhan: "Đã thu", mau: "var(--sac-xanh-mau)" },
  { khoa: "doanhThu", nhan: "Doanh thu", mau: "var(--sac-luc-mau)" },
  { khoa: "noMoi", nhan: "Nợ phát sinh", mau: "var(--sac-cam-mau)" },
] as const;

/** Biểu đồ đường "Doanh thu nhanh" kiểu BeDental: ba đường (đã thu, doanh thu, nợ phát sinh), chọn 7 / 14 / 30 ngày, rê chuột để xem số từng ngày. */
export function BieuDoNhanh({ du }: { du: DiemNgay[] }) {
  const [soNgay, setSoNgay] = useState(7);
  const [tro, setTro] = useState<number | null>(null);
  const ds = du.slice(-soNgay);
  const W = 640, H = 220, L = 44, R = 12, T = 12, B = 26;
  const max = Math.max(1, ...ds.flatMap((d) => [d.doanhThu, d.thucThu, d.noMoi]));
  const x = (i: number) => L + (ds.length <= 1 ? 0 : (i / (ds.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const moc = [0, 0.25, 0.5, 0.75, 1];
  const nhanTruc = (i: number) => soNgay <= 7 || i % Math.ceil(ds.length / 7) === 0 || i === ds.length - 1;
  const d = tro != null ? ds[tro] : null;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-[12.5px] text-muc-2">{DUONG.map((s) => <li key={s.khoa} className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: s.mau }} />{s.nhan}</li>)}</ul>
        <div className="flex gap-1" role="group" aria-label="Khoảng ngày">
          {[7, 14, 30].map((n) => <button key={n} type="button" onClick={() => { setSoNgay(n); setTro(null); }} aria-pressed={soNgay === n} className={`rounded-nho px-3 py-1 text-[12.5px] font-medium ${soNgay === n ? "bg-nhan text-white" : "border border-vien text-muc-2 hover:bg-giay-tram"}`}>{n} ngày</button>)}
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Biểu đồ đường doanh thu ${soNgay} ngày gần nhất`} onMouseLeave={() => setTro(null)}>
          {moc.map((m) => <g key={m}><line x1={L} x2={W - R} y1={y(max * m)} y2={y(max * m)} stroke="var(--vien)" strokeDasharray={m === 0 ? "" : "3 4"} /><text x={L - 6} y={y(max * m) + 3.5} textAnchor="end" className="fill-[var(--muc-3)] text-[10px]">{gon(max * m)}</text></g>)}
          {ds.map((p, i) => nhanTruc(i) && <text key={p.ngay} x={x(i)} y={H - 8} textAnchor="middle" className="fill-[var(--muc-3)] text-[10px]">{p.ngay.slice(8)}/{p.ngay.slice(5, 7)}</text>)}
          {DUONG.map((s) => <polyline key={s.khoa} fill="none" stroke={s.mau} strokeWidth="2.2" strokeLinejoin="round" points={ds.map((p, i) => `${x(i)},${y(p[s.khoa])}`).join(" ")} />)}
          {tro != null && <line x1={x(tro)} x2={x(tro)} y1={T} y2={H - B} stroke="var(--muc-3)" strokeDasharray="3 3" />}
          {tro != null && DUONG.map((s) => <circle key={s.khoa} cx={x(tro)} cy={y(ds[tro][s.khoa])} r="4" fill={s.mau} stroke="var(--giay-sang)" strokeWidth="1.5" />)}
          {ds.map((_, i) => <rect key={i} x={x(i) - (W - L - R) / Math.max(1, ds.length - 1) / 2} y={T} width={(W - L - R) / Math.max(1, ds.length - 1)} height={H - T - B} fill="transparent" onMouseEnter={() => setTro(i)} onFocus={() => setTro(i)} />)}
        </svg>
        {d && (
          <div role="tooltip" className="the-noi the-noi-nang pointer-events-none absolute top-1 z-10 w-max px-3 py-2.5 text-left" style={{ position: "absolute", left: `${Math.min(78, Math.max(2, (x(tro!) / W) * 100 - 8))}%` }}>
            <p className="text-[13px] font-semibold text-muc">Ngày {d.ngay.slice(8)}/{d.ngay.slice(5, 7)}</p>
            <dl className="mt-1 space-y-0.5">{DUONG.map((s) => <div key={s.khoa} className="flex items-center justify-between gap-4 text-[12.5px]"><dt className="flex items-center gap-1.5 text-muc-3"><span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: s.mau }} />{s.nhan}</dt><dd className="font-medium tabular-nums text-muc">{tien(d[s.khoa])}</dd></div>)}</dl>
          </div>
        )}
      </div>
    </div>
  );
}

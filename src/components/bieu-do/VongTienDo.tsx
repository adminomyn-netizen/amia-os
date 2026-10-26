/** Vòng đo tỉ lệ (0–100%) với số lớn ở giữa. */
export function VongTienDo({ tyLe, nhan, so }: { tyLe: number; nhan: string; so: string }) {
  const t = Math.max(0, Math.min(100, tyLe)), r = 44, chuVi = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 110 110" className="h-[104px] w-[104px] shrink-0 drop-shadow-[0_6px_8px_rgba(10,43,38,0.16)]" role="img" aria-label={`${nhan}: ${t.toFixed(0)}%`}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--giay-tram)" strokeWidth="11" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--sac-luc-mau)" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(t / 100) * chuVi} ${chuVi}`} transform="rotate(-90 55 55)" />
        <text x="55" y="61" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--muc)">{t.toFixed(0)}%</text>
      </svg>
      <div><div className="text-[24px] font-medium leading-none tabular-nums text-muc">{so}</div><div className="mt-1.5 text-[13px] text-muc-3">{nhan}</div></div>
    </div>
  );
}

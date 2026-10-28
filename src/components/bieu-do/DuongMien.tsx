import { MAU_BIEU_DO } from "./mau";

export type Chuoi = { ten: string; gia_tri: number[]; mau?: string };

/** Biểu đồ đường + vùng tô theo ngày. Trục tung có 4 vạch; nhãn ngày cách đều. Có chú thích cho từng chuỗi. */
export function DuongMien({ nhan, chuoi, dinhDang = (n: number) => n.toLocaleString("vi-VN"), dinhDangTruc, ten }: { nhan: string[]; chuoi: Chuoi[]; dinhDang?: (n: number) => string; /** Nhãn trục tung (nên gọn, vd 900k); mặc định tự rút gọn từ triệu. */ dinhDangTruc?: (n: number) => string; ten: string }) {
  const max = Math.max(1, ...chuoi.flatMap((c) => c.gia_tri));
  if (!nhan.length || chuoi.every((c) => c.gia_tri.every((v) => v <= 0))) return <p className="py-6 text-center text-[14px] text-muc-3">Chưa có doanh thu trong khoảng này.</p>;
  const W = 640, H = 230, L = 58, R = 12, T = 12, B = 28, rong = W - L - R, cao = H - T - B;
  const x = (i: number) => L + (nhan.length === 1 ? rong / 2 : (i / (nhan.length - 1)) * rong);
  const y = (v: number) => T + cao - (v / max) * cao;
  const buoc = Math.ceil(nhan.length / 7);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ten}: ${chuoi.map((c) => `${c.ten} tối đa ${dinhDang(Math.max(...c.gia_tri))}`).join("; ")}`} className="w-full">
        <defs>{chuoi.map((c, k) => { const m = c.mau ?? MAU_BIEU_DO[k]; return <linearGradient key={k} id={`gd-mien-${k}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={m} stopOpacity="0.38" /><stop offset="100%" stopColor={m} stopOpacity="0.02" /></linearGradient>; })}</defs>
        {[0, 1, 2, 3, 4].map((k) => { const v = (max / 4) * k, yy = y(v); return (<g key={k}><line x1={L} x2={W - R} y1={yy} y2={yy} stroke="var(--vien)" strokeDasharray={k ? "3 4" : undefined} /><text x={L - 8} y={yy + 4} textAnchor="end" fontSize="10.5" fill="var(--muc-3)">{dinhDangTruc ? dinhDangTruc(Math.round(v)) : max >= 1e6 ? `${(v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr` : dinhDang(Math.round(v))}</text></g>); })}
        {chuoi.map((c, k) => {
          const m = c.mau ?? MAU_BIEU_DO[k];
          const d = c.gia_tri.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
          return (
            <g key={c.ten}>
              <path d={`${d} L${x(c.gia_tri.length - 1).toFixed(1)} ${T + cao} L${x(0).toFixed(1)} ${T + cao} Z`} fill={`url(#gd-mien-${k})`} />
              <path d={d} fill="none" stroke={m} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
              {c.gia_tri.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={nhan.length > 20 ? 2 : 3} fill="var(--giay-sang)" stroke={m} strokeWidth="1.8"><title>{`${nhan[i]} · ${c.ten}: ${dinhDang(v)}`}</title></circle>)}
            </g>
          );
        })}
        {nhan.map((n, i) => (i % buoc === 0 || i === nhan.length - 1) && <text key={n} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--muc-3)">{n}</text>)}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muc-2">
        {chuoi.map((c, k) => <li key={c.ten} className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-5" style={{ background: c.mau ?? MAU_BIEU_DO[k], borderRadius: 3 }} />{c.ten}</li>)}
      </ul>
    </div>
  );
}

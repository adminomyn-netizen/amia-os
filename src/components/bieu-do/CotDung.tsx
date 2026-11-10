import { MAU_BIEU_DO, type Diem } from "./mau";

/** Cột đứng theo thời gian (VD khách mới theo tháng): số ghi trên đỉnh, nhãn dưới chân. */
export function CotDung({ duLieu, dinhDang = (n: number) => n.toLocaleString("vi-VN"), ten }: { duLieu: Diem[]; dinhDang?: (n: number) => string; ten: string }) {
  const max = Math.max(1, ...duLieu.map((d) => d.gia_tri));
  if (!duLieu.length || duLieu.every((d) => d.gia_tri <= 0)) return <p className="py-6 text-center text-[14px] text-muc-3">Chưa có dữ liệu.</p>;
  const W = 480, H = 190, day = 160, rong = W / duLieu.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ten}: ${duLieu.map((d) => `${d.nhan} ${dinhDang(d.gia_tri)}`).join(", ")}`} className="w-full">
      <defs><linearGradient id="gd-cot" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={MAU_BIEU_DO[0]} /><stop offset="100%" stopColor="#00564c" /></linearGradient></defs>
      <line x1="0" x2={W} y1={day} y2={day} stroke="var(--vien)" />
      {duLieu.map((d, i) => {
        const h = Math.max(3, (d.gia_tri / max) * (day - 24)), x = i * rong + rong * 0.2, w = rong * 0.6;
        const noiDung = (
          <>
            <rect x={x} y={day - h} width={w} height={h} rx="4" fill="url(#gd-cot)"><title>{`${d.nhan}: ${dinhDang(d.gia_tri)}`}</title></rect>
            <text x={x + w / 2} y={day - h - 6} textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--muc)">{dinhDang(d.gia_tri)}</text>
            <text x={x + w / 2} y={day + 18} textAnchor="middle" fontSize="11" fill="var(--muc-3)">{d.nhan}</text>
          </>
        );
        return <g key={d.nhan}>{d.href ? <a href={d.href} aria-label={`Xem danh sách ${d.nhan}: ${dinhDang(d.gia_tri)}`} className="cursor-pointer hover:opacity-80">{noiDung}</a> : noiDung}</g>;
      })}
    </svg>
  );
}

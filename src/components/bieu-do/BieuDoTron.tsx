import { MAU_BIEU_DO, type Diem } from "./mau";

const R = 80, C = 100;
const toaDo = (goc: number, r: number) => [C + r * Math.sin(goc), C - r * Math.cos(goc)] as const;
function cung(a0: number, a1: number, rNgoai: number, rTrong: number) {
  const [x0, y0] = toaDo(a0, rNgoai), [x1, y1] = toaDo(a1, rNgoai), lon = a1 - a0 > Math.PI ? 1 : 0;
  if (rTrong <= 0) return `M${C} ${C} L${x0} ${y0} A${rNgoai} ${rNgoai} 0 ${lon} 1 ${x1} ${y1} Z`;
  const [x2, y2] = toaDo(a1, rTrong), [x3, y3] = toaDo(a0, rTrong);
  return `M${x0} ${y0} A${rNgoai} ${rNgoai} 0 ${lon} 1 ${x1} ${y1} L${x2} ${y2} A${rTrong} ${rTrong} 0 ${lon} 0 ${x3} ${y3} Z`;
}

/** Biểu đồ tròn (banh = đặc, vong = rỗng có số tổng ở giữa) kèm chú thích có số và phần trăm — không chỉ dựa vào màu. */
export function BieuDoTron({ duLieu, kieu = "vong", nhanTam, dinhDang = (n: number) => n.toLocaleString("vi-VN"), ten }: { duLieu: Diem[]; kieu?: "banh" | "vong"; nhanTam?: string; dinhDang?: (n: number) => string; ten: string }) {
  const ds = duLieu.filter((d) => d.gia_tri > 0);
  const tong = ds.reduce((s, d) => s + d.gia_tri, 0);
  if (tong <= 0) return <p className="py-8 text-center text-[14px] text-muc-3">Chưa có dữ liệu để vẽ.</p>;
  let goc = 0;
  const lat = ds.map((d, i) => {
    const a0 = goc, a1 = goc + (d.gia_tri / tong) * 2 * Math.PI;
    goc = a1;
    return { ...d, mau: MAU_BIEU_DO[i % MAU_BIEU_DO.length], a0, a1, pt: (d.gia_tri / tong) * 100 };
  });
  const rTrong = kieu === "vong" ? 50 : 0;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${ten}: ${lat.map((l) => `${l.nhan} ${l.pt.toFixed(0)}%`).join(", ")}`} className="h-[190px] w-[190px] shrink-0 drop-shadow-[0_8px_10px_rgba(10,43,38,0.18)]">
        {lat.length === 1 ? (
          <circle cx={C} cy={C} r={rTrong ? (R + rTrong) / 2 : R / 2} fill="none" stroke={lat[0].mau} strokeWidth={rTrong ? R - rTrong : R} />
        ) : (
          lat.map((l) => <path key={l.nhan} d={cung(l.a0, l.a1, R, rTrong)} fill={l.mau} stroke="#fff" strokeWidth="2" strokeLinejoin="round"><title>{`${l.nhan}: ${dinhDang(l.gia_tri)} (${l.pt.toFixed(1)}%)`}</title></path>)
        )}
        {kieu === "vong" && (
          <g textAnchor="middle">
            <text x={C} y={C + 2} fontSize="22" fontWeight="600" fill="var(--muc)">{dinhDang(tong)}</text>
            {nhanTam && <text x={C} y={C + 20} fontSize="10" fill="var(--muc-3)">{nhanTam}</text>}
          </g>
        )}
      </svg>
      <ul className="min-w-[180px] flex-1 space-y-1.5 text-[13px]">
        {lat.map((l) => (
          <li key={l.nhan} className="flex items-center gap-2.5">
            <span aria-hidden className="h-3 w-3 shrink-0" style={{ background: l.mau, borderRadius: 3 }} />
            <span className="min-w-0 flex-1 truncate text-muc-2">{l.nhan}</span>
            <span className="tabular-nums text-muc">{dinhDang(l.gia_tri)}</span>
            <span className="w-11 text-right tabular-nums text-muc-3">{l.pt.toFixed(l.pt < 10 ? 1 : 0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

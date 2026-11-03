/** Biểu đồ cột chồng "Lượng khách hàng ngày": mỗi ngày một cột = khách cũ + khách đến lần đầu + khách lẻ (đơn không gắn hồ sơ). Vẽ bằng SVG, không dùng thư viện; có bảng số đi kèm cho người đọc màn hình. */
export type DongKhachNgay = { ngay: string; le: number; moi: number; cu: number; tong: number };

const W = 480, H = 210, TRAI = 30, PHAI = 6, TREN = 8, DUOI = 22;
const MAU = [{ khoa: "cu" as const, nhan: "Khách cũ", lop: "fill-nhan", o: "bg-nhan" }, { khoa: "moi" as const, nhan: "Khách đến lần đầu", lop: "fill-vang", o: "bg-vang" }, { khoa: "le" as const, nhan: "Khách lẻ (không có hồ sơ)", lop: "fill-muc-3", o: "bg-muc-3" }];

/** Mốc trục tung "tròn" (1, 2, 5 × 10^k) cho giá trị lớn nhất. */
function mocTron(max: number) {
  if (max <= 4) return 4;
  const mu = Math.pow(10, Math.floor(Math.log10(max)));
  for (const b of [1, 2, 4, 5, 10]) if (b * mu >= max) return b * mu;
  return 10 * mu;
}
const ddmm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;

export function BieuDoKhachNgay({ dong }: { dong: DongKhachNgay[] }) {
  const n = dong.length;
  if (n === 0) return <p className="text-[13px] text-muc-3">Chưa có dữ liệu.</p>;
  const max = mocTron(Math.max(1, ...dong.map((d) => d.tong)));
  const rong = (W - TRAI - PHAI) / n, cot = Math.max(2, rong * 0.68), cao = H - TREN - DUOI;
  const y = (v: number) => TREN + cao - (v / max) * cao;
  const tongCong = dong.reduce((s, d) => s + d.tong, 0);
  return (
    <figure>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muc-2">
        {MAU.map((m) => <span key={m.khoa} className="flex items-center gap-1.5"><span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-[2px] ${m.o}`} />{m.nhan}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Lượng khách mỗi ngày trong ${n} ngày gần đây, tổng ${tongCong.toLocaleString("vi-VN")} lượt`} className="h-auto w-full">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={TRAI} x2={W - PHAI} y1={y(max * t)} y2={y(max * t)} className="stroke-vien" strokeWidth={1} />
            <text x={TRAI - 4} y={y(max * t) + 3} textAnchor="end" className="fill-muc-3" fontSize={9}>{Math.round(max * t)}</text>
          </g>
        ))}
        {dong.map((d, i) => {
          const x = TRAI + i * rong + (rong - cot) / 2;
          let duoi = 0;
          return (
            <g key={d.ngay}>
              <title>{`${ddmm(d.ngay)}: ${d.tong} lượt (khách cũ ${d.cu}, đến lần đầu ${d.moi}, khách lẻ ${d.le})`}</title>
              {MAU.map((m) => { const v = d[m.khoa]; if (!v) return null; const y0 = y(duoi), y1 = y(duoi + v); duoi += v; return <rect key={m.khoa} x={x} y={y1} width={cot} height={Math.max(0, y0 - y1)} className={m.lop} />; })}
              {i % 5 === 0 || i === n - 1 ? <text x={x + cot / 2} y={H - 7} textAnchor="middle" className="fill-muc-3" fontSize={9}>{ddmm(d.ngay)}</text> : null}
            </g>
          );
        })}
      </svg>
      <details className="mt-2 text-[12px] text-muc-3">
        <summary className="cursor-pointer select-none hover:text-muc">Xem bảng số theo ngày</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full min-w-[320px] text-right tabular-nums">
            <thead className="sticky top-0 bg-giay-sang text-muc-3"><tr><th className="py-1 pr-3 text-left font-medium">Ngày</th><th className="pr-3 font-medium">Tổng</th><th className="pr-3 font-medium">Cũ</th><th className="pr-3 font-medium">Lần đầu</th><th className="font-medium">Lẻ</th></tr></thead>
            <tbody>{[...dong].reverse().map((d) => <tr key={d.ngay} className="border-t border-vien text-muc-2"><td className="py-1 pr-3 text-left">{ddmm(d.ngay)}</td><td className="pr-3">{d.tong}</td><td className="pr-3">{d.cu}</td><td className="pr-3">{d.moi}</td><td>{d.le}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

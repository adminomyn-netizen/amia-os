import { MAU_BIEU_DO } from "./mau";
import { ChonDiemDuong, type CotChiTiet } from "./ChonDiemDuong";

/** Biểu đồ cột theo kỳ (ngày/tuần/tháng/quý), SVG tự vẽ, tối giản: 3 vạch ngang có số rút gọn, mỗi cột có chú thích khi rê chuột (title),
 *  nhãn trục ngang thưa ra khi nhiều cột để không chồng chữ. Giá trị âm vẽ như 0 (số thật vẫn nằm trong bảng bên dưới). */
export type CotKy = { nhan: string; nhanNgan: string; gia_tri: number };

/** 1.250.000 → "1,25 tr", 3.200.000.000 → "3,2 tỷ" */
export function rutGonTien(n: number) {
  const a = Math.abs(n), f = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  if (a >= 1e9) return `${f(n / 1e9)} tỷ`;
  if (a >= 1e6) return `${f(n / 1e6)} tr`;
  if (a >= 1e3) return `${f(n / 1e3)} nghìn`;
  return f(n);
}
/** Làm tròn trần lên số "đẹp" (1, 2, 2.5, 5, 10 × luỹ thừa 10) để vạch ngang tròn số. */
export function tranDep(max: number) {
  if (max <= 0) return 1;
  const mu = Math.pow(10, Math.floor(Math.log10(max))), t = max / mu;
  return (t <= 1 ? 1 : t <= 2 ? 2 : t <= 2.5 ? 2.5 : t <= 5 ? 5 : 10) * mu;
}

export function CotTheoKy({ duLieu, ten, dinhDang = rutGonTien, trong = "Chưa có số liệu trong khoảng này.", chiTiet, nutChiTiet }: { duLieu: CotKy[]; ten: string; dinhDang?: (n: number) => string; trong?: string; /** Khung số khi rê/bấm vào từng cột (cùng thứ tự duLieu). */ chiTiet?: CotChiTiet[]; nutChiTiet?: string }) {
  if (!duLieu.length || duLieu.every((d) => d.gia_tri <= 0)) return <p className="py-6 text-center text-[14px] text-muc-3">{trong}</p>;
  const W = 720, H = 220, trai = 56, phai = 8, tren = 12, duoi = 28, rong = W - trai - phai, cao = H - tren - duoi;
  const tran = tranDep(Math.max(...duLieu.map((d) => d.gia_tri))), buoc = rong / duLieu.length, wCot = Math.min(36, buoc * 0.7);
  const cachNhan = Math.max(1, Math.ceil(duLieu.length / 10));
  const y = (v: number) => tren + cao - (Math.max(0, v) / tran) * cao;
  return (
    <figure className="relative m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ten}: ${duLieu.length} kỳ, cao nhất ${dinhDang(Math.max(...duLieu.map((d) => d.gia_tri)))}`} className="h-auto w-full">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={trai} x2={W - phai} y1={y(tran * t)} y2={y(tran * t)} stroke="var(--vien)" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={trai - 8} y={y(tran * t) + 4} textAnchor="end" fontSize="11" fill="var(--muc-3)">{t === 0 ? "0" : dinhDang(tran * t)}</text>
          </g>
        ))}
        {duLieu.map((d, i) => {
          const x = trai + i * buoc + (buoc - wCot) / 2, h = Math.max(d.gia_tri > 0 ? 2 : 0, (Math.max(0, d.gia_tri) / tran) * cao);
          return (
            <g key={`${d.nhan}-${i}`}>
              <rect x={x} y={tren + cao - h} width={wCot} height={h} rx="3" fill={MAU_BIEU_DO[0]}><title>{`${d.nhan}: ${d.gia_tri.toLocaleString("vi-VN")} đ`}</title></rect>
              {i % cachNhan === 0 && <text x={x + wCot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muc-3)">{d.nhanNgan}</text>}
            </g>
          );
        })}
      </svg>
      {chiTiet && <ChonDiemDuong kieu="cot" cot={chiTiet} nutChiTiet={nutChiTiet} trai={(trai / W) * 100} phai={(phai / W) * 100} tren={(tren / H) * 100} duoi={(duoi / H) * 100} />}
    </figure>
  );
}

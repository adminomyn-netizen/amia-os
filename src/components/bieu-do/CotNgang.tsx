import Link from "next/link";
import { MAU_BIEU_DO, type Diem } from "./mau";

/** Cột ngang xếp hạng: thanh dài theo giá trị lớn nhất, số ghi ngay cuối thanh. */
export function CotNgang({ duLieu, dinhDang = (n: number) => n.toLocaleString("vi-VN"), mau = MAU_BIEU_DO[0], trong = "Chưa có dữ liệu." }: { duLieu: Diem[]; dinhDang?: (n: number) => string; mau?: string; trong?: string }) {
  const max = Math.max(1, ...duLieu.map((d) => d.gia_tri));
  if (!duLieu.length || duLieu.every((d) => d.gia_tri <= 0)) return <p className="py-6 text-center text-[14px] text-muc-3">{trong}</p>;
  return (
    <ul className="space-y-2.5">
      {duLieu.map((d) => (
        <li key={d.nhan} className="grid grid-cols-[minmax(90px,34%)_1fr_auto] items-center gap-3 text-[13px]">
          {d.href ? <Link href={d.href} className="truncate font-medium text-nhan-dam hover:underline" title={`Xem danh sách: ${d.nhan}`}>{d.nhan}</Link> : <span className="truncate text-muc-2" title={d.nhan}>{d.nhan}</span>}
          <span className="h-3 overflow-hidden bg-giay-tram" style={{ borderRadius: 4, boxShadow: "inset 0 1px 2px rgb(10 43 38 / 0.12)" }}>
            <span className="block h-full" style={{ width: `${Math.max(2, (d.gia_tri / max) * 100)}%`, background: mau, borderRadius: 4, boxShadow: "0 1px 3px rgb(10 43 38 / 0.25)" }} />
          </span>
          <span className="min-w-[60px] text-right tabular-nums text-muc">{dinhDang(d.gia_tri)}</span>
        </li>
      ))}
    </ul>
  );
}

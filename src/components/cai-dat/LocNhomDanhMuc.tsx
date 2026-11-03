import Link from "next/link";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";

export type NhomLoc = { gia_tri: string; nhan: string; dem: number };

/** Phân nhóm + ô tìm kiếm cho tab Dịch vụ / Sản phẩm của Danh mục (SalonHero: cột "Phân nhóm dịch vụ/sản phẩm" có số lượng, ô tìm kiếm). Chỉ lọc để xem, không đổi dữ liệu. */
export function LocNhomDanhMuc({ tab, nhom, tong, chon, q, hien, giu = {} }: { tab: string; nhom: NhomLoc[]; tong: number; chon: string; q: string; hien: number; giu?: Record<string, string> }) {
  const them = Object.entries(giu).filter(([, v]) => v).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join("");
  const href = (n: string) => `/danh-muc?tab=${tab}${n ? `&nhom=${encodeURIComponent(n)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}${them}`;
  const chip = (act: boolean) => `rounded-nho px-3 py-1.5 text-[13px] ${act ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`;
  return (
    <div className="mb-5 space-y-3">
      <form method="get" action="/danh-muc" role="search" className="flex max-w-md gap-2">
        <input type="hidden" name="tab" value={tab} />{chon && <input type="hidden" name="nhom" value={chon} />}{Object.entries(giu).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc mã..." aria-label="Tìm trong danh mục" className={O_NHAP} autoComplete="off" />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>
      <nav aria-label="Phân nhóm" className="flex flex-wrap gap-1.5">
        <Link href={href("")} className={chip(!chon)}>Tất cả ({tong})</Link>
        {nhom.map((n) => <Link key={n.gia_tri} href={href(n.gia_tri)} className={chip(chon === n.gia_tri)}>{n.nhan} ({n.dem})</Link>)}
      </nav>
      {(chon || q) && <p className="text-[12.5px] text-muc-3">Đang hiện {hien}/{tong} mục.</p>}
    </div>
  );
}

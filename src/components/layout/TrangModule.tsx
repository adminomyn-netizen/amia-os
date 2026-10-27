import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { coQuyen, type CoQuyen, type Quyen } from "@/lib/quyen";
import { moduleTheoMa, NHAN_TRANG_THAI, type The, type TrangThaiThe } from "@/lib/module";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { redirect } from "next/navigation";
import { trangDau } from "@/lib/nav";

const KIEU: Record<TrangThaiThe, "tot" | "cho" | "tram"> = { san_sang: "tot", dang_lam: "cho", sap_co: "tram" };
const coMot = (nd: CoQuyen, qs?: Quyen[] | null) => !qs || qs.length === 0 || qs.some((q) => coQuyen(nd, q));

/** Trang tổng quan của một mục lớn: các thẻ chức năng gom theo nhóm, thẻ đã làm bấm vào được, chưa làm hiện nhãn trạng thái. */
export async function TrangModule({ ma }: { ma: string }) {
  const nd = await layNguoiDungDangNhap();
  const m = moduleTheoMa(ma)!;
  if (!coMot(nd, m.quyen)) redirect(trangDau(nd, true));
  const nhom = m.nhom
    .map((g) => ({ ...g, the: g.the.filter((t) => coMot(nd, t.quyen)) }))
    .filter((g) => g.the.length > 0);
  return (
    <div>
      <TieuDeTrang tieuDe={m.ten} phu={m.moTa} />
      <div className="space-y-8">
        {nhom.map((g) => (
          <section key={g.nhan}>
            <h2 className="nhan-muc mb-3">{g.nhan}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {g.the.map((t) => <li key={t.ten}><TheChucNang the={t} /></li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function TheChucNang({ the: t }: { the: The }) {
  const noiDung = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-medium text-muc">{t.ten}</h3>
        {t.duongDan ? <ArrowUpRight strokeWidth={1.6} className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muc-3" aria-hidden /> : null}
      </div>
      <p className="mt-1.5 text-[13.5px] leading-snug text-muc-3">{t.moTa}</p>
      <div className="mt-3"><NhanTrangThai kieu={KIEU[t.trangThai]}>{NHAN_TRANG_THAI[t.trangThai]}</NhanTrangThai></div>
    </>
  );
  if (t.duongDan) return <Link href={t.duongDan} className="the-noi the-noi-nang block h-full p-4">{noiDung}</Link>;
  return <div className="the-noi the-noi-thap h-full p-4 opacity-75" aria-disabled="true">{noiDung}</div>;
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { moduleTheoMa, NHAN_TRANG_THAI, type The, type TrangThaiThe } from "@/lib/module";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { BieuTuongChucNang } from "@/components/layout/bieu-tuong";
import { redirect } from "next/navigation";
import { coMotQuyen as coMot, trangDau } from "@/lib/nav";

const KIEU: Record<TrangThaiThe, "tot" | "cho" | "tram"> = { san_sang: "tot", dang_lam: "cho", sap_co: "tram" };

/** Trang tổng quan của một mục lớn: các thẻ chức năng gom theo nhóm; thẻ đã làm bấm vào được, chưa làm thì mờ và có nhãn trạng thái (thẻ sẵn sàng không cần nhãn). */
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
      <div className="space-y-9">
        {nhom.map((g) => (
          <section key={g.nhan} aria-labelledby={`nhom-${g.nhan}`}>
            <div className="mb-3.5 flex items-center gap-3">
              <h2 id={`nhom-${g.nhan}`} className="nhan-muc shrink-0">{g.nhan}</h2>
              <span aria-hidden className="h-px flex-1 bg-vien" />
              <span className="shrink-0 text-[12px] text-muc-3">{g.the.length} chức năng</span>
            </div>
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
    <div className="flex items-start gap-3.5">
      <span className="o-bieu-tuong" aria-hidden><BieuTuongChucNang ten={t.ten} className="h-[21px] w-[21px]" /></span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-muc">{t.ten}</h3>
        <p className="mt-1 text-[13.5px] leading-snug text-muc-3">{t.moTa}</p>
        {t.trangThai !== "san_sang" && <div className="mt-2.5"><NhanTrangThai kieu={KIEU[t.trangThai]}>{NHAN_TRANG_THAI[t.trangThai]}</NhanTrangThai></div>}
      </div>
      {t.duongDan ? <ChevronRight strokeWidth={1.7} className="the-mui-ten mt-1 h-[18px] w-[18px] shrink-0 text-muc-3" aria-hidden /> : null}
    </div>
  );
  if (t.duongDan) return <Link href={t.duongDan} className="the-noi the-noi-nang the-chuc-nang block h-full p-4">{noiDung}</Link>;
  return <div className="the-noi the-noi-thap h-full p-4 opacity-70" aria-disabled="true">{noiDung}</div>;
}

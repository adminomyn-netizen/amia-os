import Link from "next/link";
import { unstable_cache } from "next/cache";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { chiNhanhXem } from "@/lib/cham-soc-khach";
import { Chon } from "@/components/ui/Chon";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NUT_PHU } from "@/components/ui/dinh-dang";

const MOI_TRANG = 30;
/** Nhớ 1 phút (khách gần đây không cần tới từng giây; giảm tải CSDL khi nhiều người mở cùng lúc). Khoá theo chi nhánh + trang. */
/** Lỗi CSDL (quá giờ…) thì ném ra để KHÔNG bị nhớ lại như một kết quả rỗng. */
const docDen = unstable_cache(async (cn: string, trang: number) => {
  const { data, error } = await sb().rpc("khach_gan_den", { p_cn: cn || undefined, p_lim: MOI_TRANG + 1, p_off: (trang - 1) * MOI_TRANG });
  if (error) throw new Error(`${error.code} ${error.message}`);
  return data ?? [];
}, ["khach-gan-den"], { revalidate: 60 });
const docTong = unstable_cache(async (cn: string) => {
  const { data, error } = await sb().rpc("khach_gan_den_tong", { p_cn: cn || undefined });
  if (error) throw new Error(`${error.code} ${error.message}`);
  return Number(data ?? 0);
}, ["khach-gan-den-tong"], { revalidate: 300 });
type KhachNho = { id: string; ma: string; ho_ten: string; dien_thoai: string };

/** /khach-hang/gan-day — Khách gần đây (như SalonHero): khách vừa đến (hoá đơn hoàn thành mới nhất của mỗi khách, có phân trang) và khách vừa tạo hồ sơ; lọc chi nhánh; Xuất Excel. Chỉ đọc. */
export default async function KhachGanDay({ searchParams }: { searchParams: Promise<{ cn?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const sp = await searchParams;
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const trang = Math.max(1, Math.min(Number(sp.trang) || 1, 300));
  const xemSdt = coQuyen(nd, "khach.sdt");
  const db = sb();
  const [kqDen, { data: moi }, tong] = await Promise.all([
    docDen(cn ?? "", trang).then((data) => ({ data, loi: null as string | null }), (e: Error) => ({ data: [] as Awaited<ReturnType<typeof docDen>>, loi: e.message })),
    db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, tao_luc").match(cn ? { chi_nhanh_id: cn } : {}).order("tao_luc", { ascending: false }).limit(MOI_TRANG),
    docTong(cn ?? "").catch(() => null as number | null),
  ]);
  const loiHd = kqDen.loi;
  if (loiHd) console.error("[khach-gan-day]", loiHd);
  const coTrangSau = kqDen.data.length > MOI_TRANG, ds = kqDen.data.slice(0, MOI_TRANG);
  const ids = ds.map((d) => d.khach_id);
  const { data: ks } = ids.length ? await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").in("id", ids) : { data: [] as KhachNho[] };
  const khach = new Map((ks ?? []).map((k) => [k.id, k as KhachNho]));
  const sdt = (s: string | null) => (xemSdt ? s : "") ?? "";
  const gan = (t: number | undefined) => `/khach-hang/gan-day${cn && !khoa ? `?cn=${cn}${t && t > 1 ? `&trang=${t}` : ""}` : t && t > 1 ? `?trang=${t}` : ""}`;
  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="chu-tieu-de text-[22px] text-muc">Khách gần đây</h1>
        {coQuyen(nd, "khach.xuat") && <NutXuatExcel loai="khach-gan-day" ten="khách gần đây" tham={{ cn: cn ?? undefined }} />}
      </div>
      <form method="get" className="flex flex-wrap items-end gap-3 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-56"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        {!khoa && <button type="submit" className={NUT_PHU}>Lọc</button>}
      </form>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-the border border-vien bg-giay-sang">
          <h2 className="border-b border-vien px-4 py-3 text-[15px] font-semibold text-muc">Vừa đến (theo hoá đơn) {tong != null && <span className="font-normal text-muc-3">· {soVN(tong)} khách</span>}</h2>
          <ul>
            {ds.map((d) => {
              const k = khach.get(d.khach_id);
              if (!k) return null;
              return (
                <li key={d.khach_id} className="flex items-center justify-between gap-3 border-b border-vien px-4 py-2.5 text-[13px] last:border-b-0">
                  <Link href={`/khach-hang/${k.id}`} className="min-w-0 hover:text-nhan-dam"><span className="block truncate font-medium text-muc">{k.ho_ten}</span><span className="tabular-nums text-muc-3">{[sdt(k.dien_thoai), k.ma].filter(Boolean).join(" – ")}</span></Link>
                  <span className="shrink-0 text-right"><span className="block tabular-nums text-muc">{ngayVN(d.ngay)}</span><Link href={`/hoa-don/${d.hd_id}`} className="tabular-nums text-nhan-dam hover:underline">{d.hd_ma}</Link><span className="ml-1 tabular-nums text-muc-3">{tienVN(Number(d.tien))}</span></span>
                </li>
              );
            })}
            {ds.length === 0 && <li role={loiHd ? "alert" : undefined} className="px-4 py-6 text-center text-muc-3">{loiHd ? "Chưa tải được (hệ thống đang chậm). Tải lại trang để thử lại." : "Chưa có hoá đơn nào."}</li>}
          </ul>
          <div className="px-4 pb-3">
            {tong != null ? <ThanhTrang trang={trang} tong={tong} moi={MOI_TRANG} gan={gan} don="khách" /> : (
              <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between gap-3 text-[13px] text-muc-3">
                {trang > 1 ? <Link href={gan(trang - 1)} className="font-medium text-nhan-dam hover:underline">← Trang trước</Link> : <span />}
                <span className="tabular-nums">Trang {trang}</span>
                {coTrangSau ? <Link href={gan(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau →</Link> : <span />}
              </nav>
            )}
          </div>
        </section>
        <section className="rounded-the border border-vien bg-giay-sang">
          <h2 className="border-b border-vien px-4 py-3 text-[15px] font-semibold text-muc">Vừa tạo hồ sơ <span className="font-normal text-muc-3">· {MOI_TRANG} khách mới nhất</span></h2>
          <ul>
            {(moi ?? []).map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 border-b border-vien px-4 py-2.5 text-[13px] last:border-b-0">
                <Link href={`/khach-hang/${k.id}`} className="min-w-0 hover:text-nhan-dam"><span className="block truncate font-medium text-muc">{k.ho_ten}</span><span className="tabular-nums text-muc-3">{[sdt(k.dien_thoai), k.ma].filter(Boolean).join(" – ")}</span></Link>
                <span className="shrink-0 tabular-nums text-muc-3">{ngayGioVN(k.tao_luc)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

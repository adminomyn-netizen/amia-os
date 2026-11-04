import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { unstable_cache } from "next/cache";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_NGUON, TRANG_THAI_KHACH } from "@/lib/khach";
import { tuyChonLocKhach } from "@/lib/khach-danh-sach";
import { BieuDoKhachNgay, type DongKhachNgay } from "@/components/khach/BieuDoKhachNgay";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";

type ThongKe = {
  tong: number; gioi_tinh: Record<string, number>; nguon: Record<string, number>; chi_nhanh: Record<string, number>; tinh: { ten: string; so: number }[] | null;
  chua_co_tinh: number; tuoi: Record<string, number>; moi_theo_thang: { thang: string; so: number }[]; trang_thai: Record<string, number>; hang: Record<string, number>;
  co_the: number; dang_no: number; co_diem: number; tong_diem: number;
};
/** Một lượt đọc ở CSDL (hàm thong_ke_khach, migration 0070), nhớ 5 phút. */
const docThongKe = unstable_cache(async () => {
  const { data, error } = await sb().rpc("thong_ke_khach");
  if (error || !data) throw new Error(`thong_ke_khach: ${error?.code} ${error?.message}`); // lỗi/quá giờ thì không nhớ lại
  return data as unknown as ThongKe;
}, ["khach-thong-ke"], { revalidate: 300 });

/** Khách theo ngày 30 ngày gần đây + khách mới trong tuần (hàm thong_ke_khach_ngay, migration 0193), nhớ 5 phút. */
const docKhachNgay = unstable_cache(async (soNgay: number, den: string) => {
  const { data, error } = await sb().rpc("thong_ke_khach_ngay", { p_so_ngay: soNgay, ...(den ? { p_den: den } : {}) });
  if (error || !data) throw new Error(`thong_ke_khach_ngay: ${error?.code} ${error?.message}`);
  return data as unknown as { ngay: DongKhachNgay[]; moi_tuan: number; moi_khoang?: number };
}, ["khach-thong-ke-ngay-2"], { revalidate: 300 });
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

const TUOI: [string, string][] = [["duoi_18", "Dưới 18"], ["18_24", "18–24"], ["25_34", "25–34"], ["35_44", "35–44"], ["45_54", "45–54"], ["tu_55", "Từ 55"], ["chua_ro", "Chưa có ngày sinh"]];
const GIOI: Record<string, string> = { "nữ": "Nữ", nam: "Nam", "khác": "Khác", chua_ro: "Chưa rõ" };
const so = (n: number) => n.toLocaleString("vi-VN");

/** Một khối thống kê: mỗi dòng là nhãn + thanh tỉ lệ + số (đọc được cả khi không nhìn thanh màu). */
function Khoi({ tieuDe, dong, tong, ghiChu }: { tieuDe: string; dong: { nhan: string; so: number; lk?: string }[]; tong: number; ghiChu?: string }) {
  const max = Math.max(1, ...dong.map((d) => d.so));
  return (
    <section className="the-noi p-4 pt-5">
      <h2 className="mb-3 text-[15px] font-semibold text-muc">{tieuDe}</h2>
      <ul className="space-y-2">
        {dong.map((d) => (
          <li key={d.nhan} className="grid grid-cols-[minmax(0,9rem)_1fr_5.75rem] items-center gap-2 text-[13px]">
            <span className="truncate text-muc-2">{d.lk ? <Link href={d.lk} className="hover:text-nhan-dam hover:underline">{d.nhan}</Link> : d.nhan}</span>
            <span aria-hidden className="h-2 overflow-hidden rounded-[2px] bg-giay-tram"><span className="block h-full rounded-[2px] bg-nhan" style={{ width: `${(d.so / max) * 100}%` }} /></span>
            <span className="text-right tabular-nums text-muc">{so(d.so)}<span className="ml-1 text-[11px] text-muc-3">{tong ? `${Math.round((d.so / tong) * 100)}%` : ""}</span></span>
          </li>
        ))}
      </ul>
      {ghiChu && <p className="mt-3 text-[12px] text-muc-3">{ghiChu}</p>}
    </section>
  );
}

/** /khach-hang/thong-ke — Thống kê khách (như SalonHero): cơ cấu khách theo trạng thái, hạng, giới tính, tuổi, nguồn, chi nhánh, tỉnh; khách mới 12 tháng. */
export default async function ThongKeKhach({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyen("khach.xem");
  // Khoảng ngày của biểu đồ lượng khách (như SalonHero): mặc định 30 ngày tới hôm nay, tối đa 92 ngày.
  const sp = await searchParams;
  const hom = homNayHCM();
  let den = NGAY.test(sp.den ?? "") && sp.den! <= hom ? sp.den! : hom;
  let tu = NGAY.test(sp.tu ?? "") ? sp.tu! : congNgay(den, -29);
  if (tu > den) [tu, den] = [den, tu];
  if (tu < congNgay(den, -91)) tu = congNgay(den, -91);
  const soNgay = Math.round((Date.parse(den) - Date.parse(tu)) / 86_400_000) + 1;
  const macDinh = !sp.tu && !sp.den;
  const [t0, { data: cn }, ngay, tc] = await Promise.all([docThongKe().catch((e: Error) => { console.error("[khach-thong-ke]", e.message); return null; }), sb().from("chi_nhanh").select("id, ten").eq("hoat_dong", true), docKhachNgay(soNgay, den === hom ? "" : den).catch((e: Error) => { console.error("[khach-thong-ke-ngay]", e.message); return null; }), tuyChonLocKhach()]);
  const t = t0 ?? ({ tong: 0, gioi_tinh: {}, nguon: {}, chi_nhanh: {}, tinh: [], chua_co_tinh: 0, tuoi: {}, moi_theo_thang: [], trang_thai: {}, hang: {}, co_the: 0, dang_no: 0, co_diem: 0, tong_diem: 0 } as ThongKe);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const sap = (o: Record<string, number>) => Object.entries(o ?? {}).sort((a, b) => b[1] - a[1]);
  const the = [{ nhan: "Có thẻ đang dùng", so: t.co_the, lk: "/khach-hang?the=co" }, { nhan: "Đang nợ", so: t.dang_no, lk: "/khach-hang?no=co" }, { nhan: "Có điểm thưởng", so: t.co_diem, lk: "/khach-hang?diem_tu=1" }];
  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Thống kê khách" icon={BarChart3} quayLai={{ href: "/khach-hang", nhan: "Danh sách khách" }} quayLaiDienThoai phu={<>{t0 ? `${so(t.tong)} khách · tổng ${so(t.tong_diem)} điểm thưởng · ` : ""}số liệu làm mới mỗi 5 phút</>}>
        <NutXuatExcel loai="thong-ke-khach" ten="thống kê khách" />
      </TieuDeNoi>
      <dl className="grid grid-cols-2 gap-2">
        <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5"><dt className="text-[12px] text-muc-3">Tổng số khách hàng</dt><dd className="text-[20px] font-medium leading-tight tabular-nums text-muc">{t0 ? so(t.tong) : "—"}</dd></div>
        <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5"><dt className="text-[12px] text-muc-3">Khách mới trong tuần <span className="text-muc-3">(hồ sơ tạo 7 ngày gần nhất)</span></dt><dd className="text-[20px] font-medium leading-tight tabular-nums text-muc">{so(ngay?.moi_tuan ?? 0)}</dd></div>
      </dl>
      <section className="the-noi p-4 pt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-muc">Lượng khách hàng ngày <span className="font-normal text-muc-3">· {macDinh ? "30 ngày gần đây" : `${ngayVN(tu)} – ${ngayVN(den)}`}, tính theo hoá đơn hoàn thành{ngay?.moi_khoang != null ? ` · ${so(ngay.moi_khoang)} hồ sơ mới trong khoảng` : ""}</span></h2>
          <form method="get" className="flex flex-wrap items-end gap-2 text-[13px]" aria-label="Chọn khoảng ngày">
            <NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2015} ariaLabel="Từ ngày" className="w-36" /><span aria-hidden className="pb-2 text-muc-3">–</span><NgayChon ten="den" giaTriMacDinh={den} tuNam={2015} ariaLabel="Đến ngày" className="w-36" />
            <button type="submit" className={NUT_PHU}>Xem</button>
          </form>
        </div>
        {ngay ? <BieuDoKhachNgay dong={ngay.ngay} /> : <p role="alert" className="text-[13px] text-loi">Chưa tải được biểu đồ (hệ thống đang chậm). Tải lại trang để thử lại.</p>}
      </section>
      {!t0 && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Chưa tải được các số liệu cơ cấu bên dưới (hệ thống đang chậm). Tải lại trang sau ít phút để thử lại.</p>}
      {t0 && <div className="grid gap-4 xl:grid-cols-2">
        <Khoi tieuDe="Trạng thái" tong={t.tong} dong={sap(t.trang_thai).map(([k, n]) => ({ nhan: TRANG_THAI_KHACH[k]?.nhan ?? k, so: n, lk: `/khach-hang?trang_thai=${k}` }))} />
        <Khoi tieuDe="Hạng" tong={t.tong} dong={sap(t.hang).map(([k, n]) => ({ nhan: k, so: n, lk: `/khach-hang?hang=${encodeURIComponent(k)}` }))} />
        <Khoi tieuDe="Thẻ, công nợ, điểm" tong={t.tong} dong={the} />
        <Khoi tieuDe="Phân nhóm khách hàng" tong={t.tong} dong={tc.nhom.filter((n) => n.so > 0).slice(0, 15).map((n) => ({ nhan: n.ten, so: n.so, lk: `/khach-hang?nhom=${n.id}` }))} ghiChu="Một khách có thể thuộc nhiều nhóm nên tỉ lệ cộng lại có thể trên 100%. Xem đủ ở Quản lý nhóm." />
        <Khoi tieuDe="Giới tính" tong={t.tong} dong={sap(t.gioi_tinh).map(([k, n]) => ({ nhan: GIOI[k] ?? k, so: n }))} />
        <Khoi tieuDe="Độ tuổi" tong={t.tong} dong={TUOI.map(([k, nhan]) => ({ nhan, so: t.tuoi?.[k] ?? 0 }))} />
        <Khoi tieuDe="Nguồn khách" tong={t.tong} dong={sap(t.nguon).map(([k, n]) => ({ nhan: NHAN_NGUON[k] ?? k, so: n, lk: `/khach-hang?nguon=${k}` }))} />
        <Khoi tieuDe="Chi nhánh" tong={t.tong} dong={sap(t.chi_nhanh).map(([k, n]) => ({ nhan: tenCn.get(k) ?? "Chưa gắn chi nhánh", so: n }))} />
        <Khoi tieuDe="Tỉnh/thành (10 nơi nhiều khách nhất)" tong={t.tong} dong={(t.tinh ?? []).map((x) => ({ nhan: x.ten, so: x.so }))} ghiChu={`${so(t.chua_co_tinh)} khách chưa có tỉnh/thành.`} />
        <Khoi tieuDe="Khách mới 12 tháng gần nhất" tong={t.moi_theo_thang.reduce((s, x) => s + x.so, 0)} dong={t.moi_theo_thang.map((x) => ({ nhan: `Tháng ${Number(x.thang.slice(5))}/${x.thang.slice(0, 4)}`, so: x.so, lk: `/khach-hang?tao_tu=${x.thang}-01&tao_den=${x.thang}-${new Date(Number(x.thang.slice(0, 4)), Number(x.thang.slice(5)), 0).getDate()}` }))} />
      </div>}
    </div>
  );
}

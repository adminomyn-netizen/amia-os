import Link from "next/link";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { unstable_cache } from "next/cache";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_NGUON, TRANG_THAI_KHACH } from "@/lib/khach";

type ThongKe = {
  tong: number; gioi_tinh: Record<string, number>; nguon: Record<string, number>; chi_nhanh: Record<string, number>; tinh: { ten: string; so: number }[] | null;
  chua_co_tinh: number; tuoi: Record<string, number>; moi_theo_thang: { thang: string; so: number }[]; trang_thai: Record<string, number>; hang: Record<string, number>;
  co_the: number; dang_no: number; co_diem: number; tong_diem: number;
};
/** Một lượt đọc ở CSDL (hàm thong_ke_khach, migration 0070), nhớ 5 phút. */
const docThongKe = unstable_cache(async () => (await sb().rpc("thong_ke_khach")).data as unknown as ThongKe, ["khach-thong-ke"], { revalidate: 300 });

const TUOI: [string, string][] = [["duoi_18", "Dưới 18"], ["18_24", "18–24"], ["25_34", "25–34"], ["35_44", "35–44"], ["45_54", "45–54"], ["tu_55", "Từ 55"], ["chua_ro", "Chưa có ngày sinh"]];
const GIOI: Record<string, string> = { "nữ": "Nữ", nam: "Nam", "khác": "Khác", chua_ro: "Chưa rõ" };
const so = (n: number) => n.toLocaleString("vi-VN");

/** Một khối thống kê: mỗi dòng là nhãn + thanh tỉ lệ + số (đọc được cả khi không nhìn thanh màu). */
function Khoi({ tieuDe, dong, tong, ghiChu }: { tieuDe: string; dong: { nhan: string; so: number; lk?: string }[]; tong: number; ghiChu?: string }) {
  const max = Math.max(1, ...dong.map((d) => d.so));
  return (
    <section className="rounded-the border border-vien bg-giay-sang p-4">
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
export default async function ThongKeKhach() {
  await yeuCauQuyen("khach.xem");
  const [t, { data: cn }] = await Promise.all([docThongKe(), sb().from("chi_nhanh").select("id, ten")]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const sap = (o: Record<string, number>) => Object.entries(o ?? {}).sort((a, b) => b[1] - a[1]);
  const the = [{ nhan: "Có thẻ đang dùng", so: t.co_the, lk: "/khach-hang?the=co" }, { nhan: "Đang nợ", so: t.dang_no, lk: "/khach-hang?no=co" }, { nhan: "Có điểm thưởng", so: t.co_diem, lk: "/khach-hang?diem_tu=1" }];
  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="chu-tieu-de text-[22px] text-muc">Thống kê khách</h1>
        <NutXuatExcel loai="thong-ke-khach" ten="thống kê khách" />
        <p className="text-[13px] text-muc-3">{so(t.tong)} khách · tổng {so(t.tong_diem)} điểm thưởng · số liệu làm mới mỗi 5 phút</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Khoi tieuDe="Trạng thái" tong={t.tong} dong={sap(t.trang_thai).map(([k, n]) => ({ nhan: TRANG_THAI_KHACH[k]?.nhan ?? k, so: n, lk: `/khach-hang?trang_thai=${k}` }))} />
        <Khoi tieuDe="Hạng" tong={t.tong} dong={sap(t.hang).map(([k, n]) => ({ nhan: k, so: n, lk: `/khach-hang?hang=${encodeURIComponent(k)}` }))} />
        <Khoi tieuDe="Thẻ, công nợ, điểm" tong={t.tong} dong={the} />
        <Khoi tieuDe="Giới tính" tong={t.tong} dong={sap(t.gioi_tinh).map(([k, n]) => ({ nhan: GIOI[k] ?? k, so: n }))} />
        <Khoi tieuDe="Độ tuổi" tong={t.tong} dong={TUOI.map(([k, nhan]) => ({ nhan, so: t.tuoi?.[k] ?? 0 }))} />
        <Khoi tieuDe="Nguồn khách" tong={t.tong} dong={sap(t.nguon).map(([k, n]) => ({ nhan: NHAN_NGUON[k] ?? k, so: n, lk: `/khach-hang?nguon=${k}` }))} />
        <Khoi tieuDe="Chi nhánh" tong={t.tong} dong={sap(t.chi_nhanh).map(([k, n]) => ({ nhan: tenCn.get(k) ?? "Chưa gắn chi nhánh", so: n }))} />
        <Khoi tieuDe="Tỉnh/thành (10 nơi nhiều khách nhất)" tong={t.tong} dong={(t.tinh ?? []).map((x) => ({ nhan: x.ten, so: x.so }))} ghiChu={`${so(t.chua_co_tinh)} khách chưa có tỉnh/thành.`} />
        <Khoi tieuDe="Khách mới 12 tháng gần nhất" tong={t.moi_theo_thang.reduce((s, x) => s + x.so, 0)} dong={t.moi_theo_thang.map((x) => ({ nhan: `Tháng ${Number(x.thang.slice(5))}/${x.thang.slice(0, 4)}`, so: x.so, lk: `/khach-hang?tao_tu=${x.thang}-01&tao_den=${x.thang}-${new Date(Number(x.thang.slice(0, 4)), Number(x.thang.slice(5)), 0).getDate()}` }))} />
      </div>
    </div>
  );
}

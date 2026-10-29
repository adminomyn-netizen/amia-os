import Link from "next/link";
import { AlertTriangle, CalendarDays, CircleDollarSign, ClipboardCheck, Clock, Package, Plus, Star, TrendingUp, Users, ShoppingBag, BarChart3, Warehouse, UsersRound, type LucideIcon } from "lucide-react";
import type { CanhBao } from "@/lib/canh-bao";
import { tienGon, tienVN } from "@/lib/dinh-dang";
import { NoiChiTiet } from "@/components/ui/NoiChiTiet";
import { BangXepHangDep } from "./BangXepHangDep";

type Tin = { id: string; tieu_de: string; noi_dung: string };
type NguoiTop = { ten: string; phu?: string; doanhSo: number; hoaHong?: number; soDong?: number };
type So = {
  lich: number; dangCho: number; khongDen: number; hoanThanh: number; choXacNhan: number; dangPhucVu: number;
  thuHomNay: number | null; noMoi: number | null; thuChiTiet: string; tongNo: number; khoThap: number; leadChua: number;
  nhanCn: { id: string; ten: string }[]; cnDangChon: string | null;
};
type Tile = { nhan: string; so: string; phu: string; mau: string; Icon: LucideIcon; href: string };
const TRUY_CAP = [
  { href: "/khach-hang", nhan: "Khách hàng", Icon: Users, mau: "tim" }, { href: "/lich-hen", nhan: "Lịch hẹn", Icon: CalendarDays, mau: "tim" },
  { href: "/ban-hang", nhan: "Bán hàng", Icon: ShoppingBag, mau: "tim" }, { href: "/bao-cao", nhan: "Báo cáo", Icon: BarChart3, mau: "tim" },
  { href: "/nhan-su", nhan: "Nhân sự", Icon: UsersRound, mau: "luc" }, { href: "/kho-mua-sam", nhan: "Kho & Mua sắm", Icon: Warehouse, mau: "luc" },
];

/** Nhóm cảnh báo để gom thành các nhãn nhỏ trên dải "việc cần xử lý gấp". */
const NHOM: { nhan: string; ma: CanhBao["ma"][] }[] = [
  { nhan: "khoản chờ duyệt", ma: ["vb", "klduyet", "tdyc", "tduv", "xuatkhan", "chuyen", "hdv", "ccnguoi"] },
  { nhan: "vụ khiếu nại, biến chứng", ma: ["bchung", "knai"] },
  { nhan: "mục kho cần xem", ma: ["kho", "han", "tonam"] },
  { nhan: "thẻ sắp hết buổi", ma: ["the"] },
  { nhan: "khoản công nợ", ma: ["no"] },
  { nhan: "việc chấm công, lương", ma: ["ccvao", "ccra", "ccquen", "luong", "cckhoa", "ccnghi", "klhan", "hdld"] },
];
export const MA_CHO_DUYET = NHOM[0].ma;

const THUONG = (c: CanhBao["ma"]) => !c.startsWith("tomtat");

/** Dashboard của lãnh đạo, bố cục theo BeDental: dải cảnh báo, ba khối (bảng tin, top nhân viên, việc của tôi), rồi hàng ô số lớn. */
export function BangDieuHanh({ canhBao, tin, top, so, soLieuNode, baoCaoNode }: { canhBao: CanhBao[]; tin: Tin[]; top: NguoiTop[]; so: So; soLieuNode: React.ReactNode; baoCaoNode?: React.ReactNode }) {
  const gap = canhBao.filter((c) => THUONG(c.ma));
  const nhan = NHOM.map((g) => ({ nhan: g.nhan, ds: gap.filter((c) => g.ma.includes(c.ma)), n: gap.filter((c) => g.ma.includes(c.ma)).length })).filter((g) => g.n > 0);
  const choDuyet = gap.filter((c) => MA_CHO_DUYET.includes(c.ma)).length;
  const tile: Tile[] = [
    { nhan: "Lịch hẹn hôm nay", so: String(so.lich), phu: `${so.hoanThanh} hoàn thành · ${so.khongDen} không đến`, mau: "xanh", Icon: CalendarDays, href: "/lich-hen" },
    { nhan: "Đang chờ / phục vụ", so: String(so.dangCho), phu: `${so.choXacNhan + Math.max(0, so.dangCho - so.choXacNhan - so.dangPhucVu)} chờ (${so.choXacNhan} chưa xác nhận) · ${so.dangPhucVu} đang phục vụ`, mau: "luc", Icon: Clock, href: "/lich-hen" },
    ...(so.thuHomNay != null ? [{ nhan: "Đã thu hôm nay", so: tienGon(so.thuHomNay), phu: so.thuChiTiet || "chưa có doanh thu", mau: "tim", Icon: CircleDollarSign, href: "/bao-cao" }] : []),
    ...(so.noMoi != null ? [{ nhan: "Nợ phát sinh hôm nay", so: tienGon(so.noMoi), phu: `tổng nợ treo ${tienGon(so.tongNo)}`, mau: "cam", Icon: TrendingUp, href: "/bao-cao?tab=no" }] : []),
    { nhan: "Cần phê duyệt", so: String(choDuyet), phu: choDuyet ? "bấm để xem danh sách" : "đã duyệt hết", mau: "hong", Icon: ClipboardCheck, href: "#viec-cua-toi" },
    { nhan: "Kho thấp", so: String(so.khoThap), phu: "mặt hàng dưới mức tối thiểu", mau: "cam", Icon: Package, href: "/kho?thieu=1" },
  ];

  return (
    <div className="space-y-6">
      {so.nhanCn.length > 0 && (
        <nav aria-label="Chọn chi nhánh" className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[13px] text-muc-3">Xem theo:</span>
          {[{ id: "", ten: "Tất cả chi nhánh" }, ...so.nhanCn].map((c) => (
            <Link key={c.id} href={c.id ? `/trang-chu?cn=${c.id}` : "/trang-chu"} aria-current={(so.cnDangChon ?? "") === c.id ? "true" : undefined}
              className={`rounded-nho px-3 py-1.5 text-[13px] ${(so.cnDangChon ?? "") === c.id ? "bg-nhan font-medium text-white" : "border border-vien bg-giay text-muc-2 hover:bg-giay-tram"}`}>{c.ten}</Link>
          ))}
        </nav>
      )}
      <div role="status" className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-nho border px-4 py-3 text-[14px] ${gap.length ? "border-loi/30 bg-loi-nen text-loi" : "border-vien bg-sac-luc-nen text-sac-luc"}`}>
        <span className="flex items-center gap-2 font-semibold"><AlertTriangle strokeWidth={1.8} className="h-[18px] w-[18px]" aria-hidden />{gap.length ? `${gap.length} việc cần xử lý gấp hôm nay` : "Hôm nay không có việc gấp"}</span>
        <ul className="flex flex-wrap gap-2">{nhan.map((g) => <li key={g.nhan}><NoiChiTiet vi="duoi" tieuDe={`${g.n} ${g.nhan}`} dong={g.ds.slice(0, 4).map((c) => ({ nhan: "•", gt: c.nhan.length > 60 ? `${c.nhan.slice(0, 58)}…` : c.nhan }))}><span className="block rounded-nho border border-vien bg-giay px-3 py-0.5 text-[12.5px] text-muc-2">{g.n} {g.nhan}</span></NoiChiTiet></li>)}</ul>
        {gap.length > 0 && <a href="#viec-cua-toi" className="ml-auto font-medium hover:underline">Xem tất cả cảnh báo →</a>}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section className="the-noi vao min-w-0 p-5 pt-6" aria-label="Bảng tin công ty">
          <div className="flex items-baseline justify-between border-b border-vien pb-2.5"><h2 className="text-[15px] font-semibold text-muc">Bảng tin công ty</h2><Link href="/cai-dat/bang-tin" className="text-[13px] font-medium text-nhan-dam hover:underline">Xem tất cả</Link></div>
          <div className="space-y-3 pt-4">
            {tin.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có thông báo nào.</p> : tin.map((t) => (
              <article key={t.id}><h3 className="text-[14.5px] font-semibold text-muc">{t.tieu_de}</h3><p className="mt-0.5 line-clamp-3 whitespace-pre-line text-[13.5px] text-muc-2">{t.noi_dung}</p></article>
            ))}
          </div>
        </section>

        <BangXepHangDep tieuDe="Top nhân viên tháng này" Icon={Star} trong="Chưa có doanh số nhân viên trong tháng này."
          dong={top.map((x) => ({ ten: x.ten, phu: x.phu, phu2: `${tienGon(x.doanhSo)}${x.soDong != null ? ` · ${x.soDong} dòng bán` : ""}`, chu: tienGon(x.doanhSo), gt: x.doanhSo, chiTiet: [{ nhan: "Doanh số tháng", gt: tienVN(x.doanhSo) }, ...(x.hoaHong != null ? [{ nhan: "Hoa hồng tạm tính", gt: tienVN(x.hoaHong) }] : []), ...(x.soDong != null ? [{ nhan: "Số dòng bán", gt: String(x.soDong) }] : [])] }))} />

        <section id="viec-cua-toi" className="the-noi vao min-w-0 scroll-mt-24 p-5 pt-6" aria-label="Việc cần hoàn thành của tôi">
          <div className="flex items-baseline justify-between border-b border-vien pb-2.5"><h2 className="text-[15px] font-semibold text-muc">Việc cần hoàn thành của tôi{gap.length ? ` (${gap.length})` : ""}</h2></div>
          {gap.length === 0 ? <p className="pt-4 text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien pt-1">{gap.slice(0, 6).map((c) => (
              <li key={c.href + c.nhan} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 text-[13.5px] leading-snug text-muc">{c.nhan}</span><Link href={c.href} className="shrink-0 rounded-nho bg-nhan px-3 py-1 text-[12.5px] font-medium text-white hover:opacity-90">Mở</Link></li>
            ))}</ul>
          )}
        </section>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {tile.map((t) => (
          <NoiChiTiet key={t.nhan} cls="min-w-0" vi="duoi" tieuDe={t.nhan} dong={[{ nhan: "Hiện tại", gt: t.so }, { nhan: "Chi tiết", gt: t.phu }]}>
            <Link href={t.href} className="relative block h-full min-w-0 overflow-hidden rounded-nho px-4 pb-4 pt-4 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, var(--sac-${t.mau}-1), var(--sac-${t.mau}-2))` }}>
              <t.Icon aria-hidden strokeWidth={1.5} className="absolute -bottom-2 -right-1 h-16 w-16 opacity-20" />
              <span className="block text-[13px] opacity-90">{t.nhan}</span>
              <span className={`mt-2 block font-semibold leading-none tabular-nums ${t.so.length > 11 ? "text-[19px]" : "text-[26px]"}`}>{t.so}</span>
              <span className="mt-2 block text-[11.5px] leading-snug opacity-85">{t.phu}</span>
            </Link>
          </NoiChiTiet>
        ))}
      </dl>

      {baoCaoNode}

      <section aria-label="Truy cập nhanh">
        <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-muc"><TrendingUp strokeWidth={1.7} className="h-4 w-4 text-nhan" aria-hidden />Truy cập nhanh <span className="text-[12px] font-normal text-muc-3">theo quyền tài khoản</span></h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TRUY_CAP.map((q) => (
            <li key={q.href}><Link href={q.href} className="flex h-full flex-col items-center gap-2 rounded-nho px-3 py-4 text-center text-[13.5px] font-medium text-white transition-transform hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, var(--sac-${q.mau}-1), var(--sac-${q.mau}-2))` }}><q.Icon strokeWidth={1.6} className="h-6 w-6" aria-hidden />{q.nhan}</Link></li>
          ))}
          <li><Link href="/cai-dat" className="flex h-full flex-col items-center gap-2 rounded-nho border border-dashed border-vien-dam px-3 py-4 text-center text-[13.5px] font-medium text-muc-2 hover:bg-giay-tram"><Plus strokeWidth={1.6} className="h-6 w-6" aria-hidden />Tuỳ biến</Link></li>
        </ul>
      </section>

      {soLieuNode}
    </div>
  );
}

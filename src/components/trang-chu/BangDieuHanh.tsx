import Link from "next/link";
import { AlertTriangle, Star } from "lucide-react";
import type { CanhBao } from "@/lib/canh-bao";
import { tienVN } from "@/lib/dinh-dang";
import { NoiChiTiet } from "@/components/ui/NoiChiTiet";
import { BangSoLieu, type SoLieu } from "./BangSoLieu";

type Tin = { id: string; tieu_de: string; noi_dung: string };
type NguoiTop = { ten: string; doanhSo: number; hoaHong?: number; soDong?: number };
type So = { lich: number; dangCho: number; thuHomNay: number | null; noMoi: number | null };

/** Nhóm cảnh báo để gom thành các nhãn nhỏ trên dải "việc cần xử lý gấp". */
const NHOM: { nhan: string; ma: CanhBao["ma"][] }[] = [
  { nhan: "khoản chờ duyệt", ma: ["vb", "klduyet", "tdyc", "tduv", "xuatkhan", "chuyen", "hdv", "ccnguoi"] },
  { nhan: "mục kho cần xem", ma: ["kho", "han", "tonam"] },
  { nhan: "thẻ sắp hết buổi", ma: ["the"] },
  { nhan: "khoản công nợ", ma: ["no"] },
  { nhan: "việc chấm công, lương", ma: ["ccvao", "ccra", "ccquen", "luong", "cckhoa", "ccnghi", "klhan", "hdld"] },
];
export const MA_CHO_DUYET = NHOM[0].ma;

const THUONG = (c: CanhBao["ma"]) => !c.startsWith("tomtat");

/** Dashboard của lãnh đạo, bố cục theo BeDental: dải cảnh báo, ba khối (bảng tin, top nhân viên, việc của tôi), rồi hàng ô số lớn. */
export function BangDieuHanh({ canhBao, tin, top, so, soLieu, xemTien }: { canhBao: CanhBao[]; tin: Tin[]; top: NguoiTop[]; so: So; soLieu: SoLieu | null; xemTien: boolean }) {
  const gap = canhBao.filter((c) => THUONG(c.ma));
  const nhan = NHOM.map((g) => ({ nhan: g.nhan, ds: gap.filter((c) => g.ma.includes(c.ma)), n: gap.filter((c) => g.ma.includes(c.ma)).length })).filter((g) => g.n > 0);
  const choDuyet = gap.filter((c) => MA_CHO_DUYET.includes(c.ma)).length;
  const tren3 = top.slice(0, 3), con = top.slice(3, 6);
  const doiCho = [tren3[1], tren3[0], tren3[2]].map((x, i) => x && { ...x, hang: [2, 1, 3][i] });
  const cao: Record<number, string> = { 1: "h-24", 2: "h-16", 3: "h-12" };
  const tile = [
    { nhan: "Lịch hẹn hôm nay", so: String(so.lich), mau: "xanh" },
    { nhan: "Đang chờ / phục vụ", so: String(so.dangCho), mau: "luc" },
    ...(so.thuHomNay != null ? [{ nhan: "Đã thu hôm nay", so: tienVN(so.thuHomNay), mau: "tim" }] : []),
    ...(so.noMoi != null ? [{ nhan: "Nợ phát sinh hôm nay", so: tienVN(so.noMoi), mau: "cam" }] : []),
    { nhan: "Cần phê duyệt", so: String(choDuyet), mau: "hong" },
  ];

  return (
    <div className="space-y-6">
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

        <section className="the-noi vao min-w-0 p-5 pt-6" aria-label="Top nhân viên tháng này">
          <div className="flex items-center gap-2 border-b border-vien pb-2.5"><Star strokeWidth={1.7} className="h-4 w-4 text-nhan" aria-hidden /><h2 className="text-[15px] font-semibold text-muc">Top nhân viên tháng này</h2></div>
          {tren3.length === 0 ? <p className="pt-4 text-[14px] text-muc-3">Chưa có doanh số tháng này.</p> : (
            <>
              <ol className="grid grid-cols-3 items-end gap-2 pt-5">
                {doiCho.map((x, i) => x ? (
                  <li key={i} className="min-w-0"><NoiChiTiet cls="flex min-w-0 flex-col items-center" tieuDe={`Hạng ${x.hang}: ${x.ten}`} dong={[{ nhan: "Doanh số tháng", gt: tienVN(x.doanhSo) }, ...(x.hoaHong != null ? [{ nhan: "Hoa hồng tạm tính", gt: tienVN(x.hoaHong) }] : []), ...(x.soDong != null ? [{ nhan: "Số dòng bán", gt: String(x.soDong) }] : [])]}>
                    <span className="mb-1 max-w-full truncate text-[12.5px] font-medium text-muc">{x.ten}</span>
                    <span className="mb-1.5 text-[12px] tabular-nums text-muc-3">{tienVN(x.doanhSo)}</span>
                    <span className={`flex w-full items-start justify-center rounded-t-nho pt-2 text-[18px] font-semibold text-white ${cao[x.hang]} ${x.hang === 1 ? "bg-sac-cam-1" : "bg-sac-luc-1"}`} style={{ background: x.hang === 1 ? "var(--sac-cam-1)" : x.hang === 2 ? "var(--sac-xanh-1)" : "var(--sac-luc-1)" }}>{x.hang}</span>
                  </NoiChiTiet></li>
                ) : <li key={i} />)}
              </ol>
              {con.length > 0 && <ul className="mt-3 divide-y divide-vien border-t border-vien">{con.map((x, i) => <li key={x.ten + i} className="flex items-center justify-between gap-3 py-2 text-[13.5px]"><span className="truncate"><span className="mr-2 text-muc-3">{i + 4}</span>{x.ten}</span><span className="shrink-0 tabular-nums text-muc-2">{tienVN(x.doanhSo)}</span></li>)}</ul>}
            </>
          )}
        </section>

        <section id="viec-cua-toi" className="the-noi vao min-w-0 scroll-mt-24 p-5 pt-6" aria-label="Việc cần hoàn thành của tôi">
          <div className="flex items-baseline justify-between border-b border-vien pb-2.5"><h2 className="text-[15px] font-semibold text-muc">Việc cần hoàn thành của tôi{gap.length ? ` (${gap.length})` : ""}</h2></div>
          {gap.length === 0 ? <p className="pt-4 text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien pt-1">{gap.slice(0, 6).map((c) => (
              <li key={c.href + c.nhan} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 text-[13.5px] leading-snug text-muc">{c.nhan}</span><Link href={c.href} className="shrink-0 rounded-nho bg-nhan px-3 py-1 text-[12.5px] font-medium text-white hover:opacity-90">Mở</Link></li>
            ))}</ul>
          )}
        </section>
      </div>

      <dl className={`grid grid-cols-2 gap-3 sm:gap-4 ${tile.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {tile.map((t) => (
          <NoiChiTiet key={t.nhan} cls="min-w-0" vi="duoi" tieuDe={t.nhan} dong={[{ nhan: "Hiện tại", gt: t.so }, ...(t.nhan === "Lịch hẹn hôm nay" && soLieu ? soLieu.lich.filter((x) => x.so > 0).map((x) => ({ nhan: x.nhan, gt: String(x.so) })) : []), ...(t.nhan === "Cần phê duyệt" ? gap.filter((c) => MA_CHO_DUYET.includes(c.ma)).slice(0, 3).map((c) => ({ nhan: "•", gt: c.nhan.slice(0, 50) })) : [])]}>
          <div className="h-full min-w-0 rounded-nho px-4 pb-4 pt-4 text-white shadow-sm" style={{ background: `linear-gradient(135deg, var(--sac-${t.mau}-1), var(--sac-${t.mau}-2))` }}>
            <dt className="text-[13px] opacity-90">{t.nhan}</dt>
            <dd className={`mt-2 font-semibold leading-none tabular-nums ${t.so.length > 11 ? "text-[19px]" : "text-[26px]"}`}>{t.so}</dd>
          </div>
          </NoiChiTiet>
        ))}
      </dl>
      {soLieu && <BangSoLieu d={soLieu} xemTien={xemTien} />}
    </div>
  );
}

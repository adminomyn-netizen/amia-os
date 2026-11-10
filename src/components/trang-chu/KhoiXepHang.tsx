import Link from "next/link";
import { Award, CreditCard, Package, Repeat, ShoppingBag, Sparkles, Star, Users } from "lucide-react";
import { BangXepHangDep, type DongXepHang } from "@/components/trang-chu/BangXepHangDep";
import { layXepHang, type MucXh } from "@/lib/xep-hang";
import { soVN, tienGon, tienVN } from "@/lib/dinh-dang";
import { khoangKy, type KyXh } from "@/lib/ky-xep-hang";


/** Bảng xếp hạng của Dashboard: nhân viên (doanh số, bán hàng, chuyên viên trị liệu phục vụ), dịch vụ, thẻ, thẻ gia hạn, sản phẩm, khách.
 *  Chọn kỳ Tháng này / Tháng trước bằng đường dẫn (`?xh=`). Người không xem được số tiền chỉ thấy số lượt / số lượng. */
export async function KhoiXepHang({ cn, tenCn, ky, homNay, xemTien, goc }: { cn: string | null; tenCn: string | null; ky: KyXh; homNay: string; xemTien: boolean; goc: string }) {
  const { tu, den, nhan } = khoangKy(ky, homNay);
  const x = await layXepHang(tu, den, cn);
  const dong = (ds: MucXh[], donVi: string, theoTien = true): DongXepHang[] => ds.map((m) => ({
    ten: m.ten,
    phu: m.phu,
    phu2: theoTien && xemTien ? `${soVN(m.so)} ${donVi}` : undefined,
    chu: theoTien && xemTien ? tienGon(m.tien) : `${soVN(m.so)} ${donVi}`,
    gt: theoTien && xemTien ? m.tien : m.so,
    chiTiet: (m.chiTiet ?? [{ nhan: `Số ${donVi}`, gt: m.so }, { nhan: "Doanh thu", gt: m.tien, tien: true }])
      .filter((c) => !c.tien || xemTien).map((c) => ({ nhan: c.nhan, gt: c.tien ? tienVN(c.gt) : soVN(c.gt) })),
  }));
  const bc = (tab: string) => `/bao-cao?tab=${tab}&tu=${tu}&den=${den}`;
  const nut = (k: KyXh, chu: string) => (
    <Link href={`${goc}${goc.includes("?") ? "&" : "?"}xh=${k}#xep-hang`} scroll={false} aria-current={ky === k ? "true" : undefined}
      className={`rounded-nho px-3 py-1.5 text-[13px] font-medium ${ky === k ? "bg-nhan text-white" : "border border-vien text-muc-2 hover:border-nhan"}`}>{chu}</Link>
  );
  return (
    <section id="xep-hang" aria-label="Bảng xếp hạng" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-muc">Bảng xếp hạng {nhan}</h2>
          <p className="text-[12.5px] text-muc-3">{tu.split("-").reverse().join("/")} – {den.split("-").reverse().join("/")}{tenCn ? ` · ${tenCn}` : ""} · tính như Báo cáo (theo nhân viên, sản phẩm / dịch vụ, khách hàng)</p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Kỳ xếp hạng">{nut("thang-nay", "Tháng này")}{nut("thang-truoc", "Tháng trước")}</div>
      </div>
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {xemTien && <BangXepHangDep tieuDe="Nhân viên doanh số cao nhất" Icon={Star} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa có doanh số nhân viên ${nhan}.`} dong={dong(x.nhanVien, "lượt")} />}
        <BangXepHangDep tieuDe="Nhân viên bán nhiều nhất (thẻ + sản phẩm)" Icon={ShoppingBag} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa bán thẻ / sản phẩm nào ${nhan}.`} dong={dong(x.banHang, "món")} />
        <BangXepHangDep tieuDe="Chuyên viên trị liệu xuất sắc (lượt phục vụ)" Icon={Award} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa có lượt phục vụ ${nhan}.`} dong={dong(x.chuyenVien, "lượt", false)} />
        <BangXepHangDep tieuDe="Dịch vụ làm nhiều nhất" Icon={Sparkles} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa có dịch vụ nào ${nhan}.`} dong={dong(x.dichVu, "lượt", false)} />
        <BangXepHangDep tieuDe="Thẻ bán chạy nhất" Icon={CreditCard} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa bán thẻ nào ${nhan}.`} dong={dong(x.the, "thẻ")} />
        <BangXepHangDep tieuDe="Thẻ được gia hạn nhiều nhất" Icon={Repeat} href="/the" nhanHref="Thẻ" trong={`Chưa có khách mua lại thẻ cũ ${nhan}.`} dong={dong(x.giaHan, "lần", false)} />
        <BangXepHangDep tieuDe="Sản phẩm bán chạy nhất" Icon={Package} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa bán sản phẩm nào ${nhan}.`} dong={dong(x.sanPham, "cái")} />
        {xemTien && <BangXepHangDep tieuDe="Khách chi tiêu nhiều nhất" Icon={Users} href={bc("khach-hang")} nhanHref="Báo cáo" trong={`Chưa có khách chi tiêu ${nhan}.`} dong={dong(x.khach, "đơn")} />}
      </div>
    </section>
  );
}

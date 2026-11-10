import { Award, CreditCard, Package, Repeat, ShoppingBag, Sparkles, Star, Users } from "lucide-react";
import { BangXepHangDep, type DongXepHang } from "@/components/trang-chu/BangXepHangDep";
import { layXepHang, type MucXh } from "@/lib/xep-hang";
import { soVN, tienGon, tienVN } from "@/lib/dinh-dang";
import { khoangKy, type KyXh } from "@/lib/ky-xep-hang";
import { TabXepHang } from "@/components/trang-chu/TabXepHang";


/** Bảng xếp hạng của Dashboard: nhân viên (doanh số, bán hàng, chuyên viên trị liệu phục vụ), dịch vụ, thẻ, thẻ gia hạn, sản phẩm, khách.
 *  Kỳ ĐI THEO kỳ đang chọn ở đầu tab (Hôm nay / Tuần này / Tháng này / Tháng trước — `?ky=`), chia tab con cho gọn.
 *  Người không xem được số tiền chỉ thấy số lượt / số lượng. */
export async function KhoiXepHang({ cn, tenCn, ky, homNay, xemTien }: { cn: string | null; tenCn: string | null; ky: KyXh; homNay: string; xemTien: boolean }) {
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
  const khoang = tu === den ? tu.split("-").reverse().join("/") : `${tu.split("-").reverse().join("/")} – ${den.split("-").reverse().join("/")}`;
  const tieuDe = (
    <div>
      <h2 className="text-[17px] font-semibold text-muc">Bảng xếp hạng {nhan}</h2>
      <p className="text-[12.5px] text-muc-3">{khoang}{tenCn ? ` · ${tenCn}` : ""} · tính như Báo cáo</p>
    </div>
  );
  const coSo = [x.nhanVien, x.banHang, x.chuyenVien, x.dichVu, x.the, x.giaHan, x.sanPham, x.khach].some((d) => d.length > 0);
  // Kỳ chưa có số (vd đầu giờ sáng): một dòng gọn, không vẽ 8 khối trống.
  if (!coSo) return (
    <section id="xep-hang" aria-label="Bảng xếp hạng" className="the-noi scroll-mt-24 space-y-1 p-5">
      {tieuDe}
      <p className="pt-2 text-[14px] text-muc-2">Chưa có số liệu {nhan}{ky === "hom-nay" ? " — xem Tuần này hoặc Tháng này ở trên." : "."}</p>
    </section>
  );
  const g = { gon: true } as const;
  const nhom = [
    { ma: "nhan-vien", ten: "Nhân viên", noiDung: <>
      {xemTien && <BangXepHangDep {...g} tieuDe="Nhân viên doanh số cao nhất" Icon={Star} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa có doanh số nhân viên ${nhan}.`} dong={dong(x.nhanVien, "lượt")} />}
      <BangXepHangDep {...g} tieuDe="Nhân viên bán nhiều nhất (thẻ + sản phẩm)" Icon={ShoppingBag} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa bán thẻ / sản phẩm nào ${nhan}.`} dong={dong(x.banHang, "món")} />
      <BangXepHangDep {...g} tieuDe="Chuyên viên trị liệu xuất sắc (lượt phục vụ)" Icon={Award} href={bc("nhan-vien")} nhanHref="Báo cáo" trong={`Chưa có lượt phục vụ ${nhan}.`} dong={dong(x.chuyenVien, "lượt", false)} />
    </> },
    { ma: "dich-vu-the", ten: "Dịch vụ & Thẻ", noiDung: <>
      <BangXepHangDep {...g} tieuDe="Dịch vụ làm nhiều nhất" Icon={Sparkles} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa có dịch vụ nào ${nhan}.`} dong={dong(x.dichVu, "lượt", false)} />
      <BangXepHangDep {...g} tieuDe="Thẻ bán chạy nhất" Icon={CreditCard} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa bán thẻ nào ${nhan}.`} dong={dong(x.the, "thẻ")} />
      <BangXepHangDep {...g} tieuDe="Thẻ được gia hạn nhiều nhất" Icon={Repeat} href="/the" nhanHref="Thẻ" trong={`Chưa có khách mua lại thẻ cũ ${nhan}.`} dong={dong(x.giaHan, "lần", false)} />
    </> },
    { ma: "san-pham", ten: "Sản phẩm", noiDung: <BangXepHangDep {...g} tieuDe="Sản phẩm bán chạy nhất" Icon={Package} href={bc("dich-vu")} nhanHref="Báo cáo" trong={`Chưa bán sản phẩm nào ${nhan}.`} dong={dong(x.sanPham, "cái")} /> },
    ...(xemTien ? [{ ma: "khach", ten: "Khách hàng", noiDung: <BangXepHangDep {...g} tieuDe="Khách chi tiêu nhiều nhất" Icon={Users} href={bc("khach-hang")} nhanHref="Báo cáo" trong={`Chưa có khách chi tiêu ${nhan}.`} dong={dong(x.khach, "đơn")} /> }] : []),
  ];
  return (<>
    {/* overflow-x-clip: ô chi tiết ẩn của từng dòng (NoiChiTiet) không được đẩy trang cuộn ngang trên điện thoại 390px. */}
    <section id="xep-hang" aria-label="Bảng xếp hạng" className="scroll-mt-24 space-y-3 overflow-x-clip">
      {tieuDe}
      <TabXepHang muc={nhom} />
    </section>
  </>);
}

import Link from "next/link";
import { sb } from "@/lib/db";
import { gioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { khoangHoaDonNgay, layHoaDonTrongNgay, tongHoaDonNgay, TOI_DA_NGAY_HD, type DongHoaDonNgay, type LoaiHoaDonNgay } from "@/lib/bao-cao-hoa-don-ngay";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const NHOM: { ma: LoaiHoaDonNgay; ten: string }[] = [{ ma: "dich_vu", ten: "Hoá đơn dịch vụ" }, { ma: "ban", ten: "Hoá đơn bán hàng" }];

/** Báo cáo › Hoá đơn trong ngày: hai nhóm Hoá đơn dịch vụ / Hoá đơn bán hàng, mỗi dòng một hoá đơn, tổng cuối bảng. Chỉ đọc. */
export async function BaoCaoHoaDonNgay({ tu: tu0, den, cn, loai, coChiNhanh, goc }: { tu: string; den: string; cn?: string; loai?: string; coChiNhanh: boolean; /** Đường dẫn tab kèm bộ lọc ngày / chi nhánh (chưa có &loai). */ goc: string }) {
  const { tu, quaDai } = khoangHoaDonNgay(tu0, den);
  const tatCa = await layHoaDonTrongNgay(sb(), tu, den, cn);
  const dang: LoaiHoaDonNgay = loai === "ban" ? "ban" : "dich_vu";
  const ds = tatCa.filter((r) => r.loai === dang);
  const t = tongHoaDonNgay(ds);
  const motNgay = tu === den;
  return (
    <>
      {quaDai && <p role="status" className="mb-3 text-[12px] text-muc-3">Báo cáo này xem tối đa {TOI_DA_NGAY_HD} ngày nên chỉ tính từ {ngayVN(tu)} đến {ngayVN(den)}.</p>}
      <nav aria-label="Loại hoá đơn" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {NHOM.map((n) => {
          const so = tatCa.filter((r) => r.loai === n.ma).length;
          return <Link key={n.ma} href={`${goc}&loai=${n.ma === "ban" ? "ban" : "dv"}`} scroll={false} aria-current={dang === n.ma ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-nho px-3 py-1.5 text-[13px] ${dang === n.ma ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{n.ten}<span className="tabular-nums opacity-80">{soVN(so)}</span></Link>;
        })}
      </nav>
      <Bang noi duLieu={ds} khoa={(r) => r.id} trong={motNgay ? "Chưa có hoá đơn nào trong ngày này." : "Chưa có hoá đơn nào trong khoảng này."}
        cot={[
          { nhan: "Giờ", hienThi: (r: DongHoaDonNgay) => <span className="block tabular-nums">{gioVN(r.taoLuc)}{!motNgay && <span className="block text-[12px] text-muc-3">{ngayVN(r.ngay)}</span>}</span> },
          { nhan: "Mã HĐ", hienThi: (r) => <span className="block"><Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link>{r.maSh && <span className="block text-[12px] text-muc-3">SH {r.maSh}</span>}{r.trangThai === "nhap" && <span className="mt-1 block"><NhanTrangThai kieu="cho">Đang xử lý</NhanTrangThai></span>}</span> },
          { nhan: "Khách hàng", chinh: true, hienThi: (r) => <span className="block">{r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : <span className="text-muc">{r.khach}</span>}{r.maKhach && <span className="block text-[12px] text-muc-3">{r.maKhach}</span>}</span> },
          { nhan: dang === "dich_vu" ? "Dịch vụ" : "Sản phẩm, thẻ, dịch vụ", hienThi: (r) => <span className="block max-w-[320px] whitespace-normal break-words">{r.hang || "—"}</span> },
          { nhan: "Tổng tiền", hienThi: (r) => tienVN(r.phaiThu), phai: true },
          { nhan: "Đã thu", hienThi: (r) => <span className="block">{tienVN(r.daThu)}{r.conNo > 0 && <span className="block text-[12px] text-canh-bao">Nợ {tienVN(r.conNo)}</span>}</span>, phai: true },
          { nhan: "Người lập", hienThi: (r) => r.nguoiLap || "—" },
        ]} />
      {ds.length > 0 && (
        <div role="status" className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-nho border border-vien bg-giay-tram/60 px-4 py-3 text-[14px] text-muc-2">
          <span className="font-medium text-muc">Tổng {soVN(t.soDon)} hoá đơn hoàn thành</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 tabular-nums">
            <span>Tổng tiền: <b className="text-muc">{tienVN(t.phaiThu)}</b></span>
            <span>Đã thu: <b className="text-muc">{tienVN(t.daThu)}</b></span>
            {t.conNo > 0 && <span>Còn nợ: <b className="text-canh-bao">{tienVN(t.conNo)}</b></span>}
          </span>
          {t.soDangXuLy > 0 && <span className="w-full text-[12px] text-muc-3">Chưa cộng {soVN(t.soDangXuLy)} hoá đơn đang xử lý (chưa chốt).</span>}
        </div>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">
        Mỗi dòng là một hoá đơn lập trong {motNgay ? "ngày" : "khoảng ngày"} đã chọn{coChiNhanh ? " (mọi chi nhánh)" : ""}, sắp theo giờ tạo; không gồm hoá đơn đã huỷ và công nợ đầu kỳ.
        Hoá đơn dịch vụ: mọi dòng là dịch vụ (gồm dịch vụ trả tiền và dòng dùng thẻ nhập từ SalonHero). Hoá đơn bán hàng: có dòng sản phẩm, thẻ hoặc liệu trình, kể cả đơn có lẫn dịch vụ.
        Lượt khách chỉ dùng buổi thẻ ở màn Khách chờ làm không tạo hoá đơn nên không có ở đây (xem <Link href="/the/cho-lam" className="text-nhan-dam hover:underline">Khách chờ làm</Link> hoặc tab Dùng dịch vụ).
        Tổng cuối bảng chỉ cộng hoá đơn hoàn thành. Xuất Excel có hai trang tính: dịch vụ và bán hàng.
      </p>
    </>
  );
}

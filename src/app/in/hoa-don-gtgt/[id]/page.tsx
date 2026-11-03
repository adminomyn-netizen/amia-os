import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { layDuLieuGtgt } from "@/lib/hoa-don-gtgt-may-chu";
import { MauHoaDonGtgt } from "@/components/hoa-don/MauHoaDonGtgt";
import { NutIn } from "@/components/hoa-don/NutIn";
import { TuIn } from "@/components/hoa-don/KhungXemPdf";

/** In / lưu PDF mẫu hoá đơn GTGT (khổ A4). Đã xuất thì in đúng ảnh chụp lúc xuất; chưa xuất thì in bản nháp có ghi rõ "chưa cấp số".
 *  Lưu PDF = bấm In rồi chọn "Lưu thành PDF" của trình duyệt (như SalonHero mở PDF trong tab mới). */
export default async function InHoaDonGtgt({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ in?: string }> }) {
  const nd = await yeuCauQuyen("hd.vat");
  const { id } = await params;
  const tuIn = (await searchParams).in === "1";
  const d = await layDuLieuGtgt(nd, id);
  if (!d) notFound();
  const x = d.dangXuat;
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <title>{x ? `HoaDonGTGT_${x.mau_so}${x.ky_hieu}_${String(x.so).padStart(8, "0")}` : `HoaDonGTGT_nhap_${d.hd.ma}`}</title>
      <style>{"@media print{@page{size:A4;margin:12mm}}"}</style>
      <TuIn bat={tuIn} />
      <div className="khong-in mx-auto mb-4 flex max-w-[820px] items-center justify-between gap-3 px-6 pt-8 text-[13px] text-muc-3">
        <span>Bấm In rồi chọn &quot;Lưu thành PDF&quot; để tải tệp PDF.</span><NutIn />
      </div>
      <div className="px-4 pb-10">
        {x ? <MauHoaDonGtgt mauSo={x.mau_so} kyHieu={x.ky_hieu} so={x.so} ngayLap={x.ngay_lap} ban={x.nguoi_ban} nd={x.noi_dung} trangThai="da_xuat" />
          : <MauHoaDonGtgt mauSo={d.nguoiBanCd?.mau_so ?? "1"} kyHieu={d.nguoiBanCd?.ky_hieu ?? ""} so={null} ngayLap={d.homNay} ban={d.nguoiBan} nd={d.noiDung} trangThai="nhap" />}
      </div>
    </main>
  );
}

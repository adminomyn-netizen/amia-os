import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { InNgay } from "@/components/khach/InNgay";

/** Trang in mã khách (QR + mã + tên). Mã QR chỉ chứa MÃ KHÁCH, không chứa số điện thoại hay thông tin khác. Nằm ngoài /khach-hang để không dính khung hai cột. */
export default async function TrangInMaKhach({ params }: { params: Promise<{ id: string }> }) {
  await yeuCauQuyen("khach.xem");
  const { id } = await params;
  const { data: k } = await sb().from("khach_hang").select("ma, ho_ten").eq("id", id).maybeSingle();
  if (!k) notFound();
  const qr = await QRCode.toString(k.ma, { type: "svg", margin: 1, width: 220 });
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-8 text-center">
      <div className="khong-in flex w-full justify-end"><InNgay /></div>
      <div aria-label={`Mã QR của khách ${k.ma}`} role="img" className="h-[220px] w-[220px]" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="text-[20px] font-bold uppercase tracking-wide text-muc">{k.ma}</p>
      <p className="text-[14px] uppercase text-muc-2">{k.ho_ten}</p>
    </div>
  );
}

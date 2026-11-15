import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BanInHoaDon, KHO_CUON } from "@/components/cai-dat/BanInHoaDon";
import { dungToInHoaDon } from "@/lib/in-hoa-don-may-chu";

/** Phiếu in hoá đơn: nằm ngoài khung ứng dụng để in sạch. Khổ giấy, dòng hiện/ẩn, bản sao, nội dung cuối tờ và mã QR lấy từ Cài đặt › Thiết lập in của chi nhánh.
 *  Nội dung theo bản in SalonHero (chị Lâm 10/11/2026): dựng ở dungToInHoaDon, dùng chung với in nhiều hoá đơn. */
export default async function InHoaDon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nn?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  // ?nn=en: bản in tiếng Anh (Thu ngân "In hoá đơn sau khi hoàn thành" chọn Việt / Anh như SalonHero).
  // Không có ?nn thì theo ô "Ngôn ngữ" của Cài đặt › Thiết lập in (như SalonHero).
  const nnUrl = (await searchParams).nn;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ cfg, d }] = await dungToInHoaDon(db, [h], nnUrl === "en" || nnUrl === "vi" ? nnUrl : undefined);
  const giay = cfg.khoGiay;
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "12mm"}}.ban-in+.ban-in{break-before:page}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Khổ giấy {giay}{cfg.banSao > 0 ? ` · in ${cfg.banSao + 1} bản` : ""} (đổi ở Cài đặt › Thiết lập in)</p>
        {d && <NutIn kho={giay} />}
      </div>
      {!d ? <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Thiết lập in đang chỉ cho in hoá đơn đã hoàn thành. Hoá đơn này chưa hoàn thành nên chưa in được.</p>
        : Array.from({ length: 1 + cfg.banSao }, (_, i) => <div key={i} className="ban-in"><BanInHoaDon cfg={cfg} d={d} /></div>)}
    </main>
  );
}

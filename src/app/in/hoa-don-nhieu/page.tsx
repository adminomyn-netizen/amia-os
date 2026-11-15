import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { docIds } from "@/lib/loc-hoa-don";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BanInHoaDon, KHO_CUON, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { dungToInHoaDon } from "@/lib/in-hoa-don-may-chu";

/** In NHIỀU hoá đơn một lần (ô chọn nhiều ở danh sách hoá đơn, như SalonHero). Mỗi hoá đơn một tờ, cùng mẫu với /in/hoa-don/[id]
 *  (khổ giấy, dòng hiện/ẩn, bản sao, QR theo Thiết lập in của chi nhánh từng đơn). Người gắn chi nhánh chỉ in được đơn chi nhánh mình. */
export default async function InNhieuHoaDon({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const ids = docIds((await searchParams).ids);
  const db = sb();
  let qh = db.from("hoa_don").select("*").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (nd.chiNhanhId) qh = qh.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data: hds } = await qh.order("ngay_hd").order("tao_luc");
  const ds = hds ?? [];
  const to = await dungToInHoaDon(db, ds);
  const coIn = to.filter((x) => x.d);
  const boQua = to.length - coIn.length;
  const giay = coIn[0]?.cfg.khoGiay ?? "A5";
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "8mm 8mm 8mm 14mm"}}.ban-in+.ban-in{break-before:page}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">{coIn.length} hoá đơn · khổ giấy {giay}{boQua > 0 ? ` · bỏ qua ${boQua} đơn chưa hoàn thành (Thiết lập in chỉ cho in đơn hoàn thành)` : ""}{ids.length > ds.length ? ` · ${ids.length - ds.length} đơn không xem được` : ""}</p>
        {coIn.length > 0 && <NutIn kho={giay} />}
      </div>
      {coIn.length === 0 ? <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Chưa có hoá đơn nào để in. Quay lại danh sách hoá đơn và chọn đơn cần in.</p>
        : coIn.flatMap((x) => Array.from({ length: 1 + x.cfg.banSao }, (_, i) => <div key={`${x.id}-${i}`} className="ban-in"><BanInHoaDon cfg={x.cfg} d={x.d as DuLieuIn} /></div>))}
    </main>
  );
}

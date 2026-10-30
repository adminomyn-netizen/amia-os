"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gat } from "@/components/ui/Gat";
import { NUT_CHINH } from "@/components/ui/dinh-dang";

export function QuyTacKhoForm({ dau, sua, luu }: { dau: boolean; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [chan, setChan] = useState(dau);
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false);
  const [dang, batDau] = useTransition();
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("chan_het_ton", chan ? "1" : "0");
    batDau(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); } });
  };
  return (
    <section className="the-noi the-noi-thap max-w-2xl space-y-4 p-4 sm:p-5" aria-labelledby="qtk-ton">
      <h2 id="qtk-ton" className="text-[16px] font-semibold text-muc">Bán hàng khi hết tồn</h2>
      {sua ? <Gat nhan="Chặn bán khi vượt số tồn trong kho" giaTriMacDinh={chan} onDoi={(v) => { setChan(v); setOk(false); }} /> : <p className="text-[14px] text-muc-2">{dau ? "Đang chặn bán khi vượt số tồn." : "Đang cho bán dù hết tồn (chỉ chặn hàng đã hết hạn)."}</p>}
      <p className="text-[12.5px] leading-snug text-muc-3">Tắt: chỉ chặn hàng đã hết hạn dùng. Bật: đơn có hàng vượt tồn của chi nhánh sẽ không chốt được. Chỉ bật khi kho đã nhập đủ tồn đầu, không thì chặn nhầm cả đơn đúng.</p>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {ok && <p role="status" className="text-[14px] text-nhan-dam">Đã lưu.</p>}
      {sua && <button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : "Lưu"}</button>}
      <h2 className="pt-3 text-[16px] font-semibold text-muc">Đã chạy sẵn, không cần cài</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-muc-2">
        <li>Hàng đã hết hạn dùng luôn bị chặn khi bán.</li>
        <li>Nhập kho sản phẩm có cờ bắt buộc hạn dùng thì phải ghi hạn (cờ này đặt ở Danh mục, từng sản phẩm).</li>
        <li>Hàng còn quá ít ngày hạn chỉ nhập khi có ngoại lệ kèm lý do.</li>
        <li>Cấp phiếu vật tư không đủ tồn thì luôn bị chặn.</li>
      </ul>
    </section>
  );
}

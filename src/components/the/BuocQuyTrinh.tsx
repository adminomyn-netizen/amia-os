"use client";

import { useOptimistic, useState, useTransition } from "react";
import { tichBuoc } from "@/app/(app)/the/cho-lam/actions";
import type { QuyTrinhKhach } from "@/lib/buoi-cho-lam";

/** Danh sách bước quy trình hôm nay của một khách (gộp mọi dịch vụ đang làm): làm bước nào tích bước đó (0322).
 *  Ô tích to, dễ bấm trên điện thoại. Vật tư mỗi bước chỉ là gợi ý từ quy trình, phiếu vật tư thật vẫn ra khi Kết thúc. */
export function BuocQuyTrinh({ khachId, qt, thaoTac }: { khachId: string; qt: QuyTrinhKhach; thaoTac: boolean }) {
  const [daTich, datTich] = useOptimistic(new Set(qt.buoc.filter((b) => b.daTich).map((b) => b.id)), (s: Set<string>, [id, co]: [string, boolean]) => {
    const n = new Set(s); if (co) n.add(id); else n.delete(id); return n;
  });
  const [, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const nhieuDv = new Set(qt.buoc.flatMap((b) => b.dichVu)).size > 1;
  const xong = qt.buoc.filter((b) => daTich.has(b.id)).length;
  if (!qt.buoc.length && !qt.dvChuaCo.length) return null;
  return (
    <section aria-label="Quy trình hôm nay" className="mt-3 rounded-nho border border-vien bg-giay-tram/60 px-3 py-2.5">
      <p className="flex items-baseline justify-between gap-2 text-[13.5px] font-semibold text-muc">
        <span>Quy trình hôm nay</span>{qt.buoc.length > 0 && <span className="text-[12.5px] font-normal tabular-nums text-muc-3">đã làm {xong}/{qt.buoc.length} bước</span>}
      </p>
      {qt.buoc.length > 0 && (
        <ol className="mt-1.5 space-y-1">
          {qt.buoc.map((b, i) => {
            const co = daTich.has(b.id);
            return (
              <li key={b.id}>
                <label className={`flex min-h-11 items-start gap-3 rounded-nho px-1.5 py-1.5 ${thaoTac ? "cursor-pointer hover:bg-giay-sang" : ""}`}>
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-nhan)]" checked={co} disabled={!thaoTac}
                    onChange={(e) => { const moi = e.target.checked; setLoi(""); bat(async () => { datTich([b.id, moi]); const fd = new FormData(); fd.set("khach_id", khachId); fd.set("buoc_id", b.id); if (!moi) fd.set("bo", "1"); const r = await tichBuoc(fd); if (r.loi) setLoi(r.loi); }); }} />
                  <span className="min-w-0 text-[13.5px]">
                    <span className={co ? "text-muc-3 line-through" : "text-muc"}>{i + 1}. {b.ten}</span>
                    {nhieuDv && <span className="ml-1 text-[12px] text-muc-3">({b.dichVu.join(", ")})</span>}
                    {b.goiY.length > 0 && <span className="block text-[12px] text-muc-3 [overflow-wrap:anywhere]">Vật tư gợi ý: {b.goiY.join("; ")}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
      )}
      {qt.dvChuaCo.length > 0 && <p className="mt-1.5 text-[12.5px] text-canh-bao">Chưa có quy trình từng bước cho: {qt.dvChuaCo.join(", ")}. Làm theo quy trình giấy, bấm Kết thúc như thường.</p>}
      {loi && <p role="alert" className="mt-1 text-[12.5px] text-loi">{loi}</p>}
    </section>
  );
}

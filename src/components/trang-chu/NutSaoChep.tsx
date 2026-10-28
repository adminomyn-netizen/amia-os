"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { NUT_PHU } from "@/components/ui/dinh-dang";

/** Sao chép văn bản báo cáo sáng; trình duyệt chặn clipboard thì mở sẵn ô văn bản để chọn và chép tay. */
export function NutSaoChep({ van }: { van: string }) {
  const [tt, setTt] = useState<"" | "da" | "tay">("");
  const chep = async () => {
    try { await navigator.clipboard.writeText(van); setTt("da"); setTimeout(() => setTt(""), 2500); } catch { setTt("tay"); }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <button type="button" onClick={chep} className={`${NUT_PHU} flex items-center gap-1.5 !h-9 !px-3 !text-[13px]`}><Copy aria-hidden strokeWidth={1.7} className="h-4 w-4" />{tt === "da" ? "Đã sao chép" : "Sao chép văn bản"}</button>
      {tt === "tay" && <textarea readOnly value={van} rows={4} aria-label="Văn bản báo cáo sáng" onFocus={(e) => e.currentTarget.select()} className="w-[min(32rem,90vw)] rounded-nho border border-vien-dam bg-giay-sang p-2 text-[13px]" />}
    </div>
  );
}

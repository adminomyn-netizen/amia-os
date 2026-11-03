"use client";

import { Printer } from "lucide-react";
import { NUT_CHU } from "@/components/ui/dinh-dang";

const thoat = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Nút "In lịch hẹn": in riêng một phiếu gọn của lịch này (không in cả trang) bằng khung ẩn. `dong` = các cặp nhãn - giá trị đã dựng sẵn ở máy chủ. */
export function NutInLich({ tieuDe, phu, dong }: { tieuDe: string; phu?: string; dong: [string, string][] }) {
  const in_ = () => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    const d = f.contentDocument;
    if (!d) { f.remove(); return; }
    const hang = dong.filter(([, v]) => v).map(([n, v]) => `<tr><th>${thoat(n)}</th><td>${thoat(v)}</td></tr>`).join("");
    d.open();
    d.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${thoat(tieuDe)}</title><style>
      body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:24px}
      h1{font-size:18px;margin:0 0 2px}p{margin:0 0 14px;color:#555}
      table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:7px 8px;text-align:left;vertical-align:top}
      th{width:34%;font-weight:600;color:#444}
    </style></head><body><h1>${thoat(tieuDe)}</h1>${phu ? `<p>${thoat(phu)}</p>` : ""}<table>${hang}</table></body></html>`);
    d.close();
    const xong = () => setTimeout(() => f.remove(), 1000);
    f.contentWindow?.addEventListener("afterprint", xong);
    setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); }, 150);
  };
  return <button type="button" onClick={in_} className={`${NUT_CHU} inline-flex items-center gap-1.5`}><Printer className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden />In lịch hẹn</button>;
}

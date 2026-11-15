"use client";

import { Printer } from "lucide-react";
import { NUT_CHU } from "@/components/ui/dinh-dang";

const thoat = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Mẫu in phiếu lịch hẹn theo Cài đặt › Thiết lập in › Lịch hẹn (SalonHero: giấy 80mm, logo, thông tin cửa hàng, câu cuối "Xin cảm ơn quý khách!…"). */
export type MauInLich = { kho: string; logo: boolean; cuaHang: { ten: string; phu: string; diaChi: string; dienThoai: string } | null; cuoi: string };

/** Nút "In lịch hẹn": in riêng một phiếu gọn của lịch này (không in cả trang) bằng khung ẩn. `dong` = các cặp nhãn - giá trị đã dựng sẵn ở máy chủ.
 *  Có `mau` thì in đúng khổ (giấy cuộn 57/58/80mm hoặc A4/A5), logo, thông tin cửa hàng, câu cuối như SalonHero (chị Lâm 15/11/2026). */
export function NutInLich({ tieuDe, phu, dong, mau }: { tieuDe: string; phu?: string; dong: [string, string][]; mau?: MauInLich }) {
  const in_ = () => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    const d = f.contentDocument;
    if (!d) { f.remove(); return; }
    const hang = dong.filter(([, v]) => v).map(([n, v]) => `<tr><th>${thoat(n)}</th><td>${thoat(v)}</td></tr>`).join("");
    d.open();
    const cuon = !!mau && /mm$/.test(mau.kho);
    const trang = !mau ? "" : cuon ? `@page{size:${mau.kho.replace("mm", "")}mm auto;margin:2mm}` : `@page{size:${mau.kho};margin:12mm}`;
    const dau = !mau ? "" : `${mau.logo ? `<div class="c"><img src="${location.origin}/logo-amia.png" alt="" style="height:${cuon ? 44 : 64}px"></div>` : ""}${mau.cuaHang ? `<div class="c ch"><b>${thoat(mau.cuaHang.ten)}</b><br>${thoat(mau.cuaHang.phu)}${mau.cuaHang.diaChi ? `<br>${thoat(mau.cuaHang.diaChi)}` : ""}${mau.cuaHang.dienThoai ? `<br>Điện thoại: ${thoat(mau.cuaHang.dienThoai)}` : ""}</div>` : ""}`;
    const cuoi = mau?.cuoi.trim() ? `<p class="c cuoi">${thoat(mau.cuoi).replace(/\n/g, "<br>")}</p>` : "";
    d.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${thoat(tieuDe)}</title><style>
      ${trang}
      body{font:${cuon ? "12px/1.45" : "14px/1.5"} system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:${mau ? "0" : "24px"}}
      h1{font-size:${cuon ? "15px" : "18px"};margin:8px 0 2px}${cuon ? "h1{text-align:center}" : ""}p{margin:0 0 ${cuon ? 8 : 14}px;color:#555}
      .c{text-align:center}.ch{margin:6px 0 4px;color:#333}.cuoi{margin-top:12px;color:#333}
      table{border-collapse:collapse;width:100%}th,td{border-bottom:1px ${cuon ? "dashed #999" : "solid #ddd"};padding:${cuon ? "4px 2px" : "7px 8px"};text-align:left;vertical-align:top}
      th{width:${cuon ? 38 : 34}%;font-weight:600;color:#444}
    </style></head><body>${dau}<h1>${thoat(tieuDe)}</h1>${phu ? `<p${cuon ? ' class="c"' : ""}>${thoat(phu)}</p>` : ""}<table>${hang}</table>${cuoi}</body></html>`);
    d.close();
    const xong = () => setTimeout(() => f.remove(), 1000);
    f.contentWindow?.addEventListener("afterprint", xong);
    setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); }, mau?.logo ? 450 : 150); // chờ logo tải xong mới in
  };
  return <button type="button" onClick={in_} className={`${NUT_CHU} inline-flex items-center gap-1.5`}><Printer className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden />In lịch hẹn</button>;
}

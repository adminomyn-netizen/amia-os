"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Maximize2, Minus, Plus, Printer } from "lucide-react";

const RONG_A4 = 794; // 210 mm ở 96 dpi
const MUC_ZOOM = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5];

/** Khung xem hoá đơn như trình xem PDF: thanh công cụ (tên tệp, trang, thu/phóng, Vừa khung, Tải PDF, In) trên nền xám, giấy A4 trắng ở giữa.
 *  In và Tải PDF mở trang in A4 riêng (`hrefIn`) rồi tự bật hộp in của trình duyệt; Tải PDF = chọn "Lưu thành PDF" trong hộp đó. */
export function KhungXemPdf({ tenTep, hrefIn, children }: { tenTep: string; hrefIn: string; children: React.ReactNode }) {
  const khung = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [vuaKhung, setVuaKhung] = useState(true);
  const tinhVua = useCallback(() => {
    const w = khung.current?.clientWidth ?? RONG_A4;
    setZoom(Math.max(0.35, Math.min(1, (w - 32) / RONG_A4)));
  }, []);
  useEffect(() => {
    if (!vuaKhung) return;
    tinhVua();
    const ro = new ResizeObserver(tinhVua);
    if (khung.current) ro.observe(khung.current);
    return () => ro.disconnect();
  }, [vuaKhung, tinhVua]);
  const doi = (huong: 1 | -1) => {
    setVuaKhung(false);
    setZoom((z) => {
      const i = MUC_ZOOM.findIndex((m) => m >= z - 0.001);
      const k = huong > 0 ? (MUC_ZOOM[i] > z + 0.001 ? i : i + 1) : (i <= 0 ? 0 : i - 1);
      return MUC_ZOOM[Math.max(0, Math.min(MUC_ZOOM.length - 1, k))];
    });
  };
  const NUT = "flex h-8 items-center gap-1.5 rounded-nho px-2.5 text-[13px] text-menu-chu hover:bg-white/10";
  return (
    <section className="overflow-hidden rounded-the border border-vien">
      <div className="nen-toi flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] text-menu-sang"><FileText strokeWidth={1.6} className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{tenTep}.pdf</span></span>
        <span className="flex items-center gap-1">
          <span className="px-2 text-[12.5px] tabular-nums text-menu-chu-phu">1 / 1</span>
          <button type="button" onClick={() => doi(-1)} aria-label="Thu nhỏ" className={NUT}><Minus strokeWidth={1.8} className="h-4 w-4" /></button>
          <span className="w-12 text-center text-[12.5px] tabular-nums text-menu-chu">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => doi(1)} aria-label="Phóng to" className={NUT}><Plus strokeWidth={1.8} className="h-4 w-4" /></button>
          <button type="button" onClick={() => setVuaKhung(true)} aria-pressed={vuaKhung} title="Vừa khung" className={NUT}><Maximize2 strokeWidth={1.6} className="h-4 w-4" /><span className="max-sm:hidden">Vừa khung</span></button>
        </span>
        <span className="flex items-center gap-1">
          <a href={`${hrefIn}?in=1`} target="_blank" rel="noopener" title="Mở hộp in, chọn Lưu thành PDF" className={NUT}><Download strokeWidth={1.6} className="h-4 w-4" />Tải PDF</a>
          <a href={`${hrefIn}?in=1`} target="_blank" rel="noopener" className={NUT}><Printer strokeWidth={1.6} className="h-4 w-4" />In</a>
        </span>
      </div>
      <div ref={khung} className="overflow-auto bg-giay-tram px-4 py-6" style={{ maxHeight: "80vh" }}>
        <div className="mx-auto bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]" style={{ width: RONG_A4, minHeight: 1123, zoom }}>
          <div className="px-6 py-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Đặt trên trang in: mở với ?in=1 thì tự bật hộp in một lần khi trang đã hiện xong. */
export function TuIn({ bat }: { bat: boolean }) {
  useEffect(() => {
    if (!bat) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [bat]);
  return null;
}

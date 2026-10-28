"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cung, toaDo, type HinhTron, type KhucTron } from "./hinh-cung";

/**
 * Phần tương tác của biểu đồ tròn. Máy tính: rê chuột vào khúc nào hiện khung chi tiết của khúc đó (tên, số, phần trăm).
 * Điện thoại: chạm vào khúc (hoặc dòng chú giải) để hiện, chạm lại hoặc chạm ra ngoài để ẩn. Bàn phím: Tab tới khúc,
 * Enter / Cách để ghim, Esc để ẩn. Các khúc hiển thị tách khỏi các lớp bắt chuột để khúc nhô ra không làm khung nhấp nháy.
 */
export function TronTuongTac({ khuc, hinh, ten, tamChinh, tamPhu, bocCuc, bong, trong }: {
  khuc: KhucTron[]; hinh: HinhTron; ten: string; tamChinh?: string; tamPhu?: string;
  bocCuc: "chuan" | "mong"; bong: boolean; trong?: string;
}) {
  const id = useId();
  const goc = useRef<HTMLDivElement>(null), vung = useRef<HTMLDivElement>(null), khung = useRef<HTMLDivElement>(null);
  const loaiTro = useRef<string>("");
  const [ro, setRo] = useState<number | null>(null);      // chuột đang rê
  const [tieu, setTieu] = useState<number | null>(null);  // bàn phím đang dừng
  const [ghim, setGhim] = useState<number | null>(null);  // chạm / Enter để giữ
  const dang = ro ?? ghim ?? tieu;
  const { vb, r, rTrong } = hinh, tam = vb / 2;
  const mot = khuc.length === 1;

  // Chạm ra ngoài biểu đồ thì ẩn khung đang ghim.
  useEffect(() => {
    if (ghim == null) return;
    const ra = (e: PointerEvent) => { if (!goc.current?.contains(e.target as Node)) setGhim(null); };
    document.addEventListener("pointerdown", ra);
    return () => document.removeEventListener("pointerdown", ra);
  }, [ghim]);

  // Đặt khung chi tiết cạnh khúc đang chọn, kẹp trong khung chứa và trong hình biểu đồ để không đè chú giải.
  useLayoutEffect(() => {
    const k = dang != null ? khuc[dang] : null, ox = goc.current, v = vung.current, f = khung.current;
    if (!k || !ox || !v || !f) return;
    const c = ox.getBoundingClientRect(), vr = v.getBoundingClientRect(), pw = f.offsetWidth, ph = f.offsetHeight;
    const gm = mot ? 0 : (k.a0 + k.a1) / 2, rm = rTrong > 0 ? (r + rTrong) / 2 : r * 0.6, ti = vr.width / vb;
    const [, y] = toaDo(tam, gm, mot ? 0 : rm), lech = mot ? 0 : hinh.lech;
    const cy = vr.top - c.top + (y - Math.cos(gm) * lech) * ti;
    // Khung nằm ở nửa hình đối diện với khúc đang chọn để không che chính khúc đó; theo chiều ngang căn giữa hình, kẹp trong khung chứa.
    const giua = vr.left - c.left + vr.width / 2, tren = vr.top - c.top, duoi = tren + vr.height;
    const left = Math.max(0, Math.min(giua - pw / 2, c.width - pw));
    const top = cy > tren + vr.height / 2 ? tren + 6 : Math.max(tren + 6, duoi - ph - 6);
    f.style.left = `${left}px`; f.style.top = `${top}px`; f.style.visibility = "visible";
  }, [dang, khuc, hinh, mot, r, rTrong, tam, vb]);

  const bam = (i: number) => setGhim((g) => (g === i ? null : i));
  const choTro = (i: number) => ({
    onPointerEnter: (e: React.PointerEvent) => { if (e.pointerType !== "touch") setRo(i); },
    onPointerLeave: (e: React.PointerEvent) => { if (e.pointerType !== "touch") setRo((x) => (x === i ? null : x)); },
    onPointerDown: (e: React.PointerEvent) => { loaiTro.current = e.pointerType; },
    // Chuột đã có rê chuột nên bấm không ghim; chạm (cảm ứng) và Enter trên chú giải thì bật/tắt.
    onClick: () => { if (loaiTro.current !== "mouse") bam(i); loaiTro.current = ""; },
  });
  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setGhim(null); setTieu(null); setRo(null); }
  };
  const lat = khuc.map((k, i) => {
    const gm = (k.a0 + k.a1) / 2, ra = dang === i;
    return { ...k, i, ra, mo: dang != null && !ra, dx: mot ? 0 : Math.sin(gm) * hinh.lech, dy: mot ? 0 : -Math.cos(gm) * hinh.lech };
  });
  const dayDu = hinh.vien > 0 ? "var(--giay-sang)" : "none";
  const rGiua = rTrong > 0 ? (r + rTrong) / 2 : r / 2, beDay = rTrong > 0 ? r - rTrong : r;
  const kd = dang != null ? khuc[dang] : null;
  const chuGiai = (kd && `${kd.nhan}: ${kd.tien}, ${kd.pt}`) || "";

  return (
    <div ref={goc} onKeyDown={phim} className={`relative flex flex-wrap items-center ${bocCuc === "mong" ? "justify-center gap-4" : "gap-x-8 gap-y-4"}`}>
      <div ref={vung} className="shrink-0">
        <svg viewBox={`0 0 ${vb} ${vb}`} role="group" aria-label={ten} style={{ touchAction: "manipulation", width: hinh.px, height: hinh.px }} className={`block max-w-full overflow-visible [-webkit-tap-highlight-color:transparent] ${bong ? "drop-shadow-[0_8px_10px_rgba(10,43,38,0.18)]" : ""}`}>
          {(khuc.length === 0 || bocCuc === "mong") && <circle cx={tam} cy={tam} r={rGiua} fill="none" stroke="var(--giay-tram)" strokeWidth={beDay} aria-hidden />}
          {/* Lớp hiển thị: không bắt chuột, nhô ra và mờ bớt các khúc còn lại. */}
          <g aria-hidden>
            {lat.map((l) => {
              const kieu = { transform: l.ra ? `translate(${l.dx}px, ${l.dy}px)` : "none", opacity: l.mo ? 0.4 : 1, transition: "transform 150ms ease-out, opacity 150ms ease-out" };
              return mot
                ? <circle key={l.nhan} cx={tam} cy={tam} r={rGiua} fill="none" stroke={l.mau} strokeWidth={beDay} style={{ ...kieu, pointerEvents: "none" }} className="motion-reduce:transition-none" />
                : <path key={l.nhan} d={cung(tam, l.a0, l.a1, r, rTrong)} fill={l.mau} stroke={dayDu} strokeWidth={hinh.vien} strokeLinejoin="round" style={{ ...kieu, pointerEvents: "none" }} className="motion-reduce:transition-none" />;
            })}
          </g>
          {/* Lớp bắt chuột / chạm / bàn phím: đứng yên đúng chỗ khúc gốc. */}
          {lat.map((l) => {
            const chung = {
              tabIndex: 0, role: "button" as const, "aria-label": l.doc, "aria-pressed": ghim === l.i, "aria-describedby": dang === l.i ? `${id}-ct` : undefined,
              onFocus: () => setTieu(l.i), onBlur: () => setTieu((x) => (x === l.i ? null : x)),
              onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bam(l.i); } },
              ...choTro(l.i),
              fill: "transparent", stroke: "none", className: "cursor-pointer outline-none focus-visible:[stroke:var(--muc)] focus-visible:[stroke-width:2.5]",
            };
            return mot
              ? <circle key={l.nhan} cx={tam} cy={tam} r={rGiua} {...chung} fill="none" stroke="transparent" strokeWidth={beDay} className="cursor-pointer outline-none focus-visible:[stroke:var(--muc)] focus-visible:[stroke-opacity:0.3]" />
              : <path key={l.nhan} d={cung(tam, l.a0, l.a1, r, rTrong)} strokeLinejoin="round" {...chung} />;
          })}
          {tamChinh != null && (
            <g textAnchor="middle" pointerEvents="none">
              <text x={tam} y={hinh.yTam} fontSize={hinh.coTam} fontWeight="600" fill="var(--muc)">{tamChinh}</text>
              {tamPhu && <text x={tam} y={hinh.yPhu} fontSize={hinh.coPhu} fill="var(--muc-3)">{tamPhu}</text>}
            </g>
          )}
        </svg>
      </div>

      {khuc.length === 0 ? (
        trong ? <p className="min-w-[140px] flex-1 text-[13px] text-muc-3">{trong}</p> : null
      ) : (
        <ul className={`min-w-0 flex-1 text-[13px] ${bocCuc === "mong" ? "min-w-[200px] space-y-0.5" : "min-w-[180px] space-y-0.5"}`}>
          {lat.map((l) => (
            <li key={l.nhan} {...choTro(l.i)} className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-nho px-1.5 py-1 transition-colors motion-reduce:transition-none ${l.ra ? "bg-giay-tram" : ""}`}>
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: l.mau }} />
              <span className="min-w-0 flex-1 truncate text-muc-2" title={l.nhan}>{l.nhan}</span>
              <span className="tabular-nums text-muc">{l.gon}</span>
              <span className="w-12 text-right tabular-nums text-muc-2">{l.pt}</span>
            </li>
          ))}
        </ul>
      )}

      {kd && (
        <div ref={khung} id={`${id}-ct`} role="tooltip" style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", maxWidth: "100%" }} className="pointer-events-none z-30 w-max">
          <div className="the-noi the-noi-thap px-3 py-2 text-left">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muc"><span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: kd.mau }} /><span className="break-words">{kd.nhan}</span></p>
            <p className="mt-0.5 text-[13px] tabular-nums text-muc"><span className="whitespace-nowrap"><span className="font-semibold">{kd.tien}</span><span className="text-muc-2"> · {kd.pt}</span></span></p>
          </div>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{chuGiai}</span>
    </div>
  );
}

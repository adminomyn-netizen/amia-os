"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

/** Thông tin có sẵn trên thẻ lưới: hiện ngay khi bấm, trong lúc máy chủ dựng phần chi tiết đầy đủ. */
type Tom = { ten: string; gio: string; trangThai: string; mau: string };
type Chon = { id: string; tom: Tom | null };
const HEP = "(max-width: 639.98px)";
const theoDoiHep = (bao: () => void) => { const m = window.matchMedia(HEP); m.addEventListener("change", bao); return () => m.removeEventListener("change", bao); };
const Ctx = createContext<((id: string, href: string, tom: Tom) => void) | null>(null);

/** Bấm thẻ lịch trên lưới → mở khung chi tiết NGAY cạnh thẻ (máy tính) hoặc tấm trượt từ đáy (điện thoại), chị Lâm 10/11/2026.
 *  Phần chi tiết + nút thao tác do máy chủ dựng cho lịch `lichId` (tham số `lich` trên địa chỉ); trong lúc chờ, khung hiện tên, giờ, trạng thái có sẵn trên thẻ. */
export function KhungChiTietLich({ lichId, chiTiet, children }: { lichId: string; chiTiet: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter();
  const [chon, setChon] = useState<Chon | null>(lichId ? { id: lichId, tom: null } : null);
  const [dang, bat] = useTransition();
  const hep = useSyncExternalStore(theoDoiHep, () => window.matchMedia(HEP).matches, () => false);
  const khungRef = useRef<HTMLDivElement>(null);
  const goc = useRef<HTMLDivElement>(null);

  const mo = useCallback((id: string, href: string, tom: Tom) => {
    setChon({ id, tom });
    const u = new URL(href, window.location.origin);
    u.searchParams.set("lich", id);
    bat(() => router.replace(`${u.pathname}?${u.searchParams}`, { scroll: false }));
  }, [router]);
  const dong = useCallback(() => {
    setChon(null);
    const u = new URL(window.location.href);
    if (u.searchParams.has("lich")) { u.searchParams.delete("lich"); window.history.replaceState(null, "", `${u.pathname}?${u.searchParams}`); }
  }, []);

  // Vị trí khung: cạnh phải thẻ (không đủ chỗ thì bên trái), kẹp trong màn hình; theo thẻ khi cuộn trang hoặc cuộn ngang lưới. Dưới 640px là tấm trượt đáy.
  // Ghi thẳng vào style của khung (không qua state) để cuộn không làm dựng lại cây.
  const datViTri = useCallback(() => {
    const k = khungRef.current;
    if (!chon || !k || window.matchMedia(HEP).matches) return;
    const the = goc.current?.querySelector<HTMLElement>(`[data-lich-id="${chon.id}"]`);
    const r = the?.getBoundingClientRect();
    const rong = 400, cao = k.offsetHeight || 420;
    let left = r ? r.right + 8 : window.innerWidth - rong - 24, top = r ? r.top - 8 : 80;
    if (r && left + rong > window.innerWidth - 12) left = r.left - rong - 8;
    if (left < 12) left = Math.max(12, Math.min(window.innerWidth - rong - 12, r?.left ?? 12));
    top = Math.max(12, Math.min(top, window.innerHeight - cao - 12));
    k.style.top = `${top}px`; k.style.left = `${left}px`; k.style.visibility = "visible";
  }, [chon]);
  useLayoutEffect(() => { datViTri(); }, [datViTri, dang, chiTiet, hep]);
  useEffect(() => {
    if (!chon) return;
    window.addEventListener("resize", datViTri);
    window.addEventListener("scroll", datViTri, true);
    const bam = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector('[role="dialog"][aria-modal="true"]')) dong(); };
    const ngoai = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (khungRef.current?.contains(t) || t.closest?.("[data-lich-id]") || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      dong();
    };
    document.addEventListener("keydown", bam);
    document.addEventListener("pointerdown", ngoai);
    return () => { window.removeEventListener("resize", datViTri); window.removeEventListener("scroll", datViTri, true); document.removeEventListener("keydown", bam); document.removeEventListener("pointerdown", ngoai); };
  }, [chon, datViTri, dong]);

  const daCo = !!chon && !dang && lichId === chon.id && !!chiTiet;
  return (
    <Ctx.Provider value={mo}>
      <div ref={goc} className="contents">{children}</div>
      {chon && typeof document !== "undefined" && createPortal(
        <>
          {hep && <button type="button" aria-label="Đóng chi tiết lịch hẹn" tabIndex={-1} className="fixed inset-0 z-[69] bg-muc/35" onClick={dong} />}
          <div ref={khungRef} role="dialog" aria-label="Chi tiết lịch hẹn"
            className={hep
              ? "fixed inset-x-0 bottom-0 z-[70] max-h-[86dvh] overflow-y-auto rounded-t-hop border-t border-vien bg-giay-sang pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_rgba(5,40,36,0.22)]"
              : "fixed z-[70] max-h-[calc(100dvh-24px)] w-[400px] overflow-y-auto rounded-hop border border-vien bg-giay-sang shadow-[0_18px_44px_rgba(5,40,36,0.24)]"}
            style={hep ? undefined : { visibility: "hidden" }}>
            {hep && <div className="mx-auto mt-2 h-1.5 w-10 rounded-nho bg-vien-dam" aria-hidden />}
            <button type="button" onClick={dong} aria-label="Đóng" className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-nho text-muc-3 hover:bg-giay-tram hover:text-muc"><X className="h-5 w-5" aria-hidden /></button>
            {daCo ? chiTiet : (
              <div className="p-4 pr-12" aria-busy="true">
                {chon.tom && <>
                  <span className={`inline-block rounded-tag px-2 py-0.5 text-[12px] font-semibold ${chon.tom.mau}`}>{chon.tom.trangThai}</span>
                  <p className="mt-2 text-[17px] font-semibold uppercase text-muc">{chon.tom.ten}</p>
                  <p className="text-[14px] tabular-nums text-muc-2">{chon.tom.gio}</p>
                </>}
                <div className="mt-4 space-y-2" aria-hidden>{[70, 90, 60, 80].map((w) => <div key={w} className="h-3.5 animate-pulse rounded-nho bg-giay-tram" style={{ width: `${w}%` }} />)}</div>
                <p className="mt-3 text-[13px] text-muc-3">Đang mở chi tiết…</p>
              </div>
            )}
          </div>
        </>,
        // Gắn thẳng vào body (16/11): trong khung app, thanh tab dưới (z-40) đè lên đáy khung trên điện thoại, che nút Xác nhận / Huỷ.
        document.body,
      )}
    </Ctx.Provider>
  );
}

/** Thẻ lịch trên lưới: vẫn là liên kết (mở tab mới được), bấm thường thì mở khung chi tiết tại chỗ. */
export function TheLich({ id, href, tom, title, className, children }: { id: string; href: string; tom: Tom; title: string; className: string; children: React.ReactNode }) {
  const mo = useContext(Ctx);
  return (
    <a href={href} data-lich-id={id} title={title} className={className} aria-haspopup="dialog"
      onClick={(e) => { if (!mo || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); mo(id, href, tom); }}>
      {children}
    </a>
  );
}

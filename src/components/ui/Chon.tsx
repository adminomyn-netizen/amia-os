"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNoi } from "./noi";
import { Check, ChevronDown } from "lucide-react";

export type LuaChon = { gia_tri: string; nhan: string; nhom?: string };

const boDau = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
const chuDau = (t: string) => (t.trim().split(/\s+/).pop() ?? "?").charAt(0).toUpperCase();
/** Danh sách dài (>7 mục) tự có ô gõ tìm; mục có `nhom` được gom theo nhóm, hiện chữ cái đầu và dòng thấp (kiểu chọn nhân viên của SalonHero). */
const NGUONG_TIM = 7;

const BONG = "shadow-[0_14px_32px_rgba(5,40,36,0.18)]";

/** Ô chọn (dropdown) theo bộ nhận diện, thay cho <select> mặc định của trình duyệt.
 * - Dùng trong biểu mẫu: có <input hidden name=…> nên FormData lấy được giá trị; `batBuoc` vẫn báo lỗi bằng hộp thoại của trình duyệt.
 * - Điều khiển bằng bàn phím: mũi tên, Enter/Space, Esc, gõ chữ cái đầu để nhảy tới mục.
 * - Tự mở lên trên nếu bên dưới không đủ chỗ. */
export function Chon({
  ten,
  luaChon,
  giaTri,
  giaTriMacDinh = "",
  onDoi,
  trong = "Chọn",
  batBuoc,
  voHieu,
  nho,
  id,
  ariaLabel,
  className = "",
}: {
  ten?: string;
  luaChon: LuaChon[];
  giaTri?: string;
  giaTriMacDinh?: string;
  onDoi?: (giaTri: string) => void;
  trong?: string;
  batBuoc?: boolean;
  voHieu?: boolean;
  nho?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [noiBo, setNoiBo] = useState(giaTriMacDinh);
  const gia = giaTri ?? noiBo;
  const [mo, setMo] = useState(false);
  const [dangTro, setDangTro] = useState(0);
  const goc = useRef<HTMLDivElement>(null);
  const kiemTra = useRef<HTMLInputElement>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const dsRef = useRef<HTMLUListElement>(null);
  const idDs = useId();
  const chon = luaChon.find((l) => l.gia_tri === gia);
  const [q, setQ] = useState("");
  const coTim = luaChon.length > NGUONG_TIM;
  const coNhom = luaChon.some((l) => l.nhom);
  const ds = q ? luaChon.filter((l) => l.gia_tri === "" || boDau(l.nhan).includes(boDau(q))) : luaChon;
  const timRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      const dich = e.target as Node;
      if (goc.current && !goc.current.contains(dich) && !dsRef.current?.contains(dich)) setMo(false);
    };
    document.addEventListener("mousedown", ngoai);
    if (coTim) setTimeout(() => timRef.current?.focus(), 0);
    return () => document.removeEventListener("mousedown", ngoai);
  }, [mo, coTim]);

  const moDs = () => {
    if (voHieu) return;
    setQ("");
    setDangTro(Math.max(0, luaChon.findIndex((l) => l.gia_tri === gia)));
    setMo(true);
  };

  const dat = (v: string) => {
    if (giaTri === undefined) setNoiBo(v);
    kiemTra.current?.setCustomValidity("");
    onDoi?.(v);
    setMo(false);
  };

  useNoi(mo, nutRef, dsRef, { caoUoc: Math.min(coTim ? 340 : 256, ds.length * (coNhom ? 34 : 42) + 14 + (coTim ? 48 : 0) + (coNhom ? 80 : 0)) });

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && mo) {
      e.stopPropagation();
      setMo(false);
      return;
    }
    if (!mo) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        moDs();
      }
      return;
    }
    const dangGo = (e.target as HTMLElement).tagName === "INPUT";
    if (dangGo && (e.key === " " || (e.key.length === 1 && e.key !== "Enter"))) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDangTro((i) => Math.min(ds.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDangTro((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (ds[dangTro]) dat(ds[dangTro].gia_tri);
    } else if (e.key.length === 1) {
      const tim = ds.findIndex((l, i) => i > dangTro && l.nhan.toLowerCase().startsWith(e.key.toLowerCase()));
      const dau = tim >= 0 ? tim : ds.findIndex((l) => l.nhan.toLowerCase().startsWith(e.key.toLowerCase()));
      if (dau >= 0) setDangTro(dau);
    }
  };

  return (
    <div ref={goc} className={`relative ${className}`} onKeyDown={phim}>
      <button
        ref={nutRef}
        type="button"
        id={id}
        disabled={voHieu}
        aria-haspopup="listbox"
        aria-expanded={mo}
        aria-controls={mo ? idDs : undefined}
        aria-label={ariaLabel}
        onClick={() => (mo ? setMo(false) : moDs())}
        className={`flex w-full items-center justify-between gap-2 rounded-nho border bg-giay-sang text-left text-muc outline-none transition-colors disabled:opacity-60 ${
          nho ? "h-9 px-2.5 text-[13px]" : "h-11 px-3 text-[15px]"
        } ${mo ? "border-nhan ring-2 ring-nhan/25" : "border-vien-dam hover:border-nhan"} focus-visible:border-nhan focus-visible:ring-2 focus-visible:ring-nhan/25`}
      >
        <span className={`truncate ${chon ? "" : "text-muc-3"}`}>{chon ? chon.nhan : trong}</span>
        <ChevronDown strokeWidth={1.8} className={`h-4 w-4 shrink-0 text-nhan transition-transform ${mo ? "rotate-180" : ""}`} />
      </button>
      {ten && (
        <input
          ref={kiemTra}
          name={ten}
          value={gia}
          required={batBuoc}
          onChange={() => {}}
          onInvalid={(e) => e.currentTarget.setCustomValidity("Bạn chọn một mục trong danh sách.")}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
        />
      )}
      {mo &&
        createPortal(
          <ul
          ref={dsRef}
          id={idDs}
          role="listbox"
          aria-label={ariaLabel}
          style={{ position: "fixed", visibility: "hidden" }}
          className={`z-[90] overflow-y-auto rounded-the border border-vien bg-giay-sang p-1.5 ${BONG}`}
        >
          {coTim && (
            <li role="presentation" className="sticky top-0 z-10 -mx-1.5 -mt-1.5 mb-1 bg-giay-sang px-2 pb-1.5 pt-2">
              <input ref={timRef} value={q} onChange={(e) => { setQ(e.target.value); setDangTro(0); }} placeholder="Gõ để tìm…" aria-label="Tìm trong danh sách" className="h-8 w-full rounded-nho border border-vien-dam bg-giay px-2.5 text-[13px] text-muc outline-none focus-visible:border-nhan focus-visible:ring-2 focus-visible:ring-nhan/25" />
            </li>
          )}
          {ds.length === 0 && <li role="presentation" className="px-3 py-2 text-[13px] text-muc-3">Không thấy kết quả.</li>}
          {ds.map((l, i) => {
            const dangChon = l.gia_tri === gia;
            const dauNhom = coNhom && l.nhom && l.nhom !== ds[i - 1]?.nhom;
            return (
              <Fragment key={l.gia_tri || `trong-${i}`}>
                {dauNhom && <li role="presentation" className="px-2.5 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muc-3">{l.nhom}</li>}
                <li
                  role="option"
                  aria-selected={dangChon}
                  onMouseEnter={() => setDangTro(i)}
                  onClick={() => dat(l.gia_tri)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-nho ${coNhom ? "px-2.5 py-1.5 text-[13.5px]" : "px-3 py-2.5 text-[14px]"} ${
                    i === dangTro ? "bg-giay-tram" : ""
                  } ${dangChon ? "font-semibold text-muc" : "text-muc-2"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {coNhom && l.nhom && <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-nho bg-giay-tram text-[11px] font-semibold text-nhan-dam">{chuDau(l.nhan)}</span>}
                    <span className="truncate">{l.nhan}</span>
                  </span>
                  {dangChon && <Check strokeWidth={2} className="h-4 w-4 shrink-0 text-nhan" />}
                </li>
              </Fragment>
            );
          })}
          </ul>,
          document.body,
        )}
    </div>
  );
}

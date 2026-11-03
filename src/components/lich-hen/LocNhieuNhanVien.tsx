"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import type { LuaChon } from "@/components/ui/Chon";
import { useNoi } from "@/components/ui/noi";
import { NV_CHUA_PHAN } from "@/lib/lich-hen";

const boDau = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

/** Lọc nhân viên của lưới lịch hẹn, chọn NHIỀU người như SalonHero (có "Chọn toàn bộ").
 * `giaTri` là danh sách mã cách nhau dấu phẩy trên địa chỉ (`nv=a,b`); rỗng = toàn bộ. Bấm "Áp dụng" mới tải lại để không tải mỗi lần tích. */
export function LocNhieuNhanVien({ giaTri, luaChon, coChuaPhan = true }: { giaTri: string; luaChon: LuaChon[]; coChuaPhan?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dsDau = giaTri.split(",").filter(Boolean);
  const [mo, setMo] = useState(false);
  const [chon, setChon] = useState<string[]>(dsDau);
  const [q, setQ] = useState("");
  const nutRef = useRef<HTMLButtonElement>(null);
  const hopRef = useRef<HTMLDivElement>(null);
  useNoi(mo, nutRef, hopRef, { rong: 290, caoUoc: 400 });

  const tatCa = [...(coChuaPhan ? [{ gia_tri: NV_CHUA_PHAN, nhan: "Chưa chọn nhân viên" }] : []), ...luaChon.filter((l) => l.gia_tri)];
  const thay = q ? tatCa.filter((l) => boDau(l.nhan).includes(boDau(q))) : tatCa;
  const dangChonTatCa = chon.length === 0 || tatCa.every((l) => chon.includes(l.gia_tri));

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      const dich = e.target as Node;
      if (!nutRef.current?.contains(dich) && !hopRef.current?.contains(dich)) setMo(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", ngoai); document.removeEventListener("keydown", esc); };
  }, [mo]);

  const moHop = () => { setChon(dsDau); setQ(""); setMo(true); };
  const dao = (v: string) => setChon((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
  const apDung = () => {
    // Chọn đủ mọi người trong danh sách = toàn bộ = bỏ lọc.
    const kq = chon.length === 0 || tatCa.every((l) => chon.includes(l.gia_tri)) ? "" : chon.join(",");
    const u = new URLSearchParams(sp.toString());
    if (kq) u.set("nv", kq); else u.delete("nv");
    setMo(false);
    router.push(`/lich-hen?${u}`);
  };

  const ten1 = dsDau.length === 1 ? tatCa.find((l) => l.gia_tri === dsDau[0])?.nhan : undefined;
  const nhan = dsDau.length === 0 ? "Tất cả" : ten1 ?? `${dsDau.length} nhân viên`;

  return (
    <div className="relative">
      <button ref={nutRef} type="button" aria-haspopup="dialog" aria-expanded={mo} aria-label="Lọc theo nhân viên (chọn nhiều)" onClick={() => (mo ? setMo(false) : moHop())}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-nho border bg-giay-sang px-2.5 text-left text-[13px] text-muc outline-none transition-colors ${mo ? "border-nhan ring-2 ring-nhan/25" : "border-vien-dam hover:border-nhan"} focus-visible:border-nhan focus-visible:ring-2 focus-visible:ring-nhan/25`}>
        <span className={`truncate ${dsDau.length ? "" : "text-muc-3"}`}>{nhan}</span>
        <ChevronDown strokeWidth={1.8} className={`h-4 w-4 shrink-0 text-nhan transition-transform ${mo ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {mo && createPortal(
        <div ref={hopRef} role="dialog" aria-label="Chọn nhân viên" style={{ position: "fixed", visibility: "hidden" }}
          className="z-[70] flex flex-col overflow-hidden rounded-the border border-vien bg-giay-sang shadow-[0_14px_32px_rgba(5,40,36,0.18)]">
          <div className="border-b border-vien p-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ để tìm…" aria-label="Tìm nhân viên" className="h-8 w-full rounded-nho border border-vien-dam bg-giay px-2.5 text-[13px] text-muc outline-none focus-visible:border-nhan" />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
            <li>
              <button type="button" role="checkbox" aria-checked={dangChonTatCa} onClick={() => setChon(dangChonTatCa ? [] : tatCa.map((l) => l.gia_tri))}
                className="flex w-full items-center gap-2.5 rounded-nho px-2.5 py-2 text-left text-[13.5px] font-semibold text-muc hover:bg-giay-tram">
                <Hop_ on={dangChonTatCa} />Chọn toàn bộ
              </button>
            </li>
            {thay.map((l) => { const on = chon.includes(l.gia_tri); return (
              <li key={l.gia_tri}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => dao(l.gia_tri)} className={`flex w-full items-center gap-2.5 rounded-nho px-2.5 py-2 text-left text-[13.5px] hover:bg-giay-tram ${on ? "text-muc" : "text-muc-2"}`}>
                  <Hop_ on={on} /><span className="truncate">{l.nhan}</span>
                </button>
              </li>); })}
            {thay.length === 0 && <li className="px-3 py-2 text-[13px] text-muc-3">Không thấy kết quả.</li>}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-vien p-2">
            <button type="button" className="text-[13px] text-muc-3 hover:text-muc" onClick={() => setChon([])}>Bỏ chọn</button>
            <button type="button" className="nut-vang h-8 rounded-nho px-4 text-[13px]" onClick={apDung}>Áp dụng</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Hop_({ on }: { on: boolean }) {
  return <span aria-hidden className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${on ? "border-nhan bg-nhan text-white" : "border-vien-dam"}`}>{on ? <Check strokeWidth={3} className="h-3 w-3" /> : null}</span>;
}

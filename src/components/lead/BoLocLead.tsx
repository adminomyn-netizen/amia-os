"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { O_NHAP } from "@/components/ui/dinh-dang";

const GOC = "/marketing/lead";
export const KHOA_LOC = ["gd", "kq", "cn", "pt", "ht", "dt", "ng", "tv", "nh", "cs"] as const;
export type LocLead = Partial<Record<(typeof KHOA_LOC)[number] | "q" | "xem", string>>;

function useDoiUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  return (doi: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(doi)) { if (v) u.set(k, v); else u.delete(k); }
    if (!("trang" in doi)) u.delete("trang");
    router.push(`${GOC}${u.size ? `?${u}` : ""}`);
  };
}

/** Thanh công cụ Hộp Lead: tìm (tên, SĐT, mã), lọc, đổi cách xem Kanban/Bảng. Mọi lựa chọn nằm trên địa chỉ nên chia sẻ được. Màn hẹp: bấm "Bộ lọc" để mở. */
export function BoLocLead({ loc, chon, children }: { loc: LocLead; chon: Record<(typeof KHOA_LOC)[number], LuaChon[] | null>; children?: React.ReactNode }) {
  const doi = useDoiUrl();
  const sp = useSearchParams();
  const [chu, setChu] = useState(loc.q ?? "");
  const [moLoc, setMoLoc] = useState(false);
  const soLoc = KHOA_LOC.filter((k) => loc[k]).length;
  const tim = () => { if (chu.trim() !== (loc.q ?? "")) doi({ q: chu.trim() }); };
  const xem = loc.xem === "bang" ? "bang" : "kanban";
  const ganXem = (v: string) => { const u = new URLSearchParams(sp.toString()); u.delete("trang"); if (v === "kanban") u.delete("xem"); else u.set("xem", v); return `${GOC}${u.size ? `?${u}` : ""}`; };
  const NHAN: Record<(typeof KHOA_LOC)[number], string> = { gd: "Giai đoạn", kq: "Trạng thái", cn: "Chi nhánh", pt: "Người phụ trách", ht: "Người hỗ trợ", dt: "Người giới thiệu", ng: "Kênh / nguồn", tv: "Tác vụ", nh: "Nhắc việc", cs: "Mức chăm sóc" };
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" aria-hidden />
          <input value={chu} onChange={(e) => setChu(e.target.value)} onBlur={tim} onKeyDown={(e) => e.key === "Enter" && tim()} placeholder="Tìm lead: tên, SĐT, mã" aria-label="Tìm lead" maxLength={60} className={`${O_NHAP} pl-9`} />
        </div>
        <button type="button" onClick={() => setMoLoc((m) => !m)} aria-expanded={moLoc}
          className="inline-flex h-11 items-center gap-2 rounded-nho border border-vien-dam px-3 text-[14px] font-medium text-muc-2 hover:bg-giay-tram lg:hidden">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />Bộ lọc{soLoc > 0 && <span className="rounded-nho bg-nhan-nhat px-1.5 text-[12px] font-semibold text-nhan-dam">{soLoc}</span>}
        </button>
        <div role="group" aria-label="Cách xem" className="inline-flex h-11 overflow-hidden rounded-nho border border-vien-dam text-[14px]">
          {[["kanban", "Kanban"], ["bang", "Bảng"]].map(([v, n]) => (
            <Link key={v} href={ganXem(v)} aria-current={xem === v ? "page" : undefined} scroll={false}
              className={`flex items-center px-3.5 ${xem === v ? "bg-nhan-nhat font-semibold text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}>{n}</Link>
          ))}
        </div>
        {children}
      </div>
      <div className={`${moLoc ? "grid" : "hidden"} gap-2.5 sm:grid-cols-2 lg:grid lg:grid-cols-5`} role="search" aria-label="Lọc lead">
        {KHOA_LOC.map((k) => chon[k] && (
          <Chon key={k} nho ariaLabel={NHAN[k]} giaTri={loc[k] ?? ""} luaChon={[{ gia_tri: "", nhan: `${NHAN[k]}: tất cả` }, ...chon[k]!]} onDoi={(v) => doi({ [k]: v })} />
        ))}
        {soLoc > 0 && (
          <button type="button" className="h-9 rounded-nho px-2 text-left text-[13px] font-medium text-nhan-dam hover:underline"
            onClick={() => doi(Object.fromEntries(KHOA_LOC.map((k) => [k, ""])))}>Xóa lọc ({soLoc})</button>
        )}
      </div>
    </div>
  );
}

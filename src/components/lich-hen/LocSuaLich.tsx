"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";
import { LUA_CHON_LOAI_LICH } from "@/lib/lich-hen-sua";
import { NHAN_HANH_DONG_SUA } from "@/lib/lich-hen-lich-su";

function useDoiUrl(goc: string) {
  const router = useRouter();
  const sp = useSearchParams();
  return (doi: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(doi)) { if (v) u.set(k, v); else u.delete(k); }
    u.delete("lich");
    if (!("trang" in doi)) u.delete("trang");
    router.push(`${goc}?${u}`);
  };
}

/** Lọc lưới Lịch hẹn theo loại lịch (tư vấn khách mới, liệu trình…); "Chưa ghi loại" = lịch cũ. */
export function LocLoaiLich({ giaTri }: { giaTri: string }) {
  const doi = useDoiUrl("/lich-hen");
  return <Chon ariaLabel="Lọc theo loại lịch" giaTri={giaTri} luaChon={[{ gia_tri: "", nhan: "Mọi loại lịch" }, ...LUA_CHON_LOAI_LICH, { gia_tri: "chua_ghi", nhan: "Chưa ghi loại" }]} onDoi={(v) => doi({ loai: v })} />;
}

function OTim({ nhan, giaTri, tham, doi }: { nhan: string; giaTri: string; tham: string; doi: (d: Record<string, string>) => void }) {
  const [chu, setChu] = useState(giaTri);
  const tim = () => { if (chu.trim() !== giaTri) doi({ [tham]: chu.trim() }); };
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" aria-hidden />
      <input value={chu} onChange={(e) => setChu(e.target.value)} onBlur={tim} onKeyDown={(e) => e.key === "Enter" && tim()} placeholder={nhan} aria-label={nhan} maxLength={60} className={`${O_NHAP} pl-9`} />
    </div>
  );
}

/** Bộ lọc trang Lịch sử sửa lịch hẹn: ngày sửa, người sửa, khách, hành động. */
export function BoLocSuaLich({ tu, den, nguoi, khach, hd }: { tu: string; den: string; nguoi: string; khach: string; hd: string }) {
  const doi = useDoiUrl("/lich-hen/lich-su-sua");
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Lọc lịch sử sửa lịch hẹn">
      <div className="flex items-center gap-2 sm:col-span-2" role="group" aria-label="Khoảng ngày sửa">
        <NgayChon giaTri={tu} ariaLabel="Từ ngày" tuNam={2026} denNam={2030} className="min-w-0 flex-1" onDoi={(v) => v && doi({ tu: v, den: v > den ? v : den })} />
        <span className="text-muc-3" aria-hidden>-</span>
        <NgayChon giaTri={den} ariaLabel="Đến ngày" tuNam={2026} denNam={2030} className="min-w-0 flex-1" onDoi={(v) => v && doi({ den: v, tu: v < tu ? v : tu })} />
      </div>
      <OTim key={`n${nguoi}`} nhan="Tìm người sửa" giaTri={nguoi} tham="nguoi" doi={doi} />
      <OTim key={`k${khach}`} nhan="Tìm khách (tên, SĐT, mã)" giaTri={khach} tham="khach" doi={doi} />
      <Chon ariaLabel="Lọc theo hành động" giaTri={hd} luaChon={[{ gia_tri: "", nhan: "Mọi hành động" }, ...Object.entries(NHAN_HANH_DONG_SUA).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))]} onDoi={(v) => doi({ hd: v })} />
    </div>
  );
}

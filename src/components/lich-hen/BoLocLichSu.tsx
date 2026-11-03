"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";

const GOC = "/lich-hen/lich-su";
/** Đổi/bỏ tham số trên địa chỉ trang Lịch sử rồi tải lại; đổi bộ lọc thì về trang 1. */
function useDoiUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  return (doi: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(doi)) { if (v) u.set(k, v); else u.delete(k); }
    if (!("trang" in doi)) u.delete("trang");
    router.push(`${GOC}?${u}`);
  };
}

function OTim({ nhan, giaTri, tham, khungDat }: { nhan: string; giaTri: string; tham: "q" | "tao"; khungDat: string }) {
  const doi = useDoiUrl();
  const [chu, setChu] = useState(giaTri);
  const tim = () => { if (chu.trim() !== giaTri) doi({ [tham]: chu.trim() }); };
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" aria-hidden />
      <input value={chu} onChange={(e) => setChu(e.target.value)} onBlur={tim} onKeyDown={(e) => e.key === "Enter" && tim()} placeholder={khungDat} aria-label={nhan} maxLength={60} className={`${O_NHAP} pl-9`} />
    </div>
  );
}

/** Bộ lọc bảng Lịch sử như SalonHero: tìm khách/mã đặt lịch, trạng thái, nguồn, khoảng ngày giờ hẹn, người tạo, khách mới/quay lại, cỡ trang. Mọi thứ nằm trên địa chỉ nên chia sẻ được. */
export function BoLocLichSu({ q, tt, nguon, tao, km, tu, den, moi, luaChonTt, luaChonNguon }: {
  q: string; tt: string; nguon: string; tao: string; km: string; tu: string; den: string; moi: string; luaChonTt: LuaChon[]; luaChonNguon: LuaChon[];
}) {
  const doi = useDoiUrl();
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Lọc lịch sử lịch hẹn">
      <OTim key={`q${q}`} nhan="Tìm khách hàng hoặc mã đặt lịch" giaTri={q} tham="q" khungDat="Tìm khách hàng hoặc mã đặt lịch" />
      <Chon ariaLabel="Lọc theo trạng thái" giaTri={tt} luaChon={luaChonTt} onDoi={(v) => doi({ tt: v })} />
      <Chon ariaLabel="Lọc theo nguồn đặt" giaTri={nguon} luaChon={luaChonNguon} onDoi={(v) => doi({ nguon: v })} />
      <OTim key={`t${tao}`} nhan="Tìm theo người tạo lịch hẹn" giaTri={tao} tham="tao" khungDat="Tìm theo người tạo lịch hẹn" />
      <Chon ariaLabel="Lọc khách mới hoặc khách quay lại" giaTri={km} luaChon={[{ gia_tri: "", nhan: "Khách mới/quay lại" }, { gia_tri: "moi", nhan: "Khách mới" }, { gia_tri: "quay_lai", nhan: "Khách quay lại" }]} onDoi={(v) => doi({ km: v })} />
      <div className="flex items-center gap-2 sm:col-span-2" role="group" aria-label="Khoảng ngày giờ hẹn">
        <NgayChon giaTri={tu} ariaLabel="Từ ngày" tuNam={2018} denNam={2030} className="min-w-0 flex-1" onDoi={(v) => v && doi({ tu: v, den: v > den ? v : den })} />
        <span className="text-muc-3" aria-hidden>-</span>
        <NgayChon giaTri={den} ariaLabel="Đến ngày" tuNam={2018} denNam={2030} className="min-w-0 flex-1" onDoi={(v) => v && doi({ den: v, tu: v < tu ? v : tu })} />
      </div>
      <div className="flex items-center gap-2 text-[13px] text-muc-3 sm:col-span-2 lg:col-span-1">
        <span>Hiển thị</span>
        <span className="w-[90px]"><Chon ariaLabel="Số dòng mỗi trang" giaTri={moi} luaChon={["10", "25", "50", "100"].map((v) => ({ gia_tri: v, nhan: v }))} onDoi={(v) => doi({ moi: v })} nho /></span>
        <span>kết quả</span>
      </div>
    </div>
  );
}

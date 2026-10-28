"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { THU, type GioNgay, type KhoaThu } from "@/lib/gio-lam-viec";

const GIO: LuaChon[] = Array.from({ length: 4 * 19 + 1 }, (_, i) => { const m = 5 * 60 + i * 15, g = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; return { gia_tri: g, nhan: g }; });
type Dong = Record<KhoaThu, GioNgay>;

/** Bảng giờ mở/đóng 7 thứ của một chi nhánh. Không dùng <form>: gom giá trị vào FormData rồi gọi Server Action (như NutHop). */
export function GioLamViec({ chiNhanhId, dau, dungChung, sua, luu }: { chiNhanhId: string; dau: Dong; dungChung: boolean; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [g, setG] = useState<Dong>(dau);
  const [chung, setChung] = useState(dungChung);
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false);
  const [dang, bat] = useTransition();
  const doi = (k: KhoaThu, p: Partial<GioNgay>) => { setG({ ...g, [k]: { ...g[k], ...p } }); setChung(false); setOk(false); };
  const gui = (dungChungGiaTri: boolean) => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("chi_nhanh_id", chiNhanhId);
    if (dungChungGiaTri) fd.set("dung_chung", "1");
    for (const { khoa } of THU) { fd.set(`${khoa}_nghi`, g[khoa].nghi ? "1" : "0"); fd.set(`${khoa}_mo`, g[khoa].mo); fd.set(`${khoa}_dong`, g[khoa].dong); }
    bat(async () => {
      const kq = await luu(fd);
      if (kq.loi) setLoi(kq.loi); else { setOk(true); setChung(dungChungGiaTri); router.refresh(); }
    });
  };
  return (
    <div>
      <ul className="divide-y divide-vien">
        {THU.map(({ khoa, nhan }) => (
          <li key={khoa} className="grid grid-cols-[88px_1fr] items-center gap-x-4 gap-y-2 py-2.5 sm:grid-cols-[110px_150px_1fr_1fr]">
            <span className="text-[14px] font-medium text-muc">{nhan}</span>
            <span className="sm:order-none">{sua ? <Gat key={`${khoa}-${g[khoa].nghi}`} nhan="Nghỉ" giaTriMacDinh={g[khoa].nghi} onDoi={(v) => doi(khoa, { nghi: v })} /> : <span className="text-[14px] text-muc-2">{g[khoa].nghi ? "Nghỉ" : ""}</span>}</span>
            {!g[khoa].nghi && (sua ? (
              <>
                <Chon ariaLabel={`${nhan}: giờ mở cửa`} luaChon={GIO} giaTri={g[khoa].mo} onDoi={(v) => doi(khoa, { mo: v })} />
                <Chon ariaLabel={`${nhan}: giờ đóng cửa`} luaChon={GIO} giaTri={g[khoa].dong} onDoi={(v) => doi(khoa, { dong: v })} />
              </>
            ) : <span className="col-span-2 text-[14px] tabular-nums text-muc-2">{g[khoa].mo} – {g[khoa].dong}</span>)}
          </li>
        ))}
      </ul>
      {loi && <div role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {ok && <p role="status" className="mt-3 text-[14px] text-nhan-dam">Đã lưu giờ làm việc.</p>}
      {sua && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={() => gui(false)}>{dang ? "Đang lưu" : "Lưu giờ làm việc"}</button>
          {!chung && <button type="button" className={NUT_PHU} disabled={dang} onClick={() => gui(true)}>Dùng giờ chung</button>}
          {chung && <span className="text-[13px] text-muc-3">Đang dùng giờ chung của cơ sở. Sửa ô nào rồi Lưu để tách giờ riêng cho chi nhánh này.</span>}
        </div>
      )}
    </div>
  );
}

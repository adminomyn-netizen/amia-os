"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { doiGiaiDoan } from "@/app/(app)/marketing/lead/actions";

export type CotNho = { id: string; ten: string; la_thua: boolean; la_thang: boolean };

/** Gọi đổi giai đoạn; sang cột Thua thì hỏi lý do trước. Dùng chung cho kéo thả (kanban), ô chọn ở bảng và ở khung lead. */
export function useDoiGiaiDoan(cot: CotNho[], lyDoThua: LuaChon[]) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [cho, setCho] = useState<{ id: string; gd: string } | null>(null);
  const [lyDo, setLyDo] = useState("");
  const gui = (id: string, gd: string, ld = "") => {
    setLoi("");
    bat(async () => {
      const fd = new FormData(); fd.set("id", id); fd.set("giai_doan_id", gd); if (ld) fd.set("ly_do_thua_id", ld);
      const kq = await doiGiaiDoan(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setCho(null); router.refresh(); }
    });
  };
  const doi = (id: string, gd: string) => {
    if (cot.find((c) => c.id === gd)?.la_thua) { setLyDo(""); setLoi(""); setCho({ id, gd }); return; }
    gui(id, gd);
  };
  const hop = (
    <Hop mo={!!cho} dong={() => setCho(null)} tieuDe="Đóng lead (thua)" moTa="Chọn lý do để sau này xem lại vì sao mất khách.">
      <Chon ariaLabel="Lý do thua" luaChon={lyDoThua} giaTri={lyDo} onDoi={setLyDo} trong="Chọn lý do" />
      {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" className={NUT_PHU} onClick={() => setCho(null)}>Huỷ</button>
        <button type="button" className={NUT_CHINH} disabled={dang || !lyDo} onClick={() => cho && gui(cho.id, cho.gd, lyDo)}>{dang ? "Đang lưu" : "Đóng lead"}</button>
      </div>
    </Hop>
  );
  return { doi, dang, loi: cho ? "" : loi, xoaLoi: () => setLoi(""), hop };
}

/** Ô chọn giai đoạn của một lead (khung chi tiết). */
export function ChonGiaiDoan({ id, giaTri, cot, lyDoThua, voHieu }: { id: string; giaTri: string; cot: CotNho[]; lyDoThua: LuaChon[]; voHieu?: boolean }) {
  const { doi, dang, loi, hop } = useDoiGiaiDoan(cot, lyDoThua);
  return (
    <div>
      <Chon ariaLabel="Giai đoạn" luaChon={cot.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} giaTri={giaTri} onDoi={(v) => v !== giaTri && doi(id, v)} voHieu={voHieu || dang} />
      {loi && <p role="alert" className="mt-1.5 text-[12.5px] text-loi">{loi}</p>}
      {hop}
    </div>
  );
}

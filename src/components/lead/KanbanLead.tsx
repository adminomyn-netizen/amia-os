"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ListChecks, Paperclip } from "lucide-react";
import type { LuaChon } from "@/components/ui/Chon";
import { useDoiGiaiDoan, type CotNho } from "./DoiGiaiDoan";

/** Thẻ lead đã tính sẵn ở máy chủ (chữ "Cập nhật…", quá SLA) để không lệch giờ giữa máy chủ và trình duyệt. */
export type TheLead = {
  id: string; ma: string; ho_ten: string; sdt: string; gia_tri: number; cap_nhat: string; qua_sla: boolean;
  phu_trach: string | null; so_tep: number; so_nhac: number; nhac_qua_han: boolean; so_tac_vu: number; la_khach: boolean;
};
export type CotKanban = CotNho & { mau: string; sla_phut: number | null; tong: number; the: TheLead[] };

const chuDau = (t: string) => (t.trim().split(/\s+/).pop() ?? "?").charAt(0).toUpperCase();
const tien = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

/** Kanban kéo thả: thả vào cột để đổi giai đoạn (cột Thua hỏi lý do). Trên điện thoại cột cuộn ngang trong khung; đổi giai đoạn ở khung lead nếu kéo thả không tiện. */
export function KanbanLead({ cot, lyDoThua, ghi, them }: { cot: CotKanban[]; lyDoThua: LuaChon[]; ghi: boolean; them: string }) {
  const { doi, dang, loi, xoaLoi, hop } = useDoiGiaiDoan(cot, lyDoThua);
  const [keo, setKeo] = useState<{ id: string; tu: string } | null>(null);
  const [tren, setTren] = useState<string | null>(null);
  return (
    <div>
      {loi && <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi"><span>{loi}</span><button type="button" className="text-[13px] underline" onClick={xoaLoi}>Đóng</button></div>}
      <div className={`-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 ${dang ? "opacity-70" : ""}`}>
        {cot.map((c) => (
          <section key={c.id} aria-label={`Cột ${c.ten}`}
            className={`flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-the border bg-giay-tram/60 sm:w-[272px] ${tren === c.id ? "border-nhan ring-2 ring-nhan/25" : "border-vien"}`}
            onDragOver={(e) => { if (ghi && keo && keo.tu !== c.id) { e.preventDefault(); setTren(c.id); } }}
            onDragLeave={() => setTren((t) => (t === c.id ? null : t))}
            onDrop={(e) => { e.preventDefault(); setTren(null); if (keo && keo.tu !== c.id) doi(keo.id, c.id); setKeo(null); }}>
            <header className="flex items-center justify-between gap-2 border-b border-vien px-3 py-2.5" style={{ boxShadow: `inset 0 3px 0 ${c.mau}` }}>
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-tag" style={{ background: c.mau }} />
                <span className="truncate text-[14px] font-semibold text-muc">{c.ten}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-muc-3">
                {c.sla_phut ? <span title="SLA của cột">SLA {c.sla_phut >= 1440 ? `${Math.round(c.sla_phut / 1440)} ngày` : c.sla_phut >= 60 ? `${Math.round(c.sla_phut / 60)} giờ` : `${c.sla_phut} phút`}</span> : null}
                <span className="rounded-nho bg-giay-sang px-1.5 py-0.5 font-semibold text-muc-2">{c.tong}</span>
              </span>
            </header>
            <ul className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
              {c.the.map((t) => (
                <li key={t.id} draggable={ghi} onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); setKeo({ id: t.id, tu: c.id }); }} onDragEnd={() => { setKeo(null); setTren(null); }}
                  className={`rounded-nho border bg-giay-sang shadow-[0_1px_2px_rgb(10_43_38/0.06)] ${ghi ? "cursor-grab active:cursor-grabbing" : ""} ${keo?.id === t.id ? "opacity-50" : ""} ${t.qua_sla ? "border-canh-bao/60" : "border-vien"}`}>
                  <Link href={`/marketing/lead/${t.id}${them}`} className="block px-3 py-2.5 hover:bg-giay-tram/50" draggable={false}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 text-[14px] font-medium leading-snug text-muc [overflow-wrap:anywhere]">{t.ho_ten}</span>
                      {t.phu_trach
                        ? <span title={t.phu_trach} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-tag bg-nhan-nhat text-[11px] font-semibold text-nhan-dam">{chuDau(t.phu_trach)}</span>
                        : <span className="shrink-0 rounded-tag bg-canh-bao-nen px-1.5 py-0.5 text-[11px] font-medium text-canh-bao">Chưa nhận</span>}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-muc-3">{t.ma} · {t.sdt}</div>
                    {t.gia_tri > 0 && <div className="mt-1 text-[13px] font-medium tabular-nums text-muc-2">{tien(t.gia_tri)}</div>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muc-3">
                      <span className={t.qua_sla ? "font-medium text-canh-bao" : ""}>{t.qua_sla ? "Quá SLA · " : ""}{t.cap_nhat}</span>
                      {t.so_tep > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" aria-hidden />{t.so_tep} tệp</span>}
                      {t.so_nhac > 0 && <span className={`inline-flex items-center gap-1 ${t.nhac_qua_han ? "text-loi" : ""}`}><Bell className="h-3 w-3" aria-hidden />{t.so_nhac} nhắc</span>}
                      {t.so_tac_vu > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" aria-hidden />{t.so_tac_vu} tác vụ</span>}
                      {t.la_khach && <span className="text-nhan-dam">Đã là khách</span>}
                    </div>
                  </Link>
                </li>
              ))}
              {c.the.length === 0 && <li className="px-2 py-6 text-center text-[12.5px] text-muc-3">{ghi ? "Kéo lead vào đây" : "Chưa có lead"}</li>}
              {c.tong > c.the.length && <li className="px-2 py-1 text-center text-[12px] text-muc-3">Còn {c.tong - c.the.length} lead — xem đủ ở chế độ Bảng</li>}
            </ul>
          </section>
        ))}
      </div>
      {hop}
    </div>
  );
}

"use client";

import { useState } from "react";

type DV = { id: string; ma?: string; ten: string; /** 0 / không có = không hiện số phút (vd dịch vụ ở Thu ngân). */ thoiLuong?: number };

/** Chọn NHIỀU dịch vụ một lúc cho lịch hẹn (chị Lâm 10/11: tick được nhiều dịch vụ cùng lúc).
 *  Tick thoải mái trong danh sách; dịch vụ đã chọn hiện thành thẻ ở trên (bấm × để bỏ), kèm tổng số và tổng phút.
 *  `ds`: dịch vụ được hiện để chọn; `tatCa`: để lấy tên các dịch vụ đã chọn kể cả dịch vụ không còn hiện. */
export function ChonNhieuDichVu({ ds, tatCa = ds, chon, onDoi, nhan = "Dịch vụ" }: { ds: DV[]; tatCa?: DV[]; chon: string[]; onDoi: (ids: string[]) => void; nhan?: string }) {
  const [tim, setTim] = useState("");
  const tim_ = tim.trim().toLowerCase();
  const hien = ds.filter((d) => !tim_ || `${d.ma ?? ""} ${d.ten}`.toLowerCase().includes(tim_));
  const dv = (id: string) => tatCa.find((d) => d.id === id);
  const tongPhut = chon.reduce((s, id) => s + (dv(id)?.thoiLuong ?? 0), 0);
  const doi = (id: string) => onDoi(chon.includes(id) ? chon.filter((x) => x !== id) : [...chon, id]);
  const chuaChonHien = hien.filter((d) => !chon.includes(d.id));
  return (
    <div className="rounded-nho border border-vien-dam">
      <div className="flex items-center justify-between gap-2 border-b border-vien px-3 py-2">
        <p className="text-[13px] text-muc-2">
          {chon.length ? <><span className="font-semibold text-nhan-dam">Đã chọn {chon.length} dịch vụ</span>{tongPhut ? ` · ${tongPhut} phút` : ""}</> : "Tick được nhiều dịch vụ cùng lúc"}
        </p>
        {chon.length > 0 && <button type="button" onClick={() => onDoi([])} className="shrink-0 text-[13px] text-muc-3 hover:text-loi">Bỏ hết</button>}
      </div>
      {chon.length > 0 && (
        <ul aria-label={`${nhan} đã chọn`} className="flex flex-wrap gap-1.5 border-b border-vien px-3 py-2">
          {chon.map((id) => { const d = dv(id); return (
            <li key={id} className="flex max-w-full items-center gap-1 rounded-nho bg-nhan/10 py-1 pl-2 text-[13px] text-nhan-dam">
              <span className="truncate">{d?.ten ?? "Dịch vụ"}</span>
              <button type="button" aria-label={`Bỏ ${d?.ten ?? "dịch vụ"}`} onClick={() => doi(id)} className="flex h-7 w-7 items-center justify-center text-muc-3 hover:text-loi">×</button>
            </li>); })}
        </ul>
      )}
      <div className="relative">
        <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm dịch vụ theo tên hoặc mã" aria-label={`Tìm ${nhan.toLowerCase()}`}
          className="h-11 w-full border-b border-vien bg-transparent px-3 pr-10 text-[14px] outline-none" />
        {tim && <button type="button" aria-label="Xoá tìm" onClick={() => setTim("")} className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center text-muc-3 hover:text-muc">×</button>}
      </div>
      <ul className="max-h-64 overflow-y-auto overscroll-contain py-1">
        {hien.map((d) => { const bat = chon.includes(d.id); return (
          <li key={d.id}>
            <button type="button" role="checkbox" aria-checked={bat} onClick={() => doi(d.id)}
              className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-[14px] hover:bg-giay-tram ${bat ? "bg-nhan/5" : ""}`}>
              <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border text-[12px] leading-none ${bat ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang"}`}>{bat ? "✓" : ""}</span>
              <span className={`min-w-0 flex-1 ${bat ? "font-medium text-muc" : ""}`}>{d.ma && <span className="text-muc-3">{d.ma} · </span>}{d.ten}</span>
              {!!d.thoiLuong && <span className="shrink-0 text-[12px] tabular-nums text-muc-3">{d.thoiLuong} phút</span>}
            </button>
          </li>); })}
        {hien.length === 0 && <li className="px-3 py-2 text-[13px] text-muc-3">Không có dịch vụ nào.</li>}
      </ul>
      {tim_ && chuaChonHien.length > 1 && (
        <div className="border-t border-vien px-3 py-1.5">
          <button type="button" onClick={() => onDoi([...chon, ...chuaChonHien.map((d) => d.id)])} className="text-[13px] font-medium text-nhan-dam hover:underline">Chọn cả {chuaChonHien.length} dịch vụ đang lọc</button>
        </div>
      )}
    </div>
  );
}

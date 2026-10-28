"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

/** Thanh lọc cho sáu báo cáo kho: chi nhánh, (tuỳ báo cáo) nhóm / nguồn nhập / nhà cung cấp / phân loại / dịch vụ / nhân viên, khoảng ngày, ô tìm.
 *  Chọn danh sách / ngày = áp dụng ngay; ô chữ áp dụng khi bấm Tìm kiếm hoặc Enter. Mọi thay đổi đưa về trang 1. */
export type LocPhu = { khoa: string; nhan: string; giaTri: string; luaChon: LuaChon[] };
export function LocKho({ tu, den, chiNhanh, cn, loc = [], q, nhanTim, so }: { tu?: string; den?: string; chiNhanh?: LuaChon[]; cn?: string; loc?: LocPhu[]; q?: string; nhanTim?: string; so?: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chu, setChu] = useState(q ?? "");
  const dat = (cap: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cap)) { if (v) u.set(k, v); else u.delete(k); }
    u.delete("trang"); u.delete("ct");
    router.push(`/bao-cao?${u}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); dat({ q: chu.trim() }); }} className={`mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Tại chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat({ cn: v })} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...chiNhanh]} />}
      {loc.map((l) => <Chon key={l.khoa} ariaLabel={l.nhan} giaTri={l.giaTri} onDoi={(v) => dat({ [l.khoa]: v })} luaChon={l.luaChon} />)}
      {tu !== undefined && <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat({ tu: v })} />}
      {den !== undefined && <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat({ den: v })} />}
      {so !== undefined && <Chon ariaLabel="Số dòng mỗi trang" giaTri={String(so)} onDoi={(v) => dat({ so: v })} luaChon={["10", "25", "50", "100"].map((s) => ({ gia_tri: s, nhan: `Hiển thị ${s} kết quả` }))} />}
      <input value={chu} onChange={(e) => setChu(e.target.value)} placeholder={nhanTim ?? "Tìm kiếm"} aria-label={nhanTim ?? "Tìm kiếm"} className={`${O_NHAP} sm:col-span-1 lg:col-span-2`} />
      <button type="submit" className={NUT_PHU}>Tìm kiếm</button>
    </form>
  );
}

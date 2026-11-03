"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

/** Thanh lọc "Danh sách khách hàng còn nợ": tìm khách / SĐT / mã hoá đơn, lọc theo ngày lập hoá đơn (để trống = mọi ngày), chi nhánh. Ô chữ áp dụng khi bấm Tìm kiếm hoặc Enter. */
export function LocNo({ tu, den, q, chiNhanh, cn }: { tu: string; den: string; q: string; chiNhanh?: LuaChon[]; cn?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chu, setChu] = useState(q);
  const dat = (cap: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cap)) { if (v) u.set(k, v); else u.delete(k); }
    router.push(`/bao-cao?${u}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); dat({ q: chu.trim() }); }} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NgayChon ariaLabel="Ngày lập hoá đơn từ" giaTri={tu} onDoi={(v) => dat({ tu: v })} />
      <NgayChon ariaLabel="Ngày lập hoá đơn đến" giaTri={den} onDoi={(v) => dat({ den: v })} />
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat({ cn: v })} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...chiNhanh]} />}
      <input value={chu} onChange={(e) => setChu(e.target.value)} placeholder="Tìm theo tên khách, SĐT, mã hoá đơn" aria-label="Tìm theo tên khách, số điện thoại, mã hoá đơn" className={`${O_NHAP} sm:col-span-2`} />
      <button type="submit" className={NUT_PHU}>Tìm kiếm</button>
    </form>
  );
}

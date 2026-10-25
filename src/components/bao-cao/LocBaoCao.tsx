"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";

/** Thanh lọc chung cho báo cáo: từ ngày, đến ngày, chi nhánh. Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocBaoCao({ goc, tu, den, chiNhanh, cn }: { goc: string; tu?: string; den?: string; chiNhanh?: LuaChon[]; cn?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); router.push(`${goc}?${u}`); };
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tu !== undefined && <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat("tu", v)} />}
      {den !== undefined && <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat("den", v)} />}
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat("cn", v)} luaChon={[{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...chiNhanh]} />}
    </div>
  );
}

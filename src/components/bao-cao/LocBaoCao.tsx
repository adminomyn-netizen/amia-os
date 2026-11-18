"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";

/** Thanh lọc chung cho báo cáo: từ ngày, đến ngày, chi nhánh, (tuỳ báo cáo) gom theo cả kỳ / tháng / ngày. Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocBaoCao({ goc, tu, den, chiNhanh, cn, nhom, cacNhom, motNgay }: { goc: string; tu?: string; den?: string; chiNhanh?: LuaChon[]; cn?: string; nhom?: string; cacNhom?: LuaChon[]; /** Chỉ một ô "Ngày" (đặt từ = đến), vd Hoá đơn trong ngày. */ motNgay?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dat = (k: string, v: string, k2?: string) => { const u = new URLSearchParams(sp.toString()); for (const kk of k2 ? [k, k2] : [k]) { if (v) u.set(kk, v); else u.delete(kk); } router.push(`${goc}?${u}`); };
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {motNgay && den !== undefined && <NgayChon ariaLabel="Ngày" giaTri={den} onDoi={(v) => dat("tu", v, "den")} />}
      {!motNgay && tu !== undefined && <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat("tu", v)} />}
      {!motNgay && den !== undefined && <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat("den", v)} />}
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat("cn", v)} luaChon={[{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...chiNhanh]} />}
      {cacNhom && <Chon ariaLabel="Gom số liệu" giaTri={nhom ?? cacNhom[0].gia_tri} onDoi={(v) => dat("nhom", v)} luaChon={cacNhom} />}
    </div>
  );
}

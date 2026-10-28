"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";

/** Thanh lọc báo cáo hoa hồng: từ ngày, đến ngày, chi nhánh, và (tuỳ báo cáo) vai hưởng, cách tính phần trả bằng thẻ tiền. Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocHoaHong({ goc, tu, den, chiNhanh, cn, vai, cacVai, the, cacThe }: { goc: string; tu: string; den: string; chiNhanh?: LuaChon[]; cn?: string; vai?: string; cacVai?: LuaChon[]; the?: string; cacThe?: LuaChon[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); router.push(`${goc}?${u}`); };
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat("tu", v)} />
      <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat("den", v)} />
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat("cn", v)} luaChon={[{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...chiNhanh]} />}
      {cacVai && <Chon ariaLabel="Vai hưởng hoa hồng" giaTri={vai ?? ""} onDoi={(v) => dat("vai", v)} luaChon={cacVai} />}
      {cacThe && <Chon ariaLabel="Phần trả bằng thẻ tiền" giaTri={the ?? ""} onDoi={(v) => dat("the", v)} luaChon={cacThe} />}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { LUA_CHON_NGUON } from "@/lib/lich-hen";

/** Lọc lịch hẹn theo nguồn đặt (mã SalonHero). Đổi là đổi URL nên tải lại, xuất Excel theo đúng lọc này. */
export function LocNguon({ giaTri }: { giaTri: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <div className="w-full sm:w-[200px]">
      <Chon ariaLabel="Lọc theo nguồn đặt" giaTri={giaTri} luaChon={[{ gia_tri: "", nhan: "Mọi nguồn đặt" }, ...LUA_CHON_NGUON]}
        onDoi={(v) => { const u = new URLSearchParams(sp.toString()); if (v) u.set("nguon", v); else u.delete("nguon"); router.push(`/lich-hen?${u}`); }} />
    </div>
  );
}

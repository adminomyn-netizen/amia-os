"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon } from "@/components/ui/Chon";

const LUA_CHON = ["10", "20", "50", "100"].map((s) => ({ gia_tri: s, nhan: `Hiển thị ${s} dòng` }));

/** Chọn số dòng mỗi trang (10, 20, 50, 100) cho bảng báo cáo. Đổi = đổi địa chỉ (`so`), về trang 1. */
export function ChonSoDong({ so, goc = "/bao-cao" }: { so: number; goc?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <div className="w-48">
      <Chon ariaLabel="Số dòng mỗi trang" giaTri={String(so)} luaChon={LUA_CHON} onDoi={(v) => { const u = new URLSearchParams(sp.toString()); u.set("so", v); u.delete("trang"); router.push(`${goc}?${u}`); }} />
    </div>
  );
}

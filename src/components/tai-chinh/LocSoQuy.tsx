"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";

/** Lọc sổ quỹ theo loại dòng, phân loại, và có hiện phiếu đã đảo hay không. Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocSoQuy({ goc, loai, pl, da, phanLoai }: { goc: string; loai: string; pl: string; da: boolean; phanLoai: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); router.push(`${goc}?${u}`); };
  return (
    <>
      <div className="w-44"><Chon ariaLabel="Loại" giaTri={loai} onDoi={(v) => dat("loai", v)} luaChon={[{ gia_tri: "", nhan: "Tất cả loại" }, { gia_tri: "thu", nhan: "Thu vào" }, { gia_tri: "chi", nhan: "Chi ra" }, { gia_tri: "nap", nhan: "Nạp quỹ" }, { gia_tri: "rut", nhan: "Rút quỹ" }]} /></div>
      <div className="w-64"><Chon ariaLabel="Phân loại" giaTri={pl} onDoi={(v) => dat("pl", v)} luaChon={[{ gia_tri: "", nhan: "Tất cả phân loại" }, ...phanLoai.map((p) => ({ gia_tri: p, nhan: p }))]} /></div>
      <Gat nhan="Hiện phiếu đã đảo" giaTriMacDinh={da} onDoi={(b) => dat("da", b ? "1" : "")} />
    </>
  );
}

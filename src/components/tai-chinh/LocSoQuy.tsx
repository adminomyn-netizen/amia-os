"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

/** Lọc sổ quỹ theo loại dòng (thu, chi, nạp, rút, chuyển sang / nhận từ quỹ kia), phân loại, ô tìm chữ và có hiện phiếu đã đảo hay không. Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocSoQuy({ goc, loai, pl, nh, nganHang, da, q, phanLoai, quyKia }: { goc: string; loai: string; pl: string; nh: string; nganHang: string[] | null; da: boolean; q: string; phanLoai: string[]; quyKia: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chu, setChu] = useState(q);
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); router.push(`${goc}?${u}`); };
  return (
    <>
      <div className="w-60"><Chon ariaLabel="Loại" giaTri={loai} onDoi={(v) => dat("loai", v)} luaChon={[{ gia_tri: "", nhan: "Tất cả loại" }, { gia_tri: "thu", nhan: "Thu vào" }, { gia_tri: "chi", nhan: "Chi ra" }, { gia_tri: "rut", nhan: "Rút tiền" }, { gia_tri: "nap", nhan: "Nạp tiền" }, { gia_tri: "chuyen-di", nhan: `Chuyển sang ${quyKia}` }, { gia_tri: "chuyen-den", nhan: `Nhận từ ${quyKia}` }]} /></div>
      <div className="w-64"><Chon ariaLabel="Phân loại" giaTri={pl} onDoi={(v) => dat("pl", v)} luaChon={[{ gia_tri: "", nhan: "Tất cả phân loại" }, ...phanLoai.map((p) => ({ gia_tri: p, nhan: p }))]} /></div>
      {nganHang && <div className="w-56"><Chon ariaLabel="Ngân hàng" giaTri={nh} onDoi={(v) => dat("nh", v)} luaChon={[{ gia_tri: "", nhan: "Tất cả ngân hàng" }, ...nganHang.map((n) => ({ gia_tri: n, nhan: n })), { gia_tri: "-", nhan: "Chưa ghi ngân hàng" }]} /></div>}
      <form onSubmit={(e) => { e.preventDefault(); dat("q", chu.trim()); }} className="flex gap-2">
        <input value={chu} onChange={(e) => setChu(e.target.value)} placeholder="Tìm mã, nội dung, người nộp / nhận" aria-label="Tìm trong sổ quỹ" className={`${O_NHAP} w-64`} />
        <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
      </form>
      <Gat nhan="Hiện phiếu đã đảo" giaTriMacDinh={da} onDoi={(b) => dat("da", b ? "1" : "")} />
    </>
  );
}

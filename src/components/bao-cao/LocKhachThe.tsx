"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

/** Thanh lọc cho báo cáo "Theo khách hàng" (nhóm khách, hạng, tìm khách) và "Lịch sử dùng thẻ" (tìm khách, tên thẻ, loại thẻ).
 *  Chọn ngày / chi nhánh / danh sách = áp dụng ngay; ô chữ áp dụng khi bấm Tìm kiếm hoặc Enter. Mọi thay đổi đưa về trang 1. */
const SO_DONG = ["10", "20", "50", "100"].map((s) => ({ gia_tri: s, nhan: `Hiển thị ${s} dòng` }));

export function LocKhachThe({ kieu, tu, den, chiNhanh, cn, nhomKhach, nhom, hang, cacHang, loai, q, tenThe, so }: {
  kieu: "khach" | "the" | "chi-nhanh"; tu: string; den: string; chiNhanh?: LuaChon[]; cn?: string; nhomKhach?: LuaChon[]; nhom?: string; hang?: string; cacHang?: LuaChon[]; loai?: string; q?: string; tenThe?: string; so: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chu, setChu] = useState({ q: q ?? "", tenThe: tenThe ?? "" });
  const dat = (cap: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cap)) { if (v) u.set(k, v); else u.delete(k); }
    u.delete("trang");
    router.push(`/bao-cao?${u}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); dat({ q: chu.q.trim(), ...(kieu === "the" ? { tt: chu.tenThe.trim() } : {}) }); }} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => dat({ tu: v })} />
      <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => dat({ den: v })} />
      {chiNhanh && chiNhanh.length > 1 && <Chon ariaLabel="Chi nhánh" giaTri={cn ?? ""} onDoi={(v) => dat({ cn: v })} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...chiNhanh]} />}
      {kieu === "khach" && nhomKhach && <Chon ariaLabel="Lọc theo nhóm khách hàng" giaTri={nhom ?? ""} onDoi={(v) => dat({ nk: v })} luaChon={[{ gia_tri: "", nhan: "Mọi nhóm khách hàng" }, ...nhomKhach]} />}
      {kieu === "khach" && cacHang && <Chon ariaLabel="Hạng khách hàng" giaTri={hang ?? ""} onDoi={(v) => dat({ hang: v })} luaChon={[{ gia_tri: "", nhan: "Tất cả hạng KH" }, ...cacHang]} />}
      {kieu === "the" && <Chon ariaLabel="Loại thẻ" giaTri={loai ?? ""} onDoi={(v) => dat({ lt: v })} luaChon={[{ gia_tri: "", nhan: "Loại thẻ: Tất cả" }, { gia_tri: "lan", nhan: "Thẻ lần" }, { gia_tri: "tien", nhan: "Thẻ tiền" }]} />}
      {kieu === "the" && <input value={chu.tenThe} onChange={(e) => setChu({ ...chu, tenThe: e.target.value })} placeholder="Lọc theo tên thẻ" aria-label="Lọc theo tên thẻ" className={O_NHAP} />}
      <input value={chu.q} onChange={(e) => setChu({ ...chu, q: e.target.value })} placeholder={kieu === "the" ? "Tìm khách hàng theo tên hoặc số điện thoại" : kieu === "chi-nhanh" ? "Tìm chi nhánh" : "Tìm kiếm khách hàng"} aria-label={kieu === "chi-nhanh" ? "Tìm chi nhánh" : "Tìm khách hàng"} className={`${O_NHAP} sm:col-span-2 lg:col-span-2`} />
      <Chon ariaLabel="Số dòng mỗi trang" giaTri={String(so)} onDoi={(v) => dat({ so: v })} luaChon={SO_DONG} />
      <button type="submit" className={NUT_PHU}>Tìm kiếm</button>
    </form>
  );
}

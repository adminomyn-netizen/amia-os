"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

/** Thanh lọc tab Tỉ lệ hoa hồng (như SalonHero): cách xem (danh sách / lưới theo nhân viên / lưới theo sản phẩm), chi nhánh, loại, ô tìm tên–mã,
 *  và ô chọn nhân viên (lưới theo nhân viên) hoặc mục (lưới theo sản phẩm). Đổi bộ lọc = đổi địa chỉ, máy chủ tính lại. */
export function LocTiLe({ xem, cn, loai, q, dt, muc, chiNhanh, doiTuong, mucLC }: { xem: string; cn: string; loai: string; q: string; dt: string; muc: string; chiNhanh?: LuaChon[]; doiTuong: LuaChon[]; mucLC: LuaChon[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chu, setChu] = useState(q);
  const dat = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); u.set("tab", "ti-le"); if (v) u.set(k, v); else u.delete(k); u.delete("trang"); router.push(`/hoa-hong?${u}`); };
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="w-56"><Chon ariaLabel="Cách xem" giaTri={xem} onDoi={(v) => dat("xem", v)} luaChon={[{ gia_tri: "", nhan: "Danh sách dòng tỉ lệ" }, { gia_tri: "nv", nhan: "Lưới theo nhân viên" }, { gia_tri: "sp", nhan: "Lưới theo sản phẩm, dịch vụ" }]} /></div>
      {xem === "nv" && <div className="w-72"><Chon ariaLabel="Nhân viên / nhóm" giaTri={dt} onDoi={(v) => dat("dt", v)} luaChon={doiTuong} /></div>}
      {xem === "sp" && <div className="w-72"><Chon ariaLabel="Sản phẩm, dịch vụ, thẻ" giaTri={muc} onDoi={(v) => dat("muc", v)} luaChon={mucLC} /></div>}
      {chiNhanh && chiNhanh.length > 1 && <div className="w-48"><Chon ariaLabel="Chi nhánh" giaTri={cn} onDoi={(v) => dat("cn", v)} luaChon={[{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...chiNhanh]} /></div>}
      {xem !== "sp" && <div className="w-52"><Chon ariaLabel="Loại" giaTri={loai} onDoi={(v) => dat("loai", v)} luaChon={[{ gia_tri: "", nhan: "Mọi loại" }, { gia_tri: "dich_vu", nhan: "Dịch vụ" }, { gia_tri: "san_pham", nhan: "Sản phẩm" }, { gia_tri: "goi_the", nhan: "Thẻ / liệu trình" }]} /></div>}
      <form onSubmit={(e) => { e.preventDefault(); dat("q", chu.trim()); }} className="flex gap-2">
        <input value={chu} onChange={(e) => setChu(e.target.value)} placeholder={xem === "sp" ? "Tìm nhân viên" : "Tìm tên, mã"} aria-label="Tìm trong tỉ lệ hoa hồng" className={`${O_NHAP} w-56`} />
        <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
      </form>
    </div>
  );
}

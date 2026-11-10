"use client";

import { useState } from "react";
import { NgayChon } from "./NgayChon";
import { Chon } from "./Chon";
import { khongRoNam, ngaySinhKhongNam } from "@/lib/ngay-sinh";

const THANG = Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Tháng ${i + 1}` }));
const soNgay = (thang: number) => (thang ? new Date(Date.UTC(1904, thang, 0)).getUTCDate() : 31); // 1904 năm nhuận: tháng 2 có 29

/** Ô ngày sinh khách: chọn đủ ngày/tháng/năm, hoặc bật "Không rõ năm" để chỉ chọn ngày + tháng (chị Lâm 10/11/2026).
 * Giá trị trả ra vẫn là một chuỗi yyyy-mm-dd; không rõ năm = năm quy ước 1904 (xem lib/ngay-sinh). */
export function ONgaySinh({ id, giaTri, onDoi }: { id?: string; giaTri: string; onDoi: (v: string) => void }) {
  const [khongNam, setKhongNam] = useState(khongRoNam(giaTri));
  const [ngay, setNgay] = useState(giaTri ? String(Number(giaTri.slice(8, 10))) : "");
  const [thang, setThang] = useState(giaTri ? String(Number(giaTri.slice(5, 7))) : "");

  const datNgayThang = (d: string, m: string) => {
    const toiDa = soNgay(Number(m));
    const dd = d && Number(d) > toiDa ? "" : d;
    setNgay(dd); setThang(m);
    onDoi(dd && m ? ngaySinhKhongNam(Number(dd), Number(m)) ?? "" : "");
  };
  const doiCheDo = (bat: boolean) => {
    setKhongNam(bat);
    if (bat) datNgayThang(ngay, thang); // giữ ngày/tháng đã chọn, bỏ năm
    else onDoi(""); // bật lại năm: chọn lại ngày đủ năm
  };

  return (
    <div className="space-y-1.5">
      {khongNam ? (
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <Chon id={id} luaChon={Array.from({ length: soNgay(Number(thang)) }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Ngày ${i + 1}` }))} giaTri={ngay} onDoi={(x) => datNgayThang(x, thang)} trong="Ngày" />
          <Chon luaChon={THANG} giaTri={thang} onDoi={(x) => datNgayThang(ngay, x)} trong="Tháng" ariaLabel="Tháng sinh" />
        </div>
      ) : (
        <NgayChon id={id} giaTri={giaTri} tuNam={1900} onDoi={(x) => { onDoi(x); if (x) { setNgay(String(Number(x.slice(8, 10)))); setThang(String(Number(x.slice(5, 7)))); } }} />
      )}
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[12.5px] text-muc-2">
        <input type="checkbox" checked={khongNam} onChange={(e) => doiCheDo(e.target.checked)} className="h-4 w-4 accent-nhan" />
        Không rõ năm (chỉ biết ngày + tháng)
      </label>
    </div>
  );
}

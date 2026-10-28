"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { boDau } from "@/lib/dinh-dang";
import { O_NHAP } from "@/components/ui/dinh-dang";

export type NhomDichVu = { ten: string; dichVu: { id: string; ma: string; ten: string; soVatTu: number }[] };

/** Cột trái "Chọn dịch vụ để cài đặt" của Công thức chi phí (SalonHero #/service_consumption_settings): ô tìm kiếm + dịch vụ gom theo nhóm; bấm một dịch vụ thì mở định mức bên phải. */
export function DanhSachDichVu({ nhom, chon }: { nhom: NhomDichVu[]; chon: string }) {
  const [tim, setTim] = useState("");
  const k = boDau(tim.trim());
  const loc = nhom.map((n) => ({ ...n, dichVu: n.dichVu.filter((d) => !k || boDau(`${d.ten} ${d.ma}`).includes(k)) })).filter((n) => n.dichVu.length > 0);
  return (
    <div className="the-noi the-noi-thap p-3">
      <p className="mb-2 px-1 text-[14px] font-semibold text-muc">Chọn dịch vụ để cài đặt</p>
      <div className="relative mb-2">
        <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm kiếm" aria-label="Tìm dịch vụ" className={`${O_NHAP} pr-9`} autoComplete="off" />
        <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
      </div>
      <div className="max-h-[320px] overflow-y-auto lg:max-h-[68vh]">
        {loc.map((n) => (
          <section key={n.ten}>
            <h2 className="sticky top-0 bg-giay-sang px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muc-3">{n.ten}</h2>
            <ul>
              {n.dichVu.map((d) => (
                <li key={d.id}>
                  <Link href={`/dinh-muc?dv=${d.id}`} aria-current={d.id === chon ? "page" : undefined} className={`flex items-center justify-between gap-2 rounded-nho px-2 py-2 text-[14px] ${d.id === chon ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}>
                    <span className="min-w-0 truncate">{d.ten}</span>
                    {d.soVatTu > 0 ? <span className="shrink-0 text-[12px] text-muc-3">{d.soVatTu} vật tư</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {loc.length === 0 && <p className="px-2 py-4 text-center text-[13px] text-muc-3">Không có dịch vụ nào khớp.</p>}
      </div>
    </div>
  );
}

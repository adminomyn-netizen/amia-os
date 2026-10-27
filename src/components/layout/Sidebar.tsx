"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { gomTheoNhom, MENU, mucDangChon } from "@/lib/nav";

type MucDto = { ten: string; duong_dan: string; nhom: string; moTa: string };

function DanhSach({ muc, dong, gon = false }: { muc: MucDto[]; dong?: () => void; gon?: boolean }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(muc.map((m) => MENU.find((x) => x.duong_dan === m.duong_dan)!).filter(Boolean));
  return (
    <nav className={`flex-1 space-y-5 overflow-y-auto pb-6 pt-3 ${gon ? "px-2.5" : "px-3.5"}`} aria-label="Menu chính">
      {nhom.map((g) => (
        <div key={g.nhom}>
          {gon ? <div className="mx-3 mb-2 border-t border-menu-vien" aria-hidden /> : <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu">{g.nhom}</div>}
          <ul className="space-y-0.5">
            {g.muc.map((m) => {
              const dangChon = mucDangChon(pathname, m.duong_dan);
              const Icon = m.icon;
              return (
                <li key={m.duong_dan}>
                  <Link
                    href={m.duong_dan}
                    onClick={dong}
                    title={gon ? `${m.ten} — ${m.moTa}` : m.moTa}
                    aria-current={dangChon ? "page" : undefined}
                    className={`muc-menu group flex items-center rounded-nho py-2.5 text-[14px] ${gon ? "justify-center px-0" : "gap-3 px-2.5"} ${
                      dangChon ? "muc-menu-chon font-medium text-menu-sang" : "text-menu-chu hover:bg-menu-hover hover:text-menu-sang"
                    }`}
                  >
                    <Icon strokeWidth={1.6} className={`h-[19px] w-[19px] shrink-0 ${dangChon ? "text-menu-nhan" : "text-menu-chu-phu group-hover:text-menu-chu"}`} />
                    <span className={gon ? "sr-only" : "flex-1 truncate"}>{m.ten}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const Logo = ({ rong = 104 }: { rong?: number }) => <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto" style={{ width: rong }} />;

const GHI_NHO = "amia_thu_gon";

export function Sidebar({ muc, thuGonBanDau }: { muc: MucDto[]; thuGonBanDau: boolean }) {
  const [gon, setGon] = useState(thuGonBanDau);
  const doi = () => {
    const moi = !gon;
    setGon(moi);
    document.cookie = `${GHI_NHO}=${moi ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <aside className={`thanh-ben khong-in sticky top-0 hidden h-screen shrink-0 flex-col self-start text-menu-chu lg:flex ${gon ? "w-[76px]" : "w-[248px]"}`} data-gon={gon}>
      <div className={`flex h-[76px] shrink-0 items-center ${gon ? "justify-center px-2" : "px-6"}`}><Logo rong={gon ? 48 : 104} /></div>
      <DanhSach muc={muc} gon={gon} />
      <button type="button" onClick={doi} aria-pressed={gon} title={gon ? "Mở rộng menu" : "Thu gọn menu"}
        className={`mx-3 mb-4 flex h-10 items-center rounded-nho text-[13px] text-menu-chu-phu hover:bg-menu-hover hover:text-menu-sang ${gon ? "justify-center" : "gap-3 px-3"}`}>
        {gon ? <ChevronsRight strokeWidth={1.6} className="h-[19px] w-[19px]" /> : <ChevronsLeft strokeWidth={1.6} className="h-[19px] w-[19px]" />}
        <span className={gon ? "sr-only" : ""}>Thu gọn menu</span>
      </button>
    </aside>
  );
}

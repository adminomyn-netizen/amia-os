"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { gomTheoNhom, MENU } from "@/lib/nav";

type MucDto = { ten: string; duong_dan: string; nhom: string; moTa: string };

function DanhSach({ muc, dong }: { muc: MucDto[]; dong?: () => void }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(muc.map((m) => MENU.find((x) => x.duong_dan === m.duong_dan)!).filter(Boolean));
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 pb-6 pt-3" aria-label="Menu chính">
      {nhom.map((g) => (
        <div key={g.nhom}>
          <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu">{g.nhom}</div>
          <ul className="space-y-0.5">
            {g.muc.map((m) => {
              const dangChon = pathname === m.duong_dan || pathname.startsWith(m.duong_dan + "/");
              const Icon = m.icon;
              return (
                <li key={m.duong_dan}>
                  <Link
                    href={m.duong_dan}
                    onClick={dong}
                    title={m.moTa}
                    aria-current={dangChon ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-nho px-2.5 py-2.5 text-[14px] transition-colors ${
                      dangChon ? "bg-menu-chon font-medium text-menu-sang" : "text-menu-chu hover:bg-menu-hover hover:text-menu-sang"
                    }`}
                  >
                    <Icon strokeWidth={1.6} className={`h-[19px] w-[19px] shrink-0 ${dangChon ? "text-menu-nhan" : "text-menu-chu-phu group-hover:text-menu-chu"}`} />
                    <span className="flex-1 truncate">{m.ten}</span>
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

const Logo = () => <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[104px]" />;

export function Sidebar({ muc }: { muc: MucDto[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col self-start bg-menu text-menu-chu lg:flex">
      <div className="flex h-[76px] shrink-0 items-center px-6"><Logo /></div>
      <DanhSach muc={muc} />
    </aside>
  );
}

export function MobileNav({ muc }: { muc: MucDto[] }) {
  const [mo, setMo] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setMo(true)} aria-label="Mở menu" className="p-2 text-muc lg:hidden"><Menu strokeWidth={1.6} className="h-6 w-6" /></button>
      {mo && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-muc/40" onClick={() => setMo(false)} />
          <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-menu text-menu-chu">
            <div className="flex h-[76px] items-center justify-between px-6">
              <Logo />
              <button type="button" onClick={() => setMo(false)} aria-label="Đóng" className="p-2 text-menu-chu-phu"><X strokeWidth={1.6} className="h-5 w-5" /></button>
            </div>
            <DanhSach muc={muc} dong={() => setMo(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

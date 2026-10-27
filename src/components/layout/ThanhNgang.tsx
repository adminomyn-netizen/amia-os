"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Ellipsis } from "lucide-react";
import { MENU, mucDangChon } from "@/lib/nav";
import { DongHo } from "./DongHo";
import { ChuongThongBao } from "./ChuongThongBao";
import { MenuNguoiDung } from "./MenuNguoiDung";

export type MucNgang = {
  ten: string; ngan: string; duong_dan: string; nhom: string; moTa: string;
  con: { nhan: string; the: { ten: string; duongDan: string; moTa: string }[] }[];
};
type Props = { muc: MucNgang[]; hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null };

/** Số mục hiện trên thanh theo bề rộng màn hình (lg / xl / 2xl / ≥1800px); mục còn lại gom vào nút "Thêm". */
const HIEN = [4, 6, 9, 13];
const LOP_HIEN = ["flex", "hidden xl:flex", "hidden 2xl:flex", "hidden min-[1800px]:flex"];
const LOP_AN_TRONG_THEM = ["hidden", "xl:hidden", "2xl:hidden", "min-[1800px]:hidden"];
const tang = (i: number) => HIEN.findIndex((k) => i < k);

/** Thanh menu ngang cho máy tính (≥1024px): logo, các mục lớn có menu thả xuống (rê chuột hoặc phím), nút "Thêm", rồi chi nhánh, giờ, chuông, tài khoản.
 *  Điện thoại/máy tính bảng dọc giữ thanh trên + thanh tab dưới như cũ. */
export function ThanhNgang({ muc, hoTen, vaiTro, chucDanh, email, chiNhanh, anh }: Props) {
  const pathname = usePathname();
  // Mở gắn với trang đang xem: đổi trang là tự đóng.
  const [moTai, setMoTai] = useState<{ ma: string; trang: string; trai: number } | null>(null);
  const mo = moTai && moTai.trang === pathname ? moTai : null;
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const thanh = useRef<HTMLElement>(null);

  const moBang = (ma: string, li: HTMLElement | null, rongBang: number) => {
    clearTimeout(hen.current);
    const r = li?.getBoundingClientRect();
    const trai = Math.max(16, Math.min(r?.left ?? 16, window.innerWidth - rongBang - 16));
    setMoTai({ ma, trang: pathname, trai });
  };
  const dong = (tre = 140) => { clearTimeout(hen.current); hen.current = setTimeout(() => setMoTai(null), tre); };
  useEffect(() => {
    if (!mo) return;
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMoTai(null);
    const ngoai = (e: MouseEvent) => { if (thanh.current && !thanh.current.contains(e.target as Node)) setMoTai(null); };
    document.addEventListener("keydown", phim); document.addEventListener("mousedown", ngoai);
    return () => { document.removeEventListener("keydown", phim); document.removeEventListener("mousedown", ngoai); };
  }, [mo]);

  const ngang = muc;
  const nhieu = ngang.length > HIEN[0];
  const lopNutThem = ngang.length <= HIEN[1] ? "xl:hidden" : ngang.length <= HIEN[2] ? "2xl:hidden" : ngang.length <= HIEN[3] ? "min-[1800px]:hidden" : "";
  const rongBang = (soNhom: number) => Math.min(Math.max(soNhom, 1), 3) * 252 + 32;

  return (
    <header ref={thanh} className="thanh-ngang khong-in sticky top-0 z-40 hidden h-[66px] items-center gap-3 px-6 xl:gap-5 xl:px-8 lg:flex" onMouseLeave={() => dong()}>
      <Link href="/trang-chu" className="mr-1 shrink-0" aria-label="AMIA OS, về trang chủ">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[84px]" />
      </Link>
      <nav className="flex min-w-0 flex-1 items-center gap-0.5" aria-label="Menu chính">
        {ngang.map((m, i) => {
          const dang = mucDangChon(pathname, m.duong_dan);
          const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
          const coCon = m.con.length > 0;
          const bangMo = mo?.ma === m.duong_dan;
          return (
            <div key={m.duong_dan} className={`${LOP_HIEN[tang(i)] ?? LOP_HIEN[3]} items-center`}
              onMouseEnter={(e) => (coCon ? moBang(m.duong_dan, e.currentTarget, rongBang(m.con.length)) : dong(0))}
              onFocus={(e) => (coCon ? moBang(m.duong_dan, e.currentTarget, rongBang(m.con.length)) : undefined)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) dong(0); }}>
              <Link href={m.duong_dan} aria-current={dang ? "page" : undefined} aria-haspopup={coCon ? "true" : undefined} aria-expanded={coCon ? bangMo : undefined}
                className="muc-ngang flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-3 text-[14px]" data-mo={bangMo}>
                <Icon strokeWidth={1.7} className="h-[17px] w-[17px] shrink-0" aria-hidden />
                {m.ngan}
                {coCon && <ChevronDown strokeWidth={1.8} className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${bangMo ? "rotate-180" : ""}`} aria-hidden />}
              </Link>
              {bangMo && coCon && (
                <div role="menu" aria-label={m.ten} style={{ position: "fixed", left: mo.trai, width: rongBang(m.con.length) }}
                  className="the-noi the-noi-thap vao bang-ngang top-[66px] z-50 max-w-[calc(100vw-32px)] overflow-hidden p-0">
                  <div className="flex items-start justify-between gap-4 border-b border-vien bg-giay-tram/60 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-muc">{m.ten}</div>
                      <div className="mt-0.5 line-clamp-1 text-[12.5px] text-muc-3">{m.moTa}</div>
                    </div>
                    <Link href={m.duong_dan} role="menuitem" className="shrink-0 pt-0.5 text-[13px] font-medium text-nhan-dam hover:underline">Xem tất cả →</Link>
                  </div>
                  <div className="grid gap-x-1 gap-y-4 p-4" style={{ gridTemplateColumns: `repeat(${Math.min(m.con.length, 3)}, minmax(0, 1fr))` }}>
                    {m.con.map((g) => (
                      <div key={g.nhan} className="min-w-0">
                        <div className="nhan-muc px-2.5 pb-1.5">{g.nhan}</div>
                        <ul>
                          {g.the.map((t) => (
                            <li key={t.ten}>
                              <Link href={t.duongDan} role="menuitem" title={t.moTa} className="muc-con block rounded-nho px-2.5 py-1.5 text-[13.5px] leading-snug text-muc-2">{t.ten}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {nhieu && (
          <div className={`${lopNutThem} items-center flex`}
            onMouseEnter={(e) => moBang("them", e.currentTarget, rongBang(2))}
            onFocus={(e) => moBang("them", e.currentTarget, rongBang(2))}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) dong(0); }}>
            <button type="button" aria-haspopup="true" aria-expanded={mo?.ma === "them"} data-mo={mo?.ma === "them"}
              onClick={(e) => (mo?.ma === "them" ? setMoTai(null) : moBang("them", e.currentTarget.parentElement, rongBang(2)))}
              className="muc-ngang flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-3 text-[14px]">
              <Ellipsis strokeWidth={1.7} className="h-[17px] w-[17px]" aria-hidden />Thêm
            </button>
            {mo?.ma === "them" && (
              <div role="menu" aria-label="Thêm chức năng" style={{ position: "fixed", left: mo.trai, width: rongBang(2) }} className="the-noi the-noi-thap vao bang-ngang top-[66px] z-50 max-w-[calc(100vw-32px)] overflow-hidden p-3">
                <ul className="grid grid-cols-2 gap-1">
                  {ngang.map((m, i) => {
                    const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
                    return (
                      <li key={m.duong_dan} className={LOP_AN_TRONG_THEM[tang(i)] ?? LOP_AN_TRONG_THEM[3]}>
                        <Link href={m.duong_dan} role="menuitem" className="muc-con flex items-start gap-3 rounded-nho px-3 py-2.5">
                          <Icon strokeWidth={1.6} className="mt-0.5 h-[18px] w-[18px] shrink-0 text-nhan" aria-hidden />
                          <span className="min-w-0"><span className="block text-[14px] font-medium text-muc">{m.ten}</span><span className="line-clamp-1 text-[12px] text-muc-3">{m.moTa}</span></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="flex shrink-0 items-center gap-1.5 xl:gap-3">
        <span className="hidden max-w-[170px] truncate text-[12.5px] text-menu-chu-phu 2xl:block" title={chiNhanh ?? "Mọi chi nhánh"}>{chiNhanh ?? "Mọi chi nhánh"}</span>
        <DongHo />
        <ChuongThongBao toi />
        <MenuNguoiDung hoTen={hoTen} vaiTro={vaiTro} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} toi />
      </div>
    </header>
  );
}

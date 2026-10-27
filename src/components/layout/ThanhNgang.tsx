"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MENU, mucDangChon } from "@/lib/nav";
import { DongHo } from "./DongHo";
import { ChuongThongBao } from "./ChuongThongBao";
import { MenuNguoiDung } from "./MenuNguoiDung";

export type MucNgang = {
  ten: string; ngan: string; duong_dan: string; nhom: string; moTa: string;
  con: { nhan: string; the: { ten: string; duongDan: string; moTa: string }[] }[];
};
type Props = { muc: MucNgang[]; hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null };

/** Mỗi mục lớn chỉ liệt kê tối đa từng này chức năng con trong bảng thả xuống; còn lại bấm "Xem tất cả". */
const TOI_DA_CON = 6;
const THU_TU_NHOM = ["Hằng ngày", "Vận hành", "Phát triển", "Hệ thống"];
const cotCua = (n: number) => (n <= 4 ? n : n <= 6 ? 3 : 4);
const rongBang = (n: number) => cotCua(n) * 236 + 32;

/** Thanh menu ngang cho máy tính (≥1024px): logo, 4 nút nhóm (Hằng ngày, Vận hành, Phát triển, Hệ thống), rồi đồng hồ, chuông, tài khoản.
 *  Rê chuột (hoặc Tab/Enter) vào một nhóm thì thả xuống các mục lớn của nhóm kèm chức năng con. Điện thoại/máy tính bảng dọc giữ thanh trên + thanh tab dưới. */
export function ThanhNgang({ muc, hoTen, vaiTro, chucDanh, email, chiNhanh, anh }: Props) {
  const pathname = usePathname();
  // Mở gắn với trang đang xem: đổi trang là tự đóng.
  const [moTai, setMoTai] = useState<{ ma: string; trang: string; trai: number } | null>(null);
  const mo = moTai && moTai.trang === pathname ? moTai : null;
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const thanh = useRef<HTMLElement>(null);

  const moBang = (ma: string, li: HTMLElement | null, rong: number) => {
    clearTimeout(hen.current);
    const r = li?.getBoundingClientRect();
    const trai = Math.max(16, Math.min(r?.left ?? 16, window.innerWidth - rong - 16));
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

  const nhom = THU_TU_NHOM.map((ten) => ({ ten, muc: muc.filter((m) => m.nhom === ten) })).filter((g) => g.muc.length > 0);

  return (
    <header ref={thanh} className="thanh-ngang khong-in sticky top-0 z-40 hidden h-[66px] items-center gap-4 px-6 lg:flex xl:px-8" onMouseLeave={() => dong()}>
      <Link href="/trang-chu" className="mr-2 shrink-0" aria-label="AMIA OS, về trang chủ">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[84px]" />
      </Link>
      <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Menu chính">
        {nhom.map((g) => {
          const dang = g.muc.some((m) => mucDangChon(pathname, m.duong_dan));
          const bangMo = mo?.ma === g.ten;
          const rong = rongBang(g.muc.length);
          return (
            <div key={g.ten} className="flex items-center"
              onMouseEnter={(e) => moBang(g.ten, e.currentTarget, rong)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) dong(0); }}>
              <button type="button" aria-haspopup="true" aria-expanded={bangMo} data-mo={bangMo}
                aria-current={dang ? "page" : undefined}
                onClick={(e) => (bangMo ? setMoTai(null) : moBang(g.ten, e.currentTarget.parentElement, rong))}
                className="muc-ngang flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-4 text-[14.5px]">
                {g.ten}
                <ChevronDown strokeWidth={1.8} className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${bangMo ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {bangMo && (
                <div role="menu" aria-label={g.ten} style={{ position: "fixed", left: mo.trai, width: rong }}
                  className="the-noi the-noi-thap vao bang-ngang top-[66px] z-50 max-w-[calc(100vw-32px)] overflow-y-auto overflow-x-hidden p-4">
                  <div className="grid gap-x-2 gap-y-5" style={{ gridTemplateColumns: `repeat(${cotCua(g.muc.length)}, minmax(0, 1fr))` }}>
                    {g.muc.map((m) => {
                      const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
                      const cacCon = m.con.flatMap((c) => c.the);
                      const dangMuc = mucDangChon(pathname, m.duong_dan);
                      return (
                        <div key={m.duong_dan} className="min-w-0">
                          <Link href={m.duong_dan} role="menuitem" aria-current={dangMuc ? "page" : undefined} className="muc-con flex items-center gap-2.5 rounded-nho px-2.5 py-2 font-semibold text-muc">
                            <Icon strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0 text-nhan" aria-hidden />
                            <span className="min-w-0 truncate text-[14.5px]">{m.ten}</span>
                          </Link>
                          {cacCon.length > 0 && (
                            <ul className="mt-0.5 border-l border-vien ml-[19px]">
                              {cacCon.slice(0, TOI_DA_CON).map((t) => (
                                <li key={t.ten}>
                                  <Link href={t.duongDan} role="menuitem" title={t.moTa} className="muc-con block rounded-nho px-3 py-1.5 text-[13.5px] leading-snug text-muc-2">{t.ten}</Link>
                                </li>
                              ))}
                              {cacCon.length > TOI_DA_CON && (
                                <li><Link href={m.duong_dan} role="menuitem" className="block px-3 py-1.5 text-[13px] font-medium text-nhan-dam hover:underline">Xem tất cả {cacCon.length} →</Link></li>
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-2 xl:gap-3">
        <DongHo />
        <ChuongThongBao toi />
        <MenuNguoiDung hoTen={hoTen} vaiTro={vaiTro} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} toi />
      </div>
    </header>
  );
}

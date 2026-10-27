"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grid2x2, X } from "lucide-react";
import { gomTheoNhom, MENU, mucDangChon } from "@/lib/nav";

type MucDto = { ten: string; duong_dan: string; nhom: string; moTa: string };
const UU_TIEN = ["/trang-chu", "/lich-hen", "/ban-hang", "/khach-hang", "/the", "/kho-mua-sam", "/noi-lam-viec", "/bao-cao"];

/** Thanh tab nổi dưới đáy cho điện thoại: 4 mục dùng nhiều nhất người này được phép + "Thêm" mở bảng đầy đủ chức năng. */
export function ThanhTabDuoi({ muc }: { muc: MucDto[] }) {
  const pathname = usePathname();
  // Mở gắn với trang đang xem: đổi trang là tự đóng, không cần effect.
  const [moTai, setMoTai] = useState<string | null>(null);
  const mo = moTai === pathname;
  const setMo = (b: boolean) => setMoTai(b ? pathname : null);
  useEffect(() => {
    if (!mo) return;
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo]);

  const co = new Set(muc.map((m) => m.duong_dan));
  const chinh = UU_TIEN.filter((d) => co.has(d)).slice(0, 4).map((d) => MENU.find((m) => m.duong_dan === d)!).filter(Boolean);
  const nhom = gomTheoNhom(muc.map((m) => MENU.find((x) => x.duong_dan === m.duong_dan)!).filter(Boolean));
  const dang = (d: string) => mucDangChon(pathname, d);

  return (
    <>
      <nav className="thanh-tab khong-in" aria-label="Điều hướng nhanh">
        {chinh.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.duong_dan} href={m.duong_dan} aria-current={dang(m.duong_dan) ? "page" : undefined}>
              <Icon strokeWidth={1.7} className="h-[22px] w-[22px]" />
              <span>{m.ten.length > 11 ? m.ten.split(" ")[0] : m.ten}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMo(true)} aria-haspopup="dialog" aria-expanded={mo}>
          <Grid2x2 strokeWidth={1.7} className="h-[22px] w-[22px]" /><span>Thêm</span>
        </button>
      </nav>
      {mo && (
        <div className="fixed inset-0 z-50 lg:hidden khong-in" role="dialog" aria-modal="true" aria-label="Tất cả chức năng">
          <button type="button" aria-label="Đóng" className="absolute inset-0 bg-muc/45" onClick={() => setMo(false)} />
          <div className="bang-duoi vao absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[18px] bg-giay-sang px-4 pb-6 pt-3 shadow-[0_-18px_40px_-12px_rgba(6,26,23,0.5)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-[3px] bg-vien-dam/50" aria-hidden />
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-semibold text-muc">Tất cả chức năng</h2><button type="button" onClick={() => setMo(false)} aria-label="Đóng" className="p-2 text-muc-3"><X strokeWidth={1.7} className="h-5 w-5" /></button></div>
            {nhom.map((g) => (
              <section key={g.nhom} className="mb-4">
                <h3 className="nhan-muc mb-2">{g.nhom}</h3>
                <ul className="grid grid-cols-3 gap-2.5">
                  {g.muc.map((m) => {
                    const Icon = m.icon;
                    return (
                      <li key={m.duong_dan}>
                        <Link href={m.duong_dan} aria-current={dang(m.duong_dan) ? "page" : undefined} className={`flex h-full min-h-[84px] flex-col items-center justify-center gap-2 rounded-[12px] border px-2 py-3 text-center text-[12.5px] leading-tight ${dang(m.duong_dan) ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien bg-giay text-muc-2"}`}>
                          <Icon strokeWidth={1.6} className="h-6 w-6" />{m.ten}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

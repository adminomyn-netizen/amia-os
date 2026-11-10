"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { KhungChoKhach } from "./KhungChoKhach";

/** Lối tắt vừa bấm (đường dẫn) — để khung hiện khung chờ NGAY trên máy, không đợi máy chủ trả trang (chị Lâm 10/11: bấm dưới 1s). */
const DangMoCtx = createContext<{ dangMo: string | null; mo: (href: string) => void }>({ dangMo: null, mo: () => {} });
export const useMoManKhach = () => useContext(DangMoCtx);

/** Khung màn Khách hàng: máy tính / iPad ngang (từ 1024px) chia hai cột — danh sách bên trái, hồ sơ bên phải.
 *  Điện thoại / iPad dọc: chỉ một khung một lúc — ở /khach-hang là danh sách, ở /khach-hang/[id] là hồ sơ toàn màn. Cột trái nằm trong layout nên giữ nguyên khi đổi khách. */
export function KhungHaiCot({ dau, danhSach, children }: { dau: React.ReactNode; danhSach: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const [cho, setCho] = useState<{ href: string; tu: string } | null>(null);
  // Trang mới đã về (đổi địa chỉ) thì bỏ khung chờ; mạng hỏng thì tự bỏ sau 15 giây để không kẹt.
  const dangMo = cho && cho.tu === pathname ? cho.href : null;
  useEffect(() => {
    if (!dangMo) return;
    const t = setTimeout(() => setCho(null), 15_000);
    return () => clearTimeout(t);
  }, [dangMo]);
  const coHoSo = useSelectedLayoutSegment() !== null || dangMo !== null;
  return (
    <DangMoCtx.Provider value={{ dangMo, mo: (href) => { if (href !== pathname) setCho({ href, tu: pathname }); } }}>
      <div className={coHoSo ? "hidden lg:block" : ""}>{dau}</div>
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside aria-label="Danh sách khách" className={`${coHoSo ? "hidden lg:flex" : "flex"} flex-col lg:sticky lg:top-[88px] lg:h-[calc(100dvh-104px)]`}>{danhSach}</aside>
        <section aria-label="Hồ sơ khách" className={`min-w-0 ${coHoSo ? "" : "hidden lg:block"}`}>{dangMo ? <KhungChoKhach /> : children}</section>
      </div>
    </DangMoCtx.Provider>
  );
}

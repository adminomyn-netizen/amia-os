"use client";

import { useSelectedLayoutSegment } from "next/navigation";

/** Khung màn Khách hàng: máy tính / iPad ngang (từ 1024px) chia hai cột — danh sách bên trái, hồ sơ bên phải.
 *  Điện thoại / iPad dọc: chỉ một khung một lúc — ở /khach-hang là danh sách, ở /khach-hang/[id] là hồ sơ toàn màn. Cột trái nằm trong layout nên giữ nguyên khi đổi khách. */
export function KhungHaiCot({ dau, danhSach, children }: { dau: React.ReactNode; danhSach: React.ReactNode; children: React.ReactNode }) {
  const coHoSo = useSelectedLayoutSegment() !== null;
  return (
    <>
      <div className={coHoSo ? "hidden lg:block" : ""}>{dau}</div>
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside aria-label="Danh sách khách" className={`${coHoSo ? "hidden lg:flex" : "flex"} flex-col lg:sticky lg:top-[88px] lg:h-[calc(100dvh-104px)]`}>{danhSach}</aside>
        <section aria-label="Hồ sơ khách" className={`min-w-0 ${coHoSo ? "" : "hidden lg:block"}`}>{children}</section>
      </div>
    </>
  );
}

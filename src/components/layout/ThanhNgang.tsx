"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU, mucDangChon } from "@/lib/nav";

export type MucNgang = {
  ten: string; ngan: string; duong_dan: string; nhom: string; moTa: string;
  con: { nhan: string; the: { ten: string; duongDan: string; moTa: string }[] }[];
};

/** Thanh bên dọc cho máy tính (≥1024px), kiểu BeDental: khối nổi bo góc màu đặc trưng của AMIA, logo ở trên,
 *  TOÀN BỘ chức năng xếp dọc thành nút có biểu tượng; nút đang mở sáng vàng. Điện thoại dùng thanh trên + thanh tab dưới. */
export function ThanhBen({ muc }: { muc: MucNgang[] }) {
  const pathname = usePathname();
  return (
    <aside className="thanh-ben khong-in sticky top-3 m-3 mr-0 hidden h-[calc(100vh-24px)] w-[240px] shrink-0 flex-col rounded-vua lg:flex">
      <Link href="/trang-chu" className="block px-6 pb-4 pt-6" aria-label="AMIA OS, về trang chủ">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[96px]" />
      </Link>
      <nav aria-label="Menu chính" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {muc.map((m) => {
            const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
            const dang = mucDangChon(pathname, m.duong_dan);
            return (
              <li key={m.duong_dan}>
                <Link href={m.duong_dan} title={m.moTa} aria-current={dang ? "page" : undefined} className="muc-menu flex h-11 items-center gap-3 rounded-nho px-3.5 text-[14.5px]">
                  <Icon strokeWidth={1.7} className="h-[19px] w-[19px] shrink-0" aria-hidden /><span className="min-w-0 truncate">{m.ten}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

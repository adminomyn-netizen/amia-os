"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { MENU, mucDangChon } from "@/lib/nav";
import { ChuongThongBao } from "./ChuongThongBao";
import { MenuNguoiDung, type NhomCaiDat } from "./MenuNguoiDung";
import { TimKiemChung } from "./TimKiemChung";

export type MucNgang = {
  ten: string; ngan: string; duong_dan: string; nhom: string; moTa: string;
  con: { nhan: string; the: { ten: string; duongDan: string; moTa: string }[] }[];
};
type Props = { muc: MucNgang[]; hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; caiDat?: NhomCaiDat[] };

/** Đầu trang cho máy tính (≥1024px), theo kiểu BeDental nhưng nằm ngang: hàng trên có logo, ô tìm chung, Hướng dẫn sử dụng, chuông, tài khoản;
 *  hàng dưới trải TOÀN BỘ chức năng thành các nút có biểu tượng (không gom nhóm, không thả xuống), nút đang mở sáng lên. Hẹp thì xuống dòng. */
export function ThanhNgang({ muc, hoTen, vaiTro, chucDanh, email, chiNhanh, anh, caiDat }: Props) {
  const pathname = usePathname();
  return (
    <header className="thanh-ngang khong-in sticky top-0 z-40 hidden px-6 pb-3 pt-2.5 lg:block xl:px-8">
      <div className="grid h-[52px] grid-cols-[auto_1fr_auto] items-center gap-5">
        <Link href="/trang-chu" className="shrink-0" aria-label="AMIA OS, về trang chủ">
          <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[84px]" />
        </Link>
        <div className="flex justify-center"><TimKiemChung toi rong="w-full max-w-[520px]" /></div>
        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          <Link href="/huong-dan" aria-current={pathname === "/huong-dan" ? "page" : undefined} title="Hướng dẫn sử dụng" className="muc-ngang flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-3 text-[14px]">
            <CircleHelp strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0" aria-hidden /><span className="hidden xl:inline">Hướng dẫn sử dụng</span>
          </Link>
          <ChuongThongBao toi />
          <MenuNguoiDung hoTen={hoTen} vaiTro={vaiTro} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} caiDat={caiDat} toi />
        </div>
      </div>
      <nav aria-label="Menu chính" className="mt-2.5 flex flex-wrap gap-1.5 rounded-vua border border-menu-vien bg-menu-hover p-1.5">
        {muc.map((m) => {
          const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
          const dang = mucDangChon(pathname, m.duong_dan);
          return (
            <Link key={m.duong_dan} href={m.duong_dan} title={m.moTa} aria-current={dang ? "page" : undefined}
              className="muc-menu flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-3.5 text-[14px]">
              <Icon strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0" aria-hidden />{m.ngan}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

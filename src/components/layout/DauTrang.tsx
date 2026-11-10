"use client";

import { LinkNhe } from "@/components/ui/LinkNhe";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, CircleHelp, Search, X } from "lucide-react";
import { MENU, mucDangChon } from "@/lib/nav";
import { NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import { MenuNguoiDung, type CoSoMenu, type NhomCaiDat } from "./MenuNguoiDung";
import { ChuongThongBao } from "./ChuongThongBao";
import { TimKiemChung } from "./TimKiemChung";

/** Đầu trang cho điện thoại / máy tính bảng dọc (máy tính dùng DauTrangMay), theo kiểu BeDental: nút quay lại tròn (trừ Trang chủ) + tên màn hình;
 *  bên phải tìm kiếm (mở ô tìm ngay dưới), Hướng dẫn, chuông và avatar. */
export function DauTrang({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, caiDat, coSo }: { hoTen: string; vaiTro: VaiTro; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; caiDat?: NhomCaiDat[]; coSo?: CoSoMenu[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tim, setTim] = useState(false);
  const tieuDe = pathname === "/huong-dan" ? "Hướng dẫn sử dụng" : MENU.find((m) => mucDangChon(pathname, m.duong_dan))?.ten ?? "AMIA OS";
  const trangChu = pathname === "/trang-chu";
  return (
    <header className="dau-trang khong-in sticky top-0 z-30 px-3 lg:hidden">
      <div className="flex h-16 items-center gap-2">
        {!trangChu && (
          <button type="button" onClick={() => router.back()} aria-label="Quay lại" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-vua border border-vien bg-giay-sang text-muc-2">
            <ChevronLeft strokeWidth={1.8} className="h-5 w-5" aria-hidden />
          </button>
        )}
        <LinkNhe href="/trang-chu" className="min-w-0 flex-1 truncate text-[17px] font-semibold text-muc">{tieuDe}</LinkNhe>
        <button type="button" onClick={() => setTim((x) => !x)} aria-label={tim ? "Đóng tìm kiếm" : "Tìm kiếm"} aria-expanded={tim} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-vua text-muc-2 hover:bg-giay-tram">
          {tim ? <X strokeWidth={1.7} className="h-5 w-5" aria-hidden /> : <Search strokeWidth={1.7} className="h-5 w-5" aria-hidden />}
        </button>
        <LinkNhe href="/huong-dan" aria-label="Hướng dẫn sử dụng" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-vua text-muc-2 hover:bg-giay-tram"><CircleHelp strokeWidth={1.7} className="h-5 w-5" aria-hidden /></LinkNhe>
        <ChuongThongBao />
        <MenuNguoiDung hoTen={hoTen} vaiTro={NHAN_VAI_TRO[vaiTro]} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} caiDat={caiDat} coSo={coSo} />
      </div>
      {tim && <div className="pb-3"><TimKiemChung rong="w-full" /></div>}
    </header>
  );
}

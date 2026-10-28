import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { ChuongThongBao } from "./ChuongThongBao";
import { MenuNguoiDung, type NhomCaiDat } from "./MenuNguoiDung";
import { TimKiemChung } from "./TimKiemChung";

type Props = { hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; caiDat?: NhomCaiDat[] };

/** Đầu trang MÀU TRẮNG cho máy tính: ô tìm chung bên trái; bên phải Hướng dẫn sử dụng, chuông, tài khoản (bấm mở Cài đặt hệ thống, đổi thông tin, đăng xuất). */
export function DauTrangMay({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, caiDat }: Props) {
  return (
    <header className="dau-trang-may khong-in sticky top-0 z-30 hidden h-[68px] items-center gap-4 px-8 lg:flex">
      <TimKiemChung rong="w-full max-w-[460px]" />
      <div className="ml-auto flex shrink-0 items-center gap-2 xl:gap-3">
        <Link href="/huong-dan" title="Hướng dẫn sử dụng" className="flex h-10 items-center gap-2 whitespace-nowrap rounded-nho border border-vien px-3.5 text-[14px] text-muc-2 hover:bg-giay-tram">
          <CircleHelp strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0 text-nhan" aria-hidden /><span className="hidden xl:inline">Hướng dẫn sử dụng</span>
        </Link>
        <ChuongThongBao />
        <MenuNguoiDung hoTen={hoTen} vaiTro={vaiTro} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} caiDat={caiDat} />
      </div>
    </header>
  );
}

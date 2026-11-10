import Image from "next/image";
import { LinkNhe } from "@/components/ui/LinkNhe";
import { CircleHelp } from "lucide-react";
import { ChuongThongBao } from "./ChuongThongBao";
import { MenuNguoiDung, type CoSoMenu, type NhomCaiDat } from "./MenuNguoiDung";
import { TimKiemChung } from "./TimKiemChung";

type Props = { hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; caiDat?: NhomCaiDat[]; coSo?: CoSoMenu[] };

/** Đầu trang MÀU TRẮNG cho máy tính, chạy suốt chiều ngang, nằm trên thanh bên: logo AMIA bên trái, ô tìm chung,
 *  rồi Hướng dẫn sử dụng, chuông, tài khoản (bấm mở Cài đặt hệ thống, đổi thông tin, đăng xuất). */
export function DauTrangMay({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, caiDat, coSo }: Props) {
  return (
    <header className="dau-trang-may khong-in sticky top-0 z-30 hidden h-[72px] items-center gap-6 px-6 lg:flex xl:px-8">
      <LinkNhe href="/trang-chu" className="shrink-0" aria-label="AMIA OS, về trang chủ">
        <Image src="/logo-amia.png" alt="AMIA Beauty Center" width={120} height={52} priority className="h-auto w-[92px]" />
      </LinkNhe>
      <TimKiemChung rong="w-full max-w-[460px]" />
      <div className="ml-auto flex shrink-0 items-center gap-2 xl:gap-3">
        <LinkNhe href="/huong-dan" title="Hướng dẫn sử dụng" className="flex h-10 items-center gap-2 whitespace-nowrap rounded-nho bg-nhan px-3.5 text-[14px] font-medium text-white hover:opacity-90">
          <CircleHelp strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0" aria-hidden /><span className="hidden xl:inline">Hướng dẫn sử dụng</span>
        </LinkNhe>
        <ChuongThongBao />
        <MenuNguoiDung hoTen={hoTen} vaiTro={vaiTro} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} caiDat={caiDat} coSo={coSo} />
      </div>
    </header>
  );
}

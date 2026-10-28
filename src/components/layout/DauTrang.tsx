import { NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { MenuNguoiDung, type NhomCaiDat } from "./MenuNguoiDung";
import { TimKiemChung } from "./TimKiemChung";
import { ChuongThongBao } from "./ChuongThongBao";

/** Đầu trang cho điện thoại/máy tính bảng dọc (máy tính dùng ThanhNgang): bên phải chuông + một nút "avatar · tên" mở bảng tài khoản (vị trí, đổi thông tin, đăng xuất). */
export function DauTrang({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, caiDat }: { hoTen: string; vaiTro: VaiTro; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; caiDat?: NhomCaiDat[] }) {
  return (
    <header className="dau-trang khong-in sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 lg:hidden">
      <TimKiemChung rong="min-w-0 flex-1 sm:max-w-sm" />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <Link href="/huong-dan" aria-label="Hướng dẫn sử dụng" className="flex h-10 w-10 items-center justify-center rounded-nho text-muc-2 hover:bg-giay-tram"><CircleHelp strokeWidth={1.7} className="h-5 w-5" aria-hidden /></Link>
        <ChuongThongBao />
        <MenuNguoiDung hoTen={hoTen} vaiTro={NHAN_VAI_TRO[vaiTro]} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} caiDat={caiDat} />
      </div>
    </header>
  );
}

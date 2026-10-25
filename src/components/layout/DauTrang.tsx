import Link from "next/link";
import { LogOut } from "lucide-react";
import { dangXuat } from "@/app/dang-nhap/actions";
import { NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import { MobileNav } from "./Sidebar";

export function DauTrang({ hoTen, vaiTro, chiNhanh, muc }: { hoTen: string; vaiTro: VaiTro; chiNhanh: string | null; muc: { ten: string; duong_dan: string; nhom: string; moTa: string }[] }) {
  return (
    <header className="khong-in sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-vien bg-giay-sang/95 px-4 lg:px-12">
      <MobileNav muc={muc} />
      <div className="hidden text-[13px] text-muc-3 lg:block">{chiNhanh ? `Chi nhánh: ${chiNhanh}` : "Mọi chi nhánh"}</div>
      <div className="flex items-center gap-3">
        <Link href="/tai-khoan" title="Tài khoản của tôi" className="text-right leading-tight hover:opacity-80">
          <div className="text-[14px] font-medium text-muc">{hoTen}</div>
          <div className="text-[12px] text-muc-3">{NHAN_VAI_TRO[vaiTro]}</div>
        </Link>
        <form action={dangXuat}>
          <button type="submit" aria-label="Đăng xuất" title="Đăng xuất" className="rounded-nho p-2 text-muc-3 hover:bg-giay-tram hover:text-muc">
            <LogOut strokeWidth={1.6} className="h-[19px] w-[19px]" />
          </button>
        </form>
      </div>
    </header>
  );
}

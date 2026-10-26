import { NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import { MobileNav } from "./Sidebar";
import { DongHo } from "./DongHo";
import { MenuNguoiDung } from "./MenuNguoiDung";
import { ChuongThongBao } from "./ChuongThongBao";

type Muc = { ten: string; duong_dan: string; nhom: string; moTa: string };

/** Đầu trang gọn: bên trái chi nhánh, bên phải đồng hồ + một nút "avatar · tên" mở bảng tài khoản (vị trí, đổi thông tin, đăng xuất). */
export function DauTrang({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, muc }: { hoTen: string; vaiTro: VaiTro; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; muc: Muc[] }) {
  return (
    <header className="dau-trang khong-in sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 lg:px-12">
      <MobileNav muc={muc} />
      <div className="hidden text-[13px] text-muc-3 lg:block">{chiNhanh ? `Chi nhánh: ${chiNhanh}` : "Mọi chi nhánh"}</div>
      <div className="flex items-center gap-2.5 sm:gap-4">
        <DongHo />
        <ChuongThongBao />
        <MenuNguoiDung hoTen={hoTen} vaiTro={NHAN_VAI_TRO[vaiTro]} chucDanh={chucDanh} email={email} chiNhanh={chiNhanh} anh={anh} />
      </div>
    </header>
  );
}

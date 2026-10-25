import { layNguoiDungDangNhap } from "@/lib/auth";
import { NHAN_VAI_TRO } from "@/lib/quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NutHop } from "@/components/ui/BieuMau";
import { doiMatKhau } from "./actions";

export default async function TrangTaiKhoan() {
  const nd = await layNguoiDungDangNhap();
  return (
    <>
      <TieuDeTrang tieuDe="Tài khoản của tôi" phu={`${nd.hoTen} · ${NHAN_VAI_TRO[nd.vaiTro]}`} />
      <dl className="mb-6 grid max-w-xl gap-4 sm:grid-cols-2"><div className="border-b border-vien pb-3"><dt className="nhan-muc">Email đăng nhập</dt><dd className="mt-1 text-[15px]">{nd.email}</dd></div><div className="border-b border-vien pb-3"><dt className="nhan-muc">Vai trò</dt><dd className="mt-1 text-[15px]">{NHAN_VAI_TRO[nd.vaiTro]}</dd></div></dl>
      <NutHop nhan="Đổi mật khẩu" tieuDe="Đổi mật khẩu" truong={[{ ten: "mat_khau_cu", nhan: "Mật khẩu hiện tại", loai: "mat_khau_an", batBuoc: true, rong: true }, { ten: "mat_khau_moi", nhan: "Mật khẩu mới (≥ 8 ký tự)", loai: "mat_khau_an", batBuoc: true, rong: true }]} action={doiMatKhau} />
    </>
  );
}

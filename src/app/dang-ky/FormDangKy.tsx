"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guiYeuCauTaiKhoan } from "./actions";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

export function FormDangKy({ chiNhanh }: { chiNhanh: { id: string; ten: string }[] }) {
  const [kq, action, dang] = useActionState(guiYeuCauTaiKhoan, undefined);
  if (kq?.ok) {
    return (
      <div>
        <h2 className="chu-tieu-de text-[26px] text-muc">Đã gửi yêu cầu</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muc-2">Bộ phận Kỹ thuật sẽ kiểm tra và cấp tài khoản. Khi có tài khoản, bạn đăng nhập bằng email vừa khai và mật khẩu do Kỹ thuật báo; lần đầu hệ thống sẽ yêu cầu đổi mật khẩu.</p>
        <Link href="/dang-nhap" className="nut-vang mt-7 flex h-[50px] w-full items-center justify-center rounded-nho text-[15px]">Về trang đăng nhập</Link>
      </div>
    );
  }
  return (
    <>
      <h2 className="chu-tieu-de text-[30px] text-muc">Đăng ký tài khoản</h2>
      <p className="mb-7 mt-1 text-[14px] text-muc-3">Gửi thông tin để bộ phận Kỹ thuật cấp tài khoản. Tài khoản chỉ dùng được sau khi được duyệt.</p>
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="ho_ten" className={NHAN_O}>Họ và tên</label>
          <input id="ho_ten" name="ho_ten" required maxLength={100} autoComplete="name" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="email" className={NHAN_O}>Email</label>
          <input id="email" name="email" type="email" required maxLength={160} autoComplete="email" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="dien_thoai" className={NHAN_O}>Số điện thoại</label>
          <input id="dien_thoai" name="dien_thoai" type="tel" inputMode="tel" required autoComplete="tel" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="chi_nhanh_id" className={NHAN_O}>Chi nhánh làm việc</label>
          <Chon id="chi_nhanh_id" ten="chi_nhanh_id" batBuoc luaChon={chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} trong="Chọn chi nhánh" />
        </div>
        <div>
          <label htmlFor="vi_tri" className={NHAN_O}>Vị trí công việc (không bắt buộc)</label>
          <input id="vi_tri" name="vi_tri" maxLength={100} placeholder="Lễ tân, kỹ thuật viên, kế toán…" className={O_NHAP} />
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {kq?.loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{kq.loi}</div>}
        <button type="submit" disabled={dang} className="nut-vang h-[50px] w-full rounded-nho text-[15px] disabled:opacity-60">{dang ? "Đang gửi" : "Gửi yêu cầu đăng ký"}</button>
        <p className="text-center text-[13.5px] text-muc-3">Đã có tài khoản? <Link href="/dang-nhap" className="text-nhan-dam hover:underline">Đăng nhập</Link></p>
      </form>
    </>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { dangKyTaiKhoan } from "./actions";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

export function FormDangKy({ chiNhanh }: { chiNhanh: { id: string; ten: string }[] }) {
  const [kq, action, dang] = useActionState(dangKyTaiKhoan, undefined);
  return (
    <>
      <h2 className="chu-tieu-de text-[30px] text-muc">Đăng ký tài khoản</h2>
      <p className="mb-7 mt-1 text-[14px] text-muc-3">Tạo tài khoản và dùng được ngay. Bộ phận Kỹ thuật sẽ chỉnh vị trí và quyền cho bạn sau.</p>
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
          <label htmlFor="mat_khau" className={NHAN_O}>Mật khẩu (tối thiểu 8 ký tự)</label>
          <input id="mat_khau" name="mat_khau" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="mat_khau2" className={NHAN_O}>Nhập lại mật khẩu</label>
          <input id="mat_khau2" name="mat_khau2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={O_NHAP} />
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {kq?.loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{kq.loi}</div>}
        <button type="submit" disabled={dang} className="nut-vang h-[50px] w-full rounded-nho text-[15px] disabled:opacity-60">{dang ? "Đang tạo tài khoản" : "Đăng ký"}</button>
        <p className="text-center text-[13.5px] text-muc-3">Đã có tài khoản? <Link href="/dang-nhap" className="text-nhan-dam hover:underline">Đăng nhập</Link></p>
      </form>
    </>
  );
}

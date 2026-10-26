"use client";

import Image from "next/image";
import { useActionState } from "react";
import { dangNhap } from "./actions";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="nen-toi hidden flex-col justify-between p-14 text-menu-chu lg:flex">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={180} height={78} priority className="h-auto w-[170px]" />
        <div>
          <h1 className="chu-tieu-de text-[44px] leading-[1.12] text-menu-sang">Mỗi vật tư ra khỏi kho<br />đều có phiếu và người nhận.</h1>
          <p className="mt-4 max-w-md text-[15px] text-menu-chu-phu">Khách hàng, lịch hẹn, thu ngân, thẻ liệu trình và cấp vật tư trước ca, gói trong một phần mềm riêng của AMIA.</p>
        </div>
        <p className="text-[12px] text-menu-chu-phu">AMIA Beauty Center · Phòng khám da liễu</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="the-noi vao w-full max-w-[420px] p-8 pt-9">
          <Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-8 h-auto w-[130px] lg:hidden" />
          <h2 className="chu-tieu-de text-[34px] text-muc">Đăng nhập</h2>
          <p className="mb-7 mt-1 text-[14px] text-muc-3">Dùng tài khoản do bộ phận Kỹ thuật cấp.</p>
          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="email" className={NHAN_O}>Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className={O_NHAP} />
            </div>
            <div>
              <label htmlFor="mat_khau" className={NHAN_O}>Mật khẩu</label>
              <input id="mat_khau" name="mat_khau" type="password" required autoComplete="current-password" className={O_NHAP} />
            </div>
            {state?.loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{state.loi}</div>}
            <button type="submit" disabled={dangXuLy} className="nut-vang h-[50px] w-full rounded-nho text-[15px] disabled:opacity-60">{dangXuLy ? "Đang đăng nhập" : "Đăng nhập"}</button>
            <p className="text-[13px] text-muc-3">Quên mật khẩu hoặc cần thêm tài khoản: nhờ bộ phận Kỹ thuật đặt lại.</p>
          </form>
        </div>
      </section>
    </main>
  );
}

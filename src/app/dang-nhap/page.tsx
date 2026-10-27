"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { dangNhap } from "./actions";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

function ThongBaoDangKy() {
  const sp = useSearchParams();
  return sp.get("dk") === "1" ? <div role="status" className="mb-5 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Đăng ký thành công. Đăng nhập bằng email và mật khẩu vừa tạo.</div> : null;
}

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="nen-toi hidden flex-col justify-between p-14 text-menu-chu lg:flex">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={180} height={78} priority className="h-auto w-[170px]" />
        <div>
          <h1 className="chu-tieu-de text-[38px] leading-[1.15] text-menu-sang">Mỗi vật tư ra khỏi kho<br />đều có phiếu và người nhận.</h1>
          <p className="mt-4 max-w-md text-[15px] text-menu-chu-phu">Khách hàng, lịch hẹn, thu ngân, thẻ liệu trình và cấp vật tư trước ca, gói trong một phần mềm riêng của AMIA.</p>
        </div>
        <p className="text-[12px] text-menu-chu-phu">AMIA Beauty Center · Phòng khám da liễu</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="the-noi vao w-full max-w-[420px] p-8 pt-9">
          <Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-8 h-auto w-[130px] lg:hidden" />
          <h2 className="chu-tieu-de text-[30px] text-muc">Đăng nhập</h2>
          <p className="mb-7 mt-1 text-[14px] text-muc-3">Đăng nhập bằng email và mật khẩu của bạn. Chưa có tài khoản thì đăng ký ngay bên dưới.</p>
          <Suspense fallback={null}><ThongBaoDangKy /></Suspense>
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
            <Link href="/dang-ky" className="flex h-[50px] w-full items-center justify-center rounded-nho border border-vien-dam text-[15px] text-muc-2 hover:bg-giay-tram">Chưa có tài khoản? Đăng ký</Link>
            <p className="text-[13px] text-muc-3">Quên mật khẩu: nhờ bộ phận Kỹ thuật đặt lại.</p>
          </form>
        </div>
      </section>
    </main>
  );
}

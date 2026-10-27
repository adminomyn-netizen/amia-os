"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { guiLienKetDatLai } from "./actions";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

export default function TrangQuenMatKhau() {
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(false);
  const [loi, setLoi] = useState("");

  async function gui(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim().toLowerCase();
    if (!email) return;
    setDangGui(true);
    setLoi("");
    const kq = await guiLienKetDatLai(email);
    setDangGui(false);
    if (kq.loi) setLoi(kq.loi);
    else setDaGui(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="the-noi vao w-full max-w-[420px] p-8 pt-9">
        <Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-8 h-auto w-[130px]" />
        <h1 className="chu-tieu-de text-[30px] text-muc">Quên mật khẩu</h1>
        {daGui ? (
          <div className="mt-5 space-y-4">
            <div role="status" className="rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Nếu email này có trong hệ thống, thư đặt lại mật khẩu đã được gửi. Mở thư và bấm vào liên kết (kiểm cả mục Thư rác).</div>
            <Link href="/dang-nhap" className="flex h-[50px] w-full items-center justify-center rounded-nho border border-vien-dam text-[15px] text-muc-2 hover:bg-giay-tram">Quay lại đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={gui} className="mt-1 space-y-5">
            <p className="text-[14px] text-muc-3">Nhập email đã đăng ký, hệ thống gửi liên kết để bạn tự đặt mật khẩu mới.</p>
            <div>
              <label htmlFor="email" className={NHAN_O}>Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className={O_NHAP} />
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <button type="submit" disabled={dangGui} className="nut-vang h-[50px] w-full rounded-nho text-[15px] disabled:opacity-60">{dangGui ? "Đang gửi" : "Gửi liên kết đặt lại"}</button>
            <Link href="/dang-nhap" className="flex h-[50px] w-full items-center justify-center rounded-nho border border-vien-dam text-[15px] text-muc-2 hover:bg-giay-tram">Quay lại đăng nhập</Link>
          </form>
        )}
      </div>
    </main>
  );
}

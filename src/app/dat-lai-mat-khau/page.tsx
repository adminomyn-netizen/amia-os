"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { mayKhachDatLai } from "@/lib/supabase/dat-lai";
import { NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";

type TrangThai = "cho" | "san_sang" | "het_han" | "xong";

export default function TrangDatLaiMatKhau() {
  const may = useRef<ReturnType<typeof mayKhachDatLai> | null>(null);
  const [tt, setTt] = useState<TrangThai>("cho");
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    const m = mayKhachDatLai();
    may.current = m;
    // Liên kết trong thư mang token_hash; chỉ đổi ra phiên khi người dùng mở trang này (máy quét thư không chạy JS nên không làm cháy liên kết).
    const sp = new URLSearchParams(window.location.search);
    const ma = sp.get("token_hash");
    const thu = ma && sp.get("type") === "recovery" ? m.auth.verifyOtp({ token_hash: ma, type: "recovery" }) : Promise.resolve(null);
    let huy = false;
    thu.then((kq) => {
      if (!huy) setTt(kq && !kq.error && kq.data.session ? "san_sang" : "het_han");
    });
    return () => { huy = true; };
  }, []);

  async function luu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const moi = String(fd.get("moi") || ""), lai = String(fd.get("lai") || "");
    if (moi.length < 8) return setLoi("Mật khẩu tối thiểu 8 ký tự.");
    if (moi !== lai) return setLoi("Hai ô mật khẩu chưa giống nhau.");
    setDangLuu(true);
    setLoi("");
    const { error } = await may.current!.auth.updateUser({ password: moi });
    setDangLuu(false);
    if (error) return setLoi(/same|different/i.test(error.message) ? "Mật khẩu mới phải khác mật khẩu cũ." : "Không đặt lại được. Liên kết có thể đã hết hạn, hãy yêu cầu liên kết mới.");
    await may.current!.auth.signOut();
    setTt("xong");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="the-noi vao w-full max-w-[420px] p-8 pt-9">
        <Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-8 h-auto w-[130px]" />
        <h1 className="chu-tieu-de text-[30px] text-muc">Đặt lại mật khẩu</h1>
        {tt === "cho" && <p className="mt-4 text-[14px] text-muc-3">Đang kiểm tra liên kết…</p>}
        {tt === "het_han" && (
          <div className="mt-5 space-y-4">
            <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Liên kết không còn hiệu lực (đã dùng hoặc hết hạn).</div>
            <Link href="/quen-mat-khau" className="nut-vang flex h-[50px] w-full items-center justify-center rounded-nho text-[15px]">Yêu cầu liên kết mới</Link>
          </div>
        )}
        {tt === "san_sang" && (
          <form onSubmit={luu} className="mt-1 space-y-5">
            <p className="text-[14px] text-muc-3">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <div>
              <label htmlFor="moi" className={NHAN_O}>Mật khẩu mới</label>
              <input id="moi" name="moi" type="password" required minLength={8} autoComplete="new-password" className={O_NHAP} />
            </div>
            <div>
              <label htmlFor="lai" className={NHAN_O}>Nhập lại mật khẩu mới</label>
              <input id="lai" name="lai" type="password" required minLength={8} autoComplete="new-password" className={O_NHAP} />
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <button type="submit" disabled={dangLuu} className="nut-vang h-[50px] w-full rounded-nho text-[15px] disabled:opacity-60">{dangLuu ? "Đang lưu" : "Đặt mật khẩu mới"}</button>
          </form>
        )}
        {tt === "xong" && (
          <div className="mt-5 space-y-4">
            <div role="status" className="rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới.</div>
            <Link href="/dang-nhap" className="nut-vang flex h-[50px] w-full items-center justify-center rounded-nho text-[15px]">Đăng nhập</Link>
          </div>
        )}
      </div>
    </main>
  );
}

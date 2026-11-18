"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Hộp thư tự tải lại mỗi `giay` giây khi tab đang mở (tin Messenger qua Pancake về liên tục). Tab ẩn thì nghỉ, quay lại thì tải ngay. */
export function TuLamMoi({ giay = 15 }: { giay?: number }) {
  const router = useRouter();
  useEffect(() => {
    const lam = () => { if (document.visibilityState === "visible") router.refresh(); };
    const t = setInterval(lam, giay * 1000);
    document.addEventListener("visibilitychange", lam);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", lam); };
  }, [giay, router]);
  return null;
}

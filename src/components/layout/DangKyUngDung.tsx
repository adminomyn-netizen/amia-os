"use client";

import { useEffect } from "react";

/** Đăng ký service worker (chỉ bản chạy thật): tải nhanh tài nguyên tĩnh và có trang dự phòng khi mất mạng. */
export function DangKyUngDung() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => { /* trình duyệt chặn: bỏ qua, app vẫn chạy bình thường */ });
  }, []);
  return null;
}

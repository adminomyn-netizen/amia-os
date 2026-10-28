"use client";

import { NUT_CHINH } from "@/components/ui/dinh-dang";

/** Nút mở hộp thoại in của trình duyệt (trang in mã khách). */
export function InNgay() {
  return <button type="button" className={NUT_CHINH} onClick={() => window.print()}>In trang này</button>;
}

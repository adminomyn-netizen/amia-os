"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NUT_PHU } from "@/components/ui/dinh-dang";

/** "Tính lại hoa hồng": tải lại số từ hoá đơn (AMIA tính trực tiếp mỗi lần mở trang, không lưu số cũ) và báo đã xong. */
export function NutTinhLai() {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [xong, setXong] = useState(false);
  return (
    <span className="flex items-center gap-3">
      <button type="button" className={`${NUT_PHU} h-10`} disabled={dang} onClick={() => { setXong(false); bat(() => { router.refresh(); setXong(true); }); }}>{dang ? "Đang tính lại" : "Tính lại hoa hồng"}</button>
      {xong && !dang && <span role="status" className="text-[13px] text-nhan-dam">Đã tính lại theo hoá đơn mới nhất.</span>}
    </span>
  );
}

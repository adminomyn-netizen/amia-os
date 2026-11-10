"use client";

import { useEffect, useState } from "react";

/** Lỗi tạm thời (luồng dữ liệu trang bị cắt giữa chừng, Auth/DB chậm): giữ phiên đăng nhập, TỰ tải lại một lần
 *  để người dùng không phải thấy màn lỗi (chị Lâm 10/11: "cho mọi người dùng mượt, đừng ảnh hưởng").
 *  Chỉ tự tải lại 1 lần mỗi 30 giây cho cùng trang để không lặp vô hạn; lần sau mới hiện nút Tải lại. */
const KHOA = "amia-tu-tai-lai";

export default function LoiTamThoi({ reset }: { error: Error; reset: () => void }) {
  // Quyết định ngay lúc dựng: trang này vừa tự tải lại trong 30 giây qua thì thôi, hiện nút.
  const [tuTai] = useState(() => {
    if (typeof window === "undefined") return true;
    const trang = location.pathname + location.search;
    let lan: { trang?: string; luc?: number } = {};
    try { lan = JSON.parse(sessionStorage.getItem(KHOA) ?? "{}"); } catch {}
    return !(lan.trang === trang && lan.luc && Date.now() - lan.luc < 30_000);
  });
  useEffect(() => {
    if (!tuTai) return;
    try { sessionStorage.setItem(KHOA, JSON.stringify({ trang: location.pathname + location.search, luc: Date.now() })); } catch {}
    const t = setTimeout(() => location.reload(), 300);
    return () => clearTimeout(t);
  }, [tuTai]);
  if (tuTai) {
    return (
      <div className="mx-auto flex max-w-[420px] flex-col items-center gap-3 px-4 py-16 text-center" role="status">
        <span aria-hidden className="h-1 w-24 animate-pulse bg-nhan" />
        <p className="text-[14px] text-muc-2">Đang tải lại…</p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-3 px-4 py-16 text-center">
      <h1 className="text-[18px] font-semibold">Hệ thống đang chậm</h1>
      <p className="text-[14px] opacity-80">Chưa tải được trang này. Phiên đăng nhập của bạn vẫn còn. Chờ vài giây rồi bấm tải lại.</p>
      <button type="button" onClick={() => { reset(); location.reload(); }} className="nut-vang h-[44px] rounded-nho px-6 text-[15px]">Tải lại</button>
    </div>
  );
}

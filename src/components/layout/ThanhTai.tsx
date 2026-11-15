"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Vạch chạy mảnh trên đầu màn khi bấm chuyển trang (chị Lâm 15/11/2026: "bấm chuyển trang mà nó load là có hiệu ứng nháy nháy… cho cảm giác smooth hơn").
 *  Bỏ khung chờ nhấp nháy (loading.tsx): trang cũ ĐỨNG YÊN tới khi trang mới sẵn sàng, chỉ vạch này báo đang mở. */
export function ThanhTai() {
  const path = usePathname();
  const sp = useSearchParams();
  const dich = `${path}?${sp.toString()}`;
  const [pha, setPha] = useState<"" | "chay" | "xong">("");
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  const truoc = useRef(dich);

  useEffect(() => {
    const bam = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.startsWith("/in/")) return;
      if (u.pathname + u.search === location.pathname + location.search) return;
      if (hen.current) clearTimeout(hen.current);
      setPha("chay");
      hen.current = setTimeout(() => setPha(""), 15000); // phòng khi trang không đổi (lỗi mạng)
    };
    document.addEventListener("click", bam, true);
    return () => document.removeEventListener("click", bam, true);
  }, []);

  useEffect(() => {
    if (truoc.current === dich) return;
    truoc.current = dich;
    if (hen.current) clearTimeout(hen.current);
    setPha((p) => (p ? "xong" : p));
    hen.current = setTimeout(() => setPha(""), 260);
  }, [dich]);

  if (!pha) return null;
  return <div aria-hidden className={`thanh-tai khong-in ${pha === "xong" ? "thanh-tai-xong" : ""}`} />;
}

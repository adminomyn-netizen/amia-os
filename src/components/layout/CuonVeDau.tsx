"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Trên điện thoại chỉ vùng nội dung cuộn (không phải cả trang), nên sang trang khác phải tự đưa vùng đó về đầu. */
export function CuonVeDau() {
  const pathname = usePathname();
  useEffect(() => { document.getElementById("noi-dung-chinh")?.scrollTo(0, 0); }, [pathname]);
  return null;
}

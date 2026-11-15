"use client";

import { useState } from "react";
import { srcAnhKhach } from "@/lib/anh-dai-dien-src";

/** Chữ cái đầu của tên (bỏ tiền tố kiểu "MSC.0071."), dùng khi khách chưa có ảnh. */
function chuDau(ten: string) {
  const t = ten.replace(/^[\w.]*\d+\./, "").trim().split(/\s+/).filter(Boolean);
  return ((t.length > 1 ? t[t.length - 2][0] : "") + (t[t.length - 1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Ảnh đại diện tròn như SalonHero. Không có ảnh (hoặc ảnh lỗi) thì hiện chữ cái đầu tên. */
export function AnhDaiDien({ id, anh, ten, co = 40, src: srcRieng }: { id: string; anh: string | null | undefined; ten: string; co?: number; src?: string | null }) {
  const src = srcRieng ?? srcAnhKhach(id, anh);
  const [loi, setLoi] = useState<string | null>(null);
  const kieu = { width: co, height: co, fontSize: Math.round(co * 0.36) };
  if (!src || loi === src)
    return <span aria-hidden style={kieu} className="inline-flex shrink-0 select-none items-center justify-center rounded-full bg-giay-tram font-semibold text-muc-3 ring-1 ring-vien">{chuDau(ten)}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- ảnh nằm sau kiểm quyền, không qua bộ tối ưu ảnh của Next
  return <img src={src} alt="" width={co} height={co} loading="lazy" decoding="async" onError={() => setLoi(src)} style={kieu} className="shrink-0 rounded-full object-cover ring-1 ring-vien" />;
}

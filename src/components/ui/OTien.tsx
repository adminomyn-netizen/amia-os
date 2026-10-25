"use client";

import { useState } from "react";
import { O_NHAP, CHON_HET } from "./dinh-dang";

const dinhDang = (n: number) => (Number.isFinite(n) && n > 0 ? n.toLocaleString("vi-VN") : "");

/** Ô nhập tiền (đồng): gõ số, tự chèn dấu chấm phân cách hàng nghìn. Giá trị gửi đi là chuỗi có dấu chấm; máy chủ tự lọc lấy chữ số. */
export function OTien({ ten, giaTri, giaTriMacDinh = 0, onDoi, id, className = "", voHieu, ariaLabel }: { ten?: string; giaTri?: number; giaTriMacDinh?: number; onDoi?: (n: number) => void; id?: string; className?: string; voHieu?: boolean; ariaLabel?: string }) {
  // Có `giaTri` = ô được điều khiển từ bên ngoài (hiển thị đúng số bên ngoài đưa vào, không dựng lại ô khi gõ); không có = ô tự giữ số.
  const [noiBo, setChu] = useState(dinhDang(giaTriMacDinh));
  const chu = giaTri !== undefined ? dinhDang(giaTri) : noiBo;
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={ten}
        inputMode="numeric" {...CHON_HET}
        autoComplete="off"
        disabled={voHieu}
        aria-label={ariaLabel}
        value={chu}
        onChange={(e) => {
          const so = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
          setChu(dinhDang(so));
          onDoi?.(so);
        }}
        className={`${O_NHAP} pr-10 text-right tabular-nums`}
        placeholder="0"
      />
      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muc-3">đ</span>
    </div>
  );
}

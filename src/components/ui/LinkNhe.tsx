"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/** Liên kết menu KHÔNG tự tải trước khi vừa hiện ra (mỗi trang từng bắn ~30 yêu cầu tải trước các mục menu,
 *  làm hosting phải bật thêm tiến trình rồi tắt → trang bị cắt "Hệ thống đang chậm", 10/11/2026).
 *  Chỉ tải trước khi rê chuột / chạm / focus vào đúng mục đó, nên bấm vẫn nhanh. */
export function LinkNhe({ href, onPointerEnter, onTouchStart, onFocus, ...p }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const truoc = () => { try { router.prefetch(href); } catch { /* bỏ qua */ } };
  return <Link {...p} href={href} prefetch={false}
    onPointerEnter={(e) => { truoc(); onPointerEnter?.(e); }} onTouchStart={(e) => { truoc(); onTouchStart?.(e); }} onFocus={(e) => { truoc(); onFocus?.(e); }} />;
}

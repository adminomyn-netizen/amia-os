"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { layAnhCu } from "@/app/(app)/khach-hang/actions";

/** Ảnh cũ SalonHero nằm ở kho lưu trữ (Lark): mở tab ảnh là TỰ lấy về (không cần bấm), trang tự làm mới khi ảnh về tới.
 * Chỉ hiện một dòng nhỏ trong lúc đang lấy; xong thì không hiện gì. */
export function AnhCuLuuTru({ khachId, canLay, dangLay }: { khachId: string; canLay: boolean; dangLay: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!canLay) return; // canLay đổi false → true sau mỗi lượt xong: lấy tiếp lượt kế (mỗi lượt tối đa 300 ảnh)
    const fd = new FormData();
    fd.set("khach_id", khachId);
    void layAnhCu(fd).then(() => router.refresh());
  }, [canLay, khachId, router]);
  // Đang chờ tiến trình lấy ảnh: hỏi lại máy chủ mỗi 5 giây cho tới khi xong.
  useEffect(() => {
    if (!dangLay) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 5000); // tab ẩn thì khỏi dựng lại cả hồ sơ
    return () => clearInterval(t);
  }, [dangLay, router]);
  return dangLay ? <p role="status" className="mb-4 text-[13px] text-muc-3">Đang tải ảnh cũ về…</p> : null;
}

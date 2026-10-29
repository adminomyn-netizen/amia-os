"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { layAnhCu, trangThaiLayAnh } from "@/app/(app)/khach-hang/actions";

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
  // Đang chờ tiến trình lấy ảnh: hỏi trạng thái NHẸ mỗi 30 giây (không dựng lại cả hồ sơ); xong mới làm mới trang 1 lần; tự dừng sau 3 phút.
  useEffect(() => {
    if (!dangLay) return;
    let xong = false;
    const hoi = async () => {
      if (xong || document.visibilityState !== "visible") return;
      const tt = await trangThaiLayAnh(khachId).catch(() => ({ dangLay: true }));
      if (!tt.dangLay && !xong) { xong = true; router.refresh(); }
    };
    const t = setInterval(() => void hoi(), 30_000);
    const dung = setTimeout(() => { xong = true; clearInterval(t); }, 3 * 60_000);
    return () => { xong = true; clearInterval(t); clearTimeout(dung); };
  }, [dangLay, khachId, router]);
  return dangLay ? <p role="status" className="mb-4 text-[13px] text-muc-3">Đang tải ảnh cũ về…</p> : null;
}

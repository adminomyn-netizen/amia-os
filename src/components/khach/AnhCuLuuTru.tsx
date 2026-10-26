"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { layAnhCu } from "@/app/(app)/khach-hang/actions";
import { NUT_PHU } from "@/components/ui/dinh-dang";

/** Ảnh cũ SalonHero nằm ở kho lưu trữ (Lark). Bấm để lấy về xem tạm; trang tự cập nhật khi ảnh về tới. */
export function AnhCuLuuTru({ khachId, tong, conLai, dangLay, loi, hetHan }: { khachId: string; tong: number; conLai: number; dangLay: boolean; loi: string | null; hetHan: string | null }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [bao, setBao] = useState("");
  // Đang chờ tiến trình lấy ảnh: hỏi lại máy chủ mỗi 6 giây cho tới khi xong.
  useEffect(() => {
    if (!dangLay) return;
    const t = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(t);
  }, [dangLay, router]);
  return (
    <div className="mb-5 rounded-nho border border-vien bg-giay-tram px-4 py-3 text-[14px] text-muc-2" role="status">
      <p className="font-medium text-muc">Kho lưu trữ còn {tong.toLocaleString("vi-VN")} ảnh cũ từ SalonHero{conLai < tong ? ` (đang mở xem ${(tong - conLai).toLocaleString("vi-VN")})` : ""}.</p>
      {dangLay ? (
        <p className="mt-1 text-muc-3">Đang lấy ảnh từ kho lưu trữ, thường mất 1–2 phút. Trang tự cập nhật khi ảnh về tới.</p>
      ) : (
        <>
          {hetHan && <p className="mt-1 text-muc-3">Ảnh đang mở xem tạm đến hết {hetHan}, sau đó tự cất về kho lưu trữ.</p>}
          {loi && <p className="mt-1 text-canh-bao">Lần lấy trước chưa xong: {loi}</p>}
          {bao && <p className="mt-1 text-canh-bao">{bao}</p>}
          {conLai > 0 && (
            <form className="mt-2" action={(fd) => bat(async () => { const kq = await layAnhCu(fd); if (kq.loi) setBao(kq.loi); else router.refresh(); })}>
              <input type="hidden" name="khach_id" value={khachId} />
              <button type="submit" disabled={dang} className={NUT_PHU}>{dang ? "Đang gửi yêu cầu…" : tong === conLai ? "Lấy ảnh cũ về xem" : "Lấy thêm ảnh cũ"}</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

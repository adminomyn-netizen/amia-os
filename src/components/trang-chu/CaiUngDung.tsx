"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { NUT_PHU } from "@/components/ui/dinh-dang";

type SuKienCai = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Mời cài AMIA lên màn hình chính: Android/Chrome bấm là cài; iPhone chỉ cách "Chia sẻ → Thêm vào MH chính". Đã cài rồi thì ẩn. */
export function CaiUngDung() {
  const [su, setSu] = useState<SuKienCai | null>(null);
  const [ios, setIos] = useState(false);
  const [daCai, setDaCai] = useState(true);
  useEffect(() => {
    // Đọc môi trường trình duyệt sau khi vẽ lần đầu (tránh lệch HTML máy chủ/trình duyệt).
    const doc = setTimeout(() => {
      setDaCai(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
      setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    }, 0);
    const bat = (e: Event) => { e.preventDefault(); setSu(e as SuKienCai); };
    window.addEventListener("beforeinstallprompt", bat);
    window.addEventListener("appinstalled", () => setDaCai(true));
    return () => { clearTimeout(doc); window.removeEventListener("beforeinstallprompt", bat); };
  }, []);
  if (daCai || (!su && !ios)) return null;
  return (
    <div className="the-noi the-noi-thap flex items-center gap-4 p-4 pt-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-nhan-nhat text-nhan-dam" style={{ borderRadius: 12 }}>{ios ? <Share strokeWidth={1.7} className="h-5 w-5" /> : <Download strokeWidth={1.7} className="h-5 w-5" />}</span>
      <div className="min-w-0 flex-1 text-[13px]"><div className="text-[14px] font-medium text-muc">Cài AMIA lên màn hình chính</div><div className="mt-0.5 text-muc-3">{ios ? "Bấm nút Chia sẻ của Safari, chọn “Thêm vào MH chính”." : "Mở nhanh như ứng dụng, không cần gõ địa chỉ."}</div></div>
      {su && <button type="button" className={NUT_PHU} onClick={async () => { await su.prompt(); setSu(null); }}>Cài đặt</button>}
    </div>
  );
}

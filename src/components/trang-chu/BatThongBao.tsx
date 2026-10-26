"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { NUT_CHU, NUT_PHU } from "@/components/ui/dinh-dang";
import { dangKyThongBao, guiThuThongBao, huyThongBao } from "@/app/(app)/tai-khoan/thong-bao-actions";

type Dang = "cho" | "khong-ho-tro" | "ios-chua-cai" | "bi-chan" | "tat" | "bat";
const KHOA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const chuyenKhoa = (b64: string) => { const p = "=".repeat((4 - (b64.length % 4)) % 4), r = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const layReg = () => Promise.race([navigator.serviceWorker.ready, new Promise<null>((x) => setTimeout(() => x(null), 4000))]);

/** Bật/tắt thông báo đẩy cho thiết bị này: lịch mới giao cho tôi, phiếu cấp vật tư, tóm tắt việc lúc 8 giờ sáng. iPhone phải cài app lên màn hình chính trước. */
export function BatThongBao() {
  const [dang, setDang] = useState<Dang>("cho");
  const [thongBao, setThongBao] = useState("");
  const [xuLy, bat] = useTransition();

  useEffect(() => {
    const t = setTimeout(async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !KHOA) return setDang(ios && !standalone ? "ios-chua-cai" : "khong-ho-tro");
      if (ios && !standalone) return setDang("ios-chua-cai");
      if (Notification.permission === "denied") return setDang("bi-chan");
      const reg = await layReg();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setDang(sub && Notification.permission === "granted" ? "bat" : "tat");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const batLen = () => bat(async () => {
    setThongBao("");
    const quyen = await Notification.requestPermission();
    if (quyen !== "granted") return setDang(quyen === "denied" ? "bi-chan" : "tat");
    const reg = await layReg();
    if (!reg) return setThongBao("Thông báo chỉ hoạt động trên bản chạy thật của AMIA OS.");
    try {
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chuyenKhoa(KHOA) });
      const kq = await dangKyThongBao(sub.toJSON(), navigator.userAgent);
      if (kq.loi) { await sub.unsubscribe(); return setThongBao(kq.loi); }
      setDang("bat"); setThongBao("Đã bật. Bấm “Gửi thử” để kiểm tra.");
    } catch { setThongBao("Trình duyệt chưa cho đăng ký thông báo. Thử lại hoặc dùng Chrome/Safari bản mới."); }
  });
  const tatDi = () => bat(async () => {
    const reg = await layReg(); const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) { await huyThongBao(sub.endpoint); await sub.unsubscribe(); }
    setDang("tat"); setThongBao("Đã tắt thông báo trên thiết bị này.");
  });
  const guiThu = () => bat(async () => { const kq = await guiThuThongBao(); setThongBao(kq.loi ?? `Đã gửi tới ${kq.thietBi} thiết bị. Vài giây nữa sẽ hiện.`); });

  if (dang === "cho") return null;
  const Icon = dang === "bat" ? Bell : BellOff;
  return (
    <div className="the-noi the-noi-thap flex flex-wrap items-center gap-4 p-4 pt-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${dang === "bat" ? "bg-nhan-nhat text-nhan-dam" : "bg-giay-tram text-muc-3"}`} style={{ borderRadius: 12 }}><Icon strokeWidth={1.7} className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1 text-[13px]">
        <div className="text-[14px] font-medium text-muc">Thông báo trên thiết bị này</div>
        <div className="mt-0.5 text-muc-3">
          {dang === "bat" ? "Đang bật: lịch mới của tôi, phiếu cấp vật tư và tóm tắt việc lúc 8 giờ sáng." : dang === "tat" ? "Nhận lịch mới, phiếu cấp vật tư và tóm tắt việc lúc 8 giờ sáng ngay trên điện thoại, kể cả khi không mở app." : dang === "bi-chan" ? "Trình duyệt đang chặn thông báo. Mở cài đặt trang web, cho phép “Thông báo” rồi tải lại." : dang === "ios-chua-cai" ? "iPhone cần cài AMIA lên màn hình chính trước (Chia sẻ → Thêm vào MH chính), mở app từ biểu tượng rồi bật thông báo." : "Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo đẩy."}
        </div>
        {thongBao && <div role="status" className="mt-1.5 text-nhan-dam">{thongBao}</div>}
      </div>
      <div className="flex gap-2.5">
        {dang === "tat" && <button type="button" className={NUT_PHU} disabled={xuLy} onClick={batLen}>{xuLy ? "Đang bật" : "Bật thông báo"}</button>}
        {dang === "bat" && <><button type="button" className={NUT_PHU} disabled={xuLy} onClick={guiThu}>Gửi thử</button><button type="button" className={NUT_CHU} disabled={xuLy} onClick={tatDi}>Tắt</button></>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { dangKyThongBao, guiThuThongBao, huyThongBao } from "@/app/(app)/tai-khoan/thong-bao-actions";

type Dang = "cho" | "khong-ho-tro" | "ios-chua-cai" | "bi-chan" | "tat" | "bat";
const KHOA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const chuyenKhoa = (b64: string) => { const p = "=".repeat((4 - (b64.length % 4)) % 4), r = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const layReg = () => Promise.race([navigator.serviceWorker.ready, new Promise<null>((x) => setTimeout(() => x(null), 4000))]);

/** Bật/tắt thông báo đẩy cho thiết bị này (nằm trong menu avatar, dưới phần giao diện): lịch mới giao cho tôi, phiếu cấp vật tư, tóm tắt việc lúc 8 giờ sáng. iPhone phải cài app lên màn hình chính trước. */
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
  const ghiChu = dang === "bat" ? "Đang bật: lịch mới của tôi, phiếu cấp vật tư và tóm tắt việc lúc 8 giờ sáng."
    : dang === "tat" ? "Nhận lịch mới, phiếu cấp vật tư và tóm tắt việc lúc 8 giờ sáng ngay trên điện thoại, kể cả khi không mở app."
    : dang === "bi-chan" ? "Trình duyệt đang chặn thông báo. Mở cài đặt trang web, cho phép “Thông báo” rồi tải lại."
    : dang === "ios-chua-cai" ? "iPhone cần cài AMIA lên màn hình chính trước (Chia sẻ → Thêm vào MH chính), mở app từ biểu tượng rồi bật thông báo."
    : "Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo đẩy.";
  const nut = "flex h-9 flex-1 items-center justify-center rounded-nho border text-[13px] disabled:opacity-50";
  return (
    <div className="border-t border-vien px-5 py-3.5">
      <div className="flex items-center gap-2">
        <Icon strokeWidth={1.7} className={`h-4 w-4 shrink-0 ${dang === "bat" ? "text-nhan-dam" : "text-muc-3"}`} aria-hidden />
        <span className="nhan-muc">Thông báo trên thiết bị này</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muc-3">{ghiChu}</p>
      {thongBao && <p role="status" className="mt-1.5 text-[12.5px] text-nhan-dam">{thongBao}</p>}
      {(dang === "tat" || dang === "bat") && (
        <div className="mt-2.5 flex gap-2">
          {dang === "tat" && <button type="button" disabled={xuLy} onClick={batLen} className={`${nut} border-nhan bg-nhan-nhat font-medium text-nhan-dam`}>{xuLy ? "Đang bật" : "Bật thông báo"}</button>}
          {dang === "bat" && <>
            <button type="button" disabled={xuLy} onClick={guiThu} className={`${nut} border-vien text-muc-2 hover:bg-giay-tram`}>Gửi thử</button>
            <button type="button" disabled={xuLy} onClick={tatDi} className={`${nut} border-vien text-muc-2 hover:bg-giay-tram`}>Tắt</button>
          </>}
        </div>
      )}
    </div>
  );
}

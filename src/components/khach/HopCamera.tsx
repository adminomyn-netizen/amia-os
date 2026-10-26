"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera } from "lucide-react";
import { Hop } from "@/components/ui/Hop";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

type Mat = "environment" | "user";

/** Chụp ảnh trực tiếp bằng camera của máy (điện thoại, máy tính bảng, laptop). Mỗi lần bấm chụp là lưu ngay vào hồ sơ khách và hộp vẫn mở để chụp tiếp.
 * Cần HTTPS và người dùng cho phép camera; không dùng được thì báo rõ và gợi ý "Dùng camera của máy" (mở ứng dụng camera có sẵn). */
export function HopCamera({ mo, dong, luu, dungCameraMay }: { mo: boolean; dong: () => void; luu: (f: File) => Promise<string | null>; dungCameraMay: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const luong = useRef<MediaStream | null>(null);
  const [mat, setMat] = useState<Mat>("environment");
  const [loi, setLoi] = useState("");
  const [san, setSan] = useState(false);
  const [dang, setDang] = useState(false);
  const [soAnh, setSoAnh] = useState(0);
  const [nhieuCam, setNhieuCam] = useState(false);

  useEffect(() => {
    if (!mo) return;
    let huy = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setLoi("Trình duyệt này chưa hỗ trợ chụp trực tiếp. Dùng camera của máy bên dưới."); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mat }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (huy) { s.getTracks().forEach((t) => t.stop()); return; }
        luong.current = s;
        const v = video.current;
        if (v) { v.srcObject = s; await v.play().catch(() => {}); }
        setLoi(""); setSan(true);
        setNhieuCam(((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").length) > 1);
      } catch (e) {
        const ten = (e as DOMException)?.name;
        setSan(false);
        setLoi(ten === "NotAllowedError" ? "Chưa được cho phép dùng camera. Bấm biểu tượng khoá cạnh địa chỉ trang, cho phép Camera rồi mở lại." : ten === "NotFoundError" ? "Không tìm thấy camera trên thiết bị này." : "Chưa mở được camera. Dùng camera của máy bên dưới.");
      }
    })();
    return () => { huy = true; luong.current?.getTracks().forEach((t) => t.stop()); luong.current = null; setSan(false); };
  }, [mo, mat]);

  const chup = async () => {
    const v = video.current;
    if (!v || !v.videoWidth || dang) return;
    setDang(true); setLoi("");
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) { setDang(false); return setLoi("Chưa lấy được ảnh. Thử chụp lại."); }
    const e = await luu(new File([blob], "chup.jpg", { type: "image/jpeg" }));
    setDang(false);
    if (e) setLoi(e); else setSoAnh((n) => n + 1);
  };
  const dongHop = () => { setSoAnh(0); setLoi(""); dong(); };

  return (
    <Hop mo={mo} dong={dongHop} tieuDe="Chụp ảnh khách" moTa="Mỗi lần bấm Chụp, ảnh được lưu ngay vào hồ sơ. Chụp xong bấm Xong.">
      <div className="space-y-4">
        <div className="relative overflow-hidden bg-black" style={{ aspectRatio: "4 / 3", borderRadius: 8 }}>
          <video ref={video} playsInline muted className="h-full w-full object-contain" style={mat === "user" ? { transform: "scaleX(-1)" } : undefined} />
          {!san && !loi && <p className="absolute inset-0 flex items-center justify-center text-[14px] text-white">Đang mở camera…</p>}
        </div>
        {loi && <p role="alert" className="text-[13px] text-loi">{loi}</p>}
        {soAnh > 0 && <p role="status" className="text-[13px] text-nhan-dam">Đã lưu {soAnh} ảnh vào hồ sơ.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {nhieuCam && <button type="button" className={`${NUT_PHU} inline-flex items-center gap-1.5`} onClick={() => setMat((m) => (m === "environment" ? "user" : "environment"))}><SwitchCamera strokeWidth={1.7} className="h-4 w-4" />Đổi camera</button>}
            <button type="button" className={NUT_PHU} onClick={() => { dongHop(); dungCameraMay(); }}>Dùng camera của máy</button>
          </div>
          <div className="flex gap-2">
            <button type="button" className={NUT_PHU} onClick={dongHop}>Xong</button>
            <button type="button" className={`${NUT_CHINH} inline-flex items-center gap-1.5`} disabled={!san || dang} onClick={chup}><Camera strokeWidth={1.7} className="h-4 w-4" />{dang ? "Đang lưu" : "Chụp"}</button>
          </div>
        </div>
      </div>
    </Hop>
  );
}

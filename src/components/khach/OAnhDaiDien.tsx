"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

const CO = 360;
/** Cắt giữa thành hình vuông, thu về 360px JPEG ngay trên máy (ảnh điện thoại vài MB → ~30 KB) rồi mới gửi lên. */
async function thuNho(tep: File): Promise<string> {
  const bmp = await createImageBitmap(tep);
  const c = Math.min(bmp.width, bmp.height);
  const cv = document.createElement("canvas");
  cv.width = cv.height = Math.min(CO, c);
  cv.getContext("2d")!.drawImage(bmp, (bmp.width - c) / 2, (bmp.height - c) / 2, c, c, 0, 0, cv.width, cv.height);
  bmp.close();
  return cv.toDataURL("image/jpeg", 0.85);
}

/** Ô ảnh đại diện trong biểu mẫu khách. Giá trị: "" = giữ nguyên, "data:…" = ảnh mới, "xoa" = bỏ ảnh. `hienTai` = đường ảnh đang có (để xem trước). */
export function OAnhDaiDien({ id, giaTri, hienTai, onDoi }: { id: string; giaTri: string; hienTai: string | null; onDoi: (v: string) => void }) {
  const o = useRef<HTMLInputElement>(null);
  const [loi, setLoi] = useState("");
  const xem = giaTri.startsWith("data:") ? giaTri : giaTri === "xoa" ? null : hienTai;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => o.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-giay-tram ring-1 ring-vien" aria-label="Chọn ảnh đại diện">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước (data URL / ảnh sau kiểm quyền) */}
        {xem ? <img src={xem} alt="" className="h-full w-full object-cover" /> : <Camera aria-hidden strokeWidth={1.5} className="m-auto h-7 w-7 text-muc-3" />}
      </button>
      <div className="flex flex-col items-start gap-1 text-[13px]">
        <button type="button" onClick={() => o.current?.click()} className="font-medium text-nhan-dam hover:underline">{xem ? "Đổi ảnh" : "Chọn ảnh"}</button>
        {xem && <button type="button" onClick={() => onDoi(hienTai ? "xoa" : "")} className="text-muc-3 hover:underline">Bỏ ảnh</button>}
        {loi && <span className="text-loi">{loi}</span>}
      </div>
      <input id={id} ref={o} type="file" accept="image/*" className="sr-only" onChange={async (e) => {
        const tep = e.target.files?.[0];
        e.target.value = "";
        if (!tep) return;
        setLoi("");
        try { onDoi(await thuNho(tep)); } catch { setLoi("Không đọc được ảnh này, chọn ảnh khác."); }
      }} />
    </div>
  );
}

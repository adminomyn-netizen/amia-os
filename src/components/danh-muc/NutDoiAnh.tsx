"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NUT_CHU, NUT_PHU } from "@/components/ui/dinh-dang";

type KQ = { ok?: boolean; loi?: string };

/** Ô ảnh nhỏ trong bảng. Bấm vào (nếu được sửa) mở hộp đổi ảnh: chọn tệp → cắt vuông giữa, thu về `canh` px JPEG ngay trên trình duyệt rồi gửi lên máy chủ.
 *  Dùng chung cho Dịch vụ, Sản phẩm (ảnh vào kho công khai danh-muc-anh) và Nhân viên phục vụ (ảnh đại diện). Máy chủ nhận `an` + `id` + `anh` (data URL JPEG) hoặc `xoa=1`. */
export function NutDoiAnh({ id, an = {}, anh, ten, sua, canh = 480, action }: {
  id: string; an?: Record<string, string>; anh: string | null; ten: string; sua: boolean; canh?: number; action: (fd: FormData) => Promise<KQ>;
}) {
  const router = useRouter();
  const o = useRef<HTMLInputElement>(null);
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [xem, setXem] = useState<string | null>(null);
  const chuDau = (ten.trim().split(/\s+/).pop() ?? "?").charAt(0).toUpperCase();
  const hien = xem ?? anh;

  const gui = (fd: FormData) => {
    fd.set("id", id);
    for (const [k, v] of Object.entries(an)) fd.set(k, v);
    bat(async () => {
      const kq = await action(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setMo(false); setXem(null); router.refresh(); }
    });
  };
  const chon = async (f: File | undefined) => {
    if (!f) return;
    setLoi("");
    if (!f.type.startsWith("image/")) return setLoi("Chọn một tệp ảnh.");
    try {
      const bm = await createImageBitmap(f);
      const c = Math.min(bm.width, bm.height);
      const cv = document.createElement("canvas");
      cv.width = cv.height = canh;
      cv.getContext("2d")!.drawImage(bm, (bm.width - c) / 2, (bm.height - c) / 2, c, c, 0, 0, canh, canh);
      const url = cv.toDataURL("image/jpeg", 0.82);
      setXem(url);
      const fd = new FormData();
      fd.set("anh", url);
      gui(fd);
    } catch {
      setLoi("Không đọc được ảnh này. Thử ảnh JPG hoặc PNG khác.");
    }
  };
  const go = () => { const fd = new FormData(); fd.set("xoa", "1"); gui(fd); };

  const o9 = hien
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={hien} alt={`Ảnh: ${ten}`} width={40} height={40} loading="lazy" className="h-10 w-10 rounded-nho border border-vien object-cover" />
    : <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-nho bg-giay-tram text-[13px] font-medium text-muc-2">{chuDau}</span>;
  if (!sua) return o9;
  return (
    <>
      <button type="button" onClick={() => { setLoi(""); setXem(null); setMo(true); }} aria-label={`Đổi ảnh: ${ten}`} title="Đổi ảnh">{o9}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Ảnh: ${ten}`} moTa={`Ảnh được cắt vuông giữa và thu về ${canh}×${canh} px.`}>
        <div className="flex justify-center">
          {hien
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={hien} alt={`Ảnh: ${ten}`} width={240} height={240} className="h-60 w-60 rounded-nho border border-vien object-cover" />
            : <span aria-hidden className="flex h-60 w-60 items-center justify-center rounded-nho bg-giay-tram text-[56px] font-medium text-muc-3">{chuDau}</span>}
        </div>
        <input ref={o} type="file" accept="image/*" className="sr-only" onChange={(e) => { void chon(e.target.files?.[0]); e.target.value = ""; }} aria-label="Chọn tệp ảnh" />
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          {anh && <button type="button" className={NUT_CHU} disabled={dang} onClick={go}>Gỡ ảnh</button>}
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button>
          <button type="button" className={`${NUT_PHU}`} disabled={dang} onClick={() => o.current?.click()}>{dang ? "Đang lưu" : anh ? "Đổi ảnh" : "Chọn ảnh"}</button>
        </div>
      </Hop>
    </>
  );
}

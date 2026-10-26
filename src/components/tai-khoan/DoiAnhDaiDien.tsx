"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHU, NUT_PHU } from "@/components/ui/dinh-dang";
import { datAnhDaiDien } from "@/app/(app)/tai-khoan/actions";

const CAN = 256;

/** Chọn ảnh → cắt vuông giữa, thu về 256px JPEG ngay trên trình duyệt (vài chục KB) rồi lưu. Không cần kho ảnh riêng. */
export function DoiAnhDaiDien({ coAnh }: { coAnh: boolean }) {
  const router = useRouter();
  const o = useRef<HTMLInputElement>(null);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");

  const chon = async (f: File | undefined) => {
    if (!f) return;
    setLoi("");
    if (!f.type.startsWith("image/")) return setLoi("Chọn một tệp ảnh.");
    try {
      const bm = await createImageBitmap(f);
      const canh = Math.min(bm.width, bm.height);
      const cv = document.createElement("canvas");
      cv.width = cv.height = CAN;
      cv.getContext("2d")!.drawImage(bm, (bm.width - canh) / 2, (bm.height - canh) / 2, canh, canh, 0, 0, CAN, CAN);
      const url = cv.toDataURL("image/jpeg", 0.85);
      const fd = new FormData();
      fd.set("anh", url);
      bat(async () => {
        const kq = await datAnhDaiDien(fd);
        if (kq.loi) setLoi(kq.loi);
        else router.refresh();
      });
    } catch {
      setLoi("Không đọc được ảnh này. Thử ảnh JPG hoặc PNG khác.");
    }
  };
  const go = () => {
    const fd = new FormData();
    fd.set("xoa", "1");
    bat(async () => { await datAnhDaiDien(fd); router.refresh(); });
  };

  return (
    <div>
      <input ref={o} type="file" accept="image/*" className="sr-only" onChange={(e) => { void chon(e.target.files?.[0]); e.target.value = ""; }} aria-label="Chọn ảnh đại diện" />
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={NUT_PHU} disabled={dang} onClick={() => o.current?.click()}>{dang ? "Đang lưu" : coAnh ? "Đổi ảnh" : "Tải ảnh lên"}</button>
        {coAnh && <button type="button" className={NUT_CHU} disabled={dang} onClick={go}>Gỡ ảnh</button>}
      </div>
      {loi && <p role="alert" className="mt-2 text-[13px] text-loi">{loi}</p>}
    </div>
  );
}

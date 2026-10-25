"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taiAnh } from "@/app/(app)/khach-hang/actions";
import { Chon } from "@/components/ui/Chon";
import { NUT_CHINH } from "@/components/ui/dinh-dang";

/** Thu nhỏ ảnh về cạnh dài ≤ 1800 px (JPEG 85%) ngay trên máy trước khi tải lên: nhanh hơn và nhẹ kho. */
async function thuNho(f: File): Promise<File> {
  if (!f.type.startsWith("image/")) return f;
  const bm = await createImageBitmap(f);
  const t = Math.min(1, 1800 / Math.max(bm.width, bm.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bm.width * t);
  c.height = Math.round(bm.height * t);
  c.getContext("2d")!.drawImage(bm, 0, 0, c.width, c.height);
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  return blob ? new File([blob], "anh.jpg", { type: "image/jpeg" }) : f;
}

export function TaiAnh({ khachId }: { khachId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [loai, setLoai] = useState("truoc");
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const chon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ds = Array.from(e.target.files ?? []);
    if (!ds.length) return;
    setLoi("");
    bat(async () => {
      for (const f of ds) {
        const fd = new FormData();
        fd.set("khach_id", khachId);
        fd.set("loai", loai);
        fd.set("tep", await thuNho(f));
        const kq = await taiAnh(fd);
        if (kq.loi) { setLoi(kq.loi); break; }
      }
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  };
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="w-44">
        <Chon ariaLabel="Loại ảnh" giaTri={loai} onDoi={setLoai} luaChon={[{ gia_tri: "truoc", nhan: "Trước điều trị" }, { gia_tri: "sau", nhan: "Sau điều trị" }, { gia_tri: "khac", nhan: "Khác" }]} />
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="chon-anh" onChange={chon} />
      <button type="button" className={NUT_CHINH} disabled={dang} onClick={() => ref.current?.click()}>{dang ? "Đang tải ảnh" : "Tải ảnh lên"}</button>
      {loi && <span role="alert" className="text-[13px] text-loi">{loi}</span>}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHU } from "@/components/ui/dinh-dang";
import { createClient } from "@/lib/supabase/client";
import { xacNhanTepHddv, xinLinkTepHddv } from "@/app/(app)/tai-chinh/hoa-don-dau-vao/actions";
import { KHO_HDDV, kiemTraTepHddv, loaiTep } from "@/lib/hoa-don-dau-vao";

/** Cột "Tải về" của hoá đơn đầu vào: có tệp thì tải về; người được ghi thì tải lên / thay tệp PDF, XML, Zip (tối đa 10 MB, kho riêng tư). */
export function TepHoaDonDauVao({ id, tenTep, ghi }: { id: string; tenTep: string | null; ghi: boolean }) {
  const router = useRouter();
  const o = useRef<HTMLInputElement>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string>();
  const tai = async (tep: File) => {
    setLoi(undefined);
    const sai = kiemTraTepHddv(tep.name, tep.size);
    if (sai) return setLoi(sai);
    setDang(true);
    try {
      const f1 = new FormData(); f1.set("id", id); f1.set("ten_tep", tep.name); f1.set("kich_thuoc", String(tep.size));
      const b1 = await xinLinkTepHddv(f1);
      if (b1.loi || !b1.duongDan || !b1.token) return setLoi(b1.loi ?? "Chưa mở được kho tệp.");
      const { error } = await createClient().storage.from(KHO_HDDV).uploadToSignedUrl(b1.duongDan, b1.token, tep, { contentType: loaiTep(tep.name)?.mime ?? tep.type });
      if (error) return setLoi("Tải tệp lên chưa được. Kiểm tra mạng rồi thử lại.");
      const f2 = new FormData(); f2.set("id", id); f2.set("duong_dan", b1.duongDan); f2.set("ten_tep", tep.name);
      const b2 = await xacNhanTepHddv(f2);
      if (b2.loi) return setLoi(b2.loi);
      router.refresh();
    } finally { setDang(false); if (o.current) o.current.value = ""; }
  };
  return (
    <div className="flex flex-col items-start gap-1">
      {tenTep && <a href={`/api/hoa-don-dau-vao/${id}`} className={NUT_CHU} title={tenTep}>Tải về</a>}
      {ghi && (
        <>
          <input ref={o} type="file" accept=".pdf,.xml,.zip" className="hidden" aria-label="Chọn tệp hoá đơn" onChange={(e) => { const f = e.target.files?.[0]; if (f) void tai(f); }} />
          <button type="button" disabled={dang} onClick={() => o.current?.click()} className={NUT_CHU}>{dang ? "Đang tải…" : tenTep ? "Thay tệp" : "Tải lên"}</button>
        </>
      )}
      {loi && <span role="alert" className="text-[12px] text-loi">{loi}</span>}
    </div>
  );
}

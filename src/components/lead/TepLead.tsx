"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { createClient } from "@/lib/supabase/client";
import { xacNhanTepLead, xinLinkTepLead } from "@/app/(app)/marketing/lead/actions";
import { KHO_LEAD_TEP, NHAN_TEP, kiemTraTepLead, loaiTepLead } from "@/lib/lead";

/** Tải tệp cho lead: chọn nhãn (Trước / Sau điều trị / Khác) rồi chọn ảnh hoặc PDF; tải thẳng lên kho riêng tư bằng link ký, máy chủ kiểm lại rồi mới ghi. */
export function TaiTepLead({ leadId, conLai }: { leadId: string; conLai: number }) {
  const router = useRouter();
  const o = useRef<HTMLInputElement>(null);
  const [nhan, setNhan] = useState("khac");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const tai = async (tep: File) => {
    setLoi("");
    const sai = kiemTraTepLead(tep.name, tep.size);
    if (sai) return setLoi(sai);
    setDang(true);
    try {
      const f1 = new FormData(); f1.set("id", leadId); f1.set("ten_tep", tep.name); f1.set("kich_thuoc", String(tep.size));
      const b1 = await xinLinkTepLead(f1);
      if (b1.loi || !b1.duongDan || !b1.token) return setLoi(b1.loi ?? "Chưa mở được kho tệp.");
      const { error } = await createClient().storage.from(KHO_LEAD_TEP).uploadToSignedUrl(b1.duongDan, b1.token, tep, { contentType: loaiTepLead(tep.name)?.mime ?? tep.type });
      if (error) return setLoi("Tải tệp lên chưa được. Kiểm tra mạng rồi thử lại.");
      const f2 = new FormData(); f2.set("id", leadId); f2.set("duong_dan", b1.duongDan); f2.set("ten_tep", tep.name); f2.set("nhan", nhan);
      const b2 = await xacNhanTepLead(f2);
      if (b2.loi) return setLoi(b2.loi);
      router.refresh();
    } finally { setDang(false); if (o.current) o.current.value = ""; }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[170px]"><Chon nho ariaLabel="Nhãn tệp" luaChon={Object.entries(NHAN_TEP).map(([gia_tri, n]) => ({ gia_tri, nhan: n }))} giaTri={nhan} onDoi={setNhan} /></span>
      <input ref={o} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.pdf" className="hidden" aria-label="Chọn tệp cho lead" onChange={(e) => { const f = e.target.files?.[0]; if (f) void tai(f); }} />
      <button type="button" disabled={dang || conLai <= 0} onClick={() => o.current?.click()} className={NUT_PHU}>{dang ? "Đang tải…" : "Tải tệp lên"}</button>
      <span className="text-[12.5px] text-muc-3">{conLai > 0 ? `Còn tải được ${conLai} tệp · ảnh hoặc PDF, tối đa 10 MB` : "Đã đủ 5 tệp tải tay"}</span>
      {loi && <span role="alert" className="w-full text-[12.5px] text-loi">{loi}</span>}
    </div>
  );
}

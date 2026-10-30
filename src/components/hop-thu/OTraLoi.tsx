"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHINH, O_NHIEU_DONG } from "@/components/ui/dinh-dang";

type KQ = { ok?: boolean; loi?: string; ghiChu?: string };

/** Khung trả lời trong hộp thư. Mở hội thoại có tin chưa đọc thì tự đánh dấu đã đọc. */
export function OTraLoi({ hoiThoaiId, chuaDoc, duocTraLoi, traLoi, daDoc }: { hoiThoaiId: string; chuaDoc: number; duocTraLoi: boolean; traLoi: (fd: FormData) => Promise<KQ>; daDoc: (fd: FormData) => Promise<KQ> }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState(""), [ghiChu, setGhiChu] = useState(""), [nd, setNd] = useState("");
  const daGoi = useRef(false);
  useEffect(() => {
    if (chuaDoc > 0 && !daGoi.current) {
      daGoi.current = true;
      const fd = new FormData(); fd.set("hoi_thoai_id", hoiThoaiId);
      void daDoc(fd).then(() => router.refresh());
    }
  }, [chuaDoc, hoiThoaiId, daDoc, router]);
  if (!duocTraLoi) return <p className="border-t border-vien pt-3 text-[13px] text-muc-3">Bạn chỉ được xem hộp thư.</p>;
  return (
    <div className="border-t border-vien pt-3">
      <textarea value={nd} onChange={(e) => setNd(e.target.value)} rows={3} maxLength={4000} placeholder="Nhập câu trả lời" aria-label="Câu trả lời" className={O_NHIEU_DONG} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" disabled={dang || !nd.trim()} className={NUT_CHINH}
          onClick={() => { setLoi(""); setGhiChu(""); bat(async () => { const fd = new FormData(); fd.set("hoi_thoai_id", hoiThoaiId); fd.set("noi_dung", nd); const kq = await traLoi(fd); if (kq.loi) setLoi(kq.loi); else { setNd(""); setGhiChu(kq.ghiChu ?? ""); router.refresh(); } }); }}>{dang ? "Đang lưu" : "Trả lời"}</button>
        {loi && <span role="alert" className="text-[13px] text-loi">{loi}</span>}
        {ghiChu && <span role="status" className="text-[13px] text-muc-3">{ghiChu}</span>}
      </div>
    </div>
  );
}

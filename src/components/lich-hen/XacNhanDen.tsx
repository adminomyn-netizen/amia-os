"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { GioChon } from "@/components/ui/GioChon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

const gioBayGio = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });

/** Nút "Khách đã đến" + hộp "Xác nhận giờ đến" như SalonHero: hỏi chuyển sang Chờ phục vụ, ô Giờ đến mặc định giờ hiện tại (sửa được, không sau giờ hiện tại). */
export function XacNhanDen({ id, action }: { id: string; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }> }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [gio, setGio] = useState("");
  const [khoa, setKhoa] = useState(0);
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const moHop = () => { setGio(gioBayGio()); setKhoa((k) => k + 1); setLoi(""); setMo(true); };
  const dongY = () => {
    setLoi("");
    bat(async () => {
      const fd = new FormData();
      fd.set("id", id); fd.set("trang_thai", "cho_phuc_vu"); fd.set("gio_den", gio);
      const kq = await action(fd);
      if (kq.loi) setLoi(kq.loi); else { setMo(false); router.refresh(); }
    });
  };
  return (
    <>
      <button type="button" onClick={moHop} className="nut-vang h-8 rounded-nho px-3 text-[13px]">Khách đã đến</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Xác nhận giờ đến" moTa="Khách đã đến. Bạn có muốn chuyển sang trạng thái chờ phục vụ hay không?">
        <div><label className={NHAN_O}>Giờ đến</label><GioChon key={khoa} ariaLabel="Giờ đến" giaTriMacDinh={gio} onDoi={setGio} /></div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ bỏ</button><button type="button" className={NUT_CHINH} disabled={dang || !gio} onClick={dongY}>{dang ? "Đang lưu" : "Đồng ý"}</button></div>
      </Hop>
    </>
  );
}

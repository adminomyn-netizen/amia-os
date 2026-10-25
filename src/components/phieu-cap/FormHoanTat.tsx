"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, CHON_HET } from "@/components/ui/dinh-dang";
import { soVN } from "@/lib/dinh-dang";

export type DongPhieu = { id: string; ten: string; don_vi: string; so_cap: number; dinh_muc: number };

/** KTV làm xong: nhập số TRẢ lại cho từng vật tư (0 nếu dùng hết) + số đếm máy sau ca. Dùng thật = cấp − trả; vượt định mức quá ngưỡng thì phải ghi lý do và chọn bác sĩ xác nhận. */
export function FormHoanTat({ id, dong, bacSi, nguongPct, action }: { id: string; dong: DongPhieu[]; bacSi: LuaChon[]; nguongPct: number; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }> }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [tra, setTra] = useState<Record<string, string>>({});
  const [ly, setLy] = useState<Record<string, string>>({});
  const [bs, setBs] = useState<Record<string, string>>({});
  const [dem, setDem] = useState("");
  const dung = (d: DongPhieu) => d.so_cap - (Number(tra[d.id]) || 0);
  const vuot = (d: DongPhieu) => d.dinh_muc > 0 && dung(d) > d.dinh_muc * (1 + nguongPct / 100);
  const gui = () => {
    setLoi("");
    for (const d of dong) if (tra[d.id] === undefined || tra[d.id] === "") return setLoi(`Nhập số trả của "${d.ten}" (0 nếu dùng hết).`);
    const fd = new FormData();
    fd.set("id", id); fd.set("dem_sau", dem);
    fd.set("dong", JSON.stringify(dong.map((d) => ({ dong_id: d.id, so_tra: Number(tra[d.id]) || 0, ly_do_vuot: ly[d.id] ?? "", bac_si_xac_nhan_id: bs[d.id] ?? "" }))));
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); router.refresh(); } });
  };
  return (
    <>
      <button type="button" className={NUT_CHINH} onClick={() => setMo(true)}>Làm xong, trả vật tư</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Làm xong ca" moTa="Nhập số vật tư còn thừa trả lại kho. Hệ thống tính số dùng thật và đối chiếu định mức." rong="rong">
        <ul className="space-y-4">
          {dong.map((d) => (
            <li key={d.id} className="border-b border-vien pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="text-[15px] font-medium text-muc">{d.ten}</div><div className="text-[12px] text-muc-3">Cấp {soVN(d.so_cap)} {d.don_vi}{d.dinh_muc > 0 ? ` · định mức ${soVN(d.dinh_muc)}` : " · cấp thêm"}</div></div>
                <div className="flex items-center gap-3">
                  <label className="text-[13px] text-muc-3" htmlFor={`tra-${d.id}`}>Trả lại</label>
                  <input id={`tra-${d.id}`} inputMode="decimal" {...CHON_HET} value={tra[d.id] ?? ""} onChange={(e) => setTra((t) => ({ ...t, [d.id]: e.target.value.replace(/[^\d.]/g, "") }))} className="h-10 w-24 rounded-nho border border-vien-dam bg-giay-sang px-2 text-right tabular-nums outline-none focus:border-nhan" />
                  <span className="w-28 text-right text-[13px] tabular-nums text-muc-2">dùng {soVN(Math.max(dung(d), 0))}</span>
                </div>
              </div>
              {vuot(d) && (
                <div className="mt-3 grid gap-3 rounded-nho bg-canh-bao-nen p-3 sm:grid-cols-2">
                  <p className="text-[13px] text-canh-bao sm:col-span-2">Dùng vượt định mức hơn {nguongPct}%: ghi lý do và chọn bác sĩ xác nhận.</p>
                  <div><label className={NHAN_O} htmlFor={`ly-${d.id}`}>Lý do</label><input id={`ly-${d.id}`} value={ly[d.id] ?? ""} onChange={(e) => setLy((t) => ({ ...t, [d.id]: e.target.value }))} className={O_NHAP} /></div>
                  <div><label className={NHAN_O}>Bác sĩ xác nhận</label><Chon trong="Chọn bác sĩ" ariaLabel="Bác sĩ xác nhận" giaTri={bs[d.id] ?? ""} onDoi={(v) => setBs((t) => ({ ...t, [d.id]: v }))} luaChon={bacSi} /></div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 max-w-xs"><label className={NHAN_O} htmlFor="dem-sau">Số đếm máy SAU ca (nếu máy có bộ đếm)</label><input id="dem-sau" inputMode="numeric" {...CHON_HET} value={dem} onChange={(e) => setDem(e.target.value.replace(/\D/g, ""))} className={`${O_NHAP} text-right`} /></div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : "Xác nhận đã trả"}</button></div>
      </Hop>
    </>
  );
}

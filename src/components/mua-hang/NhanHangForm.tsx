"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { soVN } from "@/lib/dinh-dang";

export type DongNhan = { id: string; ten: string; don_vi: string; con: number };

/** Nhận hàng một phần hoặc đủ: mỗi dòng nhập số nhận (mặc định = số còn thiếu), số lô và hạn dùng nếu có. */
export function NhanHangForm({ donId, dong, action }: { donId: string; dong: DongNhan[]; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }> }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [v, setV] = useState<Record<string, { sl: string; lo: string; han: string }>>({});
  const lay = (d: DongNhan) => v[d.id] ?? { sl: String(d.con), lo: "", han: "" };
  const dat = (d: DongNhan, k: "sl" | "lo" | "han", x: string) => setV((o) => ({ ...o, [d.id]: { ...lay(d), [k]: x } }));
  const gui = () => {
    setLoi("");
    const ds = dong.map((d) => ({ dong_id: d.id, so_luong: Number(lay(d).sl.replace(",", ".")) || 0, so_lo: lay(d).lo, han_dung: lay(d).han }));
    for (const d of ds) { const g = dong.find((x) => x.id === d.dong_id)!; if (d.so_luong < 0 || d.so_luong > g.con) return setLoi(`"${g.ten}": số nhận từ 0 đến ${soVN(g.con)}.`); }
    if (ds.every((d) => d.so_luong === 0)) return setLoi("Nhập số lượng nhận cho ít nhất một dòng.");
    const fd = new FormData();
    fd.set("don_id", donId); fd.set("dong", JSON.stringify(ds));
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); setV({}); router.refresh(); } });
  };
  return (
    <>
      <button type="button" className={NUT_CHINH} onClick={() => { setLoi(""); setMo(true); }}>Nhận hàng</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Nhận hàng vào kho" moTa="Số nhận sẽ cộng vào tồn kho và ghi công nợ nhà cung cấp theo đơn giá trên đơn." rong="rong">
        <ul className="space-y-4">
          {dong.map((d) => (
            <li key={d.id} className="border-b border-vien pb-4">
              <div className="text-[15px] font-medium text-muc">{d.ten}</div>
              <div className="text-[12px] text-muc-3">Còn chưa nhận {soVN(d.con)} {d.don_vi}</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div><label className={NHAN_O} htmlFor={`sl-${d.id}`}>Số nhận</label><input id={`sl-${d.id}`} inputMode="decimal" value={lay(d).sl} onChange={(e) => dat(d, "sl", e.target.value)} className={O_NHAP} /></div>
                <div><label className={NHAN_O} htmlFor={`lo-${d.id}`}>Số lô</label><input id={`lo-${d.id}`} value={lay(d).lo} onChange={(e) => dat(d, "lo", e.target.value)} className={O_NHAP} /></div>
                <div><span className={NHAN_O}>Hạn dùng</span><NgayChon ariaLabel={`Hạn dùng ${d.ten}`} giaTri={lay(d).han} onDoi={(x) => dat(d, "han", x)} /></div>
              </div>
            </li>
          ))}
        </ul>
        {loi && <p role="alert" className="mt-3 text-[13px] text-loi">{loi}</p>}
        <div className="mt-5 flex justify-end gap-3"><button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button><button type="button" disabled={dang} className={NUT_CHINH} onClick={gui}>Xác nhận nhận hàng</button></div>
      </Hop>
    </>
  );
}

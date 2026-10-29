"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU, CHON_HET } from "@/components/ui/dinh-dang";
import { soVN } from "@/lib/dinh-dang";

export type Phuong = { san_pham_id: string; ten: string; don_vi: string; dinh_muc: number };
export type CoDinh = { ten: string; don_vi: string; so_luong: number };
export type DichVuPhieu = { id: string; ten: string; phuongAn: Phuong[]; coDinh: CoDinh[] };

/** Bác sĩ chỉ định vật tư của ca: vật tư cố định tự có trong phiếu; vật tư theo chỉ định (đầu tip...) tích chọn + nhập số lượng thật. */
export function FormPhieu({ dichVu, khachId, lichId, chiNhanhId, bacSi, ktv, macDinhBacSi, action, nhan = "Tạo phiếu cấp" }: {
  dichVu: DichVuPhieu[]; khachId: string; lichId: string; chiNhanhId: string; bacSi: LuaChon[]; ktv: LuaChon[]; macDinhBacSi: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string; id?: string }>; nhan?: string;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [dv, setDv] = useState(dichVu.length === 1 ? dichVu[0].id : "");
  const [bs, setBs] = useState(macDinhBacSi);
  const [kt, setKt] = useState("");
  const [chon, setChon] = useState<Record<string, string>>({});
  const d = dichVu.find((x) => x.id === dv);
  const gui = () => {
    setLoi("");
    if (!d) return setLoi("Chọn dịch vụ.");
    if (!bs) return setLoi("Chọn bác sĩ chỉ định.");
    const chiDinh = d.phuongAn.filter((p) => chon[p.san_pham_id] !== undefined).map((p) => ({ san_pham_id: p.san_pham_id, so_luong: Number(chon[p.san_pham_id]) || p.dinh_muc }));
    const fd = new FormData();
    fd.set("lich_id", lichId); fd.set("khach_id", khachId); fd.set("chi_nhanh_id", chiNhanhId); fd.set("dich_vu_id", d.id); fd.set("bac_si_id", bs); fd.set("ktv_id", kt); fd.set("chi_dinh", JSON.stringify(chiDinh));
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); if (kq.id) router.push(`/phieu-cap/${kq.id}`); else router.refresh(); } });
  };
  return (
    <>
      <button type="button" className={NUT_CHINH} onClick={() => setMo(true)}>{nhan}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Phiếu cấp vật tư" moTa="Phiếu = định mức cố định + vật tư bác sĩ chỉ định. Không sửa tay số cấp sau khi ra phiếu." rong="rong">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={NHAN_O}>Dịch vụ</label><Chon trong="Chọn dịch vụ" ariaLabel="Dịch vụ" giaTri={dv} onDoi={(v) => { setDv(v); setChon({}); }} luaChon={dichVu.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} /></div>
          <div><label className={NHAN_O}>Bác sĩ chỉ định</label><Chon trong="Chọn bác sĩ" ariaLabel="Bác sĩ" giaTri={bs} onDoi={setBs} luaChon={bacSi} /></div>
          <div><label className={NHAN_O}>Chuyên viên trị liệu thực hiện</label><Chon trong="Chưa chọn" ariaLabel="Chuyên viên trị liệu" giaTri={kt} onDoi={setKt} luaChon={[{ gia_tri: "", nhan: "Chưa chọn" }, ...ktv]} /></div>
        </div>
        {d && (
          <div className="mt-5 space-y-4">
            {d.coDinh.length > 0 && (<div><div className="nhan-muc mb-1.5">Vật tư luôn cấp theo định mức</div><ul className="text-[14px] text-muc-2">{d.coDinh.map((c) => <li key={c.ten} className="flex justify-between border-b border-vien py-1.5"><span>{c.ten}</span><span className="tabular-nums">{soVN(c.so_luong)} {c.don_vi}</span></li>)}</ul></div>)}
            {d.phuongAn.length > 0 && (
              <div><div className="nhan-muc mb-1.5">Vật tư theo chỉ định của bác sĩ (tích loại dùng, nhập số lượng)</div>
                <ul>{d.phuongAn.map((p) => { const bat_ = chon[p.san_pham_id] !== undefined; return (
                  <li key={p.san_pham_id} className="flex items-center gap-3 border-b border-vien py-1.5 text-[14px]">
                    <button type="button" role="checkbox" aria-checked={bat_} aria-label={`Dùng ${p.ten}`} onClick={() => setChon((c) => { const n = { ...c }; if (bat_) delete n[p.san_pham_id]; else n[p.san_pham_id] = String(p.dinh_muc); return n; })}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border text-[12px] leading-none ${bat_ ? "border-nhan bg-nhan text-white" : "border-vien-dam"}`}>{bat_ ? "✓" : ""}</button>
                    <span className="flex-1 text-muc">{p.ten}</span><span className="text-[12px] text-muc-3">định mức {soVN(p.dinh_muc)} {p.don_vi}</span>
                    {bat_ && <input inputMode="decimal" {...CHON_HET} aria-label={`Số lượng ${p.ten}`} value={chon[p.san_pham_id]} onChange={(e) => setChon((c) => ({ ...c, [p.san_pham_id]: e.target.value.replace(/[^\d.]/g, "") }))} className="h-9 w-24 rounded-nho border border-vien-dam bg-giay-sang px-2 text-right tabular-nums outline-none focus:border-nhan" />}
                  </li>); })}</ul></div>
            )}
          </div>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang tạo" : "Ra phiếu"}</button></div>
      </Hop>
    </>
  );
}

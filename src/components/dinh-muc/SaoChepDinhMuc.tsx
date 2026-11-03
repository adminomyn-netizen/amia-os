"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { Bang } from "@/components/ui/Table";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { soVN } from "@/lib/dinh-dang";
import type { DongSaoChepDm } from "@/app/(app)/dinh-muc/actions";

/** "Sao chép định mức từ dịch vụ khác": chọn dịch vụ nguồn → xem trước từng vật tư (thêm mới / đã có nên giữ nguyên) → áp dụng. Chỉ thêm vật tư còn thiếu, không đổi số lượng đang có. */
export function SaoChepDinhMuc({ dichId, tenDich, luaChon, xemTruoc, apDung }: {
  dichId: string; tenDich: string; luaChon: LuaChon[];
  xemTruoc: (fd: FormData) => Promise<{ loi?: string; dong?: DongSaoChepDm[] }>; apDung: (fd: FormData) => Promise<{ ok?: true; loi?: string; them?: number; boQua?: number }>;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false), [nguon, setNguon] = useState("");
  const [dong, setDong] = useState<DongSaoChepDm[] | null>(null);
  const [loi, setLoi] = useState(""), [xong, setXong] = useState("");
  const [dang, bat] = useTransition();
  const fd = () => { const f = new FormData(); f.set("nguon", nguon); f.set("dich", dichId); return f; };
  const moi = (dong ?? []).filter((d) => !d.da_co).length;
  const xem = () => { setLoi(""); setXong(""); if (!nguon) { setLoi("Chọn dịch vụ để sao chép từ."); return; } bat(async () => { const kq = await xemTruoc(fd()); if (kq.loi) { setLoi(kq.loi); setDong(null); } else setDong(kq.dong ?? []); }); };
  const ap = () => bat(async () => { const kq = await apDung(fd()); if (kq.loi) { setLoi(kq.loi); return; } setXong(`Đã thêm ${kq.them} vật tư, giữ nguyên ${kq.boQua} vật tư đã có.`); setDong(null); router.refresh(); });
  return (
    <>
      <button type="button" className={NUT_PHU} onClick={() => { setMo(true); setDong(null); setLoi(""); setXong(""); }}>Sao chép từ dịch vụ khác</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Sao chép định mức vào ${tenDich}`} moTa="Chép vật tư và số lượng định mức của một dịch vụ khác sang dịch vụ này. Chỉ thêm vật tư dịch vụ này chưa có, không đổi số lượng đang có." rong="rong">
        <div><label htmlFor="scdm-nguon" className={NHAN_O}>Sao chép từ dịch vụ</label><Chon id="scdm-nguon" luaChon={luaChon} giaTri={nguon} onDoi={(v) => { setNguon(v); setDong(null); setLoi(""); setXong(""); }} trong="Chọn dịch vụ đã có định mức" /></div>
        {dong && (
          <div className="mt-5" aria-live="polite">
            <p className="mb-2 text-[13.5px] text-muc-2">Thêm mới {moi} · giữ nguyên {dong.length - moi} (đã có ở dịch vụ này)</p>
            <Bang duLieu={dong} khoa={(r) => r.san_pham_id}
              cot={[{ nhan: "Vật tư", chinh: true, hienThi: (r) => r.ten }, { nhan: "Số lượng", phai: true, hienThi: (r) => `${soVN(r.so_luong)} ${r.don_vi}` }, { nhan: "Cách cấp", hienThi: (r) => (r.chon_theo_chi_dinh ? "Bác sĩ chọn theo ca" : "Luôn cấp") }, { nhan: "Việc làm", hienThi: (r) => (r.da_co ? "Giữ nguyên" : "Thêm mới") }]} />
          </div>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        {xong && <div role="status" className="mt-4 rounded-nho border border-vien bg-giay-tram px-3 py-2.5 text-[14px] text-muc">{xong}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button>
          <button type="button" className={dong && moi > 0 ? NUT_PHU : NUT_CHINH} disabled={dang} onClick={xem}>{dang ? "Đang tính" : "Xem trước"}</button>
          {dong && moi > 0 && <button type="button" className={NUT_CHINH} disabled={dang} onClick={ap}>Áp dụng ({moi} vật tư)</button>}
        </div>
      </Hop>
    </>
  );
}

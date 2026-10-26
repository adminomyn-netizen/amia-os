"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NUT_CHINH, NUT_CHU, NUT_PHU } from "@/components/ui/dinh-dang";
import { NHOM_QUYEN, type Quyen } from "@/lib/quyen";
import { datQuyen } from "@/app/(app)/nhan-vien/actions";

/** Kỹ thuật tích chọn từng tính năng một người được dùng. Không tích gì ở "tính năng riêng" = người đó không dùng được gì. */
export function NutPhanQuyen({ id, hoTen, vaiTro, dangDung, macDinh, coRieng }: { id: string; hoTen: string; vaiTro: string; dangDung: Quyen[]; macDinh: boolean; coRieng: boolean }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [chon, setChon] = useState<Quyen[]>(dangDung);
  const [theoVaiTro, setTheoVaiTro] = useState(!coRieng);
  const [loi, setLoi] = useState("");

  const luu = () => {
    const fd = new FormData();
    fd.set("id", id);
    if (theoVaiTro) fd.set("mac_dinh", "1");
    else chon.forEach((q) => fd.append("quyen", q));
    bat(async () => {
      const kq = await datQuyen(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setMo(false); router.refresh(); }
    });
  };
  const doi = (q: Quyen) => setChon((x) => (x.includes(q) ? x.filter((y) => y !== q) : [...x, q]));

  return (
    <>
      <button type="button" className={NUT_CHU} onClick={() => { setChon(dangDung); setTheoVaiTro(!coRieng); setLoi(""); setMo(true); }}>Phân quyền{coRieng ? " ·riêng" : ""}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Phân quyền: ${hoTen}`} moTa={`Vai trò ${vaiTro}. Chọn đúng những gì người này được dùng; mục nào không tích thì ẩn khỏi menu và bị chặn.`} rong="rong">
        <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-[14px]">
          <input type="checkbox" checked={theoVaiTro} onChange={(e) => setTheoVaiTro(e.target.checked)} className="h-4 w-4 accent-[var(--nhan)]" />
          Theo quyền mặc định của vai trò{macDinh ? " (đang dùng)" : ""}
        </label>
        <div className={`grid gap-x-6 gap-y-5 sm:grid-cols-2 ${theoVaiTro ? "pointer-events-none opacity-45" : ""}`} aria-disabled={theoVaiTro}>
          {NHOM_QUYEN.map((g) => (
            <fieldset key={g.nhom} className="min-w-0">
              <legend className="nhan-muc mb-1.5">{g.nhom}</legend>
              <ul className="space-y-1">
                {g.muc.map((m) => (
                  <li key={m.ma}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[14px]">
                      <input type="checkbox" checked={chon.includes(m.ma)} onChange={() => doi(m.ma)} disabled={theoVaiTro} className="h-4 w-4 accent-[var(--nhan)]" />
                      <span>{m.nhan}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={luu}>{dang ? "Đang lưu" : "Lưu phân quyền"}</button>
        </div>
      </Hop>
    </>
  );
}

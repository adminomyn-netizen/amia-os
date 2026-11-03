"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

type KQ = { ok?: boolean; loi?: string; them?: number; boQua?: string[] };

/** Nút "Nhập Excel" của Danh mục (SalonHero: Nhập từ Excel). Chọn tệp .xlsx đúng mẫu, tuỳ chọn chọn nhóm nhận, máy chủ chỉ THÊM dòng mới và trả danh sách dòng bị bỏ kèm lý do. */
export function NutNhapExcel({ tieuDe, moTa, mau, chon, action }: {
  tieuDe: string; moTa: string; mau: string; chon?: { ten: string; nhan: string; luaChon: LuaChon[]; batBuoc?: boolean };
  action: (fd: FormData) => Promise<KQ>;
}) {
  const router = useRouter();
  const o = useRef<HTMLInputElement>(null);
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [tep, setTep] = useState<File | null>(null);
  const [nhom, setNhom] = useState("");
  const [loi, setLoi] = useState("");
  const [kq, setKq] = useState<KQ | null>(null);

  const gui = () => {
    setLoi("");
    if (!tep) return setLoi("Chọn tệp Excel (.xlsx) cần nhập.");
    if (chon?.batBuoc && !nhom) return setLoi(`Chọn ${chon.nhan.toLowerCase()}.`);
    const fd = new FormData();
    fd.set("tep", tep);
    if (chon) fd.set(chon.ten, nhom);
    bat(async () => {
      const r = await action(fd);
      if (r.loi) setLoi(r.loi);
      else { setKq(r); router.refresh(); }
    });
  };
  const dong = () => { setMo(false); setKq(null); setTep(null); setLoi(""); };

  return (
    <>
      <button type="button" className={NUT_PHU} onClick={() => { setKq(null); setLoi(""); setMo(true); }}>Nhập Excel</button>
      <Hop mo={mo} dong={dong} tieuDe={tieuDe} moTa={moTa}>
        {kq ? (
          <div>
            <p className="text-[15px] text-muc">Đã thêm <b>{kq.them ?? 0}</b> dòng mới.{kq.boQua?.length ? ` Bỏ qua ${kq.boQua.length} dòng.` : ""}</p>
            {!!kq.boQua?.length && (
              <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-nho border border-vien bg-giay-tram px-3.5 py-3 text-[13px] text-muc-2">
                {kq.boQua.slice(0, 50).map((b, i) => <li key={i}>{b}</li>)}
                {kq.boQua.length > 50 && <li>…và {kq.boQua.length - 50} dòng nữa.</li>}
              </ul>
            )}
            <div className="mt-6 flex justify-end"><button type="button" className={NUT_CHINH} onClick={dong}>Đóng</button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[14px] text-muc-2"><a href={mau} download className="text-nhan underline">Tải tệp mẫu (.xlsx)</a>, điền theo mẫu rồi chọn tệp. Chỉ thêm dòng mới; không sửa hay xoá dòng đang có.</p>
            {chon && (
              <div>
                <label className={NHAN_O}>{chon.nhan}{chon.batBuoc && <span className="text-loi"> *</span>}</label>
                <Chon luaChon={chon.luaChon} giaTri={nhom} onDoi={setNhom} trong="Chọn" />
              </div>
            )}
            <div>
              <input ref={o} type="file" accept=".xlsx" className="sr-only" aria-label="Chọn tệp Excel" onChange={(e) => { setTep(e.target.files?.[0] ?? null); e.target.value = ""; }} />
              <button type="button" className={NUT_PHU} onClick={() => o.current?.click()}>{tep ? "Chọn tệp khác" : "Chọn tệp"}</button>
              {tep && <span className="ml-3 break-all text-[13px] text-muc-2">{tep.name}</span>}
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2.5">
              <button type="button" className={NUT_PHU} onClick={dong}>Huỷ</button>
              <button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang nhập" : "Nhập dữ liệu"}</button>
            </div>
          </div>
        )}
      </Hop>
    </>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NUT_PHU } from "@/components/ui/dinh-dang";

type KQ = { ok?: boolean; loi?: string; canhBao?: string };

/** Ô chọn trên từng dòng bảng (dùng cùng NutXoaNhieu qua thuộc tính nhom). */
export function OChonDong({ nhom, id, ten }: { nhom: string; id: string; ten: string }) {
  return <input type="checkbox" data-chon-nhieu={nhom} value={id} aria-label={`Chọn ${ten}`} className="h-4 w-4 cursor-pointer accent-[var(--nhan)]" />;
}

/** Chọn nhiều + Xoá hàng loạt (SalonHero #/cards: ô chọn ở mỗi dòng + nút "Xóa" trên đầu bảng).
 *  Đọc các ô OChonDong cùng `nhom` đang được tích trên trang, hỏi lại rồi gọi action với danh sách `ids`. */
export function NutXoaNhieu({ nhom, don, canhBao, action }: { nhom: string; don: string; canhBao: string; action: (fd: FormData) => Promise<KQ> }) {
  const router = useRouter();
  const [n, setN] = useState(0);
  const [tong, setTong] = useState(0);
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const o = () => [...document.querySelectorAll<HTMLInputElement>(`input[data-chon-nhieu="${nhom}"]`)];
  useEffect(() => {
    const dem = () => { const ds = o(); setTong(ds.length); setN(ds.filter((x) => x.checked).length); };
    dem();
    const nghe = (e: Event) => { if ((e.target as HTMLElement | null)?.getAttribute?.("data-chon-nhieu") === nhom) dem(); };
    document.addEventListener("change", nghe);
    return () => document.removeEventListener("change", nghe);
  });
  const chonHet = (b: boolean) => { for (const x of o()) x.checked = b; setN(b ? o().length : 0); };
  const xoa = () => {
    setLoi("");
    const fd = new FormData();
    for (const x of o()) if (x.checked) fd.append("ids", x.value);
    bat(async () => {
      const kq = await action(fd);
      if (kq?.loi) { setLoi(kq.loi); return; }
      setMo(false); chonHet(false);
      if (kq?.canhBao) window.alert(kq.canhBao);
      router.refresh();
    });
  };
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px] text-muc-2">
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={tong > 0 && n === tong} onChange={(e) => chonHet(e.target.checked)} className="h-4 w-4 accent-[var(--nhan)]" aria-label={`Chọn tất cả ${don} trên trang này`} />
        Chọn tất cả trang này
      </label>
      <span className="text-muc-3">Đã chọn {n}</span>
      <button type="button" disabled={!n} onClick={() => { setLoi(""); setMo(true); }} className="text-[13px] font-medium text-loi underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muc-3 disabled:no-underline">Xoá {n ? `${n} ${don} đã chọn` : "đã chọn"}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Xoá ${n} ${don}`}>
        <p className="text-[14px] text-muc-2">Bạn có muốn xoá {n} {don} đã chọn không?</p>
        <p className="mt-2 text-[13.5px] text-muc-3">{canhBao}</p>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
          <button type="button" disabled={dang} onClick={xoa} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white disabled:opacity-60">{dang ? "Đang xoá" : "Xoá"}</button>
        </div>
      </Hop>
    </div>
  );
}

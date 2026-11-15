"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

export const FORM_GIA_HAN = "gia-han-the";

/** Ô tích từng thẻ (đặt trong bảng, gắn vào form Gia hạn bằng thuộc tính form=). */
export function OChonThe({ id, ma }: { id: string; ma: string }) {
  return <input type="checkbox" name="ids" value={id} form={FORM_GIA_HAN} aria-label={`Chọn thẻ ${ma}`} className="h-4 w-4 accent-[var(--nhan)]" />;
}

/** Như SalonHero "Khách hàng dùng thẻ": tích chọn nhiều thẻ → Gia hạn thẻ (đặt ngày hết hạn mới cho cả loạt). */
type HanhDong = (fd: FormData) => Promise<{ ok?: true; loi?: string; soThe?: number }>;
/** + Khoá / Mở khoá hàng loạt (khi truyền `khoa`): dùng chung ô Lý do (bắt buộc với khoá/mở khoá). */
export function GiaHanHangLoat({ action, khoa }: { action: HanhDong; khoa?: HanhDong }) {
  const router = useRouter();
  const [han, setHan] = useState(""), [tb, setTb] = useState<{ loi?: string; ok?: string }>({});
  const [dang, bat] = useTransition();
  const hop = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[form="${FORM_GIA_HAN}"][name="ids"]`));
  const chonHet = (v: boolean) => hop().forEach((x) => { x.checked = v; });
  const gui = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const n = fd.getAll("ids").length;
    if (!n) { setTb({ loi: "Bạn chưa tích chọn thẻ nào." }); return; }
    if (!han) { setTb({ loi: "Chọn ngày hết hạn mới." }); return; }
    if (!window.confirm(`Gia hạn ${n} thẻ đã chọn tới ngày ${han.split("-").reverse().join("/")}?`)) return;
    setTb({});
    bat(async () => {
      const kq = await action(fd);
      if (kq.loi) setTb({ loi: kq.loi });
      else { setTb({ ok: `Gia hạn thẻ thành công (${kq.soThe ?? 0} thẻ).` }); chonHet(false); router.refresh(); }
    });
  };
  const doiTT = (tt: "khoa" | "hoat_dong") => {
    const f = document.getElementById(FORM_GIA_HAN) as HTMLFormElement | null;
    if (!f || !khoa) return;
    const fd = new FormData(f); fd.set("trang_thai", tt);
    const n = fd.getAll("ids").length, chu = tt === "khoa" ? "Khoá" : "Mở khoá";
    if (!n) { setTb({ loi: "Bạn chưa tích chọn thẻ nào." }); return; }
    if (String(fd.get("ly_do") ?? "").trim().length < 3) { setTb({ loi: `Nhập lý do ${chu.toLowerCase()} thẻ (ít nhất 3 ký tự) vào ô Lý do.` }); return; }
    if (!window.confirm(`${chu} ${n} thẻ đã chọn?`)) return;
    setTb({});
    bat(async () => {
      const kq = await khoa(fd);
      if (kq.loi) setTb({ loi: kq.loi });
      else { setTb({ ok: `${chu} thẻ thành công (${kq.soThe ?? 0} thẻ).` }); chonHet(false); router.refresh(); }
    });
  };
  return (
    <form id={FORM_GIA_HAN} onSubmit={gui} className="the-noi the-noi-thap flex flex-wrap items-end gap-3 px-4 py-3">
      <label className="flex h-10 items-center gap-2 text-[14px] text-muc"><input type="checkbox" onChange={(e) => chonHet(e.target.checked)} className="h-4 w-4 accent-[var(--nhan)]" />Chọn cả trang</label>
      <label className="block text-[13px]"><span className="mb-1 block font-medium text-muc-2">Ngày hết hạn mới</span>
        <input type="date" name="han_moi" value={han} onChange={(e) => setHan(e.target.value)} className={`${O_NHAP} !h-10 !w-44`} /></label>
      <label className="block text-[13px]"><span className="mb-1 block font-medium text-muc-2">{khoa ? "Lý do (bắt buộc khi khoá / mở khoá)" : "Lý do (không bắt buộc)"}</span>
        <input name="ly_do" maxLength={300} placeholder="Gia hạn hàng loạt" className={`${O_NHAP} !h-10 !w-56`} /></label>
      <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang xử lý…" : "Gia hạn thẻ"}</button>
      {khoa && <button type="button" disabled={dang} onClick={() => doiTT("khoa")} className={NUT_PHU}>Khoá thẻ</button>}
      {khoa && <button type="button" disabled={dang} onClick={() => doiTT("hoat_dong")} className={NUT_PHU}>Mở khoá thẻ</button>}
      {tb.loi && <p role="alert" className="w-full text-[13px] text-loi">{tb.loi}</p>}
      {tb.ok && <p role="status" className="w-full text-[13px] text-nhan-dam">{tb.ok}</p>}
    </form>
  );
}

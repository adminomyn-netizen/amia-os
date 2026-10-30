"use client";

import { useEffect, useState, useTransition } from "react";
import { Hop } from "@/components/ui/Hop";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, CHON_HET } from "@/components/ui/dinh-dang";
import { ngayVN } from "@/lib/dinh-dang";
import type { VoucherTim } from "@/lib/voucher";
import type { dsVoucher, layVoucher } from "@/app/(app)/ban-hang/actions";

/** Hộp "Áp dụng voucher (n)" của màn Thu ngân theo SalonHero: ô "Kiểm tra mã", danh sách Mã voucher · Tên voucher · Giảm giá · Ngày hiệu lực · Ngày hết hạn · Áp dụng cho · Chọn, nút Đóng / Áp dụng.
 *  Danh sách gồm voucher đang dùng được (cài "Hiển thị trên tìm kiếm thu ngân" là Có hoặc Tự động chọn) cộng với mã vừa kiểm. Mỗi đơn chọn một voucher. */
export function HopVoucher({ dong, chiNhanhId, khachId, lichId = null, dangDung, lay, ds, apDung }: {
  dong: () => void; chiNhanhId: string; khachId: string | null; lichId?: string | null; dangDung: VoucherTim | null;
  lay: typeof layVoucher; ds: typeof dsVoucher; apDung: (v: VoucherTim) => void;
}) {
  const [dang, bat] = useTransition();
  const [dsHien, setDsHien] = useState<VoucherTim[]>(dangDung ? [dangDung] : []);
  const [chon, setChon] = useState<string | null>(dangDung?.maId ?? null);
  const [ma, setMa] = useState("");
  const [loi, setLoi] = useState("");
  const [taiXong, setTaiXong] = useState(false);
  useEffect(() => {
    let con = true;
    if (!chiNhanhId) return;
    ds(chiNhanhId, khachId, lichId).then((r) => {
      if (!con) return;
      setDsHien((cu) => [...cu, ...r.filter((x) => !cu.some((y) => y.maId === x.maId))]);
      const tuDong = r.find((x) => x.tuDong);
      if (tuDong) setChon((c) => c ?? tuDong.maId);
      setTaiXong(true);
    });
    return () => { con = false; };
  }, [ds, chiNhanhId, khachId, lichId]);
  const kiemTra = () => {
    setLoi("");
    bat(async () => {
      const kq = await lay(ma, chiNhanhId, khachId, lichId);
      if (!kq.ok) return setLoi(kq.loi);
      setDsHien((cu) => (cu.some((x) => x.maId === kq.v.maId) ? cu : [kq.v, ...cu]));
      setChon(kq.v.maId); setMa("");
    });
  };
  const dangChon = dsHien.find((x) => x.maId === chon) ?? null;
  return (
    <Hop mo dong={dong} tieuDe={`Áp dụng voucher (${dsHien.length})`} moTa="Nhập mã khách đưa rồi bấm Kiểm tra mã, hoặc chọn voucher trong danh sách. Mỗi đơn dùng một voucher." rong="rong">
      <label htmlFor="o-ma-voucher" className={NHAN_O}>Mã voucher</label>
      <div className="flex items-center gap-2">
        <input id="o-ma-voucher" {...CHON_HET} autoCapitalize="characters" className={`${O_NHAP} uppercase`} value={ma} placeholder="Nhập mã"
          onChange={(e) => { setMa(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30)); setLoi(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (ma) kiemTra(); } }} />
        <button type="button" className={`shrink-0 ${NUT_PHU}`} disabled={dang || !ma} onClick={kiemTra}>Kiểm tra mã</button>
      </div>
      {loi && <p role="alert" className="mt-2 rounded-nho bg-loi-nen px-3 py-2 text-[13px] text-loi">{loi}</p>}
      <ul className="mt-4 space-y-2" aria-label="Danh sách voucher">
        {dsHien.map((v) => (
          <li key={v.maId}>
            <label className={`grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-the border px-3 py-2.5 text-[13px] ${chon === v.maId ? "border-nhan bg-nhan-nhat/40" : "border-vien"}`}>
              <input type="radio" name="chon-voucher" checked={chon === v.maId} onChange={() => setChon(v.maId)} className="row-span-4 mt-1 h-4 w-4 accent-[var(--nhan)]" aria-label={`Chọn voucher ${v.ma}`} />
              <span className="text-[14px] font-medium text-muc">{v.ma} <span className="font-normal text-muc-2">· {v.ten}</span></span>
              <span className="text-muc-2">Giảm giá: <span className="font-medium text-muc">{v.giamGia}</span></span>
              <span className="text-muc-3">Ngày hiệu lực: {ngayVN(v.tuNgay)} · Ngày hết hạn: {ngayVN(v.denNgay)}</span>
              <span className="text-muc-3">Áp dụng cho: {v.apDung}</span>
            </label>
          </li>
        ))}
        {dsHien.length === 0 && <li className="py-6 text-center text-[14px] text-muc-3">{!chiNhanhId ? "Chọn chi nhánh bán trước để xem voucher." : taiXong ? "Không có voucher nào hiển thị. Nhập mã rồi bấm Kiểm tra mã." : "Đang tải…"}</li>}
      </ul>
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" className={NUT_PHU} onClick={dong}>Đóng</button>
        <button type="button" className={NUT_CHINH} disabled={!dangChon} onClick={() => dangChon && apDung(dangChon)}>Áp dụng</button>
      </div>
    </Hop>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { NUT_CHINH, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import type { luuDanhGia } from "@/app/(app)/hoa-don/actions";

type Dong = { nhanVienId: string; ten: string; diem: number; yKien: string };

/** Ghi đánh giá 1–5 sao + ý kiến cho từng nhân viên phục vụ của hoá đơn. Người không có quyền ghi chỉ xem. Ô sao to (44 px) để bấm bằng ngón tay trên điện thoại. */
export function DanhGiaNhanVien({ hoaDonId, dong, duocGhi, luu }: { hoaDonId: string; dong: Dong[]; duocGhi: boolean; luu: typeof luuDanhGia }) {
  const router = useRouter();
  const [v, setV] = useState(dong);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [ok, setOk] = useState(false);
  const sua = (i: number, p: Partial<Dong>) => { setOk(false); setV((x) => x.map((y, j) => (j === i ? { ...y, ...p } : y))); };
  const gui = () => {
    setLoi(""); setOk(false);
    const dg = v.filter((x) => x.diem > 0).map((x) => ({ nhanVienId: x.nhanVienId, diem: x.diem, yKien: x.yKien }));
    if (!dg.length) return setLoi("Chọn số sao cho ít nhất một nhân viên.");
    bat(async () => {
      const kq = await luu(JSON.stringify({ hoaDonId, dg }));
      if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); }
    });
  };
  return (
    <div>
      <ul className="divide-y divide-vien">
        {v.map((x, i) => (
          <li key={x.nhanVienId} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-medium text-muc">{x.ten}</span>
              {duocGhi ? (
                <span role="radiogroup" aria-label={`Số sao cho ${x.ten}`} className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={x.diem === n} aria-label={`${n} sao`} onClick={() => sua(i, { diem: n })} className="flex h-11 w-11 items-center justify-center">
                      <Star aria-hidden strokeWidth={1.6} className={`h-6 w-6 ${n <= x.diem ? "fill-canh-bao text-canh-bao" : "text-vien-dam"}`} />
                    </button>
                  ))}
                </span>
              ) : (
                <span className="text-[14px] tabular-nums text-muc-2">{x.diem ? `${x.diem} sao` : "Chưa đánh giá"}</span>
              )}
            </div>
            {duocGhi ? (
              <textarea aria-label={`Ý kiến đánh giá ${x.ten}`} placeholder="Ý kiến đánh giá (không bắt buộc)" maxLength={1000} className={O_NHIEU_DONG} style={{ minHeight: 56 }} value={x.yKien} onChange={(e) => sua(i, { yKien: e.target.value })} />
            ) : x.yKien ? <p className="mt-1 text-[13px] text-muc-2">{x.yKien}</p> : null}
          </li>
        ))}
      </ul>
      {duocGhi && (
        <div className="mt-3 space-y-2">
          {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
          {ok && <p role="status" className="rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Đã lưu đánh giá.</p>}
          <button type="button" disabled={dang} onClick={gui} className={`${NUT_CHINH} h-11 w-full sm:w-auto`}>{dang ? "Đang lưu" : "Lưu đánh giá"}</button>
        </div>
      )}
    </div>
  );
}

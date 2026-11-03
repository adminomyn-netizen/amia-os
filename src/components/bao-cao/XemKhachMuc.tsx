"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { layKhachCuaMuc, type KhachCuaMuc } from "@/app/(app)/bao-cao/actions";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";

/** Nút "Xem danh sách khách" của một dòng báo cáo Theo sản phẩm / dịch vụ. Chỉ tải danh sách của dòng này khi bấm (mỗi lần một dòng). */
export function XemKhachMuc({ loai, ten, tu, den, cn }: { loai: string; ten: string; tu: string; den: string; cn: string }) {
  const [mo, setMo] = useState(false);
  const [ds, setDs] = useState<{ rows: KhachCuaMuc[]; tong: number } | null>(null);
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const bam = () => {
    if (mo) { setMo(false); return; }
    setMo(true);
    if (ds) return;
    setLoi("");
    bat(async () => { const kq = await layKhachCuaMuc(loai, ten, tu, den, cn); if (kq.ok) setDs({ rows: kq.rows, tong: kq.tong }); else setLoi(kq.loi); });
  };
  return (
    <div>
      <button type="button" onClick={bam} aria-expanded={mo} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">{mo ? "Ẩn danh sách" : "Xem danh sách khách"}</button>
      {mo && (
        <div className="mt-2 text-[13px]">
          {dang && <p className="text-muc-3">Đang tải…</p>}
          {loi && <p role="alert" className="text-loi">{loi}</p>}
          {ds && (ds.rows.length === 0 ? <p className="text-muc-3">Không có khách nào.</p> : (
            <>
              <ul className="space-y-1">
                {ds.rows.map((k, i) => (
                  <li key={`${k.hoaDonId}-${i}`}>
                    {k.khachId ? <Link href={`/khach-hang/${k.khachId}`} className="text-muc hover:underline">{k.ten}</Link> : k.ten}
                    {k.dienThoai ? <span className="text-muc-3"> · {k.dienThoai}</span> : null}
                    <span className="text-muc-3"> · <Link href={`/hoa-don/${k.hoaDonId}`} className="hover:underline">{k.maHd}</Link> · {ngayVN(k.ngay)}{k.soLuong > 1 ? ` · SL ${soVN(k.soLuong)}` : ""} · {tienVN(k.thanhTien)}</span>
                  </li>
                ))}
              </ul>
              {ds.tong > ds.rows.length && <p className="mt-1 text-muc-3">… còn {soVN(ds.tong - ds.rows.length)} dòng cũ hơn, thu hẹp khoảng ngày để xem.</p>}
            </>
          ))}
        </div>
      )}
    </div>
  );
}

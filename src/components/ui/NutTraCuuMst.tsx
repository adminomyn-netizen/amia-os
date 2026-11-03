"use client";

import { useState } from "react";
import { NUT_CHU } from "@/components/ui/dinh-dang";
import { traCuuMst, TRANG_TRA_CUU_GDT, chuanMst } from "@/lib/tra-cuu-mst";

/** Nút "Tra cứu MST" như SalonHero: lấy tên + địa chỉ doanh nghiệp theo MST rồi điền vào biểu mẫu.
 *  Tra không được (quá hạn mức, mạng) thì đưa đường dẫn trang Tổng cục Thuế và nút chép MST để tra tay. */
export function NutTraCuuMst({ mst, onKetQua, nhan = "Tra cứu MST" }: { mst: string; onKetQua: (kq: { ten: string; diaChi: string }) => void; nhan?: string }) {
  const [dang, setDang] = useState(false);
  const [tin, setTin] = useState<{ kieu: "ok" | "loi"; chu: string } | null>(null);
  const [duPhong, setDuPhong] = useState(false);
  const tra = async () => {
    setDang(true); setTin(null); setDuPhong(false);
    const kq = await traCuuMst(mst);
    setDang(false);
    if ("ok" in kq) { onKetQua(kq.ok); setTin({ kieu: "ok", chu: `Đã điền: ${kq.ok.ten}` }); return; }
    if ("khongThay" in kq) { setTin({ kieu: "loi", chu: "Không tìm thấy thông tin về MST này." }); setDuPhong(true); return; }
    setTin({ kieu: "loi", chu: kq.loi });
    setDuPhong(!kq.loi.startsWith("Hãy điền") && !kq.loi.startsWith("Mã số thuế"));
  };
  return (
    <div className="mt-1.5 text-[12.5px]" aria-live="polite">
      <button type="button" className={NUT_CHU} disabled={dang} onClick={tra}>{dang ? "Đang tra cứu" : nhan}</button>
      {tin && <span className={`ml-2 ${tin.kieu === "ok" ? "text-muc-2" : "text-loi"}`}>{tin.chu}</span>}
      {duPhong && (
        <span className="mt-1 block text-muc-3">
          Tra tay ở <a href={TRANG_TRA_CUU_GDT} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">trang Tổng cục Thuế</a> (có mã xác nhận, phải dán MST vào ô).{" "}
          <button type="button" className="text-nhan-dam hover:underline" onClick={() => { void navigator.clipboard?.writeText(chuanMst(mst)).catch(() => undefined); }}>Chép MST</button>
        </span>
      )}
    </div>
  );
}

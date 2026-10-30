"use client";

import { useEffect, useState } from "react";
import { tienVN } from "@/lib/dinh-dang";
import { KENH_MAN_HINH_KHACH, type DonChoKhach } from "@/lib/ban-hang";

export function ManHinhKhach() {
  const [don, setDon] = useState<DonChoKhach | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const kenh = new BroadcastChannel(KENH_MAN_HINH_KHACH);
    kenh.onmessage = (e: MessageEvent<{ loai: "don"; don: DonChoKhach | null }>) => { if (e.data?.loai === "don") setDon(e.data.don); };
    kenh.postMessage({ loai: "hoi" });
    return () => kenh.close();
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-8 sm:px-8">
      <header className="mb-6 border-b border-vien pb-4">
        <h1 className="chu-tieu-de text-[28px] text-muc">{don?.khach ? `Xin chào ${don.khach}` : "Xin chào quý khách"}</h1>
        <p className="mt-1 text-[14px] text-muc-3">Đơn của quý khách đang được tính</p>
      </header>
      {!don || don.dong.length === 0 ? (
        <p className="py-16 text-center text-[16px] text-muc-3">Đang chờ nhân viên thêm dịch vụ vào đơn.</p>
      ) : (
        <>
          <ul className="divide-y divide-vien">
            {don.dong.map((d, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3 text-[16px]">
                <span className="min-w-0 text-muc">{d.ten}<span className="ml-2 text-[14px] text-muc-3">x{d.sl}</span></span>
                <span className="shrink-0 tabular-nums text-muc">{tienVN(d.thanh)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-vien pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-muc-3">Tiền hàng</dt><dd className="tabular-nums">{tienVN(don.hang)}</dd></div>
            {don.giam > 0 && <div className="flex justify-between"><dt className="text-muc-3">Giảm giá</dt><dd className="tabular-nums">− {tienVN(don.giam)}</dd></div>}
            {don.vat > 0 && <div className="flex justify-between"><dt className="text-muc-3">VAT</dt><dd className="tabular-nums">{tienVN(don.vat)}</dd></div>}
            {don.phuPhiTip > 0 && <div className="flex justify-between"><dt className="text-muc-3">Phụ phí và tip</dt><dd className="tabular-nums">{tienVN(don.phuPhiTip)}</dd></div>}
            <div className="-mx-3 mt-2 flex items-center justify-between border-t-2 border-nhan bg-nhan-nhat px-3 py-4 text-nhan-dam"><dt className="text-[18px] font-semibold">Quý khách thanh toán</dt><dd className="text-[24px] font-semibold tabular-nums">{tienVN(don.phai)}</dd></div>
            {don.daThu > 0 && <div className="flex justify-between"><dt className="text-muc-3">Đã thu</dt><dd className="tabular-nums">{tienVN(don.daThu)}</dd></div>}
            {don.daThu > 0 && don.conNo > 0 && <div className="flex justify-between font-medium text-canh-bao"><dt>Còn lại</dt><dd className="tabular-nums">{tienVN(don.conNo)}</dd></div>}
          </dl>
        </>
      )}
    </main>
  );
}

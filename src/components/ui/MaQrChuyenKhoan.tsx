"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Maximize2 } from "lucide-react";
import { Hop } from "@/components/ui/Hop";
import { tienVN } from "@/lib/dinh-dang";
import { chuanTenNganHang } from "@/lib/ngan-hang-ten";
import { noiDungChuyenKhoan, vietQrTaiKhoan } from "@/lib/vietqr";

/** Mã VietQR chuyển khoản tới một tài khoản nhận tiền, như SalonHero ("Mời quét mã" ở hộp thanh toán khi chọn Chuyển khoản).
 *  Chuỗi VietQR dựng ngay trong trình duyệt (src/lib/vietqr.ts), ảnh vẽ bằng thư viện qrcode — không gọi dịch vụ ngoài.
 *  Bấm vào mã để phóng to cho khách quét (đủ ngân hàng, chủ TK, số TK, số tiền, nội dung). */
export type TkQr = { nganHang: string; chu: string; so: string };

export function useAnhQr(chuoi: string | null, rong = 480) {
  const [anh, setAnh] = useState<{ chuoi: string; url: string } | null>(null);
  useEffect(() => {
    if (!chuoi) return;
    let huy = false;
    // Đợi người dùng gõ xong số tiền rồi mới vẽ lại.
    const t = setTimeout(() => { QRCode.toDataURL(chuoi, { margin: 1, width: rong, errorCorrectionLevel: "M" }).then((url) => { if (!huy) setAnh({ chuoi, url }); }).catch(() => { /* vẽ lỗi: giữ trống */ }); }, 150);
    return () => { huy = true; clearTimeout(t); };
  }, [chuoi, rong]);
  return chuoi && anh?.chuoi === chuoi ? anh.url : null;
}

export function MaQrChuyenKhoan({ tk, soTien, noiDung, co = 128, tieuDe = "Mời quét mã", gon }: {
  tk: TkQr; soTien?: number; noiDung?: string; /** cạnh ảnh nhỏ (px) */ co?: number; tieuDe?: string; /** chỉ ảnh + chữ "Phóng to", không dòng thông tin */ gon?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const chuoi = vietQrTaiKhoan({ ngan_hang: tk.nganHang, so_tai_khoan: tk.so }, soTien, noiDung);
  const anh = useAnhQr(chuoi);
  const ten = chuanTenNganHang(tk.nganHang) ?? tk.nganHang;
  const nd = noiDungChuyenKhoan(noiDung);
  if (!chuoi) return <p className="text-[12px] text-canh-bao">Chưa dựng được mã QR cho {ten}: {tk.so.replace(/\D/g, "").length < 6 ? "thiếu số tài khoản" : "ngân hàng này chưa có mã Napas (BIN) trong AMIA"}.</p>;
  const thongTin: [string, string][] = [["Ngân hàng", ten], ["Chủ tài khoản", tk.chu], ["Số tài khoản", tk.so], ...(soTien && soTien > 0 ? [["Số tiền", tienVN(soTien)] as [string, string]] : []), ...(nd ? [["Nội dung", nd] as [string, string]] : [])];
  return (
    <>
      <button type="button" onClick={() => setMo(true)} aria-label={`${tieuDe}: phóng to mã QR ${ten}`} className="group flex items-start gap-3 rounded-nho text-left">
        <span className="relative shrink-0 rounded-nho border border-vien bg-white p-1" style={{ width: co + 10, height: co + 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {anh ? <img src={anh} alt={`Mã QR chuyển khoản ${ten}`} width={co} height={co} className="block" /> : <span className="block animate-pulse bg-giay-tram" style={{ width: co, height: co }} />}
          <span className="absolute bottom-1 right-1 rounded-tag bg-white/90 p-0.5 text-muc-2 group-hover:text-nhan-dam"><Maximize2 aria-hidden strokeWidth={1.8} className="h-3.5 w-3.5" /></span>
        </span>
        {!gon && (
          <span className="min-w-0 text-[12.5px] leading-5 text-muc-2">
            <span className="block font-semibold text-nhan-dam">{tieuDe}</span>
            <span className="block">{ten} · <span className="tabular-nums">{tk.so}</span></span>
            <span className="block truncate">{tk.chu}</span>
            {soTien && soTien > 0 ? <span className="block font-medium tabular-nums text-muc">{tienVN(soTien)}</span> : <span className="block text-muc-3">Khách tự nhập số tiền</span>}
            <span className="block text-nhan-dam underline-offset-4 group-hover:underline">Phóng to</span>
          </span>
        )}
      </button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={tieuDe} moTa="Khách mở ứng dụng ngân hàng, chọn Quét QR. Mã VietQR Napas 247.">
        <div className="mx-auto w-full max-w-[340px] rounded-hop border border-vien bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {anh ? <img src={anh} alt={`Mã QR chuyển khoản ${ten}`} className="block h-auto w-full" /> : <div className="aspect-square w-full animate-pulse bg-giay-tram" />}
        </div>
        <dl className="mx-auto mt-3 max-w-[340px] space-y-1 text-[14px]">
          {thongTin.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3"><dt className="shrink-0 text-muc-3">{k}</dt><dd className={`min-w-0 break-words text-right font-medium text-muc ${k === "Số tài khoản" || k === "Số tiền" ? "tabular-nums" : ""}`}>{v}</dd></div>
          ))}
        </dl>
      </Hop>
    </>
  );
}

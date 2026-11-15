"use client";

import { useSyncExternalStore } from "react";
import { BanInHoaDon, KHO_CUON, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { NutIn } from "@/components/hoa-don/NutIn";
import type { CauHinhIn } from "@/lib/thiet-lap-in";
import { useAnhQr } from "@/components/ui/MaQrChuyenKhoan";
import { chuoiQrIn, soTienQrIn } from "@/lib/vietqr";

const KHOA = "amia-in-tam-tinh";
const docTam = () => { try { return localStorage.getItem(KHOA); } catch { return null; } };
const dangKy = () => () => undefined;

/** Tờ in tạm tính: đọc đơn Thu ngân vừa gửi qua bộ nhớ trình duyệt (không qua máy chủ). */
export function InTamTinh({ cfg, cuaHang }: { cfg: CauHinhIn; cuaHang: DuLieuIn["cuaHang"] | null }) {
  const tho = useSyncExternalStore(dangKy, docTam, () => null);
  let d: DuLieuIn | null = null;
  try { d = tho ? (JSON.parse(tho) as DuLieuIn) : null; } catch { d = null; }
  // Mã QR cuối tờ y như SalonHero (cùng directive in với hoá đơn đã chốt): chỉ khi Thiết lập in bật QRCode, tài khoản của Thiết lập in,
  // số tiền theo các khoản thu đang nhập, nội dung = Ghi chú chuyển khoản (<ORDER_CODE> = mã hoá đơn khi đang sửa, đơn mới chưa có mã thì để trống).
  const qrChuoi = d ? chuoiQrIn(cfg, { soTien: soTienQrIn((d.qrThu ?? []).filter((t) => t.phuong_thuc !== "the_tien"), d.phaiThu - (d.tienTruThe ?? 0)), maHd: d.ma, tenKhach: d.khach?.ten }) : "";
  const anhQr = useAnhQr(qrChuoi || null, 240);
  if (d && qrChuoi) d = { ...d, qrAnh: anhQr };
  const giay = cfg.khoGiay;
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "12mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Bản tạm tính, chưa phải hoá đơn đã chốt · khổ giấy {giay}</p>
        {d && <NutIn kho={giay} />}
      </div>
      {d ? <BanInHoaDon cfg={cfg} d={{ ...d, cuaHang: cuaHang ?? d.cuaHang }} /> : <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Không có đơn tạm tính nào. Mở Thu ngân và bấm In hoá đơn.</p>}
    </main>
  );
}

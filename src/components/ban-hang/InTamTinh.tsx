"use client";

import { useSyncExternalStore } from "react";
import { BanInHoaDon, KHO_CUON, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { NutIn } from "@/components/hoa-don/NutIn";
import type { CauHinhIn } from "@/lib/thiet-lap-in";

const KHOA = "amia-in-tam-tinh";
const docTam = () => { try { return localStorage.getItem(KHOA); } catch { return null; } };
const dangKy = () => () => undefined;

/** Tờ in tạm tính: đọc đơn Thu ngân vừa gửi qua bộ nhớ trình duyệt (không qua máy chủ). */
export function InTamTinh({ cfg, cuaHang }: { cfg: CauHinhIn; cuaHang: DuLieuIn["cuaHang"] | null }) {
  const tho = useSyncExternalStore(dangKy, docTam, () => null);
  let d: DuLieuIn | null = null;
  try { d = tho ? (JSON.parse(tho) as DuLieuIn) : null; } catch { d = null; }
  const giay = cfg.khoGiay;
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "12mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Bản tạm tính, chưa phải hoá đơn đã chốt · khổ giấy {giay}</p>
        {d && <NutIn />}
      </div>
      {d ? <BanInHoaDon cfg={cfg} d={{ ...d, cuaHang: cuaHang ?? d.cuaHang }} /> : <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Không có đơn tạm tính nào. Mở Thu ngân và bấm In hoá đơn.</p>}
    </main>
  );
}

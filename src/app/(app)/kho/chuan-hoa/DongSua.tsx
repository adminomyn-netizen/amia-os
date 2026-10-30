"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { DON_VI_CHUAN } from "@/lib/chuan-hoa-kho";
import { luuChuanHoaVatTu } from "./actions";

export type DongVatTu = { id: string; ma: string; ten: string; nhom: string | null; don_vi: string; don_vi_mua: string | null; he_so_quy_doi: number; gia_nhap_don_vi: number | null; nhom_cap: string | null; tieu_hao: boolean; vanDe: string[] };

const O = "h-9 w-full rounded-nho border border-vien-dam bg-giay-sang px-2 text-[14px] text-muc outline-none focus:border-nhan";
const NHAN = "mb-1 block text-[12px] text-muc-3";
const DV = DON_VI_CHUAN.map((d) => ({ gia_tri: d, nhan: d }));

/** Một mặt hàng, sửa tại chỗ, lưu từng dòng (nhật ký truy cập ghi ở máy chủ). Người chỉ xem thấy giá trị, không thấy ô sửa. */
export function DongSua({ d, sua, nhanVanDe }: { d: DongVatTu; sua: boolean; nhanVanDe: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState({ don_vi: d.don_vi, don_vi_mua: d.don_vi_mua ?? "", he_so: String(d.he_so_quy_doi), gia: d.gia_nhap_don_vi == null ? "" : String(d.gia_nhap_don_vi), nhom_cap: d.nhom_cap ?? "", tieu_hao: d.tieu_hao });
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false), [dang, bat] = useTransition();
  const dvChon = DV.some((x) => x.gia_tri === v.don_vi) ? DV : [{ gia_tri: v.don_vi, nhan: `${v.don_vi} (chưa chuẩn)` }, ...DV];
  const dvmChon = [{ gia_tri: "", nhan: "Chưa có" }, ...(v.don_vi_mua && !DV.some((x) => x.gia_tri === v.don_vi_mua) ? [{ gia_tri: v.don_vi_mua, nhan: `${v.don_vi_mua} (chưa chuẩn)` }] : []), ...DV];
  const luu = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("id", d.id); fd.set("don_vi", v.don_vi); fd.set("don_vi_mua", v.don_vi_mua); fd.set("he_so_quy_doi", v.he_so); fd.set("gia_nhap_don_vi", v.gia); fd.set("nhom_cap", v.nhom_cap); fd.set("tieu_hao", v.tieu_hao ? "1" : "0");
    bat(async () => {
      const r = await luuChuanHoaVatTu(fd);
      if (r.loi) setLoi(r.loi); else { setOk(true); router.refresh(); }
    });
  };
  return (
    <li className="border-b border-vien py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 text-[15px] font-medium text-muc">{d.ten} <span className="font-normal text-muc-3">· {d.ma}{d.nhom ? ` · ${d.nhom}` : ""}</span></p>
        <p className="text-[12.5px] text-canh-bao">{d.vanDe.map((x) => nhanVanDe[x]).filter(Boolean).join(" · ")}</p>
      </div>
      {sua ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
          <div><span className={NHAN}>Đơn vị dùng</span><Chon luaChon={dvChon} giaTri={v.don_vi} onDoi={(x) => setV((s) => ({ ...s, don_vi: x }))} nho ariaLabel={`Đơn vị dùng ${d.ten}`} /></div>
          <div><span className={NHAN}>Đơn vị mua</span><Chon luaChon={dvmChon} giaTri={v.don_vi_mua} onDoi={(x) => setV((s) => ({ ...s, don_vi_mua: x }))} nho ariaLabel={`Đơn vị mua ${d.ten}`} /></div>
          <label><span className={NHAN}>1 đơn vị mua = ? đơn vị dùng</span><input inputMode="decimal" value={v.he_so} onChange={(e) => setV((s) => ({ ...s, he_so: e.target.value }))} className={O} /></label>
          <label><span className={NHAN}>Giá nhập mỗi đơn vị dùng</span><input inputMode="decimal" value={v.gia} placeholder="chưa có" onChange={(e) => setV((s) => ({ ...s, gia: e.target.value }))} className={O} /></label>
          <div><span className={NHAN}>Nhóm cấp</span><Chon luaChon={[{ gia_tri: "", nhan: "Chưa có" }, { gia_tri: "A", nhan: "A (cấp cố định theo định mức)" }, { gia_tri: "B", nhan: "B" }, { gia_tri: "C", nhan: "C (không vào phiếu cấp)" }]} giaTri={v.nhom_cap} onDoi={(x) => setV((s) => ({ ...s, nhom_cap: x }))} nho ariaLabel={`Nhóm cấp ${d.ten}`} /></div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-[13px] text-muc-2"><input type="checkbox" checked={v.tieu_hao} onChange={(e) => setV((s) => ({ ...s, tieu_hao: e.target.checked }))} />Vật tư tiêu hao</label>
            <button type="button" onClick={luu} disabled={dang} className={NUT_PHU}>{dang ? "Đang lưu…" : "Lưu dòng này"}</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muc-3">Dùng: {d.don_vi} · mua: {d.don_vi_mua ?? "chưa có"} (×{d.he_so_quy_doi}) · giá nhập: {d.gia_nhap_don_vi == null ? "chưa có" : d.gia_nhap_don_vi.toLocaleString("vi-VN")} · nhóm cấp: {d.nhom_cap ?? "chưa có"}{d.tieu_hao ? " · tiêu hao" : ""}</p>
      )}
      {(loi || ok) && <p role={loi ? "alert" : "status"} className={`mt-2 text-[13px] ${loi ? "text-loi" : "text-nhan-dam"}`}>{loi || "Đã lưu."}</p>}
    </li>
  );
}

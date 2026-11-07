"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NutHop } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { CHON_HET, NUT_CHU, NUT_CHU_NGUY } from "@/components/ui/dinh-dang";
import { soVN } from "@/lib/dinh-dang";

type KQ = { ok?: boolean; loi?: string };
export type DongPhieuBuoi = { id: string; san_pham_id: string; ten: string; don_vi: string; so_cap: number; dinh_muc: number };

/** Một dòng vật tư của phiếu theo buổi: sửa số lượng (bấm Lưu) hoặc bỏ dòng. Sửa/bỏ là mất xác nhận cũ, chuyên viên phải xác nhận lại. */
function DongSua({ phieuId, d, sua, xoa }: { phieuId: string; d: DongPhieuBuoi; sua: (fd: FormData) => Promise<KQ>; xoa: (fd: FormData) => Promise<KQ> }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  // Số kiểu Việt: dấu phẩy là thập phân (so() ở máy chủ bỏ dấu chấm vì coi là phân cách hàng nghìn).
  const [sl, setSl] = useState(String(d.so_cap).replace(".", ","));
  const [loi, setLoi] = useState("");
  const doi = Number(sl.replace(",", ".")) !== d.so_cap;
  const chay = (action: (fd: FormData) => Promise<KQ>, them: Record<string, string>) => {
    setLoi("");
    bat(async () => {
      const fd = new FormData();
      fd.set("id", phieuId); fd.set("dong_id", d.id);
      for (const [k, v] of Object.entries(them)) fd.set(k, v);
      const kq = await action(fd);
      if (kq.loi) setLoi(kq.loi); else router.refresh();
    });
  };
  return (
    <li className="border-b border-vien py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-muc">{d.ten}</div>
          <div className="text-[12px] text-muc-3">{d.dinh_muc > 0 ? `Định mức ${soVN(d.dinh_muc)} ${d.don_vi}` : "Ngoài định mức (thêm tay)"}</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`sl-${d.id}`}>Số lượng {d.ten}</label>
          <input id={`sl-${d.id}`} inputMode="decimal" {...CHON_HET} value={sl} onChange={(e) => setSl(e.target.value.replace(/\./g, ",").replace(/[^\d,]/g, ""))}
            className="h-10 w-24 rounded-nho border border-vien-dam bg-giay-sang px-2 text-right tabular-nums outline-none focus:border-nhan" />
          <span className="w-12 text-[13px] text-muc-3">{d.don_vi}</span>
          <button type="button" className={NUT_CHU} disabled={dang || !doi} onClick={() => chay(sua, { so_luong: sl })}>{dang ? "Đang lưu" : "Lưu"}</button>
          <button type="button" className={NUT_CHU_NGUY} disabled={dang} onClick={() => { if (window.confirm(`Bỏ "${d.ten}" khỏi phiếu?`)) chay(xoa, {}); }}>Bỏ</button>
        </div>
      </div>
      {loi && <p role="alert" className="mt-1.5 text-[12.5px] text-loi">{loi}</p>}
    </li>
  );
}

/** Bảng vật tư của phiếu theo buổi khi CHƯA chốt: chuyên viên trị liệu kiểm tên + số lượng, sửa, thêm, bỏ dòng (định mức chưa chuẩn). */
export function BangPhieuBuoi({ phieuId, dong, vatTu, sua, them, xoa }: {
  phieuId: string; dong: DongPhieuBuoi[]; vatTu: LuaChon[];
  sua: (fd: FormData) => Promise<KQ>; them: (fd: FormData) => Promise<KQ>; xoa: (fd: FormData) => Promise<KQ>;
}) {
  const coRoi = new Set(dong.map((d) => d.san_pham_id));
  return (
    <div>
      {dong.length === 0 ? <p className="py-3 text-[14px] text-muc-3">Phiếu chưa có vật tư nào. Buổi có dùng vật tư thì bấm &quot;Thêm vật tư&quot;; không dùng gì thì xác nhận phiếu trống.</p> : (
        <ul>{dong.map((d) => <DongSua key={`${d.id}-${d.so_cap}`} phieuId={phieuId} d={d} sua={sua} xoa={xoa} />)}</ul>
      )}
      <div className="mt-3">
        <NutHop kieu="phu" nhan="Thêm vật tư" tieuDe="Thêm vật tư vào phiếu" moTa="Vật tư dùng thật trong buổi mà phiếu chưa có." an={{ id: phieuId }} nhanLuu="Thêm" giaTri={{ so_luong: "1" }}
          truong={[{ ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: vatTu.filter((v) => !coRoi.has(v.gia_tri)) }, { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }]} action={them} />
      </div>
    </div>
  );
}

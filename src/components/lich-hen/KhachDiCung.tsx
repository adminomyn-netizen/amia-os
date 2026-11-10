"use client";

import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHU, O_NHAP } from "@/components/ui/dinh-dang";
import { ChonNhieuDichVu } from "@/components/lich-hen/ChonNhieuDichVu";
import { TOI_DA_KHACH_DI_CUNG, type KhachDiCung } from "@/lib/lich-hen-nhom";

type DV = { id: string; ma: string; ten: string; thoiLuong: number };

/** "Khách đi cùng" trong hộp Đặt lịch (như SalonHero: một lịch nhiều khách). Khách 1 là khách chính ở trên; Khách 2, 3… mỗi người có dịch vụ, người thực hiện, chỗ, thời lượng riêng.
 *  Thanh toán: một hoá đơn cho cả nhóm, gắn khách chính. */
export function KhachDiCungO({ ds, onDoi, dichVu, nhanVien }: { ds: KhachDiCung[]; onDoi: (ds: KhachDiCung[]) => void; dichVu: DV[]; nhanVien: LuaChon[] }) {
  const sua = (i: number, x: Partial<KhachDiCung>) => onDoi(ds.map((k, j) => (j === i ? { ...k, ...x } : k)));
  const doiDv = (i: number, moi: string[]) => sua(i, { dichVuIds: moi, thoiLuong: moi.reduce((s, d) => s + (dichVu.find((x) => x.id === d)?.thoiLuong ?? 0), 0) || null });
  return (
    <fieldset className="rounded-nho border border-vien px-3 pb-3 pt-1">
      <legend className="px-1 text-[13px] font-medium text-muc-2">Khách đi cùng{ds.length ? ` (${ds.length + 1} khách)` : ""}</legend>
      {ds.length === 0 && <p className="text-[12px] text-muc-3">Khách hàng ở trên là Khách 1. Đi nhóm thì thêm khách; cả nhóm thanh toán chung một hoá đơn của Khách 1.</p>}
      <div className="space-y-3">
        {ds.map((k, i) => (
          <div key={i} className="rounded-nho border border-vien-dam p-3" aria-label={`Khách ${i + 2}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <input aria-label={`Tên gọi khách ${i + 2}`} value={k.ten} onChange={(e) => sua(i, { ten: e.target.value.slice(0, 80) })} className={`${O_NHAP} max-w-[220px] font-medium`} />
              <button type="button" className={`${NUT_CHU} text-loi`} onClick={() => onDoi(ds.filter((_, j) => j !== i))}>Bỏ khách</button>
            </div>
            <div className="mb-2">
              <label className={NHAN_O}>Dịch vụ <span className="text-loi">*</span></label>
              <ChonNhieuDichVu ds={dichVu} chon={k.dichVuIds} onDoi={(moi) => doiDv(i, moi)} nhan={`Dịch vụ khách ${i + 2}`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className={NHAN_O}>Người thực hiện</label><Chon id={`dc-nv-${i}`} trong="Chưa phân" ariaLabel={`Người thực hiện khách ${i + 2}`} giaTri={k.nhanVienId ?? ""} onDoi={(x) => sua(i, { nhanVienId: x || null })} luaChon={[{ gia_tri: "", nhan: "Chưa phân" }, ...nhanVien]} /></div>
              <div><label htmlFor={`dc-phong-${i}`} className={NHAN_O}>Phòng / giường</label><input id={`dc-phong-${i}`} value={k.phong ?? ""} onChange={(e) => sua(i, { phong: e.target.value || null })} className={O_NHAP} /></div>
              <div><label htmlFor={`dc-phut-${i}`} className={NHAN_O}>Thời lượng (phút)</label><input id={`dc-phut-${i}`} inputMode="numeric" value={k.thoiLuong ?? ""} onChange={(e) => { const s = e.target.value.replace(/\D/g, "").slice(0, 3); sua(i, { thoiLuong: s ? Number(s) : null }); }} className={`${O_NHAP} text-right`} /></div>
            </div>
          </div>
        ))}
      </div>
      {ds.length < TOI_DA_KHACH_DI_CUNG && (
        <button type="button" className={`${NUT_CHU} mt-2`} onClick={() => onDoi([...ds, { ten: `Khách ${ds.length + 2}`, dichVuIds: [], nhanVienId: null, phong: null, thoiLuong: null }])}>+ Thêm khách</button>
      )}
    </fieldset>
  );
}

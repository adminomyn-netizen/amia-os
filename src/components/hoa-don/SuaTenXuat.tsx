"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import type { KetQuaHD } from "@/components/ui/BieuMau";
import type { DuLieuSuaTen } from "@/app/(app)/tai-chinh/hoa-don-dien-tu/actions";

/** Hộp "Sửa tên khi xuất": tên người mua, MST, địa chỉ và tên từng dòng hàng. Chỉ đổi trên bảng Excel xuất; đơn bán và hồ sơ khách giữ nguyên. */
export function SuaTenXuat({ hoaDonId, ma, daSua, lay, luu }: {
  hoaDonId: string; ma: string; daSua: boolean;
  lay: (id: string) => Promise<{ loi: string } | { ok: DuLieuSuaTen }>; luu: (fd: FormData) => Promise<KetQuaHD | void>;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [du, setDu] = useState<DuLieuSuaTen | null>(null);
  const [loi, setLoi] = useState("");
  const [nm, setNm] = useState({ ten: "", mst: "", diaChi: "" });
  const [dong, setDong] = useState<Record<string, string>>({});

  const moHop = () => {
    setMo(true); setLoi(""); setDu(null);
    bat(async () => {
      const kq = await lay(hoaDonId);
      if ("loi" in kq) { setLoi(kq.loi); return; }
      setDu(kq.ok); setNm(kq.ok.nguoiMua); setDong(Object.fromEntries(kq.ok.dong.map((d) => [d.id, d.tenXuat])));
    });
  };
  const gui = () => {
    if (!du) return;
    setLoi("");
    const fd = new FormData();
    fd.set("hoa_don_id", hoaDonId); fd.set("ten_nguoi_mua", nm.ten); fd.set("ma_so_thue", nm.mst); fd.set("dia_chi", nm.diaChi);
    for (const [id, ten] of Object.entries(dong)) fd.set(`d:${id}`, ten);
    bat(async () => {
      const kq = await luu(fd);
      if (kq && kq.loi) setLoi(kq.loi);
      else { setMo(false); router.refresh(); }
    });
  };
  return (
    <>
      <button type="button" className={NUT_CHU} onClick={moHop}>{daSua ? "Sửa tên (đã sửa)" : "Sửa tên khi xuất"}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Sửa tên khi xuất · ${ma}`} moTa="Chỉ đổi trên bảng Excel xuất. Đơn bán và hồ sơ khách giữ nguyên." rong="rong">
        {!du && !loi && <p className="py-6 text-[14px] text-muc-3">Đang mở…</p>}
        {du && (
          <div className="space-y-5">
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="sx-ten" className={NHAN_O}>Tên người mua</label>
                <input id="sx-ten" className={O_NHAP} value={nm.ten} onChange={(e) => setNm({ ...nm, ten: e.target.value })} autoComplete="off" maxLength={200} />
                {nm.ten !== du.macDinh.ten && <button type="button" className={`${NUT_CHU} mt-1`} onClick={() => setNm({ ...nm, ten: du.macDinh.ten })}>Dùng lại: {du.macDinh.ten}</button>}
              </div>
              <div>
                <label htmlFor="sx-mst" className={NHAN_O}>Mã số thuế</label>
                <input id="sx-mst" className={O_NHAP} value={nm.mst} onChange={(e) => setNm({ ...nm, mst: e.target.value })} autoComplete="off" inputMode="numeric" maxLength={20} />
                {nm.mst !== du.macDinh.mst && <button type="button" className={`${NUT_CHU} mt-1`} onClick={() => setNm({ ...nm, mst: du.macDinh.mst })}>Dùng lại{du.macDinh.mst ? `: ${du.macDinh.mst}` : " (trống)"}</button>}
              </div>
              <div>
                <label htmlFor="sx-dc" className={NHAN_O}>Địa chỉ người mua</label>
                <input id="sx-dc" className={O_NHAP} value={nm.diaChi} onChange={(e) => setNm({ ...nm, diaChi: e.target.value })} autoComplete="off" maxLength={300} />
                {nm.diaChi !== du.macDinh.diaChi && <button type="button" className={`${NUT_CHU} mt-1`} onClick={() => setNm({ ...nm, diaChi: du.macDinh.diaChi })}>Dùng lại{du.macDinh.diaChi ? "" : " (trống)"}</button>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-muc-2">Tên hàng / dịch vụ</p>
              {du.dong.length === 0 && <p className="text-[13px] text-muc-3">Đơn này không có dòng hàng.</p>}
              <ul className="space-y-3">
                {du.dong.map((d, i) => (
                  <li key={d.id}>
                    <label htmlFor={`sx-d-${i}`} className="mb-1 block text-[12.5px] text-muc-3">Dòng {i + 1}</label>
                    <input id={`sx-d-${i}`} className={O_NHAP} value={dong[d.id] ?? ""} onChange={(e) => setDong({ ...dong, [d.id]: e.target.value })} autoComplete="off" maxLength={300} />
                    {(dong[d.id] ?? "") !== d.tenGoc && <p className="mt-1 text-[12.5px] text-muc-3">Tên trong đơn: {d.tenGoc} <button type="button" className={NUT_CHU} onClick={() => setDong({ ...dong, [d.id]: d.tenGoc })}>Dùng lại</button></p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
          <button type="button" className={NUT_CHINH} disabled={dang || !du} onClick={gui}>{dang && du ? "Đang lưu" : "Lưu"}</button>
        </div>
      </Hop>
    </>
  );
}

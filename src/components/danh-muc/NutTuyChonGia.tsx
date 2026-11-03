"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { OTien } from "@/components/ui/OTien";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

type KQ = { ok?: boolean; loi?: string };
export type TuyChonGia = { loai: "nhan_vien" | "bo_sung"; nhan_vien_id?: string | null; ten?: string | null; gia_cong_them: number };
type Dong = { k: number; nv: string; ten: string; gia: number };

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

/** Tab "Tùy chọn giá" của hộp dịch vụ SalonHero, tách thành một hộp riêng mở từ dòng dịch vụ:
 *  • Thêm tùy chọn dịch vụ theo nhân viên: Chọn nhân viên + Giá cộng thêm
 *  • Thêm tùy chọn dịch vụ khác: Tên dịch vụ bổ sung + Giá cộng thêm
 *  Tên/nhân viên trùng bị báo "Tên bị trùng". Lưu = thay cả danh sách của dịch vụ. */
export function NutTuyChonGia({ dichVuId, tenDv, giaGoc, ds, nhanVien, sua, action }: {
  dichVuId: string; tenDv: string; giaGoc: number; ds: TuyChonGia[]; nhanVien: LuaChon[]; sua: boolean; action: (fd: FormData) => Promise<KQ>;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const dau = () => {
    let k = 0;
    return {
      nv: ds.filter((x) => x.loai === "nhan_vien").map((x) => ({ k: ++k, nv: x.nhan_vien_id ?? "", ten: "", gia: Number(x.gia_cong_them) || 0 })),
      bs: ds.filter((x) => x.loai === "bo_sung").map((x) => ({ k: ++k, nv: "", ten: x.ten ?? "", gia: Number(x.gia_cong_them) || 0 })),
      k,
    };
  };
  const [nv, setNv] = useState<Dong[]>([]);
  const [bs, setBs] = useState<Dong[]>([]);
  const [khoa, setKhoa] = useState(0);
  const moHop = () => { const d = dau(); setNv(d.nv); setBs(d.bs); setKhoa(d.k); setLoi(""); setMo(true); };
  const moi = () => { setKhoa(khoa + 1); return khoa + 1; };

  const trungNv = new Set(nv.map((x) => x.nv).filter((x, i, a) => x && a.indexOf(x) !== i));
  const trungTen = new Set(bs.map((x) => x.ten.trim().toLowerCase()).filter((x, i, a) => x && a.indexOf(x) !== i));

  const luu = () => {
    setLoi("");
    if (nv.some((x) => !x.nv)) return setLoi("Tùy chọn theo nhân viên: chưa chọn nhân viên.");
    if (bs.some((x) => !x.ten.trim())) return setLoi("Tùy chọn dịch vụ khác: chưa nhập tên dịch vụ bổ sung.");
    if (trungNv.size || trungTen.size) return setLoi("Tên bị trùng.");
    const fd = new FormData();
    fd.set("dich_vu_id", dichVuId);
    fd.set("ds", JSON.stringify([
      ...nv.map((x) => ({ loai: "nhan_vien", nhan_vien_id: x.nv, gia_cong_them: x.gia })),
      ...bs.map((x) => ({ loai: "bo_sung", ten: x.ten.trim(), gia_cong_them: x.gia })),
    ]));
    bat(async () => {
      const kq = await action(fd);
      if (kq?.loi) setLoi(kq.loi);
      else { setMo(false); router.refresh(); }
    });
  };

  const tenNv = new Map(nhanVien.map((x) => [x.gia_tri, x.nhan]));
  return (
    <>
      <button type="button" className={NUT_CHU} onClick={moHop}>Tuỳ chọn giá{ds.length ? ` (${ds.length})` : ""}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={`Tùy chọn giá: ${tenDv}`} moTa={`Giá bán ${vnd(giaGoc)}. Khi thu ngân chọn tùy chọn, giá dịch vụ = giá bán + giá cộng thêm.`} rong="rong">
        {!sua ? (
          <ul className="space-y-1.5 text-[14px] text-muc-2">
            {ds.length === 0 && <li className="text-muc-3">Chưa có tùy chọn giá.</li>}
            {ds.map((x, i) => <li key={i}>{x.loai === "nhan_vien" ? `Nhân viên ${tenNv.get(x.nhan_vien_id ?? "") ?? "(đã nghỉ)"}` : x.ten}: + {vnd(Number(x.gia_cong_them) || 0)}</li>)}
          </ul>
        ) : (
          <div className="space-y-6">
            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-medium text-muc">Thêm tùy chọn dịch vụ theo nhân viên</h3>
                <button type="button" className={NUT_CHU} onClick={() => setNv([...nv, { k: moi(), nv: "", ten: "", gia: 0 }])}>+ Thêm tùy chọn</button>
              </div>
              {nv.length === 0 && <p className="text-[13px] text-muc-3">Chưa có. Dùng khi giá dịch vụ khác nhau theo người làm (vd bác sĩ trưởng cộng thêm).</p>}
              <div className="space-y-2.5">
                {nv.map((x) => (
                  <div key={x.k} className="grid grid-cols-[1fr_180px_auto] items-end gap-3">
                    <div><label className={NHAN_O}>Chọn nhân viên</label><Chon luaChon={nhanVien} giaTri={x.nv} onDoi={(v) => setNv(nv.map((y) => (y.k === x.k ? { ...y, nv: v } : y)))} trong="Chọn nhân viên" />
                      {x.nv && trungNv.has(x.nv) && <p className="mt-1 text-[12px] text-loi">Tên bị trùng</p>}</div>
                    <div><label className={NHAN_O}>Giá cộng thêm</label><OTien giaTriMacDinh={x.gia} onDoi={(n) => setNv(nv.map((y) => (y.k === x.k ? { ...y, gia: n } : y)))} ariaLabel="Giá cộng thêm" /></div>
                    <button type="button" className={`${NUT_CHU_NGUY} mb-3`} onClick={() => setNv(nv.filter((y) => y.k !== x.k))}>Bỏ</button>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-medium text-muc">Thêm tùy chọn dịch vụ khác</h3>
                <button type="button" className={NUT_CHU} onClick={() => setBs([...bs, { k: moi(), nv: "", ten: "", gia: 0 }])}>+ Thêm tùy chọn</button>
              </div>
              {bs.length === 0 && <p className="text-[13px] text-muc-3">Chưa có. Dùng cho phần làm thêm có giá riêng (vd thêm vùng, thêm tinh chất).</p>}
              <div className="space-y-2.5">
                {bs.map((x) => (
                  <div key={x.k} className="grid grid-cols-[1fr_180px_auto] items-end gap-3">
                    <div><label className={NHAN_O}>Tên dịch vụ bổ sung</label><input value={x.ten} maxLength={120} onChange={(e) => setBs(bs.map((y) => (y.k === x.k ? { ...y, ten: e.target.value } : y)))} className={O_NHAP} placeholder="Tên dịch vụ bổ sung" autoComplete="off" />
                      {x.ten.trim() && trungTen.has(x.ten.trim().toLowerCase()) && <p className="mt-1 text-[12px] text-loi">Tên bị trùng</p>}</div>
                    <div><label className={NHAN_O}>Giá cộng thêm</label><OTien giaTriMacDinh={x.gia} onDoi={(n) => setBs(bs.map((y) => (y.k === x.k ? { ...y, gia: n } : y)))} ariaLabel="Giá cộng thêm" /></div>
                    <button type="button" className={`${NUT_CHU_NGUY} mb-3`} onClick={() => setBs(bs.filter((y) => y.k !== x.k))}>Bỏ</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>{sua ? "Huỷ" : "Đóng"}</button>
          {sua && <button type="button" className={NUT_CHINH} disabled={dang} onClick={luu}>{dang ? "Đang lưu" : "Lưu"}</button>}
        </div>
      </Hop>
    </>
  );
}

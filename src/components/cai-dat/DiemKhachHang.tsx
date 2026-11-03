"use client";

import { ThanhLuu } from "@/components/cai-dat/ThanhLuu";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { O_NHAP } from "@/components/ui/dinh-dang";
import { HANG_KHACH } from "@/lib/diem-hang";
import type { Cap, DiemKhachHang, Hang } from "@/lib/diem-khach-hang";

const soVN = (n: number) => n.toLocaleString("en-US");
function ONhap({ gia, onDoi, dv, ten, khoa }: { gia: number; onDoi: (n: number) => void; dv: string; ten: string; khoa: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <input aria-label={ten} inputMode="numeric" disabled={khoa} value={soVN(gia)} onFocus={(e) => e.currentTarget.select()} onChange={(e) => onDoi(Number(e.target.value.replace(/\D/g, "")) || 0)} className={`${O_NHAP} min-w-0 text-right tabular-nums`} autoComplete="off" />
      <span className="w-9 shrink-0 text-[13px] text-muc-3">{dv}</span>
    </span>
  );
}
const BatTat = ({ ten, v, onDoi, khoa }: { ten: string; v: boolean; onDoi: (v: boolean) => void; khoa: boolean }) => (
  <div className="flex items-center gap-6 text-[14px] text-muc" role="radiogroup" aria-label={ten}>
    {[{ b: true, n: "Bật" }, { b: false, n: "Tắt" }].map((o) => (
      <label key={o.n} className="flex items-center gap-2"><input type="radio" name={ten} disabled={khoa} checked={v === o.b} onChange={() => onDoi(o.b)} className="h-4 w-4 accent-[var(--nhan)]" />{o.n}</label>
    ))}
  </div>
);
const Muc = ({ nhan, children }: { nhan: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] items-center gap-2"><span className="text-[13.5px] text-muc-2">{nhan}</span><div className="min-w-0">{children}</div></div>
);
const Cap2 = ({ c, onDoi, dvTien, dvDiem, ten, khoa, tienTruoc }: { c: Cap; onDoi: (c: Cap) => void; dvTien: string; dvDiem: string; ten: string; khoa: boolean; tienTruoc: boolean }) => (
  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    {tienTruoc
      ? <><ONhap gia={c.tien} onDoi={(n) => onDoi({ ...c, tien: n })} dv={dvTien} ten={`${ten} – số tiền`} khoa={khoa} /><span className="text-muc-3">=</span><ONhap gia={c.diem} onDoi={(n) => onDoi({ ...c, diem: n })} dv={dvDiem} ten={`${ten} – số điểm`} khoa={khoa} /></>
      : <><ONhap gia={c.diem} onDoi={(n) => onDoi({ ...c, diem: n })} dv={dvDiem} ten={`${ten} – số điểm`} khoa={khoa} /><span className="text-muc-3">=</span><ONhap gia={c.tien} onDoi={(n) => onDoi({ ...c, tien: n })} dv={dvTien} ten={`${ten} – số tiền`} khoa={khoa} /></>}
  </div>
);

/** Bố cục như SalonHero "Điểm khách hàng": 3 cột (Quy đổi giá trị đơn hàng thành điểm · Quy đổi điểm thành tiền · Phân loại khách hàng theo điểm tích luỹ), nút "Lưu thông tin" ở đầu trang. */
export function DiemKhachHangForm({ dau, sua, luu }: { dau: DiemKhachHang; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [t, setT] = useState(dau);
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false);
  const [dang, bat] = useTransition();
  const dat = (p: Partial<DiemKhachHang>) => { setT({ ...t, ...p }); setOk(false); };
  const datHang = (k: "tichHang" | "doiHang", h: Hang, c: Cap) => dat({ [k]: { ...t[k], [h]: c } } as Partial<DiemKhachHang>);
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    const cb = (k: string, v: boolean) => fd.set(k, v ? "1" : "0"), cap = (k: string, c: Cap) => { fd.set(`${k}_tien`, String(c.tien)); fd.set(`${k}_diem`, String(c.diem)); };
    cb("tich_bat", t.tichBat); cap("tich_md", t.tichMacDinh); cb("tich_dv", t.tichDv); cb("tich_sp", t.tichSp); cb("tich_the", t.tichThe); cb("doi_thu_ngan", t.doiThuNgan);
    cb("doi_bat", t.doiBat); cap("doi_md", t.doiMacDinh); cb("tu_dong_hang", t.tuDongHang);
    HANG_KHACH.forEach((h, i) => { cap(`tich${i}`, t.tichHang[h]); cap(`doi${i}`, t.doiHang[h]); fd.set(`nguong${i}`, String(t.nguong[h])); });
    bat(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); } });
  };
  const khoa = !sua;
  return (
    <div>
      {loi && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <p role="note" className="mb-5 rounded-nho border border-vien px-4 py-3 text-[13px] leading-relaxed text-muc-2">Mọi mục đều có hiệu lực: chốt hoá đơn lập ở AMIA tự cộng điểm theo số đồng cho 1 điểm của hạng khách và loại tính điểm (huỷ đơn tự trừ lại); Thu ngân đổi điểm theo tỉ lệ của hạng khi bật đổi điểm và cho thu ngân đổi; điểm tích luỹ đạt mức của hạng thì khách tự lên hạng khi bật tự động tính hạng. Đơn chuyển từ SalonHero giữ điểm như SalonHero. Mỗi hạng lưu theo tỉ lệ đồng cho 1 điểm (nhập 20.000.000 = 200 vẫn được, lưu là 100.000đ cho 1 điểm).</p>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-labelledby="dkh-1">
          <h2 id="dkh-1" className="text-[15px] font-semibold text-muc">Quy đổi giá trị đơn hàng thành điểm khách hàng</h2>
          <Muc nhan="Áp dụng:"><BatTat ten="Áp dụng quy đổi thành điểm" v={t.tichBat} onDoi={(v) => dat({ tichBat: v })} khoa={khoa} /></Muc>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[12.5px] text-muc-3"><span>Số tiền đơn hàng quy đổi</span><span /><span>Số điểm nhận được</span></div>
          <Cap2 c={t.tichMacDinh} onDoi={(c) => dat({ tichMacDinh: c })} dvTien="₫" dvDiem="điểm" ten="Quy đổi mặc định" khoa={khoa} tienTruoc />
          <h3 className="pt-1 text-[13.5px] font-medium text-muc-2">Công thức quy đổi theo hạng khách hàng</h3>
          {HANG_KHACH.map((h) => (
            <div key={h} className="space-y-1"><span className="text-[13px] text-muc-2">Hạng {h}</span><Cap2 c={t.tichHang[h]} onDoi={(c) => datHang("tichHang", h, c)} dvTien="₫" dvDiem="điểm" ten={`Tích điểm hạng ${h}`} khoa={khoa} tienTruoc /></div>
          ))}
          <h3 className="pt-1 text-[13.5px] font-medium text-muc-2">Tính điểm khi khách hàng mua:</h3>
          <div className="space-y-2 text-[14px] text-muc">
            {([["tichDv", "Dịch vụ"], ["tichSp", "Sản phẩm"], ["tichThe", "Thẻ dịch vụ"]] as const).map(([k, n]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" disabled={khoa} checked={t[k]} onChange={(e) => dat({ [k]: e.target.checked })} className="h-4 w-4 accent-[var(--nhan)]" />{n}</label>
            ))}
          </div>
          <Muc nhan="Lựa chọn đổi điểm cho thu ngân"><BatTat ten="Lựa chọn đổi điểm cho thu ngân" v={t.doiThuNgan} onDoi={(v) => dat({ doiThuNgan: v })} khoa={khoa} /></Muc>
        </section>
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-labelledby="dkh-2">
          <h2 id="dkh-2" className="text-[15px] font-semibold text-muc">Quy đổi điểm khách hàng thành tiền mua hàng</h2>
          <Muc nhan="Áp dụng:"><BatTat ten="Áp dụng quy đổi điểm thành tiền" v={t.doiBat} onDoi={(v) => dat({ doiBat: v })} khoa={khoa} /></Muc>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[12.5px] text-muc-3"><span>Số điểm quy đổi</span><span /><span>Số tiền được nhận</span></div>
          <Cap2 c={t.doiMacDinh} onDoi={(c) => dat({ doiMacDinh: c })} dvTien="₫" dvDiem="điểm" ten="Đổi điểm mặc định" khoa={khoa} tienTruoc={false} />
          <h3 className="pt-1 text-[13.5px] font-medium text-muc-2">Công thức quy đổi theo hạng khách hàng</h3>
          {HANG_KHACH.map((h) => (
            <div key={h} className="space-y-1"><span className="text-[13px] text-muc-2">Hạng {h}</span><Cap2 c={t.doiHang[h]} onDoi={(c) => datHang("doiHang", h, c)} dvTien="₫" dvDiem="điểm" ten={`Đổi điểm hạng ${h}`} khoa={khoa} tienTruoc={false} /></div>
          ))}
        </section>
        <section className="the-noi the-noi-thap space-y-4 self-start p-4 sm:p-5" aria-labelledby="dkh-3">
          <h2 id="dkh-3" className="text-[15px] font-semibold text-muc">Phân loại khách hàng theo điểm tích lũy</h2>
          <Muc nhan="Tự động tính hạng KH theo mức điểm dưới đây"><BatTat ten="Tự động tính hạng khách hàng" v={t.tuDongHang} onDoi={(v) => dat({ tuDongHang: v })} khoa={khoa} /></Muc>
          {HANG_KHACH.map((h) => (
            <div key={h} className="grid grid-cols-[110px_1fr] items-center gap-2"><span className="text-[13.5px] text-muc-2">Hạng {h}</span><ONhap gia={t.nguong[h]} onDoi={(n) => dat({ nguong: { ...t.nguong, [h]: n } })} dv="điểm" ten={`Mức điểm hạng ${h}`} khoa={khoa || h === "Thường"} /></div>
          ))}
        </section>
      </div>
      {sua && <ThanhLuu dang={dang} ok={ok} onLuu={gui} />}
    </div>
  );
}

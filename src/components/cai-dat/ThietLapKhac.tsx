"use client";

import { ThanhLuu } from "@/components/cai-dat/ThanhLuu";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { CHON_HET, NHAN_O, O_NHAP } from "@/components/ui/dinh-dang";
import { CHE_DO_THUE, PHAN_TRAM_PHU_PHI, type ThietLapKhac } from "@/lib/thiet-lap-khac";

const Hang = ({ nhan, children }: { nhan: string; children: React.ReactNode }) => (
  <div className="grid gap-1.5 sm:grid-cols-[150px_1fr] sm:items-center sm:gap-4"><span className={`${NHAN_O} !mb-0`}>{nhan}</span><div>{children}</div></div>
);
const CHI_DOC = "flex h-11 items-center rounded-nho border border-vien bg-giay-tram px-3 text-[15px] text-muc-3";

/** Bố cục như SalonHero "Các thiết lập khác": trái Thiết lập thời gian + Ngôn ngữ, phải Tiền tệ & thuế; nút "Lưu thông tin" ở đầu trang. */
export function ThietLapKhacForm({ dau, sua, luu }: { dau: ThietLapKhac; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [t, setT] = useState(dau);
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false);
  const [dang, bat] = useTransition();
  const dat = (p: Partial<ThietLapKhac>) => { setT({ ...t, ...p }); setOk(false); };
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("vat_che_do", t.vatCheDo); fd.set("vat_pct", String(t.vatPct)); fd.set("khoa_hd_bat", t.khoaHdBat ? "1" : "0"); fd.set("khoa_hd_gio", String(t.khoaHdGio));
    fd.set("phu_phi_che_do", t.phuPhiCheDo); fd.set("phu_phi_pct", String(t.phuPhiPct)); fd.set("tip_bat", t.tipBat ? "1" : "0");
    bat(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); } });
  };
  return (
    <div>
      {loi && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-labelledby="tl-tg">
          <h2 id="tl-tg" className="text-[16px] font-semibold text-muc">Thiết lập thời gian</h2>
          <Hang nhan="Định dạng ngày"><div className={CHI_DOC}>dd/MM/yyyy</div></Hang>
          <Hang nhan="Định dạng giờ"><div className={CHI_DOC}>24 giờ</div></Hang>
          <Hang nhan="Múi giờ"><div className={CHI_DOC}>Việt Nam (GMT+7)</div></Hang>
          <Hang nhan="Định dạng số"><div className={CHI_DOC}>1.000,01</div></Hang>
          <h2 className="pt-2 text-[16px] font-semibold text-muc">Ngôn ngữ</h2>
          <Hang nhan="Ngôn ngữ"><div className={CHI_DOC}>Tiếng Việt</div></Hang>
          <p className="text-[12.5px] leading-snug text-muc-3">AMIA OS dùng cố định ngày dd/MM/yyyy, giờ 24 giờ, múi giờ Việt Nam, số 1.000,01 và tiếng Việt. SalonHero cũng khoá ba ô đầu; múi giờ và ngôn ngữ ở SalonHero đổi được, AMIA chưa có bản dịch hay múi giờ khác nên giữ cố định.</p>
        </section>
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-labelledby="tl-tt">
          <h2 id="tl-tt" className="text-[16px] font-semibold text-muc">Tiền tệ &amp; thuế</h2>
          <Hang nhan="Đơn vị tiền"><div className={CHI_DOC}>VND - Việt Nam Đồng</div></Hang>
          <Hang nhan="Thuế (VAT)">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <Chon ariaLabel="Thuế VAT" luaChon={CHE_DO_THUE.map((c) => ({ ...c }))} giaTri={t.vatCheDo} onDoi={(v) => dat({ vatCheDo: v as ThietLapKhac["vatCheDo"] })} voHieu={!sua} />
              <div className="flex items-center gap-2"><input aria-label="VAT (%)" inputMode="decimal" {...CHON_HET} disabled={!sua} value={String(t.vatPct)} onChange={(e) => dat({ vatPct: Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 0 })} className={`${O_NHAP} text-right tabular-nums`} /><span className="text-[14px] text-muc-2">%</span></div>
            </div>
            <p className="mt-1.5 text-[12px] text-muc-3">(trên tổng hoá đơn)</p>
          </Hang>
          <Hang nhan="Hoá đơn">
            <div className="flex flex-wrap items-center gap-3">
              {sua ? <Gat nhan="Tự động khoá hoá đơn sau" giaTriMacDinh={t.khoaHdBat} onDoi={(v) => dat({ khoaHdBat: v })} /> : <span className="text-[14px] text-muc-2">Tự động khoá hoá đơn sau{t.khoaHdBat ? "" : ": tắt"}</span>}
              <input aria-label="Số giờ tự khoá hoá đơn" inputMode="numeric" {...CHON_HET} disabled={!sua || !t.khoaHdBat} value={String(t.khoaHdGio)} onChange={(e) => dat({ khoaHdGio: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${O_NHAP} !w-24 text-right tabular-nums`} /><span className="text-[14px] text-muc-2">giờ</span>
            </div>
            <p className="mt-1.5 text-[12px] text-muc-3">Bật thì hoá đơn đã chốt quá số giờ này không Sửa (mở lại) được nữa.</p>
          </Hang>
          <Hang nhan="Phụ phí dịch vụ cho hoá đơn">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <Chon ariaLabel="Phụ phí dịch vụ" luaChon={CHE_DO_THUE.map((c) => ({ ...c }))} giaTri={t.phuPhiCheDo} onDoi={(v) => dat({ phuPhiCheDo: v as ThietLapKhac["phuPhiCheDo"] })} voHieu={!sua} />
              <Chon ariaLabel="Phụ phí (%)" luaChon={PHAN_TRAM_PHU_PHI.map((p) => ({ gia_tri: String(p), nhan: `${String(p).replace(".", ",")}%` }))} giaTri={String(t.phuPhiPct)} onDoi={(v) => dat({ phuPhiPct: Number(v) })} voHieu={!sua} />
            </div>
          </Hang>
          <Hang nhan="Tiền tip">
            <div className="flex gap-6 text-[14px] text-muc">
              {[{ v: true, n: "Bật" }, { v: false, n: "Tắt" }].map((o) => (
                <label key={o.n} className="flex items-center gap-2"><input type="radio" name="tip" disabled={!sua} checked={t.tipBat === o.v} onChange={() => dat({ tipBat: o.v })} className="h-4 w-4 accent-[var(--nhan)]" />{o.n}</label>
              ))}
            </div>
          </Hang>
          <p className="text-[12.5px] leading-snug text-muc-3">Thu ngân áp theo cài đặt này khi lập hoá đơn mới (đang nối vào màn Thu ngân). Như SalonHero: “Áp dụng cho mọi hoá đơn” tự cộng % vào hoá đơn mới; “Tuỳ chọn tại thu ngân” để thu ngân bật khi cần; “Không áp dụng” ẩn ô. Tiền tip Tắt thì Thu ngân không hiện ô tip. Chỉ áp cho hoá đơn lập mới, hoá đơn cũ giữ nguyên số.</p>
        </section>
      </div>
      {sua && <ThanhLuu dang={dang} ok={ok} onLuu={gui} />}
    </div>
  );
}

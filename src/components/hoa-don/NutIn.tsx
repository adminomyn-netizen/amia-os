"use client";
import { useState, useSyncExternalStore } from "react";
import { Printer } from "lucide-react";
import { Hop } from "@/components/ui/Hop";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

const KHOA = "amia.may-in"; // máy in đã kết nối trên MÁY NÀY (mỗi máy quầy nhớ riêng)
type MayIn = { ten: string; luc: string };
const nghe = new Set<() => void>();
const dangKy = (f: () => void) => { nghe.add(f); window.addEventListener("storage", f); return () => { nghe.delete(f); window.removeEventListener("storage", f); }; };
const docTho = () => { try { return localStorage.getItem(KHOA); } catch { return null; } };
const giai = (v: string | null): MayIn | null => { try { return v ? (JSON.parse(v) as MayIn) : null; } catch { return null; } };

/** Nút In. Lần đầu bấm trên một máy (chị Lâm 15/11/2026: "bấm vào in hoá đơn cho chọn kết nối với máy in trước"):
 *  hiện bước Kết nối máy in — trang web không tự liệt kê được máy in, nên mở hộp in của trình duyệt để chọn máy in quầy
 *  (trình duyệt nhớ máy in đã chọn cho các lần sau), ghi tên máy in để hiện trên nút. Đã kết nối thì bấm In là ra hộp in ngay. */
export function NutIn({ kho }: { kho?: string }) {
  const may = giai(useSyncExternalStore(dangKy, docTho, () => null));
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const ketNoi = () => {
    const m = { ten: ten.trim() || "Máy in quầy", luc: new Date().toISOString() };
    try { localStorage.setItem(KHOA, JSON.stringify(m)); } catch { /* trình duyệt chặn lưu: vẫn in */ }
    nghe.forEach((f) => f()); setMo(false);
    setTimeout(() => window.print(), 150);
  };
  return (
    <span className="flex flex-wrap items-center gap-3">
      {may && <button type="button" className={`${NUT_CHU} text-[13px]`} onClick={() => { setTen(may.ten); setMo(true); }}>Máy in: {may.ten} · Đổi</button>}
      <button type="button" className={`${NUT_CHINH} flex items-center gap-2`} onClick={() => (may ? window.print() : (setTen(""), setMo(true)))}><Printer strokeWidth={1.6} className="h-4 w-4" />{may ? "In" : "Kết nối máy in & In"}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Kết nối máy in" moTa="Làm một lần trên mỗi máy tính quầy. Trình duyệt sẽ nhớ máy in cho các lần in sau.">
        <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-muc">
          <li>Bật máy in quầy, cắm cáp USB hoặc nối cùng mạng wifi, và đã cài trên máy tính (Windows: Cài đặt › Máy in; Mac: Cài đặt hệ thống › Máy in).</li>
          <li>Bấm <b>Chọn máy in &amp; in</b> bên dưới. Trong hộp in: mục <b>Máy in / Đích</b> chọn máy in quầy{kho ? <> · <b>Khổ giấy {kho}</b></> : null} · <b>Lề: Mặc định</b> · <b>Tỉ lệ 100%</b> · bỏ tích <b>Đầu trang và chân trang</b>.</li>
          <li>Bấm In. Lần sau trình duyệt tự chọn đúng máy in này.</li>
        </ol>
        <div className="mt-4"><label className={NHAN_O} htmlFor="ten-may-in">Tên máy in (để nhân viên biết đang in ra máy nào)</label>
          <input id="ten-may-in" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Vd: Máy in quầy lễ tân" maxLength={60} className={O_NHAP} /></div>
        <p className="mt-3 text-[12.5px] text-muc-3">Muốn bấm In là ra giấy luôn, không hiện hộp in: trên máy quầy đặt máy in này làm máy in mặc định và mở Chrome với tuỳ chọn <code>--kiosk-printing</code> (nhờ IT cài một lần).</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Để sau</button>
          <button type="button" className={NUT_CHINH} onClick={ketNoi}>Chọn máy in &amp; in</button>
        </div>
      </Hop>
    </span>
  );
}

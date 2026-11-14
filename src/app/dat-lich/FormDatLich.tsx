"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarCheck, CalendarDays, Check, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Minus, Navigation, Phone, Plus, Search, ShieldCheck, Sparkles, User, Users,
} from "lucide-react";
import { O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { coOChiNhanh } from "@/lib/ban-hang";
import { datLichOnline, layKhungGio, type KhungGio } from "./actions";
import { CHU, type NgonNgu } from "./chu";

export type CnDat = {
  id: string; ten: string; diaChi: string; khuVuc: string; dienThoai: string; gioHomNay: string | null; /** có chỗ làm → nhận đặt online */ datDuoc: boolean;
  /** Giờ mở cửa 7 ngày, chỉ số theo getDay() (0 = Chủ nhật); null = nghỉ. */ gioTuan?: (string | null)[];
};
export type DvDat = { id: string; ten: string; phut: number; nhom: string; /** "Địa điểm cung cấp": null = mọi chi nhánh. */ cn?: string[] | null; /** Chỉ có khi cài đặt bật "Hiện giá". */ gia?: number };
export type NvDat = { id: string; ten: string; chucDanh: string; cn: string | null };
type Props = {
  nn: NgonNgu; mo: boolean; sdt: string; tenCuaHang: string; anhBia: string | null; chiNhanh: CnDat[]; dichVu: DvDat[]; nhanVien: NvDat[];
  homNay: string; soNgay: number; khungPhut: number; hienBuoi: boolean; doiTuong: string; phutMacDinh: number;
  giayPhep?: string; hoiDap?: [string, string][];
  /** Link giới thiệu (?ref=SĐT): REF gửi kèm khi đặt + tên hiển thị của người giới thiệu (đã tra ở máy chủ). */
  gioiThieu?: { ref: string; ten: string } | null;
};

const congNgay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const thuSo = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();
const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const buoiCua = (g: string) => (g < "12:00" ? 0 : g < "18:00" ? 1 : 2);
const banDo = (diaChi: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(diaChi)}`;
const tien = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
// Lịch tháng chỉ vẽ ở trình duyệt (múi giờ máy khách), lúc tải hiện khung xám cùng cỡ.
const LichTongQuan = dynamic(() => import("./LichTongQuan").then((m) => m.LichTongQuan), { ssr: false, loading: () => <div className="h-[360px] animate-pulse rounded-the bg-giay-tram" /> });
const THE = "the-noi the-noi-thap p-5 sm:p-6";
const VANG = { background: "linear-gradient(135deg, #d9b877 0%, #ba9551 60%, #9c7a3a 100%)" } as const;

function Buoc({ so, chu, xong, phu }: { so: number; chu: string; xong: boolean; phu?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-[17px] font-semibold text-muc">
        <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-nho text-[14px] font-bold tabular-nums transition-colors ${xong ? "bg-nhan text-white" : "bg-nhan-nhat text-nhan-dam"}`}>
          {so}
          {xong && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-[4px] text-espresso ring-2 ring-giay-sang" style={VANG}><Check strokeWidth={3.5} className="h-2.5 w-2.5" aria-hidden /></span>}
        </span>
        {chu}{xong && <span className="sr-only"> (đã xong)</span>}
      </h2>
      {phu}
    </div>
  );
}

/** Trang đặt lịch y SalonHero: tab Đặt lịch / Chi nhánh / Dịch vụ; 1 thông tin khách → 2 địa điểm (→ dịch vụ, người làm khi cài đặt bật) → 3 ngày + khung giờ còn/hết chỗ → 4 ghi chú; khung "Lịch hẹn của quý khách"; đặt xong là có lịch hẹn.
 *  Giao diện: đầu trang nền tối thương hiệu (khẩu hiệu, giờ mở cửa, giấy phép), thẻ các bước có dấu xong, khung tóm tắt tối có thanh tiến độ, cuối trang quy trình + thông tin phòng khám + hỏi đáp (SEO/AEO). */
export function FormDatLich(p: Props) {
  const T = CHU[p.nn];
  const [kq, action, dang] = useActionState(datLichOnline, undefined);
  const [tab, setTab] = useState<"dat" | "cn" | "dv">("dat");
  const datDuoc = p.chiNhanh.filter((c) => c.datDuoc);
  const [cn, setCn] = useState(datDuoc[0]?.id ?? "");
  const [khu, setKhu] = useState("");
  const [dv, setDv] = useState<string[]>([]);
  const [timDv, setTimDv] = useState("");
  const [nhomLoc, setNhomLoc] = useState("");
  const [nv, setNv] = useState("");
  const [ngay, setNgay] = useState(p.homNay);
  const [gio, setGio] = useState("");
  const [buoi, setBuoi] = useState<number | null>(null);
  const [khach, setKhach] = useState(1);
  const [gt, setGt] = useState(p.doiTuong === "nam" ? "nam" : "nữ");
  const [ten, setTen] = useState(""), [sdt, setSdt] = useState("");
  const [khung, setKhung] = useState<KhungGio[] | null>(null);
  const [loiGio, setLoiGio] = useState(""), [taiLai, setTaiLai] = useState(0);
  const [loi, setLoi] = useState("");
  const [, bat] = useTransition();
  const [moLuc] = useState(() => Date.now());
  const thanhNgay = useRef<HTMLDivElement>(null);
  const gioRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const chiNhanhChon = p.chiNhanh.find((c) => c.id === cn) ?? datDuoc[0] ?? p.chiNhanh[0];
  const dsDv = p.dichVu.filter((d) => coOChiNhanh(d.cn, cn));
  const dvChon = p.dichVu.filter((d) => dv.includes(d.id));
  const dsNv = p.nhanVien.filter((n) => !n.cn || n.cn === cn);
  const nvChon = p.nhanVien.find((n) => n.id === nv);
  const tongPhut = dvChon.length ? dvChon.reduce((a, d) => a + d.phut, 0) : p.phutMacDinh;
  const tongGia = dvChon.reduce((a, d) => a + (d.gia ?? 0), 0);
  const khuVuc = [...new Set(datDuoc.map((c) => c.khuVuc || T.khuVucKhac))];
  const ngays = useMemo(() => Array.from({ length: p.soNgay + 1 }, (_, i) => congNgay(p.homNay, i)), [p.homNay, p.soNgay]);
  const chiaBuoi = p.hienBuoi && p.khungPhut < 30;
  const nhomDv = useMemo(() => [...new Set(dsDv.map((d) => d.nhom))], [dsDv]);
  const tuTim = boDau(timDv.trim());
  const dvHien = dsDv.filter((d) => (!nhomLoc || d.nhom === nhomLoc) && (!tuTim || boDau(d.ten).includes(tuTim)));

  // Tiến độ: thông tin khách, địa điểm, (dịch vụ), giờ hẹn.
  const xong1 = ten.trim().length >= 2 && sdt.replace(/\D/g, "").length >= 9;
  const cacBuoc = [xong1, !!cn, ...(dsDv.length ? [dv.length > 0] : []), !!gio];
  const soXong = cacBuoc.filter(Boolean).length;
  const soBuocDv = dsDv.length > 0 ? 1 : 0, soBuocNv = dsNv.length > 0 ? 1 : 0;

  useEffect(() => {
    // Đổi chi nhánh / dịch vụ / người làm / ngày / số khách thì hỏi lại lưới khung giờ.
    if (!cn || !p.mo) return;
    let huy = false;
    bat(async () => {
      setKhung(null); setLoiGio("");
      try {
        const r = await layKhungGio(cn, ngay, dv, khach, nv);
        if (huy) return;
        setKhung(r.gio); setLoiGio(r.loi ?? "");
        setGio((g) => (r.gio.some((k) => k.gio === g && k.con) ? g : ""));
        const dau = r.gio.find((k) => k.con);
        setBuoi((b) => (b !== null && r.gio.some((k) => k.con && buoiCua(k.gio) === b) ? b : dau ? buoiCua(dau.gio) : 0));
      } catch { if (!huy) { setKhung([]); setLoiGio(T.taiLoi); } }
    });
    return () => { huy = true; };
  }, [cn, ngay, dv, khach, nv, taiLai, p.mo, T.taiLoi]);

  const doiCn = (id: string) => { setCn(id); setGio(""); setNv(""); setDv((ds) => ds.filter((x) => coOChiNhanh(p.dichVu.find((d) => d.id === x)?.cn, id))); };
  const cuon = (huong: number) => thanhNgay.current?.scrollBy({ left: huong * 240, behavior: "smooth" });
  const kiemTruocKhiGui = (e: React.FormEvent) => {
    setLoi("");
    if (!xong1) { e.preventDefault(); setLoi(T.thieuTT); document.getElementById("form-dat-lich")?.scrollIntoView({ behavior: "smooth" }); return; }
    if (!gio) { e.preventDefault(); setLoi(T.chonGio); gioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  };
  const coNhap = !!(ten || sdt || dv.length || gio || nv || khach > 1);
  const lamLai = () => {
    if (coNhap && !window.confirm(T.hoiLamLai)) return;
    formRef.current?.reset();
    setTen(""); setSdt(""); setDv([]); setNv(""); setGio(""); setKhach(1); setTimDv(""); setNhomLoc(""); setLoi(""); setKhu("");
    setGt(p.doiTuong === "nam" ? "nam" : "nữ"); setNgay(p.homNay); setCn(datDuoc[0]?.id ?? "");
    document.getElementById("form-dat-lich")?.scrollIntoView({ behavior: "smooth" });
  };
  const nutLamLai = (lop: string) => (
    <button type="button" onClick={lamLai} disabled={!coNhap} className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-opacity disabled:opacity-40 ${lop}`}><RotateCcw className="h-3.5 w-3.5" aria-hidden />{T.lamLai}</button>
  );
  const chonDv = (id: string) => { setDv(dv.includes(id) ? dv.filter((x) => x !== id) : [...dv, id]); setGio(""); };

  /* ---------- Đầu trang ---------- */
  const nutNgonNgu = (
    <div className="flex items-center gap-2">
      {p.sdt && <a href={`tel:${p.sdt.replace(/\s/g, "")}`} className="hidden h-9 items-center gap-2 rounded-nho border border-white/20 bg-espresso/40 px-3 text-[13px] font-medium text-white hover:bg-white/10 sm:flex"><Phone className="h-4 w-4" aria-hidden />{p.sdt}</a>}
      <div className="flex overflow-hidden rounded-nho border border-white/25 bg-espresso/40 text-[12px] font-semibold" role="group" aria-label="Ngôn ngữ / Language">
        {(["vi", "en"] as const).map((x) => <Link key={x} href={`?lang=${x}${p.gioiThieu ? `&ref=${encodeURIComponent(p.gioiThieu.ref)}` : ""}`} hrefLang={x} aria-current={p.nn === x ? "true" : undefined} className={`px-2.5 py-1.5 ${p.nn === x ? "bg-white text-espresso" : "text-white/85 hover:bg-white/10"}`}>{x.toUpperCase()}</Link>)}
      </div>
    </div>
  );
  const dau = (
    <>
    <header className="nen-toi relative overflow-hidden text-white">
      {p.anhBia && (
        <div className="relative">
          {/* Quầng màu của chính ảnh phủ kín bề ngang, để mép ảnh tan vào nền tối thay vì cắt cứng */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.anhBia} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-45" style={{ filter: "blur(28px) saturate(1.2)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.anhBia} alt={`${p.tenCuaHang} – ${T.khauHieu}`} fetchPriority="high"
            className="relative mx-auto block aspect-[2048/777] max-h-[540px] w-full max-w-[1600px] object-cover"
            style={{ maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%), linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)", maskComposite: "intersect", WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%), linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)", WebkitMaskComposite: "source-in" }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(to bottom, transparent, rgb(10 43 38 / 0.85))" }} />
          <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">{nutNgonNgu}</div>
        </div>
      )}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] opacity-60" style={{ background: "radial-gradient(closest-side, rgb(217 184 119 / 0.35), transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 h-[380px] w-[380px] opacity-50" style={{ background: "radial-gradient(closest-side, rgb(20 163 148 / 0.35), transparent)" }} />
      <div className={`relative mx-auto w-full max-w-[1120px] px-4 pb-10 sm:px-6 sm:pb-14 ${p.anhBia ? "pt-3 sm:-mt-16 sm:pt-0" : "pt-5"}`}>
        {!p.anhBia && (
          <div className="flex items-center justify-between gap-3">
            <Link href="/dat-lich" aria-label={p.tenCuaHang}><Image src="/logo-amia-trang.png" alt={p.tenCuaHang} width={600} height={272} priority className="h-auto w-[104px] sm:w-[124px]" /></Link>
            {nutNgonNgu}
          </div>
        )}
        <div className={`${p.anhBia ? "" : "mt-8 "}grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_340px]`}>
          <div className="vao">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-menu-nhan"><Sparkles className="h-4 w-4" aria-hidden />{T.khauHieu}</p>
            <h1 className="mt-3 text-[30px] font-bold leading-[1.15] text-white sm:text-[42px]">{T.tieuDe}<span className="block text-menu-nhan">{p.tenCuaHang}</span></h1>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-menu-chu sm:text-[16px]">{T.moTa}</p>
            <ul className="mt-5 flex flex-wrap gap-2 text-[13px]">
              {chiNhanhChon && <li className="flex items-center gap-1.5 rounded-nho border border-white/15 bg-white/5 px-3 py-1.5"><Clock className="h-4 w-4 text-menu-nhan" aria-hidden />{chiNhanhChon.gioHomNay ? `${T.gioMoCua}: ${chiNhanhChon.gioHomNay}` : T.nghiHomNay}</li>}
              {chiNhanhChon?.diaChi && <li className="flex items-center gap-1.5 rounded-nho border border-white/15 bg-white/5 px-3 py-1.5"><MapPin className="h-4 w-4 text-menu-nhan" aria-hidden />{chiNhanhChon.diaChi}</li>}
              {p.giayPhep && <li className="flex items-center gap-1.5 rounded-nho border border-white/15 bg-white/5 px-3 py-1.5"><ShieldCheck className="h-4 w-4 text-menu-nhan" aria-hidden />{T.giayPhep}: {p.giayPhep}</li>}
            </ul>
          </div>
          {p.mo && (
            <dl className="vao grid grid-cols-3 gap-px overflow-hidden rounded-hop border border-white/15 bg-white/10 text-center" style={{ animationDelay: "120ms" }}>
              {([[String(p.dichVu.length || "—"), T.dvOnline], [String(p.soNgay), T.ngayToiDa], [String(p.khungPhut), T.phutKhung]] as const).map(([so, nhan]) => (
                <div key={nhan} className="bg-espresso/60 px-2 py-4">
                  <dt className="sr-only">{nhan}</dt>
                  <dd><span className="block text-[26px] font-bold tabular-nums text-white">{so}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-menu-chu-phu">{nhan}</span></dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      <div aria-hidden className="h-[3px] w-full" style={VANG} />
    </header>
    </>
  );

  const thanhTab = p.mo && !(kq?.ok && kq.daDat) && (
    <nav className="sticky top-0 z-30 border-b border-vien bg-giay-sang/95" aria-label={p.nn === "en" ? "Sections" : "Mục"}>
      <div className="mx-auto flex w-full max-w-[1120px] gap-1 overflow-x-auto px-4 sm:px-6">
        {([["dat", T.datLich, CalendarCheck], ["cn", `${T.chiNhanh} (${p.chiNhanh.length})`, MapPin], ["dv", `${T.dichVu} (${p.dichVu.length})`, Sparkles]] as const).map(([k, nhan, Icon]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-3.5 text-[14px] font-semibold transition-colors ${tab === k ? "border-nhan text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>
            <Icon className="h-4 w-4" aria-hidden />{nhan}
          </button>
        ))}
      </div>
    </nav>
  );

  /* ---------- Cuối trang: quy trình, thông tin phòng khám, hỏi đáp ---------- */
  const cuoi = (
    <div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 pb-28 pt-4 sm:px-6 lg:pb-12">
      <section aria-labelledby="quy-trinh" className="grid gap-3 sm:grid-cols-3">
        <h2 id="quy-trinh" className="sr-only">{T.quyTrinh}</h2>
        {T.qt.map(([td, mt], i) => (
          <div key={td} className="the-noi the-noi-thap flex gap-3 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-nho text-[16px] font-bold text-espresso" style={VANG}>{i + 1}</span>
            <div><h3 className="text-[15px] font-semibold text-muc">{td}</h3><p className="mt-1 text-[13.5px] leading-relaxed text-muc-2">{mt}</p></div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {!!p.hoiDap?.length && (
          <section aria-labelledby="hoi-dap" className={THE}>
            <h2 id="hoi-dap" className="mb-2 text-[19px] font-bold text-muc">{T.hoiDap}</h2>
            <div className="divide-y divide-vien">
              {p.hoiDap.map(([q, a], i) => (
                <details key={q} open={i === 0} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-muc [&::-webkit-details-marker]:hidden">
                    <h3>{q}</h3><ChevronDown className="h-4 w-4 shrink-0 text-muc-3 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-2 text-[14px] leading-relaxed text-muc-2">{a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="thong-tin" className={THE}>
          <h2 id="thong-tin" className="text-[19px] font-bold text-muc">{T.thongTin}</h2>
          {p.chiNhanh.map((c) => (
            <address key={c.id} className="mt-3 space-y-2.5 not-italic">
              <p className="text-[15px] font-semibold text-muc">{/^amia/i.test(c.ten) ? c.ten : `AMIA – ${c.ten}`}</p>
              {c.diaChi && <p className="flex gap-2 text-[14px] text-muc-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nhan" aria-hidden />{c.diaChi}</p>}
              {(c.dienThoai || p.sdt) && <p className="flex gap-2 text-[14px] text-muc-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-nhan" aria-hidden />{T.hotline}: <a className="font-semibold text-nhan-dam" href={`tel:${(c.dienThoai || p.sdt).replace(/\s/g, "")}`}>{c.dienThoai || p.sdt}</a></p>}
              {p.giayPhep && <p className="flex gap-2 text-[14px] text-muc-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nhan" aria-hidden />{T.giayPhep}: {p.giayPhep}</p>}
              {c.gioTuan && (
                <div className="pt-1">
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muc-3">{T.gioTuan}</p>
                  <ul className="grid grid-cols-1 gap-y-1 text-[13.5px]">
                    {[1, 2, 3, 4, 5, 6, 0].map((i) => (
                      <li key={i} className={`flex justify-between rounded-nho px-2 py-1 ${i === thuSo(p.homNay) ? "bg-nhan-nhat font-semibold text-nhan-dam" : "text-muc-2"}`}>
                        <span>{T.thuDu[i]}</span><span className="tabular-nums">{c.gioTuan?.[i] ?? T.nghi}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.diaChi && <a href={banDo(c.diaChi)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-10 items-center gap-2 rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc hover:bg-giay-tram"><Navigation className="h-4 w-4" aria-hidden />{T.xemBanDo}</a>}
            </address>
          ))}
        </section>
      </div>

      <footer className="border-t border-vien pt-5 text-center text-[12.5px] leading-relaxed text-muc-3">
        <p className="font-semibold text-muc-2">{T.khauHieu}</p>
        <p>{p.tenCuaHang}{chiNhanhChon?.diaChi ? ` · ${chiNhanhChon.diaChi}` : ""}{p.giayPhep ? ` · GP ${p.giayPhep}` : ""}</p>
      </footer>
    </div>
  );

  if (kq?.ok && kq.daDat) {
    const d = kq.daDat;
    return (
      <>{dau}
        <main className="mx-auto w-full max-w-[640px] px-4 py-8">
          <section role="status" className={`${THE} vao text-[15px]`}>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-hop bg-nhan text-white"><Check strokeWidth={2.6} className="h-7 w-7" aria-hidden /></span>
              <p className="mt-3 text-[22px] font-bold text-nhan-dam">{T.thanhCong}</p>
              <p className="mt-1 max-w-[440px] text-muc-2">{T.camOn}</p>
            </div>
            <dl className="mt-5 divide-y divide-vien rounded-the border border-vien bg-giay px-4">
              {([[T.thoiGian, `${d.gio} ${T.thu[thuSo(d.ngay)]}, ${ddmm(d.ngay)}/${d.ngay.slice(0, 4)}`], [T.dichVu, d.dichVu.join(", ")], [T.nguoiLam, d.nguoiLam], [T.diaChi, d.diaChi], [T.nguoiDat, d.ten], [T.sdtDat, d.sdt]] as const)
                .filter(([, v]) => v).map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2.5"><dt className="text-muc-3">{k}</dt><dd className="font-medium text-muc">{v}</dd></div>)}
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {d.diaChi && <a href={banDo(d.diaChi)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-nho border border-vien-dam text-[15px] font-medium text-muc hover:bg-giay-tram"><Navigation className="h-4 w-4" aria-hidden />{T.chiDuong}</a>}
              <button type="button" className="nut-vang h-11 rounded-nho text-[15px]" onClick={() => window.location.reload()}>{T.datKhac}</button>
            </div>
          </section>
        </main>
        {cuoi}
      </>
    );
  }

  if (!p.mo) {
    return (
      <>{dau}
        <main className="mx-auto w-full max-w-[640px] px-4 py-8">
          <div className={`${THE} text-center text-[15px] text-muc-2`}>
            <CalendarDays className="mx-auto h-8 w-8 text-nhan" aria-hidden />
            <p className="mt-2 text-[17px] font-semibold text-muc">{T.khoa}</p>
            <p className="mt-1">{p.sdt ? T.goi(p.sdt) : T.lienHe}</p>
            {p.sdt && <a href={`tel:${p.sdt.replace(/\s/g, "")}`} className="nut-vang mt-4 inline-flex h-11 items-center gap-2 rounded-nho px-5 text-[15px]"><Phone className="h-4 w-4" aria-hidden />{T.goiNgay}</a>}
          </div>
        </main>
        {cuoi}
      </>
    );
  }

  return (
    <>{dau}{thanhTab}
      {tab === "cn" && (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {p.chiNhanh.map((c) => (
              <div key={c.id} className={THE}>
                <p className="text-[18px] font-bold text-muc">{c.ten}</p>
                {c.diaChi && <p className="mt-2 flex gap-2 text-[14px] text-muc-2"><MapPin size={16} className="mt-0.5 shrink-0 text-nhan" aria-hidden="true" />{c.diaChi}</p>}
                <p className="mt-1.5 flex gap-2 text-[14px] text-muc-2"><Clock size={16} className="mt-0.5 shrink-0 text-nhan" aria-hidden="true" />{c.gioHomNay ? `${T.gioMoCua}: ${c.gioHomNay}` : T.nghiHomNay}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.datDuoc ? <button type="button" className="nut-vang h-10 rounded-nho px-4 text-[14px]" onClick={() => { doiCn(c.id); setTab("dat"); }}>{T.datTaiDay}</button> : <span className="self-center text-[13px] text-muc-3">{T.chuaNhanOnline}</span>}
                  {c.diaChi && <a href={banDo(c.diaChi)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc hover:bg-giay-tram"><Navigation className="h-4 w-4" aria-hidden />{T.chiDuong}</a>}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
      {tab === "dv" && (
        <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6">
          {p.dichVu.length === 0 ? <p className={`${THE} text-center text-[15px] text-muc-2`}>{T.lienHeDv}</p> : (
            <div className="grid gap-4 md:grid-cols-2">
              {[...new Set(p.dichVu.map((d) => d.nhom))].map((n) => (
                <section key={n} className={THE}>
                  <h2 className="mb-2 flex items-center justify-between text-[16px] font-bold text-muc">{n}<span className="text-[12px] font-medium text-muc-3">{p.dichVu.filter((d) => d.nhom === n).length}</span></h2>
                  <ul className="divide-y divide-vien">
                    {p.dichVu.filter((d) => d.nhom === n).map((d) => (
                      <li key={d.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                        <span className="min-w-0 flex-1 text-muc">{d.ten}</span>
                        {d.gia != null && <span className="font-semibold tabular-nums text-nhan-dam">{tien(d.gia)}</span>}
                        <span className="w-[58px] shrink-0 text-right text-[12.5px] text-muc-3">{d.phut} {T.phut}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      )}
      <form ref={formRef} action={action} onSubmit={kiemTruocKhiGui} hidden={tab !== "dat"} id="form-dat-lich" className="mx-auto grid w-full max-w-[1120px] scroll-mt-16 gap-5 px-4 pb-8 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_350px]">
        <input type="hidden" name="mo_luc" value={moLuc} />
        <input type="hidden" name="chi_nhanh_id" value={cn} />
        <input type="hidden" name="dich_vu_ids" value={dv.join(",")} />
        <input type="hidden" name="nhan_vien_id" value={nv} />
        <input type="hidden" name="ngay" value={ngay} />
        <input type="hidden" name="gio" value={gio} />
        <input type="hidden" name="so_khach" value={khach} />
        <input type="hidden" name="gioi_tinh" value={gt} />
        {p.gioiThieu && <input type="hidden" name="ref" value={p.gioiThieu.ref} />}
        {/* Ô bẫy cho bot: người thật không thấy, không tới được bằng bàn phím */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        <div className="min-w-0 space-y-5">
          {(loi || kq?.loi) && <p role="alert" className="rounded-the border border-loi/30 bg-loi-nen px-4 py-3 text-[14px] text-loi"><b>{kq?.loi && !loi ? `${T.loiDat}: ` : ""}</b>{loi || kq?.loi}</p>}

          <section className={THE}>
            <Buoc so={1} chu={T.b1} xong={xong1} phu={<span className="lg:hidden">{nutLamLai("text-muc-3 hover:text-loi")}</span>} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="dien_thoai" className="mb-1.5 block text-[13px] font-medium text-muc-2">{T.sdt} <span className="text-loi">*</span></label><input id="dien_thoai" name="dien_thoai" type="tel" inputMode="tel" required autoComplete="tel" maxLength={20} placeholder="091 234 56 78" value={sdt} onChange={(e) => setSdt(e.target.value)} className={O_NHAP} /></div>
              <div>
                <label htmlFor="ho_ten" className="mb-1.5 block text-[13px] font-medium text-muc-2">{T.hoTen} <span className="text-loi">*</span></label>
                <div className="flex gap-2">
                  <input id="ho_ten" name="ho_ten" required minLength={2} maxLength={100} autoComplete="name" value={ten} onChange={(e) => setTen(e.target.value)} className={`${O_NHAP} min-w-0 flex-1`} />
                  {p.doiTuong === "ca" && (
                    <div className="flex shrink-0 overflow-hidden rounded-nho border border-vien-dam" role="group" aria-label="Xưng hô">
                      {([["nữ", T.chi], ["nam", T.anh]] as const).map(([v, nhan]) => <button key={v} type="button" aria-pressed={gt === v} onClick={() => setGt(v)} className={`h-11 px-3.5 text-[14px] font-medium transition-colors ${gt === v ? "bg-nhan text-white" : "bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{nhan}</button>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-the bg-giay-tram/70 px-4 py-3">
              <span className="flex items-center gap-2 text-[14px] font-medium text-muc"><Users className="h-4 w-4 text-nhan" aria-hidden />{T.diNhom}</span>
              <div className="flex items-center gap-1" role="group" aria-label="Số khách">
                <button type="button" aria-label="Bớt một khách" disabled={khach <= 1} onClick={() => setKhach(khach - 1)} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam bg-giay-sang text-muc disabled:opacity-40"><Minus size={16} /></button>
                <span className="w-9 text-center text-[16px] font-bold tabular-nums" aria-live="polite">{khach}</span>
                <button type="button" aria-label="Thêm một khách" disabled={khach >= 20} onClick={() => setKhach(khach + 1)} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam bg-giay-sang text-muc disabled:opacity-40"><Plus size={16} /></button>
              </div>
            </div>
          </section>

          <section className={THE}>
            <Buoc so={2} chu={T.b2} xong={!!cn} />
            {khuVuc.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {[["", `${T.tatCaKhuVuc} ${datDuoc.length}`], ...khuVuc.map((k) => [k, `${k} ${datDuoc.filter((c) => (c.khuVuc || T.khuVucKhac) === k).length}`])].map(([k, nhan]) => (
                  <button key={k} type="button" aria-pressed={khu === k} onClick={() => setKhu(k)} className={`h-9 rounded-nho border px-3 text-[13px] font-medium ${khu === k ? "border-nhan bg-nhan text-white" : "border-vien-dam text-muc-2"}`}>{nhan}</button>
                ))}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={T.b2}>
              {datDuoc.filter((c) => !khu || (c.khuVuc || T.khuVucKhac) === khu).map((c) => {
                const chon = cn === c.id;
                return (
                  <button key={c.id} type="button" role="radio" aria-checked={chon} onClick={() => doiCn(c.id)}
                    className={`relative flex gap-3 rounded-the border-2 p-4 text-left transition-colors ${chon ? "border-nhan bg-nhan-nhat" : "border-vien bg-giay-sang hover:border-nhan/50"}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-nho ${chon ? "bg-nhan text-white" : "bg-giay-tram text-nhan-dam"}`}><MapPin className="h-5 w-5" aria-hidden /></span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold text-muc">{c.ten}</span>
                      {c.diaChi && <span className="mt-0.5 block text-[13px] text-muc-2">{c.diaChi}</span>}
                      <span className="mt-1 block text-[12.5px] text-muc-3">{c.gioHomNay ? `${T.gioMoCua}: ${c.gioHomNay}` : T.nghiHomNay}</span>
                    </span>
                    {chon && <Check strokeWidth={2.6} className="absolute right-3 top-3 h-5 w-5 text-nhan" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>

          {dsDv.length > 0 && (
            <section className={THE}>
              <Buoc so={3} chu={T.bDv} xong={dv.length > 0} phu={<span className={`rounded-nho px-2.5 py-1 text-[12.5px] font-semibold ${dv.length ? "bg-nhan-nhat text-nhan-dam" : "bg-giay-tram text-muc-3"}`}>{T.daChon} {dv.length}/5</span>} />
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" aria-hidden />
                <input type="search" aria-label={T.timDv} placeholder={`${T.timDv} (${T.toiDaDv})`} value={timDv} onChange={(e) => setTimDv(e.target.value)} className={`${O_NHAP} pl-9`} />
              </div>
              {nhomDv.length > 1 && (
                <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={T.dichVu}>
                  {[["", T.tatCa], ...nhomDv.map((n) => [n, n])].map(([k, nhan]) => (
                    <button key={k || "tat-ca"} type="button" role="tab" aria-selected={nhomLoc === k} onClick={() => setNhomLoc(k)}
                      className={`h-8 shrink-0 rounded-nho border px-3 text-[12.5px] font-semibold transition-colors ${nhomLoc === k ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>
                      {nhan} <span className={nhomLoc === k ? "text-white/75" : "text-muc-3"}>{k ? dsDv.filter((d) => d.nhom === k).length : dsDv.length}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2 lg:max-h-[460px] lg:overflow-y-auto lg:pr-1">
                {dvHien.map((d) => {
                  const chon = dv.includes(d.id), khoa = !chon && dv.length >= 5;
                  return (
                    <button key={d.id} type="button" role="checkbox" aria-checked={chon} disabled={khoa} onClick={() => chonDv(d.id)}
                      className={`flex min-h-[64px] items-start gap-3 rounded-the border p-3 text-left transition-colors disabled:opacity-45 ${chon ? "border-nhan bg-nhan-nhat" : "border-vien bg-giay-sang hover:border-nhan/50"}`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 ${chon ? "border-nhan bg-nhan text-white" : "border-vien-dam"}`}>{chon && <Check strokeWidth={3} className="h-3 w-3" aria-hidden />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium leading-snug text-muc">{d.ten}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-muc-3"><span className="uppercase tracking-wide">{d.nhom}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{d.phut} {T.phut}</span></span>
                      </span>
                      {d.gia != null && <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-nhan-dam">{tien(d.gia)}</span>}
                    </button>
                  );
                })}
                {dvHien.length === 0 && <p className="py-4 text-center text-[13.5px] text-muc-3 sm:col-span-2">{T.khongThayDv}</p>}
              </div>
            </section>
          )}

          {dsNv.length > 0 && (
            <section className={THE}>
              <Buoc so={3 + soBuocDv} chu={T.bNv} xong={!!nv} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={T.bNv}>
                {[{ id: "", ten: T.batKy, chucDanh: T.batKyMoTa }, ...dsNv].map((n) => (
                  <button key={n.id || "bat-ky"} type="button" role="radio" aria-checked={nv === n.id} onClick={() => { setNv(n.id); setGio(""); }}
                    className={`flex items-center gap-2.5 rounded-the border p-3 text-left transition-colors ${nv === n.id ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien bg-giay-sang text-muc hover:border-nhan/50"}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-nho text-[13px] font-bold ${nv === n.id ? "bg-nhan text-white" : "bg-giay-tram text-nhan-dam"}`}>{n.id ? n.ten.trim().split(/\s+/).pop()?.[0]?.toUpperCase() : <User size={16} aria-hidden="true" />}</span>
                    <span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{n.ten}</span>{n.chucDanh && <span className="block truncate text-[12px] text-muc-3">{n.chucDanh}</span>}</span>
                  </button>
                ))}
              </div>
              {nv && <p className="mt-2 text-[12.5px] text-muc-3">{T.gioPhuThuoc}</p>}
            </section>
          )}

          <section className={THE} ref={gioRef}>
            <Buoc so={3 + soBuocDv + soBuocNv} chu={T.b3} xong={!!gio} phu={gio ? <span className="flex items-center gap-1.5 rounded-nho px-3 py-1.5 text-[13px] font-bold text-espresso" style={VANG}><CalendarCheck className="h-4 w-4" aria-hidden />{gio} · {T.thu[thuSo(ngay)]}, {ddmm(ngay)}</span> : <span className="hidden text-[13px] font-medium text-muc-2 sm:block">{T.thu[thuSo(ngay)]}, {ddmm(ngay)}/{ngay.slice(0, 4)}</span>} />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <LichTongQuan nn={p.nn} homNay={p.homNay} ngayDatDuoc={ngays} ngay={ngay} gio={gio} onChon={(d) => { setNgay(d); setGio(""); }} />
              <div>
            <div className="flex items-center gap-2 xl:hidden">
              <button type="button" aria-label={T.buocTruoc} onClick={() => cuon(-1)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram sm:flex"><ChevronLeft size={18} /></button>
              <div ref={thanhNgay} className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={T.b3}>
                {ngays.map((d) => {
                  const chon = ngay === d;
                  return (
                    <button key={d} type="button" role="radio" aria-checked={chon} onClick={() => { setNgay(d); setGio(""); }}
                      className={`flex w-[72px] shrink-0 flex-col items-center rounded-the border-2 py-2 transition-colors ${chon ? "border-nhan bg-nhan text-white" : "border-vien bg-giay-sang text-muc hover:border-nhan/50"}`}>
                      <span className={`text-[11.5px] font-medium ${chon ? "text-white/85" : d === p.homNay ? "text-nhan-dam" : "text-muc-3"}`}>{d === p.homNay ? T.homNay : T.thu[thuSo(d)]}</span>
                      <span className="text-[22px] font-bold tabular-nums leading-tight">{d.slice(8, 10)}</span>
                      <span className={`text-[10.5px] ${chon ? "text-white/80" : "text-muc-3"}`}>{d.slice(5, 7)}/{d.slice(0, 4)}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" aria-label={T.buocSau} onClick={() => cuon(1)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-nho border border-vien-dam text-muc hover:bg-giay-tram sm:flex"><ChevronRight size={18} /></button>
            </div>
            <p className="mb-2.5 mt-5 text-[12px] font-semibold uppercase tracking-wide text-muc-3 xl:mt-0">{T.thu[thuSo(ngay)]}, {ddmm(ngay)} · {T.chonKhung} <span className="text-loi">*</span></p>
            {chiaBuoi && khung && khung.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-1 rounded-the bg-giay-tram p-1" role="tablist" aria-label={T.chonKhung}>
                {[T.sang, T.chieu, T.toi].map((b, i) => {
                  const con = khung.filter((k) => k.con && buoiCua(k.gio) === i).length;
                  return (
                    <button key={b} type="button" role="tab" aria-selected={buoi === i} onClick={() => setBuoi(i)} className={`flex h-11 flex-col items-center justify-center rounded-nho leading-tight transition-colors ${buoi === i ? "bg-giay-sang text-nhan-dam shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muc-2 hover:text-muc"}`}>
                      <span className="text-[13px] font-semibold">{b}</span>
                      <span className={`text-[10.5px] ${con ? "text-nhan" : "text-muc-3"}`}>{con ? `${con} ${T.conCho.toLowerCase()}` : T.hetCho}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {khung === null && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4" aria-busy="true" aria-label={T.dangTai}>
                {Array.from({ length: 12 }, (_, i) => <span key={i} className="h-12 animate-pulse rounded-nho bg-giay-tram" />)}
              </div>
            )}
            {khung !== null && loiGio && <p className="py-2 text-[14px] text-loi">{loiGio} <button type="button" className="font-medium underline" onClick={() => setTaiLai(taiLai + 1)}>{T.thuLai}</button></p>}
            {khung !== null && !loiGio && !khung.some((k) => k.con) && (
              <div className="mb-3 rounded-the bg-giay-tram px-4 py-3 text-[14px] text-muc-2">
                {T.khongCoGio}
                {ngays.indexOf(ngay) < ngays.length - 1 && <button type="button" onClick={() => { setNgay(ngays[ngays.indexOf(ngay) + 1]); setGio(""); }} className="mt-2 flex items-center gap-1 font-semibold text-nhan-dam hover:underline">{T.buocSau}<ChevronRight size={16} aria-hidden /></button>}
              </div>
            )}
            {khung !== null && khung.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4" role="radiogroup" aria-label={T.chonKhung}>
                {khung.filter((k) => !chiaBuoi || buoiCua(k.gio) === buoi).map((k) => (
                  <button key={k.gio} type="button" role="radio" aria-checked={gio === k.gio} disabled={!k.con} onClick={() => { setGio(k.gio); setLoi(""); }}
                    className={`flex h-[52px] flex-col items-center justify-center rounded-nho border transition-colors ${gio === k.gio ? "border-nhan bg-nhan text-white shadow-[0_4px_12px_rgba(0,111,98,0.35)]" : k.con ? "border-nhan/35 bg-giay-sang text-muc hover:border-nhan hover:bg-nhan-nhat" : "cursor-not-allowed border-vien bg-giay-tram text-muc-3 line-through decoration-muc-3/50"}`}>
                    <span className="flex items-center gap-1 text-[14.5px] font-bold tabular-nums">{gio === k.gio && <Check strokeWidth={3} className="h-3.5 w-3.5" aria-hidden />}{k.gio}</span>
                    <span className={`text-[10px] ${gio === k.gio ? "text-white/85" : k.con ? "text-nhan" : ""}`}>{k.con ? T.conCho : T.hetCho}</span>
                  </button>
                ))}
              </div>
            )}
              </div>
            </div>
          </section>

          <section className={THE}>
            <Buoc so={4 + soBuocDv + soBuocNv} chu={T.b4} xong={false} />
            <textarea id="ghi_chu" name="ghi_chu" aria-label={T.b4} maxLength={300} className={O_NHIEU_DONG} />
            {p.gioiThieu && <p className="mt-3 rounded-nho bg-nhan-nhat px-3 py-2 text-[14px] text-nhan-dam">{p.nn === "en" ? "Referred by" : "Người giới thiệu"}: <b>{p.gioiThieu.ten}</b></p>}
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="nen-toi sticky top-16 overflow-hidden rounded-hop text-white shadow-[0_10px_30px_rgba(6,26,23,0.25)]">
            <div className="h-[3px]" style={VANG} aria-hidden />
            <div className="p-5">
              <h2 className="text-[17px] font-bold">{T.lichCuaBan}</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px] text-menu-chu-phu"><span>{T.tienDo} · <span className="tabular-nums">{T.buocXong(soXong, cacBuoc.length)}</span></span>{nutLamLai("text-menu-chu hover:text-white")}</div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-nho bg-white/10"><div className="h-full rounded-nho transition-[width] duration-500" style={{ ...VANG, width: `${(soXong / cacBuoc.length) * 100}%` }} /></div>
              </div>
              <ul className="mt-5 space-y-4 text-[14px]">
                <li className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-menu-nhan" aria-hidden="true" /><span><b className="block">{chiNhanhChon?.ten}</b><span className="text-[13px] text-menu-chu-phu">{chiNhanhChon?.diaChi}</span></span></li>
                <li className="flex gap-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-menu-nhan" aria-hidden="true" /><span><b className="block">{T.thu[thuSo(ngay)]}, {ddmm(ngay)}/{ngay.slice(0, 4)}</b><span className={`text-[13px] ${gio ? "font-semibold text-menu-nhan" : "text-menu-chu-phu"}`}>{gio || T.chuaChonGio}</span></span></li>
                {p.dichVu.length > 0 && (
                  <li className="flex gap-3"><Sparkles size={17} className="mt-0.5 shrink-0 text-menu-nhan" aria-hidden="true" />
                    {dvChon.length ? <ul className="min-w-0 flex-1 space-y-1">{dvChon.map((d) => <li key={d.id} className="flex justify-between gap-2 text-[13px]"><span className="min-w-0">{d.ten}</span>{d.gia != null && <span className="shrink-0 tabular-nums text-menu-chu">{tien(d.gia)}</span>}</li>)}</ul> : <span className="text-[13px] text-menu-chu-phu">{T.chuaChonDv}</span>}
                  </li>
                )}
                {nvChon && <li className="flex gap-3"><User size={17} className="mt-0.5 shrink-0 text-menu-nhan" aria-hidden="true" /><span className="text-[13px]">{T.nguoiLam}: <b>{nvChon.ten}</b></span></li>}
                <li className="flex gap-3"><Users size={17} className="mt-0.5 shrink-0 text-menu-nhan" aria-hidden="true" /><span><span className="block text-[13px] text-menu-chu-phu">{T.nguoiDat}</span>{ten && <b className="block">{gt === "nam" ? T.anh : T.chi} {ten}</b>}<span className="text-[13px] text-menu-chu-phu">{khach} {T.khach}</span></span></li>
              </ul>
              {dvChon.length > 0 && (
                <dl className="mt-5 space-y-1.5 border-t border-white/15 pt-4 text-[13px]">
                  <div className="flex justify-between"><dt className="text-menu-chu-phu">{T.tongThoiGian}</dt><dd className="font-semibold tabular-nums">{tongPhut} {T.phut}</dd></div>
                  {tongGia > 0 && <div className="flex justify-between"><dt className="text-menu-chu-phu">{T.tongGia}</dt><dd className="text-[16px] font-bold tabular-nums text-menu-nhan">{tien(tongGia)}</dd></div>}
                </dl>
              )}
              <button type="submit" disabled={dang} style={VANG} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-nho text-[16px] font-bold text-espresso transition-opacity hover:opacity-95 disabled:opacity-60">
                <CalendarCheck className="h-5 w-5" aria-hidden />{dang ? T.dangGui : T.nutDat}
              </button>
              {p.sdt && <a href={`tel:${p.sdt.replace(/\s/g, "")}`} className="mt-3 flex items-center justify-center gap-2 text-[13px] text-menu-chu hover:text-white"><Phone className="h-4 w-4" aria-hidden />{T.goiNgay} {p.sdt}</a>}
            </div>
          </div>
        </aside>

        {/* Điện thoại: thanh dưới cùng như SalonHero */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-vien bg-giay-sang px-4 py-3 shadow-[0_-6px_20px_rgba(6,26,23,0.08)] lg:hidden">
          <div className="mx-auto mb-2 h-1 max-w-[640px] overflow-hidden rounded-nho bg-giay-tram"><div className="h-full rounded-nho bg-nhan transition-[width] duration-500" style={{ width: `${(soXong / cacBuoc.length) * 100}%` }} /></div>
          <div className="mx-auto flex max-w-[640px] items-center gap-3">
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="truncate font-bold text-muc">{gio ? `${gio} · ${T.thu[thuSo(ngay)]}, ${ddmm(ngay)}` : T.chuaChonGio}</p>
              <p className="truncate text-muc-3">{dvChon.length ? `${dvChon.length} ${T.dichVu.toLowerCase()}${tongGia > 0 ? ` · ${tien(tongGia)}` : ""}` : `${chiNhanhChon?.ten ?? ""} · ${khach} ${T.khach}`}</p>
            </div>
            <button type="submit" disabled={dang} className="nut-vang flex h-11 shrink-0 items-center gap-2 rounded-nho px-5 text-[15px] disabled:opacity-60"><CalendarCheck className="h-4 w-4" aria-hidden />{dang ? T.dangGui : T.nutDat}</button>
          </div>
        </div>
      </form>
      {cuoi}
    </>
  );
}

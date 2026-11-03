"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Minus, Plus, User } from "lucide-react";
import { O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { coOChiNhanh } from "@/lib/ban-hang";
import { datLichOnline, layKhungGio, type KhungGio } from "./actions";
import { CHU, type NgonNgu } from "./chu";

export type CnDat = { id: string; ten: string; diaChi: string; khuVuc: string; dienThoai: string; gioHomNay: string | null; /** có chỗ làm → nhận đặt online */ datDuoc: boolean };
export type DvDat = { id: string; ten: string; phut: number; nhom: string; /** "Địa điểm cung cấp": null = mọi chi nhánh. */ cn?: string[] | null; /** Chỉ có khi cài đặt bật "Hiện giá". */ gia?: number };
export type NvDat = { id: string; ten: string; chucDanh: string; cn: string | null };
type Props = {
  nn: NgonNgu; mo: boolean; sdt: string; tenCuaHang: string; anhBia: string | null; chiNhanh: CnDat[]; dichVu: DvDat[]; nhanVien: NvDat[];
  homNay: string; soNgay: number; khungPhut: number; hienBuoi: boolean; doiTuong: string; phutMacDinh: number;
};

const congNgay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const thuSo = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();
const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const buoiCua = (g: string) => (g < "12:00" ? 0 : g < "18:00" ? 1 : 2);
const banDo = (diaChi: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(diaChi)}`;
const THE = "rounded-the border border-vien bg-giay-sang p-4 sm:p-5";
const BUOC = (so: number, chu: string) => (
  <h2 className="mb-3 flex items-center gap-2.5 text-[16px] font-semibold text-muc">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-nho bg-nhan-nhat text-[13px] text-nhan-dam">{so}</span>{chu}
  </h2>
);

/** Trang đặt lịch y SalonHero: tab Đặt lịch / Chi nhánh / Dịch vụ; 1 thông tin khách → 2 địa điểm (→ dịch vụ, người làm khi cài đặt bật) → 3 ngày + khung giờ còn/hết chỗ → 4 ghi chú; khung "Lịch hẹn của quý khách"; đặt xong là có lịch hẹn. */
export function FormDatLich(p: Props) {
  const T = CHU[p.nn];
  const [kq, action, dang] = useActionState(datLichOnline, undefined);
  const [tab, setTab] = useState<"dat" | "cn" | "dv">("dat");
  const datDuoc = p.chiNhanh.filter((c) => c.datDuoc);
  const [cn, setCn] = useState(datDuoc[0]?.id ?? "");
  const [khu, setKhu] = useState("");
  const [dv, setDv] = useState<string[]>([]);
  const [timDv, setTimDv] = useState("");
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

  const chiNhanhChon = p.chiNhanh.find((c) => c.id === cn);
  const dsDv = p.dichVu.filter((d) => coOChiNhanh(d.cn, cn));
  const dvChon = p.dichVu.filter((d) => dv.includes(d.id));
  const dsNv = p.nhanVien.filter((n) => !n.cn || n.cn === cn);
  const nvChon = p.nhanVien.find((n) => n.id === nv);
  const tongPhut = dvChon.length ? dvChon.reduce((a, d) => a + d.phut, 0) : p.phutMacDinh;
  const tongGia = dvChon.reduce((a, d) => a + (d.gia ?? 0), 0);
  const khuVuc = [...new Set(datDuoc.map((c) => c.khuVuc || T.khuVucKhac))];
  const ngays = useMemo(() => Array.from({ length: p.soNgay + 1 }, (_, i) => congNgay(p.homNay, i)), [p.homNay, p.soNgay]);
  const chiaBuoi = p.hienBuoi && p.khungPhut < 30;

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
    if (ten.trim().length < 2 || sdt.replace(/\D/g, "").length < 9) { e.preventDefault(); setLoi(T.thieuTT); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (!gio) { e.preventDefault(); setLoi(T.chonGio); gioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  };

  const dau = (
    <header className="mx-auto w-full max-w-[1040px] px-4 pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-the">
        {p.anhBia
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.anhBia} alt="" className="aspect-[1600/460] max-h-[260px] w-full object-cover" />
          : <div className="aspect-[1600/460] max-h-[260px] w-full" style={{ background: "linear-gradient(120deg, var(--nhan-dam), var(--nhan))" }} aria-hidden="true" />}
        <div className="absolute right-3 top-3 flex overflow-hidden rounded-nho border border-white/60 bg-white/85 text-[12px] font-semibold">
          {(["vi", "en"] as const).map((x) => <Link key={x} href={`?lang=${x}`} aria-current={p.nn === x ? "true" : undefined} className={`px-2.5 py-1 ${p.nn === x ? "bg-nhan text-white" : "text-muc"}`}>{x.toUpperCase()}</Link>)}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 px-1 pt-3 sm:gap-4">
        <div className="-mt-12 rounded-the border border-vien bg-giay-sang p-2.5 sm:-mt-14"><Image src="/logo-amia.png" alt={p.tenCuaHang} width={150} height={65} priority className="h-auto w-[84px] sm:w-[104px]" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="chu-tieu-de text-[24px] leading-tight text-muc sm:text-[28px]">{p.tenCuaHang}</h1>
          {chiNhanhChon && <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muc-3"><Clock size={14} aria-hidden="true" />{chiNhanhChon.gioHomNay ? `${T.gioMoCua}: ${chiNhanhChon.gioHomNay}` : T.nghiHomNay}</p>}
        </div>
      </div>
      {p.mo && <nav className="mt-3 flex gap-1 border-b border-vien" aria-label="Mục">
        {([["dat", T.datLich], ["cn", `${T.chiNhanh} ${p.chiNhanh.length}`], ["dv", T.dichVu]] as const).map(([k, nhan]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2.5 text-[14px] font-medium ${tab === k ? "border-nhan text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{nhan}</button>
        ))}
      </nav>}
    </header>
  );

  if (kq?.ok && kq.daDat) {
    const d = kq.daDat;
    return (
      <>{dau}
        <main className="mx-auto w-full max-w-[640px] px-4 py-6">
          <section role="status" className={`${THE} text-[15px]`}>
            <p className="text-[20px] font-semibold text-nhan-dam">{T.thanhCong}</p>
            <p className="mt-1 text-muc-2">{T.camOn}</p>
            <dl className="mt-4 divide-y divide-vien border-y border-vien">
              {([[T.thoiGian, `${d.gio} ${T.thu[thuSo(d.ngay)]}, ${ddmm(d.ngay)}/${d.ngay.slice(0, 4)}`], [T.dichVu, d.dichVu.join(", ")], [T.nguoiLam, d.nguoiLam], [T.diaChi, d.diaChi], [T.nguoiDat, d.ten], [T.sdtDat, d.sdt]] as const)
                .filter(([, v]) => v).map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2"><dt className="text-muc-3">{k}</dt><dd className="font-medium text-muc">{v}</dd></div>)}
            </dl>
            <button type="button" className="nut-vang mt-5 h-11 w-full rounded-nho text-[15px]" onClick={() => window.location.reload()}>{T.datKhac}</button>
          </section>
        </main>
      </>
    );
  }

  if (!p.mo) {
    return (
      <>{dau}
        <main className="mx-auto w-full max-w-[640px] px-4 py-6">
          <div className={`${THE} text-[15px] text-muc-2`}><p className="font-semibold text-muc">{T.khoa}</p><p className="mt-1">{p.sdt ? T.goi(p.sdt) : T.lienHe}</p></div>
        </main>
      </>
    );
  }

  return (
    <>{dau}
      {tab === "cn" && (
        <main className="mx-auto w-full max-w-[1040px] px-4 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {p.chiNhanh.map((c) => (
              <div key={c.id} className={THE}>
                <p className="text-[16px] font-semibold text-muc">{c.ten}</p>
                {c.diaChi && <p className="mt-1 flex gap-1.5 text-[14px] text-muc-2"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{c.diaChi}</p>}
                <p className="mt-1 text-[13px] text-muc-3">{c.gioHomNay ? `${T.gioMoCua}: ${c.gioHomNay}` : T.nghiHomNay}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.datDuoc ? <button type="button" className="nut-vang h-10 rounded-nho px-4 text-[14px]" onClick={() => { doiCn(c.id); setTab("dat"); }}>{T.datTaiDay}</button> : <span className="self-center text-[13px] text-muc-3">{T.chuaNhanOnline}</span>}
                  {c.diaChi && <a href={banDo(c.diaChi)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc hover:bg-giay-tram">{T.chiDuong}</a>}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
      {tab === "dv" && (
        <main className="mx-auto w-full max-w-[1040px] px-4 py-5">
          {p.dichVu.length === 0 ? <p className={`${THE} text-center text-[15px] text-muc-2`}>({T.lienHeDv})</p> : (
            <div className="space-y-4">
              {[...new Set(p.dichVu.map((d) => d.nhom))].map((n) => (
                <section key={n} className={THE}>
                  <h2 className="mb-2 text-[15px] font-semibold text-muc">{n}</h2>
                  <ul className="divide-y divide-vien">
                    {p.dichVu.filter((d) => d.nhom === n).map((d) => <li key={d.id} className="flex items-center gap-3 py-2 text-[14px]"><span className="min-w-0 flex-1 text-muc">{d.ten}</span>{d.gia != null && <span className="tabular-nums text-muc-2">{d.gia.toLocaleString("vi-VN")}đ</span>}<span className="text-muc-3">{d.phut} {T.phut}</span></li>)}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      )}
      <form action={action} onSubmit={kiemTruocKhiGui} hidden={tab !== "dat"} id="form-dat-lich" className="mx-auto grid w-full max-w-[1040px] gap-4 px-4 pb-28 pt-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-10">
        <input type="hidden" name="mo_luc" value={moLuc} />
        <input type="hidden" name="chi_nhanh_id" value={cn} />
        <input type="hidden" name="dich_vu_ids" value={dv.join(",")} />
        <input type="hidden" name="nhan_vien_id" value={nv} />
        <input type="hidden" name="ngay" value={ngay} />
        <input type="hidden" name="gio" value={gio} />
        <input type="hidden" name="so_khach" value={khach} />
        <input type="hidden" name="gioi_tinh" value={gt} />
        {/* Ô bẫy cho bot: người thật không thấy, không tới được bằng bàn phím */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        <div className="min-w-0 space-y-4">
          {(loi || kq?.loi) && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi"><b>{kq?.loi && !loi ? `${T.loiDat}: ` : ""}</b>{loi || kq?.loi}</p>}
          <section className={THE}>
            {BUOC(1, T.b1)}
            <div className="space-y-3">
              <div><label htmlFor="dien_thoai" className="mb-1.5 block text-[13px] font-medium text-muc-2">{T.sdt} *</label><input id="dien_thoai" name="dien_thoai" type="tel" inputMode="tel" required autoComplete="tel" maxLength={20} placeholder="091 234 56 78" value={sdt} onChange={(e) => setSdt(e.target.value)} className={O_NHAP} /></div>
              <div>
                <label htmlFor="ho_ten" className="mb-1.5 block text-[13px] font-medium text-muc-2">{T.hoTen} *</label>
                <div className="flex gap-2">
                  <input id="ho_ten" name="ho_ten" required minLength={2} maxLength={100} autoComplete="name" value={ten} onChange={(e) => setTen(e.target.value)} className={`${O_NHAP} min-w-0 flex-1`} />
                  {p.doiTuong === "ca" && (
                    <div className="flex shrink-0 overflow-hidden rounded-nho border border-vien-dam" role="group" aria-label="Xưng hô">
                      {([["nữ", T.chi], ["nam", T.anh]] as const).map(([v, nhan]) => <button key={v} type="button" aria-pressed={gt === v} onClick={() => setGt(v)} className={`h-11 px-3.5 text-[14px] font-medium ${gt === v ? "bg-nhan text-white" : "bg-giay-sang text-muc-2"}`}>{nhan}</button>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-vien pt-3">
                <span className="text-[14px] font-medium text-muc">{T.diNhom}</span>
                <div className="flex items-center gap-1" role="group" aria-label="Số khách">
                  <button type="button" aria-label="Bớt một khách" disabled={khach <= 1} onClick={() => setKhach(khach - 1)} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc disabled:opacity-40"><Minus size={16} /></button>
                  <span className="w-8 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">{khach}</span>
                  <button type="button" aria-label="Thêm một khách" disabled={khach >= 20} onClick={() => setKhach(khach + 1)} className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam text-muc disabled:opacity-40"><Plus size={16} /></button>
                </div>
              </div>
            </div>
          </section>

          <section className={THE}>
            {BUOC(2, T.b2)}
            {khuVuc.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {[["", `${T.tatCaKhuVuc} ${datDuoc.length}`], ...khuVuc.map((k) => [k, `${k} ${datDuoc.filter((c) => (c.khuVuc || T.khuVucKhac) === k).length}`])].map(([k, nhan]) => (
                  <button key={k} type="button" aria-pressed={khu === k} onClick={() => setKhu(k)} className={`h-9 rounded-nho border px-3 text-[13px] font-medium ${khu === k ? "border-nhan bg-nhan text-white" : "border-vien-dam text-muc-2"}`}>{nhan}</button>
                ))}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={T.b2}>
              {datDuoc.filter((c) => !khu || (c.khuVuc || T.khuVucKhac) === khu).map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={cn === c.id} onClick={() => doiCn(c.id)} className={`rounded-nho border p-3 text-left ${cn === c.id ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc hover:bg-giay-tram"}`}>
                  <span className="block text-[15px] font-semibold">{c.ten}</span>
                  {c.diaChi && <span className={`mt-0.5 block text-[13px] ${cn === c.id ? "text-white/85" : "text-muc-3"}`}>{c.diaChi}</span>}
                </button>
              ))}
            </div>
          </section>

          {dsDv.length > 0 && (
            <section className={THE}>
              {BUOC(3, T.bDv)}
              <input type="search" aria-label={T.timDv} placeholder={T.timDv} value={timDv} onChange={(e) => setTimDv(e.target.value)} className={`${O_NHAP} mb-3`} />
              <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
                {dsDv.filter((d) => !timDv || d.ten.toLowerCase().includes(timDv.toLowerCase())).map((d) => (
                  <label key={d.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-nho border px-3 py-2 text-[14px] ${dv.includes(d.id) ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam bg-giay-sang text-muc"}`}>
                    <input type="checkbox" checked={dv.includes(d.id)} disabled={!dv.includes(d.id) && dv.length >= 5} onChange={() => { setDv(dv.includes(d.id) ? dv.filter((x) => x !== d.id) : [...dv, d.id]); setGio(""); }} className="h-4 w-4 accent-[var(--nhan)]" />
                    <span className="min-w-0 flex-1">{d.ten}<span className="block text-[12px] text-muc-3">{d.nhom}</span></span>
                    {d.gia != null && <span className="shrink-0 text-[13px] font-medium tabular-nums text-muc-2">{d.gia.toLocaleString("vi-VN")}đ</span>}
                    <span className="shrink-0 text-[12px] text-muc-3">{d.phut} {T.phut}</span>
                  </label>
                ))}
                {dsDv.every((d) => timDv && !d.ten.toLowerCase().includes(timDv.toLowerCase())) && <p className="text-[13px] text-muc-3">{T.khongThayDv}</p>}
              </div>
            </section>
          )}

          {dsNv.length > 0 && (
            <section className={THE}>
              {BUOC(dsDv.length > 0 ? 4 : 3, T.bNv)}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={T.bNv}>
                {[{ id: "", ten: T.batKy, chucDanh: T.batKyMoTa }, ...dsNv].map((n) => (
                  <button key={n.id || "bat-ky"} type="button" role="radio" aria-checked={nv === n.id} onClick={() => { setNv(n.id); setGio(""); }} className={`flex items-center gap-2 rounded-nho border p-2.5 text-left ${nv === n.id ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam bg-giay-sang text-muc"}`}>
                    <User size={18} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{n.ten}</span>{n.chucDanh && <span className="block truncate text-[12px] text-muc-3">{n.chucDanh}</span>}</span>
                  </button>
                ))}
              </div>
              {nv && <p className="mt-2 text-[12px] text-muc-3">{T.gioPhuThuoc}</p>}
            </section>
          )}

          <section className={THE} ref={gioRef}>
            <div className="flex items-start justify-between gap-2">
              {BUOC(3 + (dsDv.length > 0 ? 1 : 0) + (dsNv.length > 0 ? 1 : 0), T.b3)}
              <span className="text-[13px] text-muc-3">{T.thu[thuSo(ngay)]}, {ddmm(ngay)}/{ngay.slice(0, 4)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" aria-label={T.buocTruoc} onClick={() => cuon(-1)} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-nho border border-vien-dam text-muc sm:flex"><ChevronLeft size={16} /></button>
              <div ref={thanhNgay} className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={T.b3}>
                {ngays.map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={ngay === d} onClick={() => { setNgay(d); setGio(""); }} className={`flex w-[64px] shrink-0 flex-col items-center rounded-nho border py-1.5 ${ngay === d ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc"}`}>
                    <span className="text-[11px]">{d === p.homNay ? T.homNay : T.thu[thuSo(d)]}</span>
                    <span className="text-[18px] font-semibold tabular-nums leading-tight">{d.slice(8, 10)}</span>
                    <span className={`text-[10px] ${ngay === d ? "text-white/80" : "text-muc-3"}`}>{d.slice(5, 7)}/{d.slice(0, 4)}</span>
                  </button>
                ))}
              </div>
              <button type="button" aria-label={T.buocSau} onClick={() => cuon(1)} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-nho border border-vien-dam text-muc sm:flex"><ChevronRight size={16} /></button>
            </div>
            <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-muc-3">{T.chonKhung} (*)</p>
            {chiaBuoi && khung && khung.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-1 rounded-nho bg-giay-tram p-1" role="tablist" aria-label={T.chonKhung}>
                {[T.sang, T.chieu, T.toi].map((b, i) => <button key={b} type="button" role="tab" aria-selected={buoi === i} onClick={() => setBuoi(i)} className={`h-9 rounded-nho text-[13px] font-medium ${buoi === i ? "bg-nhan text-white" : "text-muc-2"}`}>{b}</button>)}
              </div>
            )}
            {khung === null && <p className="py-3 text-[14px] text-muc-3">{T.dangTai}</p>}
            {khung !== null && loiGio && <p className="py-2 text-[14px] text-loi">{loiGio} <button type="button" className="font-medium underline" onClick={() => setTaiLai(taiLai + 1)}>{T.thuLai}</button></p>}
            {khung !== null && !loiGio && !khung.some((k) => k.con) && <p className="py-2 text-[14px] text-muc-3">{T.khongCoGio}</p>}
            {khung !== null && khung.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={T.chonKhung}>
                {khung.filter((k) => !chiaBuoi || buoiCua(k.gio) === buoi).map((k) => (
                  <button key={k.gio} type="button" role="radio" aria-checked={gio === k.gio} disabled={!k.con} onClick={() => { setGio(k.gio); setLoi(""); }}
                    className={`flex h-12 flex-col items-center justify-center rounded-nho border ${gio === k.gio ? "border-nhan bg-nhan text-white" : k.con ? "border-nhan/40 bg-giay-sang text-muc hover:bg-nhan-nhat" : "border-vien bg-giay-tram text-muc-3"}`}>
                    <span className="text-[14px] font-semibold tabular-nums">{k.gio}</span>
                    <span className="text-[10px]">{k.con ? T.conCho : T.hetCho}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={THE}>
            {BUOC(4 + (dsDv.length > 0 ? 1 : 0) + (dsNv.length > 0 ? 1 : 0), T.b4)}
            <textarea id="ghi_chu" name="ghi_chu" aria-label={T.b4} maxLength={300} className={O_NHIEU_DONG} />
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className={`${THE} sticky top-4`}>
            <h2 className="mb-3 text-[16px] font-semibold text-muc">{T.lichCuaBan}</h2>
            <ul className="space-y-2.5 text-[14px]">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-muc-3" aria-hidden="true" /><span><b className="block text-muc">{chiNhanhChon?.ten}</b><span className="text-[13px] text-muc-3">{chiNhanhChon?.diaChi}</span></span></li>
              <li className="flex gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-muc-3" aria-hidden="true" /><span><b className="block text-muc">{T.thu[thuSo(ngay)]}, {ddmm(ngay)}/{ngay.slice(0, 4)}</b><span className="text-[13px] text-muc-3">{gio || T.chuaChonGio}</span></span></li>
              {p.dichVu.length > 0 && <li className="text-[13px] text-muc-2">{dvChon.length ? dvChon.map((d) => d.ten).join(", ") : T.chuaChonDv}</li>}
              {nvChon && <li className="text-[13px] text-muc-2">{T.nguoiLam}: <b className="text-muc">{nvChon.ten}</b></li>}
              <li className="flex gap-2"><User size={16} className="mt-0.5 shrink-0 text-muc-3" aria-hidden="true" /><span><span className="block text-[13px] text-muc-3">{T.nguoiDat}</span>{ten && <b className="block text-muc">{ten}</b>}<span className="text-[13px] text-muc-3">{khach} {T.khach}</span></span></li>
              {dvChon.length > 0 && <li className="border-t border-vien pt-2 text-[13px] text-muc-2">{T.tongThoiGian}: <b>{tongPhut} {T.phut}</b>{tongGia > 0 && <><br />{T.tongGia}: <b>{tongGia.toLocaleString("vi-VN")}đ</b></>}</li>}
            </ul>
            <button type="submit" disabled={dang} className="nut-vang mt-4 h-12 w-full rounded-nho text-[16px] disabled:opacity-60">{dang ? T.dangGui : T.nutDat}</button>
          </div>
        </aside>

        {/* Điện thoại: thanh dưới cùng như SalonHero */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-vien bg-giay-sang px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center gap-3">
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="truncate font-semibold text-muc">{gio ? `${gio} · ${T.thu[thuSo(ngay)]}, ${ddmm(ngay)}` : T.chuaChonGio}</p>
              <p className="truncate text-muc-3">{chiNhanhChon?.ten} · {khach} {T.khach}</p>
            </div>
            <button type="submit" disabled={dang} className="nut-vang h-11 shrink-0 rounded-nho px-5 text-[15px] disabled:opacity-60">{dang ? T.dangGui : T.nutDat}</button>
          </div>
        </div>
      </form>
      <p className="pb-24 text-center text-[12px] text-muc-3 lg:pb-8">{p.tenCuaHang}</p>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { AnhKhach } from "@/lib/anh-khach";
import { ngayGioVN, ngayVN } from "@/lib/dinh-dang";

const LOAI_ANH: Record<string, string> = { truoc: "Trước", sau: "Sau", khac: "Khác" };
const TOI_DA = 6, NAC_BAM_DUP = 300;
type Nhin = { s: number; x: number; y: number };
const GOC: Nhin = { s: 1, x: 0, y: 0 };
const kep = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Khung xem một ảnh: phóng to/thu nhỏ quanh đúng điểm đang trỏ hoặc chụm (cuộn chuột, hai ngón, bấm đúp, nút +/−), kéo để dịch khi đã phóng, vuốt ngang để đổi ảnh khi chưa phóng. */
function KhungAnh({ anh, truoc, sau }: { anh: AnhKhach; truoc?: () => void; sau?: () => void }) {
  const [nhin, setNhin] = useState<Nhin>(GOC);
  const [keo, setKeo] = useState(false);
  const vung = useRef<HTMLDivElement>(null);
  const nhinRef = useRef<Nhin>(GOC);
  const dau = useRef(new Map<number, { x: number; y: number }>());
  const cham = useRef({ x0: 0, y0: 0, t: 0, daDi: false, cach0: 0, s0: 1 });
  const lanBamCuoi = useRef({ t: 0, x: 0, y: 0 });

  const dat = (n: Nhin) => {
    // Không cho kéo ảnh ra khỏi khung: phần dịch tối đa = nửa phần ảnh phóng vượt khung.
    const r = vung.current?.getBoundingClientRect();
    const gx = r ? ((n.s - 1) * r.width) / 2 : 0, gy = r ? ((n.s - 1) * r.height) / 2 : 0;
    const v = n.s <= 1 ? GOC : { s: n.s, x: kep(n.x, -gx, gx), y: kep(n.y, -gy, gy) };
    nhinRef.current = v;
    setNhin(v);
  };
  // Tâm phóng là điểm (fx, fy) tính từ tâm khung: điểm đó đứng yên trên màn hình khi đổi tỉ lệ.
  const phongQuanh = (sMoi: number, fx: number, fy: number) => {
    const v = nhinRef.current, s = kep(sMoi, 1, TOI_DA), k = s / v.s;
    dat({ s, x: fx - (fx - v.x) * k, y: fy - (fy - v.y) * k });
  };
  const tamTu = (cx: number, cy: number) => {
    const r = vung.current!.getBoundingClientRect();
    return { fx: cx - r.left - r.width / 2, fy: cy - r.top - r.height / 2 };
  };

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") phongQuanh(nhinRef.current.s * 1.4, 0, 0);
      else if (e.key === "-") phongQuanh(nhinRef.current.s / 1.4, 0, 0);
      else if (e.key === "0") dat(GOC);
    };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xuongTay = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dau.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const c = cham.current;
    if (dau.current.size === 1) { c.x0 = e.clientX; c.y0 = e.clientY; c.t = performance.now(); c.daDi = false; }
    if (dau.current.size === 2) {
      const [a, b] = [...dau.current.values()];
      c.cach0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; c.s0 = nhinRef.current.s; c.daDi = true;
    }
    setKeo(true);
  };
  const diChuyen = (e: React.PointerEvent) => {
    const p = dau.current.get(e.pointerId);
    if (!p) return;
    const c = cham.current;
    if (dau.current.size === 2) {
      dau.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...dau.current.values()];
      const { fx, fy } = tamTu((a.x + b.x) / 2, (a.y + b.y) / 2);
      phongQuanh(c.s0 * (Math.hypot(a.x - b.x, a.y - b.y) / c.cach0), fx, fy);
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    dau.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - c.x0, e.clientY - c.y0) > 8) c.daDi = true;
    const v = nhinRef.current;
    if (v.s > 1) dat({ s: v.s, x: v.x + dx, y: v.y + dy });
  };
  const nhacTay = (e: React.PointerEvent) => {
    const c = cham.current;
    dau.current.delete(e.pointerId);
    if (dau.current.size > 0) return;
    setKeo(false);
    const dx = e.clientX - c.x0, dy = e.clientY - c.y0, v = nhinRef.current;
    if (!c.daDi && performance.now() - c.t < 350) {
      // Chạm nhanh không kéo: hai lần liên tiếp = bấm đúp (phóng 2,5 lần tại điểm chạm, hoặc về vừa khung).
      const l = lanBamCuoi.current, now = performance.now();
      if (now - l.t < NAC_BAM_DUP && Math.hypot(e.clientX - l.x, e.clientY - l.y) < 30) {
        const { fx, fy } = tamTu(e.clientX, e.clientY);
        if (v.s > 1) dat(GOC); else phongQuanh(2.5, fx, fy);
        lanBamCuoi.current = { t: 0, x: 0, y: 0 };
      } else lanBamCuoi.current = { t: now, x: e.clientX, y: e.clientY };
    } else if (v.s === 1 && Math.abs(dx) > 70 && Math.abs(dy) < 60 && performance.now() - c.t < 600) {
      (dx < 0 ? sau : truoc)?.();
    }
  };
  const cuon = (e: React.WheelEvent) => {
    const { fx, fy } = tamTu(e.clientX, e.clientY);
    phongQuanh(nhinRef.current.s * Math.exp(-e.deltaY * 0.0022), fx, fy);
  };

  return (
    <>
      <div ref={vung} onPointerDown={xuongTay} onPointerMove={diChuyen} onPointerUp={nhacTay} onPointerCancel={nhacTay} onWheel={cuon}
        className={`absolute inset-0 flex touch-none select-none items-center justify-center overflow-hidden ${nhin.s > 1 ? (keo ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={anh.url ?? undefined} alt={`Ảnh ${LOAI_ANH[anh.loai] ?? ""} điều trị ngày ${ngayVN(anh.ngay)}`} draggable={false}
          style={{ transform: `translate(${nhin.x}px, ${nhin.y}px) scale(${nhin.s})`, transition: keo ? "none" : "transform 140ms ease-out" }}
          className="max-h-full max-w-full object-contain" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-the bg-black/65 p-1.5 text-white">
          <button type="button" onClick={() => phongQuanh(nhinRef.current.s / 1.5, 0, 0)} disabled={nhin.s <= 1} aria-label="Thu nhỏ" className="flex h-11 w-11 items-center justify-center rounded-nho hover:bg-white/15 disabled:opacity-40"><Minus strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={() => dat(GOC)} aria-label="Vừa khung" title="Vừa khung" className="flex h-11 min-w-[64px] items-center justify-center gap-1.5 rounded-nho px-2 text-[13px] hover:bg-white/15"><RotateCcw strokeWidth={1.8} className="h-4 w-4" aria-hidden />{Math.round(nhin.s * 100)}%</button>
          <button type="button" onClick={() => phongQuanh(nhinRef.current.s * 1.5, 0, 0)} disabled={nhin.s >= TOI_DA} aria-label="Phóng to" className="flex h-11 w-11 items-center justify-center rounded-nho hover:bg-white/15 disabled:opacity-40"><Plus strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>
        </div>
      </div>
    </>
  );
}

/** Lớp phủ xem ảnh khách toàn màn hình: chọn ảnh bằng bấm vào lưới, đổi ảnh bằng mũi tên / phím ← → / vuốt, đóng bằng Esc, nút X hoặc bấm nền. */
export function XemAnhPhongTo({ ds, chiSo, dong, doiToi, xoaDuoc, xoa }: {
  ds: AnhKhach[]; chiSo: number; dong: () => void; doiToi: (i: number) => void;
  /** Ảnh này người đang xem có được xoá không (người tải lên, hoặc người ghi hồ sơ điều trị). */
  xoaDuoc?: (a: AnhKhach) => boolean;
  /** Xoá ảnh; trả câu lỗi nếu không xoá được. */
  xoa?: (a: AnhKhach) => Promise<string | undefined>;
}) {
  const nutDong = useRef<HTMLButtonElement>(null);
  // Tải sẵn ảnh kế bên để bấm sang ảnh trước/sau là hiện ngay.
  useEffect(() => {
    for (const i of [chiSo + 1, chiSo - 1, chiSo + 2]) { const u = ds[i]?.url; if (u) new Image().src = u; }
  }, [ds, chiSo]);
  // Hộp hỏi xoá gắn với đúng một ảnh: đổi sang ảnh khác thì tự đóng, không cần đặt lại trạng thái.
  const [hoiXoaId, setHoiXoaId] = useState<string | null>(null);
  const [dangXoa, setDangXoa] = useState(false);
  const [loiXoa, setLoiXoa] = useState<{ id: string; loi: string } | null>(null);
  const chiSoRef = useRef(chiSo);
  const anh = ds[chiSo];
  const hoiXoaRef = useRef(false);
  useEffect(() => { chiSoRef.current = chiSo; }, [chiSo]);

  useEffect(() => {
    const truocDo = document.activeElement;
    nutDong.current?.focus();
    const phim = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (hoiXoaRef.current) setHoiXoaId(null); else dong(); }
      else if (e.key === "ArrowLeft") doiToi(kep(chiSoRef.current - 1, 0, ds.length - 1));
      else if (e.key === "ArrowRight") doiToi(kep(chiSoRef.current + 1, 0, ds.length - 1));
    };
    document.addEventListener("keydown", phim);
    return () => { document.removeEventListener("keydown", phim); if (truocDo instanceof HTMLElement) truocDo.focus(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!anh) return null;
  const hoiXoa = hoiXoaId === anh.id;
  const loiAnh = loiXoa?.id === anh.id ? loiXoa.loi : "";
  const truoc = chiSo > 0 ? () => doiToi(chiSo - 1) : undefined, sau = chiSo < ds.length - 1 ? () => doiToi(chiSo + 1) : undefined;
  return (
    <div className="fixed inset-0 z-[60] bg-black/92 text-white" role="dialog" aria-modal="true" aria-label={`Xem ảnh ${chiSo + 1} trên ${ds.length}`}>
      <KhungAnh key={anh.id} anh={anh} truoc={truoc} sau={sau} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-6 pt-[calc(12px+env(safe-area-inset-top))]">
        <div className="min-w-0 text-[13px] leading-tight">
          <div className="font-medium">{LOAI_ANH[anh.loai] ?? ""} · {ngayVN(anh.ngay)}</div>
          <div className="mt-0.5 truncate text-white/70">{anh.ghiChu ? `${anh.ghiChu} · ` : ""}{chiSo + 1} / {ds.length}</div>
          <div className="mt-0.5 truncate text-white/70">{anh.taoBoi ? `Tạo bởi ${anh.taoBoi}` : "Chuyển từ hệ thống cũ"} · {ngayGioVN(anh.taoLuc)}</div>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <a href={`/api/khach/anh/${anh.id}`} download aria-label="Tải ảnh về" title="Tải về" className="flex h-11 w-11 items-center justify-center rounded-nho bg-black/50 hover:bg-white/20"><Download strokeWidth={1.8} className="h-5 w-5" aria-hidden /></a>
          {xoa && xoaDuoc?.(anh) && <button type="button" onClick={() => { hoiXoaRef.current = true; setHoiXoaId(anh.id); }} aria-label="Xoá ảnh" title="Xoá ảnh" className="flex h-11 w-11 items-center justify-center rounded-nho bg-black/50 hover:bg-white/20"><Trash2 strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>}
        </div>
        <button ref={nutDong} type="button" onClick={dong} aria-label="Đóng" className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-nho bg-black/50 hover:bg-white/20"><X strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>
      </div>
      {anh.vanBan && (
        <details className="absolute inset-x-0 bottom-0 z-10 max-h-[45%] overflow-auto bg-black/75 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 text-[13px]">
          <summary className="cursor-pointer select-none font-medium text-white">Chữ đọc được trong ảnh</summary>
          <p className="mt-2 whitespace-pre-wrap text-white/85">{anh.vanBan}</p>
          <p className="mt-2 text-[12px] text-white/60">Máy tự đọc nên có thể sai, nhất là chữ viết tay và số. Cần chính xác thì xem ảnh.</p>
        </details>
      )}
      {hoiXoa && xoa && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="hoi-xoa-anh" className="absolute inset-x-4 top-1/2 z-20 mx-auto max-w-sm -translate-y-1/2 rounded-the bg-giay-sang p-4 text-muc">
          <p id="hoi-xoa-anh" className="text-[15px] font-medium">Xoá vĩnh viễn ảnh này?</p>
          <p className="mt-1 text-[13px] text-muc-3">Ảnh {LOAI_ANH[anh.loai]?.toLowerCase() ?? ""} ngày {ngayVN(anh.ngay)} sẽ bị xoá khỏi kho, không lấy lại được. Việc xoá được ghi nhật ký.</p>
          {loiAnh && <p role="alert" className="mt-2 text-[13px] text-loi">{loiAnh}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => { hoiXoaRef.current = false; setHoiXoaId(null); }} className="h-10 rounded-nho border border-vien-dam px-4 text-[13px] text-muc-2 hover:bg-giay-tram">Huỷ</button>
            <button type="button" disabled={dangXoa} onClick={async () => { setDangXoa(true); setLoiXoa(null); const l = await xoa(anh); setDangXoa(false); if (l) setLoiXoa({ id: anh.id, loi: l }); else { hoiXoaRef.current = false; setHoiXoaId(null); } }}
              className="h-10 rounded-nho bg-loi px-4 text-[13px] font-medium text-white disabled:opacity-60">{dangXoa ? "Đang xoá…" : "Xoá ảnh"}</button>
          </div>
        </div>
      )}
      {truoc && <button type="button" onClick={truoc} aria-label="Ảnh trước" className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-nho bg-black/50 hover:bg-white/20 sm:flex"><ChevronLeft strokeWidth={1.8} className="h-6 w-6" aria-hidden /></button>}
      {sau && <button type="button" onClick={sau} aria-label="Ảnh sau" className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-nho bg-black/50 hover:bg-white/20 sm:flex"><ChevronRight strokeWidth={1.8} className="h-6 w-6" aria-hidden /></button>}
    </div>
  );
}

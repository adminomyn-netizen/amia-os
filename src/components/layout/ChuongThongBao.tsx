"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, CalendarClock, Check, ClipboardList, CreditCard, Receipt, Volume2, X, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NHOM_THONG_BAO, type NhomThongBao } from "@/lib/nhom-thong-bao";

type Muc = { ma: string; nhan: string; href: string; trang: "chua_doc" | "da_doc"; nhom: NhomThongBao };
type KetQua = { ds: Muc[]; tatTieng?: boolean };

/** Tiếng "ting" ngắn khi có việc mới (Web Audio, không cần tệp âm thanh). Trình duyệt chặn khi người dùng chưa chạm trang lần nào thì thôi. */
function keuTing() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ac = new AC(), o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, ac.currentTime); o.frequency.setValueAtTime(1320, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.45);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.5); o.onended = () => void ac.close();
  } catch { /* trình duyệt chặn */ }
}

/** Biểu tượng + màu nền theo nhóm, để nhìn lướt là biết loại việc (kiểu thông báo Facebook). */
const KIEU_NHOM: Record<NhomThongBao, { Icon: LucideIcon; nen: string; chu: string }> = {
  lich: { Icon: CalendarClock, nen: "bg-nhan-nhat", chu: "text-nhan-dam" },
  hoa_don: { Icon: Receipt, nen: "bg-canh-bao-nen", chu: "text-canh-bao" },
  the: { Icon: CreditCard, nen: "bg-nhan-nhat", chu: "text-nhan" },
  khac: { Icon: ClipboardList, nen: "bg-giay-tram", chu: "text-muc-2" },
};

/** Tách nhãn "1204 thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)" thành: số (in đậm), phần chính, phần phụ (trong ngoặc hoặc sau dấu ":"/", tổng"). */
function tachNhan(nhan: string): { so: string; chinh: string; phu: string } {
  const m = /^(\d[\d.,]*)\s+(.*)$/.exec(nhan);
  const so = m ? m[1] : "";
  let chinh = m ? m[2] : nhan, phu = "";
  const ngoac = /^(.*?)\s*\((.*)\)\s*$/.exec(chinh);
  if (ngoac) { chinh = ngoac[1]; phu = ngoac[2]; }
  else {
    const i = chinh.search(/, tổng |: /);
    if (i > 0) { phu = chinh.slice(i + 2); chinh = chinh.slice(0, i); }
  }
  return { so, chinh, phu: phu ? phu.charAt(0).toUpperCase() + phu.slice(1) : "" };
}

/** Số tiền ("1.331.642.500 đ") không bị ngắt dòng giữa số và chữ "đ". */
function giuTien(chu: string) {
  return chu.split(/(\d[\d.,]*\s?(?:đ|₫))/).map((p, i) => (i % 2 ? <span key={i} className="whitespace-nowrap font-semibold text-muc">{p.replace(" ", "\u00a0")}</span> : p));
}

/* Trang có 2 chuông (đầu trang máy tính + đầu trang điện thoại, một cái bị ẩn), mỗi chuông hỏi lúc mở trang và lúc nối realtime
 * → 3–4 lần gọi /api/canh-bao (~1 s mỗi lần, cả chục truy vấn đếm) cho MỘT lần mở trang. Dùng chung một lượt hỏi:
 * đang hỏi thì đợi chung; vừa hỏi xong < 3 s thì dùng lại (trừ khi có tín hiệu dữ liệu đổi / người dùng mở chuông → ep = hỏi mới). */
let dangHoi: Promise<KetQua | null> | null = null, hoiLuc = 0, kqCuoi: KetQua | null = null;
function hoiChung(ep: boolean): Promise<KetQua | null> {
  if (dangHoi) return dangHoi;
  if (!ep && kqCuoi && Date.now() - hoiLuc < 3000) return Promise.resolve(kqCuoi);
  hoiLuc = Date.now();
  dangHoi = fetch("/api/canh-bao", { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<KetQua>) : null))
    .then((j) => { if (j) kqCuoi = j; return j; }).catch(() => null /* mất mạng: giữ số cũ */).finally(() => { dangHoi = null; });
  return dangHoi;
}

/** Chuông thông báo: số việc đang chờ (lịch chưa xác nhận, phiếu cấp, thẻ sắp hết, nợ, kho thấp). Huy hiệu chỉ đếm việc CHƯA ĐỌC;
 * bấm vào một việc = đã đọc, có nút "Đọc hết" và nút xoá từng việc (việc hiện lại nếu nội dung/số lượng đổi).
 * Cập nhật TỨC THỜI: DB bắn tín hiệu rỗng vào kênh Realtime 'canh-bao' khi dữ liệu liên quan đổi → chuông gọi lại /api/canh-bao (có kiểm quyền).
 * Phòng hờ mất kết nối: tự hỏi lại 30 giây/lần khi chưa nối được Realtime (5 phút/lần khi đã nối), khi quay lại tab, khi có mạng lại và khi mở chuông.
 * Lọc theo 4 nhóm như SalonHero (Lịch hẹn / Hoá đơn / Thẻ dịch vụ / Khác, xem lib/nhom-thong-bao). Nút "Tắt tiếng" lưu theo người dùng (nhan_vien.tat_tieng_thong_bao):
 * tắt rung khi có việc mới trong app và tắt âm/rung của thông báo đẩy trên thiết bị của CHÍNH người đó; thông báo vẫn hiện. */
export function ChuongThongBao({ toi = false }: { toi?: boolean }) {
  const [ds, setDs] = useState<Muc[] | null>(null);
  const [mo, setMo] = useState(false);
  const [truc, setTruc] = useState(false);
  const [thongBaoMoi, setThongBaoMoi] = useState("");
  const [tab, setTab] = useState<NhomThongBao | "tat_ca">("tat_ca");
  const [tatTieng, setTatTieng] = useState(false);
  const tatTiengRef = useRef(false);
  const truocDo = useRef<number | null>(null);
  // Hộp nổi báo việc mới ngay trong phần mềm (chị Diệu Thuý 15/11/2026: lịch online phải báo ngay trong app, không bắt bật thông báo đẩy).
  const [noi, setNoi] = useState<Muc | null>(null);
  const daThay = useRef<Set<string> | null>(null);
  const trucRef = useRef(false);
  const goc = useRef<HTMLDivElement>(null);
  const lamMoi = useCallback((ep = false) => {
    void hoiChung(ep).then((j) => {
      if (!j) return;
      const moi = j.ds as Muc[];
      setDs(moi);
      if (typeof j.tatTieng === "boolean") { tatTiengRef.current = j.tatTieng; setTatTieng(j.tatTieng); }
      // Có thêm việc chưa đọc so với lần trước (không tính lần tải đầu): đọc to cho người dùng trình đọc màn hình.
      const chua = moi.filter((m) => m.trang === "chua_doc").length;
      if (truocDo.current !== null && chua > truocDo.current) {
        setThongBaoMoi(`Có ${chua - truocDo.current} việc mới đang chờ`);
        // Rung nhẹ trên điện thoại khi có việc mới (trừ khi người dùng đã bấm Tắt tiếng).
        if (!tatTiengRef.current && typeof navigator !== "undefined" && "vibrate" in navigator) try { navigator.vibrate(120); } catch { /* trình duyệt chặn */ }
      }
      truocDo.current = chua;
      // Việc chưa đọc MỚI xuất hiện (khoá = mã + nhãn, nhãn đổi khi có lịch mới) → hiện hộp nổi + "ting". Lần tải đầu chỉ ghi nhớ.
      // Đầu trang máy tính và điện thoại cùng gắn chuông: chỉ bản đang hiển thị mới hiện hộp và kêu.
      const khoa = new Set(moi.filter((m) => m.trang === "chua_doc").map((m) => `${m.ma}|${m.nhan}`));
      if (daThay.current) {
        const moiXuatHien = moi.filter((m) => m.trang === "chua_doc" && !daThay.current!.has(`${m.ma}|${m.nhan}`));
        const hien = goc.current && goc.current.getClientRects().length > 0;
        if (moiXuatHien.length && hien) {
          setNoi(moiXuatHien.find((m) => m.ma === "lichonl") ?? moiXuatHien.find((m) => m.nhom === "lich") ?? moiXuatHien[0]);
          if (!tatTiengRef.current) keuTing();
        }
      }
      daThay.current = khoa;
    });
  }, []);
  useEffect(() => {
    const dau = setTimeout(() => lamMoi(), 0);
    // Gộp nhiều tín hiệu dồn dập (vd một đơn bán ghi nhiều bảng, hay đồng bộ đêm ghi hàng trăm lô) thành một lần hỏi lại:
    // chờ yên 300 ms, và tối đa 1 lần mỗi 5 giây — trước đây mỗi lô ghi làm MỌI máy đang mở hỏi lại cả chục truy vấn đếm.
    let tre: ReturnType<typeof setTimeout> | undefined, lanCuoi = 0;
    const lamMoiTre = () => {
      clearTimeout(tre);
      tre = setTimeout(() => { lanCuoi = Date.now(); lamMoi(true); }, Math.max(300, lanCuoi + 5000 - Date.now()));
    };
    const sb = createClient();
    const kenh = sb.channel("canh-bao").on("broadcast", { event: "doi" }, lamMoiTre).subscribe((tt) => {
      const noi = tt === "SUBSCRIBED";
      trucRef.current = noi;
      setTruc(noi);
      if (noi) lamMoi(); // vừa nối (hoặc nối lại): lấy bù những thay đổi đã lỡ
    });
    // Chuông hỏi lại mỗi 120 giây (khi chưa nối realtime; nối rồi thì ~5 phút/lần); tab ẩn thì DỪNG hẳn bộ đếm, hiện lại mới chạy tiếp (tiết kiệm egress Supabase Free).
    let t: ReturnType<typeof setInterval> | undefined;
    const tick = () => { if (document.visibilityState === "visible" && (!trucRef.current || Date.now() % 300000 < 120000)) lamMoi(); };
    const chay = () => { clearInterval(t); t = undefined; if (document.visibilityState === "visible") t = setInterval(tick, 120000); };
    const hoiLai = () => { chay(); if (document.visibilityState === "visible") lamMoi(); };
    chay();
    document.addEventListener("visibilitychange", hoiLai); window.addEventListener("online", hoiLai);
    return () => { clearTimeout(dau); clearTimeout(tre); clearInterval(t); document.removeEventListener("visibilitychange", hoiLai); window.removeEventListener("online", hoiLai); void sb.removeChannel(kenh); };
  }, [lamMoi]);
  useEffect(() => {
    if (!noi) return;
    const t = setTimeout(() => setNoi(null), 15000);
    return () => clearTimeout(t);
  }, [noi]);
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("mousedown", ngoai); document.addEventListener("keydown", phim);
    return () => { document.removeEventListener("mousedown", ngoai); document.removeEventListener("keydown", phim); };
  }, [mo]);
  // Gửi thao tác lên máy chủ; cập nhật ngay trên màn hình (lạc quan) rồi lấy lại danh sách thật từ máy chủ.
  const thaoTac = useCallback((hanhDong: "doc" | "xoa" | "doc_het", ma?: string) => {
    setDs((cu) => (cu ? cu.flatMap((m) => (hanhDong === "doc_het" ? [{ ...m, trang: "da_doc" as const }] : m.ma !== ma ? [m] : hanhDong === "xoa" ? [] : [{ ...m, trang: "da_doc" as const }])) : cu));
    fetch("/api/canh-bao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong, ma }) })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.ds) setDs(j.ds as Muc[]); }).catch(() => lamMoi());
  }, [lamMoi]);
  const doiTatTieng = useCallback(() => {
    const bat = !tatTiengRef.current;
    tatTiengRef.current = bat; setTatTieng(bat);
    fetch("/api/canh-bao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hanhDong: "tat_tieng", bat }) })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (typeof j?.tatTieng !== "boolean") { tatTiengRef.current = !bat; setTatTieng(!bat); } })
      .catch(() => { tatTiengRef.current = !bat; setTatTieng(!bat); });
  }, []);
  const n = (ds ?? []).filter((m) => m.trang === "chua_doc").length;
  const hienThi = (ds ?? []).filter((m) => tab === "tat_ca" || m.nhom === tab);
  const chuaDocNhom = (g: NhomThongBao) => (ds ?? []).filter((m) => m.nhom === g && m.trang === "chua_doc").length;
  return (
    <div ref={goc} className="relative">
      <span role="status" aria-live="polite" className="sr-only">{thongBaoMoi}</span>
      <button type="button" onClick={() => { setMo((x) => !x); lamMoi(true); }} aria-haspopup="menu" aria-expanded={mo} aria-label={n ? `Thông báo, ${n} việc đang chờ` : "Thông báo"} title="Việc đang chờ xử lý"
        className={`nut-nguoi relative flex h-10 w-10 items-center justify-center rounded-nho ${toi ? "text-menu-chu" : "text-muc-2"}`}>
        <Bell strokeWidth={1.7} className="h-[21px] w-[21px]" />
        {n > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-loi px-1 text-[11px] font-semibold leading-none text-white" style={{ borderRadius: 9, boxShadow: `0 0 0 2px var(${toi ? "--menu" : "--giay-sang"})` }}>{n}</span>}
      </button>
      {noi && !mo && (
        <div role="alert" className="vao fixed right-4 top-[68px] z-[60] w-[340px] max-sm:inset-x-3 max-sm:w-auto">
          <div className="the-noi flex items-start gap-3 border-l-[3px] border-l-nhan-dam p-3.5">
            <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-nho ${(KIEU_NHOM[noi.nhom] ?? KIEU_NHOM.khac).nen} ${(KIEU_NHOM[noi.nhom] ?? KIEU_NHOM.khac).chu}`}><Bell strokeWidth={1.8} className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1 text-[13.5px] leading-snug">
              <span className="block font-semibold text-muc">{noi.ma === "lichonl" ? "Có lịch khách đặt online mới" : noi.ma === "lich" ? "Có lịch hẹn mới chờ xác nhận" : "Có việc mới đang chờ"}</span>
              <span className="mt-0.5 block text-muc-2">{noi.nhan}</span>
              <Link href={noi.href} onClick={() => { setNoi(null); thaoTac("doc", noi.ma); }} className="mt-1.5 inline-block font-medium text-nhan-dam hover:underline">Xem và xác nhận</Link>
            </span>
            <button type="button" onClick={() => setNoi(null)} aria-label="Đóng thông báo" className="text-muc-3 hover:text-muc"><X strokeWidth={2} className="h-4 w-4" /></button>
          </div>
        </div>
      )}
      {mo && (
        // Lớp ngoài lo vị trí (máy tính: thả dưới chuông; điện thoại: cố định sát hai mép màn hình để không bị cắt bên trái), lớp trong là thẻ nổi.
        <div className="absolute right-0 top-full z-50 mt-2.5 w-[380px] max-sm:fixed max-sm:inset-x-3 max-sm:top-[60px] max-sm:mt-0 max-sm:w-auto">
        <div role="menu" aria-label="Thông báo" className="the-noi the-noi-thap vao overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
            <span className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-muc">Việc đang chờ{n > 0 && <span className="bg-loi-nen px-2 text-[11.5px] font-semibold leading-[20px] text-loi" style={{ borderRadius: 10 }}>{n} mới</span>}</span>
            <div className="flex shrink-0 items-center gap-3">
              {n > 0 && <button type="button" onClick={() => thaoTac("doc_het")} className="flex items-center gap-1 text-[13px] font-medium text-nhan-dam hover:underline"><Check strokeWidth={2} className="h-3.5 w-3.5" aria-hidden />Đọc hết</button>}
              <button type="button" onClick={doiTatTieng} aria-pressed={tatTieng} title={tatTieng ? "Đang tắt tiếng: bấm để bật lại âm/rung" : "Tắt âm và rung thông báo trên thiết bị của bạn"}
                className={`flex items-center gap-1 text-[13px] font-medium hover:underline ${tatTieng ? "text-loi" : "text-muc-2"}`}>
                {tatTieng ? <BellOff strokeWidth={2} className="h-3.5 w-3.5" aria-hidden /> : <Volume2 strokeWidth={2} className="h-3.5 w-3.5" aria-hidden />}
                {tatTieng ? "Bật tiếng" : "Tắt tiếng"}
              </button>
            </div>
          </div>
          <div role="tablist" aria-label="Loại thông báo" className="flex gap-1 overflow-x-auto border-b border-vien px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([{ ma: "tat_ca", nhan: "Tất cả" }, ...NHOM_THONG_BAO] as { ma: NhomThongBao | "tat_ca"; nhan: string }[]).map((g) => {
              const so = g.ma === "tat_ca" ? n : chuaDocNhom(g.ma);
              const chon = tab === g.ma;
              return (
                <button key={g.ma} type="button" role="tab" aria-selected={chon} onClick={() => setTab(g.ma)}
                  className={`-mb-px flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-1 py-2 text-[13px] ${chon ? "border-nhan-dam font-semibold text-muc" : "border-transparent text-muc-3 hover:text-muc"}`}>
                  {g.nhan}{so > 0 && <span className="min-w-[16px] bg-loi px-1 text-center text-[10px] font-semibold leading-[16px] text-white" style={{ borderRadius: 8 }}>{so}</span>}
                </button>
              );
            })}
          </div>
          {ds === null ? <p className="px-5 py-6 text-[14px] text-muc-3">Đang tải…</p> : hienThi.length === 0 ? <p className="px-5 py-6 text-[14px] text-muc-3">{tab === "tat_ca" ? "Không có việc nào đang chờ." : "Không có việc nào trong mục này."}</p> : (
            <ul className="max-h-[60dvh] divide-y divide-vien overflow-y-auto">
              {hienThi.map((m) => {
                const chua = m.trang === "chua_doc";
                const { Icon, nen, chu } = KIEU_NHOM[m.nhom] ?? KIEU_NHOM.khac;
                const { so, chinh, phu } = tachNhan(m.nhan);
                return (
                <li key={m.ma} className={`group flex items-stretch ${chua ? "bg-nhan-nhat/30" : ""} hover:bg-giay-tram`}>
                  <Link href={m.href} role="menuitem" onClick={() => { setMo(false); if (chua) thaoTac("doc", m.ma); }} className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-4 pr-1">
                    <span aria-hidden className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-nho ${nen} ${chu}`}><Icon strokeWidth={1.8} className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className={`block text-[14px] ${chua ? "text-muc" : "text-muc-2"}`}>
                        {so && <span className="mr-1 font-semibold tabular-nums text-muc">{so}</span>}
                        <span className={chua ? "font-medium" : ""}>{giuTien(chinh)}</span>
                      </span>
                      {phu && <span className="mt-0.5 block text-[12.5px] text-muc-3">{giuTien(phu)}</span>}
                      {chua ? <span className="sr-only"> (chưa đọc)</span> : null}
                    </span>
                    <span aria-hidden className={`mt-2 inline-block h-2 w-2 shrink-0 ${chua ? "bg-loi" : "bg-transparent"}`} style={{ borderRadius: 9999 }} />
                  </Link>
                  <button type="button" onClick={() => thaoTac("xoa", m.ma)} aria-label={`Xoá thông báo: ${m.nhan}`} title="Xoá thông báo" className="flex w-9 shrink-0 items-center justify-center pr-1 text-muc-3 opacity-60 hover:text-loi hover:opacity-100 group-hover:opacity-100"><X strokeWidth={1.8} className="h-4 w-4" aria-hidden /></button>
                </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center gap-2 border-t border-vien px-5 py-2.5 text-[12px] text-muc-3">
            <span aria-hidden className={`inline-block h-2 w-2 ${truc ? "bg-nhan" : "bg-muc-3"}`} style={{ borderRadius: 9999 }} />
            {truc ? "Cập nhật trực tiếp" : "Đang nối lại, tạm cập nhật mỗi 30 giây"}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

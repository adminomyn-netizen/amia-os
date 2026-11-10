"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlarmClock, Volume2, VolumeX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canKeu, donDaBao, mocQuaGio, nhanPhut, phutQuaGio, type CaDangLam, type DaBao } from "@/lib/qua-gio";

const KHOA_DA_BAO = "amia-qua-gio-da-bao";
const KHOA_TAT_TIENG = "amia-qua-gio-tat-tieng";
const NHIP_KIEM_MS = 30_000;
const NHIP_HOI_MS = 3 * 60_000;

// localStorage có thể bị chặn (cửa sổ ẩn danh, chặn dữ liệu trang) → bọc try/catch, hỏng thì coi như chưa báo.
function docDaBao(): Record<string, DaBao> {
  try { const j = JSON.parse(localStorage.getItem(KHOA_DA_BAO) ?? "{}"); return j && typeof j === "object" ? j : {}; } catch { return {}; }
}
function ghiDaBao(v: Record<string, DaBao>) { try { localStorage.setItem(KHOA_DA_BAO, JSON.stringify(v)); } catch { /* bỏ qua */ } }
function docTatTieng() { try { return localStorage.getItem(KHOA_TAT_TIENG) === "1"; } catch { return false; } }

const gio = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });

/** Chuông QUÁ GIỜ DỊCH VỤ (gắn một lần ở khung app): ca "Đang phục vụ" làm lâu hơn thời lượng dịch vụ mà chưa bấm Hoàn thành
 *  → nổi thẻ cảnh báo góc trên + kêu "ting ting ting" (Web Audio, không cần tệp âm thanh), nhắc lại mỗi 5 phút tới khi bấm "Đã biết" hoặc ca kết thúc.
 *  Danh sách ca lấy từ /api/qua-gio (máy chủ lọc vai trò + chi nhánh); trình duyệt tự đếm giờ mỗi 30 giây, chỉ hỏi lại máy chủ khi lịch hẹn đổi
 *  (tín hiệu realtime 'canh-bao' có sẵn), khi quay lại tab và 3 phút/lần. Đã báo / Đã biết nhớ trong trình duyệt nên tải lại trang không kêu lặp. */
export function CanhBaoQuaGio() {
  const [ds, setDs] = useState<CaDangLam[]>([]);
  const [bayGio, setBayGio] = useState(() => Date.now());
  const [daBao, setDaBao] = useState<Record<string, DaBao>>({});
  const [tatTieng, setTatTieng] = useState(false);
  const amThanh = useRef<AudioContext | null>(null);
  const [lechGio, setLechGio] = useState(0); // đồng hồ máy khách lệch so với máy chủ

  const hoi = useCallback(() => {
    fetch("/api/qua-gio", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j: { ds: CaDangLam[]; bayGio: number } | null) => {
      if (!j) return;
      setLechGio(typeof j.bayGio === "number" ? j.bayGio - Date.now() : 0);
      setDs(j.ds);
      const sach = donDaBao(docDaBao(), j.ds.map((c) => c.id));
      ghiDaBao(sach); setDaBao(sach);
    }).catch(() => { /* mất mạng: giữ danh sách cũ */ });
  }, []);

  // Mở khoá âm thanh ở lần chạm/bấm phím đầu tiên (trình duyệt chặn phát tiếng khi người dùng chưa thao tác).
  useEffect(() => {
    const moKhoa = () => {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const moi = !amThanh.current;
        if (!amThanh.current) amThanh.current = new AC();
        // Vừa mở khoá được: đếm lại ngay để kêu bù ca đang quá giờ.
        if (amThanh.current.state !== "running") void amThanh.current.resume().then(() => setBayGio(Date.now()));
        else if (moi) setBayGio(Date.now());
      } catch { /* không có âm thanh */ }
    };
    window.addEventListener("pointerdown", moKhoa); window.addEventListener("keydown", moKhoa);
    return () => { window.removeEventListener("pointerdown", moKhoa); window.removeEventListener("keydown", moKhoa); };
  }, []);

  useEffect(() => {
    const dau = setTimeout(() => { setTatTieng(docTatTieng()); setDaBao(docDaBao()); hoi(); }, 0);
    let tre: ReturnType<typeof setTimeout> | undefined, lanCuoi = 0;
    const hoiTre = () => { clearTimeout(tre); tre = setTimeout(() => { lanCuoi = Date.now(); hoi(); }, Math.max(800, lanCuoi + 5000 - Date.now())); };
    const sb = createClient();
    const kenh = sb.channel("canh-bao").on("broadcast", { event: "doi" }, hoiTre).subscribe();
    const dem = setInterval(() => setBayGio(Date.now()), NHIP_KIEM_MS);
    const hoiDinhKy = setInterval(() => { if (document.visibilityState === "visible") hoi(); }, NHIP_HOI_MS);
    const hien = () => { if (document.visibilityState === "visible") { setBayGio(Date.now()); hoi(); } };
    // Tab khác bấm "Đã biết" / tắt tiếng → tab này theo luôn.
    const dongBo = (e: StorageEvent) => { if (e.key === KHOA_DA_BAO) setDaBao(docDaBao()); if (e.key === KHOA_TAT_TIENG) setTatTieng(docTatTieng()); };
    document.addEventListener("visibilitychange", hien); window.addEventListener("online", hien); window.addEventListener("storage", dongBo);
    return () => {
      clearTimeout(dau); clearTimeout(tre); clearInterval(dem); clearInterval(hoiDinhKy);
      document.removeEventListener("visibilitychange", hien); window.removeEventListener("online", hien); window.removeEventListener("storage", dongBo);
      void sb.removeChannel(kenh);
    };
  }, [hoi]);

  /** Kêu; trả false nếu trình duyệt chưa cho phát tiếng (chưa ai chạm vào trang) để lần sau kêu bù. */
  const keu = useCallback((): boolean => {
    const ac = amThanh.current;
    if (!ac || ac.state !== "running") return false;
    try {
      // "ting ting ting": ba tiếng chuông ngắn, tắt dần.
      [0, 0.28, 0.56].forEach((tre, i) => {
        const t = ac.currentTime + tre, o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(i === 2 ? 1568 : 1319, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.27);
      });
    } catch { return false; }
    if ("vibrate" in navigator) try { navigator.vibrate([120, 80, 120]); } catch { /* bỏ qua */ }
    return true;
  }, []);

  // Mỗi nhịp: ca nào vừa quá giờ (hoặc tới chu kỳ nhắc lại) thì kêu MỘT lần cho cả nhóm, ghi lại giờ kêu (đọc lại kho để các tab không kêu chồng).
  useEffect(() => {
    if (!ds.length) return;
    const t = bayGio + lechGio;
    const luu = docDaBao();
    const can = ds.filter((c) => canKeu(c, luu[c.id], t));
    if (!can.length) return;
    // Âm thanh còn bị khoá thì chưa ghi "đã kêu": thẻ vẫn nổi, người dùng chạm vào trang là nhịp sau kêu ngay.
    if (!tatTieng && !keu()) return;
    for (const c of can) luu[c.id] = { ...luu[c.id], keu: t };
    ghiDaBao(luu);
    const id = setTimeout(() => setDaBao({ ...luu }), 0);
    return () => clearTimeout(id);
  }, [ds, bayGio, lechGio, tatTieng, keu]);

  const daBiet = (id: string) => {
    const luu = { ...docDaBao(), [id]: { ...docDaBao()[id], biet: true } };
    ghiDaBao(luu); setDaBao(luu);
  };
  const doiTieng = () => {
    const bat = !tatTieng;
    setTatTieng(bat);
    try { localStorage.setItem(KHOA_TAT_TIENG, bat ? "1" : "0"); } catch { /* bỏ qua */ }
  };

  const t = bayGio + lechGio;
  const qua = ds.filter((c) => t >= mocQuaGio(c) && !daBao[c.id]?.biet).sort((a, b) => mocQuaGio(a) - mocQuaGio(b));
  if (!qua.length) return null;
  const hien = qua.slice(0, 3);
  return (
    <section aria-label="Cảnh báo quá giờ dịch vụ" className="khong-in fixed inset-x-3 top-[64px] z-[45] sm:left-auto sm:right-6 sm:w-[380px]">
      <div role="alert" className="the-noi the-noi-thap vao overflow-hidden border-l-4 border-l-loi">
        <div className="flex items-center justify-between gap-2 bg-loi-nen px-4 py-2.5">
          <span className="flex items-center gap-2 text-[14px] font-semibold text-loi">
            <AlarmClock strokeWidth={2} className="h-[18px] w-[18px]" aria-hidden />
            {qua.length === 1 ? "Có 1 ca quá giờ dịch vụ" : `Có ${qua.length} ca quá giờ dịch vụ`}
          </span>
          <button type="button" onClick={doiTieng} aria-pressed={tatTieng} title={tatTieng ? "Đang tắt tiếng trên máy này, bấm để bật lại" : "Tắt tiếng chuông quá giờ trên máy này"}
            className="flex h-8 items-center gap-1 rounded-nho px-2 text-[12.5px] font-medium text-muc-2 hover:bg-giay-tram">
            {tatTieng ? <VolumeX strokeWidth={2} className="h-4 w-4" aria-hidden /> : <Volume2 strokeWidth={2} className="h-4 w-4" aria-hidden />}
            {tatTieng ? "Bật tiếng" : "Tắt tiếng"}
          </button>
        </div>
        <ul className="max-h-[50vh] divide-y divide-vien overflow-y-auto">
          {hien.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <p className="text-[14px] font-medium leading-snug text-muc">{c.khach}<span className="font-normal text-muc-2"> · {c.dichVu}</span></p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muc-2">Chuyên viên trị liệu: {c.nguoiLam}{c.phong ? ` · ${c.phong}` : ""}</p>
              <p className="mt-1 text-[13px] leading-snug">
                <span className="font-semibold text-loi">Quá {nhanPhut(Math.max(1, phutQuaGio(c, t)))}</span>
                <span className="text-muc-3"> · chuẩn {nhanPhut(c.chuanPhut)}, bắt đầu {gio(c.batDau)}{c.uocTinh ? " (theo giờ hẹn)" : ""}</span>
              </p>
              <div className="mt-2 flex items-center gap-4">
                <button type="button" onClick={() => daBiet(c.id)} className="h-9 rounded-nho bg-loi px-3 text-[13px] font-medium text-white hover:opacity-90">Đã biết</button>
                <Link href="/lich-hen" className="text-[13px] font-medium text-nhan-dam hover:underline">Mở lịch hẹn</Link>
              </div>
            </li>
          ))}
        </ul>
        {qua.length > hien.length && <p className="border-t border-vien px-4 py-2 text-[12.5px] text-muc-3">Còn {qua.length - hien.length} ca quá giờ khác, xem ở Lịch hẹn.</p>}
      </div>
    </section>
  );
}

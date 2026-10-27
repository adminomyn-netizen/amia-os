"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Muc = { ma: string; nhan: string; href: string; trang: "chua_doc" | "da_doc" };

/** Chuông thông báo: số việc đang chờ (lịch chưa xác nhận, phiếu cấp, thẻ sắp hết, nợ, kho thấp). Huy hiệu chỉ đếm việc CHƯA ĐỌC;
 * bấm vào một việc = đã đọc, có nút "Đọc hết" và nút xoá từng việc (việc hiện lại nếu nội dung/số lượng đổi).
 * Cập nhật TỨC THỜI: DB bắn tín hiệu rỗng vào kênh Realtime 'canh-bao' khi dữ liệu liên quan đổi → chuông gọi lại /api/canh-bao (có kiểm quyền).
 * Phòng hờ mất kết nối: tự hỏi lại 30 giây/lần khi chưa nối được Realtime (5 phút/lần khi đã nối), khi quay lại tab, khi có mạng lại và khi mở chuông. */
export function ChuongThongBao({ toi = false }: { toi?: boolean }) {
  const [ds, setDs] = useState<Muc[] | null>(null);
  const [mo, setMo] = useState(false);
  const [truc, setTruc] = useState(false);
  const [thongBaoMoi, setThongBaoMoi] = useState("");
  const truocDo = useRef<number | null>(null);
  const trucRef = useRef(false);
  const goc = useRef<HTMLDivElement>(null);
  const lamMoi = useCallback(() => {
    fetch("/api/canh-bao", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!j) return;
      const moi = j.ds as Muc[];
      setDs(moi);
      // Có thêm việc chưa đọc so với lần trước (không tính lần tải đầu): đọc to cho người dùng trình đọc màn hình.
      const chua = moi.filter((m) => m.trang === "chua_doc").length;
      if (truocDo.current !== null && chua > truocDo.current) setThongBaoMoi(`Có ${chua - truocDo.current} việc mới đang chờ`);
      truocDo.current = chua;
    }).catch(() => { /* mất mạng: giữ số cũ */ });
  }, []);
  useEffect(() => {
    const dau = setTimeout(lamMoi, 0);
    // Gộp nhiều tín hiệu dồn dập (vd một đơn bán ghi nhiều bảng) thành một lần hỏi lại.
    let tre: ReturnType<typeof setTimeout> | undefined;
    const lamMoiTre = () => { clearTimeout(tre); tre = setTimeout(lamMoi, 300); };
    const sb = createClient();
    const kenh = sb.channel("canh-bao").on("broadcast", { event: "doi" }, lamMoiTre).subscribe((tt) => {
      const noi = tt === "SUBSCRIBED";
      trucRef.current = noi;
      setTruc(noi);
      if (noi) lamMoi(); // vừa nối (hoặc nối lại): lấy bù những thay đổi đã lỡ
    });
    const hoiLai = () => { if (document.visibilityState === "visible") lamMoi(); };
    const t = setInterval(() => { if (document.visibilityState === "visible" && (!trucRef.current || Date.now() % 300000 < 30000)) lamMoi(); }, 30000);
    document.addEventListener("visibilitychange", hoiLai); window.addEventListener("online", hoiLai);
    return () => { clearTimeout(dau); clearTimeout(tre); clearInterval(t); document.removeEventListener("visibilitychange", hoiLai); window.removeEventListener("online", hoiLai); void sb.removeChannel(kenh); };
  }, [lamMoi]);
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
  const n = (ds ?? []).filter((m) => m.trang === "chua_doc").length;
  const tong = ds?.length ?? 0;
  return (
    <div ref={goc} className="relative">
      <span role="status" aria-live="polite" className="sr-only">{thongBaoMoi}</span>
      <button type="button" onClick={() => { setMo((x) => !x); lamMoi(); }} aria-haspopup="menu" aria-expanded={mo} aria-label={n ? `Thông báo, ${n} việc đang chờ` : "Thông báo"} title="Việc đang chờ xử lý"
        className={`nut-nguoi relative flex h-10 w-10 items-center justify-center rounded-nho ${toi ? "text-menu-chu" : "text-muc-2"}`}>
        <Bell strokeWidth={1.7} className="h-[21px] w-[21px]" />
        {n > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-loi px-1 text-[11px] font-semibold leading-none text-white" style={{ borderRadius: 9, boxShadow: `0 0 0 2px var(${toi ? "--menu" : "--giay-sang"})` }}>{n}</span>}
      </button>
      {mo && (
        <div role="menu" aria-label="Thông báo" style={{ position: "absolute" }} className="the-noi the-noi-thap vao right-0 top-full z-50 mt-2.5 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-vien px-5 pb-3 pt-5">
            <span className="text-[15px] font-semibold text-muc">Việc đang chờ{n ? ` (${n} chưa đọc)` : ""}</span>
            {n > 0 && <button type="button" onClick={() => thaoTac("doc_het")} className="flex items-center gap-1 text-[13px] font-medium text-nhan-dam hover:underline"><Check strokeWidth={2} className="h-3.5 w-3.5" aria-hidden />Đọc hết</button>}
          </div>
          {ds === null ? <p className="px-5 py-6 text-[14px] text-muc-3">Đang tải…</p> : tong === 0 ? <p className="px-5 py-6 text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">
              {ds.map((m) => (
                <li key={m.ma} className="flex items-stretch hover:bg-giay-tram">
                  <Link href={m.href} role="menuitem" onClick={() => { setMo(false); if (m.trang === "chua_doc") thaoTac("doc", m.ma); }} className={`flex min-w-0 flex-1 items-center gap-3 py-3 pl-5 pr-2 text-[14px] ${m.trang === "chua_doc" ? "font-medium text-muc" : "text-muc-3"}`}>
                    <span aria-hidden className={`inline-block h-2 w-2 shrink-0 ${m.trang === "chua_doc" ? "bg-loi" : "bg-transparent"}`} style={{ borderRadius: 9999 }} />
                    <span className="min-w-0 flex-1">{m.nhan}{m.trang === "chua_doc" ? <span className="sr-only"> (chưa đọc)</span> : null}</span>
                  </Link>
                  <button type="button" onClick={() => thaoTac("xoa", m.ma)} aria-label={`Xoá thông báo: ${m.nhan}`} title="Xoá thông báo" className="flex w-10 shrink-0 items-center justify-center pr-2 text-muc-3 hover:text-loi"><X strokeWidth={1.8} className="h-4 w-4" aria-hidden /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 border-t border-vien px-5 py-2.5 text-[12px] text-muc-3">
            <span aria-hidden className={`inline-block h-2 w-2 ${truc ? "bg-nhan" : "bg-muc-3"}`} style={{ borderRadius: 9999 }} />
            {truc ? "Cập nhật trực tiếp" : "Đang nối lại, tạm cập nhật mỗi 30 giây"}
          </div>
        </div>
      )}
    </div>
  );
}

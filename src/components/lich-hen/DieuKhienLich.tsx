"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";

/** Đổi/bỏ các tham số trên URL rồi tải lại (mọi bộ lọc của Lịch hẹn nằm trên URL nên chia sẻ được, xuất Excel theo đúng lọc). */
function useDoiUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  return (doi: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(doi)) { if (v) u.set(k, v); else u.delete(k); }
    router.push(`/lich-hen?${u}`);
  };
}

/** Mốc chọn nhanh như SalonHero: (từ, đến) tính theo số ngày so với hôm nay. */
const MOC_NHANH = [
  { ma: "hom_nay", nhan: "Hôm nay", tu: 0, den: 0 }, { ma: "ngay_mai", nhan: "Ngày mai", tu: 1, den: 1 }, { ma: "hom_qua", nhan: "Hôm qua", tu: -1, den: -1 },
  { ma: "3_toi", nhan: "3 ngày tới", tu: 0, den: 2 }, { ma: "7_truoc", nhan: "7 ngày trước", tu: -6, den: 0 }, { ma: "7_toi", nhan: "7 ngày tới", tu: 0, den: 6 },
  { ma: "30_truoc", nhan: "30 ngày trước", tu: -29, den: 0 }, { ma: "30_toi", nhan: "30 ngày tới", tu: 0, den: 29 },
];
const congNgayLich = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86400e3).toISOString().slice(0, 10);

/** Khoảng ngày của lưới (mặc định hôm nay → +7 ngày): hai ô chọn ngày, chọn xong tải lại. Nếu ngày đầu vượt ngày cuối thì kéo ngày cuối theo. */
export function ChonKhoang({ tu, den }: { tu: string; den: string }) {
  const doi = useDoiUrl();
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Khoảng ngày xem lịch">
      <NgayChon giaTri={tu} ariaLabel="Từ ngày" tuNam={2018} denNam={2030} className="w-[150px]" onDoi={(v) => v && doi({ tu: v, den: v > den ? v : den })} />
      <span className="text-muc-3" aria-hidden>-</span>
      <NgayChon giaTri={den} ariaLabel="Đến ngày" tuNam={2018} denNam={2030} className="w-[150px]" onDoi={(v) => v && doi({ den: v, tu: v < tu ? v : tu })} />
      <Chon ariaLabel="Chọn nhanh khoảng ngày" giaTri="" trong="Chọn nhanh" luaChon={MOC_NHANH.map((m) => ({ gia_tri: m.ma, nhan: m.nhan }))} nho
        onDoi={(v) => { const m = MOC_NHANH.find((x) => x.ma === v); if (!m) return; const hom = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }); doi({ tu: congNgayLich(hom, m.tu), den: congNgayLich(hom, m.den) }); }} />
    </div>
  );
}

export function LocNhanVien({ giaTri, luaChon }: { giaTri: string; luaChon: LuaChon[] }) {
  const doi = useDoiUrl();
  return <Chon ariaLabel="Lọc theo nhân viên" giaTri={giaTri} luaChon={[{ gia_tri: "", nhan: "Tất cả" }, ...luaChon]} onDoi={(v) => doi({ nv: v })} nho />;
}

export function LocCho({ giaTri, luaChon }: { giaTri: string; luaChon: LuaChon[] }) {
  const doi = useDoiUrl();
  return <Chon ariaLabel="Lọc theo chỗ" giaTri={giaTri} luaChon={[{ gia_tri: "", nhan: "Tất cả" }, ...luaChon]} onDoi={(v) => doi({ cho: v })} nho />;
}

/** Ô "Tìm khách hàng hoặc mã đặt lịch" + lọc trạng thái. Tìm khi bấm Enter hoặc rời ô (không tải lại mỗi phím). */
export function TimVaLoc({ q, tt, luaChonTt }: { q: string; tt: string; luaChonTt: LuaChon[] }) {
  const doi = useDoiUrl();
  const [chu, setChu] = useState(q);
  const tim = () => { if (chu.trim() !== q) doi({ q: chu.trim() }); };
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" aria-hidden />
        <input value={chu} onChange={(e) => setChu(e.target.value)} onBlur={tim} onKeyDown={(e) => e.key === "Enter" && tim()} placeholder="Tìm khách hàng hoặc mã đặt lịch" aria-label="Tìm khách hàng hoặc mã đặt lịch" maxLength={60} className={`${O_NHAP} pl-9`} />
      </div>
      <Chon ariaLabel="Lọc theo trạng thái" giaTri={tt} luaChon={luaChonTt} onDoi={(v) => doi({ tt: v })} />
    </div>
  );
}

/** Thanh ngày xanh có nút thu gọn danh sách lịch của ngày. */
export function KhungNgay({ tieuDe, tong, children }: { tieuDe: string; tong: string; children: React.ReactNode }) {
  const [gon, setGon] = useState(false);
  return (
    <section aria-label={tieuDe}>
      <div className="flex items-center justify-between gap-2 rounded-nho bg-sac-xanh px-3 py-2 text-[13px] font-medium text-white">
        <span className="min-w-0 truncate">{tieuDe}</span>
        <span className="flex shrink-0 items-center gap-2"><span className="tabular-nums">{tong}</span>
          <button type="button" onClick={() => setGon(!gon)} aria-expanded={!gon} aria-label={gon ? "Mở danh sách lịch" : "Thu gọn danh sách lịch"} className="flex h-6 w-6 items-center justify-center rounded-nho hover:bg-white/15">
            {gon ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronUp className="h-4 w-4" aria-hidden />}
          </button>
        </span>
      </div>
      {!gon && <div className="mt-2 space-y-2.5">{children}</div>}
    </section>
  );
}

/** "Xem thêm (n)" trong ô lưới: bấm để mở các lịch còn lại ngay trong ô, bấm lại để thu gọn. */
export function XemThemO({ so, children }: { so: number; children: React.ReactNode }) {
  const [mo, setMo] = useState(false);
  return (
    <>
      {mo && children}
      <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} className="block w-full text-center text-[12px] font-medium text-nhan-dam hover:underline">{mo ? "Thu gọn" : `Xem thêm (${so})`}</button>
    </>
  );
}

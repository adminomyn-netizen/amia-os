"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { CO_TRANG, CO_TRANG_MAC_DINH, LOC_HINH_THUC, LOC_THE, LOC_VAI, TRA_TIEN } from "@/lib/loc-hoa-don";

/** Mốc chọn nhanh như SalonHero: (từ, đến) tính theo số ngày so với hôm nay (cùng bảng với màn Lịch hẹn). */
const MOC_NHANH = [
  { ma: "hom_nay", nhan: "Hôm nay", tu: 0, den: 0 }, { ma: "hom_qua", nhan: "Hôm qua", tu: -1, den: -1 },
  { ma: "7_truoc", nhan: "7 ngày trước", tu: -6, den: 0 }, { ma: "30_truoc", nhan: "30 ngày trước", tu: -29, den: 0 },
  { ma: "thang_nay", nhan: "Tháng này", tu: 0, den: 0 }, { ma: "thang_truoc", nhan: "Tháng trước", tu: 0, den: 0 },
];
/** Ngày đầu / cuối tháng của một ngày (YYYY-MM-DD). */
const dauThang = (d: string) => d.slice(0, 8) + "01";
const cuoiThang = (d: string) => { const [y, m] = d.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };

/** Tham số bộ lọc nâng cao: có cái nào đang bật thì mở sẵn khung "Lọc thêm". */
const THAM_SO_NANG_CAO = ["cn", "lap", "nv", "vai", "tra", "tien_tu", "tien_den", "gc", "kgc", "the", "kt", "vc", "ht", "pp", "tip", "mhd", "cx"];

function useDoiUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  return (doi: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(doi)) { if (v) u.set(k, v); else u.delete(k); }
    u.delete("trang");
    router.push(`/hoa-don?${u}`);
  };
}

/** Ô gõ chữ/số có độ trễ 350ms trước khi tải lại (không tải mỗi phím). */
function OGo({ tham, nhan, ariaLabel, soTien }: { tham: string; nhan: string; ariaLabel: string; soTien?: boolean }) {
  const sp = useSearchParams();
  const doi = useDoiUrl();
  const [chu, setChu] = useState(sp.get(tham) ?? "");
  const lanDau = useRef(true);
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(() => doi({ [tham]: chu.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chu]);
  return (
    <input value={chu} onChange={(e) => setChu(soTien ? e.target.value.replace(/\D/g, "").slice(0, 12) : e.target.value)} placeholder={nhan} aria-label={ariaLabel}
      inputMode={soTien ? "numeric" : undefined} maxLength={soTien ? 12 : 80} className={`${O_NHAP} ${soTien ? "text-right tabular-nums" : ""}`} />
  );
}

export function LocHoaDon({ tu, den, chiNhanh, nhanVien }: { tu: string; den: string; /** Chỉ có khi người xem được xem mọi chi nhánh. */ chiNhanh: LuaChon[] | null; nhanVien: LuaChon[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const doi = useDoiUrl();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const lanDau = useRef(true);
  const coNangCao = THAM_SO_NANG_CAO.some((k) => sp.get(k)) || sp.get("no") === "1";
  const [mo, setMo] = useState(coNangCao);
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(() => doi({ q: q.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const tra = sp.get("no") === "1" ? "no" : sp.get("tra") ?? "";
  const boLoc = sp.toString() !== "" && [...sp.keys()].some((k) => k !== "trang" && k !== "n");
  const chonNhanh = (ma: string) => {
    const hom = homNayHCM();
    if (ma === "thang_nay") return doi({ tu: dauThang(hom), den: hom });
    if (ma === "thang_truoc") { const cuoi = congNgay(dauThang(hom), -1); return doi({ tu: dauThang(cuoi), den: cuoiThang(cuoi) }); }
    const m = MOC_NHANH.find((x) => x.ma === ma);
    if (m) doi({ tu: congNgay(hom, m.tu), den: congNgay(hom, m.den) });
  };
  const dsTra = [{ gia_tri: "", nhan: "Tình trạng trả tiền: tất cả" }, ...TRA_TIEN.map((x) => ({ gia_tri: x.gia_tri, nhan: x.nhan }))];
  return (
    <div className="mb-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative"><Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã hoá đơn, tên hoặc SĐT khách" aria-label="Tìm hoá đơn" className={`${O_NHAP} pl-9`} /></div>
        <NgayChon ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => v && doi({ tu: v, den: v > den ? v : den })} />
        <NgayChon ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => v && doi({ den: v, tu: v < tu ? v : tu })} />
        <Chon ariaLabel="Chọn nhanh khoảng ngày" giaTri="" trong="Chọn nhanh khoảng ngày" luaChon={MOC_NHANH.map((m) => ({ gia_tri: m.ma, nhan: m.nhan }))} onDoi={chonNhanh} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <Chon ariaLabel="Trạng thái" giaTri={sp.get("tt") ?? ""} onDoi={(v) => doi({ tt: v })}
          luaChon={[{ gia_tri: "", nhan: "Mọi trạng thái" }, { gia_tri: "hoan_thanh", nhan: "Hoàn thành" }, { gia_tri: "nhap", nhan: "Đang xử lý" }, { gia_tri: "huy", nhan: "Đã huỷ" }]} />
        <Chon ariaLabel="Tình trạng trả tiền" giaTri={tra} onDoi={(v) => { const u = new URLSearchParams(sp.toString()); u.delete("no"); u.delete("trang"); if (v) u.set("tra", v); else u.delete("tra"); router.push(`/hoa-don?${u}`); }} luaChon={dsTra} />
        <Chon ariaLabel="Hoá đơn VAT" giaTri={sp.get("vat") ?? ""} onDoi={(v) => doi({ vat: v })}
          luaChon={[{ gia_tri: "", nhan: "HĐ VAT: tất cả" }, { gia_tri: "co", nhan: "Đã có hoá đơn VAT" }, { gia_tri: "chua", nhan: "Chưa có hoá đơn VAT" }]} />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} className="inline-flex h-10 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[14px] font-medium text-muc-2 hover:bg-giay-tram">
            Lọc thêm {mo ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}</button>
          {boLoc && <button type="button" onClick={() => router.push("/hoa-don")} className="h-10 rounded-nho px-3 text-[14px] font-medium text-nhan-dam hover:underline">Bỏ lọc</button>}
        </div>
      </div>
      {mo && (
        <div className="grid gap-3 rounded-nho border border-vien p-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Lọc thêm">
          {chiNhanh && <Chon ariaLabel="Chi nhánh" giaTri={sp.get("cn") ?? ""} onDoi={(v) => doi({ cn: v })} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...chiNhanh]} />}
          {/* SalonHero: ô "Mã HD" + tick "Tìm chính xác" (khớp trọn mã AMIA hoặc mã SalonHero, không phải "có chứa"). */}
          <div className="flex items-center gap-2">
            <OGo tham="mhd" nhan="Mã HD" ariaLabel="Mã hoá đơn" />
            <label className="flex shrink-0 items-center gap-1.5 text-[13px] text-muc-2">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--nhan)]" checked={sp.get("cx") === "1"} onChange={(e) => doi({ cx: e.target.checked ? "1" : "" })} />Tìm chính xác</label>
          </div>
          <OGo tham="lap" nhan="Người lập (gõ tên)" ariaLabel="Lọc theo người lập" />
          <Chon ariaLabel="Nhân viên phục vụ" giaTri={sp.get("nv") ?? ""} onDoi={(v) => doi({ nv: v })} luaChon={[{ gia_tri: "", nhan: "Nhân viên: tất cả" }, ...nhanVien]} />
          <Chon ariaLabel="Vai của nhân viên" giaTri={sp.get("vai") ?? ""} onDoi={(v) => doi({ vai: v })} luaChon={[{ gia_tri: "", nhan: "Vai: tất cả" }, ...LOC_VAI.map((x) => ({ gia_tri: x.gia_tri, nhan: x.nhan }))]} />
          <OGo tham="tien_tu" nhan="Tổng tiền từ (đ)" ariaLabel="Tổng tiền hoá đơn từ" soTien />
          <OGo tham="tien_den" nhan="Tổng tiền đến (đ)" ariaLabel="Tổng tiền hoá đơn đến" soTien />
          <OGo tham="gc" nhan="Ghi chú có chữ" ariaLabel="Lọc theo ghi chú" />
          <label className="flex h-10 items-center gap-1.5 text-[13px] text-muc-2">
            <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--nhan)]" checked={sp.get("kgc") === "1"} onChange={(e) => doi({ kgc: e.target.checked ? "1" : "", gc: "" })} />Hoá đơn không ghi chú</label>
          <Chon ariaLabel="Mua hoặc sử dụng thẻ dịch vụ" giaTri={sp.get("the") ?? ""} onDoi={(v) => doi({ the: v })} luaChon={[{ gia_tri: "", nhan: "Mua/sử dụng thẻ: tất cả" }, ...LOC_THE.map((x) => ({ gia_tri: x.gia_tri, nhan: x.nhan }))]} />
          <Chon ariaLabel="Xác nhận với kế toán" giaTri={sp.get("kt") ?? ""} onDoi={(v) => doi({ kt: v })} luaChon={[{ gia_tri: "", nhan: "Xác nhận kế toán: tất cả" }, { gia_tri: "co", nhan: "Đã xác nhận với kế toán" }, { gia_tri: "chua", nhan: "Chưa xác nhận với kế toán" }]} />
          <Chon ariaLabel="Sử dụng voucher" giaTri={sp.get("vc") ?? ""} onDoi={(v) => doi({ vc: v })} luaChon={[{ gia_tri: "", nhan: "Voucher: tất cả" }, { gia_tri: "co", nhan: "Có dùng voucher" }, { gia_tri: "khong", nhan: "Không dùng voucher" }]} />
          <Chon ariaLabel="Phí dịch vụ" giaTri={sp.get("pp") ?? ""} onDoi={(v) => doi({ pp: v })} luaChon={[{ gia_tri: "", nhan: "Phí dịch vụ: tất cả" }, { gia_tri: "co", nhan: "Có tính phí dịch vụ" }, { gia_tri: "khong", nhan: "Không tính phí dịch vụ" }]} />
          <Chon ariaLabel="Tiền tip" giaTri={sp.get("tip") ?? ""} onDoi={(v) => doi({ tip: v })} luaChon={[{ gia_tri: "", nhan: "Tip: tất cả" }, { gia_tri: "co", nhan: "Có tip" }, { gia_tri: "khong", nhan: "Không tip" }]} />
          <Chon ariaLabel="Hình thức trả tiền" giaTri={sp.get("ht") ?? ""} onDoi={(v) => doi({ ht: v })} luaChon={[{ gia_tri: "", nhan: "Hình thức trả tiền: tất cả" }, ...LOC_HINH_THUC.map((x) => ({ gia_tri: x.gia_tri, nhan: x.nhan }))]} />
        </div>
      )}
    </div>
  );
}

/** "Hiển thị 10/25/50/100 kết quả" của SalonHero. Đổi cỡ trang thì về trang 1. */
export function ChonCoTrang({ n }: { n: number }) {
  const doi = useDoiUrl();
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-muc-3">Hiển thị
      <Chon nho ariaLabel="Số hoá đơn mỗi trang" giaTri={String(n)} onDoi={(v) => doi({ n: Number(v) === CO_TRANG_MAC_DINH ? "" : v })} luaChon={CO_TRANG.map((x) => ({ gia_tri: String(x), nhan: String(x) }))} />
      kết quả</label>
  );
}

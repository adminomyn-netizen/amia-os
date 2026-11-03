"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { Gat } from "@/components/ui/Gat";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { KIEU_LAP_NHAC, cacNgayNhac, docCacKhoang, type KieuLapNhac, type QuyTacNhac } from "@/lib/nhac-cham-soc";

export type DichVuNhac = { id: string; ten: string; quyTac: QuyTacNhac | null };
const GIO: LuaChon[] = Array.from({ length: (21 - 7) * 4 + 1 }, (_, i) => { const m = 7 * 60 + i * 15; const g = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; return { gia_tri: g, nhan: g }; });
const DON_VI: Record<string, string> = { DAY: "ngày", WEEK: "tuần", MONTH: "tháng" };
const ddmm = (iso: string) => { const d = new Date(new Date(iso).getTime() + 7 * 3600e3); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`; };

/** Hộp "Tạo nhắc chăm sóc" như SalonHero: chọn dịch vụ thì tự điền quy tắc lặp đã lưu của dịch vụ; xem trước các ngày sẽ nhắc. */
export function HopTaoNhac({ khach, dichVu, nhanVien, phuTrachMacDinh, homNay, action, kieu = "chinh" }: {
  khach?: { id: string; ten: string }; dichVu: DichVuNhac[]; nhanVien: LuaChon[]; phuTrachMacDinh?: string; homNay: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }>; kieu?: "chinh" | "phu";
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const dau = { khachNhap: "", dv: "", ngay: homNay, gio: "09:00", kieuLap: "SINGLE" as KieuLapNhac, moi: "1", soLan: "2", khoang: "", phuTrach: phuTrachMacDinh ?? "", noiDung: "", luuQt: false };
  const [v, setV] = useState(dau);
  const dat = <K extends keyof typeof dau>(k: K, x: (typeof dau)[K]) => setV((o) => ({ ...o, [k]: x }));
  const chonDv = (id: string) => {
    const q = dichVu.find((d) => d.id === id)?.quyTac;
    setV((o) => ({ ...o, dv: id, ...(q ? { kieuLap: q.kieu, moi: String(q.moi), soLan: String(q.so_lan), khoang: q.cac_khoang.join(", ") } : {}) }));
  };
  const deu = v.kieuLap === "DAY" || v.kieuLap === "WEEK" || v.kieuLap === "MONTH";
  const xemTruoc = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.ngay)) return "";
    if (v.kieuLap === "UNEQUAL") { const k = docCacKhoang(v.khoang); if (typeof k === "string") return ""; return cacNgayNhac(v.ngay, v.gio, { kieu: "UNEQUAL", cac_khoang: k }).map(ddmm).join(" · "); }
    const moi = Number(v.moi), soLan = Number(v.soLan);
    if (deu && (!(moi >= 1) || !(soLan >= 2) || soLan > 52)) return "";
    return cacNgayNhac(v.ngay, v.gio, { kieu: v.kieuLap, moi, so_lan: soLan }).map(ddmm).join(" · ");
  })();
  const gui = () => {
    setLoi("");
    const fd = new FormData();
    if (khach) fd.set("khach_id", khach.id); else fd.set("khach", v.khachNhap);
    fd.set("dich_vu_id", v.dv); fd.set("ngay", v.ngay); fd.set("gio", v.gio); fd.set("kieu_lap", v.kieuLap); fd.set("moi", v.moi); fd.set("so_lan", v.soLan);
    fd.set("cac_khoang", v.khoang); fd.set("phu_trach_id", v.phuTrach); fd.set("noi_dung", v.noiDung); fd.set("luu_quy_tac", v.luuQt ? "1" : "0");
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); router.refresh(); } });
  };
  return (
    <>
      <button type="button" className={kieu === "chinh" ? NUT_CHINH : NUT_PHU} onClick={() => { setV(dau); setLoi(""); setMo(true); }}>Tạo nhắc</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={khach ? `Tạo nhắc chăm sóc: ${khach.ten}` : "Tạo nhắc chăm sóc"} moTa="Nhắc hiện ở Lịch nhắc chăm sóc đúng ngày; người phụ trách gọi/nhắn rồi bấm Đã thực hiện." rong="rong">
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          {!khach && (
            <div className="sm:col-span-2"><label htmlFor="n-khach" className={NHAN_O}>Khách (mã hoặc số điện thoại)<span className="text-loi"> *</span></label>
              <input id="n-khach" value={v.khachNhap} onChange={(e) => dat("khachNhap", e.target.value)} className={O_NHAP} autoComplete="off" /></div>
          )}
          <div className="sm:col-span-2"><label htmlFor="n-dv" className={NHAN_O}>Dịch vụ</label>
            <Chon id="n-dv" giaTri={v.dv} onDoi={chonDv} trong="Chọn dịch vụ (không bắt buộc)" luaChon={[{ gia_tri: "", nhan: "Không chọn" }, ...dichVu.map((d) => ({ gia_tri: d.id, nhan: d.quyTac ? `${d.ten} · có quy tắc nhắc` : d.ten }))]} /></div>
          <div><label htmlFor="n-ngay" className={NHAN_O}>Ngày nhắc (lần đầu)<span className="text-loi"> *</span></label><NgayChon id="n-ngay" giaTri={v.ngay} onDoi={(x) => dat("ngay", x)} tuNam={2020} denNam={2035} /></div>
          <div><label htmlFor="n-gio" className={NHAN_O}>Giờ nhắc</label><Chon id="n-gio" giaTri={v.gio} onDoi={(x) => dat("gio", x)} luaChon={GIO} /></div>
          <div className="sm:col-span-2"><label htmlFor="n-lap" className={NHAN_O}>Lặp lại</label>
            <Chon id="n-lap" giaTri={v.kieuLap} onDoi={(x) => dat("kieuLap", x as KieuLapNhac)} luaChon={KIEU_LAP_NHAC.map((k) => ({ gia_tri: k.ma, nhan: k.nhan }))} /></div>
          {deu && <>
            <div><label htmlFor="n-moi" className={NHAN_O}>Mỗi bao nhiêu {DON_VI[v.kieuLap]}</label><input id="n-moi" inputMode="numeric" value={v.moi} onChange={(e) => dat("moi", e.target.value.replace(/\D/g, ""))} className={`${O_NHAP} text-right tabular-nums`} /></div>
            <div><label htmlFor="n-solan" className={NHAN_O}>Tổng số lần nhắc</label><input id="n-solan" inputMode="numeric" value={v.soLan} onChange={(e) => dat("soLan", e.target.value.replace(/\D/g, ""))} className={`${O_NHAP} text-right tabular-nums`} /></div>
          </>}
          {v.kieuLap === "UNEQUAL" && (
            <div className="sm:col-span-2"><label htmlFor="n-khoang" className={NHAN_O}>Các khoảng ngày giữa những lần nhắc</label>
              <input id="n-khoang" value={v.khoang} onChange={(e) => dat("khoang", e.target.value)} placeholder="Vd 7, 14, 30" className={O_NHAP} autoComplete="off" />
              <p className="mt-1.5 text-[12px] text-muc-3">Lần 2 cách lần đầu 7 ngày, lần 3 cách lần 2 14 ngày…</p></div>
          )}
          {v.kieuLap !== "SINGLE" && xemTruoc && <p className="text-[13px] text-muc-2 sm:col-span-2">Sẽ nhắc: <span className="tabular-nums">{xemTruoc}</span></p>}
          <div className="sm:col-span-2"><label htmlFor="n-pt" className={NHAN_O}>Người phụ trách</label>
            <Chon id="n-pt" giaTri={v.phuTrach} onDoi={(x) => dat("phuTrach", x)} luaChon={[{ gia_tri: "", nhan: "Chưa giao" }, ...nhanVien]} /></div>
          <div className="sm:col-span-2"><label htmlFor="n-nd" className={NHAN_O}>Nội dung</label>
            <textarea id="n-nd" value={v.noiDung} onChange={(e) => dat("noiDung", e.target.value)} maxLength={400} placeholder="Vd: hỏi thăm da sau buổi peel, nhắc lịch buổi 2" className={O_NHIEU_DONG} /></div>
          {v.dv && v.kieuLap !== "SINGLE" && <div className="sm:col-span-2"><Gat key={`${mo}`} nhan="Lưu cài đặt này cho dịch vụ (lần sau chọn dịch vụ này tự điền)" giaTriMacDinh={v.luuQt} onDoi={(x) => dat("luuQt", x)} /></div>}
        </div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : "Lưu nhắc"}</button>
        </div>
      </Hop>
    </>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, Send, Sparkles } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { ONhieu } from "@/components/ui/BieuMau";
import { NUT_CHINH, NUT_CHU } from "@/components/ui/dinh-dang";
import { ChonNhieuDichVu } from "@/components/lich-hen/ChonNhieuDichVu";
import { luaChonNhieu, type KetQuaBuoi } from "@/components/the/NutBuoi";
import { chuyenNhieuDichVu } from "@/app/(app)/the/cho-lam/actions";
import { dvTheoGoi, kiemBuoiThe, TOI_DA_DONG_GUI, TOI_DA_SO_LUONG_DONG, type DongGuiCv } from "@/lib/don-nhieu-dich-vu";

export type TheDv = { id: string; /** Gói của thẻ: gói chưa gắn dịch vụ thì chính thẻ thành dòng tick (goi:<id>). */ goiId: string; ten: string; ma: string; han: string | null; buoiCon: number; buoiTong: number | null; /** Dịch vụ của gói; rỗng = gói không gắn dịch vụ (chọn trong cả danh mục). */ dichVu: string[]; lanTruoc: { dv: string; nv: string; bs: string } | null };

const khoa = (theId: string, dvId: string) => `${theId}:${dvId}`;
const han = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

/** "Dịch vụ khách đã mua" của Đơn làm dịch vụ (chị Thuý / chị Lâm 11/11/2026: một đơn làm NHIỀU dịch vụ một lúc).
 *  Mỗi thẻ liệu trình còn buổi liệt kê TỪNG dịch vụ của thẻ để tick. Thẻ của gói chưa gắn dịch vụ (vd EXION, chị Lâm 11/11/2026)
 *  thì chính thẻ là một dòng tick "<tên gói> · 1 buổi" (máy chủ dùng dịch vụ mang tên gói); "Đổi / thêm dịch vụ" mở tìm trong cả danh mục.
 *  Người làm chung cho cả đơn, dòng nào khác người thì đổi riêng. Một nút gửi hết cho chuyên viên trị liệu (chưa trừ buổi; Kết thúc mới trừ).
 *  Chọn quá số buổi còn của thẻ (tính cả lượt đang chờ / đang làm) thì chặn và báo rõ. */
export function ChonDvDaMua({ khach, the, dvMuc, dangMo, nhanVien, bacSi, lichId, coQuyen, onXong }: {
  khach: boolean; the: TheDv[] | null; dvMuc: LuaChon[]; /** Lượt hôm nay đang chờ / đang làm của khách (đọc ở Hoá đơn dịch vụ); soLuong = số buổi lượt đó sẽ trừ. */ dangMo: { theId: string; dvId: string; soLuong?: number }[];
  nhanVien: LuaChon[]; bacSi: LuaChon[]; lichId?: string; coQuyen: boolean; onXong: (kq: KetQuaBuoi) => void;
}) {
  // sl = số buổi trừ của dòng: nhiều người cùng làm một dịch vụ trên một thẻ (quản lý cơ sở 15/11/2026: 3 người làm "chăm sóc da AC" → trừ 3 buổi).
  const [chon, setChon] = useState<Map<string, { theId: string; dvId: string; nv: string; sl: number }>>(new Map());
  const [nvChung, setNvChung] = useState<string[] | null>(null);
  const [bs, setBs] = useState<string | null>(null);
  const [tim, setTim] = useState("");
  const [moDoi, setMoDoi] = useState<Set<string>>(new Set());
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const tenDv = useMemo(() => new Map(dvMuc.map((d) => [d.gia_tri, d.nhan])), [dvMuc]);
  // Dòng "chính thẻ": danh mục đã có dịch vụ trùng tên gói (tạo ở lần gửi trước) thì dùng luôn id đó để nhận ra lượt "đang chờ".
  const idTheoTen = useMemo(() => { const m = new Map<string, string>(); for (const d of dvMuc) { const k = d.nhan.trim().toLowerCase(); if (!m.has(k)) m.set(k, d.gia_tri); } return m; }, [dvMuc]);
  const dongThe = (t: TheDv) => idTheoTen.get(t.ten.trim().toLowerCase()) ?? dvTheoGoi(t.goiId);
  const nhanDong = (t: TheDv, dvId: string) => (dvId === dongThe(t) ? `${t.ten} · 1 buổi` : tenDv.get(dvId) ?? "Dịch vụ");
  const nvLC = useMemo(() => luaChonNhieu(nhanVien, "Chuyên viên trị liệu"), [nhanVien]);
  const ds = the ?? [];
  // Mặc định người làm / bác sĩ theo lần trước khách dùng thẻ (thẻ đầu tiên có ghi), thu ngân đổi được.
  const lanTruoc = ds.find((t) => t.lanTruoc?.nv)?.lanTruoc;
  const nvC = nvChung ?? (lanTruoc?.nv && nhanVien.some((n) => n.gia_tri === lanTruoc.nv) ? [lanTruoc.nv] : []);
  const bsC = bs ?? (lanTruoc?.bs && bacSi.some((n) => n.gia_tri === lanTruoc.bs) ? lanTruoc.bs : "");
  const moCua = (theId: string) => dangMo.filter((x) => x.theId === theId).reduce((s, x) => s + Math.max(1, x.soLuong ?? 1), 0);
  const dong = [...chon.values()];
  const loiBuoi = kiemBuoiThe(dong.map((d) => ({ theId: d.theId, soLuong: d.sl })), new Map(ds.map((t) => [t.id, { ten: `${t.ten}${t.ma ? ` (#${t.ma})` : ""}`, buoiCon: t.buoiCon, dangMo: moCua(t.id) }])));
  const thieuNguoi = dong.some((d) => !d.nv) && nvC.length === 0;
  const tongDong = ds.reduce((s, t) => s + (t.dichVu.length || 1), 0);
  const tim_ = tim.trim().toLowerCase();

  const doi = (theId: string, dvId: string) => setChon((m) => {
    const n = new Map(m), k = khoa(theId, dvId);
    if (n.has(k)) n.delete(k); else n.set(k, { theId, dvId, nv: "", sl: 1 });
    return n;
  });
  const datNv = (k: string, nv: string) => setChon((m) => { const n = new Map(m), d = n.get(k); if (d) n.set(k, { ...d, nv }); return n; });
  const datSl = (k: string, sl: number) => setChon((m) => { const n = new Map(m), d = n.get(k); if (d) n.set(k, { ...d, sl: Math.min(TOI_DA_SO_LUONG_DONG, Math.max(1, sl)) }); return n; });
  /** Buổi còn chọn thêm được cho thẻ: còn − đang chờ − các dòng đã chọn của thẻ. */
  const conChon = (theId: string) => { const t = ds.find((x) => x.id === theId); return t ? t.buoiCon - moCua(theId) - dong.filter((d) => d.theId === theId).reduce((s, d) => s + d.sl, 0) : 0; };
  const gui = () => {
    setLoi("");
    if (!dong.length) return setLoi("Tick ít nhất một dịch vụ khách làm hôm nay.");
    if (loiBuoi.length) return setLoi(loiBuoi.join("\n"));
    if (thieuNguoi) return setLoi("Chọn người làm (chuyên viên trị liệu) chung, hoặc đổi người làm riêng cho từng dịch vụ.");
    const fd = new FormData();
    fd.set("dong", JSON.stringify(dong.map((d): DongGuiCv => ({ theId: d.theId, dvId: d.dvId, ...(d.nv ? { nvIds: [d.nv] } : {}), ...(d.sl > 1 ? { soLuong: d.sl } : {}) }))));
    for (const id of nvC) fd.append("nv_ids", id);
    if (bsC) fd.set("bac_si_id", bsC);
    if (lichId) fd.set("lich_id", lichId);
    for (const t of ds) fd.set(`ten__${t.id}`, `${t.ten}${t.ma ? ` (#${t.ma})` : ""}`);
    bat(async () => {
      const r: KetQuaBuoi = await chuyenNhieuDichVu(fd).catch(() => ({ loi: "Mất kết nối, thử lại." }));
      if (!r.ok) return setLoi(r.loi ?? "Chưa gửi được.");
      setChon(new Map());
      onXong({ ...r, chuyenCho: r.chuyenCho ?? "" });
    });
  };

  const dongDv = (t: TheDv, dvId: string) => {
    const nhan = nhanDong(t, dvId);
    const k = khoa(t.id, dvId), d = chon.get(k), dangCho = dangMo.some((x) => x.theId === t.id && x.dvId === dvId);
    return (
      <li key={k}>
        <button type="button" role="checkbox" aria-checked={!!d} disabled={dangCho || !coQuyen} onClick={() => doi(t.id, dvId)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-nho px-2 py-2 text-left text-[14px] hover:bg-giay-sang disabled:cursor-not-allowed disabled:opacity-60 ${d ? "bg-giay-sang" : ""}`}>
          <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border text-[12px] leading-none ${d ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang"}`}>{d ? "✓" : ""}</span>
          <span className={`min-w-0 flex-1 ${d ? "font-medium text-muc" : "text-muc-2"}`}>{nhan}</span>
          {dangCho && <span className="shrink-0 rounded-tag bg-canh-bao-nen px-1.5 py-0.5 text-[12px] text-canh-bao">đang chờ</span>}
        </button>
        {d && (
          <div className="mb-1 ml-10 mr-1 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5" role="group" aria-label={`Số buổi trừ ${nhan}`}>
              <button type="button" aria-label="Bớt một buổi" disabled={d.sl <= 1} onClick={() => datSl(k, d.sl - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam bg-giay-sang text-muc-2 hover:bg-giay-tram disabled:opacity-40"><Minus aria-hidden className="h-4 w-4" /></button>
              <span className="min-w-[5.5rem] text-center text-[13.5px] font-medium tabular-nums text-muc" aria-live="polite">{d.sl} buổi{d.sl > 1 ? ` (${d.sl} người)` : ""}</span>
              <button type="button" aria-label="Thêm một buổi" disabled={conChon(d.theId) <= 0 || d.sl >= TOI_DA_SO_LUONG_DONG} onClick={() => datSl(k, d.sl + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-nho border border-vien-dam bg-giay-sang text-muc-2 hover:bg-giay-tram disabled:opacity-40"><Plus aria-hidden className="h-4 w-4" /></button>
            </span>
            <span className="min-w-[12rem] flex-1">
              <Chon nho ariaLabel={`Người làm ${nhan}`} giaTri={d.nv} onDoi={(v) => datNv(k, v)}
                luaChon={[{ gia_tri: "", nhan: "Người làm chung của đơn" }, ...nvLC]} />
            </span>
          </div>
        )}
      </li>
    );
  };

  return (
    <section aria-label="Dịch vụ khách đã mua" className="mt-4 rounded-the border border-vien bg-sac-xanh-nen px-3 py-3">
      <p className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-muc"><Sparkles aria-hidden strokeWidth={1.7} className="h-4 w-4 text-sac-xanh" />Dịch vụ khách đã mua</p>
      {!khach ? <p className="text-[14px] text-muc-2">Chọn khách ở ô trên trước để hiện các dịch vụ khách đã mua còn buổi.</p>
        : the === null ? <p className="text-[14px] text-muc-3">Đang tải</p>
        : ds.length === 0 ? <p className="text-[14px] text-muc-2">Khách chưa có thẻ liệu trình nào còn buổi. Khách làm dịch vụ lẻ thì bấm Thêm dịch vụ lẻ bên dưới.</p> : (<>
          <p className="mb-2 text-[13px] text-muc-3">Tick được nhiều dịch vụ, nhiều thẻ cùng lúc. Nhiều người cùng làm một dịch vụ trên một thẻ thì bấm + để trừ nhiều buổi. Kết thúc mới trừ buổi.</p>
          {tongDong > 8 && <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm dịch vụ trong thẻ của khách" aria-label="Tìm dịch vụ khách đã mua" className="mb-2 h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 text-[14px] outline-none" />}
          <ul className="space-y-2">
            {ds.map((t) => {
              const dvThe = t.dichVu.filter((d) => tenDv.has(d) && (!tim_ || (tenDv.get(d) ?? "").toLowerCase().includes(tim_)));
              if (tim_ && t.dichVu.length && dvThe.length === 0) return null;
              const daChon = dong.filter((d) => d.theId === t.id).reduce((s, d) => s + d.sl, 0), mo = moCua(t.id), con = Math.max(0, t.buoiCon - mo);
              return (
                <li key={t.id} className="rounded-nho border border-vien bg-giay px-2 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 px-1">
                    <span className="min-w-0 text-[14px]">
                      <span className="block font-medium text-muc">{t.ten}</span>
                      <span className="block text-[12.5px] text-muc-3">{t.ma}{t.han ? ` · Hạn ${han(t.han)}` : ""}{mo ? ` · ${mo} buổi đang chờ` : ""}</span>
                    </span>
                    <span className={`shrink-0 text-[14px] font-semibold tabular-nums ${daChon > con ? "text-loi" : "text-sac-xanh"}`}>
                      {daChon ? `Chọn ${daChon} / ` : ""}Còn {t.buoiCon}{t.buoiTong && t.buoiTong < 999_999 ? `/${t.buoiTong}` : ""} buổi
                    </span>
                  </div>
                  {t.dichVu.length > 0
                    ? <ul className="mt-1">{dvThe.map((dv) => dongDv(t, dv))}</ul>
                    : (
                      <div className="mt-1 space-y-1">
                        <ul>{dongDv(t, dongThe(t))}{dong.filter((d) => d.theId === t.id && d.dvId !== dongThe(t)).map((d) => dongDv(t, d.dvId))}</ul>
                        {coQuyen && !moDoi.has(t.id) && <button type="button" className={`${NUT_CHU} px-1 text-[13px]`} onClick={() => setMoDoi((s) => new Set(s).add(t.id))}>Đổi / thêm dịch vụ</button>}
                        {coQuyen && moDoi.has(t.id) && <ChonNhieuDichVu ds={dvMuc.filter((d) => d.gia_tri !== dongThe(t) && !dangMo.some((x) => x.theId === t.id && x.dvId === d.gia_tri)).map((d) => ({ id: d.gia_tri, ten: d.nhan }))}
                          tatCa={dvMuc.map((d) => ({ id: d.gia_tri, ten: d.nhan }))} nhan={`Dịch vụ thẻ ${t.ma}`}
                          chon={dong.filter((d) => d.theId === t.id && d.dvId !== dongThe(t)).map((d) => d.dvId)}
                          onDoi={(ids) => setChon((m) => { const n = new Map([...m].filter(([, v]) => v.theId !== t.id || v.dvId === dongThe(t) || ids.includes(v.dvId))); for (const id of ids) if (!n.has(khoa(t.id, id))) n.set(khoa(t.id, id), { theId: t.id, dvId: id, nv: "", sl: 1 }); return n; })} />}
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
          {coQuyen && (
            <div className="mt-3 space-y-2 rounded-nho border border-vien bg-giay px-3 py-3">
              <p className="text-[13px] font-semibold text-muc">Người làm (chuyên viên trị liệu) chung cho đơn</p>
              <ONhieu luaChon={nvLC} giaTri={nvC} onDoi={setNvChung} />
              <div className="text-[13px] text-muc-2"><span className="mb-1 block">Bác sĩ</span>
                <Chon nho ariaLabel="Bác sĩ" giaTri={bsC} onDoi={setBs} luaChon={bacSi} /></div>
              {loiBuoi.length > 0 && <p role="alert" className="whitespace-pre-line rounded-nho bg-loi-nen px-3 py-2 text-[13px] text-loi">{loiBuoi.join("\n")}</p>}
              {loi && !loiBuoi.length && <p role="alert" className="whitespace-pre-line rounded-nho bg-loi-nen px-3 py-2 text-[13px] text-loi">{loi}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={gui} disabled={dang || dong.length === 0 || loiBuoi.length > 0 || dong.length > TOI_DA_DONG_GUI}
                  className={`${NUT_CHINH} w-full justify-center sm:w-auto`}>
                  <Send aria-hidden strokeWidth={1.8} className="h-4 w-4" />{dang ? "Đang gửi" : `Gửi chuyên viên làm (${dong.length} dịch vụ${dong.some((d) => d.sl > 1) ? `, ${dong.reduce((s, d) => s + d.sl, 0)} buổi` : ""})`}
                </button>
                {dong.length > 0 && <button type="button" className={NUT_CHU} onClick={() => { setChon(new Map()); setLoi(""); }}>Bỏ chọn hết</button>}
              </div>
              <p className="text-[12.5px] text-muc-3">Chưa trừ buổi: chuyên viên trị liệu Bắt đầu làm, tích bước, Kết thúc từng dịch vụ mới trừ 1 buổi. Trước khi Kết thúc vẫn sửa được dịch vụ / người làm ở Hoá đơn dịch vụ.</p>
            </div>
          )}
        </>)}
      {khach && !coQuyen && <p className="mt-2 text-[13px] text-muc-3">Tài khoản này chưa có quyền gửi chuyên viên làm.</p>}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { OTien } from "@/components/ui/OTien";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG, CHON_HET } from "@/components/ui/dinh-dang";
import { tienVN } from "@/lib/dinh-dang";
import { PHUONG_THUC, tinhDon, VAI, type DongDon, type KhoanThu, type MucBan, type Vai } from "@/lib/ban-hang";
import { ChonKhach, type KhachChon } from "@/components/khach/ChonKhach";
import type { chotDonBanHang, layTheTien, timKhach } from "@/app/(app)/ban-hang/actions";

type Nv = { id: string; ten: string; vaiTro: string };
type TheTien = { id: string; ma: string; soDu: number };
const LOAI_TAB = [{ ma: "dich_vu", ten: "Dịch vụ" }, { ma: "goi_the", ten: "Thẻ và liệu trình" }, { ma: "san_pham", ten: "Sản phẩm" }] as const;
const khoaDong = (d: { loai: string; ref: string }) => `${d.loai}:${d.ref}`;

/** Màn Thu ngân. Dựng đơn trong trình duyệt, gửi MỘT lần lên máy chủ; máy chủ tự đọc lại giá từ danh mục và chốt trong một giao dịch. */
export function Pos({ muc, nhanVien, khachBanDau, dongBanDau, chiNhanhId, chiNhanh, khoaChiNhanh, lichId, tim, layThe, chot }: {
  muc: MucBan[]; nhanVien: Nv[]; khachBanDau: KhachChon | null; dongBanDau: DongDon[]; chiNhanhId: string; chiNhanh: { id: string; ten: string }[]; khoaChiNhanh: boolean; lichId: string | null;
  tim: typeof timKhach; layThe: typeof layTheTien; chot: typeof chotDonBanHang;
}) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [khach, setKhach] = useState<KhachChon | null>(khachBanDau);
  const [cnId, setCnId] = useState(chiNhanhId);
  const [tab, setTab] = useState<MucBan["loai"]>("dich_vu");
  const [tu, setTu] = useState("");
  const [dong, setDong] = useState<DongDon[]>(dongBanDau);
  const [giamDon, setGiamDon] = useState(0);
  const [giamPct, setGiamPct] = useState("");
  const [vatPct, setVatPct] = useState("0");
  const [phuPhi, setPhuPhi] = useState(0);
  const [tip, setTip] = useState(0);
  const [ghiChu, setGhiChu] = useState("");
  const [thu, setThu] = useState<KhoanThu[]>([]);
  const [theTienTai, setTheTien] = useState<TheTien[]>([]);
  const [loi, setLoi] = useState("");
  const [suaNv, setSuaNv] = useState<number | null>(null);

  const tuMuc = useMemo(() => new Map(muc.map((m) => [khoaDong({ loai: m.loai, ref: m.id }), m])), [muc]);
  useEffect(() => {
    if (!khach) return;
    let con = true;
    layThe(khach.id).then((r) => con && setTheTien(r));
    return () => { con = false; };
  }, [khach, layThe]);

  const theTien = khach ? theTienTai : [];
  const hang = dong.reduce((s, d) => s + (tuMuc.get(khoaDong(d))?.gia ?? 0) * d.sl - d.giam, 0);
  const { vat, phai } = tinhDon(hang, giamDon, Number(vatPct) || 0, phuPhi, tip);
  const daThu = thu.reduce((s, t) => s + t.so_tien, 0);
  const conNo = phai - daThu;

  const them = (m: MucBan) => {
    setDong((ds) => {
      const i = ds.findIndex((d) => khoaDong(d) === khoaDong({ loai: m.loai, ref: m.id }));
      if (i >= 0) return ds.map((d, j) => (j === i ? { ...d, sl: d.sl + 1 } : d));
      const macDinhBan = khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [];
      return [...ds, { loai: m.loai, ref: m.id, sl: 1, giam: 0, nv: { phuc_vu: [], tu_van: [], ban: macDinhBan } }];
    });
  };
  const capNhat = (i: number, p: Partial<DongDon>) => setDong((ds) => ds.map((d, j) => (j === i ? { ...d, ...p } : d)));

  const dsMuc = muc.filter((m) => m.loai === tab && (!tu.trim() || m.ten.toLowerCase().includes(tu.trim().toLowerCase())));
  const nhomMuc = [...new Set(dsMuc.map((m) => m.nhom))];

  const gui = () => {
    setLoi("");
    if (!dong.length) return setLoi("Đơn chưa có dòng hàng nào.");
    if (conNo < 0) return setLoi("Tổng các khoản thu lớn hơn số phải thu.");
    if (conNo > 0 && !khach) return setLoi("Còn nợ thì phải chọn khách hàng.");
    for (const t of thu) if (t.phuong_thuc === "the_tien" && !t.the_id) return setLoi("Chọn thẻ tiền cho khoản trừ thẻ.");
    bat(async () => {
      const kq = await chot(JSON.stringify({ khachId: khach?.id ?? null, lichId, chiNhanhId: cnId, dong, giamDon, vatPct: Number(vatPct) || 0, phuPhi, tip, nguoiGioiThieu: "", ghiChu, thu }));
      if ("loi" in kq && kq.loi) setLoi(kq.loi);
      else if ("id" in kq) router.push(`/hoa-don/${kq.id}?moi=1`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="min-w-0">
        <label className="mb-4 block text-[13px] text-muc-2">Chi nhánh bán
          <select value={cnId} disabled={khoaChiNhanh} onChange={(e) => setCnId(e.target.value)} className={`${O_NHAP} mt-1`}>
            {!cnId && <option value="">Chọn chi nhánh</option>}
            {chiNhanh.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
          </select>
        </label>
        <ChonKhach khach={khach} onDoi={(k) => { setKhach(k); setThu((t) => t.filter((x) => x.phuong_thuc !== "the_tien")); }} tim={tim} />
        <div className="mt-5 flex gap-1 border-b border-vien" role="tablist">
          {LOAI_TAB.map((t) => (
            <button key={t.ma} type="button" role="tab" aria-selected={tab === t.ma} onClick={() => setTab(t.ma)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] ${tab === t.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{t.ten}</button>
          ))}
        </div>
        <div className="relative mt-4">
          <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
          <input value={tu} onChange={(e) => setTu(e.target.value)} placeholder="Tìm trong danh mục" aria-label="Tìm trong danh mục" className={`${O_NHAP} pl-9`} />
        </div>
        <div className="mt-4 space-y-5">
          {nhomMuc.map((n) => (
            <div key={n}>
              <div className="nhan-muc mb-2">{n}</div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {dsMuc.filter((m) => m.nhom === n).map((m) => (
                  <button key={m.id} type="button" onClick={() => them(m)} className="rounded-the border border-vien bg-giay-sang px-3.5 py-3 text-left transition-colors hover:border-nhan hover:bg-nhan-nhat/40">
                    <div className="text-[14px] font-medium text-muc">{m.ten}</div>
                    <div className="mt-0.5 text-[13px] text-muc-3 tabular-nums">{tienVN(m.gia)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {dsMuc.length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Không có mục nào.</p>}
        </div>
      </section>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-the border border-vien bg-giay-sang">
          <h2 className="border-b border-vien px-4 py-3 text-[15px] font-semibold text-muc">Đơn hàng</h2>
          {dong.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-muc-3">Chọn dịch vụ, thẻ hoặc sản phẩm ở bên trái.</p>}
          <ul className="divide-y divide-vien">
            {dong.map((d, i) => {
              const m = tuMuc.get(khoaDong(d));
              if (!m) return null;
              const nguoi = VAI.flatMap((v) => d.nv[v.ma].map((x) => nhanVien.find((n) => n.id === x.id)?.ten)).filter(Boolean);
              return (
                <li key={khoaDong(d)} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="text-[14px] font-medium text-muc">{m.ten}</div><div className="text-[12px] text-muc-3 tabular-nums">{tienVN(m.gia)} / đơn vị</div></div>
                    <button type="button" aria-label={`Bỏ ${m.ten}`} onClick={() => setDong((ds) => ds.filter((_, j) => j !== i))} className="p-1 text-muc-3 hover:text-loi"><Trash2 strokeWidth={1.6} className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="flex items-center rounded-nho border border-vien-dam">
                      <button type="button" aria-label="Giảm số lượng" disabled={d.sl <= 1} onClick={() => capNhat(i, { sl: d.sl - 1 })} className="p-2 text-muc-2 disabled:opacity-40"><Minus strokeWidth={1.8} className="h-3.5 w-3.5" /></button>
                      <span className="min-w-[28px] text-center text-[14px] tabular-nums">{d.sl}</span>
                      <button type="button" aria-label="Tăng số lượng" onClick={() => capNhat(i, { sl: d.sl + 1 })} className="p-2 text-muc-2"><Plus strokeWidth={1.8} className="h-3.5 w-3.5" /></button>
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-muc-3">Giảm <OTien className="w-[120px]" giaTri={d.giam} onDoi={(n) => capNhat(i, { giam: Math.min(n, m.gia * d.sl) })} ariaLabel="Giảm giá dòng" /></span>
                    <span className="ml-auto text-[15px] font-medium tabular-nums text-muc">{tienVN(m.gia * d.sl - d.giam)}</span>
                  </div>
                  <button type="button" onClick={() => setSuaNv(i)} className={`mt-2 flex items-center gap-1.5 text-[13px] ${NUT_CHU}`}><UserRound strokeWidth={1.6} className="h-3.5 w-3.5" />{nguoi.length ? nguoi.join(", ") : "Chọn người phục vụ, tư vấn, bán"}</button>
                </li>
              );
            })}
          </ul>

          {dong.length > 0 && (
            <div className="space-y-3 border-t border-vien px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={NHAN_O}>Giảm cả đơn (đ)</label><OTien giaTri={giamDon} onDoi={(n) => { setGiamDon(Math.min(n, hang)); setGiamPct(""); }} /></div>
                <div><label className={NHAN_O}>hoặc giảm %</label><input inputMode="decimal" {...CHON_HET} className={`${O_NHAP} text-right`} value={giamPct} onChange={(e) => { const p = e.target.value.replace(/[^\d.]/g, ""); setGiamPct(p); setGiamDon(Math.round((hang * Math.min(Number(p) || 0, 100)) / 100)); }} /></div>
                <div><label className={NHAN_O}>VAT (%)</label><input inputMode="decimal" {...CHON_HET} className={`${O_NHAP} text-right`} value={vatPct} onChange={(e) => setVatPct(e.target.value.replace(/[^\d.]/g, ""))} /></div>
                <div><label className={NHAN_O}>Phụ phí</label><OTien giaTri={phuPhi} onDoi={setPhuPhi} /></div>
                <div className="col-span-2"><label className={NHAN_O}>Tip cho nhân viên</label><OTien giaTri={tip} onDoi={setTip} /></div>
              </div>
              <dl className="space-y-1.5 border-t border-vien pt-3 text-[14px]">
                <div className="flex justify-between"><dt className="text-muc-3">Tiền hàng</dt><dd className="tabular-nums">{tienVN(hang)}</dd></div>
                {giamDon > 0 && <div className="flex justify-between"><dt className="text-muc-3">Giảm giá</dt><dd className="tabular-nums">− {tienVN(giamDon)}</dd></div>}
                {vat > 0 && <div className="flex justify-between"><dt className="text-muc-3">VAT</dt><dd className="tabular-nums">{tienVN(vat)}</dd></div>}
                {(phuPhi > 0 || tip > 0) && <div className="flex justify-between"><dt className="text-muc-3">Phụ phí và tip</dt><dd className="tabular-nums">{tienVN(phuPhi + tip)}</dd></div>}
                <div className="flex justify-between border-t border-vien pt-2 text-[17px] font-semibold text-muc"><dt>Phải thu</dt><dd className="tabular-nums">{tienVN(phai)}</dd></div>
              </dl>

              <div className="border-t border-vien pt-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-[14px] font-semibold text-muc">Thanh toán</span>
                  <button type="button" className={NUT_CHU} onClick={() => setThu((t) => [...t, { phuong_thuc: "tien_mat", so_tien: Math.max(conNo, 0) }])}>Thêm khoản thu</button></div>
                <ul className="space-y-2">
                  {thu.map((t, i) => (
                    <li key={`${i}-${t.phuong_thuc}`} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                      <Chon nho ariaLabel="Phương thức" giaTri={t.phuong_thuc} luaChon={PHUONG_THUC} onDoi={(v) => setThu((x) => x.map((y, j) => (j === i ? { ...y, phuong_thuc: v, the_id: undefined } : y)))} />
                      <OTien giaTri={t.so_tien} onDoi={(n) => setThu((x) => x.map((y, j) => (j === i ? { ...y, so_tien: n } : y)))} ariaLabel="Số tiền thu" />
                      <button type="button" aria-label="Bỏ khoản thu" onClick={() => setThu((x) => x.filter((_, j) => j !== i))} className="p-2 text-muc-3 hover:text-loi"><X strokeWidth={1.6} className="h-4 w-4" /></button>
                      {t.phuong_thuc === "the_tien" && (
                        <div className="col-span-3">
                          {theTien.length === 0 ? <p className="text-[12px] text-canh-bao">Khách chưa có thẻ tiền còn số dư.</p> :
                            <Chon nho trong="Chọn thẻ tiền" ariaLabel="Thẻ tiền" giaTri={t.the_id ?? ""} luaChon={theTien.map((x) => ({ gia_tri: x.id, nhan: `${x.ma} · còn ${tienVN(x.soDu)}` }))} onDoi={(v) => setThu((a) => a.map((y, j) => (j === i ? { ...y, the_id: v, so_tien: Math.min(theTien.find((z) => z.id === v)?.soDu ?? 0, Math.max(phai - a.reduce((s, q, k) => (k === i ? s : s + q.so_tien), 0), 0)) } : y)))} />}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 text-[14px]">
                  <div className="flex justify-between"><dt className="text-muc-3">Đã thu</dt><dd className="tabular-nums">{tienVN(daThu)}</dd></div>
                  <div className={`flex justify-between font-medium ${conNo > 0 ? "text-canh-bao" : conNo < 0 ? "text-loi" : "text-nhan-dam"}`}><dt>{conNo < 0 ? "Thu thừa" : "Còn nợ"}</dt><dd className="tabular-nums">{tienVN(Math.abs(conNo))}</dd></div>
                </dl>
              </div>

              <div><label className={NHAN_O}>Ghi chú đơn</label><textarea className={O_NHIEU_DONG} style={{ minHeight: 64 }} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} /></div>
              {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
              <button type="button" disabled={dang} onClick={gui} className={`${NUT_CHINH} h-12 w-full text-[15px]`}>{dang ? "Đang chốt đơn" : conNo > 0 ? `Chốt đơn, ghi nợ ${tienVN(conNo)}` : "Chốt đơn"}</button>
            </div>
          )}
        </div>
      </aside>

      {suaNv !== null && dong[suaNv] && (
        <NguoiHuong d={dong[suaNv]} ten={tuMuc.get(khoaDong(dong[suaNv]))?.ten ?? ""} nhanVien={nhanVien} dong={() => setSuaNv(null)} luu={(nv) => { capNhat(suaNv, { nv }); setSuaNv(null); }} />
      )}
    </div>
  );
}

function NguoiHuong({ d, ten, nhanVien, dong, luu }: { d: DongDon; ten: string; nhanVien: Nv[]; dong: () => void; luu: (nv: DongDon["nv"]) => void }) {
  const [nv, setNv] = useState(d.nv);
  const [loi, setLoi] = useState("");
  const lc = [{ gia_tri: "", nhan: "Không có" }, ...nhanVien.map((n) => ({ gia_tri: n.id, nhan: n.ten }))];
  const doiNguoi = (v: Vai, i: number, id: string) => setNv((x) => ({ ...x, [v]: id ? x[v].map((y, j) => (j === i ? { ...y, id } : y)) : x[v].filter((_, j) => j !== i) }));
  const doiTi = (v: Vai, i: number, ti: number) => setNv((x) => ({ ...x, [v]: x[v].map((y, j) => (j === i ? { ...y, ti } : y)) }));
  const themNguoi = (v: Vai) => setNv((x) => ({ ...x, [v]: x[v].length === 0 ? [{ id: nhanVien[0]?.id ?? "", ti: 100 }] : [...x[v], { id: "", ti: 0 }] }));
  const xong = () => {
    for (const v of VAI) {
      const ds = nv[v.ma].filter((x) => x.id);
      if (ds.length && Math.abs(ds.reduce((s, x) => s + x.ti, 0) - 100) > 0.01) return setLoi(`Vai ${v.ten}: phần chia phải cộng đủ 100%.`);
      if (new Set(ds.map((x) => x.id)).size !== ds.length) return setLoi(`Vai ${v.ten}: một người chỉ xuất hiện một lần.`);
    }
    luu({ phuc_vu: nv.phuc_vu.filter((x) => x.id), tu_van: nv.tu_van.filter((x) => x.id), ban: nv.ban.filter((x) => x.id) });
  };
  return (
    <Hop mo dong={dong} tieuDe="Người hưởng" moTa={`${ten}. Mỗi vai chia tối đa 100%; bỏ trống vai nào thì vai đó không tính hoa hồng.`} rong="rong">
      <div className="space-y-5">
        {VAI.map((v) => (
          <div key={v.ma}>
            <div className="mb-2 flex items-center justify-between"><span className="text-[14px] font-semibold text-muc">{v.ten}</span>
              <button type="button" className={NUT_CHU} onClick={() => themNguoi(v.ma)}>{nv[v.ma].length ? "Thêm người chia" : "Chọn người"}</button></div>
            <ul className="space-y-2">
              {nv[v.ma].map((x, i) => (
                <li key={`${v.ma}-${i}`} className="grid grid-cols-[1fr_96px] gap-2">
                  <Chon nho trong="Chọn nhân viên" ariaLabel={`${v.ten} ${i + 1}`} giaTri={x.id} luaChon={lc} onDoi={(id) => doiNguoi(v.ma, i, id)} />
                  <div className="relative"><input inputMode="decimal" {...CHON_HET} aria-label="Phần trăm" value={String(x.ti)} onChange={(e) => doiTi(v.ma, i, Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} className={`${O_NHAP} h-9 pr-7 text-right`} /><span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muc-3">%</span></div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={dong}>Huỷ</button><button type="button" className={NUT_CHINH} onClick={xong}>Xong</button></div>
    </Hop>
  );
}

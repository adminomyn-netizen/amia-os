"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { Bang } from "@/components/ui/Table";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import type { DongXemTruoc } from "@/app/(app)/hoa-hong/actions";

type Kq = { ok?: true; loi?: string; them?: number; ghiDe?: number; giuNguyen?: number };
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ / liệu trình" };
const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
const HD = { them: "Thêm mới", ghi_de: "Ghi đè", giu_nguyen: "Giữ nguyên" };
const so = (ti: number | null, tien: number | null) => [ti ? `${ti}%` : "", tien ? `${tien.toLocaleString("vi-VN")} đ` : ""].filter(Boolean).join(" + ") || "0%";

/** Sao chép cài đặt hoa hồng từ nhân viên / nhóm / chung A sang B: chọn A, B → xem trước từng dòng (thêm, ghi đè, giữ nguyên) → áp dụng trong một giao dịch, có ghi nhật ký. */
export function SaoChepHoaHong({ luaChon, tenMuc, xemTruoc, apDung }: { luaChon: LuaChon[]; tenMuc: Record<string, string>; xemTruoc: (fd: FormData) => Promise<{ loi?: string; dong?: DongXemTruoc[] }>; apDung: (fd: FormData) => Promise<Kq> }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [nguon, setNguon] = useState(""), [dich, setDich] = useState(""), [ghiDe, setGhiDe] = useState(false);
  const [dong, setDong] = useState<DongXemTruoc[] | null>(null);
  const [loi, setLoi] = useState(""), [xong, setXong] = useState("");
  const [dang, bat] = useTransition();
  const fd = () => { const f = new FormData(); f.set("nguon", nguon); f.set("dich", dich); f.set("ghi_de", ghiDe ? "1" : "0"); return f; };
  const dem = (h: DongXemTruoc["hanh_dong"]) => (dong ?? []).filter((d) => d.hanh_dong === h).length;
  const doi = (f: () => void) => { f(); setDong(null); setLoi(""); setXong(""); };
  const xem = () => {
    setLoi(""); setXong("");
    if (!nguon || !dich) { setLoi("Chọn nguồn (sao chép từ) và đích (sang)."); return; }
    bat(async () => { const kq = await xemTruoc(fd()); if (kq.loi) { setLoi(kq.loi); setDong(null); } else setDong(kq.dong ?? []); });
  };
  const ap = () => bat(async () => {
    const kq = await apDung(fd());
    if (kq.loi) { setLoi(kq.loi); return; }
    setXong(`Đã sao chép: thêm ${kq.them}, ghi đè ${kq.ghiDe}, giữ nguyên ${kq.giuNguyen}.`);
    setDong(null);
    router.refresh();
  });
  const sua = dem("them") + (ghiDe ? dem("ghi_de") : 0);
  return (
    <>
      <button type="button" className={NUT_PHU} onClick={() => { setMo(true); setDong(null); setLoi(""); setXong(""); }}>Sao chép cài đặt</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Sao chép cài đặt hoa hồng" moTa="Chép các tỉ lệ đã cài riêng của một nhân viên, một nhóm (chức danh) hoặc của cài đặt chung sang nơi khác. Xem trước rồi mới áp dụng." rong="rong">
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div><label htmlFor="sc-nguon" className={NHAN_O}>Sao chép từ</label><Chon id="sc-nguon" luaChon={luaChon} giaTri={nguon} onDoi={(v) => doi(() => setNguon(v))} trong="Chọn nguồn" /></div>
          <div><label htmlFor="sc-dich" className={NHAN_O}>Sang</label><Chon id="sc-dich" luaChon={luaChon} giaTri={dich} onDoi={(v) => doi(() => setDich(v))} trong="Chọn đích" /></div>
          <div className="sm:col-span-2"><Gat nhan="Ghi đè cả những mục đích đã có nhưng khác số (mặc định chỉ thêm mục chưa có)" giaTriMacDinh={ghiDe} onDoi={(v) => { setGhiDe(v); }} /></div>
        </div>
        {dong && (
          <div className="mt-5" aria-live="polite">
            <p className="mb-2 text-[13.5px] text-muc-2">{dong.length === 0 ? "Nguồn chưa có cài đặt riêng nào để sao chép." : `Thêm mới ${dem("them")} · Ghi đè ${dem("ghi_de")}${ghiDe ? "" : " (sẽ bỏ qua)"} · Giữ nguyên ${dem("giu_nguyen")}`}</p>
            {dong.length > 0 && <Bang duLieu={dong} khoa={(r) => `${r.loai}-${r.vai}-${r.muc_id}`}
              cot={[{ nhan: "Loại", hienThi: (r) => LOAI[r.loai] ?? r.loai }, { nhan: "Vai", hienThi: (r) => VAI[r.vai] ?? r.vai }, { nhan: "Áp dụng cho", chinh: true, hienThi: (r) => (r.muc_id ? tenMuc[r.muc_id] ?? "" : "Mặc định cả loại") },
                { nhan: "Sẽ cài", phai: true, hienThi: (r) => so(r.ti_le, r.so_tien) }, { nhan: "Đích hiện có", phai: true, hienThi: (r) => (r.hanh_dong === "them" ? "chưa có" : so(r.ti_le_cu, r.so_tien_cu)) },
                { nhan: "Việc làm", hienThi: (r) => (r.hanh_dong === "ghi_de" && !ghiDe ? "Bỏ qua (đang không ghi đè)" : HD[r.hanh_dong]) }]} />}
          </div>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        {xong && <div role="status" className="mt-4 rounded-nho border border-vien bg-giay-tram px-3 py-2.5 text-[14px] text-muc">{xong}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button>
          <button type="button" className={dong && sua > 0 ? NUT_PHU : NUT_CHINH} disabled={dang} onClick={xem}>{dang ? "Đang tính" : "Xem trước"}</button>
          {dong && sua > 0 && <button type="button" className={NUT_CHINH} disabled={dang} onClick={ap}>Áp dụng ({sua} dòng)</button>}
        </div>
      </Hop>
    </>
  );
}

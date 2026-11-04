"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";
import { ngayVN } from "@/lib/dinh-dang";

type Dong = { id: string; ma: string; ho_ten: string; dien_thoai: string; hang: string | null; ngay_sinh?: string | null };
const TAB = [{ ma: "hom_nay", ten: "Hôm nay" }, { ma: "7_ngay", ten: "7 ngày tới" }, { ma: "thang", ten: "Trong tháng" }] as const;
type MaTab = (typeof TAB)[number]["ma"];
const MOI_LAN = 50;

/** Ô chỉ số "Sinh nhật …" ở đầu màn Khách hàng, bấm mở hộp Sinh nhật như SalonHero: 3 tab (hôm nay / 7 ngày tới / trong tháng), lọc hạng, tìm tên/SĐT/mã.
 * Dùng chung API danh sách khách (/api/khach/tim) nên quyền xem SĐT và phạm vi chi nhánh giữ nguyên như cột trái. */
export function HopSinhNhat({ nhan, so, tab: tabDau, hang }: { nhan: string; so: number; tab: MaTab; hang: LuaChon[] }) {
  const [mo, setMo] = useState(false);
  const [tab, setTab] = useState<MaTab>(tabDau);
  const [h, setH] = useState("");
  const [q, setQ] = useState("");
  const [ds, setDs] = useState<Dong[]>([]);
  const [tong, setTong] = useState(0);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const lan = useRef(0);

  const tai = async (tu: number) => {
    const n = ++lan.current;
    const u = new URLSearchParams({ sinh_nhat: tab, tu: String(tu), so: String(MOI_LAN) });
    if (h) u.set("hang", h);
    if (q.trim()) u.set("q", q.trim());
    setDang(true); setLoi("");
    try {
      const r = await fetch(`/api/khach/tim?${u}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { ds: Dong[]; tong: number };
      if (n !== lan.current) return;
      setDs((cu) => (tu === 0 ? j.ds : [...cu, ...j.ds])); setTong(j.tong);
    } catch {
      if (n === lan.current) setLoi("Chưa tải được danh sách. Thử lại sau ít giây.");
    } finally {
      if (n === lan.current) setDang(false);
    }
  };

  useEffect(() => {
    if (!mo) return;
    const t = setTimeout(() => void tai(0), q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tải lại khi đổi tab/hạng/từ khoá hoặc mở hộp
  }, [mo, tab, h, q]);

  return (
    <>
      {/* Nằm trong <dl> chỉ số: giữ cặp dt/dd, nút phủ cả ô (after:inset-0) để bấm đâu trên ô cũng mở hộp. */}
      <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5 hover:border-nhan">
        <dt><button type="button" aria-haspopup="dialog" onClick={() => { setTab(tabDau); setMo(true); }} className="text-left text-[12.5px] text-muc-3 after:absolute after:inset-0 after:content-['']">{nhan}</button></dt>
        <dd className="mt-0.5 text-[22px] font-semibold leading-tight tabular-nums text-sac-hong">{so.toLocaleString("vi-VN")}</dd>
      </div>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Khách hàng sinh nhật" rong="rong">
        <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-vien">
          {TAB.map((t) => (
            <button key={t.ma} type="button" role="tab" aria-selected={tab === t.ma} onClick={() => setTab(t.ma)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${tab === t.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{t.ten}</button>
          ))}
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, số điện thoại, mã khách" aria-label="Tìm khách sinh nhật" className={O_NHAP} />
          <Chon ariaLabel="Hạng khách" giaTri={h} onDoi={setH} luaChon={[{ gia_tri: "", nhan: "Mọi hạng" }, ...hang]} />
        </div>
        <p className="mb-2 text-[13px] text-muc-3" aria-live="polite">{dang && ds.length === 0 ? "Đang tải…" : `${tong.toLocaleString("vi-VN")} khách`}</p>
        {loi && <div role="alert" className="mb-2 rounded-nho bg-loi-nen px-3 py-2 text-[14px] text-loi">{loi}</div>}
        <ul className="max-h-[55vh] divide-y divide-vien overflow-y-auto rounded-nho border border-vien">
          {ds.map((k) => (
            <li key={k.id}>
              <Link href={`/khach-hang/${k.id}`} onClick={() => setMo(false)} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2.5 hover:bg-giay-sang">
                <span className="text-[14px] font-medium text-muc">{k.ho_ten}</span>
                <span className="text-[13px] tabular-nums text-muc-3">{[k.ngay_sinh ? `Sinh ${ngayVN(k.ngay_sinh)}` : "", k.dien_thoai, k.ma, k.hang ?? ""].filter(Boolean).join(" · ")}</span>
              </Link>
            </li>
          ))}
          {!dang && ds.length === 0 && !loi && <li className="px-3 py-6 text-center text-[14px] text-muc-3">Không có khách sinh nhật trong mục này.</li>}
        </ul>
        {ds.length < tong && <div className="mt-3 flex justify-center"><button type="button" className={NUT_PHU} disabled={dang} onClick={() => void tai(ds.length)}>{dang ? "Đang tải…" : "Tải thêm"}</button></div>}
      </Hop>
    </>
  );
}

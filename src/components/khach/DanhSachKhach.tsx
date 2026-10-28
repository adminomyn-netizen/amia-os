"use client";

import Link from "next/link";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { O_NHAP } from "@/components/ui/dinh-dang";
import { SAP_XEP_KHACH, TRANG_THAI_KHACH } from "@/lib/khach";

type Dong = { id: string; ma: string; ho_ten: string; dien_thoai: string; trang_thai: string | null; hang: string | null };
type Loc = { trang_thai: string; nguon: string; hang: string; phu_trach: string };
const MOI_LAN = 40;
const TAT_CA = { gia_tri: "", nhan: "Tất cả" };

const theoManHinhRong = (bao: () => void) => {
  const m = window.matchMedia("(min-width: 1024px)");
  m.addEventListener("change", bao);
  return () => m.removeEventListener("change", bao);
};

/** Cột trái màn Khách hàng. Lọc/tìm/sắp xếp giữ trong bộ nhớ của khung (không nằm trên địa chỉ) nên bấm đổi khách hay đổi tab bên phải không làm mất.
 *  Lấy dữ liệu qua /api/khach/tim (kiểm quyền ở máy chủ); `moc` đổi (sau khi Thêm/Sửa khách làm mới trang) thì tải lại đúng số dòng đang hiện. */
export function DanhSachKhach({ nhanVien, nguon, hang, moc, choXuat }: { nhanVien: LuaChon[]; nguon: LuaChon[]; hang: LuaChon[]; moc: number; choXuat: boolean }) {
  const sp = useSearchParams();
  const dangChon = useSelectedLayoutSegment();
  const manRong = useSyncExternalStore(theoManHinhRong, () => window.matchMedia("(min-width: 1024px)").matches, () => true);
  const hoatDong = manRong || dangChon === null;

  const [o, setO] = useState(sp.get("q") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [loc, setLoc] = useState<Loc>({ trang_thai: sp.get("trang_thai") ?? "", nguon: sp.get("nguon") ?? "", hang: sp.get("hang") ?? "", phu_trach: sp.get("phu_trach") ?? "" });
  const [sx, setSx] = useState(sp.get("sx") ?? "ten");
  const [moLoc, setMoLoc] = useState(!!(sp.get("trang_thai") || sp.get("nguon") || sp.get("hang") || sp.get("phu_trach")));
  const [ds, setDs] = useState<Dong[]>([]);
  const [tong, setTong] = useState(0);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const lan = useRef(0);
  const dsRef = useRef<Dong[]>([]);
  const mocCu = useRef(moc);
  const daTai = useRef("");

  const thamSo = useCallback(() => new URLSearchParams({ q, ...loc, sx }), [q, loc, sx]);
  /** `tu` = vị trí bắt đầu; `ghiDe` = thay cả danh sách (đổi bộ lọc) thay vì nối thêm (Tải thêm). Kết quả của lần gọi cũ hơn bị bỏ. */
  const tai = useCallback(async (tu: number, so: number, ghiDe: boolean) => {
    const n = ++lan.current;
    const u = thamSo();
    u.set("tu", String(tu));
    u.set("so", String(so));
    setDang(true);
    setLoi("");
    try {
      const r = await fetch(`/api/khach/tim?${u}`);
      if (!r.ok) throw new Error();
      const j = (await r.json()) as { ds: Dong[]; tong: number };
      if (n !== lan.current) return;
      const moi = ghiDe ? j.ds : [...dsRef.current, ...j.ds];
      dsRef.current = moi;
      setDs(moi);
      setTong(j.tong);
    } catch {
      if (n === lan.current) setLoi("Không tải được danh sách. Bấm Thử lại.");
    } finally {
      if (n === lan.current) setDang(false);
    }
  }, [thamSo]);

  useEffect(() => {
    const t = setTimeout(() => setQ(o.trim()), 350);
    return () => clearTimeout(t);
  }, [o]);

  useEffect(() => {
    if (!hoatDong) return;
    const khoa = `${thamSo()}|${moc}`;
    const t = setTimeout(() => {
      // Quay lại danh sách từ hồ sơ (điện thoại) mà bộ lọc không đổi thì giữ nguyên các trang đã tải, không tải lại từ đầu.
      if (daTai.current === khoa) return;
      const lamMoi = mocCu.current !== moc;
      mocCu.current = moc;
      daTai.current = khoa;
      void tai(0, lamMoi ? Math.min(200, Math.max(MOI_LAN, dsRef.current.length)) : MOI_LAN, true);
    }, 0);
    return () => clearTimeout(t);
  }, [tai, thamSo, hoatDong, moc]);

  const soLoc = Object.values(loc).filter(Boolean).length;
  const datLoc = (k: keyof Loc, v: string) => setLoc((x) => ({ ...x, [k]: v }));
  const trangThaiLC = Object.entries(TRANG_THAI_KHACH).map(([gia_tri, v]) => ({ gia_tri, nhan: v.nhan }));
  const lienKetXuat = `/api/xuat/khach-hang?${thamSo()}`;

  return (
    <div className="ds-khach flex min-h-0 flex-1 flex-col overflow-hidden max-lg:min-h-[60dvh]">
      <div className="space-y-2 border-b border-[color:var(--khach-vien)] p-2.5">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
            <input value={o} onChange={(e) => setO(e.target.value)} placeholder="Tìm tên, SĐT, mã, email" aria-label="Tìm kiếm khách hàng" className={`${O_NHAP} !h-9 pl-8 !text-[13px]`} />
          </div>
          <button type="button" aria-expanded={moLoc} onClick={() => setMoLoc((x) => !x)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-nho border border-vien-dam bg-giay-sang px-3 text-[13px] text-muc-2 hover:border-nhan">
            <SlidersHorizontal aria-hidden strokeWidth={1.7} className="h-4 w-4" />Lọc{soLoc > 0 && <span className="nhan-nho !bg-nhan !text-white">{soLoc}</span>}
          </button>
        </div>
        {moLoc && (
          <div className="grid grid-cols-2 gap-2">
            <Chon nho ariaLabel="Trạng thái" trong="Trạng thái" giaTri={loc.trang_thai} onDoi={(v) => datLoc("trang_thai", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi trạng thái" }, ...trangThaiLC]} />
            <Chon nho ariaLabel="Nguồn" trong="Nguồn" giaTri={loc.nguon} onDoi={(v) => datLoc("nguon", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi nguồn" }, ...nguon]} />
            <Chon nho ariaLabel="Hạng" trong="Hạng" giaTri={loc.hang} onDoi={(v) => datLoc("hang", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi hạng" }, ...hang]} />
            <Chon nho ariaLabel="Người phụ trách" trong="Người phụ trách" giaTri={loc.phu_trach} onDoi={(v) => datLoc("phu_trach", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi người phụ trách" }, ...nhanVien]} />
            <div className="col-span-2 flex items-center gap-2">
              <span className="shrink-0">Sắp xếp</span>
              <Chon nho ariaLabel="Sắp xếp" giaTri={sx} onDoi={setSx} luaChon={SAP_XEP_KHACH} className="min-w-0 flex-1" />
              {soLoc > 0 && <button type="button" className="shrink-0 text-[13px] font-medium text-nhan-dam hover:underline" onClick={() => setLoc({ trang_thai: "", nguon: "", hang: "", phu_trach: "" })}>Bỏ lọc</button>}
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={dang}>
        {ds.map((r) => {
          const tt = TRANG_THAI_KHACH[r.trang_thai ?? "lead"];
          return (
            <Link key={r.id} href={`/khach-hang/${r.id}`} aria-current={r.id === dangChon ? "true" : undefined} className="ds-khach-dong">
              <span className="ds-khach-ten">{r.ho_ten}</span>
              <span className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="tabular-nums">{r.dien_thoai} – {r.ma}</span>
                <span className="flex gap-1">{tt && <span className="nhan-nho">{tt.nhan}</span>}{r.hang && <span className="nhan-nho">{r.hang}</span>}</span>
              </span>
            </Link>
          );
        })}
        {loi && <p role="alert" className="p-4 text-center text-loi">{loi} <button type="button" className="font-medium underline" onClick={() => void tai(0, MOI_LAN, true)}>Thử lại</button></p>}
        {!loi && !dang && ds.length === 0 && <p className="p-6 text-center">Không có khách nào khớp. Thử bỏ bớt bộ lọc.</p>}
        {!loi && dang && ds.length === 0 && <p className="p-6 text-center">Đang tải…</p>}
        {ds.length < tong && (
          <button type="button" disabled={dang} onClick={() => void tai(ds.length, MOI_LAN, false)} className="w-full p-3 text-center text-[13px] font-medium text-nhan-dam hover:underline disabled:opacity-50">
            {dang ? "Đang tải…" : `Tải thêm (còn ${(tong - ds.length).toLocaleString("vi-VN")} khách)`}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[color:var(--khach-vien)] px-3 py-2 text-[12px]">
        <span>{tong.toLocaleString("vi-VN")} khách{soLoc > 0 || q ? " khớp" : ""}</span>
        {choXuat && <a href={lienKetXuat} download className="flex items-center gap-1 font-medium text-nhan-dam hover:underline"><Download aria-hidden strokeWidth={1.7} className="h-3.5 w-3.5" />Xuất Excel</a>}
      </div>
    </div>
  );
}

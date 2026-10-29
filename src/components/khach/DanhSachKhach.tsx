"use client";

import Link from "next/link";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { O_NHAP } from "@/components/ui/dinh-dang";
import { KHOA_LOC, SAP_XEP_KHACH, TRANG_THAI_KHACH, type KhoaLoc } from "@/lib/khach";

type Dong = { id: string; ma: string; ho_ten: string; dien_thoai: string; trang_thai: string | null; hang: string | null; diem: number; nhom: { ten: string; mau: string | null }[] };
type Loc = Record<KhoaLoc, string>;
export type DanhMucLoc = { nhom: { id: string; ten: string; mau: string | null; so: number }[]; chiNhanh: LuaChon[]; tinh: { tinh: string; so: number; quan: string[] | null }[]; dichVu: string[] };
const MOI_LAN = 40;
const TAT_CA = { gia_tri: "", nhan: "Tất cả" };
const LOC_TRONG = Object.fromEntries(KHOA_LOC.map((k) => [k, ""])) as Loc;
const THANG = Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Sinh nhật tháng ${i + 1}` }));
const O_SO = `${O_NHAP} !h-9 !text-[13px] tabular-nums`;

/** Nhãn nhóm khách (SHOPPER, VIP…): chấm màu gốc SalonHero + tên, chữ vẫn đủ tương phản trên nền nhạt. */
export function NhanNhom({ ten, mau }: { ten: string; mau: string | null }) {
  return <span className="nhan-nho"><span aria-hidden className="mr-1 inline-block h-1.5 w-1.5 rounded-[2px] align-middle" style={{ backgroundColor: mau ?? "currentColor" }} />{ten}</span>;
}

/** Ô số (điểm, tuổi, doanh số): chỉ nhận chữ số. */
function OSo({ nhan, giaTri, onDoi }: { nhan: string; giaTri: string; onDoi: (v: string) => void }) {
  return <input inputMode="numeric" aria-label={nhan} placeholder={nhan} value={giaTri} onChange={(e) => onDoi(e.target.value.replace(/\D/g, "").slice(0, 12))} className={O_SO} />;
}

const theoManHinhRong = (bao: () => void) => {
  const m = window.matchMedia("(min-width: 1024px)");
  m.addEventListener("change", bao);
  return () => m.removeEventListener("change", bao);
};

/** Cột trái màn Khách hàng. Lọc/tìm/sắp xếp giữ trong bộ nhớ của khung (không nằm trên địa chỉ) nên bấm đổi khách hay đổi tab bên phải không làm mất.
 *  Lấy dữ liệu qua /api/khach/tim (kiểm quyền ở máy chủ); `moc` đổi (sau khi Thêm/Sửa khách làm mới trang) thì tải lại đúng số dòng đang hiện. */
export function DanhSachKhach({ nhanVien, nguon, hang, moc, choXuat, xemSdt = true, choGanNhom, danhMuc }: { nhanVien: LuaChon[]; nguon: LuaChon[]; hang: LuaChon[]; moc: number; choXuat: boolean; xemSdt?: boolean; choGanNhom?: boolean; danhMuc: DanhMucLoc }) {
  const sp = useSearchParams();
  const dangChon = useSelectedLayoutSegment();
  const manRong = useSyncExternalStore(theoManHinhRong, () => window.matchMedia("(min-width: 1024px)").matches, () => true);
  const hoatDong = manRong || dangChon === null;

  const [o, setO] = useState(sp.get("q") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [loc, setLoc] = useState<Loc>(() => Object.fromEntries(KHOA_LOC.map((k) => [k, sp.get(k) ?? ""])) as Loc);
  const [sx, setSx] = useState(sp.get("sx") ?? "ten");
  const [moLoc, setMoLoc] = useState(() => KHOA_LOC.some((k) => sp.get(k)));
  // Đi tới /khach-hang?… từ trang Thống kê (khung đã mở sẵn): áp bộ lọc trên địa chỉ mới.
  const [diaChiCu, setDiaChiCu] = useState(sp.toString());
  if (sp.toString() !== diaChiCu) {
    setDiaChiCu(sp.toString());
    if (KHOA_LOC.some((k) => sp.get(k))) { setLoc(Object.fromEntries(KHOA_LOC.map((k) => [k, sp.get(k) ?? ""])) as Loc); setMoLoc(true); }
  }
  const [ds, setDs] = useState<Dong[]>([]);
  const [tong, setTong] = useState(0);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const lan = useRef(0);
  const dsRef = useRef<Dong[]>([]);
  const mocCu = useRef(moc);
  const daTai = useRef("");

  // Chỉ gửi ô đã chọn: địa chỉ gọn, máy chủ không phải đọc 25 khoá rỗng.
  const thamSo = useCallback(() => new URLSearchParams(Object.entries({ q, ...loc, sx }).filter(([, v]) => v)), [q, loc, sx]);
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
    }, daTai.current ? 300 : 0); // gõ ô số/ô dịch vụ: chờ ngừng gõ rồi mới tải
    return () => clearTimeout(t);
  }, [tai, thamSo, hoatDong, moc]);

  const soLoc = Object.values(loc).filter(Boolean).length;
  const datLoc = (k: KhoaLoc, v: string) => setLoc((x) => ({ ...x, [k]: v, ...(k === "tinh" ? { quan: "" } : {}) }));
  const nhomLC = [{ gia_tri: "", nhan: "Mọi nhóm khách" }, ...danhMuc.nhom.map((n) => ({ gia_tri: n.id, nhan: `${n.ten} (${n.so.toLocaleString("vi-VN")})` })), { gia_tri: "khong", nhan: "Chưa thuộc nhóm nào" }];
  const tinhLC = [{ gia_tri: "", nhan: "Mọi tỉnh/thành" }, ...danhMuc.tinh.map((t) => ({ gia_tri: t.tinh, nhan: `${t.tinh} (${t.so.toLocaleString("vi-VN")})` }))];
  const quanLC = [{ gia_tri: "", nhan: "Mọi quận/huyện" }, ...(danhMuc.tinh.find((t) => t.tinh === loc.tinh)?.quan ?? []).map((x) => ({ gia_tri: x, nhan: x }))];
  const trangThaiLC = Object.entries(TRANG_THAI_KHACH).map(([gia_tri, v]) => ({ gia_tri, nhan: v.nhan }));
  const lienKetXuat = `/api/xuat/khach-hang?${thamSo()}`;

  return (
    <div className="ds-khach flex min-h-0 flex-1 flex-col overflow-hidden max-lg:min-h-[60dvh]">
      <div className="space-y-2 border-b border-[color:var(--khach-vien)] p-2.5">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
            <input value={o} onChange={(e) => setO(e.target.value)} placeholder="Tìm kiếm khách hàng" aria-label="Tìm kiếm khách hàng" className={`${O_NHAP} !h-9 pl-8 !text-[13px]`} />
          </div>
          <button type="button" aria-expanded={moLoc} onClick={() => setMoLoc((x) => !x)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-nho border border-vien-dam bg-giay-sang px-3 text-[13px] text-muc-2 hover:border-nhan">
            <SlidersHorizontal aria-hidden strokeWidth={1.7} className="h-4 w-4" />Lọc{soLoc > 0 && <span className="nhan-nho !bg-nhan !text-white">{soLoc}</span>}
          </button>
        </div>
        {moLoc && (
          <div role="group" aria-label="Bộ lọc khách" className="grid max-h-[55dvh] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
            <Chon nho ariaLabel="Nhóm khách" giaTri={loc.nhom} onDoi={(v) => datLoc("nhom", v)} luaChon={nhomLC} className="col-span-2" />
            <Chon nho ariaLabel="Trạng thái" trong="Trạng thái" giaTri={loc.trang_thai} onDoi={(v) => datLoc("trang_thai", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi trạng thái" }, ...trangThaiLC]} />
            <Chon nho ariaLabel="Hạng" trong="Hạng" giaTri={loc.hang} onDoi={(v) => datLoc("hang", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi hạng" }, ...hang]} />
            <Chon nho ariaLabel="Nguồn" trong="Nguồn" giaTri={loc.nguon} onDoi={(v) => datLoc("nguon", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi nguồn" }, ...nguon]} />
            <Chon nho ariaLabel="Giới tính" giaTri={loc.gioi_tinh} onDoi={(v) => datLoc("gioi_tinh", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi giới tính" }, { gia_tri: "nữ", nhan: "Nữ" }, { gia_tri: "nam", nhan: "Nam" }, { gia_tri: "chua_ro", nhan: "Chưa rõ giới tính" }]} />
            <Chon nho ariaLabel="Sinh nhật" giaTri={loc.sinh_nhat} onDoi={(v) => datLoc("sinh_nhat", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi ngày sinh" }, { gia_tri: "hom_nay", nhan: "Sinh nhật hôm nay" }, { gia_tri: "thang", nhan: "Sinh nhật tháng này" }, ...THANG]} />
            <Chon nho ariaLabel="Ngày sinh nhật" trong="Ngày sinh nhật" giaTri={loc.sinh_ngay} onDoi={(v) => datLoc("sinh_ngay", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi ngày trong tháng" }, ...Array.from({ length: 31 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Sinh nhật ngày ${i + 1}` }))]} />
            <Chon nho ariaLabel="Thẻ đang dùng" giaTri={loc.the} onDoi={(v) => datLoc("the", v)} luaChon={[{ ...TAT_CA, nhan: "Thẻ: tất cả" }, { gia_tri: "co", nhan: "Có thẻ đang dùng" }, { gia_tri: "khong", nhan: "Không có thẻ đang dùng" }]} />
            <Chon nho ariaLabel="Công nợ" giaTri={loc.no} onDoi={(v) => datLoc("no", v)} luaChon={[{ ...TAT_CA, nhan: "Nợ: tất cả" }, { gia_tri: "co", nhan: "Đang nợ" }, { gia_tri: "khong", nhan: "Không nợ" }]} />
            <Chon nho ariaLabel="Chi nhánh" giaTri={loc.chi_nhanh} onDoi={(v) => datLoc("chi_nhanh", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi chi nhánh" }, ...danhMuc.chiNhanh]} />
            <Chon nho ariaLabel="Tỉnh/thành" giaTri={loc.tinh} onDoi={(v) => datLoc("tinh", v)} luaChon={tinhLC} />
            <Chon nho ariaLabel="Quận/huyện" giaTri={loc.quan} onDoi={(v) => datLoc("quan", v)} luaChon={quanLC} voHieu={!loc.tinh} />
            <label className="col-span-2 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={loc.nhieu_cn === "1"} onChange={(e) => datLoc("nhieu_cn", e.target.checked ? "1" : "")} className="h-4 w-4 accent-nhan" />Khách đến nhiều chi nhánh</label>
            <Chon nho ariaLabel="Người phụ trách" trong="Người phụ trách" giaTri={loc.phu_trach} onDoi={(v) => datLoc("phu_trach", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi người phụ trách" }, ...nhanVien]} className="col-span-2" />
            <Chon nho ariaLabel="Nhân viên từng phục vụ" giaTri={loc.nhan_vien} onDoi={(v) => datLoc("nhan_vien", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi nhân viên phục vụ" }, ...nhanVien]} className="col-span-2" />
            <input list="ds-dich-vu-da-ban" aria-label="Dịch vụ đã dùng" placeholder="Dịch vụ đã dùng (gõ tên)" value={loc.dich_vu} onChange={(e) => datLoc("dich_vu", e.target.value.slice(0, 120))} className={`${O_SO} col-span-2`} />
            <datalist id="ds-dich-vu-da-ban">{danhMuc.dichVu.map((d) => <option key={d} value={d} />)}</datalist>
            <OSo nhan="Điểm từ" giaTri={loc.diem_tu} onDoi={(v) => datLoc("diem_tu", v)} />
            <OSo nhan="Điểm đến" giaTri={loc.diem_den} onDoi={(v) => datLoc("diem_den", v)} />
            <OSo nhan="Tuổi từ" giaTri={loc.tuoi_tu} onDoi={(v) => datLoc("tuoi_tu", v.slice(0, 3))} />
            <OSo nhan="Tuổi đến" giaTri={loc.tuoi_den} onDoi={(v) => datLoc("tuoi_den", v.slice(0, 3))} />
            <OSo nhan="Doanh số từ (đ)" giaTri={loc.ds_tu} onDoi={(v) => datLoc("ds_tu", v)} />
            <OSo nhan="Doanh số đến (đ)" giaTri={loc.ds_den} onDoi={(v) => datLoc("ds_den", v)} />
            <span className="col-span-2 text-[12px] text-muc-3">Lần cuối đến</span>
            <NgayChon ariaLabel="Lần cuối đến từ ngày" giaTri={loc.den_tu} onDoi={(v) => datLoc("den_tu", v)} tuNam={2015} />
            <NgayChon ariaLabel="Lần cuối đến tới ngày" giaTri={loc.den_den} onDoi={(v) => datLoc("den_den", v)} tuNam={2015} />
            <span className="col-span-2 text-[12px] text-muc-3">Ngày tạo hồ sơ</span>
            <NgayChon ariaLabel="Ngày tạo từ" giaTri={loc.tao_tu} onDoi={(v) => datLoc("tao_tu", v)} tuNam={2015} />
            <NgayChon ariaLabel="Ngày tạo đến" giaTri={loc.tao_den} onDoi={(v) => datLoc("tao_den", v)} tuNam={2015} />
            <div className="col-span-2 flex items-center gap-2">
              <span className="shrink-0">Sắp xếp</span>
              <Chon nho ariaLabel="Sắp xếp" giaTri={sx} onDoi={setSx} luaChon={SAP_XEP_KHACH} className="min-w-0 flex-1" />
              {soLoc > 0 && <button type="button" className="shrink-0 text-[13px] font-medium text-nhan-dam hover:underline" onClick={() => setLoc(LOC_TRONG)}>Bỏ lọc</button>}
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
                <span className="tabular-nums">{xemSdt ? `${r.dien_thoai} – ${r.ma}` : r.ma}</span>
                <span className="flex gap-1">{tt && <span className="nhan-nho">{tt.nhan}</span>}{r.hang && <span className="nhan-nho">{r.hang}</span>}</span>
              </span>
              {(r.nhom.length > 0 || r.diem !== 0) && (
                <span className="mt-1 flex flex-wrap items-center gap-1">
                  {r.nhom.map((n) => <NhanNhom key={n.ten} ten={n.ten} mau={n.mau} />)}
                  {r.diem !== 0 && <span className="text-[11px] tabular-nums">{r.diem.toLocaleString("vi-VN")} điểm</span>}
                </span>
              )}
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
        {choGanNhom && <Link href={`/khach-hang/nhom?${thamSo()}`} className="font-medium text-nhan-dam hover:underline">Gán nhóm</Link>}
        {choXuat && <a href={lienKetXuat} download className="flex items-center gap-1 font-medium text-nhan-dam hover:underline"><Download aria-hidden strokeWidth={1.7} className="h-3.5 w-3.5" />Xuất Excel</a>}
      </div>
    </div>
  );
}

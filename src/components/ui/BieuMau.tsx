"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "./Hop";
import { Chon, type LuaChon } from "./Chon";
import { NgayChon } from "./NgayChon";
import { OTien } from "./OTien";
import { Gat } from "./Gat";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG, CHON_HET } from "./dinh-dang";
import { NutTraCuuMst } from "@/components/ui/NutTraCuuMst";

export type Truong = {
  ten: string;
  nhan: string;
  loai: "chu" | "so" | "tien" | "chon" | "ngay" | "gio" | "nhieu_dong" | "gat" | "nhieu" | "mat_khau" | "mat_khau_an" | "email";
  luaChon?: LuaChon[];
  batBuoc?: boolean;
  goiY?: string;
  rong?: boolean;
  chiKhiTao?: boolean;
  /** Dòng chú thích nhỏ dưới ô nhập (thay cho việc nhét hướng dẫn vào nhãn làm nhãn dài, lệch hàng). */
  ghiChu?: string;
  /** Chỉ hiện (và chỉ gửi) khi ô `ten` đang có một trong các giá trị `la`. */
  hienKhi?: { ten: string; la: string[] };
  /** Ô giờ (loai "gio"): chọn trong danh sách khung giờ cố định, mặc định 05:00–22:00 cách nhau 15 phút. */
  tuGio?: string; denGio?: string; buocPhut?: number;
  /** Ô chọn (loai "chon") lấy danh mục địa bàn như SalonHero (public/dia-ban.json): "tinh" = tỉnh/thành; { theoTinh } = phường/xã của tỉnh đang chọn ở ô đó. */
  diaBan?: "tinh" | { theoTinh: string };
  /** Ô mã số thuế có nút "Tra cứu MST" như SalonHero: tra được thì điền tên vào ô `ten`, địa chỉ vào ô `diaChi` (nếu có). */
  traCuuMst?: { ten: string; diaChi?: string };
};
/** Danh mục tỉnh/thành → phường/xã (danh sách SalonHero đang dùng: 34 tỉnh sau sáp nhập 2025 + 29 tỉnh cũ). Tải một lần khi biểu mẫu có ô địa bàn. */
let diaBanCache: Promise<Map<string, string[]>> | null = null;
const taiDiaBan = () => (diaBanCache ??= fetch("/dia-ban.json").then((r) => r.json()).then((j: { tinh: [string, string[]][] }) => new Map(j.tinh)).catch(() => { diaBanCache = null; return new Map<string, string[]>(); }));
function luaChonDiaBan(t: Truong, v: Record<string, unknown>, db: Map<string, string[]> | null): LuaChon[] {
  if (!t.diaBan) return t.luaChon ?? [];
  const ds = !db ? [] : t.diaBan === "tinh" ? [...db.keys()] : db.get(String(v[t.diaBan.theoTinh] ?? "")) ?? [];
  const gt = String(v[t.ten] ?? "");
  // Giá trị đã lưu không có trong danh mục (dữ liệu cũ nhập tay) vẫn hiện để không mất khi sửa.
  return [{ gia_tri: "", nhan: "Chưa chọn" }, ...(gt && !ds.includes(gt) ? [gt] : []).concat(ds).map((x) => ({ gia_tri: x, nhan: x }))];
}
const gioSlot = (tu = "05:00", den = "22:00", buoc = 15): LuaChon[] => {
  const ra: LuaChon[] = [], phut = (g: string) => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
  for (let m = phut(tu); m <= phut(den); m += buoc) { const g = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; ra.push({ gia_tri: g, nhan: g }); }
  return ra;
};
/** Nhãn dài có phần trong ngoặc ("Số ngày (nghỉ nửa ngày: 0,5…)") được tách: nhãn gọn một dòng + chú thích nhỏ bên dưới, để các ô cùng hàng luôn thẳng nhau. */
const tachNhan = (t: Truong): { nhan: string; ghiChu?: string } => {
  const m = !t.ghiChu && t.nhan.length > 26 ? /^(.{3,}?)\s*\((.{6,})\)\s*$/.exec(t.nhan) : null;
  return m ? { nhan: m[1], ghiChu: m[2].charAt(0).toUpperCase() + m[2].slice(1) } : { nhan: t.nhan, ghiChu: t.ghiChu };
};
const hien = (t: Truong, v: Record<string, unknown>) => !t.hienKhi || t.hienKhi.la.includes(String(v[t.hienKhi.ten] ?? ""));
export type GiaTri = Record<string, string | number | boolean | string[] | null | undefined>;
export type KetQuaHD = { ok?: boolean; loi?: string; [k: string]: unknown };
/** Thông tin tính sẵn theo lựa chọn hiện tại trong biểu mẫu (vd: người này còn bao nhiêu ngày phép). */
export type ThongTinDong = { chu: string; kieu?: "tot" | "cho" | "loi" };
export type ThongTinBieuMau = { theoDoi: string[]; lay: (fd: FormData) => Promise<{ dong?: ThongTinDong[] } | void> };

export function ONhieu({ luaChon, giaTri, onDoi }: { luaChon: LuaChon[]; giaTri: string[]; onDoi: (v: string[]) => void }) {
  const [tim, setTim] = useState("");
  const ds = luaChon.filter((l) => l.nhan.toLowerCase().includes(tim.toLowerCase()));
  return (
    <div className="rounded-nho border border-vien-dam bg-giay-sang">
      <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm nhanh" className="h-10 w-full border-b border-vien bg-transparent px-3 text-[14px] outline-none" />
      <ul className="max-h-44 overflow-y-auto py-1">
        {ds.map((l) => {
          const bat = giaTri.includes(l.gia_tri);
          return (
            <li key={l.gia_tri}>
              <button type="button" role="checkbox" aria-checked={bat} onClick={() => onDoi(bat ? giaTri.filter((x) => x !== l.gia_tri) : [...giaTri, l.gia_tri])}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[14px] hover:bg-giay-tram">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[11px] leading-none ${bat ? "border-nhan bg-nhan text-white" : "border-vien-dam"}`}>{bat ? "✓" : ""}</span>
                <span className="truncate">{l.nhan}</span>
              </button>
            </li>
          );
        })}
        {ds.length === 0 && <li className="px-3 py-2 text-[13px] text-muc-3">Không có mục nào.</li>}
      </ul>
      <div className="border-t border-vien px-3 py-1.5 text-[12px] text-muc-3">Đã chọn {giaTri.length}</div>
    </div>
  );
}

/** Nút mở hộp thoại biểu mẫu. Không dùng <form> submit (tránh lỗi mất phiên của Server Action trên trang đã đăng nhập): gom giá trị vào FormData rồi gọi action. */
export function NutHop({
  nhan, tieuDe, moTa, truong = [], giaTri = {}, an = {}, action, kieu = "chinh", rong, nhanLuu = "Lưu", xacNhan, nguy, thongTin,
}: {
  thongTin?: ThongTinBieuMau;
  nhan: string; tieuDe: string; moTa?: string; truong?: Truong[]; giaTri?: GiaTri; an?: Record<string, string>;
  action: (fd: FormData) => Promise<KetQuaHD | void>; kieu?: "chinh" | "phu" | "chu"; rong?: boolean; nhanLuu?: string; xacNhan?: string; nguy?: boolean;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [v, setV] = useState<GiaTri>(giaTri);
  const laTao = !giaTri.id;
  const [dongTin, setDongTin] = useState<ThongTinDong[]>([]);
  const lanTin = useRef(0);
  /** Hỏi máy chủ thông tin theo lựa chọn hiện tại; bỏ qua kết quả cũ nếu người dùng đã đổi tiếp. */
  const hoiTin = (gt: GiaTri) => {
    if (!thongTin) return;
    const lan = ++lanTin.current;
    const fd = new FormData();
    for (const [k, x] of Object.entries(an)) fd.set(k, x);
    for (const k of thongTin.theoDoi) fd.set(k, gt[k] == null ? "" : String(gt[k]));
    thongTin.lay(fd).then((kq) => { if (lan === lanTin.current) setDongTin((kq && kq.dong) || []); }).catch(() => { if (lan === lanTin.current) setDongTin([]); });
  };
  const [diaBan, setDiaBan] = useState<Map<string, string[]> | null>(null);
  const coDiaBan = truong.some((t) => t.diaBan);
  const dat = (ten: string, gt: GiaTri[string]) => {
    const moi = { ...v, [ten]: gt };
    // Đổi tỉnh/thành thì bỏ phường/xã đã chọn của tỉnh cũ.
    for (const t of truong) if (t.diaBan && t.diaBan !== "tinh" && t.diaBan.theoTinh === ten && gt !== v[ten]) moi[t.ten] = "";
    setV(moi);
    if (thongTin?.theoDoi.includes(ten)) hoiTin(moi);
  };

  const gui = () => {
    setLoi("");
    for (const t of truong) {
      if ((t.chiKhiTao && !laTao) || !hien(t, v)) continue;
      const gt = v[t.ten];
      if (t.batBuoc && (gt === undefined || gt === null || gt === "" || (Array.isArray(gt) && gt.length === 0))) {
        setLoi(`Chưa nhập: ${t.nhan}.`);
        return;
      }
    }
    const fd = new FormData();
    for (const [k, x] of Object.entries(an)) fd.set(k, x);
    if (giaTri.id) fd.set("id", String(giaTri.id));
    for (const t of truong) {
      if (!hien(t, v)) continue;
      const gt = v[t.ten];
      if (Array.isArray(gt)) gt.forEach((x) => fd.append(t.ten, x));
      else if (typeof gt === "boolean") fd.set(t.ten, gt ? "1" : "0");
      else fd.set(t.ten, gt == null ? "" : t.loai === "gio" ? String(gt).slice(0, 5) : String(gt));
    }
    bat(async () => {
      const kq = await action(fd);
      if (kq && kq.loi) setLoi(kq.loi);
      else {
        if (kq && typeof kq.canhBao === "string") window.alert(kq.canhBao);
        setMo(false);
        router.refresh();
      }
    });
  };

  const lopNut = kieu === "chinh" ? NUT_CHINH : kieu === "phu" ? NUT_PHU : nguy ? NUT_CHU_NGUY : NUT_CHU;
  return (
    <>
      <button type="button" className={lopNut} onClick={() => { setV(giaTri); setLoi(""); setDongTin([]); setMo(true); hoiTin(giaTri); if (coDiaBan && !diaBan) void taiDiaBan().then(setDiaBan); }}>{nhan}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={tieuDe} moTa={moTa} rong={rong ? "rong" : "vua"}>
        {xacNhan && <p className="mb-4 text-[14px] text-muc-2">{xacNhan}</p>}
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          {truong.filter((t) => (!t.chiKhiTao || laTao) && hien(t, v)).map((t) => {
            const gt = v[t.ten];
            const id = `f-${t.ten}`;
            const { nhan: nhanO, ghiChu: ghiChuO } = tachNhan(t);
            return (
              <div key={t.ten} className={t.rong || t.loai === "nhieu_dong" || t.loai === "nhieu" ? "sm:col-span-2" : ""}>
                {t.loai !== "gat" && <label htmlFor={id} className={NHAN_O}>{nhanO}{t.batBuoc && <span className="text-loi"> *</span>}</label>}
                {t.loai === "chu" && <input id={id} value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value)} placeholder={t.goiY} className={O_NHAP} autoComplete="off" />}
                {t.loai === "email" && <input id={id} type="email" value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value)} placeholder={t.goiY} className={O_NHAP} autoComplete="off" />}
                {t.loai === "mat_khau" && <input id={id} type="text" value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value)} placeholder={t.goiY} className={O_NHAP} autoComplete="off" />}
                {t.loai === "mat_khau_an" && <input id={id} type="password" value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value)} className={O_NHAP} autoComplete="new-password" />}
                {t.loai === "so" && <input id={id} inputMode="decimal" {...CHON_HET} value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value.replace(/[^\d.,-]/g, ""))} placeholder={t.goiY} className={`${O_NHAP} text-right tabular-nums`} autoComplete="off" />}
                {t.loai === "tien" && <OTien id={id} giaTriMacDinh={Number(gt) || 0} onDoi={(n) => dat(t.ten, n)} />}
                {t.loai === "chon" && <Chon id={id} luaChon={luaChonDiaBan(t, v, diaBan)} giaTri={String(gt ?? "")} onDoi={(x) => dat(t.ten, x)} trong={t.goiY ?? "Chọn"} />}
                {t.loai === "ngay" && <NgayChon id={id} giaTri={String(gt ?? "")} onDoi={(x) => dat(t.ten, x)} />}
                {t.loai === "gio" && <Chon id={id} luaChon={[{ gia_tri: "", nhan: "Chưa chọn" }, ...gioSlot(t.tuGio, t.denGio, t.buocPhut)]} giaTri={String(gt ?? "").slice(0, 5)} onDoi={(x) => dat(t.ten, x)} trong={t.goiY ?? "Chọn giờ"} />}
                {t.loai === "nhieu_dong" && <textarea id={id} value={String(gt ?? "")} onChange={(e) => dat(t.ten, e.target.value)} placeholder={t.goiY} className={O_NHIEU_DONG} />}
                {t.loai === "gat" && <Gat nhan={t.nhan} giaTriMacDinh={!!gt} onDoi={(x) => dat(t.ten, x)} />}
                {t.loai === "nhieu" && <ONhieu luaChon={t.luaChon ?? []} giaTri={Array.isArray(gt) ? gt : []} onDoi={(x) => dat(t.ten, x)} />}
                {t.traCuuMst && <NutTraCuuMst mst={String(gt ?? "")} onKetQua={(kq) => { const m = t.traCuuMst!; setV((cu) => ({ ...cu, [m.ten]: kq.ten, ...(m.diaChi && kq.diaChi ? { [m.diaChi]: kq.diaChi } : {}) })); }} />}
                {ghiChuO && <p className="mt-1.5 text-[12px] leading-snug text-muc-3">{ghiChuO}</p>}
              </div>
            );
          })}
        </div>
        {dongTin.length > 0 && (
          <ul className="mt-4 space-y-1.5 rounded-nho border border-vien bg-giay-tram px-3.5 py-3 text-[13.5px]" aria-live="polite">
            {dongTin.map((d, i) => <li key={i} className={d.kieu === "loi" ? "text-loi" : d.kieu === "cho" ? "text-canh-bao" : "text-muc-2"}>{d.chu}</li>)}
          </ul>
        )}
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : nhanLuu}</button>
        </div>
      </Hop>
    </>
  );
}

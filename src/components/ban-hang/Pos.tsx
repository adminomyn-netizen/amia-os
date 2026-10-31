"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CreditCard, Minus, Package, Plus, Search, ShoppingBag, Sparkles, Ticket, Trash2, UserRound, X } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { OTien } from "@/components/ui/OTien";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG, CHON_HET } from "@/components/ui/dinh-dang";
import { tienVN } from "@/lib/dinh-dang";
import { chiaDeuTi, chiaDoanhThuNguoiHuong, GIOI_HAN_VOUCHER, KENH_MAN_HINH_KHACH, khopMuc, lamTron, PHUONG_THUC, dsNganHangNhan, nganHangChonSan, tinhDon, tinhGiamVoucher, TOI_DA_NGUOI_HUONG, VAI, type DonChoKhach, type DongDon, type KhoanThu, type MucBan, type TaiKhoanNhan, type Vai } from "@/lib/ban-hang";
import { ChonKhach, type KhachChon } from "@/components/khach/ChonKhach";
import type { VoucherTim } from "@/lib/voucher";
import { HopVoucher } from "./HopVoucher";
import type { chotDonBanHang, dsDonNhap, dsVoucher, layDiemKhach, layTheKhach, layTheTien, layVoucher, luuDonNhap, timKhach, xoaDonNhap, DonNhapRut } from "@/app/(app)/ban-hang/actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

type Nv = { id: string; ten: string; vaiTro: string };
type TheKh = { id: string; ma: string; loai: "lan" | "tien"; ten: string; buoiCon: number; buoiTong: number | null; soDu: number; han: string | null };
type TheTien = { id: string; ma: string; soDu: number };
/** Màu theo nhóm hàng (ổn định theo tên nhóm) lấy từ bảng màu thương hiệu: nhìn là phân biệt được nhóm, không còn một màu trắng đơn điệu. Cả sáng lẫn tối. */
const SAC = [
  { vien: "border-l-sac-luc", chip: "bg-sac-luc-nen text-sac-luc", gia: "text-sac-luc", cham: "bg-sac-luc" },
  { vien: "border-l-sac-xanh", chip: "bg-sac-xanh-nen text-sac-xanh", gia: "text-sac-xanh", cham: "bg-sac-xanh" },
  { vien: "border-l-sac-tim", chip: "bg-sac-tim-nen text-sac-tim", gia: "text-sac-tim", cham: "bg-sac-tim" },
  { vien: "border-l-sac-cam", chip: "bg-sac-cam-nen text-sac-cam", gia: "text-sac-cam", cham: "bg-sac-cam" },
  { vien: "border-l-sac-hong", chip: "bg-sac-hong-nen text-sac-hong", gia: "text-sac-hong", cham: "bg-sac-hong" },
] as const;
const sacCua = (nhom: string) => SAC[[...nhom].reduce((t, c) => t + c.charCodeAt(0), 0) % SAC.length];
const BIEU_TUONG = { dich_vu: Sparkles, goi_the: CreditCard, san_pham: Package } as const;
const LOAI_TAB = [{ ma: "dich_vu", ten: "Dịch vụ" }, { ma: "goi_the", ten: "Thẻ và liệu trình" }, { ma: "san_pham", ten: "Sản phẩm" }] as const;
const khoaDong = (d: { loai: string; ref: string }) => `${d.loai}:${d.ref}`;

type PropsPos = {
  muc: MucBan[]; nhanVien: Nv[]; khachBanDau: KhachChon | null; dongBanDau: DongDon[]; chiNhanhId: string; chiNhanh: { id: string; ten: string }[]; khoaChiNhanh: boolean; lichId: string | null; choGiam?: boolean; choTip?: boolean; thuNgan?: string; nguonLich?: string; taiKhoanNhan?: TaiKhoanNhan[];
  tim: typeof timKhach; layThe: typeof layTheTien; choThanhToan?: number | null; denNgay?: string; layDiem: typeof layDiemKhach; layTheKh: typeof layTheKhach; chot: typeof chotDonBanHang; voucher: typeof layVoucher; dsVoucher: typeof dsVoucher; luuNhap: typeof luuDonNhap; dsNhap: typeof dsDonNhap; xoaNhap: typeof xoaDonNhap; nhapBanDau?: DonNhapRut[];
};
type Tab = { k: number; ten: string; soDong: number; nhap?: DonNhapRut };
const TOI_DA_DON = 8;

/** Màn Thu ngân: mở nhiều đơn song song (như SalonHero), mỗi đơn một tab giữ nguyên trạng thái khi chuyển qua lại.
 *  Chốt xong một đơn chỉ đóng tab đó, các đơn khác vẫn còn. Lịch hẹn / khách truyền từ URL chỉ vào đơn đầu tiên. */
export function Pos(props: PropsPos) {
  const [ds, setDs] = useState<Tab[]>([{ k: 1, ten: "", soDong: props.dongBanDau.length }]);
  const [dangXem, setDangXem] = useState(1);
  const dem = useRef(1);
  const [xong, setXong] = useState<{ id: string; ma: string } | null>(null);
  // Đơn nháp lưu trên máy chủ (như SalonHero): mở lại ở tab mới, tải lại trang hay đổi máy không mất.
  const [nhap, setNhap] = useState<DonNhapRut[]>(props.nhapBanDau ?? []);
  const [moNhap, setMoNhap] = useState(false);
  const lamMoiNhap = useCallback(() => { void props.dsNhap().then(setNhap).catch(() => undefined); }, [props]);
  const nutTab = useRef(new Map<number, HTMLButtonElement | null>());
  // Màn hình khách: đơn đang xem được phát qua BroadcastChannel cho cửa sổ phụ; cửa sổ mới mở thì hỏi lại ("hoi") và nhận bản mới nhất.
  const kenh = useRef<BroadcastChannel | null>(null);
  const donCuoi = useRef<DonChoKhach | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel(KENH_MAN_HINH_KHACH);
    kenh.current = c;
    c.onmessage = (e: MessageEvent<{ loai: string }>) => { if (e.data?.loai === "hoi") c.postMessage({ loai: "don", don: donCuoi.current }); };
    return () => { c.close(); kenh.current = null; };
  }, []);
  const guiManHinhKhach = useCallback((d: DonChoKhach | null) => { donCuoi.current = d; kenh.current?.postMessage({ loai: "don", don: d }); }, []);
  // Màn hẹp: dải tab cuộn ngang, luôn kéo tab đang xem vào tầm nhìn (vd vừa bấm Thêm đơn).
  useEffect(() => { nutTab.current.get(dangXem)?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [dangXem]);
  const them = () => {
    if (ds.length >= TOI_DA_DON) return;
    dem.current += 1;
    const k = dem.current;
    setDs((x) => [...x, { k, ten: "", soDong: 0 }]);
    setDangXem(k);
  };
  const moLaiNhap = (n: DonNhapRut) => {
    const dangMo = ds.find((t) => t.nhap?.id === n.id);
    if (dangMo) { setDangXem(dangMo.k); setMoNhap(false); return; }
    if (ds.length >= TOI_DA_DON) { window.alert(`Đang mở ${TOI_DA_DON} đơn. Đóng bớt một đơn rồi mở đơn nháp.`); return; }
    dem.current += 1;
    const k = dem.current;
    setDs((x) => [...x, { k, ten: n.khach?.ho_ten ?? "", soDong: n.dong.length, nhap: n }]);
    setDangXem(k);
    setMoNhap(false);
  };
  const xoaMotNhap = (n: DonNhapRut) => {
    if (!window.confirm(`Xoá đơn nháp${n.khach ? ` của ${n.khach.ho_ten}` : ""}?`)) return;
    void props.xoaNhap(n.id).then((r) => { if ("loi" in r && r.loi) window.alert(r.loi); else lamMoiNhap(); });
  };
  const dong = (k: number) => {
    const t = ds.find((x) => x.k === k);
    if (t && t.soDong > 0 && !window.confirm(`Đóng ${t.ten || "đơn này"}? Các dòng chưa chốt sẽ mất.`)) return;
    bo(k);
  };
  // Dạng hàm cập nhật: chốt đơn chạy bất đồng bộ, trong lúc chờ có thể đã mở thêm đơn khác.
  const bo = (k: number) => {
    const moi = dem.current + 1;
    setDs((x) => {
      const i = x.findIndex((t) => t.k === k);
      const con = x.filter((t) => t.k !== k);
      if (!con.length) con.push({ k: moi, ten: "", soDong: 0 });
      setDangXem((d) => (d === k || !con.some((t) => t.k === d) ? (con[Math.max(0, i - 1)] ?? con[0]).k : d));
      return con;
    });
    dem.current = moi;
  };
  // Ổn định (useCallback) và không đổi mảng khi không có gì mới, để hiệu ứng báo tên/số dòng của từng đơn không lặp vô hạn.
  const capNhat = useCallback((k: number, ten: string, soDong: number) => setDs((x) => (x.some((t) => t.k === k && (t.ten !== ten || t.soDong !== soDong)) ? x.map((t) => (t.k === k ? { ...t, ten, soDong } : t)) : x)), []);
  const banPhim = (e: React.KeyboardEvent, i: number) => {
    const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? ds.length - 1 : -2;
    if (j === -2) return;
    e.preventDefault();
    const t = ds[(j + ds.length) % ds.length];
    setDangXem(t.k);
    nutTab.current.get(t.k)?.focus();
  };
  // Nút "Hủy đơn" như SalonHero: bỏ cả đơn đang mở (đơn duy nhất thì dựng lại đơn trống), có hỏi lại khi đã có dòng; bỏ ?lich=&khach= khỏi địa chỉ.
  const huyDon = (k: number) => {
    const t = ds.find((x) => x.k === k);
    if (t && t.soDong > 0 && !window.confirm(`Hủy ${t.ten || "đơn này"}? Toàn bộ dòng đã chọn sẽ mất.`)) return;
    bo(k);
    if (window.location.search) window.history.replaceState(null, "", "/ban-hang");
  };
  const nhanTab = (t: Tab, i: number) => t.ten || `Đơn ${i + 1}`;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 border-b border-vien">
        <div role="tablist" aria-label="Các đơn đang mở" className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {ds.map((t, i) => (
            <span key={t.k} className={`flex shrink-0 items-center rounded-t-nho border border-b-0 ${t.k === dangXem ? "border-vien bg-giay-sang" : "border-transparent"}`}>
              <button type="button" role="tab" id={`don-tab-${t.k}`} aria-controls={`don-${t.k}`} aria-selected={t.k === dangXem} tabIndex={t.k === dangXem ? 0 : -1}
                ref={(el) => { nutTab.current.set(t.k, el); }} onClick={() => setDangXem(t.k)} onKeyDown={(e) => banPhim(e, i)}
                className={`max-w-[160px] truncate py-2.5 pl-3 pr-1 text-[14px] ${t.k === dangXem ? "font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>
                {nhanTab(t, i)}{t.soDong > 0 && <span className="ml-1 text-[12px] text-muc-3">({t.soDong})</span>}
              </button>
              <button type="button" aria-label={`Đóng ${nhanTab(t, i)}`} onClick={() => dong(t.k)} className="p-2 text-muc-3 hover:text-loi"><X strokeWidth={1.6} className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
        <button type="button" onClick={them} disabled={ds.length >= TOI_DA_DON} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU} disabled:opacity-40`} aria-label="Mở thêm một đơn mới">
          <Plus strokeWidth={1.8} className="h-4 w-4" />Thêm đơn
        </button>
        <Link href="/hoa-don" className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>Danh sách đơn hàng</Link>
        <button type="button" onClick={() => { setMoNhap((v) => !v); lamMoiNhap(); }} aria-expanded={moNhap} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>
          Đơn nháp<span className="rounded-tag bg-giay-tram px-1.5 text-[12px] font-medium tabular-nums text-muc-2">{nhap.length}</span>
        </button>
        <button type="button" onClick={() => window.open("/man-hinh-khach", "amia-man-hinh-khach", "popup,width=960,height=720")} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>Màn hình khách</button>
        {props.choThanhToan != null && (
          <Link href={`/hoa-don?no=1&tu=2018-01-01&den=${props.denNgay ?? ""}`} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>Chờ thanh toán<span className={`rounded-tag px-1.5 text-[12px] font-medium tabular-nums ${props.choThanhToan > 0 ? "bg-canh-bao-nen text-canh-bao" : "bg-giay-tram text-muc-3"}`}>{props.choThanhToan}</span></Link>
        )}
      </div>
      {moNhap && (
        <div className="mb-4 rounded-nho border border-vien bg-giay-sang p-3">
          <p className="mb-2 text-[13px] text-muc-3">Đơn nháp của bạn (lưu trên máy chủ). Chốt đơn xong thì nháp tự mất.</p>
          {nhap.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có đơn nháp nào.</p> : (
            <ul className="divide-y divide-vien">
              {nhap.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[14px]">
                  <span><span className="text-muc">{n.khach?.ho_ten ?? "Khách lẻ"}</span> <span className="text-muc-3">· {n.dong.length} dòng · {new Date(n.capNhat).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></span>
                  <span className="flex gap-4"><button type="button" onClick={() => moLaiNhap(n)} className={NUT_CHU}>Mở</button><button type="button" onClick={() => xoaMotNhap(n)} className="text-loi hover:underline">Xoá</button></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {xong && (
        <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">
          <span>Đã chốt đơn {xong.ma}.</span>
          <span className="flex gap-4"><Link href={`/hoa-don/${xong.id}`} className="font-medium underline">Xem hoá đơn</Link><Link href={`/in/hoa-don/${xong.id}`} target="_blank" className="font-medium underline">In</Link></span>
        </p>
      )}
      {ds.map((t, i) => (
        <div key={t.k} role="tabpanel" id={`don-${t.k}`} aria-labelledby={`don-tab-${t.k}`} hidden={t.k !== dangXem}>
          <DonPos {...props} k={t.k} nhapDau={t.nhap} onNhap={lamMoiNhap} dauTien={i === 0 && t.k === 1 && !t.nhap} dangXem={t.k === dangXem} onDonChoKhach={guiManHinhKhach} onDoi={capNhat} onHuy={() => huyDon(t.k)}
            onXong={(kq) => {
              setXong(kq); bo(t.k); guiManHinhKhach(null);
              // Bỏ ?lich=&khach= khỏi địa chỉ: tải lại trang không dựng lại đơn vừa chốt (không dùng router.push để giữ các đơn khác).
              if (window.location.search) window.history.replaceState(null, "", "/ban-hang");
            }} />
        </div>
      ))}
    </div>
  );
}

/** Một đơn. Dựng đơn trong trình duyệt, gửi MỘT lần lên máy chủ; máy chủ tự đọc lại giá từ danh mục và chốt trong một giao dịch. */
/** Dải thông tin đơn như SalonHero: nguồn đặt lịch, ngày hoá đơn, giờ vào, nhân viên thu ngân, thẻ của khách. */
function ThongTinDon({ thuNgan, nguonLich, khach, coTheTien, coTheDichVu, hang }: { thuNgan: string; nguonLich: string; khach: KhachChon | null; coTheTien: boolean; coTheDichVu: boolean; hang: string }) {
  const [vao] = useState(() => new Date());
  const gio = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
  const ngay = vao.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  const muc: [string, string][] = [["Ngày hoá đơn", `${gio(vao)} ${ngay}`], ["Giờ vào", gio(vao)]];
  if (nguonLich) muc.unshift(["Đặt lịch từ", nguonLich]);
  if (thuNgan) muc.push(["Nhân viên thu ngân", thuNgan]);
  return (
    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
      {muc.map(([n, v]) => <div key={n} className="flex gap-1.5"><dt className="text-muc-3">{n}:</dt><dd className="font-medium text-muc">{v}</dd></div>)}
      {khach && hang && <div><dd className="rounded-tag bg-sac-cam-nen px-2 py-0.5 text-[12px] font-medium text-sac-cam">Hạng {hang}</dd></div>}
      {khach && coTheDichVu && <div><dd className="rounded-tag bg-sac-xanh-nen px-2 py-0.5 text-[12px] font-medium text-sac-xanh">Có thẻ dịch vụ</dd></div>}
      {khach && coTheTien && <div><dd className="rounded-tag bg-sac-luc-nen px-2 py-0.5 text-[12px] font-medium text-sac-luc">Có thẻ tiền</dd></div>}
    </dl>
  );
}

/** Hai danh sách thẻ như SalonHero: "Thẻ khách đang có" (liệu trình còn buổi, thẻ tiền còn số dư) và "Thẻ bán cho khách hàng" (thẻ đang nằm trong đơn này). */
function TheCuaKhach({ the, theBan }: { the: TheKh[] | null; theBan: { ten: string; sl: number }[] }) {
  if (the === null && theBan.length === 0) return null;
  const han = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
      <div className="rounded-nho border border-vien px-3 py-2.5">
        <p className="mb-1.5 font-semibold text-muc">Thẻ khách đang có</p>
        {the === null ? <p className="text-muc-3">Đang tải</p> : the.length === 0 ? <p className="text-muc-3">Khách chưa có thẻ nào còn dùng được.</p> : (
          <ul className="space-y-1.5">
            {the.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3"><span className="min-w-0 text-muc-2">{t.ten} <span className="text-muc-3">{t.ma}</span>{t.han && <span className="block text-[12px] text-muc-3">Hạn {han(t.han)}</span>}</span>
                <span className="shrink-0 font-medium tabular-nums text-muc">{t.loai === "lan" ? `${t.buoiCon}${t.buoiTong ? `/${t.buoiTong}` : ""} buổi` : tienVN(t.soDu)}</span></li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-nho border border-vien px-3 py-2.5">
        <p className="mb-1.5 font-semibold text-muc">Thẻ bán cho khách hàng</p>
        {theBan.length === 0 ? <p className="text-muc-3">Đơn này chưa bán thẻ nào.</p> : (
          <ul className="space-y-1.5">{theBan.map((t, i) => <li key={i} className="flex justify-between gap-3 text-muc-2"><span className="min-w-0">{t.ten}</span><span className="shrink-0 tabular-nums text-muc">x{t.sl}</span></li>)}</ul>
        )}
      </div>
    </div>
  );
}

function DonPos({ muc, nhanVien, khachBanDau, dongBanDau, chiNhanhId, chiNhanh, khoaChiNhanh, lichId: lichGoc, choGiam = true, choTip = true, thuNgan = "", nguonLich = "", taiKhoanNhan = [], tim, layThe, layDiem, layTheKh, chot, voucher, dsVoucher: dsVc, luuNhap, xoaNhap, k, nhapDau, onNhap, dauTien, dangXem, onDonChoKhach, onDoi, onXong, onHuy }: PropsPos & {
  k: number; nhapDau?: DonNhapRut; onNhap: () => void; dauTien: boolean; dangXem: boolean; onDonChoKhach: (d: DonChoKhach) => void; onDoi: (k: number, ten: string, soDong: number) => void; onXong: (kq: { id: string; ma: string }) => void; onHuy: () => void;
}) {
  const lichId = dauTien ? lichGoc : null;
  const [dang, bat] = useTransition();
  const [khach, setKhach] = useState<KhachChon | null>(nhapDau ? nhapDau.khach : dauTien ? khachBanDau : null);
  const [nhapId, setNhapId] = useState<string | null>(nhapDau?.id ?? null);
  const [tinNhap, setTinNhap] = useState("");
  const [cnId, setCnId] = useState(chiNhanhId);
  // Ngân hàng nhận tiền của khoản chuyển khoản / quẹt thẻ: chọn sẵn ngân hàng lần trước (nhớ trong trình duyệt), đổi một chạm.
  const KHOA_NH = "amia-pos-ngan-hang-";
  const doc = (pt: string) => { try { return localStorage.getItem(KHOA_NH + pt); } catch { return null; } };
  const ghiNho = (pt: string, v: string) => { try { localStorage.setItem(KHOA_NH + pt, v); } catch { /* trình duyệt chặn lưu: bỏ qua */ } };
  const dsNh = (pt: string) => dsNganHangNhan(taiKhoanNhan, cnId, pt);
  const nhMacDinh = (pt: string) => nganHangChonSan(dsNh(pt), doc(pt));
  const [tab, setTab] = useState<MucBan["loai"]>("dich_vu");
  const [tu, setTu] = useState("");
  const [sapXep, setSapXep] = useState<"ten" | "gia_tang" | "gia_giam" | "moi_nhat">("ten");
  const [dong, setDong] = useState<DongDon[]>(nhapDau ? nhapDau.dong : dauTien ? dongBanDau : []);
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
  const [diemTai, setDiemTai] = useState<{ khachId: string; soDu: number; bat: boolean; tienMoiDiem: number } | null>(null);
  const [diemNhap, setDiemNhap] = useState("");
  const [moVc, setMoVc] = useState(false);
  const [moHh, setMoHh] = useState(false);
  const [theKh, setTheKh] = useState<{ khachId: string; hang: string; the: TheKh[] } | null>(null);
  const [vc, setVc] = useState<VoucherTim | null>(null);

  const tuMuc = useMemo(() => new Map(muc.map((m) => [khoaDong({ loai: m.loai, ref: m.id }), m])), [muc]);
  useEffect(() => {
    if (!khach) return;
    let con = true;
    layThe(khach.id).then((r) => con && setTheTien(r));
    layDiem(khach.id).then((r) => con && setDiemTai(r ? { khachId: khach.id, ...r } : null));
    layTheKh(khach.id).then((r) => con && setTheKh(r ? { khachId: khach.id, ...r } : null));
    return () => { con = false; };
  }, [khach, layThe, layDiem, layTheKh]);
  useEffect(() => { onDoi(k, khach?.ho_ten ?? "", dong.length); }, [k, khach, dong.length, onDoi]);

  const theTien = khach ? theTienTai : [];
  const theKhach = khach && theKh?.khachId === khach.id ? theKh : null;
  const theBan = dong.filter((d) => d.loai === "goi_the").map((d) => ({ ten: tuMuc.get(khoaDong(d))?.ten ?? "Thẻ", sl: d.sl }));
  const hang = dong.reduce((s, d) => s + (tuMuc.get(khoaDong(d))?.gia ?? 0) * d.sl - d.giam, 0);
  // Voucher: tính lại theo dòng hàng hiện tại (đổi dòng thì tiền giảm đổi theo). Đơn chưa đủ điều kiện thì tiền giảm = 0 và báo lý do.
  const thanhDong = dong.map((d) => ({ loai: d.loai, ref: d.ref, thanh: (tuMuc.get(khoaDong(d))?.gia ?? 0) * d.sl - d.giam }));
  const tienVoucher = vc && hang >= vc.donToiThieu ? tinhGiamVoucher(vc.def, thanhDong) : 0;
  const lyDoVoucher = !vc || tienVoucher > 0 ? "" : hang < vc.donToiThieu ? `Voucher ${vc.ma} chỉ áp dụng cho đơn từ ${tienVN(vc.donToiThieu)}.` : `Voucher ${vc.ma} chưa áp dụng được: đơn chưa có mục thuộc "${GIOI_HAN_VOUCHER.find((g) => g.gia_tri === vc.def.gioi_han)?.nhan}".`;
  // Đổi điểm: chỉ khi cấu hình bật; không vượt số dư và không vượt phần tiền hàng còn lại sau giảm giá.
  const diemKhach = khach && diemTai?.khachId === khach.id ? diemTai : null;
  const diemToiDa = diemKhach?.bat ? Math.max(0, Math.min(diemKhach.soDu, Math.floor(Math.max(hang - giamDon - tienVoucher, 0) / diemKhach.tienMoiDiem))) : 0;
  const diem = Math.min(Number(diemNhap) || 0, diemToiDa);
  const tienDiem = diemKhach ? diem * diemKhach.tienMoiDiem : 0;
  const { vat, phai } = tinhDon(hang, giamDon + tienDiem + tienVoucher, Number(vatPct) || 0, phuPhi, tip);
  const daThu = thu.reduce((s, t) => s + t.so_tien, 0);
  const conNo = phai - daThu;
  useEffect(() => {
    if (!dangXem) return;
    onDonChoKhach({
      khach: khach?.ho_ten ?? "", dong: dong.map((d) => ({ ten: tuMuc.get(khoaDong(d))?.ten ?? "", sl: d.sl, thanh: (tuMuc.get(khoaDong(d))?.gia ?? 0) * d.sl - d.giam })),
      hang, giam: giamDon + tienDiem + tienVoucher, vat, phuPhiTip: phuPhi + tip, phai, daThu, conNo,
    });
  }, [dangXem, onDonChoKhach, khach, dong, tuMuc, hang, giamDon, tienDiem, tienVoucher, vat, phuPhi, tip, phai, daThu, conNo]);

  const them = (m: MucBan) => {
    setDong((ds) => {
      const i = ds.findIndex((d) => khoaDong(d) === khoaDong({ loai: m.loai, ref: m.id }));
      if (i >= 0) return ds.map((d, j) => (j === i ? { ...d, sl: d.sl + 1 } : d));
      const macDinhBan = khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [];
      return [...ds, { loai: m.loai, ref: m.id, sl: 1, giam: 0, nv: { phuc_vu: [], tu_van: [], ban: macDinhBan } }];
    });
  };
  const capNhat = (i: number, p: Partial<DongDon>) => setDong((ds) => ds.map((d, j) => (j === i ? { ...d, ...p } : d)));

  // Sắp xếp như SalonHero (Tên A-Z, giá thấp-cao, giá cao-thấp); xếp trong từng nhóm vì danh mục hiện theo nhóm.
  const dsMuc = muc.filter((m) => m.loai === tab && khopMuc(m, tu))
    .sort((a, b) => (sapXep === "gia_tang" ? a.gia - b.gia : sapXep === "gia_giam" ? b.gia - a.gia : sapXep === "moi_nhat" ? (b.tao ?? "").localeCompare(a.tao ?? "") : 0) || a.ten.localeCompare(b.ten, "vi"));
  const nhomMuc = [...new Set(dsMuc.map((m) => m.nhom))];

  const gui = () => {
    setLoi("");
    if (!dong.length) return setLoi("Đơn chưa có dòng hàng nào.");
    if (vc && tienVoucher <= 0) return setLoi(lyDoVoucher || "Voucher chưa áp dụng được. Bỏ voucher hoặc chọn đúng mục.");
    if (giamDon + tienDiem + tienVoucher > hang) return setLoi("Giảm giá cả đơn, voucher và đổi điểm cộng lại lớn hơn tiền hàng.");
    if (conNo < 0) return setLoi("Tổng các khoản thu lớn hơn số phải thu.");
    if (conNo > 0 && !khach) return setLoi("Còn nợ thì phải chọn khách hàng.");
    for (const t of thu) if (t.phuong_thuc === "the_tien" && !t.the_id) return setLoi("Chọn thẻ tiền cho khoản trừ thẻ.");
    bat(async () => {
      const kq = await chot(JSON.stringify({ khachId: khach?.id ?? null, lichId, chiNhanhId: cnId, dong, giamDon, vatPct: Number(vatPct) || 0, phuPhi, tip, nguoiGioiThieu: "", ghiChu, thu, doiDiem: diem, voucher: vc?.ma ?? "" }));
      if ("loi" in kq && kq.loi) setLoi(kq.loi);
      else if ("id" in kq) {
        if (nhapId) { await xoaNhap(nhapId); onNhap(); }
        onXong({ id: kq.id, ma: kq.ma });
      }
    });
  };
  const luuNhapDon = () => {
    setLoi(""); setTinNhap("");
    if (!dong.length) return setLoi("Đơn chưa có dòng hàng nào để lưu nháp.");
    bat(async () => {
      const kq = await luuNhap({ id: nhapId, khachId: khach?.id ?? null, chiNhanhId: cnId, tieuDe: khach?.ho_ten ?? "", dong });
      if ("loi" in kq && kq.loi) setLoi(kq.loi);
      else if ("id" in kq) { setNhapId(kq.id); setTinNhap("Đã lưu nháp."); onNhap(); }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="min-w-0">
        <div className="mb-4 text-[13px] text-muc-2"><span className="mb-1 block">Chi nhánh bán</span>
          <Chon ariaLabel="Chi nhánh bán" luaChon={chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} giaTri={cnId} onDoi={(id) => { setCnId(id); setVc(null); }} trong="Chọn chi nhánh" voHieu={khoaChiNhanh} />
        </div>
        <ChonKhach khach={khach} onDoi={(k) => { setKhach(k); setDiemNhap(""); setVc(null); setThu((t) => t.filter((x) => x.phuong_thuc !== "the_tien")); }} tim={tim} />
        <ThongTinDon thuNgan={thuNgan} nguonLich={nguonLich} khach={khach} coTheTien={theTien.length > 0} coTheDichVu={!!theKhach?.the.some((t) => t.loai === "lan")} hang={theKhach?.hang ?? ""} />
        {khach && <TheCuaKhach the={theKhach?.the ?? null} theBan={theBan} />}
        {diemKhach && (
          <p className="mt-2 text-[13px] text-muc-3">Điểm thưởng: <span className="font-medium tabular-nums text-muc">{diemKhach.soDu.toLocaleString("vi-VN")} điểm</span>
            {diemKhach.bat ? ` · 1 điểm = ${tienVN(diemKhach.tienMoiDiem)}` : " · đổi điểm đang tắt"}</p>
        )}
        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-vien" role="tablist" aria-label="Danh mục bán">
          {LOAI_TAB.map((t) => (
            <button key={t.ma} type="button" role="tab" aria-selected={tab === t.ma} onClick={() => setTab(t.ma)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] ${tab === t.ma ? "border-nhan font-semibold text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{t.ten}<span className={`rounded-tag px-1.5 py-0.5 text-[11px] tabular-nums ${tab === t.ma ? "bg-nhan-dam text-giay" : "bg-giay-tram text-muc-3"}`}>{muc.filter((m) => m.loai === t.ma).length}</span></button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="relative">
            <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
            <input value={tu} onChange={(e) => setTu(e.target.value)} placeholder="Tìm tên, mã hoặc mã vạch" aria-label="Tìm trong danh mục" className={`${O_NHAP} pl-9`} />
          </div>
          <div className="w-40"><Chon nho ariaLabel="Sắp xếp danh mục" giaTri={sapXep} luaChon={[{ gia_tri: "ten", nhan: "Tên A-Z" }, { gia_tri: "gia_tang", nhan: "Giá thấp-cao" }, { gia_tri: "gia_giam", nhan: "Giá cao-thấp" }, { gia_tri: "moi_nhat", nhan: "Mới nhất" }]} onDoi={(v) => setSapXep(v as typeof sapXep)} /></div>
        </div>
        <div className="mt-4 space-y-5">
          {nhomMuc.map((n) => {
            const sac = sacCua(n), ds = dsMuc.filter((m) => m.nhom === n), Bt = BIEU_TUONG[tab];
            return (
              <div key={n}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span aria-hidden className={`h-3 w-1.5 rounded-tag ${sac.cham}`} />
                  <span className="nhan-muc">{n}</span>
                  <span className={`rounded-tag px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${sac.chip}`}>{ds.length}</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {ds.map((m) => {
                    const daChon = dong.filter((d) => khoaDong(d) === `${m.loai}:${m.id}`).reduce((t, d) => t + d.sl, 0);
                    return (
                      <button key={m.id} type="button" onClick={() => them(m)}
                        className={`group relative flex items-start gap-3 rounded-the border border-l-4 bg-gradient-to-b from-giay-sang to-giay px-3 py-3 text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-nhan hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nhan ${sac.vien} ${daChon ? "border-nhan ring-1 ring-nhan" : "border-vien"}`}>
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-nho ${sac.chip}`}><Bt aria-hidden strokeWidth={1.7} className="h-[18px] w-[18px]" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium leading-snug text-muc">{m.ten}</span>
                          <span className={`mt-1 block text-[15px] font-semibold tabular-nums ${sac.gia}`}>{tienVN(m.gia)}</span>
                        </span>
                        {daChon > 0
                          ? <span className="absolute right-2 top-2 rounded-tag bg-nhan-dam px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-giay">×{daChon}</span>
                          : <Plus aria-hidden strokeWidth={2} className="absolute right-2.5 top-2.5 h-4 w-4 text-muc-3 opacity-0 transition-opacity group-hover:opacity-100" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {dsMuc.length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Không có mục nào.</p>}
        </div>
      </section>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-hop border border-vien bg-giay-sang shadow-md">
          <h2 className="flex items-center justify-between gap-3 bg-gradient-to-r from-espresso to-[#0d4a42] px-4 py-3.5 text-[15px] font-semibold text-white">
            <span className="flex items-center gap-2"><ShoppingBag aria-hidden strokeWidth={1.7} className="h-[18px] w-[18px]" />Đơn hàng</span>
            <span className="rounded-tag bg-white/15 px-2 py-0.5 text-[12px] font-medium tabular-nums">{dong.reduce((t, d) => t + d.sl, 0)} mục</span>
          </h2>
          {dong.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-muc-3">Chọn dịch vụ, thẻ hoặc sản phẩm ở bên trái.</p>}
          <ul className="divide-y divide-vien">
            {dong.map((d, i) => {
              const m = tuMuc.get(khoaDong(d));
              if (!m) return null;
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
                    {choGiam && <span className="flex items-center gap-1.5 text-[13px] text-muc-3">Giảm <OTien className="w-[120px]" giaTri={d.giam} onDoi={(n) => capNhat(i, { giam: Math.min(n, m.gia * d.sl) })} ariaLabel="Giảm giá dòng" /></span>}
                    <span className="ml-auto text-[15px] font-medium tabular-nums text-muc">{tienVN(m.gia * d.sl - d.giam)}</span>
                  </div>
                  <button type="button" onClick={() => setSuaNv(i)} className={`mt-2 flex items-center gap-1.5 text-[13px] ${NUT_CHU}`}><UserRound strokeWidth={1.6} className="h-3.5 w-3.5" />{VAI.some((v) => d.nv[v.ma].length) ? "Sửa nhân viên" : "Chọn người phục vụ, tư vấn, bán"}</button>
                  <ul className="mt-1 space-y-0.5 text-[12px] text-muc-3">
                    {VAI.filter((v) => d.nv[v.ma].length).map((v) => (
                      <li key={v.ma}><span className="text-muc-2">{v.ten}:</span> {d.nv[v.ma].map((x) => `${nhanVien.find((n) => n.id === x.id)?.ten ?? ""}${d.nv[v.ma].length > 1 ? ` ${x.ti}%` : ""}`).join(", ")}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          {dong.length > 0 && (
            <div className="space-y-3 border-t border-vien px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {choGiam && <div><label className={NHAN_O}>Giảm cả đơn (đ)</label><OTien giaTri={giamDon} onDoi={(n) => { setGiamDon(Math.min(n, Math.max(hang - tienVoucher, 0))); setGiamPct(""); }} /></div>}
                <div><label className={NHAN_O}>hoặc giảm %</label><input inputMode="decimal" {...CHON_HET} className={`${O_NHAP} text-right`} value={giamPct} onChange={(e) => { const p = e.target.value.replace(/[^\d.]/g, ""); setGiamPct(p); setGiamDon(Math.min(Math.round((hang * Math.min(Number(p) || 0, 100)) / 100), Math.max(hang - tienVoucher, 0))); }} /></div>
                <div><label className={NHAN_O}>VAT (%)</label><input inputMode="decimal" {...CHON_HET} className={`${O_NHAP} text-right`} value={vatPct} onChange={(e) => setVatPct(e.target.value.replace(/[^\d.]/g, ""))} /></div>
                <div><label className={NHAN_O}>Phụ phí</label><OTien giaTri={phuPhi} onDoi={setPhuPhi} /></div>
                {choTip && <div className="col-span-2"><label className={NHAN_O}>Tip cho nhân viên</label><OTien giaTri={tip} onDoi={setTip} /></div>}
                {diemKhach?.bat && diemKhach.soDu > 0 && (
                  <div className="col-span-2">
                    <label htmlFor={`doi-diem-${khach?.id}`} className={NHAN_O}>Đổi điểm thưởng (tối đa {diemToiDa.toLocaleString("vi-VN")} điểm)</label>
                    <div className="flex items-center gap-2">
                      <input id={`doi-diem-${khach?.id}`} inputMode="numeric" {...CHON_HET} className={`${O_NHAP} text-right`} value={diemNhap} aria-describedby={`doi-diem-tien-${khach?.id}`}
                        onChange={(e) => setDiemNhap(e.target.value.replace(/\D/g, "").slice(0, 7))} />
                      <button type="button" className={`shrink-0 ${NUT_CHU}`} onClick={() => setDiemNhap(String(diemToiDa))} disabled={diemToiDa === 0}>Dùng hết</button>
                    </div>
                    <p id={`doi-diem-tien-${khach?.id}`} className="mt-1 text-[12px] text-muc-3">{diem > 0 ? `Giảm ${tienVN(tienDiem)}, còn ${(diemKhach.soDu - diem).toLocaleString("vi-VN")} điểm sau khi chốt` : "Nhập số điểm muốn đổi"}{Number(diemNhap) > diemToiDa ? ` · đã giới hạn ${diemToiDa} điểm` : ""}</p>
                  </div>
                )}
              </div>
              <dl className="space-y-1.5 border-t border-vien pt-3 text-[14px]">
                <div className="flex justify-between"><dt className="text-muc-3">Tiền hàng</dt><dd className="tabular-nums">{tienVN(hang)}</dd></div>
                {giamDon > 0 && <div className="flex justify-between"><dt className="text-muc-3">Giảm giá</dt><dd className="tabular-nums">− {tienVN(giamDon)}</dd></div>}
                <div className="flex items-start justify-between gap-3"><dt className="text-muc-3">Thẻ giảm giá/voucher <button type="button" className={NUT_CHU} onClick={() => setMoVc(true)}>(Chọn thẻ)</button>
                  {vc && <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muc-2"><Ticket aria-hidden strokeWidth={1.6} className="h-3.5 w-3.5 text-nhan-dam" />{vc.ma}<button type="button" aria-label={`Bỏ voucher ${vc.ma}`} className="p-1 text-muc-3 hover:text-loi" onClick={() => setVc(null)}><X strokeWidth={1.6} className="h-3 w-3" /></button></span>}
                  {lyDoVoucher && <span role="alert" className="mt-0.5 block text-[12px] text-canh-bao">{lyDoVoucher}</span>}</dt>
                  <dd className="tabular-nums">{tienVoucher > 0 ? `− ${tienVN(tienVoucher)}` : "0"}</dd></div>
                {tienDiem > 0 && <div className="flex justify-between"><dt className="text-muc-3">Đổi {diem.toLocaleString("vi-VN")} điểm</dt><dd className="tabular-nums">− {tienVN(tienDiem)}</dd></div>}
                {vat > 0 && <div className="flex justify-between"><dt className="text-muc-3">VAT</dt><dd className="tabular-nums">{tienVN(vat)}</dd></div>}
                {(phuPhi > 0 || tip > 0) && <div className="flex justify-between"><dt className="text-muc-3">Phụ phí và tip</dt><dd className="tabular-nums">{tienVN(phuPhi + tip)}</dd></div>}
                <div className="-mx-4 mt-1 flex items-center justify-between border-t-2 border-nhan bg-nhan-nhat px-4 py-3 text-muc"><dt className="text-[15px] font-semibold text-nhan-dam">Phải thu</dt><dd className="text-[22px] font-bold tabular-nums text-nhan-dam">{tienVN(phai)}</dd></div>
              </dl>

              <div className="border-t border-vien pt-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-[14px] font-semibold text-muc">Thanh toán</span>
                  <button type="button" className={NUT_CHU} onClick={() => setThu((t) => [...t, { phuong_thuc: "tien_mat", so_tien: Math.max(conNo, 0) }])}>Thêm khoản thu</button></div>
                <ul className="space-y-2">
                  {thu.map((t, i) => (
                    <li key={`${i}-${t.phuong_thuc}`} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                      <Chon nho ariaLabel="Phương thức" giaTri={t.phuong_thuc} luaChon={PHUONG_THUC} onDoi={(v) => setThu((x) => x.map((y, j) => (j === i ? { ...y, phuong_thuc: v, the_id: undefined, ngan_hang: v === "chuyen_khoan" || v === "quet_the" ? nhMacDinh(v) : undefined } : y)))} />
                      <OTien giaTri={t.so_tien} onDoi={(n) => setThu((x) => x.map((y, j) => (j === i ? { ...y, so_tien: n } : y)))} ariaLabel="Số tiền thu" />
                      <button type="button" aria-label="Bỏ khoản thu" onClick={() => setThu((x) => x.filter((_, j) => j !== i))} className="p-2 text-muc-3 hover:text-loi"><X strokeWidth={1.6} className="h-4 w-4" /></button>
                      {(t.phuong_thuc === "chuyen_khoan" || t.phuong_thuc === "quet_the") && (
                        <div className="col-span-3 flex items-center gap-2 text-[12px] text-muc-3">
                          <span className="shrink-0">Ngân hàng nhận</span>
                          <div className="min-w-0 flex-1"><Chon nho ariaLabel="Ngân hàng nhận tiền" giaTri={t.ngan_hang ?? ""} luaChon={[...new Set([...dsNh(t.phuong_thuc), ...(t.ngan_hang ? [t.ngan_hang] : [])])].map((x) => ({ gia_tri: x, nhan: x }))}
                            onDoi={(v) => { ghiNho(t.phuong_thuc, v); setThu((a) => a.map((y, j) => (j === i ? { ...y, ngan_hang: v } : y))); }} /></div>
                        </div>
                      )}
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
              {tinNhap && <p role="status" className="text-[13px] text-nhan-dam">{tinNhap}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={dang || !dong.length} onClick={luuNhapDon} className={`${NUT_PHU} h-11 text-[14px]`}>Lưu nháp</button>
                <button type="button" onClick={() => setMoHh(true)} disabled={!dong.length} className={`${NUT_PHU} h-11 text-[14px]`}>Hoa hồng &amp; doanh thu</button>
                <button type="button" disabled={dang} onClick={onHuy} className={`${NUT_PHU} h-11 text-[14px]`}>Hủy đơn</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {moVc && (
        <HopVoucher dong={() => setMoVc(false)} chiNhanhId={cnId} khachId={khach?.id ?? null} lichId={lichId} dangDung={vc} lay={voucher} ds={dsVc} apDung={(v) => { setVc(v); setMoVc(false); }} />
      )}
      {moHh && (
        <HoaHongDon dong={() => setMoHh(false)} nhanVien={nhanVien} hang={hang}
          dongDon={dong.map((d) => ({ nv: d.nv, thanh: (tuMuc.get(khoaDong(d))?.gia ?? 0) * d.sl - d.giam }))} />
      )}
      {suaNv !== null && dong[suaNv] && (
        <NguoiHuong d={dong[suaNv]} ten={tuMuc.get(khoaDong(dong[suaNv]))?.ten ?? ""} nhanVien={nhanVien} dong={() => setSuaNv(null)} luu={(nv) => { capNhat(suaNv, { nv }); setSuaNv(null); }} />
      )}
    </div>
  );
}

/** Nút "Hoa hồng & doanh thu" như SalonHero: xem trước đơn đang dựng chia doanh thu cho ai, theo vai. Tiền hoa hồng thật tính khi chốt đơn theo bảng tỉ lệ, nên ở đây chỉ hiện doanh thu chia. */
function HoaHongDon({ dongDon, nhanVien, hang, dong }: { dongDon: { nv: DongDon["nv"]; thanh: number }[]; nhanVien: Nv[]; hang: number; dong: () => void }) {
  const ten = new Map(nhanVien.map((n) => [n.id, n.ten]));
  const ds = chiaDoanhThuNguoiHuong(dongDon);
  return (
    <Hop mo dong={dong} tieuDe="Hoa hồng và doanh thu" moTa={`Tiền hàng của đơn: ${tienVN(hang)}. Doanh thu chia theo phần trăm người hưởng đã chọn ở từng dòng.`} rong="rong">
      {ds.length === 0 ? <p className="text-[14px] text-muc-3">Chưa dòng nào có người hưởng. Bấm vào dòng hàng để chọn người phục vụ, tư vấn, bán hàng.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[14px]">
            <thead><tr className="border-b border-vien text-left text-[12px] text-muc-3"><th className="py-2 pr-3 font-medium">Nhân viên</th>{VAI.map((v) => <th key={v.ma} className="px-2 py-2 text-right font-medium">{v.ten}</th>)}<th className="py-2 pl-2 text-right font-medium">Tổng</th></tr></thead>
            <tbody>
              {ds.map((x) => (
                <tr key={x.id} className="border-b border-vien last:border-0">
                  <td className="py-2 pr-3 text-muc">{ten.get(x.id) ?? "Nhân viên đã nghỉ"}</td>
                  {VAI.map((v) => <td key={v.ma} className="px-2 py-2 text-right tabular-nums text-muc-2">{x.vai[v.ma] ? tienVN(x.vai[v.ma]) : "—"}</td>)}
                  <td className="py-2 pl-2 text-right font-medium tabular-nums text-muc">{tienVN(x.tong)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[12px] text-muc-3">Hoa hồng thật tính lúc chốt đơn theo bảng tỉ lệ ở trang Hoa hồng. Một dòng có nhiều vai thì doanh thu được tính cho từng vai.</p>
      <div className="mt-5 flex justify-end"><button type="button" className={NUT_CHINH} onClick={dong}>Đóng</button></div>
    </Hop>
  );
}

function NguoiHuong({ d, ten, nhanVien, dong, luu }: { d: DongDon; ten: string; nhanVien: Nv[]; dong: () => void; luu: (nv: DongDon["nv"]) => void }) {
  const [nv, setNv] = useState(d.nv);
  const [loi, setLoi] = useState("");
  const lc = [{ gia_tri: "", nhan: "Không có" }, ...luaChonNhanVien(nhanVien.map((n) => ({ id: n.id, ho_ten: n.ten, vai_tro: n.vaiTro })))];
  const doiNguoi = (v: Vai, i: number, id: string) => setNv((x) => ({ ...x, [v]: id ? x[v].map((y, j) => (j === i ? { ...y, id } : y)) : x[v].filter((_, j) => j !== i) }));
  const doiTi = (v: Vai, i: number, ti: number) => setNv((x) => ({ ...x, [v]: x[v].map((y, j) => (j === i ? { ...y, ti } : y)) }));
  const chiaDeu = (v: Vai) => setNv((x) => { const t = chiaDeuTi(x[v].length); return { ...x, [v]: x[v].map((y, j) => ({ ...y, ti: t[j] })) }; });
  // Thêm người thứ 2 trở đi: chia đều lại cho cả nhóm (sửa tay sau nếu cần). Tối đa 5 người mỗi vai.
  const themNguoi = (v: Vai) => setNv((x) => {
    if (x[v].length >= TOI_DA_NGUOI_HUONG) return x;
    if (x[v].length === 0) return { ...x, [v]: [{ id: nhanVien[0]?.id ?? "", ti: 100 }] };
    const t = chiaDeuTi(x[v].length + 1);
    return { ...x, [v]: [...x[v], { id: "", ti: 0 }].map((y, j) => ({ ...y, ti: t[j] })) };
  });
  const tongTi = (v: Vai) => lamTron(nv[v].reduce((s, x) => s + x.ti, 0));
  const xong = () => {
    for (const v of VAI) {
      const ds = nv[v.ma].filter((x) => x.id);
      if (ds.length && Math.abs(ds.reduce((s, x) => s + x.ti, 0) - 100) > 0.01) return setLoi(`Vai ${v.ten}: phần chia phải cộng đủ 100%.`);
      if (new Set(ds.map((x) => x.id)).size !== ds.length) return setLoi(`Vai ${v.ten}: một người chỉ xuất hiện một lần.`);
    }
    luu({ phuc_vu: nv.phuc_vu.filter((x) => x.id), tu_van: nv.tu_van.filter((x) => x.id), ban: nv.ban.filter((x) => x.id) });
  };
  return (
    <Hop mo dong={dong} tieuDe="Người hưởng" moTa={`${ten}. Mỗi vai chọn tối đa ${TOI_DA_NGUOI_HUONG} người, phần chia cộng đủ 100%; bỏ trống vai nào thì vai đó không tính hoa hồng.`} rong="rong">
      <div className="space-y-5">
        {VAI.map((v) => (
          <div key={v.ma}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><span className="text-[14px] font-semibold text-muc">{v.ten} <span className="text-[12px] font-normal text-muc-3">({nv[v.ma].length}/{TOI_DA_NGUOI_HUONG})</span></span>
              <span className="flex items-center gap-4">
                {nv[v.ma].length >= 2 && <button type="button" className={NUT_CHU} onClick={() => chiaDeu(v.ma)}>Chia đều</button>}
                {nv[v.ma].length < TOI_DA_NGUOI_HUONG ? <button type="button" className={NUT_CHU} onClick={() => themNguoi(v.ma)}>{nv[v.ma].length ? "Thêm người chia" : "Chọn người"}</button> : <span className="text-[12px] text-muc-3">Đã đủ {TOI_DA_NGUOI_HUONG} người</span>}
              </span></div>
            <ul className="space-y-2">
              {nv[v.ma].map((x, i) => (
                <li key={`${v.ma}-${i}`} className="grid grid-cols-[1fr_96px] gap-2">
                  <Chon nho trong="Chọn nhân viên" ariaLabel={`${v.ten} ${i + 1}`} giaTri={x.id} luaChon={lc} onDoi={(id) => doiNguoi(v.ma, i, id)} />
                  <div className="relative"><input inputMode="decimal" {...CHON_HET} aria-label={`Phần trăm ${v.ten} ${i + 1}`} value={String(x.ti)} onChange={(e) => doiTi(v.ma, i, Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} className={`${O_NHAP.replace("h-11 ", "")} h-9 pr-7 text-right text-[13px]`} /><span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muc-3">%</span></div>
                </li>
              ))}
            </ul>
            {nv[v.ma].length > 1 && <p className={`mt-1.5 text-[12px] ${tongTi(v.ma) === 100 ? "text-nhan-dam" : "text-canh-bao"}`}>{tongTi(v.ma) === 100 ? "Đã chia đủ 100%" : tongTi(v.ma) < 100 ? `Còn thiếu ${lamTron(100 - tongTi(v.ma))}%` : `Đang dư ${lamTron(tongTi(v.ma) - 100)}%`}</p>}
          </div>
        ))}
      </div>
      {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={dong}>Huỷ</button><button type="button" className={NUT_CHINH} onClick={xong}>Xong</button></div>
    </Hop>
  );
}

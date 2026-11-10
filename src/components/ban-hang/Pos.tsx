"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Minus, Package, Pencil, Plus, Search, ShoppingBag, Sparkles, Ticket, Trash2, UserRound, X } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { OTien } from "@/components/ui/OTien";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG, CHON_HET } from "@/components/ui/dinh-dang";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { GioChon } from "@/components/ui/GioChon";
import { gtGoiY, chiaDeuTi, chiaDoanhThuNguoiHuong, chiaNoTheoDong, giamTheoPct, NHOM_GT, type NguonGt, giaDong, GIA_SUA_TOI_DA, GIOI_HAN_VOUCHER, hienOThuNgan, LOAI_SUA_GIA, KENH_MAN_HINH_KHACH, khopMuc, lamTron, LOAI_VI, PHUONG_THUC, dsNganHangNhan, nganHangChonSan, tinhDon, tinhTraLai, tinhGiamVoucher, TOI_DA_NGUOI_HUONG, VAI, type DonChoKhach, type DongDon, type KhoanThu, type MucBan, type TaiKhoanNhan, type Vai, type SuaHoaDon } from "@/lib/ban-hang";
import { ChonKhach, type KhachChon } from "@/components/khach/ChonKhach";
import type { VoucherTim } from "@/lib/voucher";
import { HopVoucher } from "./HopVoucher";
import { CHU_IN, PHUONG_THUC_EN, type DuLieuIn, type NgonNguIn } from "@/components/cai-dat/BanInHoaDon";
import type { chotDonBanHang, dsDonCho, dsDonNhap, dsVoucher, layDiemKhach, layTheKhach, layTheTien, layVoucher, luuDonNhap, timKhach, xoaDonNhap, DonNhapRut } from "@/app/(app)/ban-hang/actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";
import { BaoPhieuBuoi, NutBuoi, type KetQuaBuoi } from "@/components/the/NutBuoi";
import type { thucHienBuoi } from "@/app/(app)/the/actions";

type Nv = { id: string; ten: string; vaiTro: string };
type TheKh = { id: string; ma: string; goiId: string; loai: "lan" | "tien"; ten: string; buoiCon: number; buoiTong: number | null; soDu: number; han: string | null; dichVu: string[]; lanTruoc: { dv: string; nv: string; bs: string } | null };
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
const LOAI_TAB = [{ ma: "dich_vu", ten: "Dịch vụ", ngan: "Dịch vụ" }, { ma: "goi_the", ten: "Thẻ và liệu trình", ngan: "Thẻ, liệu trình" }, { ma: "san_pham", ten: "Sản phẩm", ngan: "Sản phẩm" }] as const;
const TAO_MOI = { dich_vu: { nhan: "Tạo dịch vụ mới", href: "/danh-muc?tab=dich-vu" }, goi_the: { nhan: "Tạo thẻ mới", href: "/danh-muc?tab=goi-the" }, san_pham: { nhan: "Tạo sản phẩm mới", href: "/danh-muc?tab=san-pham" } } as const;
const khoaDong = (d: { loai: string; ref: string }) => `${d.loai}:${d.ref}`;

type PropsPos = {
  muc: MucBan[]; nhanVien: Nv[]; khachBanDau: KhachChon | null; dongBanDau: DongDon[]; chiNhanhId: string; chiNhanh: { id: string; ten: string }[]; khoaChiNhanh: boolean; lichId: string | null; /** Số khách của lịch nhóm (Thanh toán ngay từ lịch nhiều khách). */ soKhachLich?: number; choGiam?: boolean; choTip?: boolean; thuNgan?: string; nguonLich?: string; /** Phòng / chỗ ghi ở lịch hẹn của đơn (chỉ hiển thị). */ viTriLich?: string; taiKhoanNhan?: TaiKhoanNhan[];
  tim: typeof timKhach; layThe: typeof layTheTien; choThanhToan?: number | null; denNgay?: string; layDiem: typeof layDiemKhach; layTheKh: typeof layTheKhach; chot: typeof chotDonBanHang; voucher: typeof layVoucher; dsVoucher: typeof dsVoucher; luuNhap: typeof luuDonNhap; dsNhap: typeof dsDonNhap; xoaNhap: typeof xoaDonNhap; nhapBanDau?: DonNhapRut[];
  /** Đang sửa một hoá đơn đã chốt (đã mở lại về nháp): chỉ áp vào đơn đầu tiên. */ suaHd?: SuaHoaDon | null;
  /** "Chờ thanh toán": đơn đang xử lý của chi nhánh. */ dsCho?: typeof dsDonCho;
  /** Có quyền sửa danh mục: hiện ô "Tạo thẻ / dịch vụ / sản phẩm mới" cuối lưới như SalonHero. */ taoMoi?: boolean;
  /** Nguồn giới thiệu cho người giới thiệu từng dòng. */ nguonGt?: NguonGt[];
  /** Có quyền trừ buổi thẻ: hiện nút "Dùng buổi" ở "Thẻ khách đang có". */ buoi?: typeof thucHienBuoi;
};
/** Loại đơn (chị Thuý 10/11): "ban" = bán mới (thẻ, liệu trình, sản phẩm, dịch vụ lẻ trả tiền); "dich_vu" = khách làm các dịch vụ đã mua (dùng buổi thẻ), thêm dịch vụ lẻ nếu làm thêm.
 *  Chỉ là điểm bắt đầu của màn (giữ ở trình duyệt, không lưu DB); đơn nào cũng chứa được mọi loại món. */
type KieuDon = "ban" | "dich_vu";
type Tab = { k: number; ten: string; soDong: number; nhap?: DonNhapRut; kieu: KieuDon };
/** Đơn nháp mở lại không có loại: toàn dòng dịch vụ thì coi là đơn làm dịch vụ. */
const kieuTuDong = (dong: DongDon[]): KieuDon => (dong.length > 0 && dong.every((d) => d.loai === "dich_vu") ? "dich_vu" : "ban");
const TOI_DA_DON = 8;
const SU_KIEN_IN_SAU = "amia-pos-in-sau";
const dangKyInSau = (f: () => void) => { window.addEventListener(SU_KIEN_IN_SAU, f); window.addEventListener("storage", f); return () => { window.removeEventListener(SU_KIEN_IN_SAU, f); window.removeEventListener("storage", f); }; };
/** Mốc giảm % theo dòng như SalonHero (0–100%, bước 5%). */
const PCT_GIAM = Array.from({ length: 21 }, (_, i) => ({ gia_tri: String(i * 5), nhan: `${i * 5}%` }));

/** Màn Thu ngân: mở nhiều đơn song song (như SalonHero), mỗi đơn một tab giữ nguyên trạng thái khi chuyển qua lại.
 *  Chốt xong một đơn chỉ đóng tab đó, các đơn khác vẫn còn. Lịch hẹn / khách truyền từ URL chỉ vào đơn đầu tiên. */
export function Pos(props: PropsPos) {
  const router = useRouter();
  const [ds, setDs] = useState<Tab[]>(() => [{ k: 1, ten: "", soDong: props.dongBanDau.length, kieu: props.lichId ? "dich_vu" : props.dongBanDau.length ? kieuTuDong(props.dongBanDau) : "ban" }]);
  const [dangXem, setDangXem] = useState(1);
  const dem = useRef(1);
  const [xong, setXong] = useState<{ id: string; ma: string; datLichKhach?: string | null } | null>(null);
  // "Chờ thanh toán" (như SalonHero): đơn đang xử lý của cả chi nhánh — đơn nháp của mọi thu ngân + hoá đơn mở lại để sửa.
  const [moCho, setMoCho] = useState(false);
  const [dsChoTai, setDsCho] = useState<Awaited<ReturnType<typeof dsDonCho>> | null>(null);
  const taiCho = () => { setDsCho(null); void props.dsCho?.(props.chiNhanhId).then(setDsCho).catch(() => setDsCho([])); };
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
  const them = (kieu: KieuDon) => {
    if (ds.length >= TOI_DA_DON) return;
    dem.current += 1;
    const k = dem.current;
    setDs((x) => [...x, { k, ten: "", soDong: 0, kieu }]);
    setDangXem(k);
  };
  const moLaiNhap = (n: DonNhapRut) => {
    const dangMo = ds.find((t) => t.nhap?.id === n.id);
    if (dangMo) { setDangXem(dangMo.k); setMoNhap(false); return; }
    if (ds.length >= TOI_DA_DON) { window.alert(`Đang mở ${TOI_DA_DON} đơn. Đóng bớt một đơn rồi mở đơn nháp.`); return; }
    dem.current += 1;
    const k = dem.current;
    setDs((x) => [...x, { k, ten: n.khach?.ho_ten ?? "", soDong: n.dong.length, nhap: n, kieu: kieuTuDong(n.dong) }]);
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
      if (!con.length) con.push({ k: moi, ten: "", soDong: 0, kieu: "ban" });
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
      {/* Điện thoại: dải đơn đang mở một hàng riêng, các nút phụ một hàng cuộn ngang bên dưới (không đè bẹp tab đơn, không tràn ngang).
          Máy tính (lg+): hàng nút dùng display: contents nên vẫn chung một hàng như cũ. */}
      <div className="mb-3 flex flex-col lg:mb-4 lg:flex-row lg:items-center lg:gap-2 lg:border-b lg:border-vien">
        <div role="tablist" aria-label="Các đơn đang mở" className="flex min-w-0 flex-1 gap-1 overflow-x-auto border-b border-vien [scrollbar-width:none] lg:-mb-px lg:border-b-0 [&::-webkit-scrollbar]:hidden">
          {ds.map((t, i) => (
            <span key={t.k} className={`flex shrink-0 items-center rounded-t-nho border border-b-0 ${t.k === dangXem ? "border-vien bg-giay-sang" : "border-transparent"}`}>
              <button type="button" role="tab" id={`don-tab-${t.k}`} aria-controls={`don-${t.k}`} aria-selected={t.k === dangXem} tabIndex={t.k === dangXem ? 0 : -1}
                ref={(el) => { nutTab.current.set(t.k, el); }} onClick={() => setDangXem(t.k)} onKeyDown={(e) => banPhim(e, i)}
                className={`max-w-[160px] truncate py-2.5 pl-3 pr-1 text-[14px] ${t.k === dangXem ? "font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>
                <span className={`mr-1.5 rounded-tag px-1.5 py-0.5 text-[11px] font-semibold ${t.kieu === "dich_vu" ? "bg-sac-xanh-nen text-sac-xanh" : "bg-sac-cam-nen text-sac-cam"}`}>{t.kieu === "dich_vu" ? "Dịch vụ" : "Bán"}</span>{nhanTab(t, i)}{t.soDong > 0 && <span className="ml-1 text-[12px] text-muc-3">({t.soDong})</span>}
              </button>
              <button type="button" aria-label={`Đóng ${nhanTab(t, i)}`} onClick={() => dong(t.k)} className="p-2 text-muc-3 hover:text-loi"><X strokeWidth={1.6} className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
        {/* Hai điểm bắt đầu (chị Thuý 10/11): Đơn bán (bán mới thẻ / liệu trình / sản phẩm) và Đơn làm dịch vụ (khách làm dịch vụ đã mua). Điện thoại: hai nút to cùng một hàng. */}
        <div className="grid grid-cols-2 gap-2 pt-2 lg:flex lg:shrink-0 lg:pb-1 lg:pt-0">
          {([["ban", "Đơn bán", "Mở đơn bán mới: thẻ, liệu trình, sản phẩm"], ["dich_vu", "Đơn làm dịch vụ", "Mở đơn khách làm dịch vụ đã mua (dùng buổi thẻ)"]] as const).map(([kieu, nhan, moTa]) => (
            <button key={kieu} type="button" onClick={() => them(kieu)} disabled={ds.length >= TOI_DA_DON} title={moTa}
              className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-nho border border-nhan bg-giay-sang px-3 text-[14px] font-semibold text-nhan-dam hover:bg-nhan-nhat active:bg-nhan-nhat disabled:opacity-40 lg:h-9">
              <Plus aria-hidden strokeWidth={2} className="h-4 w-4" />{nhan}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pt-1 [scrollbar-width:none] lg:contents [&::-webkit-scrollbar]:hidden">
        <Link href="/hoa-don" className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}><span className="lg:hidden">Hoá đơn</span><span className="max-lg:hidden">Danh sách đơn hàng</span></Link>
        <button type="button" onClick={() => { setMoNhap((v) => !v); lamMoiNhap(); }} aria-expanded={moNhap} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>
          Đơn nháp<span className="rounded-tag bg-giay-tram px-1.5 text-[12px] font-medium tabular-nums text-muc-2">{nhap.length}</span>
        </button>
        <button type="button" onClick={() => window.open("/man-hinh-khach", "amia-man-hinh-khach", "popup,width=960,height=720")} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] max-lg:hidden ${NUT_CHU}`}>Màn hình khách</button>
        {props.choThanhToan != null && (
          <button type="button" aria-expanded={moCho} onClick={() => { setMoCho((v) => !v); setMoNhap(false); if (!moCho) taiCho(); }} className={`flex shrink-0 items-center gap-1 py-2 text-[14px] ${NUT_CHU}`}>Chờ thanh toán<span className={`rounded-tag px-1.5 text-[12px] font-medium tabular-nums ${props.choThanhToan > 0 ? "bg-canh-bao-nen text-canh-bao" : "bg-giay-tram text-muc-3"}`}>{dsChoTai?.length ?? props.choThanhToan}</span></button>
        )}
        </div>
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
      {moCho && (
        <div className="mb-4 rounded-nho border border-vien bg-giay-sang p-3">
          <p className="mb-2 text-[13px] text-muc-3">Đơn đang xử lý của chi nhánh, chưa thanh toán (đơn nháp của mọi thu ngân và hoá đơn đã mở lại để sửa). Mở đơn để thanh toán tiếp. <Link href={`/hoa-don?no=1&tu=2018-01-01&den=${props.denNgay ?? ""}`} className={NUT_CHU}>Xem đơn đã chốt còn nợ</Link></p>
          {dsChoTai === null ? <p className="text-[14px] text-muc-3">Đang tải</p> : dsChoTai.length === 0 ? <p className="text-[14px] text-muc-3">Không có đơn nào đang chờ thanh toán.</p> : (
            <ul className="divide-y divide-vien">
              {dsChoTai.map((n) => (
                <li key={`${n.loai}-${n.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[14px]">
                  <span><span className="text-muc">{n.khach}</span> <span className="text-muc-3">· {n.loai === "sua" ? `đang sửa ${n.ma}` : `${n.soDong} dòng`}{n.nguoiLap ? ` · ${n.nguoiLap}` : ""}{n.capNhat ? ` · ${new Date(n.capNhat).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}</span></span>
                  {n.loai === "sua" ? <Link href={`/ban-hang?sua=${n.id}`} className={NUT_CHU}>Mở</Link> : n.nhap && <button type="button" onClick={() => { moLaiNhap(n.nhap!); setMoCho(false); }} className={NUT_CHU}>Mở</button>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {xong && (
        <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">
          <span>Đã chốt đơn {xong.ma}.</span>
          <span className="flex gap-4"><Link href={`/hoa-don/${xong.id}`} className="font-medium underline">Xem hoá đơn</Link><Link href={`/in/hoa-don/${xong.id}`} target="_blank" className="font-medium underline">In</Link>
            {xong.datLichKhach && <Link href={`/lich-hen?khach=${xong.datLichKhach}`} target="_blank" className="font-medium underline">Đặt lịch hẹn tiếp theo</Link>}</span>
        </p>
      )}
      {ds.map((t, i) => (
        <div key={t.k} role="tabpanel" id={`don-${t.k}`} aria-labelledby={`don-tab-${t.k}`} hidden={t.k !== dangXem}>
          <DonPos {...props} k={t.k} kieu={t.kieu} nhapDau={t.nhap} onNhap={lamMoiNhap} dauTien={i === 0 && t.k === 1 && !t.nhap} dangXem={t.k === dangXem} onDonChoKhach={guiManHinhKhach} onDoi={capNhat} onHuy={() => huyDon(t.k)}
            onXong={(kq) => {
              setXong(kq); bo(t.k); guiManHinhKhach(null); setDsCho(null);
              // "Đặt lịch hẹn tiếp theo" (SalonHero, ô tick khi thanh toán): không còn đơn nào đang dở thì sang thẳng hộp đặt lịch cho khách; còn thì để link ở thanh "Đã chốt".
              if (kq.datLichKhach && !ds.some((x) => x.k !== t.k && x.soDong > 0)) { router.push(`/lich-hen?khach=${kq.datLichKhach}`); return; }
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
/** "YYYY-MM-DDTHH:MM" theo giờ Việt Nam (giá trị cho ô datetime-local). */
const gioVNChuoi = (d: Date) => d.toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }).slice(0, 16).replace(" ", "T");
function ThongTinDon({ thuNgan, nguonLich, viTri, khach, coTheTien, coTheDichVu, hang, ngayLui, onNgayLui, ngayCoDinh }: { thuNgan: string; nguonLich: string; viTri: string; khach: KhachChon | null; coTheTien: boolean; coTheDichVu: boolean; hang: string; ngayLui: string; onNgayLui: (v: string) => void; /** Đang sửa hoá đơn cũ: ngày giữ nguyên, không lùi được. */ ngayCoDinh?: string }) {
  const [vao] = useState(() => new Date());
  const [suaNgay, setSuaNgay] = useState(false);
  const gio = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
  const ngay = vao.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  const nhanLui = ngayLui ? `${ngayLui.slice(11, 16)} ${ngayLui.slice(8, 10)}/${ngayLui.slice(5, 7)}/${ngayLui.slice(0, 4)}` : "";
  const muc: [string, string][] = [["Giờ vào", gio(vao)]];
  if (viTri) muc.push(["Vị trí / chỗ", viTri]);
  if (thuNgan) muc.push(["Nhân viên thu ngân", thuNgan]);
  return (
    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
      {nguonLich && <div className="flex gap-1.5"><dt className="text-muc-3">Đặt lịch từ:</dt><dd className="font-medium text-muc">{nguonLich}</dd></div>}
      {/* SalonHero: "Ngày tạo" có cây bút, chọn ngày + giờ, chỉ lùi không tiến. Doanh thu và tiền thu của đơn ghi về ngày đã chọn. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <dt className="text-muc-3">Ngày hoá đơn:</dt>
        {ngayCoDinh ? <dd className="font-medium text-muc">{ngayCoDinh}</dd> : suaNgay ? (
          <dd className="flex items-center gap-2">
            <input type="datetime-local" aria-label="Ngày hoá đơn (chỉ lùi)" value={ngayLui || gioVNChuoi(vao)} max={gioVNChuoi(new Date())} onChange={(e) => onNgayLui(e.target.value)} className="h-8 rounded-nho border border-vien-dam px-2 text-[13px]" />
            <button type="button" className="text-[12px] font-medium text-nhan-dam hover:underline" onClick={() => setSuaNgay(false)}>Xong</button>
            {ngayLui && <button type="button" className="text-[12px] text-muc-3 hover:underline" onClick={() => { onNgayLui(""); setSuaNgay(false); }}>Bỏ lùi ngày</button>}
          </dd>
        ) : (
          <dd className="flex items-center gap-1 font-medium text-muc">
            <span className={ngayLui ? "text-canh-bao" : ""}>{ngayLui ? `${nhanLui} (lùi ngày)` : `${gio(vao)} ${ngay}`}</span>
            <button type="button" aria-label="Sửa ngày hoá đơn" title="Lùi ngày hoá đơn" className="p-1 text-muc-3 hover:text-nhan-dam" onClick={() => setSuaNgay(true)}><Pencil strokeWidth={1.6} className="h-3.5 w-3.5" /></button>
          </dd>
        )}
      </div>
      {muc.map(([n, v]) => <div key={n} className="flex gap-1.5"><dt className="text-muc-3">{n}:</dt><dd className="font-medium text-muc">{v}</dd></div>)}
      {khach && hang && <div><dd className="rounded-tag bg-sac-cam-nen px-2 py-0.5 text-[12px] font-medium text-sac-cam">Hạng {hang}</dd></div>}
      {khach && coTheDichVu && <div><dd className="rounded-tag bg-sac-xanh-nen px-2 py-0.5 text-[12px] font-medium text-sac-xanh">Có thẻ dịch vụ</dd></div>}
      {khach && coTheTien && <div><dd className="rounded-tag bg-sac-luc-nen px-2 py-0.5 text-[12px] font-medium text-sac-luc">Có thẻ tiền</dd></div>}
    </dl>
  );
}

/** Số dòng sẵn có lúc dựng đơn (nháp mở lại / đơn đầu từ lịch hẹn): có dòng thì hiện danh mục ngay. */
const dong0 = (nhapDau: DonNhapRut | undefined, dauTien: boolean, dongBanDau: DongDon[]) => (nhapDau ? nhapDau.dong.length : dauTien ? dongBanDau.length : 0);

/** Đơn làm dịch vụ: các dịch vụ khách ĐÃ MUA còn buổi (thẻ liệu trình), mỗi thẻ một nút "Làm buổi này" (đúng luồng Dùng buổi). */
function DvDaMua({ khach, the, nut, coQuyen }: { khach: boolean; the: TheKh[] | null; nut: (t: TheKh) => React.ReactNode; coQuyen: boolean }) {
  const han = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <section aria-label="Dịch vụ khách đã mua" className="mt-4 rounded-the border border-vien bg-sac-xanh-nen px-3 py-3">
      <p className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-muc"><Sparkles aria-hidden strokeWidth={1.7} className="h-4 w-4 text-sac-xanh" />Dịch vụ khách đã mua</p>
      {!khach ? <p className="text-[14px] text-muc-2">Chọn khách ở ô trên trước để hiện các dịch vụ khách đã mua còn buổi.</p>
        : the === null ? <p className="text-[14px] text-muc-3">Đang tải</p>
        : the.length === 0 ? <p className="text-[14px] text-muc-2">Khách chưa có thẻ liệu trình nào còn buổi. Khách làm dịch vụ lẻ thì bấm Thêm dịch vụ lẻ bên dưới.</p> : (
          <ul className="divide-y divide-vien">
            {the.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 text-[14px]">
                  <span className="block font-medium text-muc">{t.ten}</span>
                  <span className="block text-[13px] text-muc-3">{t.ma}{t.han ? ` · Hạn ${han(t.han)}` : ""}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[14px] font-semibold tabular-nums text-sac-xanh">Còn {t.buoiCon}{t.buoiTong ? `/${t.buoiTong}` : ""} buổi</span>
                  {nut(t)}
                </span>
              </li>
            ))}
          </ul>
        )}
      {khach && !coQuyen && <p className="mt-2 text-[13px] text-muc-3">Tài khoản này chưa có quyền trừ buổi thẻ.</p>}
    </section>
  );
}

/** Hai danh sách thẻ như SalonHero: "Thẻ khách đang có" (liệu trình còn buổi, thẻ tiền còn số dư) và "Thẻ bán cho khách hàng" (thẻ đang nằm trong đơn này). */
function TheCuaKhach({ the: dsThe, theBan, nut, dvDon, giaHan }: { the: TheKh[] | null; theBan: { ten: string; sl: number }[]; nut?: (t: TheKh) => React.ReactNode; dvDon?: Map<string, string>; giaHan?: (t: TheKh) => (() => void) | null }) {
  // Dịch vụ đang có trong đơn mà thẻ liệu trình của khách trừ được: đưa thẻ đó lên đầu và ghi rõ (trừ buổi thay vì thu tiền).
  const dungDuoc = (t: TheKh) => (t.loai === "lan" && dvDon ? t.dichVu.filter((d) => dvDon.has(d)).map((d) => dvDon.get(d)!) : []);
  const the = dsThe && [...dsThe].sort((a, b) => Number(dungDuoc(b).length > 0) - Number(dungDuoc(a).length > 0));
  if (the === null && theBan.length === 0) return null;
  const han = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
      <div className="rounded-nho border border-vien px-3 py-2.5">
        <p className="mb-1.5 font-semibold text-muc">Thẻ khách đang có</p>
        {the === null ? <p className="text-muc-3">Đang tải</p> : the.length === 0 ? <p className="text-muc-3">Khách chưa có thẻ nào còn dùng được.</p> : (
          <ul className="space-y-1.5">
            {the.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3"><span className="min-w-0 text-muc-2">{giaHan?.(t) ? <button type="button" title="Thêm lại đúng gói này vào đơn (gia hạn)" className="text-left font-medium text-nhan-dam hover:underline" onClick={giaHan(t)!}>{t.ten}</button> : t.ten} <span className="text-muc-3">{t.ma}</span>{t.han && <span className="block text-[12px] text-muc-3">Hạn {han(t.han)}</span>}
                {dungDuoc(t).length > 0 && <span className="mt-0.5 block rounded-tag bg-sac-xanh-nen px-2 py-0.5 text-[12px] font-medium text-sac-xanh">Trừ buổi được cho: {dungDuoc(t).join(", ")}</span>}</span>
                <span className="flex shrink-0 flex-col items-end gap-0.5"><span className="font-medium tabular-nums text-muc">{t.loai === "lan" ? `${t.buoiCon}${t.buoiTong ? `/${t.buoiTong}` : ""} buổi` : tienVN(t.soDu)}</span>{nut?.(t)}{giaHan?.(t) && <button type="button" className={NUT_CHU} onClick={giaHan(t)!}>Gia hạn</button>}</span></li>
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

function DonPos({ suaHd, nguonGt = [], buoi, muc, nhanVien, khachBanDau, dongBanDau, chiNhanhId, chiNhanh, khoaChiNhanh, lichId: lichGoc, soKhachLich, choGiam = true, choTip = true, thuNgan = "", nguonLich = "", viTriLich = "", taiKhoanNhan = [], taoMoi = false, tim, layThe, layDiem, layTheKh, chot, voucher, dsVoucher: dsVc, luuNhap, xoaNhap, k, kieu, nhapDau, onNhap, dauTien, dangXem, onDonChoKhach, onDoi, onXong, onHuy }: PropsPos & {
  k: number; kieu: KieuDon; nhapDau?: DonNhapRut; onNhap: () => void; dauTien: boolean; dangXem: boolean; onDonChoKhach: (d: DonChoKhach) => void; onDoi: (k: number, ten: string, soDong: number) => void; onXong: (kq: { id: string; ma: string; datLichKhach?: string | null }) => void; onHuy: () => void;
}) {
  const lichId = dauTien ? lichGoc : null;
  const router = useRouter();
  const [dang, bat] = useTransition();
  const sua = dauTien && !nhapDau ? suaHd ?? null : null;
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
  // Đơn bán mở sẵn tab Thẻ và liệu trình; đơn làm dịch vụ mở tab Dịch vụ (danh mục dịch vụ lẻ ẩn sau nút "Thêm dịch vụ lẻ").
  const [tab, setTab] = useState<MucBan["loai"]>(kieu === "dich_vu" ? "dich_vu" : "goi_the");
  const [moLe, setMoLe] = useState(kieu !== "dich_vu" || dong0(nhapDau, dauTien, dongBanDau) > 0);
  const [tu, setTu] = useState("");
  // Lọc hai chiều như SalonHero: vừa chọn thẻ liệu trình → tab Dịch vụ chỉ còn dịch vụ của thẻ; vừa chọn dịch vụ → tab Thẻ chỉ còn thẻ có dịch vụ đó.
  const [loc, setLoc] = useState<{ loai: "dich_vu" | "goi_the"; id: string; ten: string; dv: string[] } | null>(null);
  const [sapXep, setSapXep] = useState<"ten" | "gia_tang" | "gia_giam" | "moi_nhat">("ten");
  const [dong, setDong] = useState<DongDon[]>(nhapDau ? nhapDau.dong : dauTien ? dongBanDau : []);
  const [giamDon, setGiamDon] = useState(sua?.giamDon ?? 0);
  const [giamPct, setGiamPct] = useState("");
  const [vatPct, setVatPct] = useState(String(sua?.vatPct ?? 0));
  const [phuPhi, setPhuPhi] = useState(sua?.phuPhi ?? 0);
  const [tip, setTip] = useState(sua?.tip ?? 0);
  const [ghiChu, setGhiChu] = useState(sua?.ghiChu ?? "");
  const [gioVao, setGioVao] = useState(sua?.gioVao ?? "");
  const [gioRa, setGioRa] = useState(sua?.gioRa ?? "");
  const [soKhach, setSoKhach] = useState(String(sua?.soKhach ?? (dauTien && !nhapDau && soKhachLich ? soKhachLich : 1)));
  /** Lùi ngày hoá đơn ("YYYY-MM-DDTHH:MM" giờ VN), trống = lúc chốt. */
  const [ngayHd, setNgayHd] = useState("");
  const [thu, setThu] = useState<KhoanThu[]>([]);
  /** Tiền khách đưa (chỉ hiển thị để tính tiền thối, không gửi lên máy chủ). */
  const [khachDua, setKhachDua] = useState(0);
  const [theTienTai, setTheTien] = useState<TheTien[]>([]);
  const [loi, setLoi] = useState("");
  const [suaNv, setSuaNv] = useState<number | null>(null);
  const [diemTai, setDiemTai] = useState<{ khachId: string; soDu: number; bat: boolean; tienMoiDiem: number } | null>(null);
  const [diemNhap, setDiemNhap] = useState("");
  const [moVc, setMoVc] = useState(false);
  const [moHh, setMoHh] = useState(false);
  const [taiLaiThe, setTaiLaiThe] = useState(0);
  const [phieuBuoi, setPhieuBuoi] = useState<{ kq: KetQuaBuoi; khachId: string } | null>(null);
  const [theKh, setTheKh] = useState<{ khachId: string; hang: string; the: TheKh[] } | null>(null);
  const [vc, setVc] = useState<VoucherTim | null>(null);
  const [suaGt, setSuaGt] = useState<number | null>(null);
  /** Điện thoại: giỏ (đơn hàng + thanh toán) mở thành bảng trượt từ đáy; máy tính luôn hiện cột phải. */
  const [moGio, setMoGio] = useState(false);
  useEffect(() => {
    if (!moGio) return;
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector('[role="dialog"], [role="listbox"]')) setMoGio(false); };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, [moGio]);
  // Hộp thanh toán như SalonHero: tick "Đặt lịch hẹn tiếp theo" và "In hoá đơn sau khi hoàn thành" (tiếng Việt / tiếng Anh). Lựa chọn in nhớ trong trình duyệt.
  const KHOA_IN = "amia-pos-in-sau";
  const [datLichTiep, setDatLichTiep] = useState(false);
  // Đọc qua useSyncExternalStore: máy chủ dựng với mặc định (không tick), trình duyệt đọc lựa chọn đã nhớ — không lệch khi hydrate.
  const inSauTho = useSyncExternalStore(dangKyInSau, () => { try { return localStorage.getItem(KHOA_IN); } catch { return null; } }, () => null);
  const inSau = useMemo<{ bat: boolean; nn: NgonNguIn }>(() => { try { const v = JSON.parse(inSauTho ?? "null") as { bat?: boolean; nn?: string } | null; return { bat: !!v?.bat, nn: v?.nn === "en" ? "en" : "vi" }; } catch { return { bat: false, nn: "vi" }; } }, [inSauTho]);
  const doiInSau = (v: { bat: boolean; nn: NgonNguIn }) => { try { localStorage.setItem(KHOA_IN, JSON.stringify(v)); } catch { /* bỏ qua */ } window.dispatchEvent(new Event(SU_KIEN_IN_SAU)); };
  /** Nợ chia theo dòng do thu ngân sửa tay; khoá = số nợ + các dòng lúc sửa (đổi đơn thì chia lại theo tỉ lệ). */
  const [noTay, setNoTay] = useState<{ khoa: string; ds: number[] } | null>(null);

  const tuMuc = useMemo(() => new Map(muc.map((m) => [khoaDong({ loai: m.loai, ref: m.id }), m])), [muc]);
  useEffect(() => {
    if (!khach) return;
    let con = true;
    layThe(khach.id).then((r) => con && setTheTien(r));
    layDiem(khach.id).then((r) => con && setDiemTai(r ? { khachId: khach.id, ...r } : null));
    layTheKh(khach.id).then((r) => con && setTheKh(r ? { khachId: khach.id, ...r } : null));
    return () => { con = false; };
  }, [khach, layThe, layDiem, layTheKh, taiLaiThe]);
  useEffect(() => { onDoi(k, khach?.ho_ten ?? "", dong.length); }, [k, khach, dong.length, onDoi]);

  const theTien = khach ? theTienTai : [];
  const theKhach = khach && theKh?.khachId === khach.id ? theKh : null;
  // Bấm nhanh ở "Thẻ khách đang có": thẻ liệu trình → "Dùng buổi" chọn sẵn dịch vụ của gói (trừ 1 buổi ngay, không phải tìm lại dịch vụ);
  // thẻ tiền → thêm khoản thu "Trừ thẻ tiền" đúng thẻ đó, số tiền = phần còn phải thu (không quá số dư).
  const dvMuc = useMemo(() => muc.filter((m) => m.loai === "dich_vu").map((m) => ({ gia_tri: m.id, nhan: m.ten })), [muc]);
  const nvLC = useMemo(() => luaChonNhanVien(nhanVien.map((n) => ({ id: n.id, ho_ten: n.ten, vai_tro: n.vaiTro }))), [nhanVien]);
  const bacSiLC = useMemo(() => [{ gia_tri: "", nhan: "Không có" }, ...nhanVien.filter((n) => n.vaiTro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ten }))], [nhanVien]);
  const dvDon = useMemo(() => new Map(dong.filter((d) => d.loai === "dich_vu").map((d) => [d.ref, tuMuc.get(khoaDong(d))?.ten ?? ""])), [dong, tuMuc]);
  const nutThe = (t: TheKh, nhan = "Dùng buổi") => {
    if (t.loai === "lan") {
      if (!buoi || t.buoiCon <= 0) return null;
      const dvThe = dvMuc.filter((d) => t.dichVu.includes(d.gia_tri));
      return <NutBuoi theId={t.id} macDinh={t.lanTruoc} nhanVien={nvLC} bacSi={bacSiLC} dichVu={dvThe.length ? dvThe : dvMuc} lichId={lichId ?? undefined} nhan={nhan}
        onXong={(r) => setPhieuBuoi(r.phieuId && khach ? { kq: r, khachId: khach.id } : null)} action={async (fd) => { const r = await buoi(fd); if (r.ok) setTaiLaiThe((x) => x + 1); return r; }} />;
    }
    if (t.soDu <= 0) return null;
    const daCo = thu.some((x) => x.phuong_thuc === "the_tien" && x.the_id === t.id);
    return <button type="button" className={NUT_CHU} disabled={daCo || conNo <= 0}
      onClick={() => setThu((x) => [...x, { phuong_thuc: "the_tien", the_id: t.id, so_tien: Math.min(t.soDu, Math.max(conNo, 0)) }])}>{daCo ? "Đã trừ thẻ" : "Trừ thẻ"}</button>;
  };
  // "Gia hạn": bấm tên thẻ hoặc nút Gia hạn là thêm lại đúng gói thẻ đó vào đơn (giá, số buổi theo gói đang bán), chỉ còn tính tiền.
  // Gói đã ngừng bán / không hiện ở thu ngân thì không có nút.
  const giaHan = (t: TheKh) => {
    const m = muc.find((x) => x.loai === "goi_the" && x.id === t.goiId && hienOThuNgan(x, cnId));
    return m ? () => them(m) : null;
  };
  const theBan = dong.filter((d) => d.loai === "goi_the").map((d) => ({ ten: tuMuc.get(khoaDong(d))?.ten ?? "Thẻ", sl: d.sl }));
  const hang = dong.reduce((s, d) => s + giaDong(d, tuMuc.get(khoaDong(d))) * d.sl - d.giam, 0);
  // Voucher: tính lại theo dòng hàng hiện tại (đổi dòng thì tiền giảm đổi theo). Đơn chưa đủ điều kiện thì tiền giảm = 0 và báo lý do.
  const thanhDong = dong.map((d) => ({ loai: d.loai, ref: d.ref, thanh: giaDong(d, tuMuc.get(khoaDong(d))) * d.sl - d.giam }));
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
  const tienMat = thu.filter((t) => t.phuong_thuc === "tien_mat").reduce((s, t) => s + t.so_tien, 0);
  // "Xác nhận các mục còn nợ" (SalonHero): nợ chia theo từng dòng, mặc định theo tỉ lệ thành tiền, sửa tay được; tổng phải bằng số còn nợ.
  const khoaNo = `${conNo}|${dong.map((d) => `${khoaDong(d)}:${d.sl}:${d.giam}:${d.gia ?? ""}`).join(",")}`;
  const noDong = conNo > 0 ? (noTay?.khoa === khoaNo ? noTay.ds : chiaNoTheoDong(thanhDong.map((x) => x.thanh), conNo)) : [];
  const tongNoDong = noDong.reduce((a, b) => a + b, 0);
  const { traLai, thieu } = tinhTraLai(khachDua, tienMat);
  useEffect(() => {
    if (!dangXem) return;
    onDonChoKhach({
      khach: khach?.ho_ten ?? "", dong: dong.map((d) => ({ ten: tuMuc.get(khoaDong(d))?.ten ?? "", sl: d.sl, thanh: giaDong(d, tuMuc.get(khoaDong(d))) * d.sl - d.giam })),
      hang, giam: giamDon + tienDiem + tienVoucher, vat, phuPhiTip: phuPhi + tip, phai, daThu, conNo,
    });
  }, [dangXem, onDonChoKhach, khach, dong, tuMuc, hang, giamDon, tienDiem, tienVoucher, vat, phuPhi, tip, phai, daThu, conNo]);

  const them = (m: MucBan) => {
    if (m.loai === "goi_the" && m.dichVu?.length) setLoc({ loai: "goi_the", id: m.id, ten: m.ten, dv: m.dichVu });
    else if (m.loai === "dich_vu") setLoc({ loai: "dich_vu", id: m.id, ten: m.ten, dv: [] });
    setDong((ds) => {
      const i = ds.findIndex((d) => khoaDong(d) === khoaDong({ loai: m.loai, ref: m.id }));
      if (i >= 0) return ds.map((d, j) => (j === i ? { ...d, sl: d.sl + 1 } : d));
      const macDinhBan = khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [];
      // Gợi ý người giới thiệu: khách có nguồn giới thiệu (đặt lịch qua link REF) thì dòng mới tự mang nguồn đó, thu ngân sửa/bỏ được.
      const gt = gtGoiY(nguonGt, khach?.doi_tac_id, m.loai, m.id);
      return [...ds, { loai: m.loai, ref: m.id, sl: 1, giam: 0, nv: { phuc_vu: [], tu_van: [], ban: macDinhBan }, ...(gt ? { gt } : {}) }];
    });
  };
  // Dòng đang giảm theo % thì đổi số lượng / giá vẫn giữ đúng %.
  const capNhat = (i: number, p: Partial<DongDon>) => setDong((ds) => ds.map((d, j) => {
    if (j !== i) return d;
    const m2 = { ...d, ...p };
    if (!("giam" in p) && m2.pct) m2.giam = giamTheoPct(giaDong(m2, tuMuc.get(khoaDong(m2))), m2.sl, m2.pct);
    return m2;
  }));
  const apPctTatCa = (pct: number) => setDong((ds) => ds.map((x) => ({ ...x, pct: pct || undefined, giam: giamTheoPct(giaDong(x, tuMuc.get(khoaDong(x))), x.sl, pct) })));

  // Sắp xếp như SalonHero (Tên A-Z, giá thấp-cao, giá cao-thấp); xếp trong từng nhóm vì danh mục hiện theo nhóm.
  // Ô chọn mục chỉ hiện mục "Nơi hiển thị" có Thu ngân và cung cấp ở chi nhánh đang bán (dòng đã có trong đơn vẫn giữ).
  const mucHien = useMemo(() => muc.filter((m) => hienOThuNgan(m, cnId)), [muc, cnId]);
  const locTab = loc && ((tab === "dich_vu" && loc.loai === "goi_the") || (tab === "goi_the" && loc.loai === "dich_vu")) ? loc : null;
  const hopLoc = (m: MucBan) => !locTab || (locTab.loai === "goi_the" ? locTab.dv.includes(m.id) : !!m.dichVu?.includes(locTab.id));
  const dsMuc = mucHien.filter((m) => m.loai === tab && hopLoc(m) && khopMuc(m, tu))
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
    for (const t of thu) if (t.phuong_thuc === "vi_dien_tu" && !t.loai_vi) return setLoi("Chọn loại ví cho khoản thu bằng ví điện tử.");
    if (conNo > 0 && tongNoDong !== conNo) return setLoi(`Các mục còn nợ đang cộng ${tienVN(tongNoDong)}, phải đúng ${tienVN(conNo)}.`);
    // In sau khi hoàn thành: mở sẵn cửa sổ ngay lúc bấm (trình duyệt chặn cửa sổ mở sau khi chờ máy chủ), chốt xong mới nạp trang in.
    const cuaSoIn = inSau.bat ? window.open("about:blank", "_blank") : null;
    bat(async () => {
      const kq = await chot(JSON.stringify({ khachId: khach?.id ?? null, lichId, chiNhanhId: cnId, dong: dong.map((d, i) => ({ ...d, no: conNo > 0 ? noDong[i] : undefined })), giamDon, vatPct: Number(vatPct) || 0, phuPhi, tip, nguoiGioiThieu: "", ghiChu, thu, doiDiem: diem, voucher: vc?.ma ?? "", gioVao, gioRa, soKhach: Number(soKhach) || 1, ngayHd: sua ? "" : ngayHd, hoaDonId: sua?.id, khachDua: tienMat > 0 ? khachDua : 0 }));
      if ("loi" in kq && kq.loi) { setLoi(kq.loi); cuaSoIn?.close(); }
      else if ("id" in kq) {
        if (cuaSoIn) cuaSoIn.location.href = `/in/hoa-don/${kq.id}${inSau.nn === "en" ? "?nn=en" : ""}`;
        if (nhapId) { await xoaNhap(nhapId); onNhap(); }
        onXong({ id: kq.id, ma: kq.ma, datLichKhach: datLichTiep && khach ? khach.id : null });
      }
    });
  };
  // "In hoá đơn" trước khi chốt (SalonHero có nút In trong hộp thanh toán): in tạm tính đơn đang dựng theo Thiết lập in của chi nhánh; dữ liệu chỉ nằm trong trình duyệt.
  const inTamTinh = () => {
    const c = CHU_IN[inSau.nn];
    const d: DuLieuIn = {
      loai: "hoa_don", cuaHang: { ten: chiNhanh.find((x) => x.id === cnId)?.ten ?? "AMIA" }, tieuDe: c.tamTinh, ma: "", ngay: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }), trangThai: "nhap", thuNgan, ghiChu, nn: inSau.nn,
      khach: khach ? { ten: khach.ho_ten, sdt: khach.dien_thoai } : null,
      dong: dong.map((x) => { const m = tuMuc.get(khoaDong(x)); const g = giaDong(x, m); return { ten: m?.ten ?? "", ghiChu: x.ghiChu, soLuong: x.sl, donGia: g, giamGia: x.giam, thanhTien: g * x.sl - x.giam }; }),
      tongHang: hang, giamDon: giamDon + tienDiem + tienVoucher, vatPct: Number(vatPct) || 0, vatTien: vat, phuPhi, tip, phaiThu: phai,
      thanhToan: thu.map((t) => ({ nhan: `${c.daThu} · ${inSau.nn === "en" ? PHUONG_THUC_EN[t.phuong_thuc] ?? t.phuong_thuc : PHUONG_THUC.find((p) => p.gia_tri === t.phuong_thuc)?.nhan ?? t.phuong_thuc}`, soTien: t.so_tien })),
      conNo: Math.max(conNo, 0), khachDua: tienMat > 0 && khachDua > 0 ? khachDua : null, traLai: tienMat > 0 && khachDua > 0 ? traLai : null,
    };
    try { localStorage.setItem("amia-in-tam-tinh", JSON.stringify(d)); } catch { return setLoi("Trình duyệt đang chặn lưu tạm nên chưa in được."); }
    window.open(`/in/tam-tinh?cn=${cnId}`, "_blank");
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
      <section className="pos-chu-lon min-w-0">
        <div className="mb-4 text-[13px] text-muc-2"><span className="mb-1 block">Chi nhánh bán</span>
          <Chon ariaLabel="Chi nhánh bán" luaChon={chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} giaTri={cnId} onDoi={(id) => { setCnId(id); setVc(null); }} trong="Chọn chi nhánh" voHieu={khoaChiNhanh} />
        </div>
        <ChonKhach tuFocus={kieu === "dich_vu" && !dauTien} khach={khach} onDoi={(k) => { setKhach(k); setDiemNhap(""); setVc(null); setThu((t) => t.filter((x) => x.phuong_thuc !== "the_tien")); }} tim={tim} />
        {sua && <p role="status" className="mt-2 rounded-nho bg-canh-bao-nen px-3 py-2 text-[13px] text-canh-bao">Đang sửa hoá đơn <b>{sua.ma}</b> (đã mở lại về nháp). Chốt đơn sẽ ghi lại vào chính hoá đơn này, giữ mã và ngày {ngayVN(sua.ngayHd)}.</p>}
        <ThongTinDon thuNgan={thuNgan} nguonLich={nguonLich} viTri={viTriLich} khach={khach} coTheTien={theTien.length > 0} coTheDichVu={!!theKhach?.the.some((t) => t.loai === "lan")} hang={theKhach?.hang ?? ""} ngayLui={ngayHd} onNgayLui={setNgayHd} ngayCoDinh={sua ? `${ngayVN(sua.ngayHd)} (giữ ngày hoá đơn cũ)` : undefined} />
        {khach && <TheCuaKhach the={theKhach?.the ?? null} theBan={theBan} nut={nutThe} dvDon={dvDon} giaHan={giaHan} />}
        {khach && phieuBuoi?.khachId === khach.id && <p className="mt-1.5"><BaoPhieuBuoi phieu={phieuBuoi.kq} /></p>}
        {diemKhach && (
          <p className="mt-2 text-[13px] text-muc-3">Điểm thưởng: <span className="font-medium tabular-nums text-muc">{diemKhach.soDu.toLocaleString("vi-VN")} điểm</span>
            {diemKhach.bat ? ` · 1 điểm = ${tienVN(diemKhach.tienMoiDiem)}` : " · đổi điểm đang tắt"}</p>
        )}
        {kieu === "dich_vu" && <DvDaMua khach={!!khach} the={theKhach ? theKhach.the.filter((t) => t.loai === "lan" && t.buoiCon > 0) : null} nut={(t) => nutThe(t, "Làm buổi này")} coQuyen={!!buoi} />}
        {!moLe && (
          <button type="button" onClick={() => setMoLe(true)} className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-nho border border-dashed border-vien-dam text-[14px] font-medium text-nhan-dam hover:bg-giay-tram">
            <Plus aria-hidden strokeWidth={2} className="h-4 w-4" />Thêm dịch vụ lẻ (khách làm thêm, tính tiền)
          </button>
        )}
        {moLe && (<>
        {/* Điện thoại: dải loại + ô tìm + sắp xếp dính trên đầu vùng cuộn, cuộn danh sách dài vẫn đổi tab / tìm được ngay. */}
        <div className="max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:-mx-4 max-lg:mt-4 max-lg:bg-giay max-lg:px-4 max-lg:pb-2 max-lg:shadow-[0_8px_12px_-12px_rgb(10_43_38/0.35)]">
        <div className="flex gap-1 overflow-x-auto border-b border-vien [scrollbar-width:none] lg:mt-5 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Danh mục bán">
          {LOAI_TAB.map((t) => (
            <button key={t.ma} type="button" role="tab" aria-selected={tab === t.ma} onClick={() => setTab(t.ma)}
              className={`-mb-px flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 py-2.5 text-[14px] lg:gap-2 lg:px-4 ${tab === t.ma ? "border-nhan font-semibold text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}><span className="lg:hidden">{t.ngan}</span><span className="max-lg:hidden">{t.ten}</span><span className={`rounded-tag px-1.5 py-0.5 text-[11px] tabular-nums ${tab === t.ma ? "bg-nhan-dam text-giay" : "bg-giay-tram text-muc-3"}`}>{mucHien.filter((m) => m.loai === t.ma).length}</span></button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 lg:mt-4">
          <div className="relative">
            <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
            <input value={tu} onChange={(e) => setTu(e.target.value)} placeholder="Tìm tên, mã hoặc mã vạch" aria-label="Tìm trong danh mục" className={`${O_NHAP} pl-9`} />
          </div>
          <div className="w-32 lg:w-40"><Chon nho ariaLabel="Sắp xếp danh mục" giaTri={sapXep} luaChon={[{ gia_tri: "ten", nhan: "Tên A-Z" }, { gia_tri: "gia_tang", nhan: "Giá thấp-cao" }, { gia_tri: "gia_giam", nhan: "Giá cao-thấp" }, { gia_tri: "moi_nhat", nhan: "Mới nhất" }]} onDoi={(v) => setSapXep(v as typeof sapXep)} /></div>
        </div>
        {locTab && <p role="status" className="mt-2 lg:mt-3 flex flex-wrap items-center gap-2 rounded-nho bg-sac-xanh-nen px-3 py-2 text-[13px] text-sac-xanh">{locTab.loai === "goi_the" ? "Chỉ hiện dịch vụ của thẻ" : "Chỉ hiện thẻ có dịch vụ"} <b>{locTab.ten}</b><button type="button" className={`ml-auto ${NUT_CHU}`} onClick={() => setLoc(null)}>Hiện tất cả</button></p>}
        </div>
        <div className="mt-3 space-y-5 lg:mt-4">
          {nhomMuc.map((n) => {
            const sac = sacCua(n), ds = dsMuc.filter((m) => m.nhom === n), Bt = BIEU_TUONG[tab];
            return (
              <div key={n}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span aria-hidden className={`h-3 w-1.5 rounded-tag ${sac.cham}`} />
                  <span className="nhan-muc">{n}</span>
                  <span className={`rounded-tag px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${sac.chip}`}>{ds.length}</span>
                </div>
                <div className="grid gap-1.5 lg:grid-cols-2 lg:gap-2.5 xl:grid-cols-3">
                  {ds.map((m) => {
                    const daChon = dong.filter((d) => khoaDong(d) === `${m.loai}:${m.id}`).reduce((t, d) => t + d.sl, 0);
                    return (
                      // Điện thoại: dòng gọn (tên 2 dòng + giá, ô + 44px bên phải, chạm cả dòng là thêm); máy tính (lg+) giữ thẻ như cũ.
                      <button key={m.id} type="button" data-muc onClick={() => them(m)} aria-label={`Thêm ${m.ten}, ${tienVN(m.gia)}${daChon ? `, đã chọn ${daChon}` : ""}`}
                        className={`group relative flex items-center gap-3 rounded-the border border-l-4 bg-gradient-to-b from-giay-sang to-giay py-1.5 pl-3 pr-1.5 text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 active:bg-giay-tram lg:items-start lg:px-3 lg:py-3 lg:hover:-translate-y-0.5 lg:hover:border-nhan lg:hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nhan ${sac.vien} ${daChon ? "border-nhan ring-1 ring-nhan" : "border-vien"}`}>
                        <span className={`mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-nho lg:flex ${sac.chip}`}><Bt aria-hidden strokeWidth={1.7} className="h-[18px] w-[18px]" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[15px] font-medium leading-snug text-muc lg:line-clamp-none lg:block lg:text-[14px]">{m.ten}</span>
                          <span className={`mt-0.5 block text-[14px] font-semibold tabular-nums lg:mt-1 lg:text-[15px] ${sac.gia}`}>{tienVN(m.gia)}</span>
                        </span>
                        <span aria-hidden className="flex shrink-0 items-center gap-1.5 lg:hidden">
                          {daChon > 0 && <span className="rounded-tag bg-nhan-dam px-1.5 py-0.5 text-[13px] font-semibold tabular-nums text-giay">×{daChon}</span>}
                          <span className={`flex h-11 w-11 items-center justify-center rounded-nho ${daChon ? "bg-nhan text-giay" : "bg-nhan-nhat text-nhan-dam"}`}><Plus strokeWidth={2.2} className="h-5 w-5" /></span>
                        </span>
                        {daChon > 0
                          ? <span className="absolute right-2 top-2 hidden rounded-tag bg-nhan-dam px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-giay lg:block">×{daChon}</span>
                          : <Plus aria-hidden strokeWidth={2} className="absolute right-2.5 top-2.5 hidden h-4 w-4 text-muc-3 opacity-0 transition-opacity group-hover:opacity-100 lg:block" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {dsMuc.length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Không có mục nào.</p>}
          {taoMoi && (
            // Như ô "TẠO THẺ MỚI / Tạo dịch vụ mới / Tạo sản phẩm mới" cuối lưới Thu ngân SalonHero (bấm là sang trang danh mục).
            // Mở tab mới để đơn đang bán không mất; tạo xong quay lại đây bấm "Tải lại danh mục" là có mục mới.
            <div className="flex flex-wrap items-center gap-3 rounded-the border border-dashed border-vien-dam px-3 py-3">
              <Link href={TAO_MOI[tab].href} target="_blank" rel="noopener" className="flex items-center gap-2 text-[14px] font-medium text-nhan-dam hover:underline">
                <Plus aria-hidden strokeWidth={2} className="h-4 w-4" />{TAO_MOI[tab].nhan}
              </Link>
              <button type="button" onClick={() => router.refresh()} className={NUT_CHU}>Tải lại danh mục</button>
            </div>
          )}
        </div>
        </>)}
      </section>

      {/* Điện thoại: giỏ là bảng trượt từ đáy (mở bằng thanh giỏ dính đáy), có đầu bảng + chân bảng "Phải thu / Chốt đơn" luôn trong tầm ngón cái.
          Máy tính (lg+): cột phải dính như cũ, các lớp max-lg không áp. */}
      {moGio && <button type="button" aria-label="Đóng giỏ hàng" tabIndex={-1} className="fixed inset-0 z-50 bg-muc/45 lg:hidden" onClick={() => setMoGio(false)} />}
      <aside aria-label="Đơn hàng" data-gio
        className={`min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-hop ${moGio ? "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-[5dvh] max-lg:z-50 max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:rounded-t-[20px] max-lg:bg-giay max-lg:shadow-[0_-18px_40px_-12px_rgba(6,26,23,0.5)]" : "max-lg:hidden"}`}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-vien px-2 pb-1 pt-2 lg:hidden">
          <button type="button" onClick={() => setMoGio(false)} className="flex h-11 items-center gap-1.5 rounded-nho px-2 text-[15px] font-medium text-nhan-dam active:bg-giay-tram"><Plus aria-hidden strokeWidth={2} className="h-4 w-4" />Chọn thêm món</button>
          <span aria-hidden className="h-1 w-10 rounded-[3px] bg-vien-dam" />
          <button type="button" aria-label="Đóng giỏ hàng" onClick={() => setMoGio(false)} className="flex h-11 w-11 items-center justify-center rounded-nho text-muc-2 active:bg-giay-tram"><X strokeWidth={1.8} className="h-5 w-5" /></button>
        </div>
        {/* Bàn phím điện thoại mở lên thì đưa ô đang nhập ra giữa vùng nhìn thấy (không bị bàn phím / chân bảng che). */}
        <div className="pos-chu-lon max-lg:min-h-0 max-lg:flex-1 max-lg:scroll-pb-28 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:px-3 max-lg:py-3"
          onFocusCapture={(e) => { const o = e.target as HTMLElement; if (moGio && /^(INPUT|TEXTAREA)$/.test(o.tagName)) setTimeout(() => o.scrollIntoView({ block: "center", behavior: "smooth" }), 300); }}>
        <div className="mb-3 lg:hidden">
          <ChonKhach khach={khach} onDoi={(k) => { setKhach(k); setDiemNhap(""); setVc(null); setThu((t) => t.filter((x) => x.phuong_thuc !== "the_tien")); }} tim={tim} />
        </div>
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
                    <div className="min-w-0"><div className="text-[14px] font-medium text-muc">{m.ten}</div><div className="text-[12px] text-muc-3 tabular-nums">{tienVN(giaDong(d, m))} / đơn vị{d.gia != null && d.gia !== m.gia ? <span className="ml-1 text-canh-bao">(giá gốc {tienVN(m.gia)})</span> : null}</div></div>
                    <button type="button" aria-label={`Bỏ ${m.ten}`} onClick={() => setDong((ds) => ds.filter((_, j) => j !== i))} className="-mr-2 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center text-muc-3 hover:text-loi lg:m-0 lg:block lg:h-auto lg:w-auto lg:p-1"><Trash2 strokeWidth={1.6} className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="flex items-center rounded-nho border border-vien-dam">
                      <button type="button" aria-label="Giảm số lượng" disabled={d.sl <= 1} onClick={() => capNhat(i, { sl: d.sl - 1 })} className="flex h-11 w-11 items-center justify-center text-muc-2 disabled:opacity-40 lg:block lg:h-auto lg:w-auto lg:p-2"><Minus strokeWidth={1.8} className="h-4 w-4 lg:h-3.5 lg:w-3.5" /></button>
                      <span className="min-w-[32px] text-center text-[16px] font-medium tabular-nums lg:min-w-[28px] lg:text-[14px] lg:font-normal">{d.sl}</span>
                      <button type="button" aria-label="Tăng số lượng" onClick={() => capNhat(i, { sl: d.sl + 1 })} className="flex h-11 w-11 items-center justify-center text-muc-2 lg:block lg:h-auto lg:w-auto lg:p-2"><Plus strokeWidth={1.8} className="h-4 w-4 lg:h-3.5 lg:w-3.5" /></button>
                    </span>
                    {m.choSuaGia && LOAI_SUA_GIA.includes(d.loai) && <span className="flex items-center gap-1.5 text-[13px] text-muc-3">Đơn giá <OTien className="w-[120px]" giaTri={giaDong(d, m)} onDoi={(n) => { const g = Math.min(n, GIA_SUA_TOI_DA); capNhat(i, { gia: g === m.gia ? undefined : g, giam: Math.min(d.giam, g * d.sl) }); }} ariaLabel="Sửa đơn giá dòng" /></span>}
                    {choGiam && <span className="flex items-center gap-1.5 text-[13px] text-muc-3">Giảm <OTien className="w-[120px]" giaTri={d.giam} onDoi={(n) => capNhat(i, { giam: Math.min(n, giaDong(d, m) * d.sl), pct: undefined })} ariaLabel="Giảm giá dòng" /></span>}
                    {/* Giảm % theo dòng, mốc 5% như SalonHero; "Áp dụng tất cả" đưa cùng mức % cho mọi dòng của đơn. */}
                    {choGiam && <span className="flex items-center gap-1.5 text-[13px] text-muc-3"><span className="w-[84px]"><Chon nho ariaLabel="Giảm % dòng" giaTri={String(d.pct ?? 0)} luaChon={PCT_GIAM} onDoi={(v) => { const p = Number(v); capNhat(i, { pct: p || undefined, giam: giamTheoPct(giaDong(d, m), d.sl, p) }); }} /></span>
                      {!!d.pct && dong.length > 1 && <button type="button" className={`text-[12px] ${NUT_CHU}`} onClick={() => apPctTatCa(d.pct ?? 0)}>Áp dụng tất cả</button>}</span>}
                    <span className="ml-auto text-[15px] font-medium tabular-nums text-muc">{tienVN(giaDong(d, m) * d.sl - d.giam)}</span>
                  </div>
                  <button type="button" onClick={() => setSuaNv(i)} className={`mt-2 flex items-center gap-1.5 text-[13px] ${NUT_CHU}`}><UserRound strokeWidth={1.6} className="h-3.5 w-3.5" />{VAI.some((v) => d.nv[v.ma].length) ? "Sửa nhân viên" : "Chọn người phục vụ, tư vấn, bán"}</button>
                  <ul className="mt-1 space-y-0.5 text-[12px] text-muc-3">
                    {VAI.filter((v) => d.nv[v.ma].length).map((v) => (
                      <li key={v.ma}><span className="text-muc-2">{v.ten}:</span> {d.nv[v.ma].map((x) => `${nhanVien.find((n) => n.id === x.id)?.ten ?? ""}${d.nv[v.ma].length > 1 ? ` ${x.ti}%` : ""}`).join(", ")}</li>
                    ))}
                    {d.gt && <li><span className="text-muc-2">Người giới thiệu:</span> {nguonGt.find((g) => g.id === d.gt?.id)?.ten ?? "Nguồn đã ngừng"} · {d.gt.kieu === "phan_tram" ? `${d.gt.giaTri}%` : tienVN(d.gt.giaTri)}</li>}
                  </ul>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" onClick={() => setSuaGt(i)} className={`text-[13px] ${NUT_CHU}`}>{d.gt ? "Sửa người giới thiệu" : "Người giới thiệu"}</button>
                    {d.ghiChu === undefined && <button type="button" onClick={() => capNhat(i, { ghiChu: "" })} className={`text-[13px] ${NUT_CHU}`}>{d.loai === "goi_the" ? "Ghi chú thẻ" : "Ghi chú dòng"}</button>}
                  </div>
                  {d.ghiChu !== undefined && (
                    <textarea aria-label={d.loai === "goi_the" ? `Ghi chú thẻ ${m.ten}` : `Ghi chú dòng ${m.ten}`} placeholder={d.loai === "goi_the" ? "Ghi chú thẻ dịch vụ / liệu trình (in trên hoá đơn, lưu vào thẻ)" : "Ghi chú dòng (in trên hoá đơn)"} maxLength={500}
                      className={`${O_NHIEU_DONG} mt-1.5 text-[13px]`} style={{ minHeight: 44 }} value={d.ghiChu} onChange={(e) => capNhat(i, { ghiChu: e.target.value })} onBlur={(e) => { if (!e.target.value.trim()) capNhat(i, { ghiChu: undefined }); }} />
                  )}
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
                      <Chon nho ariaLabel="Phương thức" giaTri={t.phuong_thuc} luaChon={PHUONG_THUC} onDoi={(v) => setThu((x) => x.map((y, j) => (j === i ? { ...y, phuong_thuc: v, the_id: undefined, loai_vi: undefined, ngan_hang: v === "chuyen_khoan" || v === "quet_the" ? nhMacDinh(v) : undefined } : y)))} />
                      <OTien giaTri={t.so_tien} onDoi={(n) => setThu((x) => x.map((y, j) => (j === i ? { ...y, so_tien: n } : y)))} ariaLabel="Số tiền thu" />
                      <button type="button" aria-label="Bỏ khoản thu" onClick={() => setThu((x) => x.filter((_, j) => j !== i))} className="p-2 text-muc-3 hover:text-loi"><X strokeWidth={1.6} className="h-4 w-4" /></button>
                      {(t.phuong_thuc === "chuyen_khoan" || t.phuong_thuc === "quet_the") && (
                        <div className="col-span-3 flex items-center gap-2 text-[12px] text-muc-3">
                          <span className="shrink-0">Ngân hàng nhận</span>
                          <div className="min-w-0 flex-1"><Chon nho ariaLabel="Ngân hàng nhận tiền" giaTri={t.ngan_hang ?? ""} luaChon={[...new Set([...dsNh(t.phuong_thuc), ...(t.ngan_hang ? [t.ngan_hang] : [])])].map((x) => ({ gia_tri: x, nhan: x }))}
                            onDoi={(v) => { ghiNho(t.phuong_thuc, v); setThu((a) => a.map((y, j) => (j === i ? { ...y, ngan_hang: v } : y))); }} /></div>
                        </div>
                      )}
                      {t.phuong_thuc === "vi_dien_tu" && (
                        <div className="col-span-3 flex items-center gap-2 text-[12px] text-muc-3">
                          <span className="shrink-0">Loại ví</span>
                          <div className="min-w-0 flex-1"><Chon nho trong="Chọn ví" ariaLabel="Loại ví điện tử" giaTri={t.loai_vi ?? ""} luaChon={LOAI_VI} onDoi={(v) => setThu((a) => a.map((y, j) => (j === i ? { ...y, loai_vi: v } : y)))} /></div>
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
                {tienMat > 0 && (
                  <div className="mt-3 rounded-nho bg-giay-tram px-3 py-2.5 text-[14px]">
                    <div className="flex items-center justify-between gap-3"><label className="text-muc-3" htmlFor={`khach-dua-${k}`}>Tiền khách đưa (tiền mặt {tienVN(tienMat)})</label>
                      <span className="flex items-center gap-2"><button type="button" className={NUT_CHU} onClick={() => setKhachDua(tienMat)}>Vừa đủ</button><OTien id={`khach-dua-${k}`} className="w-[130px]" giaTri={khachDua} onDoi={setKhachDua} ariaLabel="Tiền khách đưa" /></span></div>
                    {khachDua > 0 && <div className={`mt-1.5 flex justify-between font-medium ${thieu > 0 ? "text-canh-bao" : "text-nhan-dam"}`}><span>{thieu > 0 ? "Khách còn thiếu" : "Trả lại khách"}</span><span className="tabular-nums">{tienVN(thieu > 0 ? thieu : traLai)}</span></div>}
                  </div>
                )}
                <dl className="mt-3 space-y-1 text-[14px]">
                  <div className="flex justify-between"><dt className="text-muc-3">Đã thu</dt><dd className="tabular-nums">{tienVN(daThu)}</dd></div>
                  <div className={`flex justify-between font-medium ${conNo > 0 ? "text-canh-bao" : conNo < 0 ? "text-loi" : "text-nhan-dam"}`}><dt>{conNo < 0 ? "Thu thừa" : "Còn nợ"}</dt><dd className="tabular-nums">{tienVN(Math.abs(conNo))}</dd></div>
                </dl>
                {conNo > 0 && dong.length > 0 && (
                  <div className="mt-3 rounded-nho border border-canh-bao-nen px-3 py-2.5 text-[13px]">
                    <div className="mb-1.5 flex items-center justify-between gap-2"><span className="font-semibold text-muc">Xác nhận các mục còn nợ</span>
                      {noTay?.khoa === khoaNo && <button type="button" className={`text-[12px] ${NUT_CHU}`} onClick={() => setNoTay(null)}>Chia lại theo tỉ lệ</button>}</div>
                    <ul className="space-y-1.5">
                      {dong.map((d, i) => (
                        <li key={khoaDong(d)} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-muc-2">{tuMuc.get(khoaDong(d))?.ten ?? ""}</span>
                          <OTien className="w-[120px]" giaTri={noDong[i] ?? 0} ariaLabel={`Nợ của dòng ${tuMuc.get(khoaDong(d))?.ten ?? ""}`} onDoi={(n) => setNoTay({ khoa: khoaNo, ds: noDong.map((x, j) => (j === i ? n : x)) })} /></li>
                      ))}
                    </ul>
                    {tongNoDong !== conNo && <p role="alert" className="mt-1.5 text-[12px] text-canh-bao">Đang chia {tienVN(tongNoDong)}, phải đúng {tienVN(conNo)}.</p>}
                  </div>
                )}
                <div className="mt-3 space-y-2 text-[13px] text-muc-2">
                  {khach && <label className="flex items-center gap-2"><input type="checkbox" checked={datLichTiep} onChange={(e) => setDatLichTiep(e.target.checked)} className="h-4 w-4 accent-nhan" />Đặt lịch hẹn tiếp theo</label>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={inSau.bat} onChange={(e) => doiInSau({ ...inSau, bat: e.target.checked })} className="h-4 w-4 accent-nhan" />In hoá đơn sau khi hoàn thành</label>
                    {inSau.bat && <span className="w-[130px]"><Chon nho ariaLabel="Ngôn ngữ bản in" giaTri={inSau.nn} luaChon={[{ gia_tri: "vi", nhan: "Tiếng Việt" }, { gia_tri: "en", nhan: "Tiếng Anh" }]} onDoi={(v) => doiInSau({ ...inSau, nn: v === "en" ? "en" : "vi" })} /></span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                <div><label className={NHAN_O}>Giờ vào</label><GioChon ariaLabel="Giờ vào" giaTriMacDinh={gioVao} onDoi={setGioVao} /></div>
                <div><label className={NHAN_O}>Giờ ra</label><GioChon ariaLabel="Giờ ra" giaTriMacDinh={gioRa} onDoi={setGioRa} /></div>
                <div className="max-lg:col-span-2"><label className={NHAN_O} htmlFor={`so-khach-${k}`}>Số khách</label><input id={`so-khach-${k}`} inputMode="numeric" value={soKhach} onChange={(e) => setSoKhach(e.target.value.replace(/\D/g, "").slice(0, 2))} className={`${O_NHAP} tabular-nums`} /></div>
              </div>
              <div><label className={NHAN_O}>Ghi chú đơn</label><textarea className={O_NHIEU_DONG} style={{ minHeight: 64 }} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} /></div>
              {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi max-lg:hidden">{loi}</div>}
              <button type="button" disabled={dang} onClick={gui} className={`${NUT_CHINH} h-12 w-full text-[15px] max-lg:hidden`}>{dang ? "Đang chốt đơn" : conNo > 0 ? `Chốt đơn, ghi nợ ${tienVN(conNo)}` : "Chốt đơn"}</button>
              {tinNhap && <p role="status" className="text-[13px] text-nhan-dam">{tinNhap}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={dang || !dong.length} onClick={luuNhapDon} className={`${NUT_PHU} h-11 text-[14px]`}>Lưu nháp</button>
                <button type="button" onClick={() => setMoHh(true)} disabled={!dong.length} className={`${NUT_PHU} h-11 text-[14px]`}>Hoa hồng &amp; doanh thu</button>
                <button type="button" disabled={dang} onClick={onHuy} className={`${NUT_PHU} h-11 text-[14px]`}>Hủy đơn</button>
                <button type="button" disabled={!dong.length} onClick={inTamTinh} className={`${NUT_PHU} h-11 text-[14px]`}>In hoá đơn</button>
              </div>
            </div>
          )}
        </div>
        </div>
        {dong.length > 0 && (
          <div className="bang-duoi shrink-0 space-y-2 border-t border-vien bg-giay-sang px-4 pt-2.5 lg:hidden">
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2 text-[14px] text-loi">{loi}</div>}
            <div className="flex items-center gap-3 pb-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-muc-3">Phải thu{conNo > 0 && thu.length > 0 ? ` · còn nợ ${tienVN(conNo)}` : ""}</div>
                <div className="truncate text-[20px] font-bold tabular-nums text-nhan-dam">{tienVN(phai)}</div>
              </div>
              <button type="button" disabled={dang} onClick={gui} className={`${NUT_CHINH} h-12 shrink-0 px-5 text-[15px]`}>{dang ? "Đang chốt" : conNo > 0 ? "Chốt, ghi nợ" : "Chốt đơn"}</button>
            </div>
          </div>
        )}
      </aside>

      {/* Thanh giỏ dính đáy (điện thoại): số món + tổng + mở giỏ, khỏi cuộn hết danh mục mới tới đơn. */}
      <div className="sticky -bottom-8 z-20 -mx-4 -mb-8 border-t border-vien bg-giay-sang px-4 py-2 shadow-[0_-8px_20px_-14px_rgb(10_43_38/0.3)] lg:hidden">
        <button type="button" data-mo-gio onClick={() => setMoGio(true)} aria-haspopup="dialog" aria-expanded={moGio}
          className="flex h-[52px] w-full items-center gap-3 rounded-the bg-gradient-to-r from-espresso to-[#0d4a42] pl-3 pr-4 text-left text-white active:opacity-90">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-nho bg-white/15"><ShoppingBag aria-hidden strokeWidth={1.7} className="h-5 w-5" />
            {dong.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-tag bg-dat px-1 text-[12px] font-bold tabular-nums text-espresso">{dong.reduce((t, d) => t + d.sl, 0)}</span>}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{dong.length ? `${dong.reduce((t, d) => t + d.sl, 0)} món · ${khach?.ho_ten ?? "Khách lẻ"}` : "Chưa chọn món"}</span>
            {dong.length > 0 && <span className="block text-[16px] font-bold tabular-nums">{tienVN(phai)}</span>}
          </span>
          <span className="shrink-0 text-[15px] font-semibold">Xem đơn</span>
        </button>
      </div>

      {moVc && (
        <HopVoucher dong={() => setMoVc(false)} chiNhanhId={cnId} khachId={khach?.id ?? null} lichId={lichId} dangDung={vc} lay={voucher} ds={dsVc} apDung={(v) => { setVc(v); setMoVc(false); }} />
      )}
      {moHh && (
        <HoaHongDon dong={() => setMoHh(false)} nhanVien={nhanVien} hang={hang}
          dongDon={dong.map((d) => ({ nv: d.nv, thanh: giaDong(d, tuMuc.get(khoaDong(d))) * d.sl - d.giam }))} />
      )}
      {suaGt !== null && dong[suaGt] && (
        <NguoiGioiThieu d={dong[suaGt]} ten={tuMuc.get(khoaDong(dong[suaGt]))?.ten ?? ""} nguon={nguonGt} dong={() => setSuaGt(null)} luu={(gt) => { capNhat(suaGt, { gt }); setSuaGt(null); }} />
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

/** Người giới thiệu của một dòng (SalonHero edit-order): chọn nhóm (Khách hàng / Nhân viên / Khác), chọn nguồn giới thiệu, mức hoa hồng % hoặc tiền (mặc định theo nguồn). */
function NguoiGioiThieu({ d, ten, nguon, dong, luu }: { d: DongDon; ten: string; nguon: NguonGt[]; dong: () => void; luu: (gt: DongDon["gt"]) => void }) {
  const dau = d.gt ? nguon.find((g) => g.id === d.gt?.id) : undefined;
  const [nhom, setNhom] = useState<NguonGt["nhom"]>(dau?.nhom ?? "khach");
  const [id, setId] = useState(d.gt?.id ?? "");
  const [kieu, setKieu] = useState<"phan_tram" | "tien">(d.gt?.kieu ?? "phan_tram");
  const [giaTri, setGiaTri] = useState(d.gt?.giaTri ?? 0);
  const [loi, setLoi] = useState("");
  const ds = nguon.filter((g) => g.nhom === nhom);
  const chon = (v: string) => { setId(v); const g = gtGoiY(nguon, v, d.loai, d.ref); if (g) { setKieu(g.kieu); setGiaTri(g.giaTri); } };
  const xong = () => {
    if (!id) return luu(null);
    if (kieu === "phan_tram" && (giaTri < 0 || giaTri > 100)) return setLoi("Phần trăm hoa hồng từ 0 đến 100.");
    luu({ id, kieu, giaTri: kieu === "tien" ? Math.round(giaTri) : giaTri });
  };
  return (
    <Hop mo dong={dong} tieuDe="Người giới thiệu" moTa={`${ten}. Hoa hồng giới thiệu của dòng này tính theo mức chọn ở đây (báo cáo Hoa hồng giới thiệu).`} rong="rong">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nhóm người giới thiệu">
          {NHOM_GT.map((n) => <button key={n.ma} type="button" role="radio" aria-checked={nhom === n.ma} onClick={() => { setNhom(n.ma); setId(""); }} className={`rounded-nho border px-3 py-1.5 text-[13px] ${nhom === n.ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{n.ten} <span className="text-muc-3">({nguon.filter((g) => g.nhom === n.ma).length})</span></button>)}
        </div>
        {ds.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có nguồn giới thiệu nhóm này (thêm ở Marketing › Nguồn giới thiệu).</p> : (
          <div><label className={NHAN_O}>Nguồn giới thiệu</label><Chon trong="Chọn người giới thiệu" ariaLabel="Nguồn giới thiệu" giaTri={id} luaChon={[{ gia_tri: "", nhan: "Không có" }, ...ds.map((g) => ({ gia_tri: g.id, nhan: `${g.ten}${g.ma ? ` · ${g.ma}` : ""}` }))]} onDoi={chon} /></div>
        )}
        {id && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className={NHAN_O}>Mức hoa hồng</label><Chon ariaLabel="Kiểu hoa hồng giới thiệu" giaTri={kieu} luaChon={[{ gia_tri: "phan_tram", nhan: "Theo phần trăm" }, { gia_tri: "tien", nhan: "Theo tiền" }]} onDoi={(v) => setKieu(v === "tien" ? "tien" : "phan_tram")} /></div>
            <div><label className={NHAN_O}>{kieu === "phan_tram" ? "Phần trăm (%)" : "Số tiền mỗi đơn vị"}</label>
              {kieu === "tien" ? <OTien giaTri={giaTri} onDoi={setGiaTri} ariaLabel="Tiền hoa hồng giới thiệu" /> : <input inputMode="decimal" {...CHON_HET} aria-label="Phần trăm hoa hồng giới thiệu" className={`${O_NHAP} text-right`} value={String(giaTri)} onChange={(e) => setGiaTri(Math.min(Number(e.target.value.replace(/[^\d.]/g, "")) || 0, 100))} />}</div>
          </div>
        )}
      </div>
      {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={dong}>Huỷ</button><button type="button" className={NUT_CHINH} onClick={xong}>Xong</button></div>
    </Hop>
  );
}

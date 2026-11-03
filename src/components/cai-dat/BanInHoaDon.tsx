import { ngayVN, tienVN } from "@/lib/dinh-dang";
import type { CauHinhIn, KhoGiay } from "@/lib/thiet-lap-in";

export type DuLieuIn = {
  loai: "hoa_don" | "lich_hen";
  cuaHang: { ten: string; diaChi?: string | null; dienThoai?: string | null };
  tieuDe: string; ma: string; ngay: string; trangThai?: string;
  khach?: { ten: string; sdt?: string | null; gioiTinh?: string | null; namSinh?: string | null; diem?: number | null } | null;
  thuNgan?: string | null; ghiChu?: string | null;
  /** "HH:MM – HH:MM": giờ vào/ra của đơn (không có thì giờ lịch hẹn gắn với đơn). In khi bật "Hiện giờ vào/ra" (Thiết lập in). */
  gioVaoRa?: string | null;
  dong: { ten: string; /** Ghi chú dòng (thẻ dịch vụ / liệu trình). */ ghiChu?: string | null; soLuong: number; donGia: number; giamGia: number; thanhTien: number; /** "HH:MM–HH:MM" khi dịch vụ bật "In giờ phục vụ trên hoá đơn". */ gioPhucVu?: string; /** Nhân viên làm / bán dòng này, in "(NV: A, B)" như SalonHero khi bật "Hiển thị nhân viên phục vụ". */ nhanVien?: string[] }[];
  tongHang: number; giamDon: number; vatPct: number; vatTien: number; phuPhi: number; tip: number; phaiThu: number;
  thanhToan: { nhan: string; soTien: number }[]; conNo: number;
  /** Ảnh mã QR đã dựng sẵn (data URL); bản xem mẫu không có thì hiện khung giữ chỗ. */
  qrAnh?: string | null; xemMau?: boolean;
  /** Ngôn ngữ bản in (SalonHero: "In hoá đơn sau khi hoàn thành" chọn tiếng Việt / tiếng Anh). Mặc định tiếng Việt. */
  nn?: NgonNguIn;
  /** Tiền khách đưa (tiền mặt) và tiền trả lại khách, khi thu ngân có nhập. */
  khachDua?: number | null; traLai?: number | null;
};
export type NgonNguIn = "vi" | "en";
/** Chữ cố định của bản in theo ngôn ngữ. */
export const CHU_IN = {
  vi: { dt: "Điện thoại", thuNgan: "Thu ngân", khach: "Khách", sinh: "sinh", muc: "Mục", sl: "SL", donGia: "Đơn giá", thanhTien: "Thành tiền", gioPv: "Giờ phục vụ", giam: "Giảm",
    tienHang: "Tiền hàng", giamGia: "Giảm giá", phuPhi: "Phụ phí", tip: "Tip", phaiThu: "Phải thu", conNo: "Còn nợ", khachDua: "Tiền khách đưa", traLai: "Trả lại khách", diem: "Điểm tích luỹ", ghiChu: "Ghi chú",
    daiDien: "Đại diện cửa hàng", khachHang: "Khách hàng", daThu: "Đã thu", hoan: "Hoàn", hoaDon: "Hoá đơn", tamTinh: "Hoá đơn tạm tính",
    gioVaoRa: "Giờ vào/ra", nv: "NV", lichHen: "Lịch hẹn", chiTiet: "Thông tin chi tiết:", khachSo: "Khách", maQr: "Mã QR", chuaQr: "Chưa có mã QR" },
  en: { dt: "Phone", thuNgan: "Cashier", khach: "Customer", sinh: "born", muc: "Item", sl: "Qty", donGia: "Unit price", thanhTien: "Amount", gioPv: "Service time", giam: "Discount",
    tienHang: "Subtotal", giamGia: "Discount", phuPhi: "Surcharge", tip: "Tip", phaiThu: "Total", conNo: "Balance due", khachDua: "Cash received", traLai: "Change", diem: "Loyalty points", ghiChu: "Note",
    daiDien: "Store representative", khachHang: "Customer", daThu: "Paid", hoan: "Refund", hoaDon: "Invoice", tamTinh: "Proforma invoice",
    gioVaoRa: "In/out time", nv: "NV", lichHen: "Appointment", chiTiet: "Details:", khachSo: "Guest", maQr: "QR code", chuaQr: "No QR code" },
} as const;
/** Tên hình thức thu tiền tiếng Anh cho bản in. */
export const PHUONG_THUC_EN: Record<string, string> = { tien_mat: "Cash", chuyen_khoan: "Bank transfer", quet_the: "Card", vi_dien_tu: "E-wallet", ship_cod: "COD", the_tien: "Prepaid card" };

/** Bề ngang theo khổ giấy (px ở 96 dpi): giấy cuộn 57/58/80 mm hẹp và chữ nhỏ hơn; A5 ≈ 560, A4 ≈ 760. */
export const BE_NGANG: Record<KhoGiay, number> = { "57mm": 215, "58mm": 219, "80mm": 302, A5: 560, A4: 760 };
export const KHO_CUON = (k: KhoGiay) => k === "57mm" || k === "58mm" || k === "80mm";

/** Một tờ in (hoá đơn hoặc lịch hẹn). Dùng chung cho trang in thật và bản xem mẫu ở Cài đặt > Thiết lập in. */
export function BanInHoaDon({ cfg, d }: { cfg: CauHinhIn; d: DuLieuIn }) {
  const cuon = KHO_CUON(cfg.khoGiay);
  const ph = d.loai === "hoa_don";
  // Ngôn ngữ: trang in truyền d.nn (Thu ngân chọn, hoặc theo Thiết lập in); bản xem mẫu ở Cài đặt › Thiết lập in không truyền thì theo ô "Ngôn ngữ" đang chọn.
  const c = CHU_IN[d.nn ?? cfg.ngonNgu ?? "vi"];
  const tieuDe = !d.nn && cfg.ngonNgu === "en" ? (ph ? c.hoaDon : c.lichHen) : d.tieuDe;
  const nho = cuon ? "text-[11px]" : "text-[13px]";
  const lop = (k: string) => (cuon ? `${k} text-[11px]` : `${k} text-[13px]`);
  return (
    <div className={`mx-auto bg-white text-muc ${nho} ${cuon ? "px-2 py-3" : "px-6 py-8"}`} style={{ width: "100%", maxWidth: BE_NGANG[cfg.khoGiay] }}>
      <header className="text-center">
        {cfg.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-amia.png" alt="AMIA" style={{ height: cfg.coLogo || (cuon ? 36 : 56) }} className="mx-auto mb-2 w-auto" />
        )}
        <h1 className={`chu-tieu-de ${cuon ? "text-[15px]" : "text-[22px]"}`}>{d.cuaHang.ten}</h1>
        {cfg.thongTinCuaHang && d.cuaHang.diaChi && <p className="text-muc-2">{d.cuaHang.diaChi}</p>}
        {cfg.thongTinCuaHang && d.cuaHang.dienThoai && <p className="text-muc-2">{c.dt}: {d.cuaHang.dienThoai}</p>}
        <p className={`mt-3 font-semibold uppercase tracking-wide ${cuon ? "text-[12px]" : "text-[15px]"}`}>{tieuDe} {d.ma}</p>
        <p className="text-muc-2">{ngayVN(d.ngay)}{ph && cfg.thuNgan && d.thuNgan ? ` · ${c.thuNgan}: ${d.thuNgan}` : ""}</p>
        {ph && cfg.gioVaoRa && d.gioVaoRa && <p className="text-muc-2">{c.gioVaoRa}: {d.gioVaoRa}</p>}
        {d.khach && <p className="text-muc-2">{c.khach}: {d.khach.ten}{cfg.sdtKhach && d.khach.sdt ? ` · ${d.khach.sdt}` : ""}</p>}
        {d.khach && cfg.gioiTinhNamSinh && (d.khach.gioiTinh || d.khach.namSinh) && <p className="text-muc-2">{[d.khach.gioiTinh, d.khach.namSinh ? `${c.sinh} ${d.khach.namSinh}` : ""].filter(Boolean).join(" · ")}</p>}
      </header>
      {ph && (
        <>
          <table className="mt-4 w-full text-left">
            <thead><tr className="border-b border-muc"><th className="py-1.5 font-medium">{c.muc}</th><th className="py-1.5 text-right font-medium">{c.sl}</th>{!cuon && <th className="py-1.5 text-right font-medium">{c.donGia}</th>}<th className="py-1.5 text-right font-medium">{c.thanhTien}</th></tr></thead>
            <tbody>{d.dong.map((x, i) => (<tr key={i} className="border-b border-vien align-top"><td className="py-1.5 pr-2">{x.ten}{cfg.nhanVienPhucVu && x.nhanVien?.length ? <span className={`block text-muc-3 ${cuon ? "text-[10px]" : "text-[12px]"}`}>({c.nv}: {x.nhanVien.join(", ")})</span> : null}{x.gioPhucVu ? <span className={`block text-muc-3 ${cuon ? "text-[10px]" : "text-[12px]"}`}>{c.gioPv} {x.gioPhucVu}</span> : null}{x.giamGia ? <span className={`block text-muc-3 ${cuon ? "text-[10px]" : "text-[12px]"}`}>{c.giam} {tienVN(x.giamGia)}</span> : null}{x.ghiChu ? <span className={`block whitespace-pre-line text-muc-3 ${cuon ? "text-[10px]" : "text-[12px]"}`}>{x.ghiChu}</span> : null}</td><td className="py-1.5 text-right tabular-nums">{x.soLuong}</td>{!cuon && <td className="py-1.5 text-right tabular-nums">{tienVN(x.donGia)}</td>}<td className="py-1.5 text-right tabular-nums">{tienVN(x.thanhTien)}</td></tr>))}</tbody>
          </table>
          <dl className="ml-auto mt-3 w-full space-y-1" style={{ maxWidth: cuon ? "100%" : 260 }}>
            <div className="flex justify-between"><dt>{c.tienHang}</dt><dd className="tabular-nums">{tienVN(d.tongHang)}</dd></div>
            {d.giamDon > 0 && <div className="flex justify-between"><dt>{c.giamGia}</dt><dd className="tabular-nums">− {tienVN(d.giamDon)}</dd></div>}
            {d.vatTien > 0 && <div className="flex justify-between"><dt>VAT {d.vatPct}%</dt><dd className="tabular-nums">{tienVN(d.vatTien)}</dd></div>}
            {d.phuPhi > 0 && <div className="flex justify-between"><dt>{c.phuPhi}</dt><dd className="tabular-nums">{tienVN(d.phuPhi)}</dd></div>}
            {d.tip > 0 && <div className="flex justify-between"><dt>{c.tip}</dt><dd className="tabular-nums">{tienVN(d.tip)}</dd></div>}
            <div className={`flex justify-between border-t border-muc pt-1 font-semibold ${cuon ? "text-[12px]" : "text-[15px]"}`}><dt>{c.phaiThu}</dt><dd className="tabular-nums">{tienVN(d.phaiThu)}</dd></div>
            {d.thanhToan.map((t, i) => (<div key={i} className="flex justify-between text-muc-2"><dt>{t.nhan}</dt><dd className="tabular-nums">{tienVN(t.soTien)}</dd></div>))}
            {d.conNo > 0 && <div className="flex justify-between font-semibold"><dt>{c.conNo}</dt><dd className="tabular-nums">{tienVN(d.conNo)}</dd></div>}
            {d.khachDua != null && d.khachDua > 0 && <div className="flex justify-between text-muc-2"><dt>{c.khachDua}</dt><dd className="tabular-nums">{tienVN(d.khachDua)}</dd></div>}
            {d.khachDua != null && d.khachDua > 0 && <div className="flex justify-between text-muc-2"><dt>{c.traLai}</dt><dd className="tabular-nums">{tienVN(d.traLai ?? 0)}</dd></div>}
          </dl>
          {cfg.diemTichLuy && d.khach?.diem != null && <p className={lop("mt-3 text-muc-2")}>{c.diem}: {d.khach.diem}</p>}
          {cfg.ghiChu && d.ghiChu && <p className={lop("mt-3 text-muc-2")}>{c.ghiChu}: {d.ghiChu}</p>}
          {cfg.chuKyKhach && (
            <div className={`mt-6 grid grid-cols-2 gap-4 text-center ${cuon ? "text-[10px]" : "text-[12px]"}`}>
              <div><p className="font-medium">{c.daiDien}</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
              <div><p className="font-medium">{c.khachHang}</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
            </div>
          )}
        </>
      )}
      {!ph && d.dong.length > 0 && (
        <div className="mt-4 text-muc-2">
          <p className="mb-1 text-muc-3">{c.chiTiet}</p>
          {d.dong.map((x, i) => <p key={i}>{c.khachSo} {i + 1}: {x.ten}</p>)}
          {cfg.ghiChu && d.ghiChu && <p className="mt-2">{c.ghiChu}: {d.ghiChu}</p>}
          {cfg.chuKyKhach && <div className="mt-4 text-center"><p className="font-medium">{c.khachHang}</p><div className="h-10 border-b border-dashed border-vien-dam" /></div>}
        </div>
      )}
      {cfg.qr && (
        <div className="mt-4 text-center">
          {d.qrAnh ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.qrAnh} alt="Mã QR thanh toán" className="mx-auto h-32 w-32" />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center border border-dashed border-vien-dam text-[11px] text-muc-3">{d.xemMau ? c.maQr : c.chuaQr}</div>
          )}
          {cfg.qrChuTk && <p className={lop("mt-1 text-muc-2")}>{cfg.qrNganHang} · {cfg.qrChuTk}</p>}
        </div>
      )}
      {cfg.noiDungCuoi.trim() && <p className={`mt-6 whitespace-pre-line text-center text-muc-3 ${cuon ? "text-[10px]" : "text-[12px]"}`}>{cfg.noiDungCuoi}</p>}
    </div>
  );
}

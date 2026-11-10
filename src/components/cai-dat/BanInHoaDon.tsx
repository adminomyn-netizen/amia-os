import { ngayVN, tienVN } from "@/lib/dinh-dang";

/** Số không kèm "đ" cho cột bảng (cột hẹp ở giấy cuộn 80 mm), như SalonHero; dòng tổng vẫn có "đ". */
const soVN = (n: number) => Number(n ?? 0).toLocaleString("vi-VN");
import type { CauHinhIn, KhoGiay } from "@/lib/thiet-lap-in";

export type DuLieuIn = {
  loai: "hoa_don" | "lich_hen";
  /** ten = tên chi nhánh. tenCoSo/phu (bản in hoá đơn thật): "AMIA Beauty Center" + "Phòng khám da liễu · Giấy phép …", khi có thì in "Chi nhánh: <ten>" như SalonHero. */
  cuaHang: { ten: string; tenCoSo?: string | null; phu?: string | null; diaChi?: string | null; dienThoai?: string | null };
  tieuDe: string; ma: string; ngay: string; trangThai?: string;
  /** Giờ lập đơn "HH:MM" in cạnh ngày; "(Đã thanh toán)" … dưới tiêu đề. */
  gio?: string | null; trangThaiNhan?: string | null;
  /** Số tiền bằng chữ của Tổng cộng (chỉ bản tiếng Việt). */
  bangChu?: string | null;
  /** Tổng tiền trừ vào thẻ + "Tình trạng thẻ sau khi thanh toán" (mỗi thẻ một dòng đã dựng sẵn). */
  tienTruThe?: number; theSauTt?: string[]; nhanTheSauTt?: string;
  khach?: { ten: string; /** Mã khách hàng (chị Diệu Thuý 10/11: phiếu in phải có MÃ KHÁCH HÀNG). */ ma?: string | null; sdt?: string | null; gioiTinh?: string | null; namSinh?: string | null; diem?: number | null } | null;
  thuNgan?: string | null; ghiChu?: string | null;
  /** "HH:MM – HH:MM": giờ vào/ra của đơn (không có thì giờ lịch hẹn gắn với đơn). In khi bật "Hiện giờ vào/ra" (Thiết lập in). */
  gioVaoRa?: string | null;
  dong: { ten: string; /** Ghi chú dòng (thẻ dịch vụ / liệu trình). */ ghiChu?: string | null; soLuong: number; donGia: number; giamGia: number; thanhTien: number; /** "HH:MM–HH:MM" khi dịch vụ bật "In giờ phục vụ trên hoá đơn". */ gioPhucVu?: string; /** Nhân viên làm / bán dòng này, in "(NV: A, B)" như SalonHero khi bật "Hiển thị nhân viên phục vụ". */ nhanVien?: string[] }[];
  tongHang: number; giamDon: number; vatPct: number; vatTien: number; phuPhi: number; tip: number; phaiThu: number;
  /** soTien null = bản tạm tính chưa nhập tiền hình thức này: in chỗ trống để ghi tay. */
  thanhToan: { nhan: string; soTien: number | null }[]; conNo: number;
  /** Ảnh mã QR đã dựng sẵn (data URL); bản xem mẫu không có thì hiện khung giữ chỗ. */
  qrAnh?: string | null; xemMau?: boolean;
  /** Bản tạm tính: các khoản thu đang nhập (tính số tiền trong mã QR như SalonHero getQROrderBankTransferAmount). */
  qrThu?: { phuong_thuc: string; so_tien: number }[];
  /** Ngôn ngữ bản in (SalonHero: "In hoá đơn sau khi hoàn thành" chọn tiếng Việt / tiếng Anh). Mặc định tiếng Việt. */
  nn?: NgonNguIn;
  /** Tiền khách đưa (tiền mặt) và tiền trả lại khách, khi thu ngân có nhập. */
  khachDua?: number | null; traLai?: number | null;
};
export type NgonNguIn = "vi" | "en";
/** Chữ cố định của bản in theo ngôn ngữ. */
export const CHU_IN = {
  vi: { dt: "Điện thoại", thuNgan: "Thu ngân", khach: "Khách", sinh: "sinh", muc: "Dịch vụ", sl: "SL", donGia: "Đ.Giá", thanhTien: "Thành tiền", gioPv: "Giờ phục vụ", giam: "Giảm",
    chiNhanh: "Chi nhánh", maHd: "Mã HĐ", maKhach: "Mã KH", ngay: "Ngày", sdt: "SĐT", gioiTinh: "Giới tính", thanhToan: "Thanh toán", donViTinh: "Đơn vị tính: VND", bangChu: "Số tiền bằng chữ", truThe: "Tổng tiền trừ vào thẻ",
    theSauTt: "Tình trạng thẻ sau khi thanh toán:", theDenNgay: "Tình trạng thẻ đến ngày",
    tienHang: "Thành tiền", giamGia: "Giảm giá", phuPhi: "Phụ phí", tip: "Tip", phaiThu: "Tổng cộng", conNo: "Còn nợ", khachDua: "Tiền khách đưa", traLai: "Trả lại khách", diem: "Điểm tích luỹ", ghiChu: "Ghi chú",
    daiDien: "Đại diện cửa hàng", khachHang: "Khách hàng", daThu: "Đã thu", hoan: "Hoàn tiền", hoaDon: "Hoá đơn dịch vụ", tamTinh: "Hoá đơn tạm tính",
    gioVaoRa: "Giờ vào/ra", nv: "N. viên", lichHen: "Lịch hẹn", chiTiet: "Thông tin chi tiết:", khachSo: "Khách", maQr: "Mã QR", chuaQr: "Chưa có mã QR" },
  en: { dt: "Phone", thuNgan: "Cashier", khach: "Customer", sinh: "born", muc: "Service", sl: "Qty", donGia: "Price", thanhTien: "Amount", gioPv: "Service time", giam: "Discount",
    chiNhanh: "Branch", maHd: "Invoice No.", maKhach: "Customer ID", ngay: "Date", sdt: "Phone", gioiTinh: "Gender", thanhToan: "Payment", donViTinh: "Currency: VND", bangChu: "Amount in words", truThe: "Total charged to cards",
    theSauTt: "Card status after payment:", theDenNgay: "Card status as of",
    tienHang: "Subtotal", giamGia: "Discount", phuPhi: "Surcharge", tip: "Tip", phaiThu: "Total", conNo: "Balance due", khachDua: "Cash received", traLai: "Change", diem: "Loyalty points", ghiChu: "Note",
    daiDien: "Store representative", khachHang: "Customer", daThu: "Paid", hoan: "Refund", hoaDon: "Service invoice", tamTinh: "Proforma invoice",
    gioVaoRa: "In/out time", nv: "Staff", lichHen: "Appointment", chiTiet: "Details:", khachSo: "Guest", maQr: "QR code", chuaQr: "No QR code" },
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
  const phu = cuon ? "text-[10px]" : "text-[12px]";
  // Dòng "nhãn: giá trị" của khối thông tin đơn (như SalonHero: Mã HĐ, Ngày, Khách hàng, SĐT, Giờ vào/ra, Thu ngân).
  const thongTin: [string, string][] = ph
    ? ([
        [c.maHd, d.ma],
        [c.ngay, `${ngayVN(d.ngay)}${d.gio ? ` ${d.gio}` : ""}`],
        [c.khachHang, d.khach?.ten ?? ""],
        [c.maKhach, d.khach?.ma ?? ""],
        [c.sdt, cfg.sdtKhach ? d.khach?.sdt ?? "" : ""],
        [c.gioiTinh, cfg.gioiTinhNamSinh && d.khach ? [d.khach.gioiTinh, d.khach.namSinh ? `${c.sinh} ${d.khach.namSinh}` : ""].filter(Boolean).join(" · ") : ""],
        [c.gioVaoRa, cfg.gioVaoRa ? d.gioVaoRa ?? "" : ""],
        [c.thuNgan, cfg.thuNgan ? d.thuNgan ?? "" : ""],
      ] as [string, string][]).filter(([, v]) => v)
    : [];
  return (
    <div className={`mx-auto bg-white text-muc ${nho} ${cuon ? "px-2 py-3" : "px-6 py-8"}`} style={{ width: "100%", maxWidth: BE_NGANG[cfg.khoGiay] }}>
      <header className="text-center">
        {cfg.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-amia.png" alt="AMIA" style={{ height: cfg.coLogo || (cuon ? 36 : 56) }} className="mx-auto mb-2 w-auto" />
        )}
        <h1 className={`chu-tieu-de ${cuon ? "text-[15px]" : "text-[22px]"}`}>{d.cuaHang.tenCoSo || d.cuaHang.ten}</h1>
        {d.cuaHang.phu && <p className="text-muc-2">{d.cuaHang.phu}</p>}
        {d.cuaHang.tenCoSo && <p className="text-muc-2">{c.chiNhanh}: {d.cuaHang.ten}</p>}
        {cfg.thongTinCuaHang && d.cuaHang.diaChi && <p className="text-muc-2">{d.cuaHang.diaChi}</p>}
        {cfg.thongTinCuaHang && d.cuaHang.dienThoai && <p className="text-muc-2">{c.dt}: {d.cuaHang.dienThoai}</p>}
        {ph ? (
          <>
            <p className={`mt-3 font-bold uppercase tracking-wide ${cuon ? "text-[13px]" : "text-[17px]"}`}>{tieuDe}</p>
            {d.trangThaiNhan && <p className="text-muc-2">({d.trangThaiNhan})</p>}
          </>
        ) : (
          <>
            <p className={`mt-3 font-semibold uppercase tracking-wide ${cuon ? "text-[12px]" : "text-[15px]"}`}>{tieuDe} {d.ma}</p>
            <p className="text-muc-2">{ngayVN(d.ngay)}</p>
            {d.khach && <p className="text-muc-2">{c.khach}: {d.khach.ten}{d.khach.ma ? ` (${d.khach.ma})` : ""}{cfg.sdtKhach && d.khach.sdt ? ` · ${d.khach.sdt}` : ""}</p>}
            {d.khach && cfg.gioiTinhNamSinh && (d.khach.gioiTinh || d.khach.namSinh) && <p className="text-muc-2">{[d.khach.gioiTinh, d.khach.namSinh ? `${c.sinh} ${d.khach.namSinh}` : ""].filter(Boolean).join(" · ")}</p>}
          </>
        )}
      </header>
      {ph && (
        <>
          {thongTin.length > 0 && (
            <dl className="mt-3 grid gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: "auto 1fr" }}>
              {thongTin.map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-2">{n}:</dt><dd className={n === c.khachHang ? "font-semibold" : ""}>{v}</dd></div>)}
            </dl>
          )}
          <table className="mt-3 w-full table-fixed text-left">
            <colgroup><col /><col style={{ width: cuon ? "11%" : "8%" }} /><col style={{ width: cuon ? "24%" : "18%" }} /><col style={{ width: cuon ? "26%" : "20%" }} /></colgroup>
            <thead><tr className="border-y border-muc"><th className="py-1 pr-1 font-semibold">{c.muc}</th><th className="py-1 text-right font-semibold">{c.sl}</th><th className="py-1 text-right font-semibold">{c.donGia}</th><th className="py-1 text-right font-semibold">{c.thanhTien}</th></tr></thead>
            <tbody>{d.dong.map((x, i) => (
              <tr key={i} className="border-b border-vien align-top">
                <td className="break-words py-1 pr-1">{x.ten}
                  {cfg.nhanVienPhucVu && x.nhanVien?.length ? <span className={`block text-muc-2 ${phu}`}>({c.nv}: {x.nhanVien.join(", ")})</span> : null}
                  {x.gioPhucVu ? <span className={`block text-muc-3 ${phu}`}>{c.gioPv} {x.gioPhucVu}</span> : null}
                  {x.giamGia ? <span className={`block text-muc-3 ${phu}`}>{c.giam} {tienVN(x.giamGia)}</span> : null}
                  {x.ghiChu ? <span className={`block whitespace-pre-line text-muc-3 ${phu}`}>{x.ghiChu}</span> : null}
                </td>
                <td className="py-1 text-right tabular-nums">{x.soLuong}</td>
                <td className="py-1 text-right tabular-nums">{soVN(x.donGia)}</td>
                <td className="py-1 text-right tabular-nums">{soVN(x.thanhTien)}</td>
              </tr>
            ))}</tbody>
          </table>
          <dl className="mt-2 w-full space-y-0.5">
            <div className="flex justify-between gap-2"><dt>{c.tienHang}</dt><dd className="tabular-nums">{tienVN(d.tongHang)}</dd></div>
            {d.giamDon > 0 && <div className="flex justify-between gap-2"><dt>{c.giamGia}</dt><dd className="tabular-nums">− {tienVN(d.giamDon)}</dd></div>}
            {d.vatTien > 0 && <div className="flex justify-between gap-2"><dt>VAT {d.vatPct}%</dt><dd className="tabular-nums">{tienVN(d.vatTien)}</dd></div>}
            {d.phuPhi > 0 && <div className="flex justify-between gap-2"><dt>{c.phuPhi}</dt><dd className="tabular-nums">{tienVN(d.phuPhi)}</dd></div>}
            {d.tip > 0 && <div className="flex justify-between gap-2"><dt>{c.tip}</dt><dd className="tabular-nums">{tienVN(d.tip)}</dd></div>}
            <div className={`flex justify-between gap-2 border-t border-muc pt-1 font-bold ${cuon ? "text-[13px]" : "text-[16px]"}`}><dt>{c.phaiThu}</dt><dd className="tabular-nums">{tienVN(d.phaiThu)}</dd></div>
            {d.thanhToan.map((t, i) => (<div key={i} className="flex justify-between gap-2"><dt>{t.nhan}</dt><dd className="tabular-nums">{t.soTien == null ? "……………" : tienVN(t.soTien)}</dd></div>))}
            {d.conNo > 0 && <div className="flex justify-between gap-2 font-semibold"><dt>{c.conNo}</dt><dd className="tabular-nums">{tienVN(d.conNo)}</dd></div>}
            {d.khachDua != null && d.khachDua > 0 && <div className="flex justify-between gap-2 text-muc-2"><dt>{c.khachDua}</dt><dd className="tabular-nums">{tienVN(d.khachDua)}</dd></div>}
            {d.khachDua != null && d.khachDua > 0 && <div className="flex justify-between gap-2 text-muc-2"><dt>{c.traLai}</dt><dd className="tabular-nums">{tienVN(d.traLai ?? 0)}</dd></div>}
          </dl>
          <p className="mt-1 italic text-muc-2">{c.donViTinh}</p>
          {d.bangChu && <p className="italic text-muc-2">{c.bangChu}: {d.bangChu}</p>}
          {(d.tienTruThe || d.theSauTt?.length) ? (
            <div className="mt-2 border-t border-dashed border-vien-dam pt-2">
              <div className="flex justify-between gap-2 italic"><span>{c.truThe}:</span><span className="tabular-nums">{tienVN(d.tienTruThe ?? 0)}</span></div>
              {d.theSauTt?.length ? (
                <>
                  <p className="mt-1 font-semibold italic">{d.nhanTheSauTt ?? c.theSauTt}</p>
                  {d.theSauTt.map((t, i) => <p key={i} className="italic">{t}</p>)}
                </>
              ) : null}
            </div>
          ) : null}
          {cfg.diemTichLuy && d.khach?.diem != null && <p className={lop("mt-3 text-muc-2")}>{c.diem}: {d.khach.diem}</p>}
          {cfg.ghiChu && d.ghiChu && <p className={lop("mt-3 text-muc-2")}>{c.ghiChu}: {d.ghiChu}</p>}
          {cfg.chuKyKhach && (
            <div className={`mt-5 grid grid-cols-2 gap-4 text-center ${phu}`}>
              <div><p className="font-medium">{c.khachHang}</p><div className="h-14 border-b border-dashed border-vien-dam" /></div>
              <div><p className="font-medium">{c.daiDien}</p><div className="h-14 border-b border-dashed border-vien-dam" /></div>
            </div>
          )}
          {cfg.cauKhongHoanLai?.trim() && <p className={`mt-4 whitespace-pre-line text-center ${phu}`}>{cfg.cauKhongHoanLai}</p>}
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

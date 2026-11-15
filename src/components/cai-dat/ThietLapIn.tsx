"use client";

import { ThanhLuu } from "@/components/cai-dat/ThanhLuu";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { CHON_HET, NHAN_O, NUT_CHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { BanInHoaDon, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { KHO_GIAY, type CauHinhIn, type LoaiIn } from "@/lib/thiet-lap-in";
import { NGAN_HANG_QR, maQrCuaTen } from "@/lib/vietqr";

type Khoa = "logo" | "thongTinCuaHang" | "nhanVienPhucVu" | "gioVaoRa" | "sdtKhach" | "ghiChu" | "gioiTinhNamSinh" | "chuKyKhach" | "thuNgan" | "diemTichLuy" | "chiInHoanThanh";
const O: Record<LoaiIn, [Khoa, string][]> = {
  hoa_don: [["logo", "Hiển thị logo cửa hàng"], ["thongTinCuaHang", "Hiển thị thông tin cửa hàng"], ["nhanVienPhucVu", "Hiển thị nhân viên phục vụ"], ["gioVaoRa", "Hiện giờ vào/ra"], ["sdtKhach", "Hiển thị SĐT khách hàng"], ["ghiChu", "Hiển thị ghi chú"], ["gioiTinhNamSinh", "Hiển thị Giới tính, Năm sinh K.H"], ["chuKyKhach", "Hiện thị chữ kí K.H"], ["thuNgan", "Hiện thị thu ngân"], ["diemTichLuy", "Hiện thị điểm tích luỹ"], ["chiInHoanThanh", "Chỉ in hoá đơn hoàn thành"]],
  lich_hen: [["logo", "Hiển thị logo cửa hàng"], ["thongTinCuaHang", "Hiển thị thông tin cửa hàng"], ["sdtKhach", "Hiển thị SĐT khách hàng"], ["ghiChu", "Hiển thị ghi chú"], ["gioiTinhNamSinh", "Hiển thị Giới tính, Năm sinh K.H"], ["chuKyKhach", "Hiện thị chữ kí K.H"], ["thuNgan", "Hiện thị thu ngân"]],
};
const Hop = ({ id, nhan, bat, onDoi, tat }: { id: string; nhan: string; bat: boolean; onDoi: (v: boolean) => void; tat: boolean }) => (
  <label htmlFor={id} className="flex min-h-9 items-center gap-2.5 text-[14px] text-muc"><input id={id} type="checkbox" checked={bat} disabled={tat} onChange={(e) => onDoi(e.target.checked)} className="h-4 w-4 accent-[var(--nhan)]" />{nhan}</label>
);

/** Bố cục như SalonHero "Thiết lập in": trái là biểu mẫu, phải là bản in mẫu cập nhật ngay khi tích. Chọn chi nhánh / loại tờ in thì tải lại trang với cấu hình tương ứng. */
export function ThietLapInForm({ loai, cn, chiNhanh, dau, nguon, mau, sua, luu, taiKhoan = [] }: {
  loai: LoaiIn; cn: string; chiNhanh: { id: string; ten: string }[]; dau: CauHinhIn; nguon: "chi_nhanh" | "chung" | "mac_dinh"; mau: DuLieuIn; sua: boolean;
  luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }>;
  /** Tài khoản chuyển khoản đang dùng: chọn một cái để điền sẵn ngân hàng / số TK / chủ TK của QRCode (khỏi gõ lại). */
  taiKhoan?: { id: string; nganHang: string; so: string; chu: string }[];
}) {
  const router = useRouter();
  const [c, setC] = useState(dau);
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false);
  const [dang, bat] = useTransition();
  const dat = (p: Partial<CauHinhIn>) => { setC({ ...c, ...p }); setOk(false); };
  const di = (l: string, k: string) => router.push(`/cai-dat/thiet-lap-in?loai=${l}&cn=${k}`);
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("loai", loai); fd.set("cn", cn); fd.set("cau_hinh", JSON.stringify(c));
    bat(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); } });
  };
  const tat = !sua;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muc-3">{nguon === "chi_nhanh" ? "Đang dùng cài đặt riêng của chi nhánh này." : nguon === "chung" && cn !== "tat_ca" ? "Chi nhánh này đang dùng cài đặt chung; bấm Lưu để tách cài đặt riêng." : nguon === "mac_dinh" ? "Chưa lưu cài đặt nào, đang hiện giá trị mặc định." : "Cài đặt chung cho mọi chi nhánh."}</p>
      </div>
      {loi && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-label="Thiết lập in">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={NHAN_O}>Áp dụng cho chi nhánh</label><Chon ariaLabel="Áp dụng cho chi nhánh" luaChon={[{ gia_tri: "tat_ca", nhan: "Tất cả các chi nhánh" }, ...chiNhanh.map((x) => ({ gia_tri: x.id, nhan: x.ten }))]} giaTri={cn} onDoi={(v) => di(loai, v)} /></div>
            <div><label className={NHAN_O}>Thiết lập in</label><Chon ariaLabel="Thiết lập in" luaChon={[{ gia_tri: "hoa_don", nhan: "Hoá đơn" }, { gia_tri: "lich_hen", nhan: "Lịch hẹn" }]} giaTri={loai} onDoi={(v) => di(v, cn)} /></div>
            <div><label className={NHAN_O}>Kích thước giấy in</label><Chon ariaLabel="Kích thước giấy in" luaChon={KHO_GIAY.map((k) => ({ ...k }))} giaTri={c.khoGiay} onDoi={(v) => dat({ khoGiay: v as CauHinhIn["khoGiay"] })} voHieu={tat} /></div>
            <div><label className={NHAN_O}>In thêm bản sao</label><Chon ariaLabel="In thêm bản sao" luaChon={[0, 1, 2, 3].map((n) => ({ gia_tri: String(n), nhan: `${n} bản sao` }))} giaTri={String(c.banSao)} onDoi={(v) => dat({ banSao: Number(v) })} voHieu={tat} /></div>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {O[loai].slice(0, 2).map(([k, n]) => <Hop key={k} id={`in-${k}`} nhan={n} bat={c[k]} onDoi={(v) => dat({ [k]: v })} tat={tat} />)}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div><label className={NHAN_O} htmlFor="in-co-logo">Kích thước logo</label><div className="flex items-center gap-2"><input id="in-co-logo" inputMode="numeric" {...CHON_HET} disabled={tat} value={c.coLogo ? String(c.coLogo) : ""} onChange={(e) => dat({ coLogo: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${O_NHAP} !w-28 text-right tabular-nums`} /><span className="text-[14px] text-muc-2">px</span></div></div>
            {sua && <button type="button" className={`${NUT_CHU} pb-3`} onClick={() => dat({ coLogo: 0 })}>Chọn cỡ mặc định</button>}
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {O[loai].slice(2).map(([k, n]) => <Hop key={k} id={`in-${k}`} nhan={n} bat={c[k]} onDoi={(v) => dat({ [k]: v })} tat={tat} />)}
          </div>
          <div><label className={NHAN_O} htmlFor="in-cuoi">Nội dung kết thúc tờ in</label><textarea id="in-cuoi" disabled={tat} value={c.noiDungCuoi} onChange={(e) => dat({ noiDungCuoi: e.target.value })} className={O_NHIEU_DONG} /></div>
          {loai === "hoa_don" && <div><label className={NHAN_O} htmlFor="in-khong-hoan">Câu cam kết dưới chữ ký (để trống thì không in)</label><textarea id="in-khong-hoan" disabled={tat} value={c.cauKhongHoanLai} onChange={(e) => dat({ cauKhongHoanLai: e.target.value })} className={O_NHIEU_DONG} /></div>}
          <Hop id="in-qr" nhan="Hiện thị QRCode cuối tờ in" bat={c.qr} onDoi={(v) => dat({ qr: v })} tat={tat} />
          {c.qr && (
            <div className="space-y-3 rounded-nho border border-vien p-3">
              <p className="text-[13px] font-medium text-muc-2">QRCode thanh toán</p>
              {taiKhoan.length > 0 && (
                <div><label className={NHAN_O}>Lấy từ tài khoản ngân hàng</label>
                  <Chon ariaLabel="Lấy từ tài khoản ngân hàng" voHieu={tat} giaTri={taiKhoan.find((x) => x.so === c.qrSoTk && maQrCuaTen(x.nganHang) === c.qrNganHang)?.id ?? ""}
                    luaChon={[{ gia_tri: "", nhan: "Chọn tài khoản để điền sẵn" }, ...taiKhoan.map((x) => ({ gia_tri: x.id, nhan: `${x.nganHang} · ${x.so} · ${x.chu}` }))]}
                    onDoi={(v) => { const x = taiKhoan.find((y) => y.id === v); if (x) dat({ qrNganHang: maQrCuaTen(x.nganHang) ?? "", qrSoTk: x.so.replace(/\D/g, ""), qrChuTk: x.chu.slice(0, 50) }); }} /></div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={NHAN_O}>Ngân hàng</label><Chon ariaLabel="Ngân hàng" luaChon={[{ gia_tri: "", nhan: "Chọn ngân hàng" }, ...NGAN_HANG_QR.map((b) => ({ gia_tri: b.ma, nhan: b.nhan }))]} giaTri={c.qrNganHang} onDoi={(v) => dat({ qrNganHang: v })} voHieu={tat} /></div>
                <div><label className={NHAN_O} htmlFor="in-sotk">Số TK</label><input id="in-sotk" inputMode="numeric" disabled={tat} value={c.qrSoTk} onChange={(e) => dat({ qrSoTk: e.target.value.replace(/\D/g, "") })} className={O_NHAP} autoComplete="off" /></div>
                <div><label className={NHAN_O} htmlFor="in-chutk">Chủ TK</label><input id="in-chutk" disabled={tat} value={c.qrChuTk} onChange={(e) => dat({ qrChuTk: e.target.value })} className={O_NHAP} autoComplete="off" /></div>
                <div><label className={NHAN_O} htmlFor="in-ghi-chu-ck">Ghi chú chuyển khoản</label><input id="in-ghi-chu-ck" disabled={tat} value={c.qrGhiChu} onChange={(e) => dat({ qrGhiChu: e.target.value })} className={O_NHAP} autoComplete="off" /></div>
              </div>
              <p className="text-[12px] text-muc-3">Chú ý: không điền các ký tự đặc biệt (! @ # $ % ^ &amp; * ( ) - _ = + \ | [ ] {"{ }"} ; : / ? . &gt;). Ghi chú có thể chèn &lt;ORDER_CODE&gt; (mã hoá đơn) và &lt;CUSTOMER_NAME&gt; (tên khách); để trống thì mã không kèm nội dung. Mã chỉ dựng được cho các ngân hàng trong danh sách.</p>
              <div><label className={NHAN_O} htmlFor="in-qr-nd">Hoặc nội dung QRCode</label><textarea id="in-qr-nd" disabled={tat} value={c.qrNoiDung} onChange={(e) => dat({ qrNoiDung: e.target.value })} className={`${O_NHIEU_DONG} !min-h-[64px]`} /></div>
            </div>
          )}
          <div className="sm:w-1/2"><label className={NHAN_O}>Ngôn ngữ</label><Chon ariaLabel="Ngôn ngữ" luaChon={[{ gia_tri: "vi", nhan: "Tiếng Việt" }, { gia_tri: "en", nhan: "English" }]} giaTri={c.ngonNgu} onDoi={(v) => dat({ ngonNgu: v as "vi" | "en" })} voHieu={tat} /><p className="mt-1.5 text-[12px] text-muc-3">English: đổi nhãn trên tờ in (Invoice, Cashier, Total…); tên dịch vụ và nội dung cuối tờ giữ nguyên như đã nhập.</p></div>
          {loai === "lich_hen" && <p className="text-[12.5px] leading-snug text-muc-3">Phiếu lịch hẹn: nút "In lịch hẹn" ở màn Lịch hẹn in theo khổ giấy, logo, thông tin cửa hàng và nội dung kết thúc ở đây.</p>}
          {loai === "hoa_don" && <p className="text-[12.5px] leading-snug text-muc-3">Nhân viên phục vụ in dưới từng dòng “(NV: …)” theo người được gán ở Thu ngân; giờ vào/ra lấy giờ ghi trên hoá đơn, không có thì giờ lịch hẹn gắn với đơn.</p>}
        </section>
        <section className="the-noi the-noi-thap p-4 sm:p-5" aria-label="Bản in mẫu">
          <h2 className="mb-3 text-center text-[15px] font-semibold text-muc">{loai === "hoa_don" ? "Hoá đơn mẫu" : "Lịch hẹn mẫu"}</h2>
          <div className="overflow-x-auto rounded-nho bg-giay-tram p-3"><div className="mx-auto shadow-sm"><BanInHoaDon cfg={c} d={mau} /></div></div>
        </section>
      </div>
      {sua && <ThanhLuu dang={dang} ok={ok} onLuu={gui} />}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { CHON_HET, NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { DAT_TRUOC, DOI_TUONG, GIOI_HAN_NGAY, KHUNG_GIO, NGON_NGU, THOI_LUONG, TRANG_THAI, type LuaChonWeb, type WebDatLich } from "@/lib/web-dat-lich";

const Hang = ({ nhan, phu, children }: { nhan: string; phu?: string; children: React.ReactNode }) => (
  <div className="grid gap-1.5 sm:grid-cols-[1fr_minmax(0,220px)] sm:items-center sm:gap-4">
    <div><span className={`${NHAN_O} !mb-0`}>{nhan}</span>{phu && <p className="mt-0.5 text-[12px] leading-snug text-muc-3">{phu}</p>}</div>
    <div>{children}</div>
  </div>
);
/** Danh sách lựa chọn; giá trị đang lưu không có trong danh sách (VD đặt trước 90 phút từ nút cũ) vẫn được hiện để không bị đổi ngầm. */
const them = (ds: LuaChonWeb[], v: number, dv: string): LuaChonWeb[] => (ds.some((d) => d.gia_tri === String(v)) ? ds : [...ds, { gia_tri: String(v), nhan: `${v} ${dv}` }].sort((a, b) => Number(a.gia_tri) - Number(b.gia_tri)));

/** Bố cục như SalonHero "Web đặt Lịch": đường dẫn + nút Sao chép / Xem trang / Mã nhúng website; trái các tuỳ chọn, phải Thông báo đặt lịch bằng Email. */
export function WebDatLichForm({ dau, sua, duongDan, luu }: { dau: WebDatLich; sua: boolean; duongDan: string; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [t, setT] = useState(dau);
  const [email, setEmail] = useState(dau.emailNhan.join(", "));
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false), [nhung, setNhung] = useState(false), [daChep, setDaChep] = useState(false);
  const [dang, bat] = useTransition();
  const dat = (p: Partial<WebDatLich>) => { setT({ ...t, ...p }); setOk(false); };
  const maNhung = `<iframe src="${duongDan}" title="Đặt lịch AMIA" width="100%" height="720" style="border:0"></iframe>`;
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    const so = (k: string, v: number) => fd.set(k, String(v)), cb = (k: string, v: boolean) => fd.set(k, v ? "1" : "0");
    so("bao_truoc_phut", t.baoTruocPhut); so("toi_da_ngay", t.toiDaNgay); cb("khoa_trang", t.khoaTrang);
    cb("chon_ktv", t.chonKtv); cb("hien_dv_sp", t.hienDvSp); cb("hien_buoi", t.hienBuoi); cb("hien_gia", t.hienGia); fd.set("doi_tuong", t.doiTuong);
    so("khung_phut", t.khungPhut); so("toi_da_luot", t.toiDaLuot); so("thoi_luong_phut", t.thoiLuongPhut); fd.set("trang_thai", t.trangThai); fd.set("ngon_ngu", t.ngonNgu);
    fd.set("mau", t.mau); cb("mac_dinh_mau", t.macDinhMau); cb("tat_thong_bao", t.tatThongBao); cb("gui_email_nv", t.guiEmailNv); cb("am_thanh", t.amThanh); fd.set("email_nhan", email);
    bat(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); router.refresh(); } });
  };
  const chep = async (s: string) => { try { await navigator.clipboard.writeText(s); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { setLoi("Trình duyệt không cho sao chép, hãy bôi đen và sao chép tay."); } };
  const lc = (ten: string, ds: LuaChonWeb[], v: string, f: (x: string) => void) => <Chon ariaLabel={ten} luaChon={ds} giaTri={v} onDoi={f} voHieu={!sua} />;
  const bt = (nhan: string, v: boolean, f: (x: boolean) => void) => (sua ? <Gat nhan={nhan} giaTriMacDinh={v} onDoi={f} /> : <span className="text-[14px] text-muc-2">{nhan}: {v ? "bật" : "tắt"}</span>);
  return (
    <div>
      {sua && <div className="mb-5 flex justify-end"><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : "Lưu thông tin"}</button></div>}
      {loi && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {ok && <p role="status" className="mb-4 text-[14px] text-nhan-dam">Đã lưu thông tin.</p>}
      <p role="note" className="mb-5 rounded-nho border border-vien px-4 py-3 text-[13px] leading-relaxed text-muc-2">Đang có hiệu lực trên trang /dat-lich: Cho phép đặt lịch trước giờ bắt đầu, Giới hạn số ngày đặt lịch trước (Không giới hạn = tối đa 60 ngày) và Khoá trang web đặt lịch. Các tuỳ chọn còn lại đã được lưu nhưng trang /dat-lich chưa áp dụng.</p>
      <section className="the-noi the-noi-thap mb-5 p-4 sm:p-5" aria-label="Đường dẫn đặt lịch">
        <div className="grid gap-2 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:gap-4">
          <span className={`${NHAN_O} !mb-0`}>Đường dẫn đặt lịch</span>
          <input readOnly value={duongDan} aria-label="Đường dẫn đặt lịch" className={O_NHAP} />
          <span className="flex flex-wrap gap-2">
            <button type="button" className={NUT_PHU} onClick={() => chep(duongDan)}>{daChep ? "Đã chép" : "Sao chép"}</button>
            <a href="/dat-lich" target="_blank" rel="noopener noreferrer" className={`${NUT_PHU} inline-flex items-center`}>Xem trang</a>
            <button type="button" className={NUT_PHU} aria-expanded={nhung} onClick={() => setNhung(!nhung)}>Mã nhúng website</button>
          </span>
        </div>
        {nhung && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea readOnly rows={3} value={maNhung} aria-label="Mã nhúng website" className="min-h-[72px] w-full rounded-nho border border-vien-dam bg-giay-sang px-3 py-2 text-[13px] text-muc" />
            <button type="button" className={NUT_PHU} onClick={() => chep(maNhung)}>Sao chép mã</button>
          </div>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="the-noi the-noi-thap space-y-4 p-4 sm:p-5" aria-label="Tuỳ chọn đặt lịch">
          <Hang nhan="Cho phép chọn stylist lúc đặt lịch">{bt("Cho phép", t.chonKtv, (v) => dat({ chonKtv: v }))}</Hang>
          <Hang nhan="Hiện thị thông tin dịch vụ & sản phẩm">{bt("Hiện thị", t.hienDvSp, (v) => dat({ hienDvSp: v }))}</Hang>
          <Hang nhan="Hiển thị ô chọn buổi trong ngày">{bt("Hiển thị", t.hienBuoi, (v) => dat({ hienBuoi: v }))}</Hang>
          <Hang nhan="Hiện thị giá của dịch vụ và sản phẩm">{bt("Hiện thị", t.hienGia, (v) => dat({ hienGia: v }))}</Hang>
          <Hang nhan="Dành cho khách hàng">{lc("Dành cho khách hàng", DOI_TUONG, t.doiTuong, (v) => dat({ doiTuong: v }))}</Hang>
          <Hang nhan="Thời gian của 1 khung giờ" phu="(ví dụ: khung giờ 15 phút, sẽ là 8:15, 8:30, 8:45)">{lc("Thời gian của 1 khung giờ", KHUNG_GIO, String(t.khungPhut), (v) => dat({ khungPhut: Number(v) }))}</Hang>
          <Hang nhan="Cho phép đặt lịch trước giờ bắt đầu">{lc("Cho phép đặt lịch trước giờ bắt đầu", them(DAT_TRUOC, t.baoTruocPhut, "phút"), String(t.baoTruocPhut), (v) => dat({ baoTruocPhut: Number(v) }))}</Hang>
          <Hang nhan="Số lượt khách đặt tối đa cho 1 khung giờ">
            <div className="flex items-center gap-3">
              <input aria-label="Số lượt khách đặt tối đa cho 1 khung giờ" inputMode="numeric" {...CHON_HET} disabled={!sua} value={String(t.toiDaLuot)} onChange={(e) => dat({ toiDaLuot: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${O_NHAP} !w-24 text-right tabular-nums`} />
              <Link href="/danh-muc?tab=cho-lam" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Tùy chỉnh</Link>
            </div>
          </Hang>
          <Hang nhan="Giới hạn số ngày đặt lịch trước">{lc("Giới hạn số ngày đặt lịch trước", them(GIOI_HAN_NGAY, t.toiDaNgay, "ngày"), String(t.toiDaNgay), (v) => dat({ toiDaNgay: Number(v) }))}</Hang>
          <Hang nhan="Cài đặt ngày nghỉ ở cửa hàng"><Link href="/cai-dat/gio-lam-viec" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Tùy chỉnh</Link></Hang>
          <Hang nhan="Thời gian (mặc định) làm dịch vụ của 1 lịch hẹn">{lc("Thời gian mặc định làm dịch vụ", THOI_LUONG, String(t.thoiLuongPhut), (v) => dat({ thoiLuongPhut: Number(v) }))}</Hang>
          <Hang nhan="Trạng thái mặc định khi đặt lịch từ web & mobile apps.">{lc("Trạng thái mặc định", TRANG_THAI, t.trangThai, (v) => dat({ trangThai: v }))}</Hang>
          <Hang nhan="Ngôn ngữ hiện thị">{lc("Ngôn ngữ hiện thị", NGON_NGU, t.ngonNgu, (v) => dat({ ngonNgu: v }))}</Hang>
          <Hang nhan="Đặt màu cho web đặt lịch">
            <div className="flex flex-wrap items-center gap-3">
              <input type="color" aria-label="Chọn màu" disabled={!sua} value={t.mau} onChange={(e) => dat({ mau: e.target.value })} className="h-11 w-14 rounded-nho border border-vien-dam bg-giay-sang p-1" />
              <input aria-label="Mã màu" disabled={!sua} value={t.mau} onChange={(e) => dat({ mau: e.target.value })} className={`${O_NHAP} !w-28`} />
              {bt("Mặc định", t.macDinhMau, (v) => dat({ macDinhMau: v }))}
            </div>
          </Hang>
          <Hang nhan="Ảnh bìa trang đặt lịch" phu="Kích thước đề xuất 1600 × 460. Để trống sẽ dùng ảnh bìa mặc định theo màu của web đặt lịch.">
            <button type="button" className={`${NUT_PHU} opacity-60`} disabled title="Chưa có chức năng tải ảnh bìa">Tải ảnh lên</button>
          </Hang>
          <Hang nhan="Khoá trang web đặt lịch">{bt("Khoá trang", t.khoaTrang, (v) => dat({ khoaTrang: v }))}</Hang>
        </section>
        <section className="the-noi the-noi-thap space-y-4 self-start p-4 sm:p-5" aria-labelledby="tb-email">
          <h2 id="tb-email" className="text-[16px] font-semibold text-muc">Thông báo đặt lịch bằng Email</h2>
          <Hang nhan="Tắt tất cả thông báo lịch hẹn">{bt("Tắt tất cả", t.tatThongBao, (v) => dat({ tatThongBao: v }))}</Hang>
          <Hang nhan="Gửi email cho nhân viên phục vụ của lịch hẹn đó">{bt("Gửi email", t.guiEmailNv, (v) => dat({ guiEmailNv: v }))}</Hang>
          <Hang nhan="Gửi email thông báo cho các email sau" phu="Nhiều email cách nhau bằng dấu phẩy.">
            <input aria-label="Gửi email thông báo cho các email sau" disabled={!sua} value={email} onChange={(e) => { setEmail(e.target.value); setOk(false); }} className={O_NHAP} autoComplete="off" />
          </Hang>
          <Hang nhan="Cho phép thông báo lịch hẹn bằng âm thanh">{bt("Cho phép", t.amThanh, (v) => dat({ amThanh: v }))}</Hang>
        </section>
      </div>
    </div>
  );
}

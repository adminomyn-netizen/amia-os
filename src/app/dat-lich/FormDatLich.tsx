"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { guiYeuCauDatLich, layGioTrong } from "./actions";

type Cn = { id: string; ten: string; dia_chi: string | null };
type Dv = { id: string; ten: string; phut: number; nhom: string };

/** Biểu mẫu khách tự chọn chi nhánh, dịch vụ, ngày giờ còn trống rồi để lại họ tên + số điện thoại. Chỉ là YÊU CẦU: lễ tân gọi xác nhận. */
export function FormDatLich({ chiNhanh, dichVu, homNay }: { chiNhanh: Cn[]; dichVu: Dv[]; homNay: string }) {
  const [kq, action, dang] = useActionState(guiYeuCauDatLich, undefined);
  const [cn, setCn] = useState(chiNhanh.length === 1 ? chiNhanh[0].id : "");
  const [dv, setDv] = useState<string[]>([]);
  const [ngay, setNgay] = useState("");
  const [gio, setGio] = useState("");
  const [gioTrong, setGioTrong] = useState<string[] | null>(null);
  const [loiGio, setLoiGio] = useState("");
  const [, bat] = useTransition();
  const [moLuc] = useState(() => Date.now());
  const tong = dichVu.filter((d) => dv.includes(d.id)).reduce((a, d) => a + d.phut, 0);

  useEffect(() => {
    // Mỗi lần đổi chi nhánh / dịch vụ / ngày thì hỏi lại khung giờ trống.
    if (!cn || !ngay || dv.length === 0) return;
    let huy = false;
    bat(async () => {
      const r = await layGioTrong(cn, ngay, dv);
      if (huy) return;
      setGioTrong(r.gio); setLoiGio(r.loi ?? ""); setGio((g) => (r.gio.includes(g) ? g : ""));
    });
    return () => { huy = true; };
  }, [cn, ngay, dv]);

  const nhom = [...new Set(dichVu.map((d) => d.nhom))];
  if (kq?.ok) return <div role="status" className="rounded-the border border-nhan bg-nhan-nhat p-5 text-[15px] text-nhan-dam"><p className="font-semibold">Cảm ơn bạn!</p><p className="mt-1">{kq.tomTat}</p></div>;
  const san = cn && dv.length > 0 && ngay && gioTrong !== null;
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="mo_luc" value={moLuc} />
      <input type="hidden" name="dich_vu_ids" value={dv.join(",")} />
      <input type="hidden" name="gio" value={gio} />
      {/* Ô bẫy cho bot: người thật không thấy, không tới được bằng bàn phím */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-[16px] font-semibold text-muc">1. Chọn chi nhánh</legend>
        {chiNhanh.length === 1 ? <p className="text-[15px] text-muc-2">{chiNhanh[0].ten}{chiNhanh[0].dia_chi ? ` · ${chiNhanh[0].dia_chi}` : ""}</p>
          : <Chon id="chi_nhanh_id" ariaLabel="Chi nhánh" trong="Chọn chi nhánh" giaTri={cn} luaChon={chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} onDoi={(v) => { setCn(v); setGio(""); }} />}
        <input type="hidden" name="chi_nhanh_id" value={cn} />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[16px] font-semibold text-muc">2. Chọn dịch vụ</legend>
        <div className="space-y-4">
          {nhom.map((n) => (
            <div key={n}>
              <p className="mb-1.5 text-[13px] font-medium text-muc-3">{n}</p>
              <div className="space-y-1.5">
                {dichVu.filter((d) => d.nhom === n).map((d) => (
                  <label key={d.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-nho border px-3 py-2 text-[15px] ${dv.includes(d.id) ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam bg-giay-sang text-muc"}`}>
                    <input type="checkbox" checked={dv.includes(d.id)} disabled={!dv.includes(d.id) && dv.length >= 5} onChange={() => { setDv(dv.includes(d.id) ? dv.filter((x) => x !== d.id) : [...dv, d.id]); setGio(""); }} className="h-4 w-4 accent-[var(--nhan)]" />
                    <span className="min-w-0 flex-1">{d.ten}</span><span className="shrink-0 text-[13px] text-muc-3">{d.phut} phút</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {tong > 0 && <p className="mt-2 text-[13px] text-muc-3">Tổng thời gian dự kiến: {tong} phút</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[16px] font-semibold text-muc">3. Chọn ngày và giờ</legend>
        <NgayChon ariaLabel="Ngày hẹn" giaTri={ngay} tuNam={Number(homNay.slice(0, 4))} denNam={Number(homNay.slice(0, 4)) + 1} onDoi={(v) => { setNgay(v); setGio(""); setGioTrong(null); }} />
        {san && gioTrong.length === 0 && <p className="mt-3 text-[14px] text-muc-3">{loiGio || "Ngày này chưa có giờ trống (hoặc phòng khám nghỉ). Vui lòng chọn ngày khác."}</p>}
        {san && gioTrong.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Giờ hẹn còn trống">
            {gioTrong.map((g) => <button key={g} type="button" role="radio" aria-checked={g === gio} onClick={() => setGio(g)} className={`h-11 rounded-nho border text-[15px] font-medium tabular-nums ${g === gio ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc hover:bg-giay-tram"}`}>{g}</button>)}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-[16px] font-semibold text-muc">4. Thông tin của bạn</legend>
        <div><label htmlFor="ho_ten" className={NHAN_O}>Họ và tên</label><input id="ho_ten" name="ho_ten" required minLength={2} maxLength={100} autoComplete="name" className={O_NHAP} /></div>
        <div><label htmlFor="dien_thoai" className={NHAN_O}>Số điện thoại</label><input id="dien_thoai" name="dien_thoai" type="tel" inputMode="tel" required autoComplete="tel" maxLength={20} className={O_NHAP} /></div>
        <div><label htmlFor="ghi_chu" className={NHAN_O}>Ghi chú (không bắt buộc)</label><textarea id="ghi_chu" name="ghi_chu" maxLength={300} className={O_NHIEU_DONG} /></div>
      </fieldset>

      {kq?.loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2 text-[14px] text-loi">{kq.loi}</p>}
      <button type="submit" disabled={dang || !gio || !cn || dv.length === 0} className="nut-vang h-12 w-full rounded-nho text-[16px] disabled:opacity-60">{dang ? "Đang gửi" : "Gửi yêu cầu đặt lịch"}</button>
      <p className="text-[12px] text-muc-3">Đây là yêu cầu đặt lịch. Lịch chỉ được giữ chỗ sau khi phòng khám gọi điện xác nhận với bạn.</p>
    </form>
  );
}

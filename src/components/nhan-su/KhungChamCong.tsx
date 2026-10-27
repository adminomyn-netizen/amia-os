"use client";

import { useEffect, useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";

type Props = {
  ngay: string;
  ca: { ten: string; vao: string; ra: string; dungSai: number } | null;
  vao: { gio: string; trePhut: number } | null;
  ra: { gio: string; veSomPhut: number } | null;
  nutVao: React.ReactNode;
  nutRa: React.ReactNode;
};

const HCM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });
const phutHienTai = (d: Date) => { const [h, m] = HCM.format(d).split(":").map(Number); return h * 60 + m; };
const phutTu = (g: string) => { const [h, m] = g.split(":"); return Number(h) * 60 + Number(m); };
const hhmm = (g: string) => g.slice(0, 5);
const doi = (p: number) => (p >= 60 ? `${Math.floor(p / 60)} giờ${p % 60 ? ` ${p % 60} phút` : ""}` : `${p} phút`);

type Tin = { mau: "tot" | "canh" | "trung"; chu: string };

/** Khung chấm công theo kiểu Lark Attendance: hai khung xếp dọc (giờ vào, giờ ra), mỗi khung nêu giờ của ca, tình trạng thời gian thực và nút bấm riêng.
 *  Chưa tới giờ hoặc còn trong dung sai thì chấm vào bình thường; quá giờ vẫn chấm được nhưng báo trễ. Giờ ra: chưa tới giờ vẫn chấm được nhưng báo về sớm.
 *  Cập nhật mỗi 30 giây, tạm nghỉ khi tab bị ẩn. */
export function KhungChamCong({ ngay, ca, vao, ra, nutVao, nutRa }: Props) {
  const [phut, setPhut] = useState<number | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const dat = () => setPhut(phutHienTai(new Date()));
    const chay = () => { clearInterval(t); if (document.visibilityState === "visible") { dat(); t = setInterval(dat, 30_000); } };
    chay();
    document.addEventListener("visibilitychange", chay);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", chay); };
  }, []);

  const batDau = ca ? phutTu(ca.vao) : null, ketThuc = ca ? phutTu(ca.ra) : null;
  let tinVao: Tin | null = null, tinRa: Tin | null = null;
  if (!vao && phut !== null && batDau !== null && ca) {
    if (phut <= batDau) tinVao = { mau: "tot", chu: phut < batDau ? `Còn ${doi(batDau - phut)} đến giờ vào. Chấm công bây giờ là đúng giờ.` : "Đúng giờ vào. Chấm công bây giờ là đúng giờ." };
    else if (phut <= batDau + ca.dungSai) tinVao = { mau: "tot", chu: `Đã quá giờ vào ${doi(phut - batDau)} nhưng còn trong thời gian cho phép (${ca.dungSai} phút), không tính trễ.` };
    else tinVao = { mau: "canh", chu: `Đã quá giờ vào ${doi(phut - batDau - ca.dungSai)}. Vẫn chấm công được, hệ thống ghi nhận trễ.` };
  }
  if (!ra && phut !== null && ketThuc !== null) {
    if (phut < ketThuc) tinRa = { mau: "canh", chu: `Chưa đến giờ ra (còn ${doi(ketThuc - phut)}). Vẫn chấm công được, hệ thống ghi nhận về sớm.` };
    else tinRa = { mau: "tot", chu: "Đã đến giờ ra. Bạn có thể chấm công ra." };
  }

  return (
    <section aria-label="Chấm công hôm nay" className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muc-2">
        <span className="inline-flex items-center gap-2 font-medium text-muc"><Clock strokeWidth={1.7} className="h-[18px] w-[18px] text-nhan" aria-hidden />Hôm nay {ngay}</span>
        {ca ? <span>Ca <b className="font-medium text-muc">{ca.ten}</b> · làm việc {hhmm(ca.vao)} – {hhmm(ca.ra)}</span> : <span>Hôm nay bạn không có ca làm (nghỉ theo lịch hoặc không phải chấm công).</span>}
      </div>
      <Khung bieuTuong={<LogIn strokeWidth={1.7} className="h-6 w-6" aria-hidden />} nhan="Giờ vào làm" gio={ca ? hhmm(ca.vao) : "—"}
        xong={vao ? { gio: vao.gio, ghiChu: vao.trePhut > 0 ? `Trễ ${doi(vao.trePhut)}` : "Đúng giờ", canh: vao.trePhut > 0 } : null} tin={tinVao} nut={nutVao} nhanXong="Đã chấm công vào" />
      <Khung bieuTuong={<LogOut strokeWidth={1.7} className="h-6 w-6" aria-hidden />} nhan="Giờ ra về" gio={ca ? hhmm(ca.ra) : "—"}
        xong={ra ? { gio: ra.gio, ghiChu: ra.veSomPhut > 0 ? `Về sớm ${doi(ra.veSomPhut)}` : "Đủ giờ", canh: ra.veSomPhut > 0 } : null} tin={tinRa} nut={nutRa} nhanXong="Đã chấm công ra" />
    </section>
  );
}

function Khung({ bieuTuong, nhan, gio, xong, tin, nut, nhanXong }: {
  bieuTuong: React.ReactNode; nhan: string; gio: string; xong: { gio: string; ghiChu: string; canh: boolean } | null; tin: Tin | null; nut: React.ReactNode; nhanXong: string;
}) {
  return (
    <div className="the-noi the-noi-thap flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
      <span className="o-bieu-tuong" aria-hidden>{bieuTuong}</span>
      <div className="min-w-[140px]">
        <div className="nhan-muc">{nhan}</div>
        <div className="mt-1 text-[34px] font-semibold leading-none tabular-nums text-muc">{gio}</div>
      </div>
      <div className="min-w-0 flex-1 basis-[240px] text-[14px]">
        {xong ? (
          <>
            <div className="font-medium text-muc">Đã ghi nhận lúc {xong.gio}</div>
            <div className={`mt-0.5 ${xong.canh ? "text-canh-bao" : "text-nhan-dam"}`}>{xong.ghiChu}</div>
          </>
        ) : tin ? (
          <div className={tin.mau === "canh" ? "text-canh-bao" : tin.mau === "tot" ? "text-nhan-dam" : "text-muc-2"}>{tin.chu}</div>
        ) : (
          <div className="text-muc-3">Đang lấy giờ hiện tại…</div>
        )}
      </div>
      <div className="shrink-0">
        {xong ? <span className="inline-flex h-11 items-center rounded-nho bg-giay-tram px-5 text-[14px] font-medium text-muc-3" aria-disabled="true">{nhanXong}</span> : nut}
      </div>
    </div>
  );
}

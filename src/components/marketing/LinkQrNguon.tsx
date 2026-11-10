"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { NUT_PHU } from "@/components/ui/dinh-dang";

/** Link / QR theo nguồn giới thiệu (BeDental "Link / QR" + "Poster QR đặt hẹn"): link đặt lịch có REF, Sao chép, Tải QR PNG / SVG,
 *  3 mẫu poster AMIA (logo + 3 từ khoá vàng "AMIA · Phòng khám da liễu · Tiên phong công nghệ cao") vẽ trên canvas, tải PNG. Không gửi gì lên máy chủ. */
const TU_KHOA = "AMIA · Phòng khám da liễu · Tiên phong công nghệ cao";
const DIA_CHI = "39A Lê Hồng Phong, TP. Vinh · GP 1233/NA-GPHĐ";
const VANG = ["#d9b877", "#ba9551", "#9c7a3a"];
const XANH = "#0a2b26", XANH_NHAN = "#006f62", KEM = "#faf7f1";
type Mau = { ma: string; ten: string };
const MAU: Mau[] = [{ ma: "mot-cham", ten: "Mẫu 01 · Một chạm đặt hẹn" }, { ma: "the-moi", ten: "Mẫu 02 · Thẻ mời chị em" }, { ma: "toi-gian", ten: "Mẫu 03 · Chỉ logo và mã QR" }];
const W = 1080, H = 1350;

const taiAnh = (src: string) => new Promise<HTMLImageElement>((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi; i.src = src; });
const taiVe = (url: string, ten: string) => { const a = document.createElement("a"); a.href = url; a.download = ten; document.body.appendChild(a); a.click(); a.remove(); };

function chuGiua(c: CanvasRenderingContext2D, chu: string, y: number, co: number, mau: string, dam = 400, font = "") {
  c.font = `${dam} ${co}px ${font}`; c.fillStyle = mau; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText(chu, W / 2, y, W - 120);
}
function vangNgang(c: CanvasRenderingContext2D, y0: number, y1: number) {
  const g = c.createLinearGradient(0, y0, W, y1); g.addColorStop(0, VANG[0]); g.addColorStop(0.6, VANG[1]); g.addColorStop(1, VANG[2]); return g;
}
function oBoGoc(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

async function vePoster(cv: HTMLCanvasElement, mau: string, link: string, nguoi: string) {
  const c = cv.getContext("2d")!;
  cv.width = W; cv.height = H;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const [logo, logoTrang, qr] = await Promise.all([
    taiAnh("/logo-amia.png"), taiAnh("/logo-amia-trang.png"),
    taiAnh(await QRCode.toDataURL(link, { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: XANH, light: "#ffffff" } })),
  ]);
  const veQr = (x: number, y: number, s: number, khung = true) => {
    if (khung) { c.fillStyle = "#ffffff"; oBoGoc(c, x - 28, y - 28, s + 56, s + 56, 28); c.fill(); }
    c.drawImage(qr, x, y, s, s);
  };
  if (mau === "mot-cham") {
    c.fillStyle = KEM; c.fillRect(0, 0, W, H);
    c.fillStyle = vangNgang(c, 0, 0); c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
    c.drawImage(logo, (W - 360) / 2, 90, 360, 163);
    chuGiua(c, TU_KHOA, 310, 30, VANG[2], 500, font);
    chuGiua(c, "Một chạm đặt lịch chăm sóc da", 420, 58, XANH, 700, font);
    chuGiua(c, "Chị em quét mã, chọn giờ phù hợp, lễ tân gọi xác nhận", 480, 32, "#4a5a56", 400, font);
    c.strokeStyle = vangNgang(c, 0, 0); c.lineWidth = 6; oBoGoc(c, (W - 560) / 2 - 34, 548, 628, 628, 34); c.stroke();
    veQr((W - 560) / 2, 580, 560, false);
    chuGiua(c, `Người giới thiệu: ${nguoi}`, 1240, 34, XANH_NHAN, 500, font);
    chuGiua(c, DIA_CHI, 1290, 26, "#6b7672", 400, font);
  } else if (mau === "the-moi") {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, XANH); g.addColorStop(1, "#061a17"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = vangNgang(c, 0, 0); c.lineWidth = 4; oBoGoc(c, 40, 40, W - 80, H - 80, 36); c.stroke();
    c.drawImage(logoTrang, (W - 340) / 2, 100, 340, 154);
    chuGiua(c, TU_KHOA, 305, 30, VANG[0], 500, font);
    chuGiua(c, "Thư mời chị em", 420, 64, "#ffffff", 700, font);
    chuGiua(c, "đặt lịch thăm khám da tại AMIA", 482, 38, "#e6efe9", 400, font);
    veQr((W - 520) / 2, 570, 520);
    c.fillStyle = vangNgang(c, 0, 0); oBoGoc(c, (W - 640) / 2, 1160, 640, 74, 37); c.fill();
    chuGiua(c, `Giới thiệu bởi ${nguoi}`, 1208, 32, XANH, 700, font);
    chuGiua(c, DIA_CHI, 1286, 26, "#c9d6d1", 400, font);
  } else {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
    c.drawImage(logo, (W - 420) / 2, 120, 420, 190);
    veQr((W - 640) / 2, 400, 640, false);
    chuGiua(c, "Quét mã để đặt lịch", 1135, 44, XANH, 700, font);
    chuGiua(c, TU_KHOA, 1200, 30, VANG[2], 500, font);
    chuGiua(c, DIA_CHI, 1255, 26, "#6b7672", 400, font);
  }
}

export function LinkQrNguon({ link, tenHienThi, maRef, ghiChu }: { link: string; tenHienThi: string; maRef: string; ghiChu?: React.ReactNode }) {
  const [svg, setSvg] = useState("");
  const [daChep, setDaChep] = useState(false);
  const [mau, setMau] = useState(MAU[0].ma);
  const [loi, setLoi] = useState("");
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => { QRCode.toString(link, { type: "svg", margin: 1, width: 180, color: { dark: XANH, light: "#ffffff" } }).then(setSvg).catch(() => setSvg("")); }, [link]);
  useEffect(() => {
    if (!cv.current) return;
    document.fonts.ready.then(() => vePoster(cv.current!, mau, link, tenHienThi)).then(() => setLoi("")).catch(() => setLoi("Chưa vẽ được poster (không tải được logo). Thử tải lại trang."));
  }, [mau, link, tenHienThi]);
  const chep = async () => { try { await navigator.clipboard.writeText(link); setDaChep(true); setTimeout(() => setDaChep(false), 1600); } catch { setLoi("Trình duyệt chặn sao chép, hãy bôi đen link để chép."); } };
  const taiPng = async () => taiVe(await QRCode.toDataURL(link, { margin: 2, width: 1024, color: { dark: XANH, light: "#ffffff" } }), `qr-dat-lich-${maRef}.png`);
  const taiSvg = async () => { const s = await QRCode.toString(link, { type: "svg", margin: 2, color: { dark: XANH, light: "#ffffff" } }); const u = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" })); taiVe(u, `qr-dat-lich-${maRef}.svg`); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  const taiPoster = () => { if (cv.current) taiVe(cv.current.toDataURL("image/png"), `poster-${mau}-${maRef}.png`); };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div>
          <div className="text-[13px] text-muc-3">Link đặt lịch có REF</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-nho bg-giay-tram px-3 py-2 text-[13.5px]">{link}</code>
            <button type="button" onClick={chep} className={NUT_PHU}><Copy className="mr-1.5 inline h-4 w-4" aria-hidden />{daChep ? "Đã chép" : "Sao chép"}</button>
          </div>
          {ghiChu ?? <p className="mt-2 text-[13px] text-muc-3">Khách sẽ thấy ở ô người giới thiệu: <b className="text-muc">{tenHienThi}</b>. Đặt lịch qua link này: lịch hẹn và khách mới tự gắn nguồn, khách mới vào Hộp Lead.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-[180px] w-[180px] rounded-nho border border-vien bg-white p-1" role="img" aria-label={`Mã QR đặt lịch REF ${maRef}`} dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={taiPng} className={NUT_PHU}><Download className="mr-1.5 inline h-4 w-4" aria-hidden />Tải QR (PNG)</button>
            <button type="button" onClick={taiSvg} className={NUT_PHU}><Download className="mr-1.5 inline h-4 w-4" aria-hidden />Tải QR (SVG)</button>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 text-[13px] text-muc-3">Poster QR đặt lịch (mẫu AMIA)</div>
        <div className="mb-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Mẫu poster">
          {MAU.map((m) => <button key={m.ma} type="button" role="radio" aria-checked={mau === m.ma} onClick={() => setMau(m.ma)} className={`rounded-nho border px-2.5 py-1 text-[12.5px] ${mau === m.ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{m.ten}</button>)}
        </div>
        <canvas ref={cv} className="w-full rounded-nho border border-vien" style={{ aspectRatio: `${W} / ${H}` }} aria-label="Xem trước poster" />
        <button type="button" onClick={taiPoster} className={`${NUT_PHU} mt-2 w-full`}><Download className="mr-1.5 inline h-4 w-4" aria-hidden />Tải poster (PNG 1080×1350)</button>
        {loi && <p role="alert" className="mt-2 text-[13px] text-loi">{loi}</p>}
      </div>
    </div>
  );
}

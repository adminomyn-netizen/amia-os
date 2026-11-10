"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { O_NHAP, O_NHIEU_DONG, NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { LinkQrNguon } from "@/components/marketing/LinkQrNguon";
import {
  guiMaDangKy, xacNhanDangKy, guiMaDangNhap, xacNhanDangNhap, luuHoSoCtv, guiKhieuNaiCtv, guiMaRutCtv, taoYeuCauRutCtv, type KQMa,
} from "./actions";

/** Biểu mẫu cổng CTV (trình duyệt). Mọi kiểm tra thật nằm ở actions.ts + hàm Postgres; ở đây chỉ hiển thị từng bước. */
const Loi = ({ chu }: { chu?: string }) => (chu ? <p role="alert" className="rounded-nho border border-loi/30 bg-loi/5 px-3 py-2 text-[14px] text-loi">{chu}</p> : null);
const Tot = ({ chu }: { chu?: string }) => (chu ? <p role="status" className="rounded-nho border border-nhan/30 bg-nhan-nhat px-3 py-2 text-[14px] text-nhan-dam">{chu}</p> : null);
const BAY = <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />;

/** Đếm ngược gửi lại mã (60 giây, khớp giới hạn trong DB). */
function useDemNguoc(bat: unknown) {
  const [con, setCon] = useState(0);
  useEffect(() => { if (bat) setCon(60); }, [bat]);
  useEffect(() => { if (con <= 0) return; const t = setTimeout(() => setCon(con - 1), 1000); return () => clearTimeout(t); }, [con]);
  return con;
}

function OMa({ autoFocus = true }: { autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className={NHAN_O}>Mã xác thực 6 số</span>
      <input name="ma" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} autoFocus={autoFocus}
        className={`${O_NHAP} text-center text-[22px] tracking-[0.5em]`} placeholder="••••••" />
    </label>
  );
}

// ── Đăng nhập ──────────────────────────────────────────────────────────────
export function DangNhapCtv() {
  const router = useRouter();
  const [gui, guiAct, dangGui] = useActionState<KQMa | undefined, FormData>(guiMaDangNhap, undefined);
  const [xn, xnAct, dangXn] = useActionState<KQMa | undefined, FormData>(xacNhanDangNhap, undefined);
  const [sdt, setSdt] = useState("");
  const [doiSo, setDoiSo] = useState(false);
  const con = useDemNguoc(gui?.buoc);
  useEffect(() => { if (xn?.ok) router.refresh(); }, [xn, router]);
  const buocMa = gui?.buoc === "ma" && !doiSo;
  return (
    <div className="space-y-4">
      {!buocMa ? (
        <form action={(fd) => { setDoiSo(false); guiAct(fd); }} className="relative space-y-4">
          {BAY}
          <label className="block">
            <span className={NHAN_O}>Số điện thoại đã đăng ký đối tác</span>
            <input name="dien_thoai" required inputMode="tel" autoComplete="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} className={O_NHAP} placeholder="09xx xxx xxx" />
          </label>
          <Loi chu={gui?.loi} />
          <button disabled={dangGui} className={`${NUT_CHINH} h-11 w-full`}>{dangGui ? "Đang gửi mã…" : "Gửi mã đăng nhập"}</button>
        </form>
      ) : (
        <form action={xnAct} className="space-y-4">
          <input type="hidden" name="sdt" value={gui?.sdt ?? ""} />
          <p className="text-[14px] text-muc-2">Nếu số <b className="tabular-nums">{gui?.sdt}</b> đã đăng ký đối tác, mã 6 số đã được gửi tới email đăng ký. Mã có hiệu lực 10 phút.</p>
          <OMa />
          <Loi chu={xn?.loi} />
          <button disabled={dangXn} className={`${NUT_CHINH} h-11 w-full`}>{dangXn ? "Đang kiểm tra…" : "Đăng nhập"}</button>
          <div className="flex flex-wrap justify-between gap-2 text-[13.5px]">
            <button type="button" onClick={() => setDoiSo(true)} className="text-nhan-dam underline-offset-4 hover:underline">Đổi số điện thoại</button>
            <button type="button" disabled={con > 0 || dangGui} onClick={() => { const fd = new FormData(); fd.set("dien_thoai", sdt); startTransition(() => guiAct(fd)); }}
              className="text-nhan-dam underline-offset-4 hover:underline disabled:text-muc-3 disabled:no-underline">{con > 0 ? `Gửi lại sau ${con}s` : "Gửi lại mã"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Đăng ký ────────────────────────────────────────────────────────────────
export function DangKyCtv({ goc, mucHh }: { goc: string; mucHh: string }) {
  const [gui, guiAct, dangGui] = useActionState<KQMa | undefined, FormData>(guiMaDangKy, undefined);
  const [xn, xnAct, dangXn] = useActionState<KQMa | undefined, FormData>(xacNhanDangKy, undefined);
  const [f, setF] = useState({ ho_ten: "", dien_thoai: "", email: "", dong_y: false });
  const [sua, setSua] = useState(false);
  const con = useDemNguoc(gui?.buoc);
  if (xn?.ok && xn.ref) {
    const link = `${goc}/dat-lich?ref=${xn.ref}`;
    return (
      <div className="space-y-5">
        <Tot chu="Đăng ký thành công! Anh/chị đã là đối tác giới thiệu của AMIA." />
        <div className="rounded-the border border-vien bg-giay-sang p-4">
          <div className="text-[13px] text-muc-3">Mã giới thiệu (REF) của anh/chị</div>
          <div className="mt-1 text-[24px] font-semibold tabular-nums tracking-wide text-nhan-dam">{xn.ref}</div>
          <p className="mt-1 text-[13px] text-muc-3">Người được giới thiệu đặt hẹn qua link / QR dưới đây, hoặc báo số này với lễ tân. Hoa hồng {mucHh}.</p>
        </div>
        <NutChiaSe link={link} />
        <LinkQrNguon link={link} tenHienThi={f.ho_ten || "Đối tác AMIA"} maRef={xn.ref} ghiChu={<p className="mt-2 text-[13px] text-muc-3">Tải mã QR hoặc poster để chia sẻ với người thân, người quen.</p>} />
        <Link href="/ctv" className={`${NUT_CHINH} inline-flex h-11 w-full items-center justify-center`}>Vào Cổng CTV</Link>
      </div>
    );
  }
  const buocMa = gui?.buoc === "ma" && !sua;
  return !buocMa ? (
    <form action={(fd) => { setSua(false); guiAct(fd); }} className="relative space-y-4">
      {BAY}
      <label className="block"><span className={NHAN_O}>Họ và tên</span>
        <input name="ho_ten" required maxLength={80} autoComplete="name" value={f.ho_ten} onChange={(e) => setF({ ...f, ho_ten: e.target.value })} className={O_NHAP} /></label>
      <label className="block"><span className={NHAN_O}>Số điện thoại di động (sẽ là mã giới thiệu)</span>
        <input name="dien_thoai" required inputMode="tel" autoComplete="tel" value={f.dien_thoai} onChange={(e) => setF({ ...f, dien_thoai: e.target.value })} className={O_NHAP} placeholder="10 số, đầu 03/05/07/08/09" /></label>
      <label className="block"><span className={NHAN_O}>Email (nhận mã xác thực và thông báo hoa hồng)</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={O_NHAP} /></label>
      <label className="flex items-start gap-2.5 text-[14px] text-muc-2">
        <input type="checkbox" name="dong_y" value="1" checked={f.dong_y} onChange={(e) => setF({ ...f, dong_y: e.target.checked })} className="mt-1 h-4 w-4 accent-[var(--nhan)]" required />
        <span>Tôi đồng ý <Link href="/ctv/dieu-khoan" target="_blank" className="text-nhan-dam underline">Điều khoản chương trình và Chính sách bảo mật</Link> của AMIA.</span>
      </label>
      <Loi chu={gui?.loi} />
      <button disabled={dangGui} className={`${NUT_CHINH} h-11 w-full`}>{dangGui ? "Đang gửi mã…" : "Gửi mã xác thực qua email"}</button>
      <p className="text-center text-[13.5px] text-muc-3">Đã là đối tác? <Link href="/ctv" className="text-nhan-dam underline">Đăng nhập Cổng CTV</Link></p>
    </form>
  ) : (
    <form action={xnAct} className="space-y-4">
      <input type="hidden" name="sdt" value={gui?.sdt ?? ""} />
      <input type="hidden" name="email_che" value={gui?.email ?? ""} />
      <p className="text-[14px] text-muc-2">Mã 6 số đã gửi tới <b>{gui?.email}</b>. Mã có hiệu lực 10 phút; nếu chưa thấy, anh/chị xem thêm hộp thư Quảng cáo / Spam.</p>
      <OMa />
      <Loi chu={xn?.loi} />
      <button disabled={dangXn} className={`${NUT_CHINH} h-11 w-full`}>{dangXn ? "Đang kiểm tra…" : "Xác nhận đăng ký"}</button>
      <div className="flex flex-wrap justify-between gap-2 text-[13.5px]">
        <button type="button" onClick={() => setSua(true)} className="text-nhan-dam underline-offset-4 hover:underline">Sửa thông tin</button>
        <button type="button" disabled={con > 0 || dangGui} onClick={() => { const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.set(k, typeof v === "boolean" ? (v ? "1" : "") : v)); startTransition(() => guiAct(fd)); }}
          className="text-nhan-dam underline-offset-4 hover:underline disabled:text-muc-3 disabled:no-underline">{con > 0 ? `Gửi lại sau ${con}s` : "Gửi lại mã"}</button>
      </div>
    </form>
  );
}

/** Chia sẻ link đặt hẹn (Zalo / Messenger qua bảng chia sẻ của điện thoại); máy không hỗ trợ thì sao chép. */
export function NutChiaSe({ link }: { link: string }) {
  const [daChep, setDaChep] = useState(false);
  const chiaSe = async () => {
    const nd = { title: "Đặt lịch tại AMIA · Phòng khám da liễu", text: "Đặt lịch chăm sóc da tại AMIA · Phòng khám da liễu · Tiên phong công nghệ cao:", url: link };
    try {
      if (navigator.share) { await navigator.share(nd); return; }
      await navigator.clipboard.writeText(link); setDaChep(true); setTimeout(() => setDaChep(false), 1600);
    } catch { /* người dùng đóng bảng chia sẻ */ }
  };
  return <button type="button" onClick={chiaSe} className={`${NUT_PHU} inline-flex h-11 w-full items-center justify-center gap-2`}><Share2 className="h-4 w-4" aria-hidden />{daChep ? "Đã chép link" : "Chia sẻ link đặt hẹn"}</button>;
}

// ── Hồ sơ ──────────────────────────────────────────────────────────────────
export function HoSoCtv({ tenHienThi, guiEmail, coEmail }: { tenHienThi: string; guiEmail: boolean; coEmail: boolean }) {
  const [kq, act, dang] = useActionState(luuHoSoCtv, undefined);
  return (
    <form action={act} className="space-y-4">
      <label className="block"><span className={NHAN_O}>Tên hiển thị trên trang đặt hẹn</span>
        <input name="ten_hien_thi" defaultValue={tenHienThi} maxLength={80} className={O_NHAP} /></label>
      <label className="flex items-center gap-2.5 text-[14px] text-muc-2">
        <input type="checkbox" name="gui_email" value="1" defaultChecked={guiEmail} disabled={!coEmail} className="h-4 w-4 accent-[var(--nhan)]" />
        Nhận email thông báo (đặt hẹn, hoa hồng, thanh toán)
      </label>
      <Loi chu={kq?.loi} /><Tot chu={kq?.thongBao} />
      <button disabled={dang} className={`${NUT_CHINH} h-11 w-full sm:w-auto`}>{dang ? "Đang lưu…" : "Lưu hồ sơ"}</button>
    </form>
  );
}

// ── Khiếu nại đối soát ─────────────────────────────────────────────────────
export function KhieuNaiCtv({ tu, den }: { tu: string; den: string }) {
  const [kq, act, dang] = useActionState(guiKhieuNaiCtv, undefined);
  return (
    <form action={act} className="space-y-3">
      <input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
      <label className="block"><span className={NHAN_O}>Mã hoá đơn (nếu có)</span><input name="ma_hd" maxLength={40} className={O_NHAP} /></label>
      <label className="block"><span className={NHAN_O}>Nội dung sai lệch</span>
        <textarea name="noi_dung" required minLength={5} maxLength={1000} className={O_NHIEU_DONG} placeholder="Ví dụ: người được giới thiệu đã đến ngày 15/11 nhưng chưa thấy hoa hồng." /></label>
      <Loi chu={kq?.loi} /><Tot chu={kq?.thongBao} />
      <button disabled={dang} className={`${NUT_PHU} h-11 w-full sm:w-auto`}>{dang ? "Đang gửi…" : "Gửi khiếu nại"}</button>
    </form>
  );
}

// ── Yêu cầu thanh toán ─────────────────────────────────────────────────────
export function RutCtv({ khaDung, toiThieu }: { khaDung: number; toiThieu: number }) {
  const [ma, maAct, dangMa] = useActionState<KQMa | undefined, FormData>(async (p) => guiMaRutCtv(p), undefined);
  const [kq, act, dang] = useActionState(taoYeuCauRutCtv, undefined);
  const [hinhThuc, setHinhThuc] = useState("chuyen_khoan");
  if (kq?.ok) return <Tot chu={kq.thongBao} />;
  return (
    <form action={act} className="space-y-3">
      <label className="block"><span className={NHAN_O}>Số tiền muốn nhận (đ)</span>
        <input name="so_tien" required inputMode="numeric" defaultValue={khaDung > 0 ? String(khaDung) : ""} className={O_NHAP} /></label>
      <fieldset className="flex flex-wrap gap-4 text-[14px] text-muc-2">
        {[["chuyen_khoan", "Chuyển khoản"], ["tien_mat", "Tiền mặt tại phòng khám"]].map(([g, t]) => (
          <label key={g} className="flex items-center gap-2"><input type="radio" name="hinh_thuc" value={g} checked={hinhThuc === g} onChange={() => setHinhThuc(g)} className="accent-[var(--nhan)]" />{t}</label>
        ))}
      </fieldset>
      {hinhThuc === "chuyen_khoan" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className={NHAN_O}>Ngân hàng</span><input name="ngan_hang" required maxLength={80} className={O_NHAP} /></label>
          <label className="block"><span className={NHAN_O}>Số tài khoản</span><input name="so_tk" required inputMode="numeric" maxLength={30} className={O_NHAP} /></label>
          <label className="block"><span className={NHAN_O}>Tên chủ tài khoản</span><input name="ten_chu_tk" required maxLength={80} className={O_NHAP} /></label>
        </div>
      )}
      <label className="block"><span className={NHAN_O}>Ghi chú</span><input name="ghi_chu" maxLength={300} className={O_NHAP} /></label>
      {toiThieu > 0 && <p className="text-[13px] text-muc-3">Mức tối thiểu mỗi lần: {toiThieu.toLocaleString("vi-VN")} đ. Mỗi lúc chỉ một yêu cầu đang chờ.</p>}
      {ma?.buoc === "ma" ? (
        <>
          <p className="text-[14px] text-muc-2">Mã xác nhận đã gửi tới <b>{ma.email}</b>, hiệu lực 5 phút.</p>
          <OMa autoFocus={false} />
          <Loi chu={kq?.loi} />
          <button disabled={dang} className={`${NUT_CHINH} h-11 w-full sm:w-auto`}>{dang ? "Đang gửi…" : "Gửi yêu cầu thanh toán"}</button>
        </>
      ) : (
        <>
          <Loi chu={ma?.loi} />
          <button type="button" disabled={dangMa} onClick={() => startTransition(() => maAct(new FormData()))} className={`${NUT_CHINH} h-11 w-full sm:w-auto`}>{dangMa ? "Đang gửi mã…" : "Nhận mã xác nhận qua email"}</button>
        </>
      )}
    </form>
  );
}

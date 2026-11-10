import type { Metadata } from "next";
import Link from "next/link";
import { sb } from "@/lib/db";
import { layCtv } from "@/lib/ctv-phien";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { nhanMucHoaHong } from "@/lib/marketing";
import { HINH_THUC_RUT, KY_CTV, LOAI_BT, LOC_GT, TINH_TRANG_GT, TT_KHIEU_NAI, TT_RUT, TT_THANH_TOAN_HH, cheEmail, kyCtv, linkDatLich } from "@/lib/ctv";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { LinkQrNguon } from "@/components/marketing/LinkQrNguon";
import { DangNhapCtv, HoSoCtv, KhieuNaiCtv, NutChiaSe, RutCtv } from "./BieuMau";
import { dangXuatCtv, dangXuatMoiNoi } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cổng đối tác giới thiệu · AMIA", robots: { index: false, follow: false } };

const GOC = (process.env.NEXT_PUBLIC_SITE_URL || "https://lammec.mscvn.com").replace(/\/$/, "");
const MUC = [{ ma: "tong-quan", ten: "Tổng quan" }, { ma: "gioi-thieu", ten: "Tôi đã giới thiệu" }, { ma: "doi-soat", ten: "Đối soát" }, { ma: "ho-so", ten: "Hồ sơ" }];
type SP = { muc?: string; ky?: string; tu?: string; den?: string; loc?: string };

/** CỔNG CTV: chưa đăng nhập → đăng nhập bằng SĐT + mã email. Đã đăng nhập → 4 mục, MỌI truy vấn theo ctv.id lấy từ phiên đã ký (không nhận id từ URL). */
export default async function TrangCtv({ searchParams }: { searchParams: Promise<SP> }) {
  const ctv = await layCtv();
  if (!ctv) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <h1 className="text-[22px] font-semibold">Đăng nhập Cổng CTV</h1>
          <p className="mt-1 text-[14px] text-muc-2">Xem hoa hồng, người anh/chị đã giới thiệu, đối soát và yêu cầu thanh toán.</p>
        </div>
        <div className="rounded-the border border-vien bg-giay-sang p-4 sm:p-5"><DangNhapCtv /></div>
        <p className="text-center text-[14px] text-muc-2">Chưa là đối tác? <Link href="/ctv/dang-ky" className="font-medium text-nhan-dam underline">Đăng ký ngay</Link></p>
      </div>
    );
  }
  const sp = await searchParams;
  const muc = MUC.some((m) => m.ma === sp.muc) ? sp.muc! : "tong-quan";
  const { ky, tu, den } = kyCtv(sp.ky, sp.tu, sp.den);
  const db = sb();
  const link = linkDatLich(GOC, ctv.ma_ref);
  const tenHienThi = ctv.ten_hien_thi?.trim() || ctv.ten;
  const href = (them: Partial<SP>) => {
    const p = new URLSearchParams({ muc, ky, ...(ky === "tuy-chon" ? { tu, den } : {}), ...(sp.loc ? { loc: sp.loc } : {}) });
    for (const [k, v] of Object.entries(them)) { if (v === undefined || v === "") p.delete(k); else p.set(k, v); }
    return `/ctv?${p.toString()}`;
  };
  const chonKy = (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {KY_CTV.map((k) => <Link key={k.ma} href={href({ ky: k.ma, ...(k.ma === "tuy-chon" ? { tu, den } : { tu: undefined, den: undefined }) })} scroll={false}
          className={`rounded-nho border px-3 py-1.5 text-[13px] ${k.ma === ky ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{k.ten}</Link>)}
      </div>
      {ky === "tuy-chon" && (
        <form className="flex flex-wrap items-end gap-2" action="/ctv">
          <input type="hidden" name="muc" value={muc} /><input type="hidden" name="ky" value="tuy-chon" />
          <label className="text-[12.5px] text-muc-3">Từ<input type="date" name="tu" defaultValue={tu} className="ml-1 h-9 rounded-nho border border-vien-dam bg-giay-sang px-2 text-[14px] text-muc" /></label>
          <label className="text-[12.5px] text-muc-3">Đến<input type="date" name="den" defaultValue={den} className="ml-1 h-9 rounded-nho border border-vien-dam bg-giay-sang px-2 text-[14px] text-muc" /></label>
          <button className="h-9 rounded-nho border border-vien-dam px-3 text-[13px]">Xem</button>
        </form>
      )}
      <p className="text-[12.5px] text-muc-3">Kỳ: {ngayVN(tu)} – {ngayVN(den)}</p>
    </div>
  );

  let noiDung: React.ReactNode = null;
  if (muc === "tong-quan") {
    const { data } = await db.rpc("ctv_tong_quan", { p_dt: ctv.id, p_tu: tu, p_den: den });
    const t = data?.[0] ?? { hoa_hong: 0, doanh_so: 0, so_dat_hen: 0, so_da_den: 0, luot_quet: 0, tong_hh: 0, da_chi: 0, dang_cho: 0, kha_dung: 0 };
    const The = ({ nhan, so, phu }: { nhan: string; so: string; phu?: string }) => (
      <div className="rounded-the border border-vien bg-giay-sang p-3"><div className="text-[12.5px] text-muc-3">{nhan}</div><div className="mt-0.5 text-[20px] font-semibold tabular-nums">{so}</div>{phu && <div className="text-[12px] text-muc-3">{phu}</div>}</div>
    );
    noiDung = (
      <>
        {chonKy}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <The nhan="Hoa hồng trong kỳ" so={tienVN(Number(t.hoa_hong))} />
          <The nhan="Đặt hẹn" so={String(t.so_dat_hen)} phu={`${t.so_da_den} đã đến`} />
          <The nhan="Lượt quét / mở link" so={String(t.luot_quet)} />
          <The nhan="Chưa thanh toán" so={tienVN(Number(t.kha_dung))} phu={Number(t.dang_cho) > 0 ? `Đang chờ chi ${tienVN(Number(t.dang_cho))}` : undefined} />
        </div>
        <section className="mt-6 space-y-3">
          <h2 className="text-[16px] font-semibold">Link đặt hẹn &amp; mã QR của anh/chị</h2>
          <NutChiaSe link={link} />
          <LinkQrNguon link={link} tenHienThi={tenHienThi} maRef={ctv.ma_ref}
            ghiChu={<p className="mt-2 text-[13px] text-muc-3">Người mở link sẽ thấy người giới thiệu là <b className="text-muc">{tenHienThi}</b> (đổi ở mục Hồ sơ). Lịch hẹn đặt qua link tự gắn mã giới thiệu của anh/chị.</p>} />
        </section>
      </>
    );
  } else if (muc === "gioi-thieu") {
    const loc = LOC_GT.some((l) => l.ma === sp.loc) ? sp.loc! : "";
    const { data } = await db.rpc("ctv_da_gioi_thieu", { p_dt: ctv.id, p_tu: tu, p_den: den, p_loc: loc });
    noiDung = (
      <>
        {chonKy}
        <div className="mb-3 flex flex-wrap gap-2">
          {LOC_GT.map((l) => <Link key={l.ma} href={href({ loc: l.ma })} scroll={false}
            className={`rounded-nho border px-3 py-1.5 text-[13px] ${l.ma === loc ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{l.ten}</Link>)}
        </div>
        {(data ?? []).length === 0 ? <p className="rounded-the border border-dashed border-vien p-6 text-center text-[14px] text-muc-3">Chưa có người được giới thiệu trong kỳ này.</p> : (
          <ul className="space-y-2">
            {(data ?? []).map((r) => (
              <li key={r.khoa} className="flex items-start justify-between gap-3 rounded-the border border-vien bg-giay-sang p-3">
                <div className="min-w-0">
                  <div className="font-medium">{r.ten_che} <span className="text-[13px] font-normal tabular-nums text-muc-3">· {r.sdt_che}</span></div>
                  <div className="mt-0.5 text-[12.5px] text-muc-3">{r.tinh_trang === "hoa_don" ? "Hoá đơn" : "Ngày hẹn"} {ngayVN(r.ngay)}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <NhanTrangThai kieu={TINH_TRANG_GT[r.tinh_trang]?.kieu ?? "tram"}>{TINH_TRANG_GT[r.tinh_trang]?.ten ?? r.tinh_trang}</NhanTrangThai>
                    {r.co_hoa_don && r.tinh_trang !== "hoa_don" && <NhanTrangThai kieu="tot">Đã có hoá đơn</NhanTrangThai>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold tabular-nums">{Number(r.hoa_hong) ? tienVN(Number(r.hoa_hong)) : "—"}</div>
                  {r.tt_thanh_toan && <div className="mt-1"><NhanTrangThai kieu={TT_THANH_TOAN_HH[r.tt_thanh_toan]?.kieu}>{TT_THANH_TOAN_HH[r.tt_thanh_toan]?.ten}</NhanTrangThai></div>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[12.5px] text-muc-3">Tên và số điện thoại người được giới thiệu đã được che để bảo mật; dịch vụ không hiển thị. Trạng thái thanh toán: tiền đã chi được trừ dần cho các khoản phát sinh trước.</p>
      </>
    );
  } else if (muc === "doi-soat") {
    const [{ data: ds }, { data: sd }, { data: rut }, { data: kn }, { data: ch }] = await Promise.all([
      db.rpc("ctv_doi_soat", { p_dt: ctv.id, p_tu: tu, p_den: den }),
      db.rpc("so_du_hh_gt", { p_dt: ctv.id }),
      db.from("yeu_cau_rut_hh").select("id, ma, so_tien, hinh_thuc, trang_thai, tao_luc, chi_luc, ly_do_tu_choi").eq("doi_tac_id", ctv.id).order("tao_luc", { ascending: false }).limit(20),
      db.from("ctv_khieu_nai").select("id, ma, ky_tu, ky_den, ma_hd, noi_dung, trang_thai, phan_hoi, tao_luc").eq("doi_tac_id", ctv.id).order("tao_luc", { ascending: false }).limit(20),
      db.from("cau_hinh").select("gia_tri").eq("khoa", "ctv.toi_thieu_rut").maybeSingle(),
    ]);
    const s = sd?.[0] ?? { tong_hh: 0, da_chi: 0, dang_cho: 0, kha_dung: 0 };
    const toiThieu = Number(ch?.gia_tri ?? 0);
    const dangMo = (rut ?? []).some((r) => r.trang_thai === "cho_xu_ly" || r.trang_thai === "dang_duyet_chi");
    const tongHh = (ds ?? []).reduce((a, r) => a + Number(r.hoa_hong), 0), tongDs = (ds ?? []).reduce((a, r) => a + Number(r.doanh_so), 0);
    noiDung = (
      <>
        {chonKy}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] text-muc-2">Doanh số tính hoa hồng <b className="tabular-nums">{tienVN(tongDs)}</b> · hoa hồng <b className="tabular-nums">{tienVN(tongHh)}</b></p>
          <a href={`/ctv/xuat?tu=${tu}&den=${den}`} className="h-9 rounded-nho border border-vien-dam px-3 py-2 text-[13px] font-medium text-muc-2">Xuất Excel</a>
        </div>
        {(ds ?? []).length === 0 ? <p className="rounded-the border border-dashed border-vien p-6 text-center text-[14px] text-muc-3">Chưa có bút toán hoa hồng trong kỳ.</p> : (
          <ul className="space-y-2">
            {(ds ?? []).map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-the border border-vien bg-giay-sang p-3 text-[14px]">
                <div className="min-w-0">
                  <div className="font-medium">{r.ma_hd ?? "Hoá đơn"} <span className="font-normal text-muc-3">· {r.ten_che}</span></div>
                  <div className="text-[12.5px] text-muc-3">Ngày HĐ {ngayVN(r.ngay_hd)} · doanh số {tienVN(Number(r.doanh_so))} · {r.ty_le}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`font-semibold tabular-nums ${Number(r.hoa_hong) < 0 ? "text-loi" : ""}`}>{tienVN(Number(r.hoa_hong))}</div>
                  <NhanTrangThai kieu={LOAI_BT[r.loai]?.kieu ?? "tram"}>{LOAI_BT[r.loai]?.ten ?? r.loai}</NhanTrangThai>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-6 rounded-the border border-vien bg-giay-sang p-4">
          <h2 className="text-[16px] font-semibold">Yêu cầu thanh toán</h2>
          <p className="mt-1 text-[14px] text-muc-2">Tổng hoa hồng {tienVN(Number(s.tong_hh))} · đã chi {tienVN(Number(s.da_chi))} · đang chờ chi {tienVN(Number(s.dang_cho))} · <b>có thể rút {tienVN(Number(s.kha_dung))}</b></p>
          <div className="mt-3">
            {dangMo ? <p className="text-[14px] text-muc-2">Anh/chị đang có một yêu cầu chờ phòng khám xử lý.</p>
              : Number(s.kha_dung) <= 0 ? <p className="text-[14px] text-muc-3">Chưa có hoa hồng chưa thanh toán.</p>
              : Number(s.kha_dung) < toiThieu ? <p className="text-[14px] text-muc-3">Cần đạt tối thiểu {tienVN(toiThieu)} để gửi yêu cầu.</p>
              : <RutCtv khaDung={Number(s.kha_dung)} toiThieu={toiThieu} />}
          </div>
          {(rut ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-vien border-t border-vien text-[13.5px]">
              {(rut ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{r.ma} · {ngayVN(r.tao_luc.slice(0, 10))} · {HINH_THUC_RUT[r.hinh_thuc]}{r.ly_do_tu_choi && <span className="block text-[12.5px] text-loi">Lý do: {r.ly_do_tu_choi}</span>}</span>
                  <span className="text-right"><b className="tabular-nums">{tienVN(Number(r.so_tien))}</b> <NhanTrangThai kieu={TT_RUT[r.trang_thai]?.kieu}>{TT_RUT[r.trang_thai]?.ten}</NhanTrangThai></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-the border border-vien bg-giay-sang p-4">
          <details>
            <summary className="cursor-pointer text-[16px] font-semibold">Khiếu nại nội dung sai lệch</summary>
            <p className="mb-3 mt-1 text-[13px] text-muc-3">Kỳ {ngayVN(tu)} – {ngayVN(den)}. Phòng khám kiểm tra và phản hồi tại đây.</p>
            <KhieuNaiCtv tu={tu} den={den} />
          </details>
          {(kn ?? []).length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-vien pt-3 text-[13.5px]">
              {(kn ?? []).map((k) => (
                <li key={k.id}>
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">{k.ma} · kỳ {ngayVN(k.ky_tu)}–{ngayVN(k.ky_den)}</span><NhanTrangThai kieu={TT_KHIEU_NAI[k.trang_thai]?.kieu}>{TT_KHIEU_NAI[k.trang_thai]?.ten}</NhanTrangThai></div>
                  <div className="text-muc-2">{k.ma_hd ? `${k.ma_hd}: ` : ""}{k.noi_dung}</div>
                  {k.phan_hoi && <div className="mt-0.5 text-nhan-dam">Phòng khám: {k.phan_hoi}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  } else {
    noiDung = (
      <div className="space-y-4">
        <section className="rounded-the border border-vien bg-giay-sang p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[14px]">
            <dt className="text-muc-3">Họ tên</dt><dd>{ctv.ten}</dd>
            <dt className="text-muc-3">Mã giới thiệu</dt><dd className="tabular-nums">{ctv.ma_ref}</dd>
            <dt className="text-muc-3">Email</dt><dd>{cheEmail(ctv.email) || "—"}</dd>
            <dt className="text-muc-3">Mức hoa hồng</dt><dd>{nhanMucHoaHong(ctv.hh_kieu, ctv.hh_gia_tri)}</dd>
            <dt className="text-muc-3">Tham gia từ</dt><dd>{ngayGioVN(ctv.tao_luc)}</dd>
          </dl>
          <p className="mt-2 text-[12.5px] text-muc-3">Đổi họ tên, số điện thoại, email hoặc mức hoa hồng: vui lòng liên hệ phòng khám.</p>
        </section>
        <section className="rounded-the border border-vien bg-giay-sang p-4"><HoSoCtv tenHienThi={ctv.ten_hien_thi ?? ""} guiEmail={ctv.gui_email} coEmail={!!ctv.email} /></section>
        <section className="flex flex-wrap gap-3">
          <form action={dangXuatCtv}><button className="h-11 rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc-2">Đăng xuất</button></form>
          <form action={dangXuatMoiNoi}><button className="h-11 rounded-nho border border-loi/40 px-4 text-[14px] font-medium text-loi">Đăng xuất mọi thiết bị</button></form>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold">Chào {tenHienThi}</h1>
        <p className="text-[13.5px] text-muc-3">Mã giới thiệu <span className="tabular-nums">{ctv.ma_ref}</span></p>
      </div>
      <nav className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-vien px-4" aria-label="Mục cổng CTV">
        {MUC.map((m) => <Link key={m.ma} href={`/ctv?muc=${m.ma}`} aria-current={m.ma === muc ? "page" : undefined}
          className={`shrink-0 border-b-2 px-3 py-2 text-[14px] ${m.ma === muc ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-2"}`}>{m.ten}</Link>)}
      </nav>
      {noiDung}
    </div>
  );
}

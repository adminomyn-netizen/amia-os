import Link from "next/link";
import { tienVN } from "@/lib/dinh-dang";

export type SoLieu = {
  ngay: { ngay: string; doanhThu: number }[];            // 14 ngày gần nhất, cũ → mới
  homNay: string;
  thang: { doanhThu: number; thangTruoc: number; donHang: number; buoi: number; khachMoi: number; tongKhach: number; congNo: number; theSapHet: number };
  coCauThu: { tienMat: number; chuyenKhoan: number; quetThe: number };
  nguon: { ten: string; so: number }[];
  lich: { nhan: string; so: number }[];
  chamCong: { da: number; tong: number };
};

const MAU = ["xanh", "luc", "tim", "cam", "hong"] as const;
const mau = (i: number) => `var(--sac-${MAU[i % MAU.length]}-mau)`;
const phanTram = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

function Khung({ tieuDe, phai, children, cls = "" }: { tieuDe: string; phai?: React.ReactNode; children: React.ReactNode; cls?: string }) {
  return (
    <section className={`the-noi vao min-w-0 p-5 pt-6 ${cls}`} aria-label={tieuDe}>
      <div className="flex items-baseline justify-between gap-3 border-b border-vien pb-2.5"><h2 className="text-[15px] font-semibold text-muc">{tieuDe}</h2>{phai && <div className="text-[13px]">{phai}</div>}</div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

/** Vòng tròn tỉ lệ: mỗi phần một màu, ở giữa là số tổng. */
function Vong({ phan, giua, nhanGiua }: { phan: { gt: number; mau: string }[]; giua: string; nhanGiua: string }) {
  const tong = phan.reduce((s, p) => s + p.gt, 0), R = 46, C = 2 * Math.PI * R;
  let dau = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={`${nhanGiua}: ${giua}`}>
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--giay-tram)" strokeWidth="16" />
      {tong > 0 && phan.map((p, i) => {
        const d = (p.gt / tong) * C, el = <circle key={i} cx="60" cy="60" r={R} fill="none" stroke={p.mau} strokeWidth="16" strokeDasharray={`${d} ${C - d}`} strokeDashoffset={-dau} transform="rotate(-90 60 60)" />;
        dau += d; return el;
      })}
      <text x="60" y="58" textAnchor="middle" className="fill-[var(--muc)] text-[15px] font-semibold">{giua}</text>
      <text x="60" y="74" textAnchor="middle" className="fill-[var(--muc-3)] text-[8.5px]">{nhanGiua}</text>
    </svg>
  );
}

/** Các biểu đồ và số liệu cho lãnh đạo: nhiều màu, nhìn là thấy tình hình kinh doanh, khách, thẻ, công nợ, lịch, chấm công. */
export function BangSoLieu({ d, xemTien }: { d: SoLieu; xemTien: boolean }) {
  const { thang: t } = d;
  const max = Math.max(1, ...d.ngay.map((n) => n.doanhThu));
  const doi = t.thangTruoc > 0 ? Math.round(((t.doanhThu - t.thangTruoc) / t.thangTruoc) * 100) : null;
  const tongThu = d.coCauThu.tienMat + d.coCauThu.chuyenKhoan + d.coCauThu.quetThe;
  const cc = [
    { nhan: "Tiền mặt", gt: d.coCauThu.tienMat, mau: "var(--sac-luc-mau)" },
    { nhan: "Chuyển khoản", gt: d.coCauThu.chuyenKhoan, mau: "var(--sac-xanh-mau)" },
    { nhan: "Quẹt thẻ", gt: d.coCauThu.quetThe, mau: "var(--sac-tim-mau)" },
  ];
  const maxNguon = Math.max(1, ...d.nguon.map((n) => n.so));
  const tongLich = d.lich.reduce((s, x) => s + x.so, 0);
  const o = [
    ...(xemTien ? [
      { nhan: "Doanh thu tháng này", so: tienVN(t.doanhThu), phu: doi == null ? "chưa có tháng trước để so" : `${doi >= 0 ? "▲" : "▼"} ${Math.abs(doi)}% so với tháng trước`, mau: "luc" },
      { nhan: "Công nợ đang treo", so: tienVN(t.congNo), phu: "hoá đơn còn nợ", mau: "cam" },
    ] : []),
    { nhan: "Đơn tháng này", so: String(t.donHang), phu: "hoá đơn đã chốt", mau: "xanh" },
    { nhan: "Buổi liệu trình", so: String(t.buoi), phu: "đã thực hiện trong tháng", mau: "tim" },
    { nhan: "Khách mới tháng này", so: String(t.khachMoi), phu: `trên tổng ${t.tongKhach} khách`, mau: "hong" },
    { nhan: "Thẻ sắp hết buổi", so: String(t.theSapHet), phu: "nhắc khách mua tiếp", mau: "cam" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-[15px] font-semibold text-muc">Số liệu kinh doanh</h2>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {o.map((x) => (
          <div key={x.nhan} className="min-w-0 rounded-nho border border-vien bg-giay px-4 py-3.5" style={{ borderTop: `4px solid var(--sac-${x.mau}-mau)` }}>
            <dt className="text-[12.5px] text-muc-3">{x.nhan}</dt>
            <dd className={`mt-1.5 font-semibold leading-tight tabular-nums text-muc ${x.so.length > 11 ? "text-[17px]" : "text-[22px]"}`}>{x.so}</dd>
            <dd className="mt-1 text-[12px] text-muc-3">{x.phu}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        {xemTien && (
          <Khung cls="lg:col-span-2" tieuDe="Doanh thu 14 ngày gần nhất" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Xem báo cáo</Link>}>
            <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Biểu đồ cột doanh thu 14 ngày">
              {d.ngay.map((n, i) => (
                <div key={n.ngay} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${n.ngay.slice(8)}/${n.ngay.slice(5, 7)}: ${tienVN(n.doanhThu)}`}>
                  {n.doanhThu > 0 && <span className="hidden text-[10px] tabular-nums text-muc-3 xl:block">{n.doanhThu >= 1e6 ? `${(n.doanhThu / 1e6).toFixed(1)}tr` : `${Math.round(n.doanhThu / 1e3)}k`}</span>}
                  <div className="w-full rounded-t-[4px]" style={{ height: `${Math.max(3, (n.doanhThu / max) * 150)}px`, background: n.ngay === d.homNay ? "var(--sac-cam-mau)" : `linear-gradient(180deg, ${mau(i % 2 ? 0 : 1)}, var(--sac-luc-2))` }} />
                  <span className="text-[10.5px] text-muc-3">{n.ngay.slice(8)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muc-3">Cột vàng là hôm nay. Rê chuột vào cột để xem số tiền.</p>
          </Khung>
        )}
        {xemTien && (
          <Khung tieuDe="Cơ cấu thu tháng này">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Vong phan={cc} giua={tongThu >= 1e6 ? `${(tongThu / 1e6).toFixed(1)}tr` : String(tongThu)} nhanGiua="tổng thu" />
              <ul className="min-w-0 space-y-2 text-[13px]">{cc.map((c) => <li key={c.nhan} className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.mau }} /><span className="text-muc-2">{c.nhan}</span><span className="ml-auto tabular-nums text-muc">{phanTram(c.gt, tongThu)}%</span></li>)}</ul>
            </div>
          </Khung>
        )}
        <Khung tieuDe="Nguồn khách mới tháng này" phai={<Link href="/khach-hang" className="font-medium text-nhan-dam hover:underline">Khách hàng</Link>}>
          {d.nguon.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có khách mới tháng này.</p> : (
            <ul className="space-y-3">{d.nguon.map((n, i) => (
              <li key={n.ten}><div className="flex justify-between text-[13px]"><span className="truncate text-muc-2">{n.ten}</span><span className="tabular-nums text-muc">{n.so}</span></div>
                <div className="mt-1 h-2.5 rounded-sm bg-giay-tram"><div className="h-full rounded-sm" style={{ width: `${(n.so / maxNguon) * 100}%`, background: mau(i) }} /></div></li>
            ))}</ul>
          )}
        </Khung>
        <Khung tieuDe="Lịch hẹn hôm nay" phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
          {tongLich === 0 ? <p className="text-[14px] text-muc-3">Hôm nay chưa có lịch hẹn.</p> : (
            <>
              <div className="flex h-5 overflow-hidden rounded-sm bg-giay-tram" role="img" aria-label="Lịch hẹn hôm nay theo trạng thái">{d.lich.filter((x) => x.so > 0).map((x, i) => <div key={x.nhan} style={{ width: `${(x.so / tongLich) * 100}%`, background: mau(i) }} title={`${x.nhan}: ${x.so}`} />)}</div>
              <ul className="mt-3 space-y-1.5 text-[13px]">{d.lich.filter((x) => x.so > 0).map((x, i) => <li key={x.nhan} className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: mau(i) }} /><span className="text-muc-2">{x.nhan}</span><span className="ml-auto tabular-nums text-muc">{x.so}</span></li>)}</ul>
            </>
          )}
        </Khung>
        <Khung tieuDe="Chấm công hôm nay" phai={<Link href="/nhan-su/cham-cong" className="font-medium text-nhan-dam hover:underline">Bảng công</Link>}>
          <div className="flex items-center gap-5">
            <Vong phan={[{ gt: d.chamCong.da, mau: "var(--sac-luc-mau)" }, { gt: Math.max(0, d.chamCong.tong - d.chamCong.da), mau: "var(--sac-hong-mau)" }]} giua={`${phanTram(d.chamCong.da, d.chamCong.tong)}%`} nhanGiua="đã chấm công" />
            <ul className="space-y-2 text-[13px]"><li className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: "var(--sac-luc-mau)" }} />Đã chấm {d.chamCong.da}</li><li className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: "var(--sac-hong-mau)" }} />Chưa chấm {Math.max(0, d.chamCong.tong - d.chamCong.da)}</li><li className="text-muc-3">Tổng {d.chamCong.tong} người đang làm</li></ul>
          </div>
        </Khung>
      </div>
    </div>
  );
}

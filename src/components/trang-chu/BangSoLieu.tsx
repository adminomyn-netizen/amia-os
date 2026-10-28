import Link from "next/link";
import { tienVN } from "@/lib/dinh-dang";
import { NoiChiTiet } from "@/components/ui/NoiChiTiet";
import { BieuDoNhanh, type DiemNgay } from "./BieuDoNhanh";

export type SoLieu = {
  ngay: { ngay: string; doanhThu: number; soDon: number; thucThu: number }[];            // 14 ngày gần nhất, cũ → mới
  homNay: string;
  ngay30: DiemNgay[];                                     // 30 ngày gần nhất, cũ → mới
  lichDs: { gio: string; ten: string; tt: string }[];
  thang: { doanhThu: number; thangTruoc: number; donHang: number; buoi: number; khachMoi: number; tongKhach: number; congNo: number; theSapHet: number };
  coCauThu: { tienMat: number; chuyenKhoan: number; quetThe: number };
  nguon: { ten: string; so: number }[];
  lich: { nhan: string; so: number }[];
  chamCong: { da: number; tong: number };
  topDichVu: { ten: string; so: number; tien: number }[];
  topSanPham: { ten: string; so: number; tien: number }[];
  topKhach: { ten: string; chi: number }[];
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
          <NoiChiTiet key={x.nhan} cls="min-w-0" vi="duoi" tieuDe={x.nhan} dong={[{ nhan: "Giá trị", gt: x.so }, { nhan: "Ghi chú", gt: x.phu }]}>
          <div className="h-full min-w-0 rounded-nho border border-vien bg-giay px-4 py-3.5" style={{ borderTop: `4px solid var(--sac-${x.mau}-mau)` }}>
            <dt className="text-[12.5px] text-muc-3">{x.nhan}</dt>
            <dd className={`mt-1.5 font-semibold leading-tight tabular-nums text-muc ${x.so.length > 11 ? "text-[17px]" : "text-[22px]"}`}>{x.so}</dd>
            <dd className="mt-1 text-[12px] text-muc-3">{x.phu}</dd>
          </div>
          </NoiChiTiet>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        {xemTien && (
          <Khung cls="lg:col-span-2" tieuDe="Doanh thu nhanh" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Xem báo cáo</Link>}>
            <BieuDoNhanh du={d.ngay30} />
          </Khung>
        )}
        {xemTien && (
          <Khung tieuDe="Cơ cấu thu tháng này">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Vong phan={cc} giua={tongThu >= 1e6 ? `${(tongThu / 1e6).toFixed(1)}tr` : String(tongThu)} nhanGiua="tổng thu" />
              <ul className="min-w-0 space-y-2 text-[13px]">{cc.map((c) => <li key={c.nhan}><NoiChiTiet tieuDe={c.nhan} dong={[{ nhan: "Số tiền", gt: tienVN(c.gt) }, { nhan: "Tỉ trọng", gt: `${phanTram(c.gt, tongThu)}%` }]}><div className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.mau }} /><span className="text-muc-2">{c.nhan}</span><span className="ml-auto pl-3 tabular-nums text-muc">{phanTram(c.gt, tongThu)}%</span></div></NoiChiTiet></li>)}</ul>
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
              <ul className="mt-3 divide-y divide-vien border-y border-vien">{d.lichDs.map((l, i) => <li key={i} className="flex items-center justify-between gap-3 py-2 text-[13.5px]"><span className="min-w-0 truncate"><span className="mr-2 tabular-nums text-muc-3">{l.gio}</span>{l.ten}</span><span className="shrink-0 rounded-nho bg-giay-tram px-2 py-0.5 text-[11.5px] text-muc-2">{l.tt}</span></li>)}</ul>
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
      <BangXepHang d={d} xemTien={xemTien} />
    </div>
  );
}

const HUY_HIEU = ["var(--sac-cam-mau)", "var(--sac-xanh-mau)", "var(--sac-luc-mau)"];

/** Một bảng xếp hạng: số thứ tự có màu (top 3 là huy hiệu), thanh tỉ lệ so với người đứng đầu, rê chuột ra chi tiết. */
function XepHang({ tieuDe, href, nhanHref, dong, trong }: { tieuDe: string; href: string; nhanHref: string; dong: { ten: string; gt: number; chu: string; chiTiet: { nhan: string; gt: string }[] }[]; trong: string }) {
  const max = Math.max(1, ...dong.map((x) => x.gt));
  return (
    <Khung tieuDe={tieuDe} phai={<Link href={href} className="font-medium text-nhan-dam hover:underline">{nhanHref}</Link>}>
      {dong.length === 0 ? <p className="text-[14px] text-muc-3">{trong}</p> : (
        <ol className="space-y-2.5">
          {dong.map((x, i) => (
            <li key={x.ten + i}>
              <NoiChiTiet tieuDe={`#${i + 1} ${x.ten}`} dong={x.chiTiet}>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-nho text-[12.5px] font-semibold text-white" style={{ background: i < 3 ? HUY_HIEU[i] : "var(--muc-3)" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3 text-[13.5px]"><span className="truncate text-muc">{x.ten}</span><span className="shrink-0 tabular-nums text-muc-2">{x.chu}</span></div>
                    <div className="mt-1 h-1.5 rounded-sm bg-giay-tram"><div className="h-full rounded-sm" style={{ width: `${(x.gt / max) * 100}%`, background: i < 3 ? HUY_HIEU[i] : "var(--muc-3)" }} /></div>
                  </div>
                </div>
              </NoiChiTiet>
            </li>
          ))}
        </ol>
      )}
    </Khung>
  );
}

/** Xếp hạng trong tháng: dịch vụ, sản phẩm, khách chi nhiều. Số tiền chỉ hiện cho người xem được số tiền. */
function BangXepHang({ d, xemTien }: { d: SoLieu; xemTien: boolean }) {
  return (
    <div className="space-y-5">
      <h2 className="text-[15px] font-semibold text-muc">Xếp hạng tháng này</h2>
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <XepHang tieuDe="Top dịch vụ" href="/bao-cao" nhanHref="Báo cáo" trong="Chưa có dịch vụ nào được bán tháng này."
          dong={d.topDichVu.map((x) => ({ ten: x.ten, gt: xemTien ? x.tien : x.so, chu: xemTien ? tienVN(x.tien) : `${x.so} lượt`, chiTiet: [{ nhan: "Số lượt", gt: String(x.so) }, ...(xemTien ? [{ nhan: "Doanh thu", gt: tienVN(x.tien) }] : [])] }))} />
        <XepHang tieuDe="Top sản phẩm" href="/kho" nhanHref="Kho" trong="Chưa bán sản phẩm nào tháng này."
          dong={d.topSanPham.map((x) => ({ ten: x.ten, gt: xemTien ? x.tien : x.so, chu: xemTien ? tienVN(x.tien) : `${x.so} cái`, chiTiet: [{ nhan: "Số lượng", gt: String(x.so) }, ...(xemTien ? [{ nhan: "Doanh thu", gt: tienVN(x.tien) }] : [])] }))} />
        {xemTien && (
          <XepHang tieuDe="Top khách chi nhiều (12 tháng)" href="/khach-hang" nhanHref="Khách hàng" trong="Chưa có khách nào phát sinh chi tiêu."
            dong={d.topKhach.map((x) => ({ ten: x.ten, gt: x.chi, chu: tienVN(x.chi), chiTiet: [{ nhan: "Chi 12 tháng", gt: tienVN(x.chi) }] }))} />
        )}
      </div>
    </div>
  );
}

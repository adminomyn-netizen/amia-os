import { gioVN } from "@/lib/dinh-dang";
import { BANG, type doHieuSuatApp } from "@/lib/do-hieu-suat";

const SO = new Intl.NumberFormat("vi-VN");

/** Mức độ trễ: dưới 250 ms tốt, dưới 700 ms tạm được, còn lại chậm. */
const MUC = (ms: number) => (ms < 250 ? { nhan: "Tốt", mau: "luc" } : ms < 700 ? { nhan: "Tạm được", mau: "cam" } : { nhan: "Chậm", mau: "hong" });

/** Khối "Hiệu suất toàn ứng dụng" của Kỹ thuật; số đo lấy từ doHieuSuatApp tại thời điểm mở trang. */
export function BangHieuSuatApp({ d }: { d: Awaited<ReturnType<typeof doHieuSuatApp>> }) {
  const { nhe, nang, dung, dem, dn24, dn7, tongTk, thietBi, nhacCuoi, ngay7, max7, maxB } = d;
  const a = MUC(nhe), b = MUC(nang), c = MUC(dung);
  const o = [
    { nhan: "Phản hồi cơ sở dữ liệu", so: `${Math.round(nhe)} ms`, phu: `truy vấn nhẹ · ${a.nhan}`, mau: a.mau },
    { nhan: "Truy vấn báo cáo", so: `${Math.round(nang)} ms`, phu: `doanh thu theo ngày · ${b.nhan}`, mau: b.mau },
    { nhan: "Dựng trang này", so: `${dung} ms`, phu: `phía máy chủ · ${c.nhan}`, mau: c.mau },
    { nhan: "Người dùng 24 giờ", so: String(dn24), phu: `${dn7} người trong 7 ngày / ${tongTk} tài khoản`, mau: "xanh" },
    { nhan: "Thiết bị nhận thông báo", so: String(thietBi), phu: nhacCuoi ? `nhắc gần nhất ${gioVN(nhacCuoi)}` : "chưa có nhắc nào được gửi", mau: "tim" },
  ];
  return (
    <div className="space-y-5">
      <h2 className="text-[15px] font-semibold text-muc">Hiệu suất toàn ứng dụng</h2>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {o.map((x) => (
          <div key={x.nhan} className="min-w-0 rounded-nho border border-vien bg-giay px-4 py-3.5" style={{ borderTop: `4px solid var(--sac-${x.mau}-mau)` }}>
            <dt className="text-[12.5px] text-muc-3">{x.nhan}</dt>
            <dd className="mt-1.5 text-[22px] font-semibold leading-tight tabular-nums text-muc">{x.so}</dd>
            <dd className="mt-1 text-[12px] text-muc-3">{x.phu}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="the-noi vao min-w-0 p-5 pt-6" aria-label="Quy mô dữ liệu">
          <h3 className="border-b border-vien pb-2.5 text-[15px] font-semibold text-muc">Quy mô dữ liệu</h3>
          <ul className="space-y-3 pt-4">
            {BANG.map(([, ten, mau], i) => (
              <li key={ten}><div className="flex justify-between text-[13px]"><span className="text-muc-2">{ten}</span><span className="tabular-nums text-muc">{SO.format(dem[i])}</span></div>
                <div className="mt-1 h-2.5 rounded-sm bg-giay-tram"><div className="h-full rounded-sm" style={{ width: `${Math.max(1.5, (dem[i] / maxB) * 100)}%`, background: `var(--sac-${mau}-mau)` }} /></div></li>
            ))}
          </ul>
        </section>
        <section className="the-noi vao min-w-0 p-5 pt-6" aria-label="Thao tác 7 ngày">
          <h3 className="border-b border-vien pb-2.5 text-[15px] font-semibold text-muc">Lượt truy cập hồ sơ 7 ngày</h3>
          <div className="flex h-44 items-end gap-2 pt-4" role="img" aria-label="Cột lượt truy cập theo ngày">
            {ngay7.map((x, i) => (
              <div key={x.d} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${x.d.slice(8)}/${x.d.slice(5, 7)}: ${x.so}`}>
                <span className="text-[11px] tabular-nums text-muc-3">{x.so}</span>
                <div className="w-full rounded-t-[4px]" style={{ height: `${Math.max(3, (x.so / max7) * 120)}px`, background: `var(--sac-${["xanh", "luc", "tim"][i % 3]}-mau)` }} />
                <span className="text-[10.5px] text-muc-3">{x.d.slice(8)}/{x.d.slice(5, 7)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

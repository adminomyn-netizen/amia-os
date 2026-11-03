import { nhanHinhThuc, soHienThi, TEN_MAU_SO, type NguoiBan, type NoiDungGtgt } from "@/lib/hoa-don-gtgt";

const tien = (n: number) => Math.round(n).toLocaleString("vi-VN");
const soLe = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const ngayChu = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `Ngày ${d} tháng ${m} năm ${y}`; };

/** Mẫu hoá đơn GTGT theo bố cục chuẩn (người bán · tiêu đề · ký hiệu/số · người mua · bảng hàng · tổng · bằng chữ · chữ ký). Dùng chung cho màn lập và trang in. */
export function MauHoaDonGtgt({ mauSo, kyHieu, so, ngayLap, ban, nd, trangThai }: {
  mauSo: string; kyHieu: string; so: number | null; ngayLap: string; ban: NguoiBan; nd: NoiDungGtgt; trangThai: "nhap" | "da_xuat" | "da_huy";
}) {
  const m = nd.nguoi_mua;
  const o = (v: string | null | undefined) => (v && v.trim() ? v : <span className="text-muc-3">…………………………</span>);
  return (
    <article className="relative mx-auto max-w-[820px] border border-vien-dam bg-white px-6 py-6 text-[13px] leading-relaxed text-muc sm:px-9 print:border-0 print:px-0">
      {trangThai !== "da_xuat" && (
        <p className="mb-3 border border-dashed border-vien-dam px-3 py-1.5 text-center text-[12.5px] font-medium text-loi">
          {trangThai === "nhap" ? "BẢN NHÁP — chưa cấp số, chưa có giá trị pháp lý" : "HOÁ ĐƠN ĐÃ HUỶ"}
        </p>
      )}
      <header className="grid gap-4 border-b border-vien pb-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-0.5">
          <p className="text-[14px] font-semibold uppercase">{o(ban.ten)}</p>
          <p>Mã số thuế: <span className="font-medium tabular-nums">{o(ban.mst)}</span></p>
          <p>Địa chỉ: {o(ban.dia_chi)}</p>
          {ban.dien_thoai && <p>Điện thoại: {ban.dien_thoai}</p>}
          {ban.email && <p>Email: {ban.email}</p>}
          {ban.so_tai_khoan && <p>Số tài khoản: {ban.so_tai_khoan}{ban.ngan_hang ? ` tại ${ban.ngan_hang}` : ""}</p>}
        </div>
        <dl className="space-y-0.5 sm:text-right">
          <div><dt className="inline text-muc-3">Mẫu số: </dt><dd className="inline font-medium">{mauSo}</dd></div>
          <div><dt className="inline text-muc-3">Ký hiệu: </dt><dd className="inline font-medium">{kyHieu ? `${mauSo}${kyHieu}` : "…"}</dd></div>
          <div><dt className="inline text-muc-3">Số: </dt><dd className="inline font-semibold tabular-nums text-loi">{so ? soHienThi(so) : "(chưa cấp)"}</dd></div>
        </dl>
      </header>
      <div className="py-4 text-center">
        <h2 className="text-[19px] font-bold uppercase tracking-wide">{TEN_MAU_SO[mauSo] ?? "Hoá đơn"}</h2>
        <p className="italic text-muc-2">{ngayChu(ngayLap)}</p>
      </div>
      <section className="space-y-0.5 border-b border-vien pb-3">
        <p>Họ tên người mua hàng: {m.loai === "khach_le" ? (m.ho_ten || "Người mua không lấy hoá đơn") : o(m.ho_ten)}</p>
        <p>Tên đơn vị: {m.loai === "doanh_nghiep" ? o(m.ten_don_vi) : ""}</p>
        <p>Mã số thuế: <span className="tabular-nums">{m.loai === "doanh_nghiep" ? o(m.mst) : ""}</span>{m.loai === "ca_nhan" && m.cccd ? <span> · Số CCCD: {m.cccd}</span> : null}</p>
        <p>Địa chỉ: {m.dia_chi}</p>
        <p>Hình thức thanh toán: {nhanHinhThuc(nd.hinh_thuc_tt)}{m.email ? <span> · Email nhận hoá đơn: {m.email}</span> : null}</p>
      </section>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-y border-vien-dam text-center font-medium">
              <th className="px-1.5 py-1.5">STT</th><th className="px-1.5 py-1.5 text-left">Tên hàng hoá, dịch vụ</th><th className="px-1.5 py-1.5">Đơn vị tính</th><th className="px-1.5 py-1.5">Số lượng</th>
              <th className="px-1.5 py-1.5">Đơn giá</th><th className="px-1.5 py-1.5">Chiết khấu</th><th className="px-1.5 py-1.5">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {nd.dong.map((d) => (
              <tr key={d.stt} className="border-b border-vien align-top">
                <td className="px-1.5 py-1 text-center tabular-nums">{d.stt}</td>
                <td className="px-1.5 py-1">{d.ten}</td>
                <td className="px-1.5 py-1 text-center">{d.tinh_chat === 1 ? d.dvt : ""}</td>
                <td className="px-1.5 py-1 text-right tabular-nums">{d.tinh_chat === 1 ? soLe(d.sl) : ""}</td>
                <td className="px-1.5 py-1 text-right tabular-nums">{d.tinh_chat === 1 ? soLe(d.don_gia) : ""}</td>
                <td className="px-1.5 py-1 text-right tabular-nums">{d.tinh_chat === 1 && d.ck ? soLe(d.ck) : ""}</td>
                <td className="px-1.5 py-1 text-right tabular-nums">{d.tinh_chat === 3 ? `(${tien(d.thanh_tien)})` : tien(d.thanh_tien)}</td>
              </tr>
            ))}
            {nd.dong.length === 0 && <tr><td colSpan={7} className="px-1.5 py-3 text-center text-muc-3">Không có dòng hàng có tiền.</td></tr>}
          </tbody>
        </table>
      </div>
      <dl className="mt-3 space-y-1">
        <div className="flex justify-between gap-4"><dt>Cộng tiền hàng (trước thuế):</dt><dd className="tabular-nums">{tien(nd.tong.truoc_thue)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Thuế suất GTGT: {nd.thue_suat}</dt><dd className="tabular-nums">Tiền thuế GTGT: {tien(nd.tong.tien_thue)}</dd></div>
        <div className="flex justify-between gap-4 font-semibold"><dt>Tổng tiền thanh toán:</dt><dd className="tabular-nums">{tien(nd.tong.thanh_toan)}</dd></div>
        <div><dt className="inline">Số tiền viết bằng chữ: </dt><dd className="inline italic">{nd.tong.bang_chu}</dd></div>
        {nd.ghi_chu && <div><dt className="inline">Ghi chú: </dt><dd className="inline">{nd.ghi_chu}</dd></div>}
      </dl>
      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div><p className="font-semibold">Người mua hàng</p><p className="text-[12px] text-muc-3">(Ký, ghi rõ họ tên)</p></div>
        <div><p className="font-semibold">Người bán hàng</p><p className="text-[12px] text-muc-3">(Ký điện tử, ghi rõ họ tên)</p>
          {trangThai === "da_xuat" && <p className="mt-6 text-[12px] text-muc-3">Chưa ký số — lập từ AMIA OS, chờ đẩy lên phần mềm hoá đơn điện tử để ký và lấy mã của cơ quan thuế.</p>}
        </div>
      </div>
    </article>
  );
}

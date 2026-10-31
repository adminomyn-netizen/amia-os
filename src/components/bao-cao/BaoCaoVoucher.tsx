import { sb } from "@/lib/db";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { layBaoCaoVoucher } from "@/lib/bao-cao-voucher";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const phanTram = (x: number) => `${(Math.round(x * 10) / 10).toLocaleString("vi-VN")}%`;

/** Hiệu quả voucher trong khoảng ngày lọc (theo ngày hoá đơn): lượt dùng, số khách, tiền giảm, doanh thu của đơn dùng voucher, tỉ lệ đã dùng so với số phát hành. Đơn huỷ (lượt đã hoàn) không tính. */
export async function BaoCaoVoucher({ loc }: { loc: { tu: string; den: string; cn?: string } }) {
  const ds = await layBaoCaoVoucher(sb(), loc.tu, loc.den, loc.cn);
  const t = ds.reduce((s, r) => ({ luot: s.luot + r.soLuot, giam: s.giam + r.tienGiam, hang: s.hang + r.tongHang, thu: s.thu + r.doanhThu }), { luot: 0, giam: 0, hang: 0, thu: 0 });
  return (
    <>
      <HangChiSo muc={[
        { nhan: "Lượt dùng voucher", so: soVN(t.luot), ghiChu: `${soVN(ds.filter((r) => r.soLuot > 0).length)} voucher có người dùng` },
        { nhan: "Tiền đã giảm", so: tienVN(t.giam) },
        { nhan: "Doanh thu đơn dùng voucher", so: tienVN(t.thu), ghiChu: "khách phải trả, sau giảm" },
        { nhan: "Giảm / tiền hàng", so: t.hang > 0 ? phanTram((t.giam / t.hang) * 100) : "—", ghiChu: "tiền giảm trên tổng tiền hàng" },
      ]} />
      <div className="mt-6">
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có voucher nào chạy hoặc được dùng trong khoảng này."
          cot={[
            { nhan: "Voucher", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}{r.biKhoa && <span className="ml-2"><NhanTrangThai kieu="cho">Đã khoá</NhanTrangThai></span>}</span> },
            { nhan: "Thời gian chạy", hienThi: (r) => `${ngayVN(r.tuNgay)} – ${ngayVN(r.denNgay)}` },
            { nhan: "Lượt dùng", phai: true, hienThi: (r) => soVN(r.soLuot) },
            { nhan: "Số khách", phai: true, hienThi: (r) => soVN(r.soKhach) },
            { nhan: "Tiền giảm", phai: true, hienThi: (r) => tienVN(r.tienGiam) },
            { nhan: "Doanh thu đơn", phai: true, hienThi: (r) => tienVN(r.doanhThu) },
            { nhan: "Giảm / tiền hàng", phai: true, hienThi: (r) => (r.tongHang > 0 ? phanTram(r.tiLeGiam) : "—") },
            { nhan: "Đã dùng / phát hành", phai: true, hienThi: (r) => `${soVN(r.daDungTatCa)}/${soVN(r.soLuong)} (${phanTram(r.tiLeDung)})` },
            { nhan: "Đơn huỷ", phai: true, hienThi: (r) => (r.soHoan ? soVN(r.soHoan) : "") },
          ]} />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Tính theo ngày hoá đơn. Đơn đã huỷ (lượt dùng được hoàn) không tính vào lượt, tiền giảm và doanh thu. Cột &quot;Đã dùng / phát hành&quot; tính từ trước tới nay, không phụ thuộc khoảng lọc. Voucher đang trong thời gian chạy mà chưa ai dùng vẫn hiện với số 0.</p>
    </>
  );
}

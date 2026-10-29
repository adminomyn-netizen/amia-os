import Link from "next/link";
import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { dongDoiChieu, layHoaHongGioiThieu, layHoaHongThucThu, NHAN_VAI_HH, VAI_HH, type DongNv } from "@/lib/bao-cao-hoa-hong";

/** Hai báo cáo hoa hồng: theo THỰC THU và GIỚI THIỆU (máy chủ tính, trang chỉ hiển thị). Quyền xem số tiền chặn ở trang. */
type Loc = { tu: string; den: string; cn?: string };

const GhiChu = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[12px] leading-relaxed text-muc-3">{children}</p>;
const TieuDeMuc = ({ children, id }: { children: React.ReactNode; id: string }) => <h2 id={id} className="mb-3 mt-8 text-[15px] font-medium text-muc">{children}</h2>;
const BaoChuaCai = ({ children }: { children: React.ReactNode }) => <p role="status" className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] leading-relaxed text-muc-2">{children}</p>;

export async function BaoCaoHoaHongThucThu({ loc, vai, gomThe, coChiNhanh }: { loc: Loc; vai?: string; gomThe: boolean; coChiNhanh: boolean }) {
  const d = await layHoaHongThucThu(sb(), { ...loc, vai, gomThe });
  const dc = dongDoiChieu(d.doiChieu, gomThe);
  const locVai = VAI_HH.some((v) => v === vai);
  const cotVai = VAI_HH.filter((v) => !locVai || v === vai).map((v) => ({ nhan: `${NHAN_VAI_HH[v]} (hoa hồng)`, hienThi: (r: DongNv) => (r.theoVai[v] ? tienVN(r.theoVai[v]!.hoaHong) : ""), phai: true }));
  return (
    <>
      {d.chuaCaiTiLe && <BaoChuaCai>Chưa cài tỉ lệ hoa hồng nào nên mọi số hoa hồng đang bằng 0; doanh số thực thu vẫn đúng. Cài tỉ lệ ở mục <Link href="/hoa-hong?tab=ti-le" className="text-nhan-dam hover:underline">Hoa hồng, Tỉ lệ hoa hồng</Link>.</BaoChuaCai>}
      <HangChiSo muc={[{ nhan: "Hoa hồng theo thực thu", so: tienVN(d.tong.hoaHong), ghiChu: `${soVN(d.nhanVien.length)} người` }, { nhan: "Doanh số thực thu (cộng các vai)", so: tienVN(d.tong.doanhSo), ghiChu: `trong đó thu nợ cũ ${tienVN(d.tong.doanhSoNoCu)}` },
        { nhan: "Theo hoá đơn lập trong kỳ", so: tienVN(d.doiChieu.theoHoaDon), ghiChu: "để đối chiếu, bên dưới" }, { nhan: "Hoá đơn kỳ này chưa thu", so: tienVN(d.doiChieu.conNoCuoiKy), ghiChu: "hoa hồng chưa được tính" }]} />
      <div className="mt-6">
        <Bang duLieu={d.nhanVien} khoa={(r) => r.id} trong="Không có khoản thu nào có gán người hưởng trong khoảng này."
          cot={[{ nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> }, ...cotVai,
            { nhan: "Doanh số thực thu", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Trong đó thu nợ cũ", hienThi: (r) => (r.doanhSoNoCu ? tienVN(r.doanhSoNoCu) : ""), phai: true },
            { nhan: "Hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true }]} />
      </div>
      <TieuDeMuc id="hh-theo-vai">Theo vai</TieuDeMuc>
      <Bang duLieu={d.theoVai} khoa={(r) => r.vai} cot={[{ nhan: "Vai", chinh: true, hienThi: (r) => NHAN_VAI_HH[r.vai] }, { nhan: "Doanh số thực thu", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => tienVN(r.hoaHong), phai: true }]} />
      {coChiNhanh && (<><TieuDeMuc id="hh-chi-nhanh">Theo chi nhánh</TieuDeMuc><Bang duLieu={d.chiNhanh} khoa={(r) => r.id} cot={[{ nhan: "Chi nhánh", chinh: true, hienThi: (r) => r.ten }, { nhan: "Doanh số thực thu", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => tienVN(r.hoaHong), phai: true }]} /></>)}
      <details className="mt-8 rounded-nho border border-vien px-4 py-3" open>
        <summary className="cursor-pointer text-[13px] font-medium text-muc-2">Đối chiếu với hoa hồng theo hoá đơn (cùng khoảng ngày, cả ba vai)</summary>
        <div className="mt-3">
          <Bang duLieu={[...dc.rows, { nhan: "Hoa hồng theo thực thu", so: dc.ket, ghiChu: locVai ? "chưa lọc vai: số này là cả ba vai" : "" }]} khoa={(r) => r.nhan}
            cot={[{ nhan: "Khoản", chinh: true, hienThi: (r) => r.nhan }, { nhan: "Số tiền", hienThi: (r) => tienVN(r.so), phai: true }, { nhan: "Giải thích", hienThi: (r) => r.ghiChu }]} />
          {locVai && <GhiChu>Bảng đối chiếu luôn tính đủ ba vai, không theo ô lọc vai.</GhiChu>}
        </div>
      </details>
      <GhiChu>Định nghĩa: hoa hồng chỉ tính trên phần tiền khách ĐÃ TRẢ THẬT, theo NGÀY THU của từng khoản (không theo ngày hoá đơn). Mỗi khoản thu lấy phần (số tiền ÷ tổng phải thu của hoá đơn) nhân doanh số từng dòng, tỉ lệ chia người và tỉ lệ hoa hồng; khoản hoàn tiền trừ đi. Hoá đơn trả đủ trong kỳ thì ra đúng số theo hoá đơn; còn nợ thì chỉ tính phần đã thu, phần thu sau (thu nợ) tính vào kỳ có ngày thu. “Tiền thật” gồm tiền mặt, chuyển khoản, quẹt thẻ; phần trừ thẻ tiền khách nạp trước tách riêng và chỉ cộng khi chọn “Gồm cả phần trừ thẻ tiền” (hoa hồng của tiền nạp thẻ đã tính lúc bán thẻ). Doanh số được cộng theo từng vai: một dòng hàng có thể được tính cho cả người phục vụ, tư vấn và bán nên tổng doanh số lớn hơn số tiền thực thu. Chưa có phí thực hiện theo buổi cho Chuyên viên trị liệu. Tự thiết kế, chưa đối chiếu SalonHero.</GhiChu>
    </>
  );
}

export async function BaoCaoHoaHongGioiThieu({ loc, xemSdt }: { loc: Loc; xemSdt: boolean }) {
  const d = await layHoaHongGioiThieu(sb(), { ...loc, xemSdt });
  return (
    <>
      <HangChiSo muc={[{ nhan: "Hoa hồng giới thiệu", so: tienVN(d.tongKhach.hoaHong + d.tongSh.hoaHong), ghiChu: `${soVN(d.khach.length + d.sh.length)} người giới thiệu` }, { nhan: "Khách giới thiệu (trên hoá đơn)", so: tienVN(d.tongKhach.hoaHong), ghiChu: `${soVN(d.tongKhach.soHd)} hoá đơn · doanh số ${tienVN(d.tongKhach.doanhSo)}` },
        { nhan: "Số SalonHero đã tính", so: tienVN(d.tongSh.hoaHong), ghiChu: `${soVN(d.tongSh.soHd)} hoá đơn cũ` }]} />
      {d.chuaCaiTiLeGt && d.khach.length > 0 && <div className="mt-4"><BaoChuaCai>Chưa cài tỉ lệ hoa hồng giới thiệu nên phần khách giới thiệu đang bằng 0. Cài ở <Link href="/hoa-hong?tab=ti-le" className="text-nhan-dam hover:underline">Hoa hồng, Tỉ lệ hoa hồng</Link> (vai Giới thiệu).</BaoChuaCai></div>}
      <TieuDeMuc id="gt-khach">Khách giới thiệu ghi trên hoá đơn</TieuDeMuc>
      <Bang duLieu={d.khach} khoa={(r) => r.khoa} trong="Chưa có hoá đơn nào ghi người giới thiệu trong khoảng này."
        cot={[{ nhan: "Người giới thiệu", chinh: true, hienThi: (r) => <Link href={`/khach-hang/${r.khoa}`} className="text-muc hover:underline">{r.ten}</Link> }, { nhan: "Mã khách", hienThi: (r) => r.ma }, { nhan: "Điện thoại", hienThi: (r) => r.dt },
          { nhan: "Hoá đơn", hienThi: (r) => soVN(r.soHd), phai: true }, { nhan: "Doanh số", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true }]} />
      <TieuDeMuc id="gt-sh">Số SalonHero đã tính (hoá đơn chuyển sang)</TieuDeMuc>
      <Bang duLieu={d.sh} khoa={(r) => r.khoa} trong="Không có hoa hồng giới thiệu cũ trong khoảng này."
        cot={[{ nhan: "Người giới thiệu", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Mã nhân viên", hienThi: (r) => r.ma },
          { nhan: "Hoá đơn", hienThi: (r) => soVN(r.soHd), phai: true }, { nhan: "Doanh số dòng", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng SalonHero", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true }]} />
      <GhiChu>Định nghĩa: tính theo ngày hoá đơn. Phần “khách giới thiệu” = doanh số các dòng của hoá đơn có ghi người giới thiệu × tỉ lệ hoa hồng vai Giới thiệu đang cài (chưa cài thì 0); không tự tính cho khách chỉ có liên kết “được ai giới thiệu” ở hồ sơ. Phần SalonHero giữ đúng số tiền SalonHero đã tính cho từng dòng, không tính lại. Dòng ghi “chưa ghép” là mã người giới thiệu của SalonHero chưa nối được với nhân viên hay khách trong app. Tự thiết kế, chưa đối chiếu SalonHero.</GhiChu>
    </>
  );
}

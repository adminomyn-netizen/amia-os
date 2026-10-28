import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { layDatLich, layDungDichVu, layThuNgan, SH_MAU, tenKy, tenNguon, tiLe, TRANG_THAI_LICH, type NhomKy } from "@/lib/bao-cao-du-lieu";

/** Ba báo cáo kiểu SalonHero: theo thu ngân, thống kê đặt lịch, thống kê dùng dịch vụ (máy chủ tính, trang chỉ hiển thị). */
type Loc = { tu: string; den: string; cn?: string; nhom: NhomKy; doiTuNgay: boolean };

const GhiChu = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[12px] leading-relaxed text-muc-3">{children}</p>;
const TieuDeMuc = ({ children, id }: { children: React.ReactNode; id: string }) => <h2 id={id} className="mb-3 mt-8 text-[15px] font-medium text-muc">{children}</h2>;
const BaoDoiNhom = ({ loc }: { loc: Loc }) => (loc.doiTuNgay ? <p role="status" className="mb-3 text-[12px] text-muc-3">Khoảng dài hơn 93 ngày nên số liệu được gom theo tháng.</p> : null);

/** Bảng đối chiếu nhỏ: số SalonHero (đọc trực tiếp) và số app cho cùng một kỳ mẫu. */
function DoiChieu({ dong, ghiChu }: { dong: { nhan: string; sh: string; app: string; khop: boolean }[]; ghiChu: string }) {
  return (
    <details className="mt-8 rounded-nho border border-vien px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-medium text-muc-2">Đối chiếu với SalonHero ({SH_MAU.ky.nhan})</summary>
      <div className="mt-3">
        <Bang duLieu={dong} khoa={(r) => r.nhan}
          cot={[{ nhan: "Chỉ số", hienThi: (r) => r.nhan, chinh: true }, { nhan: "SalonHero", hienThi: (r) => r.sh, phai: true }, { nhan: "App", hienThi: (r) => r.app, phai: true },
            { nhan: "Khớp", hienThi: (r) => (r.khop ? <span className="text-muc">Khớp</span> : <span className="text-canh-bao">Lệch</span>) }]} />
        <GhiChu>{ghiChu}</GhiChu>
      </div>
    </details>
  );
}

export async function BaoCaoThuNgan({ loc }: { loc: Loc }) {
  const db = sb();
  const [ds, mau] = await Promise.all([layThuNgan(db, loc.tu, loc.den, loc.cn, loc.nhom), layThuNgan(db, SH_MAU.ky.tu, SH_MAU.ky.den, undefined, "tong")]);
  const cong = (k: "so_don" | "doanh_so" | "tru_the_tien" | "doanh_thu" | "con_no" | "da_thu") => ds.reduce((s, r) => s + r[k], 0);
  const dongDc = SH_MAU.thuNgan.map((s) => {
    const a = mau.find((m) => m.thu_ngan === s.ten || m.cac_ten.split(", ").includes(s.ten));
    const app = a ? `${soVN(a.so_don)} đơn · ${tienVN(a.doanh_thu)}` : "—";
    return { nhan: s.ten, sh: `${soVN(s.so_don)} đơn · ${tienVN(s.doanh_thu)}`, app, khop: !!a && a.so_don === s.so_don && a.doanh_thu === s.doanh_thu };
  });
  return (
    <>
      <BaoDoiNhom loc={loc} />
      <HangChiSo muc={[{ nhan: "Doanh số", so: tienVN(cong("doanh_so")), ghiChu: `${soVN(cong("so_don"))} đơn` }, { nhan: "Trừ thẻ tiền", so: tienVN(cong("tru_the_tien")) },
        { nhan: "Doanh thu sau trừ thẻ", so: tienVN(cong("doanh_thu")), ghiChu: "khớp cột “Doanh thu” SalonHero" }, { nhan: "Còn nợ", so: tienVN(cong("con_no")), ghiChu: `đã thu ${tienVN(cong("da_thu"))}` }]} />
      <div className="mt-6">
        <Bang duLieu={ds} khoa={(r) => `${r.ky}-${r.khoa}`} trong="Không có hoá đơn trong khoảng này."
          cot={[
            ...(loc.nhom === "tong" ? [] : [{ nhan: loc.nhom === "thang" ? "Tháng" : "Ngày", hienThi: (r: (typeof ds)[number]) => tenKy(r.ky, loc.nhom) }]),
            { nhan: "Thu ngân", chinh: true, hienThi: (r) => <span className="text-muc">{r.thu_ngan}{r.cac_ten !== r.thu_ngan && <span className="block text-[11px] text-muc-3">Tài khoản này còn mang tên: {r.cac_ten.split(", ").filter((t) => t !== r.thu_ngan).join(", ")}</span>}</span> },
            { nhan: "Số đơn", hienThi: (r) => soVN(r.so_don), phai: true }, { nhan: "Doanh số", hienThi: (r) => tienVN(r.doanh_so), phai: true }, { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.tru_the_tien), phai: true },
            { nhan: "Doanh thu sau trừ thẻ", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.doanh_thu)}</span>, phai: true }, { nhan: "Còn nợ", hienThi: (r) => tienVN(r.con_no), phai: true }, { nhan: "Đã thu", hienThi: (r) => tienVN(r.da_thu), phai: true },
          ]} />
      </div>
      <GhiChu>Thu ngân = người hoàn tất hoá đơn (hoá đơn chuyển từ SalonHero) hoặc người lập (hoá đơn làm trong app). Doanh số = tiền hàng − giảm giá cả đơn; Doanh thu sau trừ thẻ = doanh số − phần trả bằng thẻ tiền; Đã thu = doanh thu sau trừ thẻ − còn nợ. Không tính hoá đơn huỷ và công nợ đầu kỳ.</GhiChu>
      <DoiChieu dong={dongDc} ghiChu="SalonHero tính theo người hoàn tất đơn, cột “Doanh thu” = doanh thu sau trừ thẻ. Lệch duy nhất: SalonHero cộng cả VAT (đơn 25100220 có VAT 1.299.000), app tính doanh số trước VAT như báo cáo doanh thu." />
    </>
  );
}

type DongLich = { khoa: string; nhan: string; so_lich: number; hoan_thanh: number; huy: number; khong_den: number; chua_den: number };
const cotLich = <T extends DongLich = DongLich>(dau: { nhan: string; hienThi: (r: T) => React.ReactNode }) => [
  { ...dau, chinh: true }, { nhan: "Số lịch", hienThi: (r: T) => soVN(r.so_lich), phai: true }, { nhan: "Khách đến", hienThi: (r: T) => soVN(r.hoan_thanh), phai: true },
  { nhan: "Huỷ", hienThi: (r: T) => soVN(r.huy), phai: true }, { nhan: "Không đến", hienThi: (r: T) => soVN(r.khong_den), phai: true }, { nhan: "Chưa tới hẹn / chưa chốt", hienThi: (r: T) => soVN(r.chua_den), phai: true },
  { nhan: "Tỉ lệ đến", hienThi: (r: T) => tiLe(r.hoan_thanh, r.so_lich), phai: true },
];

export async function BaoCaoDatLich({ loc, coChiNhanh }: { loc: Loc; coChiNhanh: boolean }) {
  const db = sb();
  const [d, mau] = await Promise.all([layDatLich(db, loc.tu, loc.den, loc.cn, loc.nhom), layDatLich(db, SH_MAU.ky.tu, SH_MAU.ky.den, undefined, "thang")]);
  const t = d.tong;
  const ttMau = (k: string) => mau.trangThai.find((x) => x.khoa === k)?.so_lich ?? 0;
  const ngMau = (k: string) => mau.nguon.find((x) => x.khoa === k)?.so_lich ?? 0;
  const s = SH_MAU.datLich;
  const dongDc = [
    { nhan: "Tổng số lịch", sh: soVN(s.tong), app: soVN(mau.tong.so_lich) }, { nhan: "Hoàn thành", sh: soVN(s.hoan_thanh), app: soVN(ttMau("hoan_thanh")) },
    { nhan: "Đã xác nhận", sh: soVN(s.da_xac_nhan), app: soVN(ttMau("da_xac_nhan")) }, { nhan: "Huỷ", sh: soVN(s.huy), app: soVN(ttMau("huy")) },
    { nhan: "Chưa xác nhận", sh: soVN(s.chua_xac_nhan), app: soVN(ttMau("chua_xac_nhan")) }, { nhan: "Nguồn: điện thoại", sh: soVN(s.PHONE), app: soVN(ngMau("PHONE")) },
    { nhan: "Nguồn: Messenger", sh: soVN(s.MESSENGER), app: soVN(ngMau("MESSENGER")) },
  ].map((r) => ({ ...r, khop: r.sh === r.app }));
  const tenTt = (k: string) => TRANG_THAI_LICH[k] ?? k;
  return (
    <>
      <BaoDoiNhom loc={loc} />
      <HangChiSo muc={[{ nhan: "Tổng lịch hẹn", so: soVN(t.so_lich), ghiChu: `${soVN(t.chua_den)} lịch chưa tới hẹn / chưa chốt` }, { nhan: "Khách đến", so: tiLe(t.hoan_thanh, t.so_lich), ghiChu: `${soVN(t.hoan_thanh)} lịch` },
        { nhan: "Huỷ", so: tiLe(t.huy, t.so_lich), ghiChu: `${soVN(t.huy)} lịch` }, { nhan: "Không đến", so: tiLe(t.khong_den, t.so_lich), ghiChu: `${soVN(t.khong_den)} lịch` }]} />
      <TieuDeMuc id="lich-trang-thai">Theo trạng thái</TieuDeMuc>
      <Bang duLieu={d.trangThai} khoa={(r) => r.khoa} trong="Không có lịch hẹn trong khoảng này."
        cot={[{ nhan: "Trạng thái", chinh: true, hienThi: (r) => tenTt(r.khoa) }, { nhan: "Số lịch", hienThi: (r) => soVN(r.so_lich), phai: true }, { nhan: "Tỉ lệ", hienThi: (r) => tiLe(r.so_lich, t.so_lich), phai: true }]} />
      <TieuDeMuc id="lich-nguon">Theo nguồn đặt</TieuDeMuc>
      <Bang duLieu={d.nguon} khoa={(r) => r.khoa} trong="Không có lịch hẹn." cot={cotLich({ nhan: "Nguồn", hienThi: (r) => tenNguon(r.khoa) })} />
      <TieuDeMuc id="lich-ky">{loc.nhom === "ngay" ? "Theo ngày" : "Theo tháng"}</TieuDeMuc>
      <Bang duLieu={d.ky} khoa={(r) => r.khoa} trong="Không có lịch hẹn." cot={cotLich({ nhan: loc.nhom === "ngay" ? "Ngày" : "Tháng", hienThi: (r) => tenKy(r.khoa, loc.nhom === "ngay" ? "ngay" : "thang") })} />
      <TieuDeMuc id="lich-nv">Theo nhân viên được hẹn</TieuDeMuc>
      <Bang duLieu={d.nhanVien} khoa={(r) => r.khoa} trong="Không có lịch hẹn." cot={cotLich({ nhan: "Nhân viên", hienThi: (r) => r.nhan })} />
      {coChiNhanh && (<><TieuDeMuc id="lich-cn">Theo chi nhánh</TieuDeMuc><Bang duLieu={d.chiNhanh} khoa={(r) => r.khoa} cot={cotLich({ nhan: "Chi nhánh", hienThi: (r) => r.nhan })} /></>)}
      <GhiChu>Lịch tính theo giờ hẹn (giờ Việt Nam). Khách đến = lịch hoàn thành. Lịch chuyển từ SalonHero giữ nguồn đặt và tên nhân viên gốc.</GhiChu>
      <DoiChieu dong={dongDc} ghiChu="SalonHero đếm theo ngày hẹn (Thống kê đặt lịch)." />
    </>
  );
}

export async function BaoCaoDungDichVu({ loc, coChiNhanh }: { loc: Loc; coChiNhanh: boolean }) {
  const db = sb();
  const [d, mau] = await Promise.all([layDungDichVu(db, loc.tu, loc.den, loc.cn, loc.nhom), layDungDichVu(db, SH_MAU.ky.tu, SH_MAU.ky.den, undefined, "thang")]);
  const t = d.tong;
  const s = SH_MAU.dungDichVu;
  const dongDc = [
    { nhan: "Lượt dùng thẻ", sh: soVN(s.luot_the), app: soVN(mau.tong.luot_the) }, { nhan: "Lượt trả tiền", sh: soVN(s.luot_tien), app: soVN(mau.tong.luot_tien) },
    { nhan: "Doanh số dịch vụ trả tiền", sh: tienVN(s.doanh_so_tien), app: tienVN(mau.tong.doanh_so) },
  ].map((r) => ({ ...r, khop: r.sh === r.app }));
  type D = (typeof d.dichVu)[number];
  const cot = (dau: { nhan: string; hienThi: (r: D) => React.ReactNode }) => [
    { ...dau, chinh: true }, { nhan: "Tổng lượt", hienThi: (r: D) => soVN(r.luot_the + r.luot_tien), phai: true }, { nhan: "Dùng thẻ", hienThi: (r: D) => soVN(r.luot_the), phai: true },
    { nhan: "Trả tiền", hienThi: (r: D) => soVN(r.luot_tien), phai: true }, { nhan: "Doanh số (trả tiền)", hienThi: (r: D) => tienVN(r.doanh_so), phai: true },
    { nhan: "Giá trị buổi từ thẻ", hienThi: (r: D) => tienVN(r.gia_tri_the), phai: true },
  ];
  return (
    <>
      <BaoDoiNhom loc={loc} />
      <HangChiSo muc={[{ nhan: "Tổng lượt dịch vụ", so: soVN(t.luot_the + t.luot_tien) }, { nhan: "Lượt dùng thẻ", so: soVN(t.luot_the), ghiChu: tiLe(t.luot_the, t.luot_the + t.luot_tien) },
        { nhan: "Doanh số dịch vụ trả tiền", so: tienVN(t.doanh_so), ghiChu: `${soVN(t.luot_tien)} lượt` }, { nhan: "Giá trị buổi từ thẻ", so: tienVN(t.gia_tri_the), ghiChu: "ước tính theo giá một buổi" }]} />
      <TieuDeMuc id="dv-dich-vu">Theo dịch vụ</TieuDeMuc>
      <Bang duLieu={d.dichVu} khoa={(r) => r.khoa} trong="Không có lượt dịch vụ trong khoảng này." cot={cot({ nhan: "Dịch vụ", hienThi: (r) => <span className="text-muc">{r.nhan}</span> })} />
      <TieuDeMuc id="dv-nhan-vien">Theo nhân viên thực hiện</TieuDeMuc>
      <Bang duLieu={d.nhanVien} khoa={(r) => r.khoa} trong="Không có lượt dịch vụ." cot={cot({ nhan: "Nhân viên", hienThi: (r) => r.nhan })} />
      <TieuDeMuc id="dv-ky">{loc.nhom === "ngay" ? "Theo ngày" : "Theo tháng"}</TieuDeMuc>
      <Bang duLieu={d.ky} khoa={(r) => r.khoa} trong="Không có lượt dịch vụ." cot={cot({ nhan: loc.nhom === "ngay" ? "Ngày" : "Tháng", hienThi: (r) => tenKy(r.khoa, loc.nhom === "ngay" ? "ngay" : "thang") })} />
      {coChiNhanh && (<><TieuDeMuc id="dv-cn">Theo chi nhánh</TieuDeMuc><Bang duLieu={d.chiNhanh} khoa={(r) => r.khoa} cot={cot({ nhan: "Chi nhánh", hienThi: (r) => r.nhan })} /></>)}
      <GhiChu>Một lượt = một dịch vụ trên hoá đơn hoặc một buổi trừ thẻ. Dùng thẻ = làm bằng thẻ liệu trình (không thu tiền lúc làm); trả tiền = dịch vụ bán lẻ, doanh số đã chia giảm giá cả đơn. Nhân viên = người phục vụ; một lượt nhiều người làm thì mỗi người đều được tính lượt, tiền chia theo tỉ lệ.</GhiChu>
      <DoiChieu dong={dongDc} ghiChu="SalonHero lấy từ báo cáo theo sản phẩm/dịch vụ (dòng dịch vụ có thẻ = dùng thẻ). Giá trị buổi SalonHero tính bằng giá bán thẻ ÷ số buổi nên không đối chiếu cột này." />
    </>
  );
}

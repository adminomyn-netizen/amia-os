import Link from "next/link";
import { sb } from "@/lib/db";
import { gioVN, ngayCuaIso, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { layLichSuDungThe, layTheoChiNhanh, layTheoKhachHang, SH_MAU_GAP, type LocKhach, type LocThe } from "@/lib/bao-cao-gap";

/** Ba báo cáo kiểu SalonHero: theo chi nhánh, theo khách hàng, lịch sử dùng thẻ (máy chủ tính, trang chỉ hiển thị). */
const GhiChu = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[12px] leading-relaxed text-muc-3">{children}</p>;
const TieuDeMuc = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-8 text-[15px] font-medium text-muc">{children}</h2>;

function DoiChieu({ dong, ghiChu }: { dong: { nhan: string; sh: string; app: string; khop: boolean }[]; ghiChu: string }) {
  return (
    <details className="mt-8 rounded-nho border border-vien px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-medium text-muc-2">Đối chiếu với SalonHero ({SH_MAU_GAP.ky.nhan})</summary>
      <div className="mt-3">
        <Bang duLieu={dong} khoa={(r) => r.nhan}
          cot={[{ nhan: "Chỉ số", hienThi: (r) => r.nhan, chinh: true }, { nhan: "SalonHero", hienThi: (r) => r.sh, phai: true }, { nhan: "App", hienThi: (r) => r.app, phai: true },
            { nhan: "Khớp", hienThi: (r) => (r.khop ? <span className="text-muc">Khớp</span> : <span className="text-canh-bao">Lệch</span>) }]} />
        <GhiChu>{ghiChu}</GhiChu>
      </div>
    </details>
  );
}

const SdtAn = "•••";
const gan = (goc: Record<string, string | undefined>) => (trang: number | undefined) => `/bao-cao?${new URLSearchParams(Object.entries({ ...goc, trang: trang ? String(trang) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
const ngayGio = (iso: string) => `${ngayVN(ngayCuaIso(iso))} ${gioVN(iso)}`;

export async function BaoCaoTheoChiNhanh({ tu, den, cn }: { tu: string; den: string; cn?: string }) {
  const db = sb();
  const [{ ds, tong }, mau] = await Promise.all([layTheoChiNhanh(db, tu, den, cn), layTheoChiNhanh(db, SH_MAU_GAP.ky.tu, SH_MAU_GAP.ky.den)]);
  const dongDc = SH_MAU_GAP.chiNhanh.flatMap((s) => {
    const a = mau.ds.find((m) => m.ten === s.ten);
    return [
      { nhan: `${s.ten} · số đơn`, sh: soVN(s.soDon), app: soVN(a?.soDon), khop: a?.soDon === s.soDon },
      { nhan: `${s.ten} · đã thu`, sh: tienVN(s.daThu), app: tienVN(a?.daThu), khop: a?.daThu === s.daThu },
      { nhan: `${s.ten} · còn nợ`, sh: tienVN(s.conNo), app: tienVN(a?.conNo), khop: a?.conNo === s.conNo },
      { nhan: `${s.ten} · doanh thu`, sh: tienVN(s.doanhThu), app: tienVN(a?.doanhThu), khop: a?.doanhThu === s.doanhThu },
    ];
  });
  return (
    <>
      <HangChiSo muc={[
        { nhan: "Tổng doanh thu", so: tienVN(tong.daThu), ghiChu: `${soVN(tong.soDon)} đơn · tiền đã thu trong kỳ` },
        { nhan: "Nợ phải thu", so: tienVN(tong.conNo), ghiChu: "còn nợ của các đơn trong kỳ" },
        { nhan: "Thu tiền mặt · bán hàng", so: tienVN(tong.tmBan), ghiChu: `thu nợ ${tienVN(tong.tmNo)}` },
        { nhan: "Quẹt thẻ và chuyển khoản · bán hàng", so: tienVN(tong.ckBan), ghiChu: `thu nợ ${tienVN(tong.ckNo)}` },
      ]} />
      <TieuDeMuc>Doanh thu (VND)</TieuDeMuc>
      <CotNgang duLieu={ds.map((r) => ({ nhan: r.ten, gia_tri: r.doanhThu }))} dinhDang={(n) => tienVN(n)} trong="Không có hoá đơn trong khoảng này." />
      <TieuDeMuc>Bảng số liệu chi tiết</TieuDeMuc>
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Không có chi nhánh nào để hiện."
        cot={[
          { nhan: "Chi nhánh", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Số nhân viên", hienThi: (r) => soVN(r.soNhanVien), phai: true },
          { nhan: "Số đơn hàng", hienThi: (r) => soVN(r.soDon), phai: true },
          { nhan: "Đã thu", hienThi: (r) => tienVN(r.daThu), phai: true },
          { nhan: "Còn nợ", hienThi: (r) => tienVN(r.conNo), phai: true },
          { nhan: "Doanh thu", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.doanhThu)}</span>, phai: true },
        ]} />
      <GhiChu>Tổng doanh thu ở đầu trang = tổng tiền đã thu trong kỳ của mọi chi nhánh (như SalonHero). Đã thu = tiền mặt + chuyển khoản + quẹt thẻ thu trong kỳ, kể cả thu nợ; Còn nợ = nợ của các đơn lập trong kỳ; Doanh thu = tổng đơn hoàn thành (tiền hàng − giảm giá + VAT + phụ phí + tip) trừ phần trả bằng thẻ tiền, cùng cách tính với Doanh thu theo ngày. Bán hàng = thu cùng ngày với đơn, thu nợ = thu sau ngày đơn. Số nhân viên = nhân viên đang làm gắn với chi nhánh (SalonHero đếm theo danh sách người làm của chi nhánh nên có thể lệch).</GhiChu>
      <DoiChieu dong={dongDc} ghiChu="Đọc trực tiếp từ SalonHero (Báo cáo → Theo chi nhánh) cho tháng đã đóng, đơn vị đồng. Với tháng đang chạy, Đà Lạt trong app nhiều hơn SalonHero một hoá đơn tạo thẳng trong app (HD000003, 900.000 đ, 26/10/2026) nên số lệch đúng bằng hoá đơn đó." />
    </>
  );
}

export async function BaoCaoTheoKhachHang({ loc, xemSdt, chiNhanhVinh }: { loc: LocKhach & { so: number; trang: number }; xemSdt: boolean; chiNhanhVinh?: string }) {
  const db = sb();
  const [{ rows, tong }, mau] = await Promise.all([layTheoKhachHang(db, loc), chiNhanhVinh ? layTheoKhachHang(db, { tu: SH_MAU_GAP.ky.tu, den: SH_MAU_GAP.ky.den, cn: chiNhanhVinh, so: 1 }) : Promise.resolve(null)]);
  const bieuDo = loc.trang === 1 && !loc.q ? rows.slice(0, 10) : [];
  const goc = { tab: "khach-hang", tu: loc.tu, den: loc.den, cn: loc.cn, nk: loc.nhom, hang: loc.hang, q: loc.q, so: loc.so === 20 ? undefined : String(loc.so) };
  const dongDc = mau ? [
    { nhan: "Số khách hàng", sh: soVN(SH_MAU_GAP.khach.soKhach), app: soVN(mau.tong.khach), khop: mau.tong.khach === SH_MAU_GAP.khach.soKhach },
    { nhan: "Hóa đơn (doanh thu)", sh: tienVN(SH_MAU_GAP.khach.doanhThu), app: tienVN(mau.tong.doanhThu), khop: mau.tong.doanhThu === SH_MAU_GAP.khach.doanhThu },
    { nhan: "Tiền đã nhận", sh: tienVN(SH_MAU_GAP.khach.thucThu), app: tienVN(mau.tong.thucThu), khop: mau.tong.thucThu === SH_MAU_GAP.khach.thucThu },
  ] : [];
  return (
    <>
      <HangChiSo muc={[
        { nhan: "Hóa đơn", so: tienVN(tong.doanhThu), ghiChu: `${soVN(tong.khach)} khách hàng` },
        { nhan: "Tiền đã nhận", so: tienVN(tong.thucThu) },
        { nhan: "Tiền thu nợ", so: tienVN(tong.thuNo), ghiChu: "thu sau ngày lập đơn, đơn trong kỳ" },
        { nhan: "Doanh số TB / khách hàng", so: tienVN(tong.khach ? Math.round(tong.doanhThu / tong.khach) : 0) },
      ]} />
      <div className="mt-4"><HangChiSo muc={[
        { nhan: "Số khách hàng mới", so: soVN(tong.khachMoi), ghiChu: `D.số hóa đơn ${tienVN(tong.dtMoi)} · tiền đã thu ${tienVN(tong.thuMoi)}` },
        { nhan: "Số khách hàng quay lại", so: soVN(tong.khachCu), ghiChu: `D.số hóa đơn ${tienVN(tong.dtCu)} · tiền đã thu ${tienVN(tong.thuCu)}` },
      ]} /></div>
      {bieuDo.length > 0 && (<><TieuDeMuc>Doanh thu (VND) · theo khách hàng</TieuDeMuc><CotNgang duLieu={bieuDo.map((r) => ({ nhan: r.ten, gia_tri: r.doanhThu }))} dinhDang={(n) => tienVN(n)} /></>)}
      <TieuDeMuc>Top customers</TieuDeMuc>
      <Bang duLieu={rows} khoa={(r) => r.id ?? "le"} trong="Không tìm thấy kết quả nào"
        cot={[
          { nhan: "Khách hàng", chinh: true, hienThi: (r) => (<span className="block">{r.id ? <Link href={`/khach-hang/${r.id}`} className="text-muc hover:underline">{r.ten}</Link> : <span className="text-muc">{r.ten}</span>}<span className="block text-[12px] text-muc-3">{xemSdt ? r.dienThoai : r.dienThoai ? SdtAn : ""}</span></span>) },
          { nhan: "Loại khách", hienThi: (r) => `Hạng ${r.hang} · ${r.laMoi ? "Khách mới" : "Khách quay lại"}` },
          { nhan: "Số đơn hàng", hienThi: (r) => soVN(r.soDon), phai: true },
          { nhan: "Doanh thu hóa đơn", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.doanhThu)}</span>, phai: true },
          { nhan: "Tổng thực thu", hienThi: (r) => tienVN(r.thucThu), phai: true },
          { nhan: "Thu nợ cũ", hienThi: (r) => tienVN(r.thuNo), phai: true },
          { nhan: "Nợ mới", hienThi: (r) => tienVN(r.noMoi), phai: true },
          { nhan: "Xem", hienThi: (r) => (r.id ? <Link href={`/khach-hang/${r.id}`} className="font-medium text-nhan-dam hover:underline">Xem</Link> : "") },
        ]} />
      <ThanhTrang trang={loc.trang} tong={tong.dong} moi={loc.so} gan={gan(goc)} />
      <GhiChu>Mỗi khách có đơn hoàn thành trong kỳ là một dòng, xếp theo doanh thu. Doanh thu hóa đơn = tổng đơn trừ phần trả bằng thẻ tiền; Tổng thực thu = doanh thu − nợ còn lại của các đơn đó; Nợ mới = nợ còn lại của các đơn trong kỳ; Thu nợ cũ = tiền thu sau ngày lập đơn (đơn trong kỳ). Khách mới = chưa có hoá đơn hoàn thành nào trước kỳ; hạng là hạng SalonHero đã chuyển sang. Các số tổng tính trên mọi khách thoả bộ lọc, không phụ thuộc ô tìm kiếm.</GhiChu>
      {mau && <DoiChieu dong={dongDc} ghiChu="SalonHero (Báo cáo → Theo khách hàng, chi nhánh Vinh). Hai ô khác SalonHero và vì sao: “Khách mới” SalonHero đánh dấu theo cờ riêng của nó (19 khách) còn app theo lịch sử hoá đơn; “Tiền thu nợ” SalonHero gồm cả khoản thu nợ ghi trùng ngày lập đơn (80.500.000 đ)." />}
    </>
  );
}

export async function BaoCaoLichSuDungThe({ loc, xemSdt }: { loc: LocThe & { so: number; trang: number }; xemSdt: boolean }) {
  const db = sb();
  const [{ rows, tong }, mau] = await Promise.all([layLichSuDungThe(db, loc), layLichSuDungThe(db, { tu: SH_MAU_GAP.ky.tu, den: SH_MAU_GAP.ky.den, so: 1 })]);
  const goc = { tab: "lich-su-the", tu: loc.tu, den: loc.den, cn: loc.cn, q: loc.q, tt: loc.tenThe, lt: loc.loai, so: loc.so === 20 ? undefined : String(loc.so) };
  const dongDc = [
    { nhan: "Số dòng lịch sử", sh: soVN(SH_MAU_GAP.theDung.soDong), app: soVN(mau.tong.dong), khop: mau.tong.dong === SH_MAU_GAP.theDung.soDong },
    { nhan: "Tổng số lần dùng", sh: soVN(SH_MAU_GAP.theDung.soLan), app: soVN(mau.tong.lan), khop: mau.tong.lan === SH_MAU_GAP.theDung.soLan },
    { nhan: "Tổng tiền đã trừ thẻ", sh: tienVN(SH_MAU_GAP.theDung.tien), app: tienVN(mau.tong.tien), khop: mau.tong.tien === SH_MAU_GAP.theDung.tien },
  ];
  return (
    <>
      <HangChiSo muc={[{ nhan: "Tổng số lần dùng", so: soVN(tong.lan), ghiChu: `${soVN(tong.dong)} dòng` }, { nhan: "Tổng tiền đã trừ thẻ", so: tienVN(tong.tien), ghiChu: "tiền tương đương" }]} />
      <div className="mt-6">
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Ngày", hienThi: (r) => ngayGio(r.ngay) },
            { nhan: "Mã hóa đơn", hienThi: (r) => (r.hoaDonId ? <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.maHd}</Link> : "") },
            { nhan: "Khách hàng", chinh: true, hienThi: (r) => (<span className="block">{r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : <span className="text-muc">{r.khach}</span>}<span className="block text-[12px] text-muc-3">{xemSdt ? r.dienThoai : r.dienThoai ? SdtAn : ""}</span></span>) },
            { nhan: "Chi nhánh", hienThi: (r) => r.chiNhanh },
            { nhan: "Tên thẻ", hienThi: (r) => (<span className="block"><span className="text-muc">{r.tenThe}</span><span className="block text-[12px] text-muc-3">{r.maThe}</span></span>) },
            { nhan: "Loại thẻ", hienThi: (r) => (r.loai === "tien" ? "Thẻ tiền" : "Thẻ lần") },
            { nhan: "Số lần sử dụng", hienThi: (r) => soVN(r.soLan), phai: true },
            { nhan: "Tiền tương đương trừ thẻ", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.tien)}</span>, phai: true },
          ]} />
      </div>
      <ThanhTrang trang={loc.trang} tong={tong.dong} moi={loc.so} gan={gan(goc)} />
      <GhiChu>Mỗi lần dùng thẻ là một dòng. Thẻ lần: dòng dịch vụ làm bằng thẻ trên hoá đơn (chuyển từ SalonHero) và buổi trừ thẻ làm trong app; tiền tương đương = số lần × (giá bán thẻ ÷ số buổi, làm tròn), như SalonHero. Thẻ tiền: số tiền trừ khỏi thẻ; hoá đơn cũ chưa ghi thẻ nào thì lấy thẻ tiền duy nhất của khách (nếu khách có nhiều thẻ tiền, tên thẻ để trống). Thẻ chưa có trong hồ sơ thẻ của app (thẻ bán cuối tháng 10/2026 chưa chuyển sang) hiện tên dịch vụ, không có mã và tính 0 đồng.</GhiChu>
      <DoiChieu dong={dongDc} ghiChu="SalonHero (Báo cáo → Lịch sử dùng thẻ). Số tiền lệch vì một số thẻ SalonHero dùng trong tháng chưa có hồ sơ thẻ trong app (tên + giá thẻ không có để tính); số lần dùng lệch vài dòng do cách ghép dòng hoá đơn - thẻ." />
    </>
  );
}

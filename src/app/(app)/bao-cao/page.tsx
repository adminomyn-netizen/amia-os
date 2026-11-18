import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { luaChonTaiKhoanForm } from "@/lib/ban-hang";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, congNgay, gioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Tab } from "@/components/ui/Tab";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { CotTheoKy } from "@/components/bieu-do/CotTheoKy";
import { ChonSoDong } from "@/components/bao-cao/ChonSoDong";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { LocHoaHong } from "@/components/bao-cao/LocHoaHong";
import { BaoCaoHoaHongGioiThieu, BaoCaoHoaHongThucThu } from "@/components/bao-cao/BaoCaoHoaHong";
import { LUA_CHON_THE, LUA_CHON_VAI } from "@/lib/bao-cao-hoa-hong";
import { BaoCaoDatLich, BaoCaoDungDichVu, BaoCaoThuNgan } from "@/components/bao-cao/BaoCaoMoi";
import { BaoCaoDanhGia } from "@/components/bao-cao/BaoCaoDanhGia";
import { BaoCaoHoaDonNgay } from "@/components/bao-cao/BaoCaoHoaDonNgay";
import { BaoCaoTiLeChot } from "@/components/bao-cao/BaoCaoTiLeChot";
import { BaoCaoVoucher } from "@/components/bao-cao/BaoCaoVoucher";
import { BaoCaoThoiGianDv } from "@/components/bao-cao/BaoCaoThoiGianDv";
import { chonNhom, NHOM_KY } from "@/lib/bao-cao-du-lieu";
import { BaoCaoLichSuDungThe, BaoCaoTheoChiNhanh, BaoCaoTheoKhachHang } from "@/components/bao-cao/BaoCaoGap";
import { BaoCaoBanSanPham, BaoCaoChiPhiDichVu, BaoCaoNhapKho, BaoCaoNhapXuatKho, BaoCaoTonTheoLo, BaoCaoXuatKho } from "@/components/bao-cao/BaoCaoKho";
import { soDongKho } from "@/lib/bao-cao-kho";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { BangNoKhach } from "@/components/bao-cao/BangNoKhach";
import { LocKhachThe } from "@/components/bao-cao/LocKhachThe";
import { LocNo } from "@/components/bao-cao/LocNo";
import { XemKhachMuc } from "@/components/bao-cao/XemKhachMuc";
import { layDanhSachNo } from "@/lib/bao-cao-no";
import { gomTheoKy, HANG_KHACH, KIEU_GOM, khoaKy, kieuGom, layDoanhThuChiSo, layCacLanTraNo, layThongKeDungDichVu, layNhanVienSh, layTongKhoanChi, laySanPhamDichVu, LOAI_MUC, LOC_LOAI, type LoaiMuc, soDongTrang, soTrang } from "@/lib/bao-cao-gap";

const TAB = [{ ma: "doanh-thu", ten: "Doanh thu theo ngày" }, { ma: "hoa-don-ngay", ten: "Hoá đơn trong ngày" }, { ma: "chi-nhanh", ten: "Theo chi nhánh" }, { ma: "khach-hang", ten: "Theo khách hàng" }, { ma: "thu-ngan", ten: "Theo thu ngân" }, { ma: "nhan-vien", ten: "Theo nhân viên" }, { ma: "dich-vu", ten: "Theo dịch vụ, sản phẩm" }, { ma: "dung-dich-vu", ten: "Dùng dịch vụ" }, { ma: "dung-the-ma", ten: "Thống kê sử dụng d.vụ" }, { ma: "voucher", ten: "Hiệu quả voucher" }, { ma: "lich-su-the", ten: "Lịch sử dùng thẻ" }, { ma: "dat-lich", ten: "Đặt lịch" }, { ma: "thoi-gian-dv", ten: "Thời gian dịch vụ" }, { ma: "no", ten: "Khách còn nợ" }, { ma: "the", ten: "Thẻ còn dư" }, { ma: "hh-thuc-thu", ten: "Hoa hồng thực thu" }, { ma: "hh-gioi-thieu", ten: "Hoa hồng giới thiệu" }, { ma: "danh-gia", ten: "Đánh giá nhân viên" }, { ma: "ti-le-chot", ten: "Tỉ lệ chốt tư vấn" }, { ma: "nhap-xuat-kho", ten: "Nhập xuất kho hàng" }, { ma: "nhap-kho", ten: "Báo cáo nhập kho" }, { ma: "xuat-kho", ten: "Xuất kho bởi nhân viên" }, { ma: "ban-san-pham", ten: "Sản phẩm đã bán" }, { ma: "ton-lo", ten: "Báo cáo tồn theo lô hàng" }, { ma: "chi-phi-dv", ten: "Báo cáo chi phí dịch vụ" }];
/** Tab không có số tiền: chỉ cần quyền xem báo cáo. Các tab còn lại cần thêm quyền xem số tiền. */
const TAB_KHONG_TIEN = new Set(["doanh-thu", "dat-lich", "thoi-gian-dv", "danh-gia", "ti-le-chot", "ton-lo"]);
/** Tab có lựa chọn gom số liệu theo kỳ, và cách gom mặc định. */
const TAB_NHOM: Record<string, "tong" | "thang"> = { "thu-ngan": "tong", "dat-lich": "thang", "dung-dich-vu": "thang" };
const Chip = ({ href, dang, ten }: { href: string; dang: boolean; ten: string }) => <Link href={href} scroll={false} aria-current={dang ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${dang ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{ten}</Link>;
const ChipNo = ({ nt, them }: { nt: "ds" | "tra"; them: string }) => (
  <nav aria-label="Khách hàng nợ" className="mb-4 flex gap-2 overflow-x-auto pb-1">
    {([["ds", "Danh sách khách hàng còn nợ"], ["tra", "Các lần trả nợ"]] as const).map(([k, t]) => <Link key={k} href={`/bao-cao?tab=no${k === "tra" ? "&nt=tra" : ""}${them}`} scroll={false} aria-current={nt === k ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${nt === k ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{t}</Link>)}
  </nav>
);
const TieuDeMuc = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-6 text-[15px] font-medium text-muc">{children}</h2>;

export default async function TrangBaoCao({ searchParams }: { searchParams: Promise<{ tab?: string; qg?: string; tu?: string; den?: string; cn?: string; nhom?: string; dc?: string; sao?: string; q?: string; trang?: string; vai?: string; the?: string; nk?: string; gom?: string; loai?: string; lm?: string; nt?: string; hang?: string; tt?: string; lt?: string; so?: string; nhom_sp?: string; nguon?: string; ncc?: string; v?: string; dv?: string; nv?: string; ct?: string; han?: string }> }) {
  const nd = await yeuCauQuyen("baocao.xem");
  const sp = await searchParams;
  const tien = coQuyen(nd, "baocao.tien");
  const tabs = TAB.filter((t) => tien || TAB_KHONG_TIEN.has(t.ma));
  const tab = tabs.some((t) => t.ma === sp.tab) ? sp.tab! : "doanh-thu";
  const kn = khoangNgay(sp.tu, sp.den);
  // Mặc định của SalonHero: Nhập xuất kho hàng = hôm nay; Hoá đơn trong ngày = hôm nay (thu ngân kiểm khách lên đủ chưa); Chi phí dịch vụ = 7 ngày gần nhất; còn lại từ đầu tháng.
  const macDinhNgay = !sp.tu && !sp.den;
  const tu = macDinhNgay && (tab === "nhap-xuat-kho" || tab === "hoa-don-ngay") ? kn.homNay : macDinhNgay && tab === "chi-phi-dv" ? congNgay(kn.homNay, -6) : kn.tu;
  const den = kn.den;
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  const coNhom = tab in TAB_NHOM;
  const lKho = { tu, den, cn, q: sp.q || undefined, trang: soTrang(sp.trang), chiNhanh: nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) };
  const { nhom, doiTuNgay } = chonNhom(sp.nhom, tu, den, TAB_NHOM[tab] ?? "tong");
  const cacNhom = tab === "thu-ngan" ? NHOM_KY : NHOM_KY.filter((n) => n.gia_tri !== "tong");
  const lc = <LocBaoCao goc="/bao-cao" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} nhom={coNhom ? nhom : undefined} cacNhom={coNhom ? cacNhom : undefined} />;
  const them = `${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
  const loc = { tu, den, cn, nhom, doiTuNgay };
  const coChiNhanh = !cn && (dsCn ?? []).length > 1;
  const xuat = `/api/xuat/bao-cao?tab=${tab}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}${coNhom ? `&nhom=${nhom}` : ""}${tab === "hh-thuc-thu" ? `${sp.vai ? `&vai=${sp.vai}` : ""}${sp.the === "1" ? "&the=1" : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${tab === "hh-gioi-thieu" && sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${tab === "dung-the-ma" && sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${tab === "no" && sp.nt === "tra" ? `&nt=tra${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${tab === "no" && sp.nt !== "tra" ? `${sp.tu ? `&ntu=${sp.tu}` : ""}${sp.den ? `&nden=${sp.den}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${["nhap-xuat-kho", "nhap-kho", "xuat-kho", "ban-san-pham", "ton-lo", "chi-phi-dv"].includes(tab) ? (["nhom_sp", "nguon", "ncc", "loai", "v", "dv", "nv", "tt", "han", "q"] as const).map((k) => (sp[k] ? `&${k}=${encodeURIComponent(sp[k]!)}` : "")).join("") : ""}${tab === "hoa-don-ngay" && sp.loai === "ban" ? "&loai=ban" : ""}${tab === "dich-vu" ? `${sp.loai ? `&loai=${sp.loai}` : ""}${sp.lm ? `&lm=${sp.lm}` : ""}` : ""}${tab === "doanh-thu" && sp.gom ? `&gom=${sp.gom}` : ""}${tab === "khach-hang" ? `${sp.nk ? `&nk=${sp.nk}` : ""}${sp.hang ? `&hang=${encodeURIComponent(sp.hang)}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${tab === "lich-su-the" ? `${sp.tt ? `&tt=${encodeURIComponent(sp.tt)}` : ""}${sp.lt ? `&lt=${sp.lt}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}`;
  let noiDung: React.ReactNode;

  const dsChiNhanh = nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  if (tab === "hoa-don-ngay") {
    noiDung = <><LocBaoCao goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} motNgay={tu === den} /><BaoCaoHoaDonNgay tu={tu} den={den} cn={cn} loai={sp.loai === "ban" ? "ban" : "dich_vu"} coChiNhanh={coChiNhanh} goc={`/bao-cao?tab=hoa-don-ngay&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} /></>;
  } else if (tab === "thoi-gian-dv") {
    noiDung = <BaoCaoThoiGianDv tu={tu} den={den} cn={cn} chiNhanh={dsChiNhanh} nv={sp.nv || undefined} dv={sp.dv || undefined} q={sp.q || undefined} chiQua={sp.qg === "1"} trang={soTrang(sp.trang)} />;
  } else if (tab === "nhap-xuat-kho") {
    noiDung = <BaoCaoNhapXuatKho l={lKho} nhom={sp.nhom_sp || undefined} so={soDongKho(sp.so)} />;
  } else if (tab === "nhap-kho") {
    noiDung = <BaoCaoNhapKho l={lKho} nguon={sp.nguon} ncc={sp.ncc || undefined} tq={sp.v === "tq"} />;
  } else if (tab === "xuat-kho") {
    noiDung = <BaoCaoXuatKho l={lKho} loai={sp.loai || undefined} tq={sp.v === "tq"} />;
  } else if (tab === "ban-san-pham") {
    noiDung = <BaoCaoBanSanPham l={lKho} tq={sp.v === "tq"} />;
  } else if (tab === "ton-lo") {
    noiDung = <BaoCaoTonTheoLo l={lKho} tt={sp.tt} han={sp.han} />;
  } else if (tab === "chi-phi-dv") {
    noiDung = <BaoCaoChiPhiDichVu l={lKho} dv={sp.dv || undefined} nv={sp.nv || undefined} ct={sp.ct || undefined} />;
  } else if (tab === "chi-nhanh") {
    noiDung = <><LocKhachThe kieu="chi-nhanh" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} q={sp.q} so={soDongTrang(sp.so)} /><BaoCaoTheoChiNhanh tu={tu} den={den} cn={cn} q={sp.q || undefined} so={soDongTrang(sp.so)} trang={soTrang(sp.trang)} /></>;
  } else if (tab === "khach-hang") {
    const { data: nhomKh } = await db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten");
    const loaiK = { tu, den, cn, nhom: sp.nk || undefined, hang: sp.hang || undefined, q: sp.q || undefined, trang: soTrang(sp.trang), so: soDongTrang(sp.so) };
    noiDung = <>
      <LocKhachThe kieu="khach" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} nhomKhach={(nhomKh ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))} nhom={sp.nk} hang={sp.hang} cacHang={HANG_KHACH.map((h) => ({ gia_tri: h, nhan: `Hạng ${h}` }))} q={sp.q} so={loaiK.so} />
      <BaoCaoTheoKhachHang loc={loaiK} xemSdt={coQuyen(nd, "khach.sdt")} chiNhanhVinh={(dsCn ?? []).find((c) => c.ten === "AMIA Vinh")?.id} />
    </>;
  } else if (tab === "lich-su-the") {
    const loaiT = { tu, den, cn, q: sp.q || undefined, tenThe: sp.tt || undefined, loai: sp.lt || undefined, trang: soTrang(sp.trang), so: soDongTrang(sp.so) };
    noiDung = <>
      <LocKhachThe kieu="the" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} loai={sp.lt} q={sp.q} tenThe={sp.tt} so={loaiT.so} />
      <BaoCaoLichSuDungThe loc={loaiT} xemSdt={coQuyen(nd, "khach.sdt")} />
    </>;
  } else if (tab === "dung-the-ma") {
    const quaDai = congNgay(tu, 93) < den, tuDung = quaDai ? congNgay(den, -93) : tu;
    const tatCa = await layThongKeDungDichVu(db, tuDung, den, cn, sp.q || undefined);
    const so = 30, trang = Math.min(soTrang(sp.trang), Math.max(1, Math.ceil(tatCa.length / so)));
    const hien = tatCa.slice((trang - 1) * so, trang * so);
    const xemSdt = coQuyen(nd, "khach.sdt");
    const goc = { tab: "dung-the-ma", tu, den, cn: sp.cn, q: sp.q };
    noiDung = (
      <>
        {lc}
        {quaDai && <p role="status" className="mb-3 text-[12px] text-muc-3">Khoảng dài hơn 93 ngày nên chỉ tính 93 ngày cuối ({ngayVN(tuDung)} – {ngayVN(den)}).</p>}
        <form method="get" action="/bao-cao" className="mb-5 flex gap-2">
          <input type="hidden" name="tab" value="dung-the-ma" /><input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
          {sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm kiếm theo mã / tên sản phẩm" aria-label="Tìm kiếm theo mã hoặc tên sản phẩm" className={O_NHAP} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
        <Bang noi duLieu={hien} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Mã sản phẩm", hienThi: (r) => r.ma },
            { nhan: "Phân loại", hienThi: (r) => (r.phanLoai === "ban" ? "Bán thẻ / liệu trình" : "Sử dụng thẻ / liệu trình") },
            { nhan: "Tên sản phẩm", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
            { nhan: "Số lượng", hienThi: (r) => soVN(r.soLuong), phai: true },
            { nhan: "Xem danh sách", hienThi: (r) => (
              <details>
                <summary className="cursor-pointer text-[13px] font-medium text-nhan-dam">Xem danh sách ({r.khach.length})</summary>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {r.khach.slice(0, 50).map((k, i) => (
                    <li key={i}>{k.khachId ? <Link href={`/khach-hang/${k.khachId}`} className="text-muc hover:underline">{k.ten}</Link> : k.ten}{k.dienThoai ? <span className="text-muc-3"> · {xemSdt ? k.dienThoai : "•••"}</span> : null} · <span className="text-muc-3">{k.maHd} · {ngayVN(k.ngay)}{k.soLuong > 1 ? ` · ${k.soLuong} lần` : ""}</span></li>
                  ))}
                  {r.khach.length > 50 && <li className="text-muc-3">… còn {r.khach.length - 50} dòng, xem đủ trong tệp Excel.</li>}
                </ul>
              </details>) },
          ]} />
        <ThanhTrang trang={trang} tong={tatCa.length} moi={so} gan={(t) => `/bao-cao?${new URLSearchParams(Object.entries({ ...goc, trang: t ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Thống kê số lượng khách hàng sử dụng dịch vụ: mỗi dòng là một dịch vụ theo mã thẻ (“Sử dụng thẻ / liệu trình”, mã dạng DV… - M…) hoặc một thẻ / liệu trình đã bán (“Bán thẻ / liệu trình”) trong khoảng ngày, tính theo hoá đơn hoàn thành. Số lượng là tổng số lần ở các hoá đơn đó. Thẻ chưa có trong hồ sơ thẻ của app không có mã thẻ.</p>
      </>
    );
  } else if (tab === "danh-gia") {
    noiDung = <>{lc}<BaoCaoDanhGia loc={{ tu, den, cn }} sao={sp.sao} q={sp.q} trang={sp.trang} /></>;
  } else if (tab === "voucher") {
    noiDung = <>{lc}<BaoCaoVoucher loc={{ tu, den, cn }} /></>;
  } else if (tab === "ti-le-chot") {
    noiDung = <>{lc}<BaoCaoTiLeChot loc={{ tu, den, cn }} xemTien={tien} /></>;
  } else if (tab === "hh-thuc-thu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} vai={sp.vai} cacVai={LUA_CHON_VAI} the={sp.the} cacThe={LUA_CHON_THE} /><BaoCaoHoaHongThucThu loc={{ tu, den, cn }} vai={sp.vai} gomThe={sp.the === "1"} coChiNhanh={coChiNhanh} q={sp.q} the={sp.the} /></>;
  } else if (tab === "hh-gioi-thieu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} /><BaoCaoHoaHongGioiThieu loc={{ tu, den, cn }} xemSdt={coQuyen(nd, "khach.sdt")} q={sp.q} ct={sp.ct} sua={coQuyen(nd, "danhmuc.sua")} /></>;
  } else if (tab === "thu-ngan") {
    noiDung = <>{lc}<BaoCaoThuNgan loc={loc} linkDoiChieu={sp.dc === "1" ? undefined : `/bao-cao?tab=thu-ngan&dc=1${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}${sp.nhom ? `&nhom=${sp.nhom}` : ""}`} /></>;
  } else if (tab === "dat-lich") {
    noiDung = <>{lc}<BaoCaoDatLich loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "dung-dich-vu") {
    noiDung = <>{lc}<BaoCaoDungDichVu loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "doanh-thu") {
    const gom = kieuGom(sp.gom);
    const [{ data }, cs, { data: dataVi }, kc] = await Promise.all([db.rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn as string }), layDoanhThuChiSo(db, tu, den, cn), db.rpc("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: cn as string }), layTongKhoanChi(db, tu, den, cn)]);
    // Cột ví như báo cáo theo ngày của SalonHero: Momo, VNPay, Shopee Pay, GrabPay, Ví điện tử khác (migration 0199). Ship COD không có cột ở SalonHero, chỉ hiện khi có số.
    const viNgay = new Map((dataVi ?? []).map((r) => [r.ngay, r]));
    const ngayRows = (data ?? []).map((r) => ({ ngay: r.ngay, so_don: Number(r.so_don), doanh_thu: Number(r.doanh_thu), thu_don_moi: Number(r.thu_don_moi), thu_no_cu: Number(r.thu_no_cu), thuc_thu: Number(r.thuc_thu), tien_mat: Number(r.tien_mat), chuyen_khoan: Number(r.chuyen_khoan), quet_the: Number(r.quet_the), tru_the_tien: Number(r.tru_the_tien), momo: Number(viNgay.get(r.ngay)?.momo ?? 0), vnpay: Number(viNgay.get(r.ngay)?.vnpay ?? 0), shopee: Number(viNgay.get(r.ngay)?.shopee ?? 0), grab: Number(viNgay.get(r.ngay)?.grab ?? 0), vi_khac: Number(viNgay.get(r.ngay)?.vi_khac ?? 0), ship_cod: Number(viNgay.get(r.ngay)?.ship_cod ?? 0), no_moi: Number(r.no_moi), so_buoi: Number(r.so_buoi), doanh_thu_buoi: Number(r.doanh_thu_buoi) }));
    const ds = gomTheoKy(ngayRows.filter((r) => r.so_don > 0 || r.thuc_thu !== 0 || r.so_buoi > 0 || r.tru_the_tien !== 0), gom, ["so_don", "doanh_thu", "thu_don_moi", "thu_no_cu", "thuc_thu", "tien_mat", "chuyen_khoan", "quet_the", "momo", "vnpay", "shopee", "grab", "vi_khac", "ship_cod", "tru_the_tien", "no_moi", "so_buoi", "doanh_thu_buoi"]);
    const coCod = ngayRows.some((r) => r.ship_cod !== 0);
    const tongBuoi = ngayRows.reduce((t, r) => t + r.so_buoi, 0), tongDtBuoi = ngayRows.reduce((t, r) => t + r.doanh_thu_buoi, 0);
    const linkGom = (g: string) => `/bao-cao?tab=doanh-thu&gom=${g}${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}${sp.so ? `&so=${sp.so}` : ""}`;
    const soDong = soDongTrang(sp.so), cuoiTrang = Math.max(1, Math.ceil(ds.length / soDong)), trangNay = Math.min(soTrang(sp.trang), cuoiTrang);
    const dsHien = ds.slice((trangNay - 1) * soDong, trangNay * soDong);
    const gocPhanTrang = { tab: "doanh-thu", gom: sp.gom, tu: sp.tu, den: sp.den, cn: sp.cn, so: sp.so };
    const nhanNgan = (n: string) => (gom === "ngay" ? n.slice(0, 5).replace("-", "/") : n);
    const dsBieuDo = [...ds].reverse().map((r) => ({ nhan: r.nhan, nhanNgan: nhanNgan(r.nhan), gia_tri: r.thuc_thu }));
    // Rê/bấm từng cột: hiện số của kỳ + nút mở hoá đơn đúng khoảng ngày của kỳ đó (chị Lâm 10/11).
    const khoangKy = new Map<string, { tu: string; den: string }>();
    for (const r of ngayRows) { const nk = khoaKy(r.ngay, gom).nhan, c = khoangKy.get(nk); khoangKy.set(nk, { tu: c && c.tu < r.ngay ? c.tu : r.ngay, den: c && c.den > r.ngay ? c.den : r.ngay }); }
    const chiTietCot = [...ds].reverse().map((r) => {
      const kk = khoangKy.get(r.nhan);
      return { nhan: r.nhan, href: kk ? `/hoa-don?tu=${kk.tu}&den=${kk.den}&tt=hoan_thanh${sp.cn ? `&cn=${sp.cn}` : ""}` : undefined, dong: [
        { ten: "Thực thu", mau: "var(--sac-luc-mau)", gt: tienVN(r.thuc_thu) }, { ten: "Doanh thu", mau: "var(--dat)", gt: tienVN(r.doanh_thu) },
        { ten: "Số đơn", mau: "var(--muc-3)", gt: soVN(r.so_don) }, { ten: "Tiền mặt", mau: "var(--sac-xanh-mau)", gt: tienVN(r.tien_mat) },
        { ten: "Chuyển khoản", mau: "var(--sac-tim-mau)", gt: tienVN(r.chuyen_khoan) }, { ten: "Nợ mới", mau: "var(--sac-hong-mau)", gt: tienVN(r.no_moi ?? 0) },
      ] };
    });
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[
          { nhan: "Tổng tiền đã thu", so: tienVN(cs.banMoi + cs.thuNo), ghiChu: `Bán mới ${tienVN(cs.banMoi)} · Thu nợ ${tienVN(cs.thuNo)}` },
          { nhan: "Tổng số đơn hàng", so: soVN(cs.soDon) },
          { nhan: "Thu tiền mặt", so: tienVN(cs.tmBan + cs.tmNo), ghiChu: `Bán mới ${tienVN(cs.tmBan)} · Thu nợ ${tienVN(cs.tmNo)}` },
          { nhan: "Thu quẹt thẻ", so: tienVN(cs.qtBan + cs.qtNo), ghiChu: `Bán mới ${tienVN(cs.qtBan)} · Thu nợ ${tienVN(cs.qtNo)}` },
          { nhan: "Thu chuyển khoản", so: tienVN(cs.ckBan + cs.ckNo), ghiChu: `Bán mới ${tienVN(cs.ckBan)} · Thu nợ ${tienVN(cs.ckNo)}` },
          { nhan: "Tình trạng nợ · nợ mới chưa thu", so: tienVN(cs.noMoiChuaThu), ghiChu: `Thu nợ đơn trong kỳ ${tienVN(cs.thuNoTrongKy)} · ngoài kỳ ${tienVN(cs.thuNoNgoaiKy)}` },
          { nhan: "Trừ thẻ tiền", so: tienVN(cs.truThe) },
          { nhan: `Trừ voucher (số lượng: ${cs.soVoucher})`, so: tienVN(cs.truVoucher) },
          { nhan: "Tổng tiền tip", so: tienVN(cs.tip) },
          { nhan: "Tổng thuế (VAT)", so: tienVN(cs.vat) },
          { nhan: "Tổng khoản chi", so: tienVN(kc.tong), ghiChu: `Phiếu chi ở Sổ quỹ · tiền mặt ${tienVN(kc.tienMat)} · ngân hàng ${tienVN(kc.nganHang)}` },
          { nhan: "Doanh thu buổi đã làm", so: tienVN(tongDtBuoi), ghiChu: `${soVN(tongBuoi)} buổi trừ thẻ (gồm dòng dùng thẻ SalonHero)` },
        ]} />
        <nav aria-label="Gom số liệu theo" className="mb-3 mt-6 flex gap-2 overflow-x-auto pb-1">
          {KIEU_GOM.map((k) => (
            <Link key={k.ma} href={linkGom(k.ma)} scroll={false} aria-current={gom === k.ma ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${gom === k.ma ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{k.ten}</Link>
          ))}
        </nav>
        <TieuDeMuc>Thực thu theo {KIEU_GOM.find((k) => k.ma === gom)?.ten.toLowerCase()}</TieuDeMuc>
        <CotTheoKy duLieu={dsBieuDo} ten="Thực thu theo kỳ" chiTiet={chiTietCot} nutChiTiet={gom === "ngay" ? "Xem hoá đơn ngày này" : "Xem hoá đơn kỳ này"} />
        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-medium text-muc">Bảng số liệu chi tiết</h2><ChonSoDong so={soDong} /></div>
        <Bang noi duLieu={dsHien} khoa={(r) => r.nhan} trong="Không có phát sinh trong khoảng này."
          cot={[
            { nhan: "Thời gian", hienThi: (r) => r.nhan }, { nhan: "Đơn mới", hienThi: (r) => r.so_don, phai: true }, { nhan: "Doanh thu", hienThi: (r) => tienVN(r.doanh_thu), phai: true },
            { nhan: "Thu đơn mới", hienThi: (r) => tienVN(r.thu_don_moi), phai: true }, { nhan: "Thu nợ cũ", hienThi: (r) => tienVN(r.thu_no_cu), phai: true }, { nhan: "Thực thu", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.thuc_thu)}</span>, phai: true },
            { nhan: "Tiền mặt", hienThi: (r) => tienVN(r.tien_mat), phai: true }, { nhan: "Chuyển khoản", hienThi: (r) => tienVN(r.chuyen_khoan), phai: true }, { nhan: "Quẹt thẻ", hienThi: (r) => tienVN(r.quet_the), phai: true },
            { nhan: "Momo", hienThi: (r) => tienVN(r.momo), phai: true }, { nhan: "VNPay", hienThi: (r) => tienVN(r.vnpay), phai: true }, { nhan: "Shopee Pay", hienThi: (r) => tienVN(r.shopee), phai: true },
            { nhan: "GrabPay", hienThi: (r) => tienVN(r.grab), phai: true }, { nhan: "Ví điện tử khác", hienThi: (r) => tienVN(r.vi_khac), phai: true },
            ...(coCod ? [{ nhan: "Ship COD", hienThi: (r: (typeof ds)[number]) => tienVN(r.ship_cod), phai: true }] : []),
            { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.tru_the_tien), phai: true }, { nhan: "Nợ mới", hienThi: (r) => tienVN(r.no_moi), phai: true }, { nhan: "Buổi làm", hienThi: (r) => r.so_buoi, phai: true },
          ]} />
        <ThanhTrang trang={trangNay} tong={ds.length} moi={soDong} gan={(t) => `/bao-cao?${new URLSearchParams(Object.entries({ ...gocPhanTrang, trang: t ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} />
        <p className="mt-3 text-[12px] text-muc-3">Biểu đồ vẽ cột Thực thu của từng kỳ (cả khoảng ngày đã chọn, không phụ thuộc trang bảng). Doanh thu = tổng đơn hoàn thành như SalonHero (tiền hàng − giảm giá + VAT + phụ phí + tip) trừ phần thanh toán bằng thẻ tiền. Thực thu = tiền mặt + chuyển khoản + quẹt thẻ + ví điện tử + ship COD; trừ thẻ tiền không phải tiền vào quỹ vì tiền đã vào lúc bán thẻ. “Bán mới” = thu cùng ngày với đơn, “thu nợ” = thu sau ngày đơn. Nợ mới chưa thu = nợ còn lại của các đơn trong kỳ. Gom Tuần tính từ thứ Hai.</p>
      </>
    );
  } else if (tab === "nhan-vien") {
    const ds = await layNhanVienSh(db, tu, den, cn);
    noiDung = (
      <>
        {lc}
        <TieuDeMuc>Biểu đồ doanh thu từng nhân viên</TieuDeMuc>
        <CotNgang duLieu={ds.slice(0, 15).map((r) => ({ nhan: r.ten, gia_tri: r.tong }))} dinhDang={(n) => tienVN(n)} trong="Chưa có đơn nào có gán người hưởng trong khoảng này." />
        <TieuDeMuc>Bảng số liệu chi tiết</TieuDeMuc>
        <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa có đơn nào có gán người hưởng trong khoảng này."
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
            { nhan: "Số lần phục vụ", hienThi: (r) => soVN(r.soPhucVu), phai: true }, { nhan: "Doanh số dịch vụ", hienThi: (r) => tienVN(r.dsDichVu), phai: true },
            { nhan: "Số sản phẩm đã bán", hienThi: (r) => soVN(r.soSanPham), phai: true }, { nhan: "Doanh số sản phẩm", hienThi: (r) => tienVN(r.dsSanPham), phai: true },
            { nhan: "Tổng số thẻ đã bán", hienThi: (r) => soVN(r.soThe), phai: true }, { nhan: "Doanh số bán thẻ", hienThi: (r) => tienVN(r.dsThe), phai: true },
            { nhan: "Số lần tư vấn", hienThi: (r) => soVN(r.soTuVan), phai: true }, { nhan: "Doanh số tư vấn", hienThi: (r) => tienVN(r.dsTuVan), phai: true },
            { nhan: "Tổng doanh số", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.tong)}</span>, phai: true },
          ]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Doanh số mỗi dòng = thành tiền × tỉ lệ chia của người đó, đã chia lại phần giảm giá cả đơn. Dịch vụ làm bằng thẻ tính theo giá một buổi của thẻ (giá bán thẻ ÷ số buổi). Phục vụ: người đứng vai Phục vụ ở dòng dịch vụ; bán hàng / bán thẻ: vai Bán hàng ở dòng sản phẩm / thẻ; tư vấn: vai Tư vấn ở mọi dòng. Hoa hồng xem ở mục <Link href="/hoa-hong" className="text-nhan-dam hover:underline">Hoa hồng</Link>. Số sản phẩm đã bán và thẻ đã bán khớp SalonHero; doanh số dịch vụ và tư vấn có thể lệch vì một phần thẻ chưa có hồ sơ trong app.</p>
      </>
    );
  } else if (tab === "dich-vu") {
    const tatCa = await laySanPhamDichVu(db, tu, den, cn);
    const loc1 = LOC_LOAI.find((l) => l.ma === (sp.loai ?? "")) ?? LOC_LOAI[0];
    const ds1 = tatCa.filter((r) => loc1.gom.includes(r.loai));
    const lm = (Object.keys(LOAI_MUC) as LoaiMuc[]).find((k) => k === sp.lm);
    const dsLm = lm ? ds1.filter((r) => r.loai === lm) : ds1;
    const tuKhoa = boDau((sp.q ?? "").trim());
    const ds = tuKhoa ? dsLm.filter((r) => boDau(`${r.ten} ${r.ma ?? ""}`).includes(tuKhoa)) : dsLm;
    const soDong = soDongTrang(sp.so), trangNay = Math.min(soTrang(sp.trang), Math.max(1, Math.ceil(ds.length / soDong)));
    const dsHien = ds.slice((trangNay - 1) * soDong, trangNay * soDong);
    const tong = (k: "sau" | "truThe" | "thucNhan", loai?: LoaiMuc) => ds1.filter((r) => !loai || r.loai === loai).reduce((t, r) => t + r[k], 0);
    const goc = `/bao-cao?tab=dich-vu${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.so ? `&so=${sp.so}` : ""}`;
    const gocPhanTrang = { tab: "dich-vu", tu: sp.tu, den: sp.den, cn: sp.cn, loai: sp.loai, lm: sp.lm, q: sp.q, so: sp.so };
    noiDung = (
      <>
        {lc}
        <nav aria-label="Loại" className="mb-4 flex gap-2 overflow-x-auto pb-1">{LOC_LOAI.map((l) => <Chip key={l.ma} href={`${goc}${l.ma ? `&loai=${l.ma}` : ""}`} dang={loc1.ma === l.ma} ten={l.ten} />)}</nav>
        <HangChiSo muc={[
          { nhan: "Tổng doanh thu", so: tienVN(tong("sau")) }, { nhan: "Trừ thẻ tiền", so: tienVN(tong("truThe")) }, { nhan: "Tổng thực nhận", so: tienVN(tong("thucNhan")) },
          { nhan: "Doanh thu dịch vụ", so: tienVN(tong("sau", "dich_vu")) }, { nhan: "Doanh thu sản phẩm", so: tienVN(tong("sau", "san_pham")) }, { nhan: "Doanh thu bán thẻ", so: tienVN(tong("sau", "ban_the")) },
        ]} />
        <TieuDeMuc>Bảng số liệu các dịch vụ (không tính giảm giá hóa đơn và thuế)</TieuDeMuc>
        <nav aria-label="Lọc bảng" className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <Chip href={`${goc}${sp.loai ? `&loai=${sp.loai}` : ""}`} dang={!lm} ten="Tất cả" />
          {(Object.keys(LOAI_MUC) as LoaiMuc[]).map((k) => <Chip key={k} href={`${goc}${sp.loai ? `&loai=${sp.loai}` : ""}&lm=${k}`} dang={lm === k} ten={LOAI_MUC[k]} />)}
        </nav>
        <form method="get" action="/bao-cao" className="mb-3 flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="dich-vu" /><input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
          {sp.cn && <input type="hidden" name="cn" value={sp.cn} />}{sp.loai && <input type="hidden" name="loai" value={sp.loai} />}{sp.lm && <input type="hidden" name="lm" value={sp.lm} />}{sp.so && <input type="hidden" name="so" value={sp.so} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm theo mã hoặc tên sản phẩm, dịch vụ" aria-label="Tìm theo mã hoặc tên sản phẩm, dịch vụ" className={`${O_NHAP} min-w-[240px] flex-1`} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
          <ChonSoDong so={soDong} />
        </form>
        <Bang noi duLieu={dsHien} khoa={(r) => `${r.loai}-${r.ten}`} trong="Chưa bán gì trong khoảng này."
          cot={[
            { nhan: "Tên dịch vụ", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{r.ten}</span><span className="block text-[12px] text-muc-3">{r.ma}</span></span> },
            { nhan: "Số lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Trước giảm giá", hienThi: (r) => tienVN(r.truoc), phai: true }, { nhan: "Sau giảm giá", hienThi: (r) => tienVN(r.sau), phai: true },
            { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.truThe), phai: true }, { nhan: "Thực nhận", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.thucNhan)}</span>, phai: true },
            { nhan: "Danh sách khách", hienThi: (r) => <XemKhachMuc loai={r.loai} ten={r.tenGoc} tu={tu} den={den} cn={sp.cn ?? ""} /> },
          ]} />
        <ThanhTrang trang={trangNay} tong={ds.length} moi={soDong} gan={(t) => `/bao-cao?${new URLSearchParams(Object.entries({ ...gocPhanTrang, trang: t ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Một dòng = một mặt hàng theo loại. Trước giảm giá = đơn giá × số lượng; Sau giảm giá = thành tiền đã chia giảm giá cả đơn; Trừ thẻ tiền = phần đơn thanh toán bằng thẻ tiền, chia theo doanh số từng dòng; Thực nhận = Sau giảm giá − Trừ thẻ tiền. Dùng thẻ là dịch vụ làm bằng thẻ liệu trình (không thu tiền lúc làm). Nút “Xem danh sách khách” hiện khách đã mua / dùng đúng mặt hàng đó trong khoảng ngày.</p>
      </>
    );
  } else if (tab === "no" && sp.nt === "tra") {
    const so = 20, trang = soTrang(sp.trang);
    const { rows, tong } = await layCacLanTraNo(db, { tu, den, cn, q: sp.q || undefined, trang, so });
    const xemSdt = coQuyen(nd, "khach.sdt");
    const inPhieu = coQuyen(nd, "no.thu");
    const goc = { tab: "no", nt: "tra", tu, den, cn: sp.cn, q: sp.q };
    noiDung = (
      <>
        <ChipNo nt="tra" them={them} />
        {lc}
        <form method="get" action="/bao-cao" className="mb-5 flex gap-2">
          <input type="hidden" name="tab" value="no" /><input type="hidden" name="nt" value="tra" /><input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
          {sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm theo mã đơn hàng, mã phiếu thu, tên khách hàng, SĐT" aria-label="Tìm theo mã đơn hàng, mã phiếu thu, tên khách hàng, SĐT" className={O_NHAP} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
        <HangChiSo muc={[{ nhan: "Tổng tiền đã trả nợ", so: tienVN(tong.tien), ghiChu: `${soVN(tong.dong)} lần trả` }]} />
        <div className="mt-6"><Bang duLieu={rows} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Mã phiếu thu", hienThi: (r) => <span className="tabular-nums">{r.maPhieu}</span> },
            { nhan: "Ngày trả nợ", hienThi: (r) => <span className="block tabular-nums">{ngayVN(r.ngay)}{r.thuLuc ? <span className="block text-[12px] text-muc-3">{gioVN(r.thuLuc)}</span> : null}</span> },
            { nhan: "Khách hàng", chinh: true, hienThi: (r) => <span className="block">{r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : <span className="text-muc">{r.khach}</span>}<span className="block text-[12px] text-muc-3">{xemSdt ? r.dienThoai : r.dienThoai ? "•••" : ""}</span></span> },
            { nhan: "Mã đơn hàng", hienThi: (r) => <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.maHd}</Link> },
            { nhan: "Chi nhánh", hienThi: (r) => r.chiNhanh }, { nhan: "Tổng số tiền hóa đơn", hienThi: (r) => tienVN(r.tongHd), phai: true },
            { nhan: "Số tiền trả", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.soTien)}</span>, phai: true }, { nhan: "Loại thanh toán", hienThi: (r) => r.phuongThuc }, { nhan: "Người thu", hienThi: (r) => r.nguoiThu },
            { nhan: "", hienThi: (r) => (inPhieu && r.soTien > 0 ? <Link href={`/in/phieu-thu/${r.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Chi tiết</Link> : <Link href={`/hoa-don/${r.hoaDonId}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Chi tiết</Link>) },
          ]} /></div>
        <ThanhTrang trang={trang} tong={tong.dong} moi={so} gan={(t) => `/bao-cao?${new URLSearchParams(Object.entries({ ...goc, trang: t ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Một dòng = một lần khách trả nợ (tiền mặt, chuyển khoản, quẹt thẻ thu sau ngày lập đơn) trong khoảng ngày đã chọn. Mã phiếu thu do AMIA tự đánh số (PT + số thứ tự) cho mọi lần thu, kể cả lần thu chuyển từ SalonHero (SalonHero không có mã riêng cho tiền khách trả). Giờ thu của lần thu từ SalonHero lấy theo giờ ghi ở sổ quỹ SalonHero. Chi tiết = phiếu thu in được; nút Trả nợ để thu nợ ở trang chi tiết hoá đơn.</p>
      </>
    );
  } else if (tab === "no") {
    const ds = await layDanhSachNo(db, { cn, tu: sp.tu || undefined, den: sp.den || undefined, q: sp.q?.trim() || undefined });
    // Ô "Tài khoản nhận" của hộp Trả nợ (0323): tài khoản đang dùng của chi nhánh đang xem (hoặc dùng chung); máy chủ kiểm lại theo chi nhánh từng hoá đơn.
    const { data: dsTkNo } = coQuyen(nd, "no.thu") ? await db.from("tai_khoan_ngan_hang").select("id, ngan_hang, chu_tai_khoan, so_tai_khoan, chi_nhanh_id, dung_chuyen_khoan, dung_quet_the, mac_dinh").eq("hoat_dong", true).order("tao_luc") : { data: [] };
    const tkThuNo = luaChonTaiKhoanForm(dsTkNo ?? [], nd.chiNhanhId ?? (cn || null));
    const gomKhach = sp.gom !== "hd";
    const linkGom = (g: string) => `/bao-cao?tab=no${them}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${g === "hd" ? "&gom=hd" : ""}`;
    noiDung = (
      <>
        <ChipNo nt="ds" them={them} />
        <LocNo tu={sp.tu ?? ""} den={sp.den ?? ""} q={sp.q ?? ""} chiNhanh={dsChiNhanh} cn={sp.cn} />
        <HangChiSo muc={[{ nhan: "Tổng số tiền khách nợ", so: tienVN(ds.reduce((s, r) => s + r.conNo, 0)) }, { nhan: "Số hoá đơn còn nợ", so: soVN(ds.length) }, { nhan: "Số khách còn nợ", so: soVN(new Set(ds.map((r) => r.khachId ?? r.id)).size) }]} />
        <nav aria-label="Cách xem" className="mb-3 mt-6 flex gap-2 overflow-x-auto pb-1">
          <Chip href={linkGom("khach")} dang={gomKhach} ten="Gom theo khách" /><Chip href={linkGom("hd")} dang={!gomKhach} ten="Từng hoá đơn" />
        </nav>
        <BangNoKhach choPhepThu={coQuyen(nd, "no.thu")} homNay={kn.homNay} gom={gomKhach} coChiNhanh={coChiNhanh} dong={ds} taiKhoan={tkThuNo} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Mặc định hiện mọi khoản nợ; chọn ngày lập hoá đơn để thu hẹp. Số lần thanh toán = số khoản đã thu trên hoá đơn (tối thiểu 1, giống SalonHero); Ngày trả nợ cuối = ngày khoản thu gần nhất, chưa thu đồng nào thì là ngày lập hoá đơn. Mã phiếu thu chưa có vì SalonHero không có mã riêng cho từng khoản thu khi chuyển sang.</p>
      </>
    );
  } else {
    const { data: tong } = await db.rpc("bc_the_con_du", { p_cn: (cn ?? undefined) as string });
    const t = tong?.[0] ?? { so_the_lan: 0, so_buoi: 0, gia_tri_buoi: 0, so_the_khong_gioi_han: 0, so_the_tien: 0, du_tien: 0 };
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[{ nhan: "Buổi khách đã trả tiền mà chưa làm", so: soVN(Number(t.so_buoi)), ghiChu: `${soVN(t.so_the_lan)} thẻ liệu trình${t.so_the_khong_gioi_han ? ` (chưa kể ${soVN(t.so_the_khong_gioi_han)} thẻ không giới hạn buổi)` : ""}` }, { nhan: "Giá trị buổi chưa làm", so: tienVN(Number(t.gia_tri_buoi)), ghiChu: "doanh thu chưa ghi nhận" }, { nhan: "Số dư thẻ tiền", so: tienVN(Number(t.du_tien)), ghiChu: `${soVN(t.so_the_tien)} thẻ` }]} />
        <p className="mt-4 text-[13px] text-muc-2">Đây là khoản AMIA còn nợ khách (dịch vụ hoặc tiền trong thẻ). Chi tiết từng thẻ ở mục <Link href="/the" className="text-nhan-dam hover:underline">Thẻ liệu trình</Link>.</p>
      </>
    );
  }

  return (
    <>
      <TieuDeNoi tieuDe="Báo cáo" phu={tien ? "Số liệu tính trực tiếp từ sổ hoá đơn, sổ thu tiền, sổ thẻ và sổ kho" : "Báo cáo vận hành"}>
        {tab !== "thoi-gian-dv" && (tien || tab === "dat-lich" || tab === "danh-gia" || tab === "ti-le-chot" || tab === "ton-lo") && <a href={xuat} download aria-label={`Xuất Excel báo cáo ${tabs.find((t) => t.ma === tab)?.ten ?? ""} theo bộ lọc đang chọn`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>}
      </TieuDeNoi>
      <Tab muc={tabs} dang={tab} goc="/bao-cao" them={them} />
      {noiDung}
    </>
  );
}

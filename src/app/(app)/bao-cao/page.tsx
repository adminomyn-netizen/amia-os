import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { congNgay, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Tab } from "@/components/ui/Tab";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { LocHoaHong } from "@/components/bao-cao/LocHoaHong";
import { BaoCaoHoaHongGioiThieu, BaoCaoHoaHongThucThu } from "@/components/bao-cao/BaoCaoHoaHong";
import { LUA_CHON_THE, LUA_CHON_VAI } from "@/lib/bao-cao-hoa-hong";
import { BaoCaoDatLich, BaoCaoDungDichVu, BaoCaoThuNgan } from "@/components/bao-cao/BaoCaoMoi";
import { BaoCaoDanhGia } from "@/components/bao-cao/BaoCaoDanhGia";
import { BaoCaoTiLeChot } from "@/components/bao-cao/BaoCaoTiLeChot";
import { chonNhom, NHOM_KY } from "@/lib/bao-cao-du-lieu";
import { BaoCaoLichSuDungThe, BaoCaoTheoChiNhanh, BaoCaoTheoKhachHang } from "@/components/bao-cao/BaoCaoGap";
import { BaoCaoBanSanPham, BaoCaoChiPhiDichVu, BaoCaoNhapKho, BaoCaoNhapXuatKho, BaoCaoTonTheoLo, BaoCaoXuatKho } from "@/components/bao-cao/BaoCaoKho";
import { soDongKho } from "@/lib/bao-cao-kho";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { BangNoKhach } from "@/components/bao-cao/BangNoKhach";
import { LocKhachThe } from "@/components/bao-cao/LocKhachThe";
import { gomTheoKy, HANG_KHACH, KIEU_GOM, kieuGom, layDoanhThuChiSo, layCacLanTraNo, layThongKeDungDichVu, layNhanVienSh, laySanPhamDichVu, LOAI_MUC, LOC_LOAI, type LoaiMuc, soDongTrang, soTrang } from "@/lib/bao-cao-gap";

const TAB = [{ ma: "doanh-thu", ten: "Doanh thu theo ngày" }, { ma: "chi-nhanh", ten: "Theo chi nhánh" }, { ma: "khach-hang", ten: "Theo khách hàng" }, { ma: "thu-ngan", ten: "Theo thu ngân" }, { ma: "nhan-vien", ten: "Theo nhân viên" }, { ma: "dich-vu", ten: "Theo dịch vụ, sản phẩm" }, { ma: "dung-dich-vu", ten: "Dùng dịch vụ" }, { ma: "dung-the-ma", ten: "Thống kê sử dụng d.vụ" }, { ma: "lich-su-the", ten: "Lịch sử dùng thẻ" }, { ma: "dat-lich", ten: "Đặt lịch" }, { ma: "no", ten: "Khách còn nợ" }, { ma: "the", ten: "Thẻ còn dư" }, { ma: "hh-thuc-thu", ten: "Hoa hồng thực thu" }, { ma: "hh-gioi-thieu", ten: "Hoa hồng giới thiệu" }, { ma: "danh-gia", ten: "Đánh giá nhân viên" }, { ma: "ti-le-chot", ten: "Tỉ lệ chốt tư vấn" }, { ma: "nhap-xuat-kho", ten: "Nhập xuất kho hàng" }, { ma: "nhap-kho", ten: "Báo cáo nhập kho" }, { ma: "xuat-kho", ten: "Xuất kho bởi nhân viên" }, { ma: "ban-san-pham", ten: "Sản phẩm đã bán" }, { ma: "ton-lo", ten: "Báo cáo tồn theo lô hàng" }, { ma: "chi-phi-dv", ten: "Báo cáo chi phí dịch vụ" }];
/** Tab không có số tiền: chỉ cần quyền xem báo cáo. Các tab còn lại cần thêm quyền xem số tiền. */
const TAB_KHONG_TIEN = new Set(["doanh-thu", "dat-lich", "danh-gia", "ti-le-chot", "ton-lo"]);
/** Tab có lựa chọn gom số liệu theo kỳ, và cách gom mặc định. */
const TAB_NHOM: Record<string, "tong" | "thang"> = { "thu-ngan": "tong", "dat-lich": "thang", "dung-dich-vu": "thang" };
const Chip = ({ href, dang, ten }: { href: string; dang: boolean; ten: string }) => <Link href={href} scroll={false} aria-current={dang ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${dang ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{ten}</Link>;
const ChipNo = ({ nt, them }: { nt: "ds" | "tra"; them: string }) => (
  <nav aria-label="Khách hàng nợ" className="mb-4 flex gap-2 overflow-x-auto pb-1">
    {([["ds", "Danh sách khách hàng còn nợ"], ["tra", "Các lần trả nợ"]] as const).map(([k, t]) => <Link key={k} href={`/bao-cao?tab=no${k === "tra" ? "&nt=tra" : ""}${them}`} scroll={false} aria-current={nt === k ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${nt === k ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{t}</Link>)}
  </nav>
);
const TieuDeMuc = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-6 text-[15px] font-medium text-muc">{children}</h2>;

export default async function TrangBaoCao({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string; nhom?: string; sao?: string; q?: string; trang?: string; vai?: string; the?: string; nk?: string; gom?: string; loai?: string; lm?: string; nt?: string; hang?: string; tt?: string; lt?: string; so?: string; nhom_sp?: string; nguon?: string; ncc?: string; v?: string; dv?: string; nv?: string; ct?: string; han?: string }> }) {
  const nd = await yeuCauQuyen("baocao.xem");
  const sp = await searchParams;
  const tien = coQuyen(nd, "baocao.tien");
  const tabs = TAB.filter((t) => tien || TAB_KHONG_TIEN.has(t.ma));
  const tab = tabs.some((t) => t.ma === sp.tab) ? sp.tab! : "doanh-thu";
  const kn = khoangNgay(sp.tu, sp.den);
  // Mặc định của SalonHero: Nhập xuất kho hàng = hôm nay; Chi phí dịch vụ = 7 ngày gần nhất; còn lại từ đầu tháng.
  const macDinhNgay = !sp.tu && !sp.den;
  const tu = macDinhNgay && tab === "nhap-xuat-kho" ? kn.homNay : macDinhNgay && tab === "chi-phi-dv" ? congNgay(kn.homNay, -6) : kn.tu;
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
  const xuat = `/api/xuat/bao-cao?tab=${tab}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}${coNhom ? `&nhom=${nhom}` : ""}${tab === "hh-thuc-thu" ? `${sp.vai ? `&vai=${sp.vai}` : ""}${sp.the === "1" ? "&the=1" : ""}` : ""}${tab === "dung-the-ma" && sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${tab === "no" && sp.nt === "tra" ? `&nt=tra${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${["nhap-xuat-kho", "nhap-kho", "xuat-kho", "ban-san-pham", "ton-lo", "chi-phi-dv"].includes(tab) ? (["nhom_sp", "nguon", "ncc", "loai", "v", "dv", "nv", "tt", "han", "q"] as const).map((k) => (sp[k] ? `&${k}=${encodeURIComponent(sp[k]!)}` : "")).join("") : ""}${tab === "dich-vu" ? `${sp.loai ? `&loai=${sp.loai}` : ""}${sp.lm ? `&lm=${sp.lm}` : ""}` : ""}${tab === "doanh-thu" && sp.gom ? `&gom=${sp.gom}` : ""}${tab === "khach-hang" ? `${sp.nk ? `&nk=${sp.nk}` : ""}${sp.hang ? `&hang=${encodeURIComponent(sp.hang)}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}${tab === "lich-su-the" ? `${sp.tt ? `&tt=${encodeURIComponent(sp.tt)}` : ""}${sp.lt ? `&lt=${sp.lt}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}` : ""}`;
  let noiDung: React.ReactNode;

  const dsChiNhanh = nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  if (tab === "nhap-xuat-kho") {
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
    noiDung = <>{lc}<BaoCaoTheoChiNhanh tu={tu} den={den} cn={cn} /></>;
  } else if (tab === "khach-hang") {
    const { data: nhomKh } = await db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten");
    const loaiK = { tu, den, cn, nhom: sp.nk || undefined, hang: sp.hang || undefined, q: sp.q || undefined, trang: soTrang(sp.trang), so: soDongTrang(sp.so) };
    noiDung = <>
      <LocKhachThe kieu="khach" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} nhomKhach={(nhomKh ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))} nhom={sp.nk} hang={sp.hang} cacHang={HANG_KHACH.map((h) => ({ gia_tri: h, nhan: `Hạng ${h}` }))} q={sp.q} so={loaiK.so} />
      <BaoCaoTheoKhachHang loc={loaiK} xemSdt={coQuyen(nd, "khach.xem")} chiNhanhVinh={(dsCn ?? []).find((c) => c.ten === "AMIA Vinh")?.id} />
    </>;
  } else if (tab === "lich-su-the") {
    const loaiT = { tu, den, cn, q: sp.q || undefined, tenThe: sp.tt || undefined, loai: sp.lt || undefined, trang: soTrang(sp.trang), so: soDongTrang(sp.so) };
    noiDung = <>
      <LocKhachThe kieu="the" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} loai={sp.lt} q={sp.q} tenThe={sp.tt} so={loaiT.so} />
      <BaoCaoLichSuDungThe loc={loaiT} xemSdt={coQuyen(nd, "khach.xem")} />
    </>;
  } else if (tab === "dung-the-ma") {
    const quaDai = congNgay(tu, 93) < den, tuDung = quaDai ? congNgay(den, -93) : tu;
    const tatCa = await layThongKeDungDichVu(db, tuDung, den, cn, sp.q || undefined);
    const so = 30, trang = Math.min(soTrang(sp.trang), Math.max(1, Math.ceil(tatCa.length / so)));
    const hien = tatCa.slice((trang - 1) * so, trang * so);
    const xemSdt = coQuyen(nd, "khach.xem");
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
        <Bang duLieu={hien} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
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
  } else if (tab === "ti-le-chot") {
    noiDung = <>{lc}<BaoCaoTiLeChot loc={{ tu, den, cn }} xemTien={tien} /></>;
  } else if (tab === "hh-thuc-thu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} vai={sp.vai} cacVai={LUA_CHON_VAI} the={sp.the} cacThe={LUA_CHON_THE} /><BaoCaoHoaHongThucThu loc={{ tu, den, cn }} vai={sp.vai} gomThe={sp.the === "1"} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "hh-gioi-thieu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} /><BaoCaoHoaHongGioiThieu loc={{ tu, den, cn }} xemSdt={coQuyen(nd, "khach.xem")} /></>;
  } else if (tab === "thu-ngan") {
    noiDung = <>{lc}<BaoCaoThuNgan loc={loc} /></>;
  } else if (tab === "dat-lich") {
    noiDung = <>{lc}<BaoCaoDatLich loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "dung-dich-vu") {
    noiDung = <>{lc}<BaoCaoDungDichVu loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "doanh-thu") {
    const gom = kieuGom(sp.gom);
    const [{ data }, cs] = await Promise.all([db.rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn as string }), layDoanhThuChiSo(db, tu, den, cn)]);
    const ngayRows = (data ?? []).map((r) => ({ ngay: r.ngay, so_don: Number(r.so_don), doanh_thu: Number(r.doanh_thu), thu_don_moi: Number(r.thu_don_moi), thu_no_cu: Number(r.thu_no_cu), thuc_thu: Number(r.thuc_thu), tien_mat: Number(r.tien_mat), chuyen_khoan: Number(r.chuyen_khoan), quet_the: Number(r.quet_the), tru_the_tien: Number(r.tru_the_tien), no_moi: Number(r.no_moi), so_buoi: Number(r.so_buoi), doanh_thu_buoi: Number(r.doanh_thu_buoi) }));
    const ds = gomTheoKy(ngayRows.filter((r) => r.so_don > 0 || r.thuc_thu !== 0 || r.so_buoi > 0 || r.tru_the_tien !== 0), gom, ["so_don", "doanh_thu", "thu_don_moi", "thu_no_cu", "thuc_thu", "tien_mat", "chuyen_khoan", "quet_the", "tru_the_tien", "no_moi", "so_buoi", "doanh_thu_buoi"]);
    const tongBuoi = ngayRows.reduce((t, r) => t + r.so_buoi, 0), tongDtBuoi = ngayRows.reduce((t, r) => t + r.doanh_thu_buoi, 0);
    const linkGom = (g: string) => `/bao-cao?tab=doanh-thu&gom=${g}${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
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
          { nhan: "Tổng khoản chi", so: tienVN(0), ghiChu: "app chưa ghi khoản chi gắn với đơn" },
          { nhan: "Doanh thu buổi đã làm", so: tienVN(tongDtBuoi), ghiChu: `${soVN(tongBuoi)} buổi (phần thêm của AMIA OS)` },
        ]} />
        <nav aria-label="Gom số liệu theo" className="mb-3 mt-6 flex gap-2 overflow-x-auto pb-1">
          {KIEU_GOM.map((k) => (
            <Link key={k.ma} href={linkGom(k.ma)} scroll={false} aria-current={gom === k.ma ? "page" : undefined} className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${gom === k.ma ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{k.ten}</Link>
          ))}
        </nav>
        <Bang duLieu={ds} khoa={(r) => r.nhan} trong="Không có phát sinh trong khoảng này."
          cot={[
            { nhan: "Thời gian", hienThi: (r) => r.nhan }, { nhan: "Đơn mới", hienThi: (r) => r.so_don, phai: true }, { nhan: "Doanh thu", hienThi: (r) => tienVN(r.doanh_thu), phai: true },
            { nhan: "Thu đơn mới", hienThi: (r) => tienVN(r.thu_don_moi), phai: true }, { nhan: "Thu nợ cũ", hienThi: (r) => tienVN(r.thu_no_cu), phai: true }, { nhan: "Thực thu", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.thuc_thu)}</span>, phai: true },
            { nhan: "Tiền mặt", hienThi: (r) => tienVN(r.tien_mat), phai: true }, { nhan: "Chuyển khoản", hienThi: (r) => tienVN(r.chuyen_khoan), phai: true }, { nhan: "Quẹt thẻ", hienThi: (r) => tienVN(r.quet_the), phai: true },
            { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.tru_the_tien), phai: true }, { nhan: "Nợ mới", hienThi: (r) => tienVN(r.no_moi), phai: true }, { nhan: "Buổi làm", hienThi: (r) => r.so_buoi, phai: true },
          ]} />
        <p className="mt-3 text-[12px] text-muc-3">Doanh thu = tổng đơn hoàn thành như SalonHero (tiền hàng − giảm giá + VAT + phụ phí + tip) trừ phần thanh toán bằng thẻ tiền. Thực thu = tiền mặt + chuyển khoản + quẹt thẻ; trừ thẻ tiền không phải tiền vào quỹ vì tiền đã vào lúc bán thẻ. “Bán mới” = thu cùng ngày với đơn, “thu nợ” = thu sau ngày đơn. Nợ mới chưa thu = nợ còn lại của các đơn trong kỳ. Gom Tuần tính từ thứ Hai.</p>
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
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có đơn nào có gán người hưởng trong khoảng này."
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
    const ds = lm ? ds1.filter((r) => r.loai === lm) : ds1;
    const tong = (k: "sau" | "truThe" | "thucNhan", loai?: LoaiMuc) => ds1.filter((r) => !loai || r.loai === loai).reduce((t, r) => t + r[k], 0);
    const goc = `/bao-cao?tab=dich-vu${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
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
        <Bang duLieu={ds} khoa={(r) => `${r.loai}-${r.ten}`} trong="Chưa bán gì trong khoảng này."
          cot={[
            { nhan: "Tên dịch vụ", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{r.ten}</span><span className="block text-[12px] text-muc-3">{r.ma}</span></span> },
            { nhan: "Số lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Trước giảm giá", hienThi: (r) => tienVN(r.truoc), phai: true }, { nhan: "Sau giảm giá", hienThi: (r) => tienVN(r.sau), phai: true },
            { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.truThe), phai: true }, { nhan: "Thực nhận", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.thucNhan)}</span>, phai: true },
          ]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Một dòng = một mặt hàng theo loại. Trước giảm giá = đơn giá × số lượng; Sau giảm giá = thành tiền đã chia giảm giá cả đơn; Trừ thẻ tiền = phần đơn thanh toán bằng thẻ tiền, chia theo doanh số từng dòng; Thực nhận = Sau giảm giá − Trừ thẻ tiền. Dùng thẻ là dịch vụ làm bằng thẻ liệu trình (không thu tiền lúc làm). Nút “Xem” danh sách khách của SalonHero chưa có.</p>
      </>
    );
  } else if (tab === "no" && sp.nt === "tra") {
    const so = 20, trang = soTrang(sp.trang);
    const { rows, tong } = await layCacLanTraNo(db, { tu, den, cn, q: sp.q || undefined, trang, so });
    const xemSdt = coQuyen(nd, "khach.xem");
    const goc = { tab: "no", nt: "tra", tu, den, cn: sp.cn, q: sp.q };
    noiDung = (
      <>
        <ChipNo nt="tra" them={them} />
        {lc}
        <form method="get" action="/bao-cao" className="mb-5 flex gap-2">
          <input type="hidden" name="tab" value="no" /><input type="hidden" name="nt" value="tra" /><input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
          {sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm theo mã đơn hàng, tên khách hàng, SĐT" aria-label="Tìm theo mã đơn hàng, tên khách hàng, SĐT" className={O_NHAP} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
        <HangChiSo muc={[{ nhan: "Tổng tiền đã trả nợ", so: tienVN(tong.tien), ghiChu: `${soVN(tong.dong)} lần trả` }]} />
        <div className="mt-6"><Bang duLieu={rows} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Ngày trả nợ", hienThi: (r) => ngayVN(r.ngay) },
            { nhan: "Khách hàng", chinh: true, hienThi: (r) => <span className="block">{r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : <span className="text-muc">{r.khach}</span>}<span className="block text-[12px] text-muc-3">{xemSdt ? r.dienThoai : r.dienThoai ? "•••" : ""}</span></span> },
            { nhan: "Mã đơn hàng", hienThi: (r) => <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.maHd}</Link> },
            { nhan: "Chi nhánh", hienThi: (r) => r.chiNhanh }, { nhan: "Tổng số tiền hóa đơn", hienThi: (r) => tienVN(r.tongHd), phai: true },
            { nhan: "Số tiền trả", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.soTien)}</span>, phai: true }, { nhan: "Loại thanh toán", hienThi: (r) => r.phuongThuc }, { nhan: "Người thu", hienThi: (r) => r.nguoiThu },
          ]} /></div>
        <ThanhTrang trang={trang} tong={tong.dong} moi={so} gan={(t) => `/bao-cao?${new URLSearchParams(Object.entries({ ...goc, trang: t ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Một dòng = một lần khách trả nợ (tiền mặt, chuyển khoản, quẹt thẻ thu sau ngày lập đơn) trong khoảng ngày đã chọn. Giờ thu và mã phiếu thu của SalonHero chưa được chuyển sang; nút Trả nợ để thu nợ ở trang chi tiết hoá đơn.</p>
      </>
    );
  } else if (tab === "no") {
    let q = db.from("hoa_don").select("id, ma, ngay_hd, tong_phai_thu, da_thu, con_no, khach_id").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd");
    if (cn) q = q.eq("chi_nhanh_id", cn);
    const { data } = await q;
    const ids = [...new Set((data ?? []).map((d) => d.khach_id).filter(Boolean))] as string[];
    const { data: ks } = ids.length ? await db.from("khach_hang").select("id, ho_ten, dien_thoai").in("id", ids) : { data: [] };
    const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
    noiDung = (
      <>
        <ChipNo nt="ds" them={them} />
        {lc}
        <HangChiSo muc={[{ nhan: "Tổng nợ", so: tienVN((data ?? []).reduce((s, r) => s + Number(r.con_no), 0)) }, { nhan: "Số hoá đơn nợ", so: String((data ?? []).length) }]} />
        <div className="mt-6"><BangNoKhach choPhepThu={coQuyen(nd, "no.thu")} homNay={kn.homNay}
          dong={(data ?? []).map((r) => ({ id: r.id, ma: r.ma, khachId: r.khach_id, khach: tenK.get(r.khach_id ?? "")?.ho_ten ?? "", dienThoai: tenK.get(r.khach_id ?? "")?.dien_thoai ?? "", ngay: r.ngay_hd, tong: Number(r.tong_phai_thu), daThu: Number(r.da_thu), conNo: Number(r.con_no) }))} /></div>
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
      <TieuDeTrang tieuDe="Báo cáo" phu={tien ? "Số liệu tính trực tiếp từ sổ hoá đơn, sổ thu tiền, sổ thẻ và sổ kho" : "Báo cáo vận hành"}>
        {(tien || tab === "dat-lich" || tab === "danh-gia" || tab === "ti-le-chot" || tab === "ton-lo") && <a href={xuat} download aria-label={`Xuất Excel báo cáo ${tabs.find((t) => t.ma === tab)?.ten ?? ""} theo bộ lọc đang chọn`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>}
      </TieuDeTrang>
      <Tab muc={tabs} dang={tab} goc="/bao-cao" them={them} />
      {noiDung}
    </>
  );
}

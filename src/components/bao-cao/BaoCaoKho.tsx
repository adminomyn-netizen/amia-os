import Link from "next/link";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { LocKho } from "@/components/bao-cao/LocKho";
import type { LuaChon } from "@/components/ui/Chon";
import { layBanSanPham, layChiPhiDichVu, layChiPhiDichVuCt, layNhapKho, layNhapXuatKho, layTonTheoLo, layXuatKho, HAN_LO, hanLo, LOAI_XUAT, NGUON_NHAP, nguonNhap, TINH_TRANG_LO, tinhTrangLo } from "@/lib/bao-cao-kho";

/** Sáu báo cáo kho kiểu SalonHero (máy chủ tính, trang chỉ hiển thị). Nhãn, cột và thứ tự lấy từ SalonHero #/report/inventory, import-inventory, export-inventory, sell-product, inventory-batch-list, service-consumption-report. */
const GhiChu = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[12px] leading-relaxed text-muc-3">{children}</p>;
const NUT = "shrink-0 rounded-nho px-3 py-1.5 text-[13px]";
const dangChon = "bg-nhan text-white", khongChon = "border border-vien-dam text-muc-2 hover:bg-giay-tram";
const href = (goc: Record<string, string | undefined>) => `/bao-cao?${new URLSearchParams(Object.entries(goc).filter((e): e is [string, string] => !!e[1])).toString()}`;
const gan = (goc: Record<string, string | undefined>) => (trang: number | undefined) => href({ ...goc, trang: trang ? String(trang) : undefined });
const Tin = ({ ten, ma }: { ten: string; ma?: string | null }) => <span className="block"><span className="text-muc">{ten}</span>{ma && <span className="block text-[12px] text-muc-3">{ma}</span>}</span>;
const Lo = ({ lo, han }: { lo?: string | null; han?: string | null }) => (lo || han ? <span className="block">{lo ?? "—"}{han && <span className="block text-[12px] text-muc-3">HSD {ngayVN(han)}</span>}</span> : <span className="text-muc-3">—</span>);
const Phan = ({ trang, tong, moi, goc }: { trang: number; tong: number; moi: number; goc: Record<string, string | undefined> }) => (
  <>
    {tong <= moi && <p className="mt-4 text-[13px] text-muc-3">Hiện {tong ? 1 : 0} đến {tong} của {tong.toLocaleString("vi-VN")} dữ liệu</p>}
    <ThanhTrang trang={trang} tong={tong} moi={moi} gan={gan(goc)} />
  </>
);
/** Nút Tổng quan / Chi tiết như SalonHero (mặc định Chi tiết). */
const NutXem = ({ goc, tq }: { goc: Record<string, string | undefined>; tq: boolean }) => (
  <nav aria-label="Kiểu xem" className="mb-3 flex gap-2">
    <Link href={href({ ...goc, v: "tq", trang: undefined })} scroll={false} aria-current={tq ? "page" : undefined} className={`${NUT} ${tq ? dangChon : khongChon}`}>Tổng quan</Link>
    <Link href={href({ ...goc, v: undefined, trang: undefined })} scroll={false} aria-current={!tq ? "page" : undefined} className={`${NUT} ${!tq ? dangChon : khongChon}`}>Chi tiết</Link>
  </nav>
);
const NhomNut = ({ ds, khoa, dang, goc }: { ds: { ma: string; ten: string }[]; khoa: "tt" | "han"; dang: string; goc: Record<string, string | undefined> }) => (
  <span className="flex gap-2">{ds.map((x, i) => <Link key={x.ma} href={href({ ...goc, [khoa]: i === 0 ? undefined : x.ma, trang: undefined })} scroll={false} aria-current={dang === x.ma ? "page" : undefined} className={`${NUT} ${dang === x.ma ? dangChon : khongChon}`}>{x.ten}</Link>)}</span>
);
type Chung = { tu: string; den: string; cn?: string; q?: string; trang: number; chiNhanh?: LuaChon[] };

export async function BaoCaoNhapXuatKho({ l, nhom, so }: { l: Chung; nhom?: string; so: number }) {
  const db = sb();
  const [{ rows, tong }, { data: sp }] = await Promise.all([layNhapXuatKho(db, { ...l, nhom, so }), db.from("san_pham").select("nhom").eq("ban_le", true)]);
  const cacNhom = [...new Set((sp ?? []).map((s) => s.nhom).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "vi"));
  const goc = { tab: "nhap-xuat-kho", tu: l.tu, den: l.den, cn: l.cn, nhom_sp: nhom, q: l.q, so: so === 10 ? undefined : String(so) };
  return (
    <>
      <LocKho tu={l.tu} den={l.den} chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm" so={so} loc={[{ khoa: "nhom_sp", nhan: "Nhóm sản phẩm", giaTri: nhom ?? "", luaChon: [{ gia_tri: "", nhan: "Tất cả nhóm" }, ...cacNhom.map((g) => ({ gia_tri: g, nhan: g }))] }]} />
      <HangChiSo muc={[{ nhan: "Tổng tồn kho đầu kỳ", so: soVN(tong.dau) }, { nhan: "Tổng tồn kho cuối kỳ", so: soVN(tong.cuoi) }, { nhan: "Tổng nhập", so: soVN(tong.nhap) }, { nhan: "Tổng xuất", so: soVN(tong.xuat) }]} />
      <h2 className="mb-3 mt-6 text-[15px] font-medium text-muc">Bảng số liệu</h2>
      <Bang duLieu={rows} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào"
        cot={[
          { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> },
          { nhan: "Giá bán", hienThi: (r) => soVN(r.giaBan), phai: true }, { nhan: "Giá vốn", hienThi: (r) => soVN(r.giaVon), phai: true }, { nhan: "Giá nhập bình quân", hienThi: (r) => soVN(r.giaNhapTb), phai: true },
          { nhan: "Tồn kho đầu kỳ", hienThi: (r) => soVN(r.dau), phai: true }, { nhan: "Tổng nhập", hienThi: (r) => soVN(r.nhap), phai: true }, { nhan: "Tổng xuất", hienThi: (r) => soVN(r.xuat), phai: true },
          { nhan: "Nhập từ chuyển kho", hienThi: (r) => soVN(r.nhapCd), phai: true }, { nhan: "Xuất chuyển kho", hienThi: (r) => soVN(r.xuatCd), phai: true },
          { nhan: "Tồn kho cuối kỳ", hienThi: (r) => <span className={`font-medium ${r.cuoi < 0 ? "text-canh-bao" : "text-muc"}`}>{soVN(r.cuoi)}</span>, phai: true },
        ]} />
      <Phan trang={l.trang} tong={tong.dong} moi={so} goc={goc} />
      <GhiChu>Mỗi dòng là một sản phẩm bán lẻ (như SalonHero). Tồn đầu kỳ = tồn trước ngày bắt đầu, kể cả số dư đầu chuyển từ SalonHero (không tính vào Tổng nhập); Tổng nhập = hàng nhập kho trong kỳ; Tổng xuất = bán lẻ, cấp theo phiếu, huỷ, trả nhà cung cấp, kiểm kê / điều chỉnh giảm trong kỳ; chuyển kho tính riêng hai cột sau. Tồn cuối kỳ = đầu kỳ + nhập − xuất + nhập chuyển − xuất chuyển. AMIA OS chặn tồn âm nên số có thể khác SalonHero (SalonHero đang cho tồn âm); Giá vốn = giá nhập gần nhất, Giá nhập bình quân = trung bình có trọng số các lần nhập có ghi giá.</GhiChu>
    </>
  );
}

export async function BaoCaoNhapKho({ l, nguon, ncc, tq }: { l: Chung; nguon?: string; ncc?: string; tq: boolean }) {
  const db = sb();
  const nguonDung = nguonNhap(nguon);
  const [{ rows, tong }, { data: dsNcc }] = await Promise.all([layNhapKho(db, { ...l, nguon, ncc, tong: tq }), db.from("nha_cung_cap").select("id, ten").eq("hoat_dong", true).order("ten")]);
  const goc = { tab: "nhap-kho", tu: l.tu, den: l.den, cn: l.cn, nguon, ncc, q: l.q, v: tq ? "tq" : undefined };
  return (
    <>
      <LocKho tu={l.tu} den={l.den} chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm"
        loc={[{ khoa: "nguon", nhan: "Nhập từ", giaTri: nguonDung === "" ? "tat_ca" : nguonDung, luaChon: NGUON_NHAP }, { khoa: "ncc", nhan: "Nhà cung cấp", giaTri: ncc ?? "", luaChon: [{ gia_tri: "", nhan: "Tất cả nhà cung cấp" }, ...(dsNcc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] }]} />
      <NutXem goc={goc} tq={tq} />
      <div className="mb-4"><HangChiSo muc={[{ nhan: "Tổng chi phí", so: tienVN(tong.chiPhi) }]} /></div>
      {tq ? (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[{ nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Nhóm", hienThi: (r) => r.nhom ?? "" }, { nhan: "Số Lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Tổng tiền", hienThi: (r) => tienVN(r.tongTien), phai: true }]} />
      ) : (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Lô hàng", hienThi: (r) => <Lo lo={r.lo} han={r.han} /> }, { nhan: "Nhóm", hienThi: (r) => r.nhom ?? "" },
            { nhan: "Mã phiếu nhập", hienThi: (r) => r.maPhieu }, { nhan: "Thời gian", hienThi: (r) => (r.luc ? ngayGioVN(r.luc) : "") }, { nhan: "Nhà cung cấp", hienThi: (r) => r.ncc ?? "" },
            { nhan: "Giá nhập", hienThi: (r) => soVN(r.giaNhap), phai: true }, { nhan: "Số lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Giảm giá", hienThi: (r) => soVN(r.giamGia), phai: true },
            { nhan: "Tổng tiền", hienThi: (r) => <span className="font-medium text-muc">{soVN(r.tongTien)}</span>, phai: true },
          ]} />
      )}
      <Phan trang={l.trang} tong={tong.dong} moi={10} goc={goc} />
      <GhiChu>Một dòng = một lần nhập kho trong khoảng ngày. “Nhà cung cấp” lấy từ đơn mua đã nhận hàng; hàng nhập tay không có đơn mua thì để trống. Mã phiếu: mã đơn mua, mã phiếu chuyển kho, hoặc NK + số sổ kho nếu nhập tay. AMIA OS chưa có giảm giá trên phiếu nhập nên cột Giảm giá luôn 0. Số dư đầu chuyển từ SalonHero không tính là nhập.</GhiChu>
    </>
  );
}

export async function BaoCaoXuatKho({ l, loai, tq }: { l: Chung; loai?: string; tq: boolean }) {
  const db = sb();
  const { rows, tong } = await layXuatKho(db, { ...l, loai, tong: tq });
  const goc = { tab: "xuat-kho", tu: l.tu, den: l.den, cn: l.cn, loai, q: l.q, v: tq ? "tq" : undefined };
  return (
    <>
      <LocKho tu={l.tu} den={l.den} chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm" loc={[{ khoa: "loai", nhan: "Phân loại", giaTri: loai ?? "", luaChon: [{ gia_tri: "", nhan: "Tất cả phân loại" }, ...LOAI_XUAT] }]} />
      <NutXem goc={goc} tq={tq} />
      {tq ? (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[{ nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Nhóm", hienThi: (r) => r.nhom ?? "" }, { nhan: "Số Lượng", hienThi: (r) => soVN(r.soLuong), phai: true }]} />
      ) : (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Lô hàng", hienThi: (r) => <Lo lo={r.lo} han={r.han} /> }, { nhan: "Nhóm", hienThi: (r) => r.nhom ?? "" },
            { nhan: "Mã phiếu xuất", hienThi: (r) => r.maPhieu }, { nhan: "Thời gian", hienThi: (r) => (r.luc ? ngayGioVN(r.luc) : "") }, { nhan: "Người nhận", hienThi: (r) => r.nguoiNhan ?? "" }, { nhan: "Phân loại", hienThi: (r) => r.phanLoai ?? "" },
            { nhan: "Giá vốn", hienThi: (r) => soVN(r.giaVon), phai: true }, { nhan: "Giá bình quân/sp", hienThi: (r) => soVN(r.giaTb), phai: true }, { nhan: "Số lượng", hienThi: (r) => <span className="font-medium text-muc">{soVN(r.soLuong)}</span>, phai: true },
          ]} />
      )}
      <Phan trang={l.trang} tong={tong.dong} moi={10} goc={goc} />
      <GhiChu>Một dòng = một lần xuất kho thủ công (không gồm bán lẻ — xem Báo cáo bán sản phẩm — và không gồm chuyển kho giữa chi nhánh). Phân loại theo nguồn: cấp vật tư theo phiếu và trả lại kho = Xuất tiêu hao; huỷ / hao hụt = Xuất huỷ vì hỏng hóc; trả nhà cung cấp = Xuất trả hàng NCC; kiểm kê / điều chỉnh giảm = Xuất cân bằng kho; xuất khẩn cấp = Xuất khác. Các phân loại còn lại của SalonHero (kho nội bộ, cho/tặng, đóng gói, đào tạo, bán học viên, hàng SVC) AMIA OS chưa có luồng riêng nên luôn trống. Giá vốn = số lượng × giá bình quân/sp; Người nhận = người nhận vật tư trên phiếu cấp.</GhiChu>
    </>
  );
}

export async function BaoCaoBanSanPham({ l, tq }: { l: Chung; tq: boolean }) {
  const { rows, tong } = await layBanSanPham(sb(), { ...l, tong: tq });
  const goc = { tab: "ban-san-pham", tu: l.tu, den: l.den, cn: l.cn, q: l.q, v: tq ? "tq" : undefined };
  const tl = (lai: number, dt: number) => (dt ? `${((lai / dt) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : "0,00 %");
  return (
    <>
      <LocKho tu={l.tu} den={l.den} chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm" />
      <HangChiSo muc={[{ nhan: "Lợi nhuận", so: tienVN(tong.loiNhuan) }, { nhan: "Tổng nhập", so: tienVN(tong.nhap) }, { nhan: "Tổng doanh thu", so: tienVN(tong.doanhThu) }]} />
      <h2 className="mb-3 mt-6 text-[15px] font-medium text-muc">Bảng số liệu (Đã trừ giảm giá trên tổng hóa đơn)</h2>
      <NutXem goc={goc} tq={tq} />
      {tq ? (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[{ nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "S.Lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Doanh thu", hienThi: (r) => tienVN(r.doanhThu), phai: true },
            { nhan: "Lợi nhuận", hienThi: (r) => tienVN(r.loiNhuan), phai: true }, { nhan: "Lợi nhuận %", hienThi: (r) => tl(r.loiNhuan, r.doanhThu), phai: true }]} />
      ) : (
        <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
          cot={[
            { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Lô hàng", hienThi: () => <span className="text-muc-3">—</span> },
            { nhan: "Mã HĐ", hienThi: (r) => (r.hoaDonId ? <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.maHd}</Link> : r.maHd) }, { nhan: "Thời gian", hienThi: (r) => (r.luc ? ngayGioVN(r.luc) : "") },
            { nhan: "Giá/1 sp", hienThi: (r) => soVN(r.gia1sp), phai: true }, { nhan: "S.Lượng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Giá sau khi giảm *", hienThi: (r) => soVN(r.giaSau), phai: true },
            { nhan: "Doanh thu", hienThi: (r) => <span className="font-medium text-muc">{soVN(r.doanhThu)}</span>, phai: true }, { nhan: "Giá vốn", hienThi: (r) => soVN(r.giaVon), phai: true },
            { nhan: "Lợi nhuận", hienThi: (r) => soVN(r.loiNhuan), phai: true }, { nhan: "Lợi nhuận %", hienThi: (r) => tl(r.loiNhuan, r.doanhThu), phai: true },
          ]} />
      )}
      <Phan trang={l.trang} tong={tong.dong} moi={10} goc={goc} />
      <GhiChu>* Giá sau khi giảm = doanh thu dòng ÷ số lượng, đã chia phần giảm giá trên cả hóa đơn (cùng cách tính với Báo cáo Theo sản phẩm / dịch vụ). Giá vốn = giá nhập gần nhất của sản phẩm (chưa có thì 0, lợi nhuận = 100 %); Tổng nhập = giá vốn × số lượng của các dòng đã bán; Lợi nhuận = Doanh thu − Tổng nhập. Cột Lô hàng chưa có vì AMIA OS chưa gắn lô vào dòng bán.</GhiChu>
    </>
  );
}

export async function BaoCaoTonTheoLo({ l, tt, han }: { l: Omit<Chung, "tu" | "den">; tt?: string; han?: string }) {
  const { rows, tong } = await layTonTheoLo(sb(), { cn: l.cn, q: l.q, tt, han, trang: l.trang });
  const ttDung = tinhTrangLo(tt), hanDung = hanLo(han);
  const goc = { tab: "ton-lo", cn: l.cn, q: l.q, tt: ttDung === "con_ton" ? undefined : ttDung, han: hanDung === "con_han" ? undefined : hanDung };
  return (
    <>
      <LocKho chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm theo mã / tên sản phẩm" />
      <div className="mb-4 flex flex-wrap gap-3"><NhomNut ds={TINH_TRANG_LO} khoa="tt" dang={ttDung} goc={goc} /><NhomNut ds={HAN_LO} khoa="han" dang={hanDung} goc={goc} /></div>
      <Bang duLieu={rows} khoa={(r) => r.khoa} trong="Không tìm thấy kết quả nào"
        cot={[
          { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Lô hàng", hienThi: (r) => r.lo ?? <span className="text-muc-3">—</span> },
          { nhan: "Ngày hết hạn", hienThi: (r) => (r.han ? ngayVN(r.han) : <span className="text-muc-3">—</span>) },
          { nhan: "Số lượng nhập", hienThi: (r) => soVN(r.nhap), phai: true }, { nhan: "Số lượng xuất", hienThi: (r) => soVN(r.xuat), phai: true }, { nhan: "Số lượng tồn", hienThi: (r) => <span className="font-medium text-muc">{soVN(r.ton)}</span>, phai: true },
        ]} />
      <Phan trang={l.trang} tong={tong.dong} moi={10} goc={goc} />
      <GhiChu>Chỉ gồm hàng nhập có ghi số lô hoặc hạn dùng. Số xuất của lô tính theo thứ tự hết hạn sớm xuất trước (FEFO) nên tồn các lô cộng lại khớp tồn kho thật. Sắp hết = còn ít hơn hoặc bằng mức tồn tối thiểu đặt cho sản phẩm; chọn một mục ở mỗi nhóm nút như SalonHero. Chưa có lô nào được nhập thì bảng trống.</GhiChu>
    </>
  );
}

export async function BaoCaoChiPhiDichVu({ l, dv, nv, ct }: { l: Chung; dv?: string; nv?: string; ct?: string }) {
  const db = sb();
  const [{ rows, tong }, { data: dsDv }, { data: dsNv }] = await Promise.all([
    layChiPhiDichVu(db, { ...l, dv, nv }),
    db.from("dich_vu").select("id, ten").eq("hoat_dong", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
  ]);
  const goc = { tab: "chi-phi-dv", tu: l.tu, den: l.den, cn: l.cn, dv, nv, q: l.q };
  const chiTiet = ct ? await layChiPhiDichVuCt(db, { tu: l.tu, den: l.den, cn: l.cn, sp: ct, dv, nv }) : [];
  const tenCt = rows.find((r) => r.id === ct)?.ten;
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2"><Link href="/dinh-muc" className={`${NUT} ${khongChon}`}>Cài đặt</Link></div>
      <HangChiSo muc={[{ nhan: "Số lượng sản phẩm", so: soVN(tong.dong) }, { nhan: "Tổng chi phí khấu hao", so: tienVN(tong.chiPhi) }]} />
      <div className="mt-5"><LocKho tu={l.tu} den={l.den} chiNhanh={l.chiNhanh} cn={l.cn} q={l.q} nhanTim="Tìm kiếm theo mã / tên sản phẩm"
        loc={[{ khoa: "dv", nhan: "Lọc theo dịch vụ", giaTri: dv ?? "", luaChon: [{ gia_tri: "", nhan: "Lọc theo dịch vụ" }, ...(dsDv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }))] },
          { khoa: "nv", nhan: "Lọc theo nhân viên", giaTri: nv ?? "", luaChon: [{ gia_tri: "", nhan: "Lọc theo nhân viên" }, ...(dsNv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] }]} /></div>
      <Bang duLieu={rows} khoa={(r) => `${r.id}-${r.cnId}`} trong="Không có dữ liệu"
        cot={[
          { nhan: "Tên sản phẩm", chinh: true, hienThi: (r) => <Tin ten={r.ten} ma={r.ma} /> }, { nhan: "Số lượng dùng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Số lần dùng", hienThi: (r) => soVN(r.soLan), phai: true },
          { nhan: "Chi phí khấu hao", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.chiPhi)}</span>, phai: true }, { nhan: "Tại chi nhánh", hienThi: (r) => r.chiNhanh },
          { nhan: "Thao tác", hienThi: (r) => <Link href={href({ ...goc, trang: l.trang > 1 ? String(l.trang) : undefined, ct: r.id })} scroll={false} className="text-[13px] font-medium text-nhan-dam hover:underline">Chi tiết</Link> },
        ]} />
      <Phan trang={l.trang} tong={tong.dong} moi={10} goc={goc} />
      {ct && (
        <section className="mt-6" aria-label="Chi tiết dùng vật tư">
          <h2 className="mb-3 text-[15px] font-medium text-muc">Chi tiết: {tenCt ?? "sản phẩm"}</h2>
          <Bang duLieu={chiTiet} khoa={(r) => r.id} trong="Không có dữ liệu"
            cot={[{ nhan: "Mã phiếu cấp", hienThi: (r) => r.ma }, { nhan: "Ngày làm", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Dịch vụ", chinh: true, hienThi: (r) => r.dichVu }, { nhan: "Người làm", hienThi: (r) => r.nguoiLam ?? "" },
              { nhan: "Số lượng dùng", hienThi: (r) => soVN(r.soLuong), phai: true }, { nhan: "Chi phí khấu hao", hienThi: (r) => tienVN(r.chiPhi), phai: true }]} />
        </section>
      )}
      <GhiChu>Số vật tư dùng thật của các ca đã làm xong (phiếu cấp vật tư đã làm hoặc đã đối chiếu) = số cấp − số trả lại; chi phí = số dùng × giá vốn lúc cấp. SalonHero tính theo công thức chi phí gắn dịch vụ, AMIA OS tính theo phiếu cấp thật nên không cần nút “Tính lại chi phí”. Nút Cài đặt mở Công thức chi phí của dịch vụ. Chưa có phiếu cấp nào đã làm thì bảng trống.</GhiChu>
    </>
  );
}

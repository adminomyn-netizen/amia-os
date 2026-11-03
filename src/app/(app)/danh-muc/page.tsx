import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import Link from "next/link";
import { sb } from "@/lib/db";
import { tienVN, soVN, homNayHCM, boDau } from "@/lib/dinh-dang";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type GiaTri, type Truong } from "@/components/ui/BieuMau";
import { LocNhomDanhMuc } from "@/components/cai-dat/LocNhomDanhMuc";
import { NHAN_VAN_DE, khoaTen, vanDeSanPham } from "@/lib/san-pham";
import { NutDoiAnh } from "@/components/danh-muc/NutDoiAnh";
import { NutNhapExcel } from "@/components/danh-muc/NutNhapExcel";
import { LocThemDanhMuc } from "@/components/danh-muc/LocThemDanhMuc";
import { NutXoaNhieu, OChonDong } from "@/components/danh-muc/NutXoaNhieu";
import { NutTuyChonGia, type TuyChonGia } from "@/components/danh-muc/NutTuyChonGia";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";
import type { LuaChon } from "@/components/ui/Chon";
import { nhapExcelDichVu, nhapExcelGoiThe, nhapExcelSanPham } from "./nhap-excel";
import { CHE_DO_SUA_LAN, CHE_DO_SUA_TIEN, DOI_TUONG, DON_VI_DICH_VU, DON_VI_DUNG_TICH, GIO_CHON, HAN_TINH_TU, HINH_THUC_NHAP, MAU_THE, NOI_HIEN_THI, PHUT_CHON, THOI_GIAN_1_LAN, VAT_CHON, laKhongGioiHan, nhanHanThe, nhanThoiLuong, tachGioPhut, urlAnhDanhMuc, vatThanhChon } from "@/lib/danh-muc";
import { chuyenNhomDichVu, datAnhDanhMuc, luuChiNhanh, luuChoLam, luuDatLichOnline, luuDichVu, luuGoiThe, luuNhomDichVu, luuNhomThe, luuSanPham, luuTuyChonGia, xoaChiNhanh, xoaChoLam, xoaDichVu, xoaGoiThe, xoaNhieuGoiThe, xoaNhomDichVu, xoaNhomThe, xoaSanPham } from "./actions";

const TAB = [
  { ma: "dich-vu", ten: "Dịch vụ" }, { ma: "goi-the", ten: "Gói thẻ" }, { ma: "san-pham", ten: "Sản phẩm và vật tư" },
  { ma: "ra-soat", ten: "Rà soát sản phẩm" }, { ma: "nhom", ten: "Nhóm dịch vụ" }, { ma: "nhom-the", ten: "Nhóm thẻ" }, { ma: "cho-lam", ten: "Chỗ / giường" }, { ma: "chi-nhanh", ten: "Chi nhánh" },
];
/** Phân trang bảng dài (dịch vụ, gói thẻ, sản phẩm): lọc và tìm (không dấu) chạy ở máy chủ trên cả danh mục, chỉ các dòng của trang đang xem được gửi xuống trình duyệt. */
const CO_TRANG = [20, 50, 100] as const;
const CO_TRANG_MAC_DINH = 50;
function PhanTrangDanhMuc({ tong, trang, moi, thamSo, don }: { tong: number; trang: number; moi: number; thamSo: Record<string, string>; don: string }) {
  const gan = (o: { trang?: number; n?: number }) => {
    const u = new URLSearchParams(Object.entries(thamSo).filter(([, v]) => v));
    const n = o.n ?? moi;
    if (n !== CO_TRANG_MAC_DINH) u.set("n", String(n)); else u.delete("n");
    if (o.trang && o.trang > 1) u.set("trang", String(o.trang));
    return `/danh-muc?${u}`;
  };
  return (
    <div className="mt-1">
      <ThanhTrang trang={trang} tong={tong} moi={moi} don={don} luonHien gan={(t) => gan({ trang: t })} />
      <nav aria-label="Số dòng mỗi trang" className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-muc-3">
        <span className="mr-1">Mỗi trang</span>
        {CO_TRANG.map((x) => <Link key={x} href={gan({ n: x })} aria-current={x === moi ? "true" : undefined} className={`rounded-nho px-2.5 py-1 ${x === moi ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}>{x}</Link>)}
        <span className="ml-1">dòng</span>
      </nav>
    </div>
  );
}
function catTrang<T>(ds: T[], trang: number, moi: number) {
  const t = Math.min(Math.max(1, trang), Math.max(1, Math.ceil(ds.length / moi)));
  return { hang: ds.slice((t - 1) * moi, t * moi), trang: t };
}

const NHOM_CAP = [{ gia_tri: "", nhan: "Không phải vật tư cấp theo ca" }, { gia_tri: "A", nhan: "A · đắt, đếm được (cấp từng ca)" }, { gia_tri: "B", nhan: "B · chai dùng chung (cấp theo ngày)" }, { gia_tri: "C", nhan: "C · rẻ, khó đếm (cấp theo tuần)" }];

/** Biểu mẫu sản phẩm / vật tư, dùng ở tab Sản phẩm và tab Rà soát. Mã để trống khi thêm mới thì hệ thống tự sinh theo nhóm (MP-0001...). */
/** Giá trị đưa vào hộp Sửa / Nhân bản: cột có thể null đổi thành chuỗi rỗng để ô nhập hiện đúng. */
function giaTriSanPham(r: Record<string, unknown>): GiaTri {
  const x = r as Record<string, string | number | boolean | null>;
  return { ...x, vat: vatThanhChon(x.vat_pct as number | null, x.vat_loai as string | null), chi_nhanh_ids: Array.isArray(r.chi_nhanh_ids) ? (r.chi_nhanh_ids as string[]) : [], ma_vach: x.ma_vach ?? "", nhom_cap: x.nhom_cap ?? "", ten_en: x.ten_en ?? "", nhan_hieu: x.nhan_hieu ?? "", mo_ta: x.mo_ta ?? "", dung_tich: x.dung_tich ?? "", dung_tich_dv: x.dung_tich_dv ?? "", uoc_tinh_1_lan: x.uoc_tinh_1_lan ?? "", uoc_tinh_1_lan_dv: x.uoc_tinh_1_lan_dv ?? "" };
}
/** Lựa chọn dùng trong hộp sản phẩm: chi nhánh (địa điểm bán) + nhãn hiệu (danh mục ~314 hãng của SalonHero + tên hãng đang có trên sản phẩm). */
type LcSanPham = { chiNhanh: LuaChon[]; nhanHieu: LuaChon[] };
async function luaChonSanPham(db: ReturnType<typeof sb>, nhanHieuDangCo: (string | null)[]): Promise<LcSanPham> {
  const [{ data: cn }, { data: nh }] = await Promise.all([
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("nhan_hieu").select("ten, quoc_gia, ma_quoc_gia").eq("hoat_dong", true).order("ten"),
  ]);
  const daCo = new Set((nh ?? []).map((x) => x.ten.trim().toLowerCase()));
  const them = [...new Set(nhanHieuDangCo.map((x) => x?.trim()).filter((x): x is string => !!x && !daCo.has(x.toLowerCase())))];
  const nhanHieu: LuaChon[] = [{ gia_tri: "", nhan: "Chọn nhãn hiệu" },
    ...[...(nh ?? []).map((x) => ({ gia_tri: x.ten, nhan: x.quoc_gia || x.ma_quoc_gia ? `${x.ten} · ${x.quoc_gia ?? x.ma_quoc_gia}` : x.ten })), ...them.map((x) => ({ gia_tri: x, nhan: x }))]
      .sort((a, b) => a.gia_tri.localeCompare(b.gia_tri, "vi", { sensitivity: "base" }))];
  return { chiNhanh: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })), nhanHieu };
}
function truongSanPham(lc: LcSanPham): Truong[] {
  return [
    { ten: "ma", nhan: "Mã nội bộ (để trống = tự sinh)", loai: "chu", goiY: "MP-0001, VT-0001..." }, { ten: "ma_vach", nhan: "Mã vạch (8–14 chữ số)", loai: "chu" },
    { ten: "ten", nhan: "Tên (loại hàng + thương hiệu + tên + quy cách)", loai: "chu", batBuoc: true, rong: true, goiY: "Kem chống nắng Heliocare 360 SPF50+ 50ml" },
    { ten: "ten_en", nhan: "Tên tiếng Anh", loai: "chu", rong: true }, { ten: "nhan_hieu", nhan: "Nhãn hiệu", loai: "chon", luaChon: lc.nhanHieu, goiY: "Chọn nhãn hiệu" },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", goiY: "Công dụng, cách dùng..." },
    { ten: "nhom", nhan: "Nhóm hàng", loai: "chu", goiY: "Mỹ phẩm, vật tư tiêm..." }, { ten: "nhom_cap", nhan: "Nhóm cấp vật tư", loai: "chon", luaChon: NHOM_CAP },
    { ten: "don_vi", nhan: "Đơn vị DÙNG/CẤP", loai: "chu", batBuoc: true, goiY: "ml, shot, cái..." }, { ten: "don_vi_mua", nhan: "Đơn vị MUA", loai: "chu", goiY: "chai, hộp..." },
    { ten: "he_so_quy_doi", nhan: "1 đơn vị mua = ? đơn vị dùng", loai: "so" }, { ten: "gia_nhap_don_vi", nhan: "Giá vốn / 1 đơn vị dùng", loai: "so" },
    { ten: "gia_ban", nhan: "Giá bán lẻ", loai: "tien" }, { ten: "ton_toi_thieu", nhan: "Tồn tối thiểu", loai: "so" },
    { ten: "cho_sua_gia", nhan: "Sửa giá khi thanh toán", loai: "gat" }, { ten: "hinh_thuc_nhap", nhan: "Hình thức nhập hàng", loai: "chon", luaChon: HINH_THUC_NHAP },
    { ten: "dung_tich", nhan: "Dung tích / số lượng", loai: "so", goiY: "VD: 300" }, { ten: "dung_tich_dv", nhan: "Đơn vị dung tích", loai: "chon", luaChon: DON_VI_DUNG_TICH },
    { ten: "uoc_tinh_1_lan", nhan: "Ước tính một lần sử dụng", loai: "so", ghiChu: "Chỉ để tham khảo, có thể thay đổi khi thanh toán." }, { ten: "uoc_tinh_1_lan_dv", nhan: "Đơn vị ước tính", loai: "chon", luaChon: DON_VI_DUNG_TICH },
    { ten: "vat", nhan: "Mức thuế VAT (nếu có)", loai: "chon", luaChon: VAT_CHON, ghiChu: "Dùng khi kết nối phần mềm hoá đơn điện tử. Giá bán là giá sau thuế." },
    { ten: "noi_hien_thi", nhan: "Nơi hiển thị", loai: "chon", luaChon: NOI_HIEN_THI },
    { ten: "chi_nhanh_ids", nhan: "Địa điểm bán (bỏ trống = tất cả các địa điểm)", loai: "nhieu", luaChon: lc.chiNhanh },
    { ten: "ban_le", nhan: "Bán lẻ cho khách", loai: "gat" }, { ten: "tieu_hao", nhan: "Vật tư tiêu hao dịch vụ", loai: "gat" },
    { ten: "theo_doi_kho", nhan: "Theo dõi tồn kho", loai: "gat" }, { ten: "bat_buoc_han_dung", nhan: "Bắt buộc nhập hạn dùng khi nhập kho", loai: "gat" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
  ];
}

export default async function TrangDanhMuc({ searchParams }: { searchParams: Promise<{ tab?: string; loai?: string; nhom?: string; q?: string; n?: string; trang?: string; cn?: string; hien?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { tab: t, loai, nhom: nhomChon = "", q: tuKhoa = "", n: nS, trang: trangS, cn: cnS = "", hien: hienS = "" } = await searchParams;
  // Lọc chi nhánh (SalonHero "Tất cả các chi nhánh") và nơi hiển thị (SalonHero "Tùy chọn nơi hiển thị") trên danh sách.
  const cnChon = /^[0-9a-f-]{36}$/i.test(cnS) ? cnS : "";
  const hienChon = NOI_HIEN_THI.some((x) => x.gia_tri === hienS) ? hienS : "";
  const coCn = (ids: string[] | null) => !cnChon || !ids || ids.length === 0 || ids.includes(cnChon);
  const moi = (CO_TRANG as readonly number[]).includes(Number(nS)) ? Number(nS) : CO_TRANG_MAC_DINH;
  const trangXin = Math.max(1, Math.floor(Number(trangS)) || 1);
  const giuN = moi !== CO_TRANG_MAC_DINH ? String(moi) : "";
  const khoaTim = boDau(tuKhoa.trim());
  const tab = TAB.some((x) => x.ma === t) ? t! : "dich-vu";
  const sua = coQuyen(nd, "danhmuc.sua");
  const quanLy = coQuyen(nd, "nhanvien.quanly");
  const xemVon = coQuyen(nd, "baocao.tien");
  const db = sb();
  const [nhom, dv] = await Promise.all([db.from("dich_vu_nhom").select("*").order("thu_tu"), tab === "goi-the" || tab === "dich-vu" ? db.from("dich_vu").select("*").order("ma") : Promise.resolve({ data: [] })]);
  const nhomLC = (nhom.data ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }));
  const tenNhom = new Map((nhom.data ?? []).map((n) => [n.id, n.ten]));
  const trangThai = (b: boolean) => <NhanTrangThai kieu={b ? "tot" : "tram"}>{b ? "Đang dùng" : "Ngừng"}</NhanTrangThai>;

  let noiDung: React.ReactNode = null;
  let nutThem: React.ReactNode = null;

  if (tab === "dich-vu") {
    const [{ data: cnDv }, { data: tcg }, { data: nvTcg }] = await Promise.all([
      db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
      db.from("dich_vu_tuy_chon_gia").select("dich_vu_id, loai, nhan_vien_id, ten, gia_cong_them, thu_tu").order("thu_tu"),
      db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    ]);
    const tcgTheoDv = new Map<string, TuyChonGia[]>();
    for (const x of tcg ?? []) tcgTheoDv.set(x.dich_vu_id, [...(tcgTheoDv.get(x.dich_vu_id) ?? []), { loai: x.loai === "nhan_vien" ? "nhan_vien" : "bo_sung", nhan_vien_id: x.nhan_vien_id, ten: x.ten, gia_cong_them: Number(x.gia_cong_them) }]);
    const nvLC = luaChonNhanVien(nvTcg ?? []);
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã dịch vụ (để trống = tự sinh)", loai: "chu", goiY: "VD: MFU01 · trống: DV000001" }, { ten: "nhom_id", nhan: "Nhóm", loai: "chon", luaChon: nhomLC, batBuoc: true },
      { ten: "ten", nhan: "Tên dịch vụ", loai: "chu", batBuoc: true, rong: true }, { ten: "ten_en", nhan: "Tên tiếng Anh", loai: "chu", rong: true },
      { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", goiY: "Dịch vụ gồm những gì, ai nên làm..." },
      { ten: "doi_tuong", nhan: "Đối tượng", loai: "chon", luaChon: DOI_TUONG }, { ten: "don_vi_tinh", nhan: "Đơn vị tính", loai: "chon", luaChon: DON_VI_DICH_VU },
      { ten: "tg_gio", nhan: "Thời gian phục vụ: giờ", loai: "chon", luaChon: GIO_CHON }, { ten: "tg_phut", nhan: "Thời gian phục vụ: phút", loai: "chon", luaChon: PHUT_CHON },
      { ten: "in_gio_phuc_vu", nhan: "In giờ phục vụ trên hoá đơn", loai: "gat", rong: true },
      { ten: "gia", nhan: "Giá bán", loai: "tien" }, { ten: "gia_von", nhan: "Giá vốn", loai: "tien" },
      { ten: "cho_sua_gia", nhan: "Sửa giá khi thanh toán", loai: "gat", rong: true },
      { ten: "vat", nhan: "Mức thuế VAT", loai: "chon", luaChon: VAT_CHON, ghiChu: "Dùng khi kết nối phần mềm hoá đơn điện tử. Giá dịch vụ là giá sau thuế." },
      { ten: "noi_hien_thi", nhan: "Nơi hiển thị", loai: "chon", luaChon: NOI_HIEN_THI },
      { ten: "chi_nhanh_ids", nhan: "Địa điểm cung cấp (bỏ trống = mọi chi nhánh)", loai: "nhieu", luaChon: (cnDv ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) },
      { ten: "hoat_dong", nhan: "Đang bán", loai: "gat" },
      { ten: "dat_online", nhan: "Cho khách tự đặt lịch online (trang /dat-lich)", loai: "gat" },
    ];
    type Dv = NonNullable<typeof dv.data>[number];
    const giaTriDv = (r: Dv): GiaTri => ({ ...r, ...tachGioPhut(r.thoi_luong_phut), vat: vatThanhChon(r.vat_pct, r.vat_loai), ten_en: r.ten_en ?? "", mo_ta: r.mo_ta ?? "", chi_nhanh_ids: r.chi_nhanh_ids ?? [] });
    nutThem = sua && <>
      <NutNhapExcel tieuDe="Nhập dịch vụ từ Excel" moTa="Mẫu giống SalonHero: tên, mã, mô tả, giá bán, số phút, sửa giá, giá vốn, tên tiếng Anh. Đơn vị tính mặc định là buổi." mau="/mau-nhap/dich-vu.xlsx" chon={{ ten: "nhom_id", nhan: "Nhóm dịch vụ nhận", luaChon: nhomLC, batBuoc: true }} action={nhapExcelDichVu} />
      <NutHop nhan="Thêm dịch vụ" tieuDe="Thêm dịch vụ" truong={truong} giaTri={{ don_vi_tinh: "buổi", tg_gio: "1", tg_phut: "0", doi_tuong: "ca_hai", vat: "0", noi_hien_thi: "tat_ca", hoat_dong: true, chi_nhanh_ids: [] }} action={luuDichVu} />
    </>;
    const tatDv = dv.data ?? [];
    const dvLoc = tatDv.filter((r) => (!nhomChon || r.nhom_id === nhomChon) && coCn(r.chi_nhanh_ids) && (!hienChon || r.noi_hien_thi === hienChon) && (!khoaTim || boDau(`${r.ten} ${r.ma} ${r.ten_en ?? ""}`).includes(khoaTim)));
    const nhomDv = (nhom.data ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten, dem: tatDv.filter((r) => r.nhom_id === n.id).length })).filter((n) => n.dem > 0);
    const pt = catTrang(dvLoc, trangXin, moi);
    // Ô "Chuyển nhóm" dựng MỘT lần cho mỗi nhóm và dùng lại cho mọi dòng cùng nhóm (cùng tham chiếu → trang chỉ gửi danh sách một lần).
    const daDung = new Map<string, Truong[]>();
    const truongChuyenNhom = (nhomId: string) => {
      let t = daDung.get(nhomId);
      if (!t) {
        t = [
          { ten: "nhom_id", nhan: "Chuyển sang nhóm", loai: "chon", luaChon: nhomLC.filter((n) => n.gia_tri !== nhomId), batBuoc: true, rong: true },
          { ten: "dich_vu_ids", nhan: "Dịch vụ cần chuyển", loai: "nhieu", luaChon: tatDv.filter((x) => x.nhom_id === nhomId).map((x) => ({ gia_tri: x.id, nhan: `${x.ma} · ${x.ten}` })) },
        ];
        daDung.set(nhomId, t);
      }
      return t;
    };
    noiDung = (
      <>
      <LocThemDanhMuc ten="cn" aria="Lọc chi nhánh" nhanTatCa="Tất cả các chi nhánh" muc={(cnDv ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} chon={cnChon} thamSo={{ tab: "dich-vu", nhom: nhomChon, q: tuKhoa, n: giuN, hien: hienChon }} />
      <LocThemDanhMuc ten="hien" aria="Lọc nơi hiển thị" nhanTatCa="Mọi nơi hiển thị" muc={NOI_HIEN_THI} chon={hienChon} thamSo={{ tab: "dich-vu", nhom: nhomChon, q: tuKhoa, n: giuN, cn: cnChon }} />
      <LocNhomDanhMuc tab="dich-vu" nhom={nhomDv} tong={tatDv.length} chon={nhomChon} q={tuKhoa} hien={dvLoc.length} giu={{ n: giuN, cn: cnChon, hien: hienChon }} />
      <Bang duLieu={pt.hang} khoa={(r) => r.id} trong={tatDv.length ? "Không có dịch vụ nào khớp." : "Chưa có dịch vụ. Bấm Thêm dịch vụ để bắt đầu."}
        cot={[
          { nhan: "Ảnh", hienThi: (r) => <NutDoiAnh id={r.id} an={{ bang: "dich_vu" }} anh={urlAnhDanhMuc(r.anh)} ten={r.ten} sua={sua} action={datAnhDanhMuc} /> },
          { nhan: "Mã", hienThi: (r) => r.ma }, { chinh: true, nhan: "Dịch vụ", hienThi: (r) => <span className="text-muc">{r.ten}{r.cho_sua_gia && <span className="ml-2 text-[12px] text-muc-3">sửa giá khi thanh toán</span>}</span> }, { nhan: "Nhóm", hienThi: (r) => tenNhom.get(r.nhom_id) ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => r.don_vi_tinh }, { nhan: "Thời gian", hienThi: (r) => nhanThoiLuong(r.thoi_luong_phut), phai: true }, { nhan: "Giá bán", hienThi: (r) => tienVN(r.gia), phai: true },
          ...(xemVon ? [{ nhan: "Giá vốn", hienThi: (r: Dv) => tienVN(r.gia_von), phai: true }] : []), { nhan: "Đặt online", hienThi: (r) => <NhanTrangThai kieu={r.dat_online ? "tot" : "tram"}>{r.dat_online ? "Bật" : "Tắt"}</NhanTrangThai> }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: Dv) => (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={giaTriDv(r)} action={luuDichVu} />
              <NutTuyChonGia dichVuId={r.id} tenDv={r.ten} giaGoc={Number(r.gia)} ds={tcgTheoDv.get(r.id) ?? []} nhanVien={nvLC} sua={sua} action={luuTuyChonGia} />
              <NutHop kieu="chu" nhan="Nhân bản" tieuDe={`Nhân bản: ${r.ten}`} moTa="Tạo dịch vụ mới có cùng thông tin. Đổi mã và tên trước khi lưu; ảnh và định mức không được sao chép." truong={truong} giaTri={{ ...giaTriDv(r), id: undefined, ma: `${r.ma}-2`, ten: `${r.ten} (bản sao)` }} action={luuDichVu} />
              <NutHop kieu="chu" nhan="Chuyển nhóm" tieuDe={`Chuyển nhóm: ${r.ten}`} moTa="Chọn nhóm đích và các dịch vụ (cùng nhóm hiện tại) cần chuyển." truong={truongChuyenNhom(r.nhom_id)} giaTri={{ nhom_id: "", dich_vu_ids: [r.id] }} action={chuyenNhomDichVu} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaDichVu} />
            </span>
          ) }] : []),
        ]} />
      <PhanTrangDanhMuc tong={dvLoc.length} trang={pt.trang} moi={moi} don="dịch vụ" thamSo={{ tab: "dich-vu", nhom: nhomChon, q: tuKhoa, cn: cnChon, hien: hienChon }} />
      </>
    );
  } else if (tab === "goi-the") {
    const [goi, lk, nhomThe] = await Promise.all([db.from("goi_the").select("*").order("ma"), db.from("goi_the_dich_vu").select("goi_id, dich_vu_id"), db.from("goi_the_nhom").select("*").order("thu_tu").order("ten")]);
    const dvLC = (dv.data ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` }));
    const macDinh = (nhomThe.data ?? []).find((n) => n.mac_dinh);
    const nhomTheLC = (nhomThe.data ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }));
    const tenNhomThe = new Map((nhomThe.data ?? []).map((n) => [n.id, n.ten]));
    type Goi = NonNullable<typeof goi.data>[number];
    const nhomCuaThe = (r: Goi) => r.nhom_id ?? macDinh?.id ?? "";
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã gói", loai: "chu", batBuoc: true }, { ten: "loai", nhan: "Loại thẻ", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "lan", nhan: "Thẻ liệu trình (theo buổi)" }, { gia_tri: "tien", nhan: "Thẻ tiền (số dư)" }] },
      { ten: "ten", nhan: "Tên gói", loai: "chu", batBuoc: true, rong: true }, { ten: "ten_en", nhan: "Tên tiếng Anh", loai: "chu", rong: true },
      { ten: "mo_ta", nhan: "Mô tả chức năng thẻ", loai: "nhieu_dong" }, { ten: "mau_the", nhan: "Màu thẻ", loai: "chon", luaChon: MAU_THE }, { ten: "nhom_id", nhan: "Nhóm thẻ", loai: "chon", luaChon: nhomTheLC },
      { ten: "gia", nhan: "Giá bán", loai: "tien", batBuoc: true }, { ten: "cho_sua_gia", nhan: "Sửa giá khi thanh toán", loai: "gat" },
      { ten: "so_buoi", nhan: "Số buổi (thẻ liệu trình, bắt buộc)", loai: "so", hienKhi: { ten: "loai", la: ["lan"] } }, { ten: "khong_gioi_han", nhan: "Không giới hạn số lần", loai: "gat", hienKhi: { ten: "loai", la: ["lan"] } },
      { ten: "gia_tri_1_lan", nhan: "Giá trị 1 lần làm dịch vụ (để tính hoa hồng nhân viên)", loai: "tien", hienKhi: { ten: "loai", la: ["lan"] }, ghiChu: "Dùng để tính số lần tự động và hoa hồng buổi làm bằng thẻ." },
      { ten: "tu_tinh_gia_tri_1_lan", nhan: "Tự động tính giá trị 1 lần theo giá bán thẻ và số lần sử dụng", loai: "gat", hienKhi: { ten: "loai", la: ["lan"] } },
      { ten: "giam_hh_theo_giam_gia", nhan: "Tự động giảm hoa hồng theo tỉ lệ giảm giá khi bán thẻ", loai: "gat", hienKhi: { ten: "loai", la: ["lan"] } },
      { ten: "che_do_lan", nhan: "Số lần tại thu ngân", loai: "chon", luaChon: CHE_DO_SUA_LAN, hienKhi: { ten: "loai", la: ["lan"] } },
      { ten: "gia_tri_the", nhan: "Giá trị nạp vào thẻ (thẻ tiền)", loai: "tien", hienKhi: { ten: "loai", la: ["tien"] } },
      { ten: "che_do_tien", nhan: "Số tiền tại thu ngân", loai: "chon", luaChon: CHE_DO_SUA_TIEN, hienKhi: { ten: "loai", la: ["tien"] } },
      { ten: "han_tinh_tu", nhan: "Thời hạn thẻ tính", loai: "chon", luaChon: HAN_TINH_TU, rong: true },
      { ten: "han_dung_thang", nhan: "Thời hạn: số tháng", loai: "so", goiY: "VD: 12" }, { ten: "han_dung_ngay", nhan: "Thời hạn: số ngày", loai: "so", goiY: "VD: 0", ghiChu: "Hạn = ngày cấp + số tháng + số ngày. Bỏ trống cả hai = không hạn. Thời hạn thẻ có thể thay đổi khi bán thẻ." },
      { ten: "thoi_gian_1_lan_phut", nhan: "Thời gian làm 1 lần dịch vụ", loai: "chon", luaChon: THOI_GIAN_1_LAN, hienKhi: { ten: "loai", la: ["lan"] } },
      { ten: "noi_hien_thi", nhan: "Nơi hiển thị", loai: "chon", luaChon: NOI_HIEN_THI }, { ten: "hoat_dong", nhan: "Đang bán", loai: "gat" },
      { ten: "dich_vu_ids", nhan: "Dịch vụ được dùng thẻ (bỏ trống = mọi dịch vụ)", loai: "nhieu", luaChon: dvLC },
    ];
    const giaTriGoi = (r: Goi): GiaTri => {
      const kgh = r.loai === "lan" && laKhongGioiHan(r.so_buoi);
      return { ...r, han_dung_thang: r.han_dung_thang ?? "", han_dung_ngay: r.han_dung_ngay ?? "", thoi_gian_1_lan_phut: String(r.thoi_gian_1_lan_phut ?? 0), ten_en: r.ten_en ?? "", mo_ta: r.mo_ta ?? "", mau_the: r.mau_the ?? "", nhom_id: nhomCuaThe(r), khong_gioi_han: kgh, so_buoi: kgh ? "" : r.so_buoi, gia_tri_1_lan: r.gia_tri_1_lan ?? "", che_do_lan: r.che_do_sua_so, che_do_tien: r.che_do_sua_so, dich_vu_ids: (lk.data ?? []).filter((l) => l.goi_id === r.id).map((l) => l.dich_vu_id) };
    };
    nutThem = sua && <><NutNhapExcel tieuDe="Nhập loại thẻ từ Excel" moTa="Mẫu giống SalonHero (thẻ lần / thẻ tiền). Mã thẻ tự sinh; thời hạn lưu đúng số tháng như SalonHero." mau="/mau-nhap/the.xlsx" action={nhapExcelGoiThe} /><NutHop nhan="Thêm gói thẻ" tieuDe="Thêm gói thẻ" rong truong={truong} giaTri={{ loai: "lan", hoat_dong: true, han_tinh_tu: "ngay_cap", thoi_gian_1_lan_phut: "0", noi_hien_thi: "tat_ca", che_do_lan: "co_dinh", che_do_tien: "co_dinh", mau_the: "", nhom_id: macDinh?.id ?? "" }} action={luuGoiThe} /></>;
    const tatGoi = goi.data ?? [];
    const loaiLoc = loai === "lan" || loai === "tien" ? loai : "";
    const goiLoc = tatGoi.filter((r) => (!loaiLoc || r.loai === loaiLoc) && (!nhomChon || nhomCuaThe(r) === nhomChon) && (!khoaTim || boDau(`${r.ten} ${r.ma} ${r.ten_en ?? ""}`).includes(khoaTim)));
    const nhomGoi = (nhomThe.data ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten, dem: tatGoi.filter((r) => nhomCuaThe(r) === n.id).length })).filter((n) => n.dem > 0);
    const demLoai = (l: string) => tatGoi.filter((r) => r.loai === l).length;
    const hrefLoai = (l: string) => `/danh-muc?tab=goi-the${l ? `&loai=${l}` : ""}${nhomChon ? `&nhom=${encodeURIComponent(nhomChon)}` : ""}${tuKhoa ? `&q=${encodeURIComponent(tuKhoa)}` : ""}${giuN ? `&n=${giuN}` : ""}`;
    const pt = catTrang(goiLoc, trangXin, moi);
    const chipLoai = (act: boolean) => `rounded-nho px-3 py-1.5 text-[13px] ${act ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`;
    noiDung = (
      <>
      <nav aria-label="Lọc loại thẻ" className="mb-3 flex flex-wrap gap-1.5">
        <Link href={hrefLoai("")} className={chipLoai(!loaiLoc)}>Tất cả ({tatGoi.length})</Link>
        <Link href={hrefLoai("lan")} className={chipLoai(loaiLoc === "lan")}>Thẻ số lần ({demLoai("lan")})</Link>
        <Link href={hrefLoai("tien")} className={chipLoai(loaiLoc === "tien")}>Thẻ số tiền ({demLoai("tien")})</Link>
      </nav>
      <LocNhomDanhMuc tab="goi-the" nhom={nhomGoi} tong={tatGoi.length} chon={nhomChon} q={tuKhoa} hien={goiLoc.length} giu={{ loai: loaiLoc, n: giuN }} />
      {sua && pt.hang.length > 0 && <NutXoaNhieu nhom="goi-the" don="loại thẻ" canhBao="Chú ý: các thẻ đã cấp ra vẫn còn nguyên giá trị sau khi loại thẻ này được xoá. Loại thẻ đã cấp cho khách hoặc đã có trong hoá đơn sẽ không bị xoá hẳn mà chuyển sang Ngừng (ẩn khỏi bán)." action={xoaNhieuGoiThe} />}
      <Bang duLieu={pt.hang} khoa={(r) => r.id} trong={tatGoi.length ? "Không có gói thẻ nào khớp." : "Chưa có gói thẻ."}
        cot={[
          ...(sua ? [{ nhan: "Chọn", hienThi: (r: Goi) => <OChonDong nhom="goi-the" id={r.id} ten={r.ten} /> }] : []),
          { nhan: "Mã", hienThi: (r) => r.ma }, { chinh: true, nhan: "Gói", hienThi: (r) => <span className="flex items-center gap-2 text-muc">{r.mau_the && <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: r.mau_the }} />}{r.ten}</span> },
          { nhan: "Loại", hienThi: (r) => (r.loai === "lan" ? (laKhongGioiHan(r.so_buoi) ? "Liệu trình không giới hạn" : `Liệu trình ${r.so_buoi} buổi`) : "Thẻ tiền") }, { nhan: "Giá bán", hienThi: (r) => tienVN(r.gia), phai: true },
          { nhan: "Giá trị / buổi", hienThi: (r) => (r.loai === "lan" ? (laKhongGioiHan(r.so_buoi) ? "" : tienVN(Math.round(r.gia / (r.so_buoi || 1)))) : `nạp ${tienVN(r.gia_tri_the)}`), phai: true },
          { nhan: "Thời hạn", hienThi: (r) => { const h = nhanHanThe(r.han_dung_thang, r.han_dung_ngay); return h !== "Không hạn" && r.han_tinh_tu === "ngay_tao" ? `${h} (từ ngày tạo)` : h; } },
          { nhan: "1 lần làm", hienThi: (r) => (r.loai === "lan" && r.thoi_gian_1_lan_phut ? `${r.thoi_gian_1_lan_phut} phút` : ""), phai: true }, { nhan: "Nhóm thẻ", hienThi: (r) => tenNhomThe.get(nhomCuaThe(r)) ?? "" }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: Goi) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} rong truong={truong} giaTri={giaTriGoi(r)} action={luuGoiThe} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan={`Bạn có muốn xoá ${r.ten} không? Chú ý: các thẻ đã cấp ra vẫn còn nguyên giá trị sau khi loại thẻ này được xoá. Nếu loại thẻ đã cấp cho khách thì chỉ chuyển sang Ngừng (ẩn khỏi bán), không xoá hẳn.`} an={{ id: r.id }} nhanLuu="Xoá" action={xoaGoiThe} /></span> }] : []),
        ]} />
      <PhanTrangDanhMuc tong={goiLoc.length} trang={pt.trang} moi={moi} don="loại thẻ" thamSo={{ tab: "goi-the", loai: loaiLoc, nhom: nhomChon, q: tuKhoa }} />
      </>
    );
  } else if (tab === "san-pham") {
    const { data: sp } = await db.from("san_pham").select("*").order("ma");
    const lcSp = await luaChonSanPham(db, (sp ?? []).map((x) => x.nhan_hieu));
    const truong: Truong[] = truongSanPham(lcSp);
    nutThem = sua && <><NutNhapExcel tieuDe="Nhập sản phẩm từ Excel" moTa="Mẫu giống SalonHero. Tên và mã phải theo quy ước của AMIA; dòng sai bị bỏ kèm lý do. Mã để trống sẽ tự sinh." mau="/mau-nhap/san-pham.xlsx" chon={{ ten: "nhom", nhan: "Nhóm hàng", luaChon: [{ gia_tri: "", nhan: "Chưa phân nhóm" }, ...[...new Set((sp ?? []).map((x) => x.nhom?.trim()).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "vi")).map((x) => ({ gia_tri: x, nhan: x }))] }} action={nhapExcelSanPham} /><NutHop nhan="Thêm sản phẩm / vật tư" tieuDe="Thêm sản phẩm / vật tư" rong truong={truong} giaTri={{ he_so_quy_doi: 1, theo_doi_kho: true, bat_buoc_han_dung: true, hoat_dong: true, hinh_thuc_nhap: "mua_dut", noi_hien_thi: "tat_ca", vat: "0", chi_nhanh_ids: [], nhan_hieu: "", dung_tich_dv: "", uoc_tinh_1_lan_dv: "" }} action={luuSanPham} /></>;
    const tatSp = sp ?? [];
    const KHONG_NHOM = "__khong";
    const nhomCua = (r: (typeof tatSp)[number]) => (r.nhom && r.nhom.trim() ? r.nhom.trim() : KHONG_NHOM);
    const spLoc = tatSp.filter((r) => (!nhomChon || nhomCua(r) === nhomChon) && coCn(r.chi_nhanh_ids) && (!khoaTim || boDau(`${r.ten} ${r.ma} ${r.ma_vach ?? ""} ${r.nhan_hieu ?? ""} ${r.ten_en ?? ""}`).includes(khoaTim)));
    const demNhom = new Map<string, number>();
    for (const r of tatSp) demNhom.set(nhomCua(r), (demNhom.get(nhomCua(r)) ?? 0) + 1);
    const pt = catTrang(spLoc, trangXin, moi);
    const nhomSp = [...demNhom.entries()].sort((x, y) => (x[0] === KHONG_NHOM ? 1 : y[0] === KHONG_NHOM ? -1 : x[0].localeCompare(y[0], "vi"))).map(([k, dem]) => ({ gia_tri: k, nhan: k === KHONG_NHOM ? "Chưa phân nhóm" : k, dem }));
    noiDung = (
      <>
      <LocThemDanhMuc ten="cn" aria="Lọc chi nhánh" nhanTatCa="Tất cả các chi nhánh" muc={lcSp.chiNhanh} chon={cnChon} thamSo={{ tab: "san-pham", nhom: nhomChon, q: tuKhoa, n: giuN }} />
      <LocNhomDanhMuc tab="san-pham" nhom={nhomSp} tong={tatSp.length} chon={nhomChon} q={tuKhoa} hien={spLoc.length} giu={{ n: giuN, cn: cnChon }} />
      {pt.hang.length > 0 && <p className="-mt-2 mb-3 text-[13px]"><Link href={`/danh-muc/in-ma-vach?id=${pt.hang.map((r) => r.id).join(",")}`} className="font-medium text-nhan-dam hover:underline">In tem mã vạch trang này ({pt.hang.length} sản phẩm)</Link></p>}
      <Bang duLieu={pt.hang} khoa={(r) => r.id} trong={tatSp.length ? "Không có sản phẩm nào khớp." : "Chưa có sản phẩm hoặc vật tư."}
        cot={[
          { nhan: "Ảnh", hienThi: (r) => <NutDoiAnh id={r.id} an={{ bang: "san_pham" }} anh={urlAnhDanhMuc(r.anh)} ten={r.ten} sua={sua} action={datAnhDanhMuc} /> },
          { nhan: "Mã", hienThi: (r) => <span>{r.ma}{r.ma_vach && r.ma_vach !== r.ma ? <span className="block text-[12px] text-muc-3">{r.ma_vach}</span> : null}</span> }, { chinh: true, nhan: "Tên", hienThi: (r) => <span className="text-muc">{r.ten}{r.cho_sua_gia && <span className="ml-2 text-[12px] text-muc-3">sửa giá khi thanh toán</span>}</span> }, { nhan: "Nhãn hiệu", hienThi: (r) => r.nhan_hieu ?? "" }, { nhan: "Nhóm cấp", hienThi: (r) => r.nhom_cap ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => (r.don_vi_mua ? `${r.don_vi} (mua: ${r.don_vi_mua} = ${soVN(r.he_so_quy_doi)})` : r.don_vi) },
          ...(xemVon ? [{ nhan: "Giá vốn / đv", hienThi: (r: NonNullable<typeof sp>[number]) => (r.gia_nhap_don_vi == null ? "chưa có" : tienVN(r.gia_nhap_don_vi)), phai: true }] : []), { nhan: "Giá bán", hienThi: (r) => (r.ban_le ? tienVN(r.gia_ban) : ""), phai: true },
          { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          { nhan: "Tem", hienThi: (r) => <Link href={`/danh-muc/in-ma-vach?id=${r.id}`} className="whitespace-nowrap text-[13px] font-medium text-nhan-dam hover:underline">In tem</Link> },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof sp>[number]) => <span className="flex flex-wrap gap-x-4 gap-y-1"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} rong truong={truong} giaTri={giaTriSanPham(r)} action={luuSanPham} /><NutHop kieu="chu" nhan="Nhân bản" tieuDe={`Nhân bản: ${r.ten}`} moTa="Tạo sản phẩm mới có cùng thông tin. Đổi tên (và mã vạch) trước khi lưu; mã nội bộ để trống sẽ tự sinh. Ảnh, tồn kho và định mức không được sao chép." rong truong={truong} giaTri={{ ...giaTriSanPham(r), id: undefined, ma: "", ma_vach: "", ten: `${r.ten} (bản sao)` }} action={luuSanPham} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaSanPham} /></span> }] : []),
        ]} />
      <PhanTrangDanhMuc tong={spLoc.length} trang={pt.trang} moi={moi} don="sản phẩm" thamSo={{ tab: "san-pham", nhom: nhomChon, q: tuKhoa, cn: cnChon }} />
      </>
    );
  } else if (tab === "ra-soat") {
    const hom = homNayHCM();
    const [{ data: sp }, { data: ton }, { data: lo }] = await Promise.all([db.from("san_pham").select("*").order("ma"), db.from("v_ton_kho").select("san_pham_id, ton"), db.from("v_ton_lo").select("san_pham_id, han_dung, con_lai")]);
    const tenDem = new Map<string, number>();
    for (const x of sp ?? []) if (x.hoat_dong) tenDem.set(khoaTen(x.ten), (tenDem.get(khoaTen(x.ten)) ?? 0) + 1);
    const tonAm = new Set((ton ?? []).filter((x) => Number(x.ton) < 0).map((x) => x.san_pham_id));
    const tongTon = new Map<string, number>();
    for (const x of ton ?? []) if (x.san_pham_id) tongTon.set(x.san_pham_id, (tongTon.get(x.san_pham_id) ?? 0) + Number(x.ton));
    const hetHan = new Set((lo ?? []).filter((x) => x.han_dung && x.han_dung < hom && Number(x.con_lai) > 0).map((x) => x.san_pham_id));
    const coHan = new Set((lo ?? []).filter((x) => x.han_dung).map((x) => x.san_pham_id));
    const NHAN: Record<string, string> = { ...NHAN_VAN_DE, ton_am: "Tồn kho âm", het_han: "Còn tồn hàng đã hết hạn", thieu_han: "Có tồn nhưng chưa ghi hạn dùng" };
    const dong = (sp ?? []).flatMap((x) => {
      const vd = vanDeSanPham(x, (tenDem.get(khoaTen(x.ten)) ?? 0) > 1);
      if (x.hoat_dong && tonAm.has(x.id)) vd.push("ton_am");
      if (x.hoat_dong && hetHan.has(x.id)) vd.push("het_han");
      if (x.hoat_dong && x.bat_buoc_han_dung && (tongTon.get(x.id) ?? 0) > 0 && !coHan.has(x.id)) vd.push("thieu_han");
      return vd.length ? [{ sp: x, vd }] : [];
    });
    const dem = new Map<string, number>();
    for (const d of dong) for (const v of d.vd) dem.set(v, (dem.get(v) ?? 0) + 1);
    const loc = loai && NHAN[loai] ? loai : "";
    const hien = (loc ? dong.filter((d) => d.vd.includes(loc)) : dong).slice(0, 300);
    const truong: Truong[] = truongSanPham(await luaChonSanPham(db, (sp ?? []).map((x) => x.nhan_hieu)));
    noiDung = (
      <>
        <p className="mb-4 max-w-3xl text-[13.5px] leading-snug text-muc-3">Danh sách việc cần làm để danh mục và kho sạch: mã và tên theo quy ước, đủ nhóm, tồn tối thiểu, giá, mã vạch, tồn âm và hàng hết hạn. Sửa dần từng nhóm; mỗi dòng có nút Sửa. Quy ước mã: chữ in hoa + số, không dấu cách (MP-0012). Quy ước tên: loại hàng + thương hiệu + tên + quy cách.</p>
        <nav aria-label="Lọc theo vấn đề" className="mb-5 flex flex-wrap gap-2 text-[13px]">
          <Link href="/danh-muc?tab=ra-soat" className={`rounded-nho px-3 py-1.5 ${!loc ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:text-muc"}`}>Tất cả ({dong.length})</Link>
          {Object.entries(NHAN).filter(([k]) => dem.get(k)).map(([k, n]) => <Link key={k} href={`/danh-muc?tab=ra-soat&loai=${k}`} className={`rounded-nho px-3 py-1.5 ${loc === k ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:text-muc"}`}>{n} ({dem.get(k)})</Link>)}
        </nav>
        <Bang duLieu={hien} khoa={(r) => r.sp.id} trong="Không có vấn đề nào. Danh mục đã sạch."
          cot={[
            { nhan: "Mã", hienThi: (r) => r.sp.ma }, { chinh: true, nhan: "Tên", hienThi: (r) => <span className="text-muc">{r.sp.ten}</span> }, { nhan: "Nhóm", hienThi: (r) => r.sp.nhom ?? "" },
            { nhan: "Cần xử lý", hienThi: (r) => <span className="text-canh-bao">{r.vd.map((v) => NHAN[v]).join(" · ")}</span> },
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof hien)[number]) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.sp.ten}`} rong truong={truong} giaTri={giaTriSanPham(r.sp)} action={luuSanPham} /> }] : []),
          ]} />
        {dong.length > hien.length && <p className="mt-3 text-[12px] text-muc-3">Đang hiện {hien.length}/{dong.length} dòng đầu; lọc theo vấn đề để xem tiếp.</p>}
      </>
    );
  } else if (tab === "nhom") {
    const truong: Truong[] = [{ ten: "ten", nhan: "Tên nhóm", loai: "chu", batBuoc: true }, { ten: "thu_tu", nhan: "Thứ tự hiển thị", loai: "so" }];
    nutThem = sua && <NutHop nhan="Thêm nhóm" tieuDe="Thêm nhóm dịch vụ" truong={truong} giaTri={{ thu_tu: (nhom.data?.length ?? 0) + 1 }} action={luuNhomDichVu} />;
    noiDung = (
      <Bang duLieu={nhom.data ?? []} khoa={(r) => r.id} cot={[
        { nhan: "Thứ tự", hienThi: (r) => r.thu_tu }, { nhan: "Nhóm", hienThi: (r) => <span className="text-muc">{r.ten}</span> },
        ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof nhom.data>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r }} action={luuNhomDichVu} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaNhomDichVu} /></span> }] : []),
      ]} />
    );
  } else if (tab === "nhom-the") {
    const [{ data: nt }, { data: g }] = await Promise.all([db.from("goi_the_nhom").select("*").order("thu_tu").order("ten"), db.from("goi_the").select("nhom_id")]);
    const macDinhId = (nt ?? []).find((n) => n.mac_dinh)?.id;
    const dem = (id: string) => (g ?? []).filter((x) => (x.nhom_id ?? macDinhId) === id).length;
    const truong: Truong[] = [{ ten: "ten", nhan: "Tên nhóm", loai: "chu", batBuoc: true }, { ten: "thu_tu", nhan: "Thứ tự hiển thị", loai: "so" }];
    nutThem = sua && <NutHop nhan="Thêm nhóm thẻ" tieuDe="Thêm nhóm thẻ" truong={truong} giaTri={{ thu_tu: (nt?.length ?? 0) + 1 }} action={luuNhomThe} />;
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-2">Nhóm để phân loại các loại thẻ ở tab Gói thẻ. Thẻ chưa chọn nhóm nằm trong nhóm mặc định.</p>
        <Bang duLieu={nt ?? []} khoa={(r) => r.id} cot={[
          { nhan: "Thứ tự", hienThi: (r) => r.thu_tu }, { chinh: true, nhan: "Nhóm thẻ", hienThi: (r) => <span className="text-muc">{r.ten}{r.mac_dinh && <span className="ml-2 text-[12px] text-muc-3">mặc định</span>}</span> }, { nhan: "Số thẻ", hienThi: (r) => dem(r.id), phai: true },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof nt>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r }} action={luuNhomThe} />{!r.mac_dinh && <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá nhóm thẻ này? Nhóm còn thẻ thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaNhomThe} />}</span> }] : []),
        ]} />
      </>
    );
  } else if (tab === "cho-lam") {
    const [{ data: cn }, { data: cho }, { data: cfg }, { count: nDv }] = await Promise.all([
      db.from("chi_nhanh").select("id, ten").order("thu_tu").order("ma"),
      db.from("cho_lam").select("*").order("chi_nhanh_id").order("thu_tu").order("ten"),
      db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "dat_online.%"),
      db.from("dich_vu").select("id", { count: "exact", head: true }).eq("dat_online", true).eq("hoat_dong", true),
    ]);
    const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
    const c = Object.fromEntries((cfg ?? []).map((x) => [x.khoa, x.gia_tri]));
    const truong: Truong[] = [
      { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: (cn ?? []).map((x) => ({ gia_tri: x.id, nhan: x.ten })), batBuoc: true }, { ten: "ten", nhan: "Tên chỗ (giường / phòng)", loai: "chu", batBuoc: true, goiY: "Giường 1, Phòng VIP..." },
      { ten: "khu", nhan: "Khu (tầng)", loai: "chu", goiY: "Tầng 2" }, { ten: "suc_chua", nhan: "Sức chứa (số khách cùng lúc)", loai: "so", batBuoc: true },
      { ten: "thu_tu", nhan: "Thứ tự hiện (nhỏ đứng trước)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
    ];
    const truongOnline: Truong[] = [
      { ten: "mo", nhan: "Mở trang đặt lịch online cho khách (/dat-lich)", loai: "gat", rong: true }, { ten: "bao_truoc_phut", nhan: "Khách phải đặt trước giờ hẹn ít nhất (phút)", loai: "so" }, { ten: "toi_da_ngay", nhan: "Chỉ nhận đặt trong (ngày tới, tối đa 60)", loai: "so" },
    ];
    const dangMo = c["dat_online.mo"] === "1";
    nutThem = <span className="flex flex-wrap gap-2.5">
      {quanLy && <NutHop kieu="phu" nhan="Đặt lịch online" tieuDe="Đặt lịch online cho khách" moTa="Khách vào trang /dat-lich, chọn dịch vụ và giờ còn trống rồi gửi YÊU CẦU; lễ tân duyệt trong màn Lịch hẹn. Cần có chỗ đang dùng ở chi nhánh và ít nhất một dịch vụ được bật đặt online. Đầy đủ tuỳ chọn như SalonHero: Cài đặt › Web đặt Lịch." truong={truongOnline} giaTri={{ mo: dangMo, bao_truoc_phut: Number(c["dat_online.bao_truoc_phut"] ?? 120), toi_da_ngay: Number(c["dat_online.toi_da_ngay"] ?? 60) }} action={luuDatLichOnline} />}
      {sua && <NutHop nhan="Thêm chỗ" tieuDe="Thêm chỗ làm" truong={truong} giaTri={{ hoat_dong: true, thu_tu: 100, suc_chua: 1, chi_nhanh_id: cn?.[0]?.id ?? "" }} action={luuChoLam} />}
    </span>;
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-2">Chỗ làm (giường, phòng) dùng cho Sơ đồ chỗ ở Lịch hẹn. Trang đặt lịch online cho khách: <b className={dangMo ? "text-nhan-dam" : "text-muc-3"}>{dangMo ? "đang mở" : "đang tắt"}</b> · {nDv ?? 0} dịch vụ được bật đặt online (bật ở tab Dịch vụ) · số chỗ đang dùng của chi nhánh là số lịch tối đa chạy cùng lúc.</p>
        <Bang duLieu={cho ?? []} khoa={(r) => r.id} trong="Chưa có chỗ nào. Bấm Thêm chỗ để tạo giường/phòng của từng chi nhánh."
          cot={[
            { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id) ?? "" }, { nhan: "Khu", hienThi: (r) => r.khu ?? "" }, { nhan: "Chỗ", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Sức chứa", hienThi: (r) => r.suc_chua, phai: true }, { nhan: "Thứ tự", hienThi: (r) => r.thu_tu, phai: true }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
            ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof cho>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r }} an={{ ten_cu: r.ten }} action={luuChoLam} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn chỗ này? Lịch hẹn đã ghi tên chỗ vẫn giữ nguyên chữ. Muốn tạm ngừng thì Sửa và tắt Đang dùng." an={{ id: r.id }} nhanLuu="Xoá" action={xoaChoLam} /></span> }] : []),
          ]} />
      </>
    );
  } else {
    const { data: cn } = await db.from("chi_nhanh").select("id, ma, ten, dia_chi, dien_thoai, thu_tu, hoat_dong, tao_luc").order("thu_tu").order("ma");
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã", loai: "chu", batBuoc: true }, { ten: "ten", nhan: "Tên chi nhánh", loai: "chu", batBuoc: true },
      { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }, { ten: "thu_tu", nhan: "Thứ tự hiện (nhỏ đứng trước)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang hoạt động", loai: "gat" },
    ];
    nutThem = quanLy && <NutHop nhan="Thêm chi nhánh" tieuDe="Thêm chi nhánh" truong={truong} giaTri={{ hoat_dong: true, thu_tu: 100 }} action={luuChiNhanh} />;
    noiDung = (
      <Bang duLieu={cn ?? []} khoa={(r) => r.id} cot={[
        { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Chi nhánh", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Địa chỉ", hienThi: (r) => r.dia_chi ?? "" },
        { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
        ...(quanLy ? [{ nhan: "", hienThi: (r: NonNullable<typeof cn>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r, dia_chi: r.dia_chi ?? "", dien_thoai: r.dien_thoai ?? "" }} action={luuChiNhanh} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaChiNhanh} /></span> }] : []),
      ]} />
    );
  }

  return (
    <>
      <TieuDeTrang tieuDe="Danh mục" phu="Dịch vụ, gói thẻ, sản phẩm và vật tư, chi nhánh"><div className="flex flex-wrap items-center gap-2"><NutXuatExcel loai="danh-muc" ten="danh mục" />{nutThem}</div></TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/danh-muc" />
      {noiDung}
    </>
  );
}

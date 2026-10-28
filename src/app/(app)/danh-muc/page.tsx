import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import Link from "next/link";
import { sb } from "@/lib/db";
import { tienVN, soVN, homNayHCM, boDau } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { LocNhomDanhMuc } from "@/components/cai-dat/LocNhomDanhMuc";
import { NHAN_VAN_DE, khoaTen, vanDeSanPham } from "@/lib/san-pham";
import { luuChiNhanh, luuChoLam, luuDatLichOnline, luuDichVu, luuGoiThe, luuNhomDichVu, luuSanPham, xoaChiNhanh, xoaChoLam, xoaDichVu, xoaGoiThe, xoaNhomDichVu, xoaSanPham } from "./actions";

const TAB = [
  { ma: "dich-vu", ten: "Dịch vụ" }, { ma: "goi-the", ten: "Gói thẻ" }, { ma: "san-pham", ten: "Sản phẩm và vật tư" },
  { ma: "ra-soat", ten: "Rà soát sản phẩm" }, { ma: "nhom", ten: "Nhóm dịch vụ" }, { ma: "cho-lam", ten: "Chỗ / giường" }, { ma: "chi-nhanh", ten: "Chi nhánh" },
];
const DON_VI = ["buổi", "vùng", "shot", "line", "lần", "liệu trình"].map((x) => ({ gia_tri: x, nhan: x }));
const NHOM_CAP = [{ gia_tri: "", nhan: "Không phải vật tư cấp theo ca" }, { gia_tri: "A", nhan: "A · đắt, đếm được (cấp từng ca)" }, { gia_tri: "B", nhan: "B · chai dùng chung (cấp theo ngày)" }, { gia_tri: "C", nhan: "C · rẻ, khó đếm (cấp theo tuần)" }];

/** Biểu mẫu sản phẩm / vật tư, dùng ở tab Sản phẩm và tab Rà soát. Mã để trống khi thêm mới thì hệ thống tự sinh theo nhóm (MP-0001...). */
function truongSanPham(): Truong[] {
  return [
    { ten: "ma", nhan: "Mã nội bộ (để trống = tự sinh)", loai: "chu", goiY: "MP-0001, VT-0001..." }, { ten: "ma_vach", nhan: "Mã vạch (8–14 chữ số)", loai: "chu" },
    { ten: "ten", nhan: "Tên (loại hàng + thương hiệu + tên + quy cách)", loai: "chu", batBuoc: true, rong: true, goiY: "Kem chống nắng Heliocare 360 SPF50+ 50ml" },
    { ten: "nhom", nhan: "Nhóm hàng", loai: "chu", goiY: "Mỹ phẩm, vật tư tiêm..." }, { ten: "nhom_cap", nhan: "Nhóm cấp vật tư", loai: "chon", luaChon: NHOM_CAP },
    { ten: "don_vi", nhan: "Đơn vị DÙNG/CẤP", loai: "chu", batBuoc: true, goiY: "ml, shot, cái..." }, { ten: "don_vi_mua", nhan: "Đơn vị MUA", loai: "chu", goiY: "chai, hộp..." },
    { ten: "he_so_quy_doi", nhan: "1 đơn vị mua = ? đơn vị dùng", loai: "so" }, { ten: "gia_nhap_don_vi", nhan: "Giá vốn / 1 đơn vị dùng", loai: "so" },
    { ten: "gia_ban", nhan: "Giá bán lẻ", loai: "tien" }, { ten: "ton_toi_thieu", nhan: "Tồn tối thiểu", loai: "so" },
    { ten: "ban_le", nhan: "Bán lẻ cho khách", loai: "gat" }, { ten: "tieu_hao", nhan: "Vật tư tiêu hao dịch vụ", loai: "gat" },
    { ten: "theo_doi_kho", nhan: "Theo dõi tồn kho", loai: "gat" }, { ten: "bat_buoc_han_dung", nhan: "Bắt buộc nhập hạn dùng khi nhập kho", loai: "gat" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
  ];
}

export default async function TrangDanhMuc({ searchParams }: { searchParams: Promise<{ tab?: string; loai?: string; nhom?: string; q?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { tab: t, loai, nhom: nhomChon = "", q: tuKhoa = "" } = await searchParams;
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
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã dịch vụ", loai: "chu", batBuoc: true, goiY: "VD: MFU01" }, { ten: "nhom_id", nhan: "Nhóm", loai: "chon", luaChon: nhomLC, batBuoc: true },
      { ten: "ten", nhan: "Tên dịch vụ", loai: "chu", batBuoc: true, rong: true }, { ten: "don_vi_tinh", nhan: "Đơn vị tính", loai: "chon", luaChon: DON_VI },
      { ten: "thoi_luong_phut", nhan: "Thời lượng (phút)", loai: "so" }, { ten: "gia", nhan: "Giá bán", loai: "tien" }, { ten: "gia_von", nhan: "Giá vốn", loai: "tien" },
      { ten: "vat_pct", nhan: "VAT (%)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang bán", loai: "gat" },
      { ten: "dat_online", nhan: "Cho khách tự đặt lịch online (trang /dat-lich)", loai: "gat" },
    ];
    nutThem = sua && <NutHop nhan="Thêm dịch vụ" tieuDe="Thêm dịch vụ" truong={truong} giaTri={{ don_vi_tinh: "buổi", thoi_luong_phut: 60, hoat_dong: true }} action={luuDichVu} />;
    const tatDv = dv.data ?? [];
    const dvLoc = tatDv.filter((r) => (!nhomChon || r.nhom_id === nhomChon) && (!khoaTim || boDau(`${r.ten} ${r.ma}`).includes(khoaTim)));
    const nhomDv = (nhom.data ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten, dem: tatDv.filter((r) => r.nhom_id === n.id).length })).filter((n) => n.dem > 0);
    noiDung = (
      <>
      <LocNhomDanhMuc tab="dich-vu" nhom={nhomDv} tong={tatDv.length} chon={nhomChon} q={tuKhoa} hien={dvLoc.length} />
      <Bang duLieu={dvLoc} khoa={(r) => r.id} trong={tatDv.length ? "Không có dịch vụ nào khớp." : "Chưa có dịch vụ. Bấm Thêm dịch vụ để bắt đầu."}
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Dịch vụ", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Nhóm", hienThi: (r) => tenNhom.get(r.nhom_id) ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => r.don_vi_tinh }, { nhan: "Phút", hienThi: (r) => r.thoi_luong_phut, phai: true }, { nhan: "Giá bán", hienThi: (r) => tienVN(r.gia), phai: true },
          ...(xemVon ? [{ nhan: "Giá vốn", hienThi: (r: NonNullable<typeof dv.data>[number]) => tienVN(r.gia_von), phai: true }] : []), { nhan: "Đặt online", hienThi: (r) => <NhanTrangThai kieu={r.dat_online ? "tot" : "tram"}>{r.dat_online ? "Bật" : "Tắt"}</NhanTrangThai> }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof dv.data>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r }} action={luuDichVu} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaDichVu} /></span> }] : []),
        ]} />
      </>
    );
  } else if (tab === "goi-the") {
    const [goi, lk] = await Promise.all([db.from("goi_the").select("*").order("ma"), db.from("goi_the_dich_vu").select("goi_id, dich_vu_id")]);
    const dvLC = (dv.data ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` }));
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã gói", loai: "chu", batBuoc: true }, { ten: "loai", nhan: "Loại thẻ", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "lan", nhan: "Thẻ liệu trình (theo buổi)" }, { gia_tri: "tien", nhan: "Thẻ tiền (số dư)" }] },
      { ten: "ten", nhan: "Tên gói", loai: "chu", batBuoc: true, rong: true }, { ten: "gia", nhan: "Giá bán", loai: "tien", batBuoc: true },
      { ten: "so_buoi", nhan: "Số buổi (thẻ liệu trình, bắt buộc)", loai: "so" }, { ten: "gia_tri_the", nhan: "Giá trị nạp vào thẻ (thẻ tiền)", loai: "tien" },
      { ten: "han_dung_ngay", nhan: "Hạn dùng (ngày, bỏ trống = không hạn)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang bán", loai: "gat" },
      { ten: "dich_vu_ids", nhan: "Dịch vụ được dùng thẻ (bỏ trống = mọi dịch vụ)", loai: "nhieu", luaChon: dvLC },
    ];
    nutThem = sua && <NutHop nhan="Thêm gói thẻ" tieuDe="Thêm gói thẻ" rong truong={truong} giaTri={{ loai: "lan", hoat_dong: true }} action={luuGoiThe} />;
    noiDung = (
      <Bang duLieu={goi.data ?? []} khoa={(r) => r.id} trong="Chưa có gói thẻ."
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Gói", hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Loại", hienThi: (r) => (r.loai === "lan" ? `Liệu trình ${r.so_buoi} buổi` : "Thẻ tiền") }, { nhan: "Giá bán", hienThi: (r) => tienVN(r.gia), phai: true },
          { nhan: "Giá trị / buổi", hienThi: (r) => (r.loai === "lan" ? tienVN(Math.round(r.gia / (r.so_buoi || 1))) : `nạp ${tienVN(r.gia_tri_the)}`), phai: true },
          { nhan: "Hạn", hienThi: (r) => (r.han_dung_ngay ? `${r.han_dung_ngay} ngày` : "Không hạn") }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof goi.data>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} rong truong={truong} giaTri={{ ...r, dich_vu_ids: (lk.data ?? []).filter((l) => l.goi_id === r.id).map((l) => l.dich_vu_id) }} action={luuGoiThe} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaGoiThe} /></span> }] : []),
        ]} />
    );
  } else if (tab === "san-pham") {
    const { data: sp } = await db.from("san_pham").select("*").order("ma");
    const truong: Truong[] = truongSanPham();
    nutThem = sua && <NutHop nhan="Thêm sản phẩm / vật tư" tieuDe="Thêm sản phẩm / vật tư" rong truong={truong} giaTri={{ he_so_quy_doi: 1, theo_doi_kho: true, bat_buoc_han_dung: true, hoat_dong: true }} action={luuSanPham} />;
    const tatSp = sp ?? [];
    const KHONG_NHOM = "__khong";
    const nhomCua = (r: (typeof tatSp)[number]) => (r.nhom && r.nhom.trim() ? r.nhom.trim() : KHONG_NHOM);
    const spLoc = tatSp.filter((r) => (!nhomChon || nhomCua(r) === nhomChon) && (!khoaTim || boDau(`${r.ten} ${r.ma} ${r.ma_vach ?? ""}`).includes(khoaTim)));
    const demNhom = new Map<string, number>();
    for (const r of tatSp) demNhom.set(nhomCua(r), (demNhom.get(nhomCua(r)) ?? 0) + 1);
    const nhomSp = [...demNhom.entries()].sort((x, y) => (x[0] === KHONG_NHOM ? 1 : y[0] === KHONG_NHOM ? -1 : x[0].localeCompare(y[0], "vi"))).map(([k, dem]) => ({ gia_tri: k, nhan: k === KHONG_NHOM ? "Chưa phân nhóm" : k, dem }));
    noiDung = (
      <>
      <LocNhomDanhMuc tab="san-pham" nhom={nhomSp} tong={tatSp.length} chon={nhomChon} q={tuKhoa} hien={spLoc.length} />
      <Bang duLieu={spLoc} khoa={(r) => r.id} trong={tatSp.length ? "Không có sản phẩm nào khớp." : "Chưa có sản phẩm hoặc vật tư."}
        cot={[
          { nhan: "Mã", hienThi: (r) => <span>{r.ma}{r.ma_vach && r.ma_vach !== r.ma ? <span className="block text-[12px] text-muc-3">{r.ma_vach}</span> : null}</span> }, { chinh: true, nhan: "Tên", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Nhóm cấp", hienThi: (r) => r.nhom_cap ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => (r.don_vi_mua ? `${r.don_vi} (mua: ${r.don_vi_mua} = ${soVN(r.he_so_quy_doi)})` : r.don_vi) },
          ...(xemVon ? [{ nhan: "Giá vốn / đv", hienThi: (r: NonNullable<typeof sp>[number]) => (r.gia_nhap_don_vi == null ? "chưa có" : tienVN(r.gia_nhap_don_vi)), phai: true }] : []), { nhan: "Giá bán", hienThi: (r) => (r.ban_le ? tienVN(r.gia_ban) : ""), phai: true },
          { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof sp>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} rong truong={truong} giaTri={{ ...r, nhom_cap: r.nhom_cap ?? "" }} action={luuSanPham} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaSanPham} /></span> }] : []),
        ]} />
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
    const truong: Truong[] = truongSanPham();
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
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof hien)[number]) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.sp.ten}`} rong truong={truong} giaTri={{ ...r.sp, ma_vach: r.sp.ma_vach ?? "", nhom_cap: r.sp.nhom_cap ?? "" }} action={luuSanPham} /> }] : []),
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
      { ten: "thu_tu", nhan: "Thứ tự hiện (nhỏ đứng trước)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
    ];
    const truongOnline: Truong[] = [
      { ten: "mo", nhan: "Mở trang đặt lịch online cho khách (/dat-lich)", loai: "gat", rong: true }, { ten: "bao_truoc_phut", nhan: "Khách phải đặt trước giờ hẹn ít nhất (phút)", loai: "so" }, { ten: "toi_da_ngay", nhan: "Chỉ nhận đặt trong (ngày tới, tối đa 60)", loai: "so" },
    ];
    const dangMo = c["dat_online.mo"] === "1";
    nutThem = <span className="flex flex-wrap gap-2.5">
      {quanLy && <NutHop kieu="phu" nhan="Đặt lịch online" tieuDe="Đặt lịch online cho khách" moTa="Khách vào trang /dat-lich, chọn dịch vụ và giờ còn trống rồi gửi YÊU CẦU; lễ tân duyệt trong màn Lịch hẹn. Cần có chỗ đang dùng ở chi nhánh và ít nhất một dịch vụ được bật đặt online. Đầy đủ tuỳ chọn như SalonHero: Cài đặt › Web đặt Lịch." truong={truongOnline} giaTri={{ mo: dangMo, bao_truoc_phut: Number(c["dat_online.bao_truoc_phut"] ?? 120), toi_da_ngay: Number(c["dat_online.toi_da_ngay"] ?? 60) }} action={luuDatLichOnline} />}
      {sua && <NutHop nhan="Thêm chỗ" tieuDe="Thêm chỗ làm" truong={truong} giaTri={{ hoat_dong: true, thu_tu: 100, chi_nhanh_id: cn?.[0]?.id ?? "" }} action={luuChoLam} />}
    </span>;
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-2">Chỗ làm (giường, phòng) dùng cho Sơ đồ chỗ ở Lịch hẹn. Trang đặt lịch online cho khách: <b className={dangMo ? "text-nhan-dam" : "text-muc-3"}>{dangMo ? "đang mở" : "đang tắt"}</b> · {nDv ?? 0} dịch vụ được bật đặt online (bật ở tab Dịch vụ) · số chỗ đang dùng của chi nhánh là số lịch tối đa chạy cùng lúc.</p>
        <Bang duLieu={cho ?? []} khoa={(r) => r.id} trong="Chưa có chỗ nào. Bấm Thêm chỗ để tạo giường/phòng của từng chi nhánh."
          cot={[
            { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id) ?? "" }, { nhan: "Chỗ", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Thứ tự", hienThi: (r) => r.thu_tu, phai: true }, { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
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
      <TieuDeTrang tieuDe="Danh mục" phu="Dịch vụ, gói thẻ, sản phẩm và vật tư, chi nhánh">{nutThem}</TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/danh-muc" />
      {noiDung}
    </>
  );
}

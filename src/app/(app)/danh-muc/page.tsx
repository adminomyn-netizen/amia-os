import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { tienVN, soVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuChiNhanh, luuDichVu, luuGoiThe, luuNhomDichVu, luuSanPham, xoaChiNhanh, xoaDichVu, xoaGoiThe, xoaNhomDichVu, xoaSanPham } from "./actions";

const TAB = [
  { ma: "dich-vu", ten: "Dịch vụ" }, { ma: "goi-the", ten: "Gói thẻ" }, { ma: "san-pham", ten: "Sản phẩm và vật tư" },
  { ma: "nhom", ten: "Nhóm dịch vụ" }, { ma: "chi-nhanh", ten: "Chi nhánh" },
];
const DON_VI = ["buổi", "vùng", "shot", "line", "lần", "liệu trình"].map((x) => ({ gia_tri: x, nhan: x }));
const NHOM_CAP = [{ gia_tri: "", nhan: "Không phải vật tư cấp theo ca" }, { gia_tri: "A", nhan: "A · đắt, đếm được (cấp từng ca)" }, { gia_tri: "B", nhan: "B · chai dùng chung (cấp theo ngày)" }, { gia_tri: "C", nhan: "C · rẻ, khó đếm (cấp theo tuần)" }];

export default async function TrangDanhMuc({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { tab: t } = await searchParams;
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
    ];
    nutThem = sua && <NutHop nhan="Thêm dịch vụ" tieuDe="Thêm dịch vụ" truong={truong} giaTri={{ don_vi_tinh: "buổi", thoi_luong_phut: 60, hoat_dong: true }} action={luuDichVu} />;
    noiDung = (
      <Bang duLieu={dv.data ?? []} khoa={(r) => r.id} trong="Chưa có dịch vụ. Bấm Thêm dịch vụ để bắt đầu."
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Dịch vụ", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Nhóm", hienThi: (r) => tenNhom.get(r.nhom_id) ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => r.don_vi_tinh }, { nhan: "Phút", hienThi: (r) => r.thoi_luong_phut, phai: true }, { nhan: "Giá bán", hienThi: (r) => tienVN(r.gia), phai: true },
          ...(xemVon ? [{ nhan: "Giá vốn", hienThi: (r: NonNullable<typeof dv.data>[number]) => tienVN(r.gia_von), phai: true }] : []), { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof dv.data>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truong} giaTri={{ ...r }} action={luuDichVu} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaDichVu} /></span> }] : []),
        ]} />
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
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã", loai: "chu", batBuoc: true }, { ten: "nhom", nhan: "Nhóm hàng", loai: "chu", goiY: "Mỹ phẩm, vật tư tiêm..." },
      { ten: "ten", nhan: "Tên", loai: "chu", batBuoc: true, rong: true }, { ten: "nhom_cap", nhan: "Nhóm cấp vật tư", loai: "chon", luaChon: NHOM_CAP, rong: true },
      { ten: "don_vi", nhan: "Đơn vị DÙNG/CẤP", loai: "chu", batBuoc: true, goiY: "ml, shot, cái..." }, { ten: "don_vi_mua", nhan: "Đơn vị MUA", loai: "chu", goiY: "chai, hộp..." },
      { ten: "he_so_quy_doi", nhan: "1 đơn vị mua = ? đơn vị dùng", loai: "so" }, { ten: "gia_nhap_don_vi", nhan: "Giá vốn / 1 đơn vị dùng", loai: "so" },
      { ten: "gia_ban", nhan: "Giá bán lẻ", loai: "tien" }, { ten: "ton_toi_thieu", nhan: "Tồn tối thiểu", loai: "so" },
      { ten: "ban_le", nhan: "Bán lẻ cho khách", loai: "gat" }, { ten: "tieu_hao", nhan: "Vật tư tiêu hao dịch vụ", loai: "gat" },
      { ten: "theo_doi_kho", nhan: "Theo dõi tồn kho", loai: "gat" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
    ];
    nutThem = sua && <NutHop nhan="Thêm sản phẩm / vật tư" tieuDe="Thêm sản phẩm / vật tư" rong truong={truong} giaTri={{ he_so_quy_doi: 1, theo_doi_kho: true, hoat_dong: true }} action={luuSanPham} />;
    noiDung = (
      <Bang duLieu={sp ?? []} khoa={(r) => r.id} trong="Chưa có sản phẩm hoặc vật tư."
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Tên", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Nhóm cấp", hienThi: (r) => r.nhom_cap ?? "" },
          { nhan: "Đơn vị", hienThi: (r) => (r.don_vi_mua ? `${r.don_vi} (mua: ${r.don_vi_mua} = ${soVN(r.he_so_quy_doi)})` : r.don_vi) },
          ...(xemVon ? [{ nhan: "Giá vốn / đv", hienThi: (r: NonNullable<typeof sp>[number]) => (r.gia_nhap_don_vi == null ? "chưa có" : tienVN(r.gia_nhap_don_vi)), phai: true }] : []), { nhan: "Giá bán", hienThi: (r) => (r.ban_le ? tienVN(r.gia_ban) : ""), phai: true },
          { nhan: "Trạng thái", hienThi: (r) => trangThai(r.hoat_dong) },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof sp>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} rong truong={truong} giaTri={{ ...r, nhom_cap: r.nhom_cap ?? "" }} action={luuSanPham} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ten}`} xacNhan="Xoá hẳn mục này? Không hoàn lại được. Nếu đã có hoá đơn, thẻ hay kho liên quan thì hệ thống sẽ từ chối." an={{ id: r.id }} nhanLuu="Xoá" action={xoaSanPham} /></span> }] : []),
        ]} />
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
  } else {
    const { data: cn } = await db.from("chi_nhanh").select("*").order("ma");
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã", loai: "chu", batBuoc: true }, { ten: "ten", nhan: "Tên chi nhánh", loai: "chu", batBuoc: true },
      { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }, { ten: "hoat_dong", nhan: "Đang hoạt động", loai: "gat" },
    ];
    nutThem = quanLy && <NutHop nhan="Thêm chi nhánh" tieuDe="Thêm chi nhánh" truong={truong} giaTri={{ hoat_dong: true }} action={luuChiNhanh} />;
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

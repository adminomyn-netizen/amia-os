import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { ThanhKhoHangBan } from "@/components/kho/ThanhKhoHangBan";
import { DanhSachPhieuKho, type SpPhieu } from "@/components/kho/DanhSachPhieuKho";
import { nhapKho } from "../actions";

/** Phiếu nhập kho hàng bán như SalonHero #/inventory › Phiếu nhập: danh sách phiếu (Mã, Ngày, Người tạo, Phân loại, Tình trạng, Chi nhánh, Tổng tiền), lọc, Xuất Excel, nút Tạo phiếu nhập. */
export default async function TrangPhieuNhap({ searchParams }: { searchParams: Promise<SpPhieu> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  let nut = null;
  if (coQuyen(nd, "kho.nhap")) {
    const [{ data: spAll }, { data: dsCn }] = await Promise.all([sb().from("san_pham").select("id, ten, don_vi").eq("hoat_dong", true).eq("theo_doi_kho", true).order("ten"), dsChiNhanhRutGon()]);
    const truong: Truong[] = [
      ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]),
      { ten: "san_pham_id", nhan: "Sản phẩm", loai: "chon", batBuoc: true, rong: true, luaChon: (spAll ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })) },
      { ten: "so_luong", nhan: "Số lượng (theo đơn vị DÙNG)", loai: "so", batBuoc: true }, { ten: "tong_tien", nhan: "Tổng tiền nhập (để tính giá vốn)", loai: "tien" },
      { ten: "so_lo", nhan: "Số lô", loai: "chu" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" },
      { ten: "ngoai_le", nhan: "Ngoại lệ hạn dùng (hàng còn dưới 90 ngày, đã được đồng ý; ghi lý do vào ghi chú)", loai: "gat", rong: true },
      { ten: "ghi_chu", nhan: "Ghi chú (nhà cung cấp, số hoá đơn...)", loai: "chu", rong: true },
    ];
    nut = <NutHop nhan="Tạo phiếu nhập" tieuDe="Tạo phiếu nhập" rong truong={truong} action={nhapKho} an={nd.chiNhanhId ? { chi_nhanh_id: nd.chiNhanhId } : undefined} giaTri={{ chi_nhanh_id: "", san_pham_id: "" }} />;
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Phiếu nhập" phu="Các lần nhập hàng vào kho. Phiếu đã ghi sổ kho thì không sửa; nhập sai thì lập phiếu xử lý điều chỉnh." />
      <ThanhKhoHangBan dang="nhap" />
      <DanhSachPhieuKho nd={nd} huong="nhap" sp={sp} nut={nut} />
    </div>
  );
}

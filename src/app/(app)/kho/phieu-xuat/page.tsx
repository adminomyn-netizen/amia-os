import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { ThanhKhoHangBan } from "@/components/kho/ThanhKhoHangBan";
import { DanhSachPhieuKho, type SpPhieu } from "@/components/kho/DanhSachPhieuKho";
import { nhapNoiBoTuHangBan } from "../actions";

/** Phiếu xuất kho hàng bán như SalonHero #/inventory › Phiếu xuất: danh sách phiếu (tiêu hao, sang kho nội bộ, trả NCC, huỷ, khẩn cấp…) + lọc tình trạng / người tạo / phân loại + Xuất Excel,
 *  nút Tạo phiếu xuất (lập phiếu xử lý có duyệt) và Xuất sang kho nội bộ. */
export default async function TrangPhieuXuat({ searchParams }: { searchParams: Promise<SpPhieu> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  let nut = null;
  if (coQuyen(nd, "kho.nhap")) {
    const [{ data: spAll }, { data: dsCn }] = await Promise.all([sb().from("san_pham").select("id, ten, don_vi").eq("hoat_dong", true).eq("ban_le", true).order("ten"), dsChiNhanhRutGon()]);
    const truong: Truong[] = [
      ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]),
      { ten: "san_pham_id", nhan: "Sản phẩm (kho hàng bán)", loai: "chon", batBuoc: true, rong: true, luaChon: (spAll ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })) },
      { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú (dùng cho việc gì)", loai: "chu", rong: true },
    ];
    nut = (
      <>
        <Link href="/kho/xu-ly" className={`${NUT_PHU} inline-flex items-center whitespace-nowrap`}>Tạo phiếu xuất</Link>
        <NutHop kieu="phu" nhan="Xuất sang kho nội bộ" tieuDe="Xuất sang kho nội bộ" moTa="Kho hàng bán trừ ngay, kho nội bộ cộng ngay cùng số lượng (một phiếu NB…)." rong truong={truong} action={nhapNoiBoTuHangBan} giaTri={{ chi_nhanh_id: "", san_pham_id: "" }} />
      </>
    );
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Phiếu xuất" phu="Xuất tiêu hao, sang kho nội bộ, trả nhà cung cấp, huỷ, khẩn cấp. Huỷ / hao hụt / trả NCC chỉ ghi sổ sau khi người khác duyệt." />
      <ThanhKhoHangBan dang="xuat" />
      <DanhSachPhieuKho nd={nd} huong="xuat" sp={sp} nut={nut} />
    </div>
  );
}

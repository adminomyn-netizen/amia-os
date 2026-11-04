import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TT_KIEM_KE } from "@/lib/kho";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { taoKiemKe } from "../actions";

export default async function TrangKiemKe() {
  const nd = await yeuCauQuyen("kho.xem");
  const nhap = coQuyen(nd, "kho.nhap");
  const db = sb();
  let q = db.from("phieu_kiem_ke").select("*").order("tao_luc", { ascending: false }).limit(100);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: ds }, { data: cn }, { data: nv }] = await Promise.all([q, db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"), db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten")]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]),
    { ten: "ngay", nhan: "Ngày kiểm kê", loai: "ngay", batBuoc: true },
    { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "thang", nhan: "Hằng tháng (cuối tháng)" }, { gia_tri: "dot_xuat", nhan: "Đột xuất" }] },
    { ten: "nguoi_dem_2_id", nhan: "Người đếm thứ hai", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa chọn" }, ...(nv ?? []).filter((n) => n.id !== nd.nhanVienId).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
    { ten: "ghi_chu", nhan: "Ghi chú (bắt buộc khi đột xuất: lý do)", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho", nhan: "Kho" }} tieuDe="Kiểm kê kho" phu="Chụp tồn sổ → hai người đếm thực tế → gửi duyệt → người khác duyệt thì chênh lệch mới ghi vào sổ kho. Mỗi chi nhánh chỉ một phiếu mở một lúc.">
        {nhap && <NutHop nhan="Tạo phiếu kiểm kê" tieuDe="Tạo phiếu kiểm kê" moTa="Hệ thống chụp tồn sổ của mọi mặt hàng theo dõi kho tại thời điểm tạo. Nên tạm dừng nhập/xuất trong lúc đếm." truong={truong} action={taoKiemKe} giaTri={{ ngay: homNayHCM(), loai: "thang", chi_nhanh_id: "", nguoi_dem_2_id: "" }} rong />}
      </TieuDeNoi>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu kiểm kê."
        cot={[
          { nhan: "Phiếu", chinh: true, hienThi: (r) => <Link href={`/kho/kiem-ke/${r.id}`} className="text-nhan-dam hover:underline">{r.ma}</Link> },
          { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id) ?? "" }, { nhan: "Ngày", hienThi: (r) => <div>{ngayVN(r.ngay)}<div className="text-[12.5px] text-muc-3">{r.loai === "thang" ? "Hằng tháng" : r.loai === "ton_dau" ? "Tồn đầu" : "Đột xuất"}</div></div> },
          { nhan: "Người đếm", hienThi: (r) => [tenNv.get(r.nguoi_lap_id), r.nguoi_dem_2_id ? tenNv.get(r.nguoi_dem_2_id) : null].filter(Boolean).join(", ") },
          { nhan: "Người duyệt", hienThi: (r) => (r.nguoi_duyet_id ? tenNv.get(r.nguoi_duyet_id) : "") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_KIEM_KE[r.trang_thai].kieu}>{TT_KIEM_KE[r.trang_thai].ten}</NhanTrangThai> },
        ]} />
    </div>
  );
}

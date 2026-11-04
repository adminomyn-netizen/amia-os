import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { TT_KIEM_KE } from "@/lib/kho";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { duyetKiemKe, guiDuyetKiemKe, huyKiemKe, tuChoiKiemKe } from "../../actions";
import { FormDem } from "./FormDem";

export default async function TrangPhieuKiemKe({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const { id } = await params;
  const db = sb();
  const { data: p } = await db.from("phieu_kiem_ke").select("*").eq("id", id).maybeSingle();
  if (!p || (nd.chiNhanhId && p.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: sp }, { data: nv }, { data: cn }] = await Promise.all([
    db.from("phieu_kiem_ke_dong").select("*").eq("phieu_id", id), db.from("san_pham").select("id, ten, don_vi"), db.from("nhan_vien").select("id, ho_ten"), db.from("chi_nhanh").select("id, ten").eq("id", p.chi_nhanh_id).maybeSingle(),
  ]);
  const tenSp = new Map((sp ?? []).map((s) => [s.id, s])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const ds = (dong ?? []).map((d) => ({ san_pham_id: d.san_pham_id, ten: tenSp.get(d.san_pham_id)?.ten ?? "", don_vi: tenSp.get(d.san_pham_id)?.don_vi ?? "", ton_so: Number(d.ton_so), ton_thuc: d.ton_thuc == null ? null : Number(d.ton_thuc), so_lo: d.so_lo, han_dung: d.han_dung })).sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  const nhap = coQuyen(nd, "kho.nhap"), duyet = coQuyen(nd, "kho.duyet");
  const lech = ds.filter((d) => d.ton_thuc != null && d.ton_thuc !== d.ton_so).length;
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho/kiem-ke", nhan: "Kiểm kê" }} tieuDe={`Phiếu ${p.ma}`} phu={<>{cn?.ten} · ngày {ngayVN(p.ngay)} · {p.loai === "thang" ? "hằng tháng" : p.loai === "ton_dau" ? "tồn đầu" : "đột xuất"} · đếm: {[tenNv.get(p.nguoi_lap_id), p.nguoi_dem_2_id ? tenNv.get(p.nguoi_dem_2_id) : null].filter(Boolean).join(", ")}</>}>
        <NhanTrangThai kieu={TT_KIEM_KE[p.trang_thai].kieu}>{TT_KIEM_KE[p.trang_thai].ten}</NhanTrangThai>
        {nhap && p.trang_thai === "dang_dem" && <NutHop nhan="Gửi duyệt" tieuDe="Gửi duyệt phiếu" xacNhan={`Gửi duyệt ${p.ma}? Sau khi gửi không sửa số đếm nữa. Mặt hàng chưa nhập số đếm sẽ không bị điều chỉnh.`} action={guiDuyetKiemKe} an={{ id: p.id }} nhanLuu="Gửi duyệt" />}
        {duyet && p.trang_thai === "cho_duyet" && <NutHop nhan="Duyệt và ghi sổ" tieuDe="Duyệt kiểm kê" xacNhan={`Duyệt ${p.ma}? ${lech} mặt hàng lệch sẽ được ghi vào sổ kho.`} action={duyetKiemKe} an={{ id: p.id }} nhanLuu="Duyệt" />}
        {duyet && p.trang_thai === "cho_duyet" && <NutHop kieu="phu" nhan="Trả về đếm lại" tieuDe="Trả về đếm lại" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={tuChoiKiemKe} an={{ id: p.id }} />}
        {nhap && ["dang_dem", "cho_duyet"].includes(p.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ phiếu" tieuDe="Huỷ phiếu kiểm kê" xacNhan={`Huỷ ${p.ma}? Sổ kho không đổi.`} action={huyKiemKe} an={{ id: p.id }} nhanLuu="Huỷ phiếu" />}
      </TieuDeNoi>
      {p.ly_do && <p className="mb-3 rounded-nho bg-nen-2 px-3 py-2 text-[13.5px] text-muc-2">Ghi chú: {p.ly_do}</p>}
      {p.ghi_chu && <p className="mb-3 text-[13.5px] text-muc-3">{p.ghi_chu}</p>}
      <p className="mb-3 text-[13px] text-muc-3">{p.trang_thai === "da_duyet" ? `Đã duyệt bởi ${tenNv.get(p.nguoi_duyet_id ?? "")}; ${lech} mặt hàng lệch đã ghi vào sổ kho.` : `Tồn sổ là số chụp lúc tạo phiếu. Hiện ${lech} mặt hàng lệch.`}</p>
      <FormDem id={p.id} dong={ds} sua={nhap && p.trang_thai === "dang_dem"} tonDau={p.loai === "ton_dau"} />
    </div>
  );
}

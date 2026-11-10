import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { dsNvTrongPham, luaChonNv, luaChonNvGiu } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuKhenKyLuat, xoaKhenKyLuat } from "./actions";

export default async function TrangKhenKyLuat() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem khen thưởng và kỷ luật.</p>;
  const nv = await dsNvTrongPham(nd.chiNhanhId, false);
  const ids = new Set(nv.map((n) => n.id)), ten = new Map(nv.map((n) => [n.id, n.ho_ten]));
  const { data } = await sb().from("hr_thuong_phat").select("*").order("ngay_lap", { ascending: false, nullsFirst: false }).limit(1000);
  const ds = (data ?? []).filter((t) => !nd.chiNhanhId || (t.nhan_vien_id && ids.has(t.nhan_vien_id)));
  const thuong = ds.reduce((s, t) => s + Number(t.khoan_chi ?? 0), 0), phat = ds.reduce((s, t) => s + Number(t.khoan_thu ?? 0), 0);
  const truong: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: luaChonNv(nv.filter((n) => n.hoat_dong)), rong: true },
    { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "thuong", nhan: "Khen thưởng" }, { gia_tri: "phat", nhan: "Kỷ luật" }] },
    { ten: "ngay_lap", nhan: "Ngày lập", loai: "ngay", batBuoc: true },
    { ten: "so_tien", nhan: "Số tiền (thưởng chi / phạt thu)", loai: "tien", ghiChu: "Kỷ luật không phạt tiền thì để 0." },
    { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true, rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Khen thưởng và kỷ luật" phu={`Tổng thưởng đã ghi ${tienVN(thuong)}, tổng phạt thu ${tienVN(phat)} (cả bản ghi chuyển từ Lark).`}>
        <NutHop nhan="Ghi nhận" tieuDe="Ghi khen thưởng hoặc kỷ luật" truong={truong} action={luuKhenKyLuat} giaTri={{ loai: "thuong", ngay_lap: homNayHCM() }} />
      </TieuDeNoi>
      <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa có bản ghi nào."
        cot={[
          { nhan: "Ngày", hienThi: (r) => (r.ngay_lap ? ngayVN(r.ngay_lap) : `${r.thang ?? ""}/${r.nam ?? ""}`) },
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => (r.nhan_vien_id ? ten.get(r.nhan_vien_id) ?? "Đã nghỉ" : "—") },
          { nhan: "Loại", hienThi: (r) => (Number(r.khoan_chi) > 0 ? <NhanTrangThai kieu="tot">Khen thưởng</NhanTrangThai> : <NhanTrangThai kieu="cho">Kỷ luật</NhanTrangThai>) },
          { nhan: "Nội dung", hienThi: (r) => <span className="text-[13px]">{r.noi_dung}</span> },
          { nhan: "Số tiền", phai: true, hienThi: (r) => tienVN(Number(r.khoan_chi) > 0 ? r.khoan_chi : r.khoan_thu) },
          { nhan: "", hienThi: (r) => (r.nhan_vien_id && ids.has(r.nhan_vien_id) ? <span className="flex items-center gap-3">
            <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa bản ghi" truong={truong.map((t) => (t.ten === "nhan_vien_id" ? { ...t, luaChon: luaChonNvGiu(nv, r.nhan_vien_id) } : t))} action={luuKhenKyLuat} an={{ id: r.id }} giaTri={{ id: r.id, nhan_vien_id: r.nhan_vien_id, loai: Number(r.khoan_chi) > 0 ? "thuong" : "phat", ngay_lap: r.ngay_lap ?? homNayHCM(), so_tien: String(Number(r.khoan_chi) > 0 ? r.khoan_chi : r.khoan_thu ?? 0), noi_dung: r.noi_dung ?? "", ghi_chu: r.ghi_chu ?? "" }} />
            <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá bản ghi" xacNhan="Xoá bản ghi này?" action={xoaKhenKyLuat} an={{ id: r.id }} nhanLuu="Xoá" />
          </span> : null) },
        ]} />
    </div>
  );
}

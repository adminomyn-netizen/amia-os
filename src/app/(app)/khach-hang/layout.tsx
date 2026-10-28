import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { NGUON, truongKhach } from "@/lib/khach";
import { soLieuKhach } from "@/lib/khach-danh-sach";
import { NutHop } from "@/components/ui/BieuMau";
import { DanhSachKhach } from "@/components/khach/DanhSachKhach";
import { KhungHaiCot } from "@/components/khach/KhungHaiCot";
import { NhapExcelKhach } from "@/components/khach/NhapExcelKhach";
import { luuKhach, nhapKhachExcel } from "./actions";

/** Mốc thời gian của lần dựng layout này: đổi mỗi khi trang được làm mới (router.refresh) để danh sách bên trái tải lại. */
const bayGio = () => Date.now();

/** Khung màn Khách hàng, đứng yên khi đổi khách: bốn số đầu trang + cột danh sách bên trái; `children` (hồ sơ) đổi bên phải. */
export default async function KhungKhachHang({ children }: { children: React.ReactNode }) {
  const nd = await yeuCauQuyen("khach.xem");
  const db = sb();
  const [{ data: nv }, { data: cn }, { data: dv }, { data: hang }, so] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("hang_khach").select("ten").order("thu_tu"),
    soLieuKhach(),
  ]);
  const nvLC = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const cnLC = (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: cnLC });
  const chiSo = [
    { nhan: "Tổng số khách", so: so.tong }, { nhan: "Khách mới hôm nay", so: so.moiHomNay },
    { nhan: "Sinh nhật hôm nay", so: so.sinhNhatHomNay }, { nhan: "Sinh nhật tháng này", so: so.sinhNhatThang },
  ];

  const dau = (
    <div className="pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-3">
        <h1 className="chu-tieu-de text-[24px] text-muc lg:text-[28px]">Khách hàng</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          {coQuyen(nd, "khach.nhap") && <NhapExcelKhach nguon={NGUON} nhanVien={nvLC} chiNhanh={cnLC} action={nhapKhachExcel} macDinh={{ nguoi: nd.nhanVienId, cn: nd.chiNhanhId ?? cn?.[0]?.id ?? "" }} />}
          {coQuyen(nd, "khach.sua") && (
            <NutHop nhan="Thêm khách" tieuDe="Thêm khách hàng" moTa="Nguồn khách và người phụ trách là bắt buộc để tính hoa hồng và đánh giá quảng cáo." rong truong={truong}
              giaTri={{ chi_nhanh_id: nd.chiNhanhId ?? (cn?.[0]?.id ?? ""), nguoi_phu_trach_id: nd.nhanVienId, quan_tam: [] }} action={luuKhach} />
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {chiSo.map((c) => (
          <div key={c.nhan} className="rounded-nho border border-vien bg-giay-sang px-3 py-2">
            <dt className="text-muc-3">{c.nhan}</dt>
            <dd className="text-[20px] font-medium leading-tight tabular-nums text-muc">{c.so.toLocaleString("vi-VN")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="man-khach">
      <KhungHaiCot dau={dau} danhSach={<DanhSachKhach nhanVien={nvLC} nguon={NGUON} hang={(hang ?? []).map((h) => ({ gia_tri: h.ten, nhan: h.ten }))} moc={bayGio()} choXuat={coQuyen(nd, "khach.xem")} />}>
        {children}
      </KhungHaiCot>
    </div>
  );
}

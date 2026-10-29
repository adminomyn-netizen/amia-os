import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { BarChart3, CalendarClock, History, MessagesSquare, PhoneCall, Tags, TicketX } from "lucide-react";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { NGUON, truongKhach } from "@/lib/khach";
import { soLieuKhach, tuyChonLocKhach } from "@/lib/khach-danh-sach";
import { NutHop } from "@/components/ui/BieuMau";
import { DanhSachKhach } from "@/components/khach/DanhSachKhach";
import { KhungHaiCot } from "@/components/khach/KhungHaiCot";
import { NhapExcelKhach } from "@/components/khach/NhapExcelKhach";
import { luuKhach, nhapKhachExcel } from "./actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

/** Mốc thời gian của lần dựng layout này: đổi mỗi khi trang được làm mới (router.refresh) để danh sách bên trái tải lại. */
const bayGio = () => Date.now();

/** Khung màn Khách hàng, đứng yên khi đổi khách: bốn số đầu trang + cột danh sách bên trái; `children` (hồ sơ) đổi bên phải. */
export default async function KhungKhachHang({ children }: { children: React.ReactNode }) {
  const nd = await yeuCauQuyen("khach.xem");
  const db = sb();
  const [{ data: nv }, { data: cn }, { data: dv }, { data: hang }, so, tc] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    dsChiNhanhRutGon(),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("hang_khach").select("ten").order("thu_tu"),
    soLieuKhach(),
    tuyChonLocKhach(),
  ]);
  const nvLC = luaChonNhanVien(nv ?? []);
  const cnLC = (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: cnLC });
  const chiSo = [
    { nhan: "Tổng số khách hàng", so: so.tong }, { nhan: "Khách hàng mới hôm nay", so: so.moiHomNay },
    { nhan: "Khách hàng sinh nhật hôm nay", so: so.sinhNhatHomNay }, { nhan: "Khách hàng sinh nhật tháng này", so: so.sinhNhatThang },
  ];

  const dau = (
    <div className="pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-3">
        <h1 className="chu-tieu-de text-[24px] text-muc lg:text-[28px]">Khách hàng</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/khach-hang/thong-ke" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><BarChart3 aria-hidden strokeWidth={1.7} className="h-4 w-4" />Thống kê khách hàng</Link>
          <Link href="/khach-hang/gan-day" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><History aria-hidden strokeWidth={1.7} className="h-4 w-4" />Khách hàng gần đây</Link>
          <Link href="/khach-hang/tu-van" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><MessagesSquare aria-hidden strokeWidth={1.7} className="h-4 w-4" />Tư vấn</Link>
          <Link href="/khach-hang/nhom" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><Tags aria-hidden strokeWidth={1.7} className="h-4 w-4" />Quản lý nhóm</Link>
          <Link href="/khach-hang/cham-soc" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><PhoneCall aria-hidden strokeWidth={1.7} className="h-4 w-4" />Chăm sóc khách</Link>
          {coQuyen(nd, "the.xem") && <Link href="/khach-hang/tai-kham" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><CalendarClock aria-hidden strokeWidth={1.7} className="h-4 w-4" />Nhắc tái khám</Link>}
          {coQuyen(nd, "the.xem") && <Link href="/khach-hang/the-sap-het" className="flex h-9 items-center gap-1.5 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:border-nhan"><TicketX aria-hidden strokeWidth={1.7} className="h-4 w-4" />Thẻ sắp hết</Link>}
          {coQuyen(nd, "khach.nhap") && <NhapExcelKhach nguon={NGUON} nhanVien={nvLC} chiNhanh={cnLC} action={nhapKhachExcel} macDinh={{ nguoi: nd.nhanVienId, cn: nd.chiNhanhId ?? cn?.[0]?.id ?? "" }} />}
          {coQuyen(nd, "khach.sua") && (
            <NutHop nhan="Thêm mới" tieuDe="Thêm khách hàng mới" moTa="Nguồn khách và người phụ trách là bắt buộc để tính hoa hồng và đánh giá quảng cáo." rong truong={truong}
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
      <KhungHaiCot dau={dau} danhSach={<DanhSachKhach nhanVien={nvLC} nguon={NGUON} hang={(hang ?? []).map((h) => ({ gia_tri: h.ten, nhan: h.ten }))} moc={bayGio()} choXuat={coQuyen(nd, "khach.xem")} choGanNhom={coQuyen(nd, "khach.nhap")}
        danhMuc={{ nhom: tc.nhom, chiNhanh: cnLC, tinh: tc.tuyChon.tinh, dichVu: tc.tuyChon.dich_vu }} />}>
        {children}
      </KhungHaiCot>
    </div>
  );
}

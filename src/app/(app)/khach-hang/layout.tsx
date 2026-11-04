import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { AlarmClock, BarChart3, CalendarClock, CreditCard, History, MessagesSquare, PhoneCall, Tags, TicketX, Users } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { NGUON, truongKhach } from "@/lib/khach";
import { soLieuKhach, tuyChonLocKhach } from "@/lib/khach-danh-sach";
import { NutHop } from "@/components/ui/BieuMau";
import { DanhSachKhach } from "@/components/khach/DanhSachKhach";
import { KhungHaiCot } from "@/components/khach/KhungHaiCot";
import { HopSinhNhat } from "@/components/khach/HopSinhNhat";
import { NhapExcelKhach } from "@/components/khach/NhapExcelKhach";
import { luuKhach, nhapKhachExcel } from "./actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

/** Mốc thời gian của lần dựng layout này: đổi mỗi khi trang được làm mới (router.refresh) để danh sách bên trái tải lại. */
const bayGio = () => Date.now();

/** Khung màn Khách hàng, đứng yên khi đổi khách: bốn số đầu trang + cột danh sách bên trái; `children` (hồ sơ) đổi bên phải. */
export default async function KhungKhachHang({ children }: { children: React.ReactNode }) {
  const nd = await yeuCauQuyen("khach.xem");
  const db = sb();
  const [{ data: nv }, { data: cn }, { data: dv }, { data: hang }, so, tc, { data: nhomNhap }] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    dsChiNhanhRutGon(),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("hang_khach").select("ten").order("thu_tu"),
    soLieuKhach(),
    tuyChonLocKhach(),
    db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten"), // danh sách nhóm nhẹ cho hộp Nhập Excel (không đếm số khách)
  ]);
  const nvLC = luaChonNhanVien(nv ?? []);
  const cnLC = (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: cnLC, nhom: (nhomNhap ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) });
  const chiSo = [
    { nhan: "Tổng số khách hàng", so: so.tong, tab: undefined }, { nhan: "Khách hàng mới hôm nay", so: so.moiHomNay, tab: undefined },
    { nhan: "Khách hàng sinh nhật hôm nay", so: so.sinhNhatHomNay, tab: "hom_nay" as const }, { nhan: "Khách hàng sinh nhật tháng này", so: so.sinhNhatThang, tab: "thang" as const },
  ];
  const hangLC = (hang ?? []).map((h) => ({ gia_tri: h.ten, nhan: h.ten }));

  // Lối tắt các màn con: ô biểu tượng nhiều màu, cuộn ngang trong khung trên điện thoại (không đẩy cả trang).
  const loiTat = [
    { href: "/khach-hang/thong-ke", nhan: "Thống kê khách hàng", Icon: BarChart3, mau: "bg-sac-xanh-nen text-sac-xanh", hien: true },
    { href: "/khach-hang/gan-day", nhan: "Khách hàng gần đây", Icon: History, mau: "bg-sac-luc-nen text-sac-luc", hien: true },
    { href: "/khach-hang/tu-van", nhan: "Tư vấn", Icon: MessagesSquare, mau: "bg-sac-tim-nen text-sac-tim", hien: true },
    { href: "/khach-hang/nhom", nhan: "Quản lý nhóm", Icon: Tags, mau: "bg-sac-cam-nen text-sac-cam", hien: true },
    { href: "/khach-hang/cham-soc", nhan: "Chăm sóc khách", Icon: PhoneCall, mau: "bg-sac-hong-nen text-sac-hong", hien: true },
    { href: "/khach-hang/nhac-nho", nhan: "Lịch nhắc chăm sóc", Icon: AlarmClock, mau: "bg-sac-xanh-nen text-sac-xanh", hien: true },
    { href: "/khach-hang/tai-kham", nhan: "Nhắc tái khám", Icon: CalendarClock, mau: "bg-sac-luc-nen text-sac-luc", hien: coQuyen(nd, "the.xem") },
    { href: "/khach-hang/dung-the", nhan: "Khách dùng thẻ", Icon: CreditCard, mau: "bg-sac-tim-nen text-sac-tim", hien: coQuyen(nd, "the.xem") },
    { href: "/khach-hang/the-sap-het", nhan: "Thẻ sắp hết", Icon: TicketX, mau: "bg-sac-hong-nen text-sac-hong", hien: coQuyen(nd, "the.xem") },
  ].filter((m) => m.hien);

  const dau = (
    <div className="pb-4">
      <TieuDeNoi tieuDe="Khách hàng" icon={Users} so={`${so.tong.toLocaleString("vi-VN")} khách`} phu="Hồ sơ, lịch sử dịch vụ, thẻ, điểm thưởng và chăm sóc của từng khách ở một chỗ.">
        {coQuyen(nd, "khach.nhap") && <NhapExcelKhach nguon={NGUON} nhanVien={nvLC} chiNhanh={cnLC} nhom={(nhomNhap ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))} action={nhapKhachExcel} macDinh={{ nguoi: nd.nhanVienId, cn: nd.chiNhanhId ?? cn?.[0]?.id ?? "" }} />}
        {coQuyen(nd, "khach.sua") && (
          <NutHop nhan="Thêm mới" tieuDe="Thêm khách hàng mới" moTa="Nguồn khách và người phụ trách là bắt buộc để tính hoa hồng và đánh giá quảng cáo." rong truong={truong}
            giaTri={{ chi_nhanh_id: nd.chiNhanhId ?? (cn?.[0]?.id ?? ""), nguoi_phu_trach_id: nd.nhanVienId, quan_tam: [] }} action={luuKhach} />
        )}
      </TieuDeNoi>
      <nav aria-label="Các màn khách hàng" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
        {loiTat.map(({ href, nhan, Icon, mau }) => (
          <Link key={href} href={href} className="group flex h-10 shrink-0 items-center gap-2 rounded-the border border-vien bg-giay-sang py-1 pl-1 pr-3.5 text-[13px] font-medium text-muc-2 shadow-[0_1px_2px_rgb(10_43_38/0.06)] transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-nhan hover:text-muc hover:shadow-[0_6px_14px_-4px_rgb(10_43_38/0.16)]">
            <span className={`flex h-8 w-8 items-center justify-center rounded-nho ${mau}`}><Icon aria-hidden strokeWidth={1.8} className="h-4 w-4" /></span>{nhan}
          </Link>
        ))}
      </nav>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {chiSo.map((c) => c.tab ? <HopSinhNhat key={c.nhan} nhan={c.nhan} so={c.so} tab={c.tab} hang={hangLC} /> : (
          <div key={c.nhan} className="the-noi the-noi-thap px-4 pb-3 pt-3.5">
            <dt className="text-[12.5px] text-muc-3">{c.nhan}</dt>
            <dd className="mt-0.5 text-[22px] font-semibold leading-tight tabular-nums text-muc">{c.so.toLocaleString("vi-VN")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="man-khach">
      <KhungHaiCot dau={dau} danhSach={<DanhSachKhach nhanVien={nvLC} nguon={NGUON} hang={(hang ?? []).map((h) => ({ gia_tri: h.ten, nhan: h.ten }))} moc={bayGio()} choXuat={coQuyen(nd, "khach.xuat")} xemSdt={coQuyen(nd, "khach.sdt")} choGanNhom={coQuyen(nd, "khach.nhap")}
        danhMuc={{ nhom: tc.nhom, chiNhanh: cnLC, tinh: tc.tuyChon.tinh, dichVu: tc.tuyChon.dich_vu, sanPham: tc.tuyChon.san_pham ?? [] }} />}>
        {children}
      </KhungHaiCot>
    </div>
  );
}

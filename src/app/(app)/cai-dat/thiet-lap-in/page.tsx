import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { ThietLapInForm } from "@/components/cai-dat/ThietLapIn";
import type { DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { TAT_CA, docIn, laLoaiIn } from "@/lib/thiet-lap-in";
import { luuThietLapIn } from "./actions";

/** Thiết lập in hoá đơn / lịch hẹn theo chi nhánh, đối chiếu SalonHero #/print-setting. Bản mẫu dùng số liệu giả, không đụng dữ liệu thật. */
export default async function TrangThietLapIn({ searchParams }: { searchParams: Promise<{ loai?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sp = await searchParams;
  const loai = laLoaiIn(sp.loai) ? sp.loai : "hoa_don";
  const db = sb();
  const [{ data: cn }, { data: rows }, { data: ch }] = await Promise.all([
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.%"),
    db.from("cua_hang").select("ten_thuong_hieu").eq("id", 1).maybeSingle(),
  ]);
  const chon = (cn ?? []).find((x) => x.id === sp.cn);
  const ma = chon?.id ?? TAT_CA;
  const { cauHinh, nguon } = docIn(loai, rows, ma);
  const goc = chon ?? cn?.[0];
  const mau: DuLieuIn = {
    loai, xemMau: true, cuaHang: { ten: chon?.ten ?? ch?.ten_thuong_hieu ?? "AMIA", diaChi: goc?.dia_chi, dienThoai: goc?.dien_thoai },
    tieuDe: loai === "hoa_don" ? "Hoá đơn" : "Lịch hẹn", ma: "HD-MAU-0001", ngay: homNayHCM(), thuNgan: "Nhân viên mẫu",
    khach: { ten: "Nguyễn Thị Mẫu", sdt: "0900 000 000", gioiTinh: "nữ", namSinh: "1990", diem: 120 }, ghiChu: loai === "hoa_don" ? "Nhắc khách tái khám sau 2 tuần." : "Khách đến sớm 10 phút.",
    gioVaoRa: loai === "hoa_don" ? "10:30 – 11:30" : null,
    dong: loai === "hoa_don" ? [{ ten: "Dịch vụ mẫu A", soLuong: 1, donGia: 1_500_000, giamGia: 0, thanhTien: 1_500_000, nhanVien: ["Nhân viên A", "Nhân viên B"] }, { ten: "Sản phẩm mẫu B", soLuong: 2, donGia: 250_000, giamGia: 50_000, thanhTien: 450_000 }] : [{ ten: "Dịch vụ mẫu A", soLuong: 1, donGia: 0, giamGia: 0, thanhTien: 0 }, { ten: "Dịch vụ mẫu B", soLuong: 1, donGia: 0, giamGia: 0, thanhTien: 0 }],
    tongHang: 2_000_000, giamDon: 50_000, vatPct: 0, vatTien: 0, phuPhi: 0, tip: 0, phaiThu: 1_950_000, thanhToan: [{ nhan: "Đã thu · Chuyển khoản", soTien: 1_000_000 }], conNo: 950_000,
  };
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Thiết lập in" phu="Khổ giấy, các dòng hiện trên tờ in hoá đơn / lịch hẹn và nội dung cuối tờ, theo từng chi nhánh. Chỉ cấu hình hiển thị." />
      <ThietLapInForm key={`${loai}-${ma}`} loai={loai} cn={ma} chiNhanh={(cn ?? []).map((x) => ({ id: x.id, ten: x.ten }))} dau={cauHinh} nguon={nguon} mau={mau} sua={coQuyen(nd, "hethong.phanquyen")} luu={luuThietLapIn} />
    </div>
  );
}

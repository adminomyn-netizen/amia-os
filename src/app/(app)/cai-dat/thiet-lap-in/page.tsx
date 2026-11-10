import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Printer } from "lucide-react";
import { ThietLapInForm } from "@/components/cai-dat/ThietLapIn";
import type { DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { TAT_CA, docIn, laLoaiIn } from "@/lib/thiet-lap-in";
import { CO_SO } from "@/lib/in-hoa-don";
import { docSoTien } from "@/lib/phieu-thu";
import { luuThietLapIn } from "./actions";

/** Thiết lập in hoá đơn / lịch hẹn theo chi nhánh, đối chiếu SalonHero #/print-setting. Bản mẫu dùng số liệu giả, không đụng dữ liệu thật. */
export default async function TrangThietLapIn({ searchParams }: { searchParams: Promise<{ loai?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sp = await searchParams;
  const loai = laLoaiIn(sp.loai) ? sp.loai : "hoa_don";
  const db = sb();
  const [{ data: cn }, { data: rows }, { data: ch }, { data: dsTk }] = await Promise.all([
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.%"),
    db.from("cua_hang").select("ten_thuong_hieu").eq("id", 1).maybeSingle(),
    // "Lấy từ tài khoản ngân hàng" ở khối QRCode: tài khoản chuyển khoản đang dùng (Cài đặt › Tài khoản Ngân Hàng).
    db.from("tai_khoan_ngan_hang").select("id, ngan_hang, so_tai_khoan, chu_tai_khoan").eq("hoat_dong", true).eq("dung_chuyen_khoan", true).neq("so_tai_khoan", "").order("mac_dinh", { ascending: false }).order("tao_luc"),
  ]);
  const chon = (cn ?? []).find((x) => x.id === sp.cn);
  const ma = chon?.id ?? TAT_CA;
  const { cauHinh, nguon } = docIn(loai, rows, ma);
  const goc = chon ?? cn?.[0];
  const mau: DuLieuIn = {
    loai, xemMau: true, cuaHang: loai === "hoa_don" ? { ten: goc?.ten ?? "AMIA", tenCoSo: CO_SO.ten, phu: `${CO_SO.linhVuc} · Giấy phép ${CO_SO.giayPhep}`, diaChi: goc?.dia_chi, dienThoai: goc?.dien_thoai } : { ten: chon?.ten ?? ch?.ten_thuong_hieu ?? "AMIA", diaChi: goc?.dia_chi, dienThoai: goc?.dien_thoai },
    tieuDe: loai === "hoa_don" ? "Hoá đơn dịch vụ" : "Lịch hẹn", gio: "10:30", trangThaiNhan: "Thanh toán một phần", bangChu: docSoTien(1_950_000), tienTruThe: 0, theSauTt: ["Thẻ mẫu 10 buổi (#M00001): còn 9/10 buổi"], ma: "HD-MAU-0001", ngay: homNayHCM(), thuNgan: "Nhân viên mẫu",
    khach: { ten: "Nguyễn Thị Mẫu", ma: "KH000123", sdt: "0900 000 000", gioiTinh: "nữ", namSinh: "1990", diem: 120 }, ghiChu: loai === "hoa_don" ? "Nhắc khách tái khám sau 2 tuần." : "Khách đến sớm 10 phút.",
    gioVaoRa: loai === "hoa_don" ? "10:30 – 11:30" : null,
    dong: loai === "hoa_don" ? [{ ten: "Dịch vụ mẫu A", soLuong: 1, donGia: 1_500_000, giamGia: 0, thanhTien: 1_500_000, nhanVien: ["Nhân viên A", "Nhân viên B"] }, { ten: "Sản phẩm mẫu B", soLuong: 2, donGia: 250_000, giamGia: 50_000, thanhTien: 450_000 }] : [{ ten: "Dịch vụ mẫu A", soLuong: 1, donGia: 0, giamGia: 0, thanhTien: 0 }, { ten: "Dịch vụ mẫu B", soLuong: 1, donGia: 0, giamGia: 0, thanhTien: 0 }],
    tongHang: 2_000_000, giamDon: 50_000, vatPct: 0, vatTien: 0, phuPhi: 0, tip: 0, phaiThu: 1_950_000, thanhToan: [{ nhan: "Thanh toán - Chuyển khoản", soTien: 1_000_000 }], conNo: 950_000,
  };
  return (
    <div>
      <TieuDeNoi icon={Printer} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Thiết lập in" phu="Khổ giấy, các dòng hiện trên tờ in hoá đơn / lịch hẹn và nội dung cuối tờ, theo từng chi nhánh. Chỉ cấu hình hiển thị." />
      <ThietLapInForm key={`${loai}-${ma}`} loai={loai} cn={ma} chiNhanh={(cn ?? []).map((x) => ({ id: x.id, ten: x.ten }))} dau={cauHinh} nguon={nguon} mau={mau} sua={coQuyen(nd, "hethong.phanquyen")} taiKhoan={(dsTk ?? []).map((x) => ({ id: x.id, nganHang: x.ngan_hang, so: x.so_tai_khoan, chu: x.chu_tai_khoan }))} luu={luuThietLapIn} />
    </div>
  );
}

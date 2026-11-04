import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Megaphone } from "lucide-react";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuBangTin } from "../actions";

export default async function TrangBangTin() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sua = coQuyen(nd, "danhmuc.sua");
  const { data: ds } = await sb().from("bang_tin").select("*").order("ghim", { ascending: false }).order("hien_tu", { ascending: false });
  const nay = homNayHCM();
  const trangThai = (r: NonNullable<typeof ds>[number]) => {
    if (!r.hoat_dong) return <NhanTrangThai kieu="tram">Đã ẩn</NhanTrangThai>;
    if (r.hien_tu > nay) return <NhanTrangThai kieu="cho">Chờ đến ngày</NhanTrangThai>;
    if (r.hien_den && r.hien_den < nay) return <NhanTrangThai kieu="tram">Hết hạn</NhanTrangThai>;
    return <NhanTrangThai kieu="tot">Đang hiển thị</NhanTrangThai>;
  };
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Tiêu đề", loai: "chu", batBuoc: true, rong: true }, { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true },
    { ten: "hien_tu", nhan: "Hiển thị từ ngày", loai: "ngay" }, { ten: "hien_den", nhan: "Đến hết ngày (bỏ trống = không hết hạn)", loai: "ngay" },
    { ten: "ghim", nhan: "Ghim lên đầu", loai: "gat" }, { ten: "hoat_dong", nhan: "Cho hiển thị", loai: "gat" },
  ];
  return (
    <div>
      <TieuDeNoi icon={Megaphone} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Bảng tin công ty" phu="Thông báo hiển thị cho toàn công ty ở Trang chủ, đăng và hẹn lịch hiển thị.">
        {sua && <NutHop nhan="Đăng tin" tieuDe="Đăng tin mới" truong={truong} action={luuBangTin} giaTri={{ hoat_dong: true, hien_tu: nay, ghim: false }} />}
      </TieuDeNoi>
      <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có tin nào."
        cot={[
          { nhan: "Tiêu đề", chinh: true, hienThi: (r) => <span className="text-muc">{r.ghim ? "Ghim · " : ""}{r.tieu_de}</span> },
          { nhan: "Hiển thị", hienThi: (r) => `${ngayVN(r.hien_tu)}${r.hien_den ? ` – ${ngayVN(r.hien_den)}` : ""}` },
          { nhan: "Trạng thái", hienThi: trangThai },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tin" truong={truong} action={luuBangTin} giaTri={{ id: r.id, tieu_de: r.tieu_de, noi_dung: r.noi_dung, hien_tu: r.hien_tu, hien_den: r.hien_den ?? "", ghim: r.ghim, hoat_dong: r.hoat_dong }} /> : null) },
        ]} />
    </div>
  );
}

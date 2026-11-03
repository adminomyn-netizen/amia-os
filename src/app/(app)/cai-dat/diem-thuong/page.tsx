import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Award } from "lucide-react";
import { DiemKhachHangForm } from "@/components/cai-dat/DiemKhachHang";
import { layDiemKhachHang } from "@/lib/diem-khach-hang";
import { luuDiemKhachHang } from "./actions";

/** Điểm khách hàng, đối chiếu SalonHero #/loyaltyPoint (đọc 29/10/2026). Chỉ Chủ / Kỹ thuật (hethong.phanquyen) xem và sửa. */
export default async function TrangDiemKhachHang() {
  await yeuCauQuyen("hethong.phanquyen");
  const t = await layDiemKhachHang(sb());
  return (
    <div>
      <TieuDeNoi icon={Award} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Điểm khách hàng" />
      <DiemKhachHangForm dau={t} sua luu={luuDiemKhachHang} />
    </div>
  );
}

import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { DiemKhachHangForm } from "@/components/cai-dat/DiemKhachHang";
import { layDiemKhachHang } from "@/lib/diem-khach-hang";
import { luuDiemKhachHang } from "./actions";

/** Điểm khách hàng, đối chiếu SalonHero #/loyaltyPoint (đọc 29/10/2026). Chỉ Chủ / Kỹ thuật (hethong.phanquyen) xem và sửa. */
export default async function TrangDiemKhachHang() {
  await yeuCauQuyen("hethong.phanquyen");
  const t = await layDiemKhachHang(sb());
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Điểm khách hàng" />
      <DiemKhachHangForm dau={t} sua luu={luuDiemKhachHang} />
    </div>
  );
}

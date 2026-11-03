import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { SlidersHorizontal } from "lucide-react";
import { ThietLapKhacForm } from "@/components/cai-dat/ThietLapKhac";
import { layThietLapKhac } from "@/lib/thiet-lap-khac";
import { luuThietLapKhac } from "./actions";

/** Ngày tháng + Tiền tệ & thuế, đối chiếu SalonHero #/othersettings (đọc 29/10/2026). */
export default async function TrangThietLapKhac() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const t = await layThietLapKhac(sb());
  return (
    <div>
      <TieuDeNoi icon={SlidersHorizontal} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Các thiết lập khác" phu="Ngày tháng, ngôn ngữ, tiền tệ, thuế VAT, phụ phí và tiền tip." />
      <ThietLapKhacForm dau={t} sua={coQuyen(nd, "hethong.phanquyen")} luu={luuThietLapKhac} />
    </div>
  );
}

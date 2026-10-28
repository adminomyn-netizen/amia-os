import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { ThietLapKhacForm } from "@/components/cai-dat/ThietLapKhac";
import { layThietLapKhac } from "@/lib/thiet-lap-khac";
import { luuThietLapKhac } from "./actions";

/** Ngày tháng + Tiền tệ & thuế, đối chiếu SalonHero #/othersettings (đọc 29/10/2026). */
export default async function TrangThietLapKhac() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const t = await layThietLapKhac(sb());
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Các thiết lập khác" phu="Ngày tháng, ngôn ngữ, tiền tệ, thuế VAT, phụ phí và tiền tip." />
      <ThietLapKhacForm dau={t} sua={coQuyen(nd, "hethong.phanquyen")} luu={luuThietLapKhac} />
    </div>
  );
}

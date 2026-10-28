import Link from "next/link";
import { headers } from "next/headers";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { WebDatLichForm } from "@/components/cai-dat/WebDatLich";
import { layWebDatLich } from "@/lib/web-dat-lich";
import { luuWebDatLich } from "./actions";

/** Web đặt Lịch, đối chiếu SalonHero #/setting-public-booking (đọc 29/10/2026). */
export default async function TrangWebDatLich() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const t = await layWebDatLich(sb());
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const giaoThuc = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Web đặt Lịch" />
      <WebDatLichForm dau={t} sua={coQuyen(nd, "nhanvien.quanly")} duongDan={`${giaoThuc}://${host}/dat-lich`} luu={luuWebDatLich} />
    </div>
  );
}

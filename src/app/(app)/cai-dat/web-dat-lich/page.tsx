import { headers } from "next/headers";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { CalendarCheck } from "lucide-react";
import { WebDatLichForm } from "@/components/cai-dat/WebDatLich";
import { layWebDatLich } from "@/lib/web-dat-lich";
import { anhBlogUrl } from "@/lib/blog";
import { luuWebDatLich } from "./actions";

/** Web đặt Lịch, đối chiếu SalonHero #/setting-public-booking (đọc 29/10/2026). */
export default async function TrangWebDatLich() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const db = sb();
  const [t, { data: cn }] = await Promise.all([layWebDatLich(db), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const giaoThuc = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return (
    <div>
      <TieuDeNoi icon={CalendarCheck} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Web đặt Lịch" />
      <WebDatLichForm dau={t} sua={coQuyen(nd, "nhanvien.quanly")} duongDan={`${giaoThuc}://${host}/dat-lich`} luu={luuWebDatLich} chiNhanh={cn ?? []} anhBiaUrl={anhBlogUrl(t.anhBia)} />
    </div>
  );
}

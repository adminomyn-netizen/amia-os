import { Suspense } from "react";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { yeuCauQuyen } from "@/lib/auth";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { ChonKy } from "@/components/trang-chu/ChonKy";
import { ChonKhoangNgay } from "@/components/trang-chu/ChonKhoangNgay";
import { DS_KY_DT, khoangKyDt, kyTruoc, type KyDt } from "@/lib/ky-xep-hang";
import { BangMkt } from "./bang";

/** Kỳ xem của báo cáo marketing (chị Lâm 18/11/2026: "xem ngày nay, hôm qua, tuần, tháng"): bộ kỳ của Tổng quan › Doanh thu, bỏ 90 ngày, thêm 7 ngày qua. */
type KyMkt = Exclude<KyDt, "90-ngay"> | "7-ngay";
const DS_KY_MKT: { ma: KyMkt; ten: string }[] = DS_KY_DT.filter((k) => k.ma !== "90-ngay").flatMap((k) => (k.ma === "tuan-nay" ? [{ ma: "7-ngay" as const, ten: "7 ngày qua" }, k] : [k])) as { ma: KyMkt; ten: string }[];
const GOC = "/marketing/bao-cao?xem=1";

export default async function TrangBaoCaoMkt({ searchParams }: { searchParams: Promise<{ ky?: string; tu?: string; den?: string }> }) {
  const nd = await yeuCauQuyen("mkt.xem");
  const sp = await searchParams, hom = homNayHCM();
  // Đường dẫn cũ chỉ có ?tu=&den= (nút Excel, link đã gửi) vẫn mở đúng khoảng: coi như Tùy chỉnh.
  const ky: KyMkt = DS_KY_MKT.some((k) => k.ma === sp.ky) ? (sp.ky as KyMkt) : sp.tu || sp.den ? "tuy-chinh" : "thang-nay";
  const khoang = ky === "7-ngay" ? { tu: congNgay(hom, -6), den: hom, nhan: "7 ngày qua" } : khoangKyDt(ky, hom, sp.tu, sp.den);
  const truoc = kyTruoc(ky === "7-ngay" ? "90-ngay" : ky, khoang.tu, khoang.den); // 7 ngày ↔ 7 ngày ngay trước đó
  const themTc = `&tu=${khoang.tu}&den=${khoang.den}`;
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Báo cáo marketing" phu="Chi phí quảng cáo, tin nhắn Pancake, lead và phễu tới thực thu. Khách đến và doanh thu lấy từ lịch hẹn, hoá đơn và thanh toán, không phải số nhập tay.">
        <NutXuatExcel loai="marketing" ten="báo cáo marketing theo khoảng ngày đang chọn" tham={{ tu: khoang.tu, den: khoang.den }} />
      </TieuDeNoi>
      <ChonKy dang={ky} goc={GOC} ds={DS_KY_MKT} them={{ "tuy-chinh": themTc }} luoi />
      {ky === "tuy-chinh" && <ChonKhoangNgay goc={GOC} tu={khoang.tu} den={khoang.den} />}
      <Suspense key={`${ky}-${khoang.tu}-${khoang.den}`} fallback={<KhungCho />}>
        <BangMkt cn={nd.chiNhanhId} khoang={khoang} truoc={truoc} homNay={hom} />
      </Suspense>
    </div>
  );
}

function KhungCho() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-hop bg-vien/60" />)}</div>
      <div className="h-56 animate-pulse rounded-hop bg-vien/50" />
    </div>
  );
}

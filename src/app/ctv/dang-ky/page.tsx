import type { Metadata } from "next";
import { sb } from "@/lib/db";
import { nhanMucHoaHong } from "@/lib/marketing";
import { DangKyCtv } from "../BieuMau";

export const dynamic = "force-dynamic";
const GOC = (process.env.NEXT_PUBLIC_SITE_URL || "https://lammec.mscvn.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Đăng ký đối tác giới thiệu · AMIA Phòng khám da liễu",
  description: "Trở thành đối tác giới thiệu của AMIA – Phòng khám da liễu tiên phong công nghệ cao, 39A Lê Hồng Phong, TP. Vinh. Nhận hoa hồng khi người được giới thiệu sử dụng dịch vụ.",
  robots: { index: true, follow: true },
};

/** TRANG CÔNG KHAI: CTV tự đăng ký (họ tên, SĐT di động = mã REF, email, đồng ý điều khoản, mã 6 số qua email). Chỉ đọc mức hoa hồng mặc định + công tắc mở cổng. */
export default async function TrangDangKyCtv() {
  const { data: ch } = await sb().from("cau_hinh").select("khoa, gia_tri").in("khoa", ["ctv.cong_mo", "ctv.tu_dang_ky_kieu", "ctv.tu_dang_ky_gia_tri"]);
  const cfg = new Map((ch ?? []).map((x) => [x.khoa, x.gia_tri]));
  const mo = (cfg.get("ctv.cong_mo") ?? "1") === "1";
  const kieu = cfg.get("ctv.tu_dang_ky_kieu") === "tien" ? "tien" : "phan_tram";
  const muc = nhanMucHoaHong(kieu, Number(cfg.get("ctv.tu_dang_ky_gia_tri") ?? 0));
  const mucHh = kieu === "tien" ? `${muc} cho mỗi hoá đơn` : `${muc} trên số tiền thực trả của mỗi hoá đơn`;
  return (
    <div className="space-y-5">
      <section className="rounded-the bg-[linear-gradient(135deg,#0a2b26,#006f62)] px-5 py-6 text-white">
        <h1 className="text-[22px] font-semibold leading-snug">Trở thành đối tác giới thiệu cùng AMIA</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-white/85">Hoa hồng <b className="text-[#d9b877]">{mucHh}</b> của người được anh/chị giới thiệu, cho lịch hẹn đặt qua link / mã QR (hoặc báo số điện thoại của anh/chị với lễ tân).</p>
      </section>
      <section className="rounded-the border border-vien bg-giay-sang p-4 sm:p-5">
        {mo ? <DangKyCtv goc={GOC} mucHh={mucHh} /> : <p className="text-[14.5px] text-muc-2">Phòng khám đang tạm dừng nhận đăng ký đối tác mới. Anh/chị vui lòng liên hệ phòng khám để được hỗ trợ.</p>}
      </section>
      <section className="space-y-2 text-[13.5px] leading-relaxed text-muc-2">
        <h2 className="text-[15px] font-semibold text-muc">Cách hoạt động</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Đăng ký bằng số điện thoại di động; số này là mã giới thiệu (REF) của anh/chị.</li>
          <li>Chia sẻ link đặt hẹn hoặc mã QR cho người thân, người quen.</li>
          <li>Khi người được giới thiệu sử dụng dịch vụ và thanh toán, hoa hồng được ghi nhận tự động trong Cổng CTV.</li>
          <li>Đủ mức tối thiểu, anh/chị gửi yêu cầu thanh toán ngay trong cổng.</li>
        </ol>
      </section>
    </div>
  );
}

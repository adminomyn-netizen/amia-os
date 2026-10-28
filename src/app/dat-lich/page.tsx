import Image from "next/image";
import type { Metadata } from "next";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { FormDatLich } from "./FormDatLich";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Đặt lịch hẹn · AMIA", description: "Chọn chi nhánh, dịch vụ và giờ hẹn tại AMIA Beauty Center.", robots: { index: false } };

/** TRANG CÔNG KHAI (không đăng nhập): chỉ hiện tên chi nhánh, địa chỉ, số điện thoại, tên + thời lượng dịch vụ đã được bật đặt online. Không có giá, không có dữ liệu khách. */
export default async function TrangDatLich() {
  const db = sb();
  const [{ data: mo }, { data: cn }, { data: dv }, { data: nhom }, { data: cho }] = await Promise.all([
    db.from("cau_hinh").select("gia_tri").eq("khoa", "dat_online.mo").maybeSingle(),
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").eq("hoat_dong", true).eq("hien_dat_lich", true).order("thu_tu").order("ma"),
    db.from("dich_vu").select("id, ten, thoi_luong_phut, nhom_id").eq("hoat_dong", true).eq("dat_online", true).order("ma"),
    db.from("dich_vu_nhom").select("id, ten, thu_tu").order("thu_tu"),
    db.from("cho_lam").select("chi_nhanh_id").eq("hoat_dong", true),
  ]);
  const tenNhom = new Map((nhom ?? []).map((n) => [n.id, n.ten]));
  const cnCoCho = (cn ?? []).filter((c) => (cho ?? []).some((x) => x.chi_nhanh_id === c.id));
  const san = mo?.gia_tri === "1" && cnCoCho.length > 0 && (dv ?? []).length > 0;
  const sdt = (cn ?? []).map((c) => c.dien_thoai).filter(Boolean)[0];
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-8 sm:py-12">
      <Image src="/logo-amia.png" alt="AMIA Beauty Center" width={150} height={65} priority className="mb-6 h-auto w-[120px]" />
      <h1 className="chu-tieu-de text-[30px] leading-tight text-muc">Đặt lịch hẹn</h1>
      <p className="mb-7 mt-1.5 text-[14px] text-muc-3">Chọn dịch vụ và giờ còn trống, để lại số điện thoại. Phòng khám sẽ gọi xác nhận với bạn.</p>
      {san
        ? <FormDatLich chiNhanh={cnCoCho.map((c) => ({ id: c.id, ten: c.ten, dia_chi: c.dia_chi }))} dichVu={(dv ?? []).map((d) => ({ id: d.id, ten: d.ten, phut: d.thoi_luong_phut, nhom: tenNhom.get(d.nhom_id) ?? "Dịch vụ" }))} homNay={homNayHCM()} />
        : <div className="rounded-the border border-vien bg-giay-sang p-5 text-[15px] text-muc-2"><p className="font-semibold text-muc">Đặt lịch online hiện chưa mở.</p><p className="mt-1">{sdt ? `Vui lòng gọi ${sdt} để đặt lịch.` : "Vui lòng liên hệ trực tiếp phòng khám để đặt lịch."}</p></div>}
    </main>
  );
}

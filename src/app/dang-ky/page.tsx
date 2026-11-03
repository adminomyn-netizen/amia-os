import Image from "next/image";
import { redirect } from "next/navigation";
import { sb } from "@/lib/db";
import { FormDangKy } from "./FormDangKy";

export const dynamic = "force-dynamic";

/** Chị Lâm 03/11/2026: không cho đăng ký tự do nữa, Kỹ thuật tạo tài khoản ở trang Nhân viên. Công tắc dang_ky.mo đang tắt thì trang này đưa về đăng nhập. */
export default async function TrangDangKy() {
  const [{ data: mo }, { data: cn }] = await Promise.all([
    sb().from("cau_hinh").select("gia_tri").eq("khoa", "dang_ky.mo").maybeSingle(),
    sb().from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
  ]);
  if ((mo?.gia_tri ?? "1") === "0") redirect("/dang-nhap");
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="nen-toi hidden flex-col justify-between p-14 text-menu-chu lg:flex">
        <Image src="/logo-amia-trang.png" alt="AMIA Beauty Center" width={180} height={78} priority className="h-auto w-[170px]" />
        <div>
          <h1 className="chu-tieu-de text-[38px] leading-[1.15] text-menu-sang">Mỗi vật tư ra khỏi kho<br />đều có phiếu và người nhận.</h1>
          <p className="mt-4 max-w-md text-[15px] text-menu-chu-phu">Khách hàng, lịch hẹn, thu ngân, thẻ liệu trình và cấp vật tư trước ca, gói trong một phần mềm riêng của AMIA.</p>
        </div>
        <p className="text-[12px] text-menu-chu-phu">AMIA Beauty Center · Phòng khám da liễu</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="the-noi vao w-full max-w-[420px] p-8 pt-9">
          <Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-8 h-auto w-[130px] lg:hidden" />
          <FormDangKy chiNhanh={cn ?? []} />
        </div>
      </section>
    </main>
  );
}

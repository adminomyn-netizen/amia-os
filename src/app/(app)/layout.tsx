import { cookies } from "next/headers";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { sb } from "@/lib/db";
import { locMenu } from "@/lib/nav";
import { Sidebar } from "@/components/layout/Sidebar";
import { DauTrang } from "@/components/layout/DauTrang";
import { ThanhTabDuoi } from "@/components/layout/ThanhTabDuoi";

/** Khung dùng chung: menu + đầu trang đứng yên khi đổi trang, chỉ phần nội dung bên dưới đổi (kèm loading.tsx). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nd = await layNguoiDungDangNhap(true);
  const thuGon = (await cookies()).get("amia_thu_gon")?.value === "1";
  const muc = (nd.phaiDoiMatKhau ? [] : locMenu(nd)).map((m) => ({ ten: m.ten, duong_dan: m.duong_dan, nhom: m.nhom, moTa: m.moTa }));
  let chiNhanh: string | null = null;
  if (nd.chiNhanhId) chiNhanh = (await sb().from("chi_nhanh").select("ten").eq("id", nd.chiNhanhId).maybeSingle()).data?.ten ?? null;
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar muc={muc} thuGonBanDau={thuGon} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DauTrang hoTen={nd.hoTen} vaiTro={nd.vaiTro} chucDanh={nd.chucDanh} email={nd.email} chiNhanh={chiNhanh} anh={nd.anhDaiDien} muc={muc} />
        <main className="flex-1 px-4 pb-32 pt-6 lg:px-12 lg:pb-16 lg:pt-8">{children}</main>
        {muc.length > 0 && <ThanhTabDuoi muc={muc} />}
      </div>
    </div>
  );
}

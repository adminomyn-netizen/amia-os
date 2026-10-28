import { layNguoiDungDangNhap } from "@/lib/auth";
import { sb } from "@/lib/db";
import { chucNangCon, coMotQuyen, locMenu, sapXepNgang } from "@/lib/nav";
import { moduleTheoMa } from "@/lib/module";
import { NHAN_VAI_TRO } from "@/lib/quyen";
import { ThanhBen } from "@/components/layout/ThanhNgang";
import { DauTrangMay } from "@/components/layout/DauTrangMay";
import { DauTrang } from "@/components/layout/DauTrang";
import { ThanhTabDuoi } from "@/components/layout/ThanhTabDuoi";
import { CuonVeDau } from "@/components/layout/CuonVeDau";

/** Khung dùng chung: thanh menu ngang (máy tính) / đầu trang + thanh tab dưới (điện thoại) đứng yên khi đổi trang, chỉ phần nội dung bên dưới đổi (kèm loading.tsx). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nd = await layNguoiDungDangNhap(true);
  const dsMuc = nd.phaiDoiMatKhau ? [] : locMenu(nd);
  const muc = dsMuc.map((m) => ({ ten: m.ten, duong_dan: m.duong_dan, nhom: m.nhom, moTa: m.moTa }));
  const mucNgang = sapXepNgang(dsMuc.map((m) => ({ ten: m.ten, ngan: m.ngan ?? m.ten, duong_dan: m.duong_dan, nhom: m.nhom, moTa: m.moTa, con: chucNangCon(nd, m.duong_dan) })));
  const mdCD = moduleTheoMa("cai-dat");
  const caiDat = nd.phaiDoiMatKhau || !mdCD || !coMotQuyen(nd, mdCD.quyen) ? [] : mdCD.nhom
    .map((g) => ({ nhan: g.nhan, the: g.the.filter((t) => coMotQuyen(nd, t.quyen)).map((t) => ({ ten: t.ten, moTa: t.moTa, duongDan: t.duongDan })) }))
    .filter((g) => g.the.length > 0);
  let chiNhanh: string | null = null;
  if (nd.chiNhanhId) chiNhanh = (await sb().from("chi_nhanh").select("ten").eq("id", nd.chiNhanhId).maybeSingle()).data?.ten ?? null;
  return (
    <div className="khung-di-dong flex min-h-screen w-full flex-col">
      <DauTrangMay hoTen={nd.hoTen} vaiTro={NHAN_VAI_TRO[nd.vaiTro]} chucDanh={nd.chucDanh} email={nd.email} chiNhanh={chiNhanh} anh={nd.anhDaiDien} caiDat={caiDat} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <ThanhBen muc={mucNgang} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DauTrang hoTen={nd.hoTen} vaiTro={nd.vaiTro} chucDanh={nd.chucDanh} email={nd.email} chiNhanh={chiNhanh} anh={nd.anhDaiDien} caiDat={caiDat} />
          <main id="noi-dung-chinh" className="noi-dung-cuon min-h-0 flex-1 px-4 pb-8 pt-6 lg:px-10 lg:pb-16 lg:pt-6">{children}</main>
          <CuonVeDau />
          {muc.length > 0 && <ThanhTabDuoi muc={muc} />}
        </div>
      </div>
    </div>
  );
}

import { layNguoiDungDangNhap } from "@/lib/auth";
import { sb } from "@/lib/db";
import { tatCaChiNhanh } from "@/lib/chi-nhanh";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { chucNangCon, coMotQuyen, locMenu, sapXepNgang } from "@/lib/nav";
import { moduleTheoMa } from "@/lib/module";
import { NHAN_VAI_TRO } from "@/lib/quyen";
import { ThanhBen } from "@/components/layout/ThanhNgang";
import { DauTrangMay } from "@/components/layout/DauTrangMay";
import { DauTrang } from "@/components/layout/DauTrang";
import { ThanhTabDuoi } from "@/components/layout/ThanhTabDuoi";
import { CuonVeDau } from "@/components/layout/CuonVeDau";
import { ChatNoi } from "@/components/chat/ChatNoi";

/** Khung dùng chung: thanh menu ngang (máy tính) / đầu trang + thanh tab dưới (điện thoại) đứng yên khi đổi trang, chỉ phần nội dung bên dưới đổi (kèm loading.tsx). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nd = await layNguoiDungDangNhap(true);
  const dsMuc = nd.phaiDoiMatKhau ? [] : locMenu(nd);
  const muc = dsMuc.map((m) => ({ ten: m.ten, duong_dan: m.duong_dan, nhom: m.nhom, moTa: m.moTa }));
  // Danh sách chi nhánh nhớ đệm 2 phút (xoá ngay khi sửa chi nhánh): khỏi hỏi CSDL 2 lần ở MỌI trang.
  const dsChiNhanh = await tatCaChiNhanh().catch(() => []);
  // Số lịch hẹn hôm nay (còn hiệu lực) hiện chấm đỏ cạnh "Lịch hẹn" như SalonHero; lỗi truy vấn thì thôi, không làm hỏng khung trang.
  let demLich = 0;
  if (dsMuc.some((m) => m.duong_dan === "/lich-hen")) {
    try {
      const hn = homNayHCM();
      const cn = nd.chiNhanhId ?? dsChiNhanh.find((c) => c.hoat_dong)?.id;
      if (cn) demLich = (await sb().from("lich_hen").select("id", { count: "exact", head: true }).eq("chi_nhanh_id", cn).gte("bat_dau", new Date(`${hn}T00:00:00+07:00`).toISOString()).lt("bat_dau", new Date(`${congNgay(hn, 1)}T00:00:00+07:00`).toISOString()).not("trang_thai", "in", "(huy,khong_den)")).count ?? 0;
    } catch { demLich = 0; }
  }
  const mucNgang = sapXepNgang(dsMuc.map((m) => ({ ten: m.ten, ngan: m.ngan ?? m.ten, duong_dan: m.duong_dan, nhom: m.nhom, moTa: m.moTa, con: chucNangCon(nd, m.duong_dan), dem: m.duong_dan === "/lich-hen" ? demLich : 0 })));
  const mdCD = moduleTheoMa("cai-dat");
  const caiDat = nd.phaiDoiMatKhau || !mdCD || !coMotQuyen(nd, mdCD.quyen) ? [] : mdCD.nhom
    .map((g) => ({ nhan: g.nhan, the: g.the.filter((t) => coMotQuyen(nd, t.quyen)).map((t) => ({ ten: t.ten, moTa: t.moTa, duongDan: t.duongDan })) }))
    .filter((g) => g.the.length > 0);
  const chiNhanh = nd.chiNhanhId ? (dsChiNhanh.find((c) => c.id === nd.chiNhanhId)?.ten ?? null) : null;
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
          {!nd.phaiDoiMatKhau && <ChatNoi choPhepSua={nd.vaiTro === "chu" || nd.vaiTro === "ky_thuat"} hoTen={nd.hoTen} />}
        </div>
      </div>
    </div>
  );
}

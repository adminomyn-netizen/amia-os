import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { luuTiLe, xoaTiLe } from "./actions";

const TAB = [{ ma: "bang", ten: "Bảng hoa hồng" }, { ma: "ti-le", ten: "Tỉ lệ hoa hồng" }];
const LOAI = [{ gia_tri: "dich_vu", nhan: "Dịch vụ" }, { gia_tri: "san_pham", nhan: "Sản phẩm" }, { gia_tri: "goi_the", nhan: "Bán thẻ / liệu trình" }];
const VAI = [{ gia_tri: "phuc_vu", nhan: "Phục vụ" }, { gia_tri: "tu_van", nhan: "Tư vấn" }, { gia_tri: "ban", nhan: "Bán hàng" }];
const nhan = (lc: { gia_tri: string; nhan: string }[], v: string) => lc.find((x) => x.gia_tri === v)?.nhan ?? v;

export default async function TrangHoaHong({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("baocao.tien");
  const sp = await searchParams;
  const tab = sp.tab === "ti-le" ? "ti-le" : "bang";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const sua = coQuyen(nd, "danhmuc.sua");
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  let noiDung: React.ReactNode;
  if (tab === "bang") {
    const [{ data }, { data: nv }] = await Promise.all([db.rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: cn as string }), db.from("nhan_vien").select("id, ho_ten")]);
    const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const theo = new Map<string, { id: string; ds: number; hh: number; chiTiet: string[] }>();
    for (const r of data ?? []) { const g = theo.get(r.nhan_vien_id) ?? { id: r.nhan_vien_id, ds: 0, hh: 0, chiTiet: [] }; g.ds += Number(r.doanh_so); g.hh += Number(r.hoa_hong); g.chiTiet.push(`${nhan(VAI, r.vai)} ${tienVN(r.hoa_hong)}`); theo.set(r.nhan_vien_id, g); }
    const ds = [...theo.values()].sort((a, b) => b.hh - a.hh);
    noiDung = (
      <>
        <LocBaoCao goc="/hoa-hong" tu={tu} den={den} />
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có doanh số nào có gán người hưởng trong khoảng này."
          cot={[{ nhan: "Nhân viên", hienThi: (r) => <span className="text-muc">{tenNv.get(r.id)}</span> }, { nhan: "Doanh số", hienThi: (r) => tienVN(r.ds), phai: true }, { nhan: "Theo vai", hienThi: (r) => r.chiTiet.join(" · ") }, { nhan: "Hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hh)}</span>, phai: true }]} />
        <p className="mt-3 text-[12px] text-muc-3">Hoa hồng tạm tính theo tỉ lệ đang cài. Mục chưa cài tỉ lệ tính 0. Phí thực hiện theo buổi cho KTV và hoa hồng giới thiệu chưa có trong bản này.</p>
      </>
    );
  } else {
    const [{ data: tl }, { data: dv }, { data: sp2 }, { data: g }] = await Promise.all([db.from("hoa_hong_ti_le").select("*").order("loai").order("vai"), db.from("dich_vu").select("id, ten"), db.from("san_pham").select("id, ten"), db.from("goi_the").select("id, ten")]);
    const ten = new Map<string, string>([...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => [x.id, x.ten]));
    const mucLC = [{ gia_tri: "", nhan: "Mặc định cả loại" }, ...[...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => ({ gia_tri: x.id, nhan: x.ten }))];
    const truong = [{ ten: "loai", nhan: "Loại", loai: "chon" as const, luaChon: LOAI, batBuoc: true }, { ten: "vai", nhan: "Vai", loai: "chon" as const, luaChon: VAI, batBuoc: true },
      { ten: "muc_id", nhan: "Áp dụng cho (chọn mục cụ thể để đặt riêng)", loai: "chon" as const, luaChon: mucLC, rong: true }, { ten: "ti_le", nhan: "Tỉ lệ hoa hồng (%)", loai: "so" as const, batBuoc: true }];
    noiDung = (
      <>
        {sua && <div className="mb-4"><NutHop nhan="Thêm tỉ lệ" tieuDe="Thêm tỉ lệ hoa hồng" moTa="Tỉ lệ riêng cho một dịch vụ, sản phẩm hoặc gói thắng tỉ lệ mặc định của loại đó." truong={truong} giaTri={{ loai: "dich_vu", vai: "ban", muc_id: "" }} action={luuTiLe} /></div>}
        <Bang duLieu={tl ?? []} khoa={(r) => r.id} trong="Chưa cài tỉ lệ nào: mọi hoa hồng đang tính 0."
          cot={[{ nhan: "Loại", hienThi: (r) => nhan(LOAI, r.loai) }, { nhan: "Vai", hienThi: (r) => nhan(VAI, r.vai) }, { nhan: "Áp dụng cho", hienThi: (r) => (r.muc_id ? ten.get(r.muc_id) ?? "" : "Mặc định cả loại") }, { nhan: "Tỉ lệ", hienThi: (r) => `${Number(r.ti_le)}%`, phai: true },
            ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof tl>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tỉ lệ" truong={truong} giaTri={{ loai: r.loai, vai: r.vai, muc_id: r.muc_id ?? "", ti_le: Number(r.ti_le) }} action={luuTiLe} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá tỉ lệ" xacNhan="Xoá tỉ lệ này?" an={{ id: r.id }} nhanLuu="Xoá" action={xoaTiLe} /></span> }] : [])]} />
      </>
    );
  }
  return (
    <>
      <TieuDeTrang tieuDe="Hoa hồng" phu="Tính từ hoá đơn đã chốt: doanh số chia theo vai Phục vụ, Tư vấn, Bán hàng, nhân tỉ lệ hoa hồng." />
      <Tab muc={TAB} dang={tab} goc="/hoa-hong" them={`${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}`} />
      {noiDung}
    </>
  );
}

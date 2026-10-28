import { yeuCauQuyen } from "@/lib/auth";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { SaoChepHoaHong } from "@/components/hoa-hong/SaoChepHoaHong";
import { apDungSaoChep, luuTiLe, xemTruocSaoChep, xoaTiLe } from "./actions";

const TAB = [{ ma: "bang", ten: "Bảng hoa hồng" }, { ma: "ti-le", ten: "Tỉ lệ hoa hồng" }];
const LOAI = [{ gia_tri: "dich_vu", nhan: "Dịch vụ" }, { gia_tri: "san_pham", nhan: "Sản phẩm" }, { gia_tri: "goi_the", nhan: "Bán thẻ / liệu trình" }];
const VAI = [{ gia_tri: "phuc_vu", nhan: "Phục vụ" }, { gia_tri: "tu_van", nhan: "Tư vấn" }, { gia_tri: "ban", nhan: "Bán hàng" }, { gia_tri: "gioi_thieu", nhan: "Giới thiệu" }];
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
    const [{ data: tl }, { data: dv }, { data: sp2 }, { data: g }, { data: nvs }] = await Promise.all([db.from("hoa_hong_ti_le").select("*").order("loai").order("vai"), db.from("dich_vu").select("id, ten"), db.from("san_pham").select("id, ten"), db.from("goi_the").select("id, ten"), db.from("nhan_vien").select("id, ho_ten, chuc_danh, hoat_dong").order("ho_ten")]);
    const ten = new Map<string, string>([...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => [x.id, x.ten]));
    const mucLC = [{ gia_tri: "", nhan: "Mặc định cả loại" }, ...[...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => ({ gia_tri: x.id, nhan: x.ten }))];
    // Đối tượng áp dụng: chung, nhóm theo chức danh (chuẩn hoá chữ thường, bỏ khoảng thừa), hoặc một nhân viên (người đang làm + người đã có cài đặt riêng).
    const chuan = (c: string | null) => (c ?? "").trim().toLowerCase();
    const nhom = new Map<string, string>();
    for (const n of nvs ?? []) if (n.hoat_dong && chuan(n.chuc_danh) && !nhom.has(chuan(n.chuc_danh))) nhom.set(chuan(n.chuc_danh), n.chuc_danh!.trim());
    for (const r of tl ?? []) if (r.nhom_chuc_danh && !nhom.has(r.nhom_chuc_danh)) nhom.set(r.nhom_chuc_danh, r.nhom_chuc_danh);
    const coRieng = new Set((tl ?? []).map((r) => r.nhan_vien_id).filter(Boolean));
    const tenNvMap = new Map((nvs ?? []).map((n) => [n.id, n.ho_ten]));
    const doiTuongLC = [{ gia_tri: "", nhan: "Mọi người (cài đặt chung)" }, ...[...nhom.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi")).map(([k, t]) => ({ gia_tri: `nhom:${k}`, nhan: `Nhóm: ${t}` })),
      ...(nvs ?? []).filter((n) => n.hoat_dong || coRieng.has(n.id)).map((n) => ({ gia_tri: `nv:${n.id}`, nhan: `Nhân viên: ${n.ho_ten}${n.hoat_dong ? "" : " (đã nghỉ)"}` }))];
    const tenDoiTuong = (r: NonNullable<typeof tl>[number]) => (r.nhan_vien_id ? `Nhân viên: ${tenNvMap.get(r.nhan_vien_id) ?? ""}` : r.nhom_chuc_danh ? `Nhóm: ${nhom.get(r.nhom_chuc_danh) ?? r.nhom_chuc_danh}` : "Mọi người");
    const maDoiTuong = (r: NonNullable<typeof tl>[number]) => (r.nhan_vien_id ? `nv:${r.nhan_vien_id}` : r.nhom_chuc_danh ? `nhom:${r.nhom_chuc_danh}` : "");
    const dsTl = [...(tl ?? [])].sort((a, b) => (a.nhan_vien_id ? 2 : a.nhom_chuc_danh ? 1 : 0) - (b.nhan_vien_id ? 2 : b.nhom_chuc_danh ? 1 : 0) || tenDoiTuong(a).localeCompare(tenDoiTuong(b), "vi") || a.loai.localeCompare(b.loai) || a.vai.localeCompare(b.vai));
    const truong = [{ ten: "doi_tuong", nhan: "Áp dụng cho (nhân viên hoặc nhóm chức danh)", loai: "chon" as const, luaChon: doiTuongLC, rong: true, ghiChu: "Để “Mọi người” cho cài đặt chung. Cài riêng cho nhân viên thắng cài đặt nhóm, nhóm thắng cài đặt chung." },
      { ten: "loai", nhan: "Loại", loai: "chon" as const, luaChon: LOAI, batBuoc: true }, { ten: "vai", nhan: "Vai", loai: "chon" as const, luaChon: VAI, batBuoc: true },
      { ten: "muc_id", nhan: "Áp dụng cho (chọn mục cụ thể để đặt riêng)", loai: "chon" as const, luaChon: mucLC, rong: true }, { ten: "ti_le", nhan: "Tỉ lệ hoa hồng (%)", loai: "so" as const },
      { ten: "so_tien", nhan: "Hoặc cộng số tiền cố định mỗi lượt (đồng)", loai: "tien" as const, ghiChu: "Nhân với số lượng trên hoá đơn; có thể dùng cùng tỉ lệ." }];
    noiDung = (
      <>
        {sua && <div className="mb-4 flex flex-wrap gap-2.5"><NutHop nhan="Thêm tỉ lệ" tieuDe="Thêm tỉ lệ hoa hồng" moTa="Tỉ lệ riêng cho một dịch vụ, sản phẩm hoặc gói thắng tỉ lệ mặc định của loại đó; cài cho nhân viên hoặc nhóm thì thắng cài đặt chung." truong={truong} giaTri={{ doi_tuong: "", loai: "dich_vu", vai: "ban", muc_id: "" }} action={luuTiLe} />
          <SaoChepHoaHong luaChon={doiTuongLC.map((l) => (l.gia_tri === "" ? { gia_tri: "chung", nhan: l.nhan } : l))} tenMuc={Object.fromEntries(ten)} xemTruoc={xemTruocSaoChep} apDung={apDungSaoChep} /></div>}
        <Bang duLieu={dsTl} khoa={(r) => r.id} trong="Chưa cài tỉ lệ nào: mọi hoa hồng đang tính 0."
          cot={[{ nhan: "Áp dụng cho", chinh: true, hienThi: (r) => <span className="text-muc">{tenDoiTuong(r)}</span> }, { nhan: "Loại", hienThi: (r) => nhan(LOAI, r.loai) }, { nhan: "Vai", hienThi: (r) => nhan(VAI, r.vai) }, { nhan: "Mục", hienThi: (r) => (r.muc_id ? ten.get(r.muc_id) ?? "" : "Mặc định cả loại") }, { nhan: "Tỉ lệ", hienThi: (r) => `${Number(r.ti_le)}%`, phai: true },
            { nhan: "Số tiền cố định / lượt", hienThi: (r) => (r.so_tien ? tienVN(r.so_tien) : ""), phai: true },
            ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof tl>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tỉ lệ" truong={truong} giaTri={{ doi_tuong: maDoiTuong(r), loai: r.loai, vai: r.vai, muc_id: r.muc_id ?? "", ti_le: Number(r.ti_le), so_tien: r.so_tien ?? 0 }} action={luuTiLe} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá tỉ lệ" xacNhan="Xoá tỉ lệ này?" an={{ id: r.id }} nhanLuu="Xoá" action={xoaTiLe} /></span> }] : [])]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Thứ tự áp dụng khi tính (người đầu thắng): nhân viên + mục cụ thể, nhân viên + cả loại, nhóm + mục cụ thể, nhóm + cả loại, chung + mục cụ thể, chung + cả loại; không có dòng nào thì 0. Hoa hồng một dòng hàng = (doanh số × tỉ lệ + số tiền cố định × số lượng) × tỉ lệ chia người. Nhóm = chức danh trong hồ sơ nhân viên. Đổi cài đặt chỉ ảnh hưởng số tính lại từ nay, hoá đơn đã chốt vào bảng lương không đổi. Vai Giới thiệu dùng cho báo cáo hoa hồng giới thiệu. Tự thiết kế, chưa đối chiếu SalonHero.</p>
      </>
    );
  }
  return (
    <>
      <TieuDeTrang tieuDe="Hoa hồng" phu="Tính từ hoá đơn đã chốt: doanh số chia theo vai Phục vụ, Tư vấn, Bán hàng, nhân tỉ lệ hoa hồng.">
        {tab === "bang" ? <NutXuatExcel loai="hoa-hong" ten="bảng hoa hồng theo bộ lọc đang chọn" tham={{ tu, den, cn: sp.cn }} /> : <NutXuatExcel loai="ti-le-hoa-hong" ten="tỉ lệ hoa hồng" />}
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/hoa-hong" them={`${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}`} />
      {noiDung}
    </>
  );
}

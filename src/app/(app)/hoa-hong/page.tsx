import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { docHet } from "@/lib/xuat-excel";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, tienVN } from "@/lib/dinh-dang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { NutTinhLai } from "@/components/hoa-hong/NutTinhLai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { SaoChepHoaHong } from "@/components/hoa-hong/SaoChepHoaHong";
import { NhapTiLeHoaHong } from "@/components/hoa-hong/NhapTiLeHoaHong";
import { apDungNhapTiLe, apDungSaoChep, luuTiLe, xemTruocNhapTiLe, xemTruocSaoChep, xoaTiLe } from "./actions";

const TAB = [{ ma: "bang", ten: "Bảng hoa hồng" }, { ma: "ti-le", ten: "Tỉ lệ hoa hồng" }];
const LOAI = [{ gia_tri: "dich_vu", nhan: "Dịch vụ" }, { gia_tri: "san_pham", nhan: "Sản phẩm" }, { gia_tri: "goi_the", nhan: "Bán thẻ / liệu trình" }];
const VAI = [{ gia_tri: "phuc_vu", nhan: "Phục vụ" }, { gia_tri: "tu_van", nhan: "Tư vấn" }, { gia_tri: "ban", nhan: "Bán hàng" }, { gia_tri: "gioi_thieu", nhan: "Giới thiệu" }];
const nhan = (lc: { gia_tri: string; nhan: string }[], v: string) => lc.find((x) => x.gia_tri === v)?.nhan ?? v;

export default async function TrangHoaHong({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string; q?: string }> }) {
  const nd = await yeuCauQuyen("baocao.tien");
  const sp = await searchParams;
  const tab = sp.tab === "ti-le" ? "ti-le" : "bang";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const sua = coQuyen(nd, "danhmuc.sua");
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  let noiDung: React.ReactNode;
  if (tab === "bang") {
    const [{ data, error: loiHh }, { data: nv }, { data: dsCn }] = await Promise.all([db.rpc("bc_hoa_hong_nv_nhom", { p_tu: tu, p_den: den, p_cn: cn as string }), db.from("nhan_vien").select("id, ho_ten, chuc_danh"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")]);
    const nvMap = new Map((nv ?? []).map((n) => [n.id, n]));
    type Nhom = { so: number; ds: number; hh: number };
    const theo = new Map<string, { id: string; nhom: Record<string, Nhom>; tong: number }>();
    for (const r of data ?? []) {
      const g = theo.get(r.nhan_vien_id) ?? { id: r.nhan_vien_id, nhom: {}, tong: 0 };
      g.nhom[r.nhom] = { so: r.so_dong, ds: Number(r.doanh_so), hh: Number(r.hoa_hong) }; g.tong += Number(r.hoa_hong); theo.set(r.nhan_vien_id, g);
    }
    const tuKhoa = boDau((sp.q ?? "").trim());
    const ds = [...theo.values()].filter((g) => !tuKhoa || boDau(nvMap.get(g.id)?.ho_ten ?? "").includes(tuKhoa)).sort((a, b) => b.tong - a.tong || (nvMap.get(a.id)?.ho_ten ?? "").localeCompare(nvMap.get(b.id)?.ho_ten ?? "", "vi"));
    const o = (g: (typeof ds)[number], k: string): Nhom => g.nhom[k] ?? { so: 0, ds: 0, hh: 0 };
    const coKhac = ds.some((g) => o(g, "khac").ds !== 0 || o(g, "khac").hh !== 0);
    const tongHh = ds.reduce((t, g) => t + g.tong, 0), tongDs = ds.reduce((t, g) => t + Object.values(g.nhom).reduce((x, y) => x + y.ds, 0), 0);
    const hienDs = (g: (typeof ds)[number], k: string) => <span className="block"><span className="tabular-nums">{tienVN(o(g, k).ds)}</span><span className="block text-[12px] text-muc-3">Số lượng: {o(g, k).so}</span></span>;
    const nutChiTiet = (g: (typeof ds)[number]) => <Link href={`/hoa-hong/chi-tiet?nv=${g.id}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Chi tiết</Link>;
    const cotNhom = [["tu_van", "tư vấn"], ["dich_vu", "d.vụ"], ["san_pham", "s.phẩm"], ["ban_the", "bán thẻ"]].flatMap(([k, t]) => [
      { nhan: `Doanh số ${t}`, phai: true, hienThi: (g: (typeof ds)[number]) => hienDs(g, k) }, { nhan: `Hoa hồng ${t}`, phai: true, hienThi: (g: (typeof ds)[number]) => tienVN(o(g, k).hh) },
    ]);
    if (loiHh) console.error("[hoa-hong]", loiHh.message);
    noiDung = loiHh ? (
      <>
        <LocBaoCao goc="/hoa-hong" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <div role="alert" className="rounded-nho bg-loi-nen px-3.5 py-3 text-[14px] text-loi">Chưa tính được hoa hồng vì hệ thống đang chậm (không phải do chưa có doanh số). Chờ vài giây rồi bấm tải lại, hoặc chọn khoảng ngày ngắn hơn.</div>
        <div className="mt-3"><NutTinhLai /></div>
      </>
    ) : (
      <>
        <LocBaoCao goc="/hoa-hong" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form method="get" action="/hoa-hong" className="flex flex-wrap gap-2">
            <input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />{sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm nhân viên" aria-label="Tìm nhân viên" className={`${O_NHAP} w-60`} />
            <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
          </form>
          <NutTinhLai />
        </div>
        <HangChiSo muc={[{ nhan: "Tổng hoa hồng", so: tienVN(tongHh), ghiChu: tongHh === 0 ? "chưa cài tỉ lệ nào nên đang tính 0" : undefined }, { nhan: "Tổng doanh số có gán người hưởng", so: tienVN(tongDs) }]} />
        <div className="mt-6" />
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có doanh số nào có gán người hưởng trong khoảng này."
          cot={[{ nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{nvMap.get(r.id)?.ho_ten}</span><span className="block text-[12px] text-muc-3">{nvMap.get(r.id)?.chuc_danh ?? ""}</span></span> },
            ...cotNhom,
            ...(coKhac ? [{ nhan: "Doanh số khác", phai: true, hienThi: (g: (typeof ds)[number]) => hienDs(g, "khac") }, { nhan: "Hoa hồng khác", phai: true, hienThi: (g: (typeof ds)[number]) => tienVN(o(g, "khac").hh) }] : []),
            { nhan: "Tổng hoa hồng", phai: true, hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.tong)}</span> }, { nhan: "", hienThi: nutChiTiet }]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Hoa hồng tạm tính theo tỉ lệ đang cài (mục chưa cài tỉ lệ tính 0). Doanh số dịch vụ làm bằng thẻ tính theo giá một buổi của thẻ (như SalonHero), còn hoa hồng vẫn tính trên doanh số hoá đơn, nơi dòng dịch vụ làm bằng thẻ bằng 0 nên chưa sinh hoa hồng — cách tính hoa hồng cho buổi làm bằng thẻ cần chị Lâm quyết. Doanh số tư vấn = các dòng đứng vai Tư vấn; dịch vụ = vai Phục vụ ở dòng dịch vụ; sản phẩm / bán thẻ = vai Bán hàng ở dòng sản phẩm / thẻ. “Tính lại hoa hồng” chỉ tải lại số: AMIA tính trực tiếp từ hoá đơn mỗi lần mở trang nên không có số cũ lưu sẵn. Phí thực hiện theo buổi cho chuyên viên trị liệu, hoa hồng giới thiệu và chấm điểm dịch vụ chưa có ở bản này.</p>
      </>
    );
  } else {
    const [tl, { data: dv }, { data: sp2 }, { data: g }, { data: nvs }] = await Promise.all([docHet((a, b) => db.from("hoa_hong_ti_le").select("*").order("id").range(a, b)), db.from("dich_vu").select("id, ten, hoat_dong"), db.from("san_pham").select("id, ten, hoat_dong"), db.from("goi_the").select("id, ten, hoat_dong"), db.from("nhan_vien").select("id, ho_ten, chuc_danh, hoat_dong").order("ho_ten")]);
    // Mục đang bán chưa có tỉ lệ riêng: dùng tỉ lệ mặc định của loại, không có mặc định thì hoa hồng tính 0.
    const chuaRieng = (loai: string, nhanLoai: string, ds: { id: string; hoat_dong: boolean }[] | null) => {
      const co = new Set((tl ?? []).filter((r) => r.loai === loai && r.muc_id).map((r) => r.muc_id));
      const n = (ds ?? []).filter((m) => m.hoat_dong && !co.has(m.id)).length;
      if (!n) return null;
      return `${n} ${nhanLoai} chưa có tỉ lệ riêng, ${(tl ?? []).some((r) => r.loai === loai && !r.muc_id) ? "đang dùng tỉ lệ mặc định của loại" : "chưa có tỉ lệ mặc định nên đang tính 0%"}.`;
    };
    const canhBao = (tl ?? []).length ? [chuaRieng("dich_vu", "dịch vụ", dv), chuaRieng("goi_the", "gói thẻ / liệu trình", g), chuaRieng("san_pham", "sản phẩm", sp2)].filter(Boolean) : [];
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
    const truong = [{ ten: "doi_tuong", nhan: "Áp dụng cho (nhân viên hoặc nhóm chức danh)", loai: "chon" as const, luaChon: doiTuongLC, rong: true, ghiChu: "Để “Mọi người” cho cài đặt chung. Cài riêng cho nhân viên thắng cài đặt nhóm, nhóm thắng cài đặt chung. Đặt 0% là loại riêng người/nhóm/mục đó khỏi hoa hồng; bấm Xoá thì quay về cài đặt chung." },
      { ten: "loai", nhan: "Loại", loai: "chon" as const, luaChon: LOAI, batBuoc: true }, { ten: "vai", nhan: "Vai", loai: "chon" as const, luaChon: VAI, batBuoc: true },
      { ten: "muc_id", nhan: "Áp dụng cho (chọn mục cụ thể để đặt riêng)", loai: "chon" as const, luaChon: mucLC, rong: true }, { ten: "ti_le", nhan: "Tỉ lệ hoa hồng (%)", loai: "so" as const },
      { ten: "so_tien", nhan: "Hoặc cộng số tiền cố định mỗi lượt (đồng)", loai: "tien" as const, ghiChu: "Nhân với số lượng trên hoá đơn; có thể dùng cùng tỉ lệ." }];
    noiDung = (
      <>
        {(tl ?? []).length === 0 && <div role="status" className="mb-4 border-l-2 border-nhan bg-giay-tram px-3 py-2.5 text-[14px] text-muc">Chưa cài tỉ lệ nào nên hoa hồng của mọi đơn đang tính 0. {sua && !nd.chiNhanhId ? "Bấm Nhập từ Excel để cài cả bảng một lần." : "Nhờ quản trị cài bảng tỉ lệ."}</div>}
        {canhBao.length > 0 && <ul className="mb-4 space-y-1 text-[13px] text-muc-2">{canhBao.map((c) => <li key={c}>{c}</li>)}</ul>}
        {sua && <div className="mb-4 flex flex-wrap gap-2.5">{!nd.chiNhanhId && <NhapTiLeHoaHong xemTruoc={xemTruocNhapTiLe} apDung={apDungNhapTiLe} />}<NutHop nhan="Thêm tỉ lệ" tieuDe="Thêm tỉ lệ hoa hồng" moTa="Tỉ lệ riêng cho một dịch vụ, sản phẩm hoặc gói thắng tỉ lệ mặc định của loại đó; cài cho nhân viên hoặc nhóm thì thắng cài đặt chung." truong={truong} giaTri={{ doi_tuong: "", loai: "dich_vu", vai: "ban", muc_id: "" }} action={luuTiLe} />
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

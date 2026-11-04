import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { docSanPhamKhoHangBan, locNhanHieuTim } from "@/lib/kho-hang-ban-doc";
import { boDau, soVN, tienVN } from "@/lib/dinh-dang";
import { AnhSanPham } from "@/components/kho/AnhSanPham";
import { ThanhKhoHangBan } from "@/components/kho/ThanhKhoHangBan";
import { demTinhTrang, khopTinhTrang, laTinhTrang, tongGiaTriKho, TINH_TRANG_KHO } from "@/lib/kho-hang-ban";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

const MOI_TRANG = 50;
type Sp = { cn?: string; nhom?: string; tt?: string; nh?: string; q?: string; trang?: string };

/** Quản lý kho hàng bán, đối chiếu SalonHero #/inventory: thanh liên kết (Tồn kho · Phiếu nhập · Phiếu xuất · Phiếu chuyển kho · Quản lý nhà cung cấp), cây Phân nhóm sản phẩm, lọc chi nhánh, 5 nhóm đếm, TỔNG GIÁ TRỊ KHO, lọc nhãn hiệu + ô tìm tên/mã, cột Ảnh / Tên sản phẩm / Nhãn hiệu / Chi nhánh / Đ.Vị / Số lượng / Giá nhập TB. Kho hàng bán = sản phẩm bán lẻ. */
export default async function TrangKhoHangBan({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === sp.cn) ? sp.cn! : "");
  const tt = laTinhTrang(sp.tt) ? sp.tt : "tat_ca";
  const spDu = await docSanPhamKhoHangBan(db, cn);
  const dsNhanHieu = [...new Set(spDu.map((s) => s.nhan_hieu).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "vi"));
  const nh = sp.nh && dsNhanHieu.includes(sp.nh) ? sp.nh : "";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const spAll = locNhanHieuTim(spDu, nh, q, boDau);
  const nhomDem = new Map<string, number>();
  for (const s of spAll) nhomDem.set(s.nhom ?? "", (nhomDem.get(s.nhom ?? "") ?? 0) + 1);
  const nhom = sp.nhom && nhomDem.has(sp.nhom) ? sp.nhom : "";
  const theoNhom = spAll.filter((s) => !nhom || s.nhom === nhom).map((s) => ({ ...s, toiThieu: s.ton_toi_thieu, gia: s.gia_nhap_don_vi }));
  const dem = demTinhTrang(theoNhom), tong = tongGiaTriKho(theoNhom);
  const loc = theoNhom.filter((s) => khopTinhTrang(s.ton, s.toiThieu, tt));
  const cuoi = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(sp.trang)) || 1), cuoi);
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const url = (o: Partial<Sp>) => `/kho/hang-ban?${new URLSearchParams(Object.entries({ cn: cn || undefined, nhom: nhom || undefined, tt: tt === "tat_ca" ? undefined : tt, nh: nh || undefined, q: q || undefined, ...o }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Quản lý kho hàng bán" phu="Sản phẩm bán lẻ. Số tồn là tổng sổ kho; nhập, xuất, chuyển kho làm ở các mục bên dưới.">
        <a href={`/api/xuat/kho-hang-ban?${new URLSearchParams(Object.entries({ cn: cn || undefined, nhom: nhom || undefined, tt: tt === "tat_ca" ? undefined : tt, nh: nh || undefined, q: q || undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`} download aria-label="Xuất Excel số lượng sản phẩm trong kho theo bộ lọc đang chọn" className={`${NUT_PHU} inline-flex items-center`}>Xuất Excel</a>
        <Link href="/bao-cao" className={`${NUT_PHU} inline-flex items-center`}>Báo Cáo Kho</Link>
      </TieuDeNoi>
      <ThanhKhoHangBan dang="ton" />
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Phân nhóm sản phẩm" className="text-[14px]">
          <h2 className="mb-2 flex items-center justify-between text-[13px] font-medium text-muc-2">Phân nhóm sản phẩm <Link href="/danh-muc?tab=san-pham" className="font-normal text-nhan-dam hover:underline">Cài đặt</Link></h2>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {[{ ten: "", nhan: "Tất cả sản phẩm", n: spAll.length }, ...[...nhomDem].sort((a, b) => a[0].localeCompare(b[0], "vi")).map(([ten, n]) => ({ ten, nhan: ten || "Chưa phân nhóm", n }))].map((g) => (
              <li key={g.ten || "tat-ca"} className="shrink-0"><Link href={url({ nhom: g.ten || undefined, trang: undefined })} className={`flex items-center justify-between gap-3 rounded-nho px-3 py-2 ${g.ten === nhom ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}><span className="whitespace-nowrap">{g.nhan}</span><span className="text-[12px] tabular-nums text-muc-3">{g.n}</span></Link></li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <form method="get" action="/kho/hang-ban" className="mb-4 flex flex-wrap items-end gap-3">
            {nhom && <input type="hidden" name="nhom" value={nhom} />}
            {tt !== "tat_ca" && <input type="hidden" name="tt" value={tt} />}
            {!nd.chiNhanhId && <div className="min-w-[220px]"><label className={NHAN_O}>Chi nhánh</label><Chon ten="cn" giaTriMacDinh={cn} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...(dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>}
            <div className="min-w-[200px]"><label className={NHAN_O}>Nhãn hiệu</label><Chon ten="nh" giaTriMacDinh={nh} luaChon={[{ gia_tri: "", nhan: "Tất cả nhãn hiệu" }, ...dsNhanHieu.map((x) => ({ gia_tri: x, nhan: x }))]} /></div>
            <div className="min-w-[240px] flex-1"><label htmlFor="khb-q" className={NHAN_O}>Tìm kiếm</label><input id="khb-q" name="q" defaultValue={q} placeholder="Tên, mã hoặc mã vạch sản phẩm" className={O_NHAP} /></div>
            <button type="submit" className={NUT_CHINH}>Lọc</button>
          </form>
          <div role="tablist" aria-label="Tình trạng tồn" className="mb-4 flex gap-1 overflow-x-auto border-b border-vien">
            {TINH_TRANG_KHO.map((t) => (
              <Link key={t.ma} href={url({ tt: t.ma === "tat_ca" ? undefined : t.ma, trang: undefined })} role="tab" aria-selected={tt === t.ma} scroll={false}
                className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${tt === t.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{t.nhan} ({soVN(dem[t.ma])})</Link>
            ))}
          </div>
          <div className="mb-5"><div className={`text-[26px] font-semibold tabular-nums ${tong < 0 ? "text-loi" : "text-muc"}`}>{tienVN(tong)}</div><div className="nhan-muc mt-1">Tổng giá trị kho (theo giá nhập TB)</div></div>
          <Bang duLieu={hien} khoa={(r) => r.id} trong="Không có sản phẩm nào."
            cot={[
              { nhan: "Ảnh", hienThi: (r) => <AnhSanPham anh={r.anh} ten={r.ten} /> },
              { nhan: "Tên sản phẩm", chinh: true, hienThi: (r) => <span><span className="text-muc">{r.ten}</span><span className="block text-[12.5px] text-muc-3">{r.ma}</span></span> },
              { nhan: "Nhãn hiệu", hienThi: (r) => r.nhan_hieu ?? "" },
              { nhan: "Chi nhánh", hienThi: () => (cn ? tenCn.get(cn) ?? "" : "Tất cả các chi nhánh") }, { nhan: "Đ.Vị", hienThi: (r) => r.don_vi },
              { nhan: "Số lượng", phai: true, hienThi: (r) => <span className="inline-flex items-center justify-end gap-2">{khopTinhTrang(r.ton, r.toiThieu, "sap_het") && <NhanTrangThai kieu="cho">Sắp hết</NhanTrangThai>}<span className={r.ton < 0 ? "font-medium text-loi" : ""}>{soVN(r.ton)}</span></span> },
              { nhan: "Giá nhập TB", phai: true, hienThi: (r) => (r.gia == null ? "0" : soVN(r.gia)) },
            ]} />
          <ThanhTrang trang={trang} tong={loc.length} moi={MOI_TRANG} gan={(n) => url({ trang: n ? String(n) : undefined })} don="sản phẩm" />
        </div>
      </div>
    </div>
  );
}

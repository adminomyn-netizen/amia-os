import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { AnhSanPham } from "@/components/kho/AnhSanPham";
import { docKhoNoiBo } from "@/lib/kho-noi-bo";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { nhapNoiBoTuHangBan, tieuDungNoiBo } from "../actions";

const MOI_TRANG = 50;
type Sp = { cn?: string; nhom?: string; q?: string; tu?: string; den?: string; trang?: string };

/** Quản lý kho nội bộ, theo bố cục SalonHero #/internal_stock (Ảnh sản phẩm · Tên sản phẩm · Chi nhánh · Tồn kho · Dung tích còn lại · Giá nhập · Chi tiết; cây Phân nhóm sản phẩm;
 *  lọc chi nhánh, khoảng ngày, ô tìm; Xuất Excel; nút "Nhập từ kho hàng bán").
 *  Kho nội bộ = vật tư tiêu hao (không bán lẻ, tồn theo sổ kho chính, cấp theo Phiếu cấp) + sản phẩm bán lẻ đã nhập từ kho hàng bán (sổ kho nội bộ, xuất tiêu dùng ngay trên dòng).
 *  "Dung tích còn lại" = tồn × dung tích mỗi đơn vị (nhập ở Danh mục sản phẩm), chưa tính phần đã dùng dở của chai đang mở. */
export default async function TrangKhoNoiBo({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const db = sb();
  const ghi = coQuyen(nd, "kho.nhap");
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === sp.cn) ? sp.cn! : "");
  const q = (sp.q ?? "").trim().slice(0, 80);
  const { dong, tu, den } = await docKhoNoiBo(db, { cn, q, tu: sp.tu, den: sp.den });
  const nhomDem = new Map<string, number>();
  for (const d of dong) nhomDem.set(d.sp.nhom ?? "", (nhomDem.get(d.sp.nhom ?? "") ?? 0) + 1);
  const nhom = sp.nhom && nhomDem.has(sp.nhom) ? sp.nhom : "";
  const loc = dong.filter((d) => !nhom || (d.sp.nhom ?? "") === nhom);
  const cuoi = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(sp.trang)) || 1), cuoi);
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const thamSo = (o: Partial<Sp>) => new URLSearchParams(Object.entries({ cn: cn || undefined, nhom: nhom || undefined, q: q || undefined, tu: tu || undefined, den: den || undefined, ...o }).filter((e): e is [string, string] => !!e[1])).toString();
  const url = (o: Partial<Sp>) => `/kho/noi-bo?${thamSo(o)}`;
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  let nutNhap = null;
  if (ghi) {
    const { data: spBan } = await db.from("san_pham").select("id, ten, don_vi").eq("hoat_dong", true).eq("ban_le", true).order("ten");
    const truong: Truong[] = [
      ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]),
      { ten: "san_pham_id", nhan: "Sản phẩm (kho hàng bán)", loai: "chon", batBuoc: true, rong: true, luaChon: (spBan ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })) },
      { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú (dùng cho việc gì)", loai: "chu", rong: true },
    ];
    nutNhap = <NutHop nhan="Nhập từ kho hàng bán" tieuDe="Nhập từ kho hàng bán" moTa="Kho hàng bán trừ ngay, kho nội bộ cộng ngay cùng số lượng (một phiếu NB…). Ghi sổ rồi không sửa; dùng hết thì bấm Xuất tiêu dùng trên dòng." rong truong={truong} action={nhapNoiBoTuHangBan} giaTri={{ chi_nhanh_id: cn, san_pham_id: "" }} />;
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Quản lý kho nội bộ" phu="Vật tư tiêu hao dùng trong phòng khám và sản phẩm bán lẻ đã đưa sang dùng nội bộ. Vật tư tiêu hao cấp theo ca ở Phiếu cấp.">
        {nutNhap}
        <Link href="/phieu-cap" className={`${NUT_PHU} inline-flex items-center`}>Xuất tiêu dùng kho nội bộ</Link>
        <Link href="/bao-cao?tab=xuat-kho" className={`${NUT_PHU} inline-flex items-center`}>Báo cáo tiêu dùng kho nội bộ</Link>
        <a href={`/api/xuat/kho-noi-bo?${thamSo({})}`} download className={`${NUT_PHU} inline-flex items-center`}>Xuất Excel</a>
      </TieuDeNoi>
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Phân nhóm sản phẩm" className="text-[14px]">
          <h2 className="mb-2 text-[13px] font-medium text-muc-2">Phân nhóm sản phẩm</h2>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {[{ ten: "", nhan: "Tất cả sản phẩm", n: dong.length }, ...[...nhomDem].sort((a, b) => a[0].localeCompare(b[0], "vi")).map(([ten, n]) => ({ ten, nhan: ten || "Chưa phân nhóm", n }))].map((g) => (
              <li key={g.ten || "tat-ca"} className="shrink-0"><Link href={url({ nhom: g.ten || undefined, trang: undefined })} className={`flex items-center justify-between gap-3 rounded-nho px-3 py-2 ${g.ten === nhom ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}><span className="whitespace-nowrap">{g.nhan}</span><span className="text-[12px] tabular-nums text-muc-3">{g.n}</span></Link></li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <form method="get" action="/kho/noi-bo" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {nhom && <input type="hidden" name="nhom" value={nhom} />}
            {!nd.chiNhanhId && <div><label className={NHAN_O}>Chi nhánh</label><Chon ten="cn" giaTriMacDinh={cn} luaChon={[{ gia_tri: "", nhan: "-- Tất cả chi nhánh --" }, ...(dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>}
            <div><label htmlFor="nb-tu" className={NHAN_O}>Từ ngày</label><NgayChon id="nb-tu" ten="tu" giaTriMacDinh={tu} tuNam={2018} /></div>
            <div><label htmlFor="nb-den" className={NHAN_O}>Đến ngày</label><NgayChon id="nb-den" ten="den" giaTriMacDinh={den} tuNam={2018} /></div>
            <div><label htmlFor="nb-q" className={NHAN_O}>Tìm kiếm</label><input id="nb-q" name="q" defaultValue={q} placeholder="Tên hoặc mã sản phẩm" className={O_NHAP} /></div>
            <div className="flex items-end"><button type="submit" className={NUT_CHINH}>Lọc</button></div>
          </form>
          {(tu || den) && <p className="mb-3 text-[12.5px] text-muc-3">Đang lọc theo ngày: chỉ hiện mặt hàng có nhập / xuất trong khoảng đã chọn; số tồn vẫn là tồn hiện tại.</p>}
          <Bang duLieu={hien} khoa={(r) => r.khoa} trong="Chưa có vật tư nào có tồn trong kho nội bộ."
            cot={[
              { nhan: "Ảnh", hienThi: (r) => <AnhSanPham anh={r.sp.anh} ten={r.sp.ten} /> },
              { nhan: "Tên sản phẩm", chinh: true, hienThi: (r) => <span><span className="text-muc">{r.sp.ten}</span><span className="block text-[12.5px] text-muc-3">{r.sp.ma}{r.nguon === "tu_hang_ban" ? " · nhập từ kho hàng bán" : ""}</span></span> },
              { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.cnId) ?? "" }, { nhan: "Tồn kho", phai: true, hienThi: (r) => `${soVN(r.ton)} ${r.sp.don_vi}` },
              { nhan: "Dung tích còn lại", phai: true, hienThi: (r) => (r.sp.dung_tich == null ? <span className="text-muc-3">chưa nhập dung tích</span> : `${soVN(r.sp.dung_tich * r.ton)} ${r.sp.dung_tich_dv ?? ""}`.trim()) },
              { nhan: "Giá nhập", phai: true, hienThi: (r) => (r.sp.gia_nhap_don_vi == null ? "0" : soVN(r.sp.gia_nhap_don_vi)) },
              { nhan: "", hienThi: (r) => (
                <div className="flex flex-wrap justify-end gap-3">
                  {ghi && r.nguon === "tu_hang_ban" && r.ton > 0 && (!nd.chiNhanhId || nd.chiNhanhId === r.cnId) && <NutHop kieu="chu" nhan="Xuất tiêu dùng" tieuDe={`Xuất tiêu dùng: ${r.sp.ten}`} moTa={`Kho nội bộ còn ${soVN(r.ton)} ${r.sp.don_vi}.`} truong={[{ ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }, { ten: "ghi_chu", nhan: "Dùng cho việc gì", loai: "chu", batBuoc: true, rong: true }]} action={tieuDungNoiBo} an={{ chi_nhanh_id: r.cnId, san_pham_id: r.sp.id }} />}
                  <Link href={r.nguon === "tu_hang_ban" ? `/kho/phieu-xuat?cn=${r.cnId}&pl=${encodeURIComponent("Xuất sang kho nội bộ")}&q=${encodeURIComponent(r.sp.ma)}&tu=2020-01-01` : `/kho?tab=so&cn=${r.cnId}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Chi tiết</Link>
                </div>
              ) },
            ]} />
          <ThanhTrang trang={trang} tong={loc.length} moi={MOI_TRANG} gan={(n) => url({ trang: n ? String(n) : undefined })} don="sản phẩm" />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

const MOI_TRANG = 50;
type Sp = { cn?: string; nhom?: string; trang?: string };

/** Quản lý kho nội bộ, theo bố cục SalonHero #/internal_stock (Ảnh sản phẩm · Tên sản phẩm · Chi nhánh · Tồn kho · Dung tích còn lại · Giá nhập · Chi tiết; cây Phân nhóm sản phẩm; lọc chi nhánh).
 *  TỰ THIẾT KẾ về nghiệp vụ, chỉ XEM: AMIA chưa có "kho nội bộ" tách riêng; "Dung tích còn lại" = tồn kho × dung tích mỗi đơn vị (nhập ở Danh mục sản phẩm), chưa tính phần đã dùng dở của chai đang mở. Kho nội bộ ở đây = vật tư tiêu hao (sản phẩm không bán lẻ) có số tồn khác 0 trong sổ kho. */
export default async function TrangKhoNoiBo({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === sp.cn) ? sp.cn! : "");
  const [{ data: spAll }, { data: ton }] = await Promise.all([
    db.from("san_pham").select("id, ma, ten, nhom, don_vi, gia_nhap_don_vi, dung_tich, dung_tich_dv").eq("hoat_dong", true).eq("ban_le", false).order("ten"),
    cn ? db.from("v_ton_kho").select("chi_nhanh_id, san_pham_id, ton").eq("chi_nhanh_id", cn) : db.from("v_ton_kho").select("chi_nhanh_id, san_pham_id, ton"),
  ]);
  const sanPham = new Map((spAll ?? []).map((s) => [s.id, s]));
  const dong = (ton ?? []).filter((t) => sanPham.has(t.san_pham_id!) && Number(t.ton) !== 0).map((t) => ({ khoa: `${t.chi_nhanh_id}-${t.san_pham_id}`, cnId: t.chi_nhanh_id!, sp: sanPham.get(t.san_pham_id!)!, ton: Number(t.ton) })).sort((a, b) => a.sp.ten.localeCompare(b.sp.ten, "vi"));
  const nhomDem = new Map<string, number>();
  for (const d of dong) nhomDem.set(d.sp.nhom ?? "", (nhomDem.get(d.sp.nhom ?? "") ?? 0) + 1);
  const nhom = sp.nhom && nhomDem.has(sp.nhom) ? sp.nhom : "";
  const loc = dong.filter((d) => !nhom || d.sp.nhom === nhom);
  const cuoi = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(sp.trang)) || 1), cuoi);
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const url = (o: Partial<Sp>) => `/kho/noi-bo?${new URLSearchParams(Object.entries({ cn: cn || undefined, nhom: nhom || undefined, ...o }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  return (
    <div>
      <Link href="/kho-mua-sam" className="text-[13px] text-muc-3 hover:text-muc">← Kho & Mua sắm</Link>
      <TieuDeTrang tieuDe="Quản lý kho nội bộ" phu="Vật tư tiêu hao dùng trong phòng khám (không bán lẻ). Chỉ xem; cấp vật tư theo ca làm ở Phiếu cấp.">
        <Link href="/phieu-cap" className={`${NUT_PHU} inline-flex items-center`}>Xuất tiêu dùng kho nội bộ</Link>
        <Link href="/bao-cao?tab=xuat-kho" className={`${NUT_PHU} inline-flex items-center`}>Báo cáo tiêu dùng kho nội bộ</Link>
      </TieuDeTrang>
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
          {!nd.chiNhanhId && (
            <form method="get" action="/kho/noi-bo" className="mb-4 flex flex-wrap items-end gap-3">
              {nhom && <input type="hidden" name="nhom" value={nhom} />}
              <div className="min-w-[240px]"><label className={NHAN_O}>Chi nhánh</label><Chon ten="cn" giaTriMacDinh={cn} luaChon={[{ gia_tri: "", nhan: "-- Tất cả chi nhánh --" }, ...(dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>
              <button type="submit" className={NUT_CHINH}>Lọc</button>
            </form>
          )}
          <Bang duLieu={hien} khoa={(r) => r.khoa} trong="Chưa có vật tư nào có tồn trong kho nội bộ."
            cot={[
              { nhan: "Tên sản phẩm", chinh: true, hienThi: (r) => <span><span className="text-muc">{r.sp.ten}</span><span className="block text-[12.5px] text-muc-3">{r.sp.ma}</span></span> },
              { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.cnId) ?? "" }, { nhan: "Tồn kho", phai: true, hienThi: (r) => `${soVN(r.ton)} ${r.sp.don_vi}` },
              { nhan: "Dung tích còn lại", phai: true, hienThi: (r) => (r.sp.dung_tich == null ? <span className="text-muc-3">chưa nhập dung tích</span> : `${soVN(Number(r.sp.dung_tich) * r.ton)} ${r.sp.dung_tich_dv ?? ""}`.trim()) },
              { nhan: "Giá nhập", phai: true, hienThi: (r) => (r.sp.gia_nhap_don_vi == null ? "0" : soVN(Number(r.sp.gia_nhap_don_vi))) },
              { nhan: "", hienThi: (r) => <Link href={`/kho?tab=so&cn=${r.cnId}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Chi tiết</Link> },
            ]} />
          <ThanhTrang trang={trang} tong={loc.length} moi={MOI_TRANG} gan={(n) => url({ trang: n ? String(n) : undefined })} don="sản phẩm" />
        </div>
      </div>
    </div>
  );
}

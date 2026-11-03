import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { tienVN } from "@/lib/dinh-dang";
import { svgMaVach } from "@/lib/ma-vach";
import { InNgay } from "@/components/khach/InNgay";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** In tem mã vạch sản phẩm (Code 128, tự vẽ SVG bằng lib/ma-vach, không thư viện ngoài). Chỉ hiển thị và in, không ghi gì vào CSDL.
 *  ?id=<id1,id2,...> (tối đa 100 sản phẩm, lấy từ tab Sản phẩm của Danh mục) &so=<số tem mỗi sản phẩm, 1–50>.
 *  Mã vạch mã hoá "Mã vạch" của sản phẩm nếu có (8–14 chữ số), nếu không thì mã nội bộ (MP-0001...). */
export default async function TrangInMaVachSanPham({ searchParams }: { searchParams: Promise<{ id?: string; so?: string }> }) {
  await yeuCauQuyen("danhmuc.xem");
  const { id = "", so: soS } = await searchParams;
  const ids = [...new Set(id.split(",").map((x) => x.trim()).filter((x) => UUID.test(x)))].slice(0, 100);
  const so = Math.min(50, Math.max(1, Math.floor(Number(soS)) || 1));
  const { data } = ids.length ? await sb().from("san_pham").select("id, ma, ma_vach, ten, gia_ban, ban_le").in("id", ids) : { data: [] };
  // Giữ đúng thứ tự người dùng chọn (thứ tự trên trang Danh mục).
  const thuTu = new Map(ids.map((x, i) => [x, i]));
  const ds = (data ?? []).sort((a, b) => (thuTu.get(a.id) ?? 0) - (thuTu.get(b.id) ?? 0)).map((sp) => {
    const ma = (sp.ma_vach ?? "").trim() || sp.ma;
    let svg = "";
    try { svg = svgMaVach(ma, { cao: 48, mo: 2 }); } catch { /* mã có ký tự ngoài Code 128 B (vd chữ có dấu): chỉ in chữ */ }
    return { ...sp, maIn: ma, svg };
  });
  const tem = ds.flatMap((sp) => Array.from({ length: so }, (_, i) => ({ ...sp, khoa: `${sp.id}-${i}` })));
  const loi = ds.filter((x) => !x.svg);

  return (
    <>
      <style>{"@media print{#noi-dung-chinh ~ *{display:none !important}}"}</style>
      <div className="khong-in mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-muc">In tem mã vạch sản phẩm</h1>
          <p className="mt-1 text-[13px] text-muc-3">{ds.length} sản phẩm × {so} tem = {tem.length} tem. Mã vạch Code 128 đọc được bằng máy quét ở quầy.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form method="get" action="/danh-muc/in-ma-vach" className="flex items-end gap-2">
            <input type="hidden" name="id" value={ids.join(",")} />
            <label className="text-[13px] text-muc-3">Số tem mỗi sản phẩm
              <input name="so" type="number" min={1} max={50} defaultValue={so} className={`${O_NHAP} mt-1 w-24`} />
            </label>
            <button type="submit" className={NUT_PHU}>Áp dụng</button>
          </form>
          {tem.length > 0 && <InNgay />}
        </div>
      </div>
      {loi.length > 0 && <p className="khong-in mb-4 text-[13px] text-canh-bao">{loi.length} sản phẩm có mã chứa chữ có dấu hoặc ký tự lạ nên chỉ in chữ, không có vạch: {loi.map((x) => x.maIn).join(", ")}. Sửa mã ở Danh mục rồi in lại.</p>}
      {tem.length === 0 ? (
        <p className="text-[14px] text-muc-3">Chưa chọn sản phẩm nào. Vào <Link href="/danh-muc?tab=san-pham" className="font-medium text-nhan-dam hover:underline">Danh mục › Sản phẩm</Link>, bấm &quot;In tem&quot; ở từng dòng hoặc &quot;In tem mã vạch trang này&quot;.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-1">
          {tem.map((t) => (
            <div key={t.khoa} className="flex min-w-0 flex-col items-center gap-1 border border-dashed border-vien bg-white px-2 py-2 text-center text-black [break-inside:avoid]">
              <p className="line-clamp-2 w-full text-[11px] leading-tight">{t.ten}</p>
              {t.svg && <div role="img" aria-label={`Mã vạch ${t.maIn}`} className="w-full [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: t.svg }} />}
              <p className="text-[12px] font-semibold tracking-wide">{t.maIn}</p>
              {t.ban_le && t.gia_ban > 0 && <p className="text-[12px]">{tienVN(t.gia_ban)}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

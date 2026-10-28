import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { homNayHCM } from "@/lib/dinh-dang";
import { khopTinhTrang, laTinhTrang } from "@/lib/kho-hang-ban";
import { docSanPhamKhoHangBan } from "@/lib/kho-hang-ban-doc";
import { dungExcelKhoHangBan } from "@/lib/kho-hang-ban-xlsx";

/** Xuất Excel "Quản lý kho hàng bán" y như tệp SalonHero (so_luong_trong_kho): tiêu đề SỐ LƯỢNG SẢN PHẨM TRONG KHO, dòng Chi nhánh, rồi bảng
 *  Mã sản phẩm · Tên sản phẩm · Nhãn hiệu · Chi nhánh · Số lượng còn lại · Giá nhập · Giá bán · Nhóm sản phẩm. Theo bộ lọc đang chọn trên màn (chi nhánh, nhóm, tình trạng tồn).
 *  Cùng quyền "kho.xem" với màn; người gắn chi nhánh chỉ xuất được chi nhánh của mình; mỗi lần xuất ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("kho.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === u.searchParams.get("cn")) ? u.searchParams.get("cn")! : "");
  const tt = u.searchParams.get("tt") ?? "";
  const ttHopLe = laTinhTrang(tt) ? tt : "tat_ca";
  const nhom = u.searchParams.get("nhom") || "";
  const db = sb();
  const tenCn = cn ? (dsCn ?? []).find((c) => c.id === cn)?.ten ?? "" : "Tất cả các chi nhánh";
  const tatCa = await docSanPhamKhoHangBan(db, cn);
  const ds = tatCa.filter((s) => (!nhom || s.nhom === nhom) && khopTinhTrang(s.ton, s.ton_toi_thieu, ttHopLe));

  const wb = dungExcelKhoHangBan(ds, tenCn);

  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "bao_cao", chi_tiet: { loai: "kho-hang-ban", chi_nhanh_id: cn || null, nhom: nhom || null, tinh_trang: ttHopLe, so_dong: ds.length } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="kho-hang-ban-${homNayHCM()}.xlsx"`, "Cache-Control": "no-store" } });
}

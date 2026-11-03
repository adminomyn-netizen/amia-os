import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { phanHoiExcel } from "@/lib/xuat-excel";
import { docKhoNoiBo } from "@/lib/kho-noi-bo";

/** Xuất Excel "Quản lý kho nội bộ" theo bộ lọc trên màn (chi nhánh, phân nhóm, ô tìm, khoảng ngày). Quyền "kho.xem"; người gắn chi nhánh chỉ xuất chi nhánh mình; ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("kho.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === u.get("cn")) ? u.get("cn")! : "");
  const nhom = u.get("nhom") ?? "";
  const db = sb();
  const { dong, tu, den } = await docKhoNoiBo(db, { cn, q: u.get("q") ?? undefined, tu: u.get("tu") ?? undefined, den: u.get("den") ?? undefined });
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  const ds = dong.filter((d) => !nhom || (d.sp.nhom ?? "") === nhom).map((d) => ({
    ma: d.sp.ma, ten: d.sp.ten, nhom: d.sp.nhom ?? "", cn: tenCn.get(d.cnId) ?? "", ton: d.ton, dv: d.sp.don_vi,
    dung_tich: d.sp.dung_tich == null ? "" : `${d.sp.dung_tich * d.ton} ${d.sp.dung_tich_dv ?? ""}`.trim(), gia: d.sp.gia_nhap_don_vi ?? 0,
    nguon: d.nguon === "tu_hang_ban" ? "Nhập từ kho hàng bán" : "Vật tư tiêu hao",
  }));
  return phanHoiExcel(db, nd, [{ ten: "Kho nội bộ", cot: [
    { nhan: "Mã sản phẩm", khoa: "ma", rong: 16 }, { nhan: "Tên sản phẩm", khoa: "ten", rong: 40 }, { nhan: "Phân nhóm", khoa: "nhom", rong: 20 }, { nhan: "Chi nhánh", khoa: "cn", rong: 16 },
    { nhan: "Tồn kho", khoa: "ton", tp: true }, { nhan: "Đ.Vị", khoa: "dv", rong: 8 }, { nhan: "Dung tích còn lại", khoa: "dung_tich", rong: 18 }, { nhan: "Giá nhập", khoa: "gia", tien: true }, { nhan: "Nguồn", khoa: "nguon", rong: 22 },
  ], dong: ds }], { tenTep: `kho-noi-bo${tu ? `-${tu}` : ""}${den ? `-${den}` : ""}`, doiTuong: "bao_cao", chiTiet: { loai: "kho-noi-bo", chi_nhanh_id: cn || null, tu: tu || null, den: den || null } });
}

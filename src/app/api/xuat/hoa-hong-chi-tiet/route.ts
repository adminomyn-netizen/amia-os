import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { phanHoiExcel } from "@/lib/xuat-excel";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ / liệu trình" };

/** SalonHero "Chi tiết toàn bộ nhân viên" / "Chi tiết nhân viên được chọn": tải Excel chi tiết hoa hồng (từng dòng hoá đơn) của mọi nhân viên có doanh số trong kỳ, hoặc các nhân viên tích chọn (?nv=…&nv=…).
 *  Cùng hàm với màn Chi tiết (bc_hoa_hong_nv_chi_tiet), tối đa 2.000 dòng / nhân viên. Quyền baocao.tien; ghi nhật ký xuất. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("baocao.tien");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const { tu, den } = khoangNgay(u.get("tu") ?? undefined, u.get("den") ?? undefined);
  const cnQ = u.get("cn") ?? "";
  const cn = nd.chiNhanhId ?? (UUID.test(cnQ) ? cnQ : undefined);
  const db = sb();
  let ids = [...new Set(u.getAll("nv").filter((x) => UUID.test(x)))];
  if (!ids.length) {
    const { data, error } = await db.rpc("bc_hoa_hong_nv_nhom", { p_tu: tu, p_den: den, p_cn: cn as string });
    if (error) return new Response("Hệ thống đang chậm, thử lại sau ít phút.", { status: 503 });
    ids = [...new Set((data ?? []).map((r) => r.nhan_vien_id))];
  }
  const { data: nv } = ids.length ? await db.from("nhan_vien").select("id, ho_ten, chuc_danh").in("id", ids) : { data: [] as { id: string; ho_ten: string; chuc_danh: string | null }[] };
  const ten = new Map((nv ?? []).map((n) => [n.id, n]));
  const dong: Record<string, string | number>[] = [];
  for (const id of ids.slice(0, 200)) {
    const { data, error } = await db.rpc("bc_hoa_hong_nv_chi_tiet", { p_nv: id, p_tu: tu, p_den: den, p_cn: cn as string, p_gioi_han: 2000 });
    if (error) return new Response("Hệ thống đang chậm, thử lại sau ít phút.", { status: 503 });
    for (const r of data ?? []) dong.push({
      nv: ten.get(id)?.ho_ten ?? "", cd: ten.get(id)?.chuc_danh ?? "", hd: r.ma_hd ?? "", ngay: r.ngay_hd ? String(r.ngay_hd).split("-").reverse().join("/") : "", khach: r.khach ?? "",
      mat_hang: r.ten_dong ?? "", loai: LOAI[r.loai] ?? r.loai ?? "", vai: VAI[r.vai] ?? r.vai ?? "", sl: Number(r.so_luong), ds: Number(r.doanh_so), hh: Number(r.hoa_hong),
    });
  }
  return phanHoiExcel(db, nd, [{ ten: "Chi tiết hoa hồng", cot: [
    { nhan: "Nhân viên", khoa: "nv", rong: 26 }, { nhan: "Chức danh", khoa: "cd", rong: 20 }, { nhan: "Hoá đơn", khoa: "hd", rong: 14 }, { nhan: "Ngày", khoa: "ngay", rong: 12 }, { nhan: "Khách", khoa: "khach", rong: 26 },
    { nhan: "Mặt hàng", khoa: "mat_hang", rong: 36 }, { nhan: "Loại", khoa: "loai", rong: 18 }, { nhan: "Vai", khoa: "vai", rong: 12 }, { nhan: "Số lượng", khoa: "sl", so: true },
    { nhan: "Doanh số", khoa: "ds", tien: true }, { nhan: "Hoa hồng", khoa: "hh", tien: true },
  ], dong }], { tenTep: `chi-tiet-hoa-hong-${tu}-${den}`, doiTuong: "bao_cao", chiTiet: { loai: "hoa-hong-chi-tiet", tu, den, so_nv: ids.length } });
}

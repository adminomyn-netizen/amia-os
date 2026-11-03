import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { khoangNgay } from "@/lib/bao-cao";
import { phanHoiExcel } from "@/lib/xuat-excel";
import { layPhieuKho } from "@/lib/kho-phieu";

/** Xuất Excel danh sách phiếu nhập / phiếu xuất kho hàng bán theo đúng bộ lọc trên màn (cùng hàm bc_phieu_kho). Quyền "kho.xem"; người gắn chi nhánh chỉ xuất chi nhánh mình; ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("kho.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const huong = u.get("huong") === "xuat" ? "xuat" : "nhap";
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === u.get("cn")) ? u.get("cn")! : "");
  const { tu, den } = khoangNgay(u.get("tu") ?? undefined, u.get("den") ?? undefined);
  const db = sb();
  const { rows } = await layPhieuKho(db, huong, { tu, den, cn, tt: u.get("tt") ?? undefined, nguoi: u.get("nguoi") ?? undefined, pl: u.get("pl") ?? undefined, q: u.get("q") ?? undefined }, true);
  const ngay = (s: string) => new Date(new Date(s).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ").replace(/^(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1");
  const dong = rows.map((r) => ({ ...r, ngay: ngay(r.thoi_gian) }));
  return phanHoiExcel(db, nd, [{
    ten: huong === "nhap" ? "Phiếu nhập" : "Phiếu xuất",
    cot: [
      { nhan: "Mã phiếu", khoa: "ma", rong: 20 }, { nhan: "Ngày", khoa: "ngay", rong: 18 }, { nhan: "Người tạo", khoa: "nguoi", rong: 24 }, { nhan: "Nhà cung cấp", khoa: "ncc", rong: 24 },
      { nhan: "Phân loại", khoa: "phan_loai", rong: 22 }, { nhan: "Tình trạng", khoa: "tinh_trang", rong: 14 }, { nhan: "Chi nhánh", khoa: "chi_nhanh", rong: 16 },
      { nhan: "Số mặt hàng", khoa: "so_mat_hang", so: true }, { nhan: "Mặt hàng", khoa: "mat_hang", rong: 50 }, { nhan: "Tổng số lượng", khoa: "tong_sl", tp: true }, { nhan: "Tổng tiền", khoa: "tong_tien", tien: true },
    ],
    dong,
  }], { tenTep: `phieu-${huong}-${tu}-${den}`, doiTuong: "bao_cao", chiTiet: { loai: `phieu-${huong}`, tu, den, chi_nhanh_id: cn || null } });
}

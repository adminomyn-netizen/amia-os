import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { phanHoiExcel } from "@/lib/xuat-excel";
import { locPhieuChuyen } from "@/lib/kho-chuyen";
import { TT_CHUYEN } from "@/lib/kho";

/** Xuất Excel phiếu chuyển kho theo bộ lọc trên màn (khoảng ngày gửi, tình trạng, người tạo). Quyền "kho.xem"; người gắn chi nhánh chỉ thấy phiếu đi/đến chi nhánh mình; ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("kho.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const db = sb();
  const { q, tu, den } = locPhieuChuyen(db, nd, { tu: u.get("tu") ?? undefined, den: u.get("den") ?? undefined, tt: u.get("tt") ?? undefined, nguoi: u.get("nguoi") ?? undefined }, 20000);
  const [{ data: ds }, { data: cn }, { data: sp }, { data: nv }] = await Promise.all([q, db.from("chi_nhanh").select("id, ten"), db.from("san_pham").select("id, ma, ten, don_vi").eq("theo_doi_kho", true), db.from("nhan_vien").select("id, ho_ten")]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten])), tenSp = new Map((sp ?? []).map((s) => [s.id, s])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const gio = (s: string | null) => (s ? new Date(new Date(s).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ").replace(/^(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1") : "");
  const dong = (ds ?? []).map((r) => ({
    ma: r.ma, gui_luc: gio(r.gui_luc), nguoi_gui: tenNv.get(r.nguoi_gui_id) ?? "", tu: tenCn.get(r.tu_chi_nhanh_id) ?? "", den: tenCn.get(r.den_chi_nhanh_id) ?? "",
    ma_sp: tenSp.get(r.san_pham_id)?.ma ?? "", ten_sp: tenSp.get(r.san_pham_id)?.ten ?? "", dv: tenSp.get(r.san_pham_id)?.don_vi ?? "", lo: r.so_lo ?? "",
    gui: Number(r.so_luong_gui), nhan: r.so_luong_nhan == null ? "" : Number(r.so_luong_nhan), tt: TT_CHUYEN[r.trang_thai]?.ten ?? r.trang_thai,
    nguoi_nhan: r.nguoi_nhan_id ? tenNv.get(r.nguoi_nhan_id) ?? "" : "", nhan_luc: gio(r.nhan_luc), ly_do: r.ly_do_lech ?? "", ghi_chu: r.ghi_chu ?? "",
  }));
  return phanHoiExcel(db, nd, [{ ten: "Phiếu chuyển kho", cot: [
    { nhan: "Mã phiếu", khoa: "ma", rong: 12 }, { nhan: "Ngày gửi", khoa: "gui_luc", rong: 18 }, { nhan: "Người tạo", khoa: "nguoi_gui", rong: 22 }, { nhan: "Kho đi", khoa: "tu", rong: 16 }, { nhan: "Kho đến", khoa: "den", rong: 16 },
    { nhan: "Mã sản phẩm", khoa: "ma_sp", rong: 14 }, { nhan: "Sản phẩm", khoa: "ten_sp", rong: 36 }, { nhan: "Đ.Vị", khoa: "dv", rong: 8 }, { nhan: "Số lô", khoa: "lo", rong: 12 },
    { nhan: "Số gửi", khoa: "gui", tp: true }, { nhan: "Số nhận", khoa: "nhan" }, { nhan: "Tình trạng", khoa: "tt", rong: 20 }, { nhan: "Người nhận", khoa: "nguoi_nhan", rong: 22 },
    { nhan: "Ngày nhận", khoa: "nhan_luc", rong: 18 }, { nhan: "Lý do lệch", khoa: "ly_do", rong: 30 }, { nhan: "Ghi chú", khoa: "ghi_chu", rong: 30 },
  ], dong }], { tenTep: `phieu-chuyen-kho-${tu}-${den}`, doiTuong: "bao_cao", chiTiet: { loai: "chuyen-kho", tu, den } });
}

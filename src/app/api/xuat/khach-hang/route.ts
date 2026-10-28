import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { apLocKhach, COT_KHACH } from "@/lib/khach-danh-sach";
import { NHAN_NGUON, TRANG_THAI_KHACH } from "@/lib/khach";

const MOI_LAN = 1000;
const TOI_DA = 30_000;

/** Xuất Excel danh sách khách theo đúng bộ lọc đang chọn ở màn Khách hàng. Không xuất ghi chú (chung hay điều trị). Chặn quyền ở máy chủ và ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("khach.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const tham = { q: u.get("q") ?? "", trang_thai: u.get("trang_thai") ?? "", nguon: u.get("nguon") ?? "", hang: u.get("hang") ?? "", phu_trach: u.get("phu_trach") ?? "", sx: u.get("sx") ?? "ten" };
  const db = sb();
  const [{ data: nv }, { data: cn }] = await Promise.all([db.from("nhan_vien").select("id, ho_ten"), db.from("chi_nhanh").select("id, ten")]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Khách hàng");
  ws.columns = [
    { header: "Mã", key: "ma", width: 12 }, { header: "Họ tên", key: "ten", width: 28 }, { header: "Điện thoại", key: "sdt", width: 14 }, { header: "Zalo", key: "zalo", width: 14 }, { header: "Email", key: "email", width: 26 },
    { header: "Giới tính", key: "gt", width: 10 }, { header: "Ngày sinh", key: "ns", width: 12 }, { header: "Địa chỉ", key: "dc", width: 34 }, { header: "Chi nhánh", key: "cn", width: 20 },
    { header: "Nguồn", key: "nguon", width: 18 }, { header: "Chi tiết nguồn", key: "ct", width: 24 }, { header: "Trạng thái", key: "tt", width: 16 }, { header: "Hạng", key: "hang", width: 12 },
    { header: "Người phụ trách", key: "pt", width: 20 }, { header: "Thẻ đang dùng", key: "the", width: 12 }, { header: "Chi 12 tháng", key: "chi", width: 16 }, { header: "Ngày tạo", key: "tao", width: 12 },
  ];
  let tong = 0;
  for (let tu = 0; tu < TOI_DA; tu += MOI_LAN) {
    const { data, error } = await apLocKhach(db.from("v_khach_hang").select(COT_KHACH), tham).range(tu, tu + MOI_LAN - 1);
    if (error) return new Response("Không xuất được, thử lại.", { status: 500 });
    for (const r of data ?? []) {
      ws.addRow({
        ma: r.ma, ten: r.ho_ten, sdt: r.dien_thoai, zalo: r.zalo ?? "", email: r.email ?? "", gt: r.gioi_tinh ?? "", ns: ngayVN(r.ngay_sinh), dc: r.dia_chi ?? "", cn: tenCn.get(r.chi_nhanh_id ?? "") ?? "",
        nguon: NHAN_NGUON[r.nguon ?? ""] ?? r.nguon, ct: r.nguon_chi_tiet ?? "", tt: TRANG_THAI_KHACH[r.trang_thai ?? "lead"]?.nhan ?? "", hang: r.hang ?? "", pt: tenNv.get(r.nguoi_phu_trach_id ?? "") ?? "",
        the: r.so_the_dang_dung ?? 0, chi: Number(r.chi_12_thang ?? 0), tao: ngayVN(r.tao_luc),
      });
    }
    tong += data?.length ?? 0;
    if ((data?.length ?? 0) < MOI_LAN) break;
  }
  // Điện thoại/Zalo để dạng chữ, Excel không cắt số 0 đầu.
  for (const k of ["C", "D"]) ws.getColumn(k).numFmt = "@";
  ws.getColumn("P").numFmt = "#,##0";
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel_khach", doi_tuong: "khach_hang", chi_tiet: { so_khach: tong, loc: tham } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="khach-hang-${homNayHCM()}.xlsx"` } });
}

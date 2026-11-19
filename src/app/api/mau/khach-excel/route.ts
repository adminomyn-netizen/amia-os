import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";

/** Tệp Excel MẪU để nhập khách (nút "Tải tệp mẫu" trong hộp Nhập từ tệp excel). Trang đầu chỉ có dòng tiêu đề (không có khách mẫu để lỡ nhập nhầm); cách điền ở trang "Hướng dẫn". Chỉ người có quyền nhập khách tải được. */
export async function GET() {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Khách hàng");
  ws.columns = [
    { header: "Họ tên", key: "ho_ten", width: 28 }, { header: "Số điện thoại", key: "dien_thoai", width: 16 }, { header: "Zalo", key: "zalo", width: 16 }, { header: "Email", key: "email", width: 26 },
    { header: "Ngày sinh", key: "ngay_sinh", width: 14 }, { header: "Giới tính", key: "gioi_tinh", width: 11 }, { header: "Địa chỉ", key: "dia_chi", width: 34 }, { header: "Ghi chú", key: "ghi_chu", width: 30 }, { header: "Chi nhánh", key: "chi_nhanh", width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  // Cột số điện thoại để dạng chữ: Excel không cắt mất số 0 đầu.
  ws.getColumn("dien_thoai").numFmt = "@";
  ws.getColumn("zalo").numFmt = "@";
  const hd = wb.addWorksheet("Hướng dẫn");
  hd.columns = [{ header: "Cột", key: "cot", width: 18 }, { header: "Bắt buộc", key: "bb", width: 12 }, { header: "Cách điền", key: "cach", width: 90 }];
  hd.getRow(1).font = { bold: true };
  hd.addRows([
    { cot: "Họ tên", bb: "Có", cach: "Họ và tên khách. Ví dụ: Nguyễn Thị Lan" },
    { cot: "Số điện thoại", bb: "Có", cach: "Số di động 10 số, không trùng nhau trong file. Khách có số đã có trong hệ thống sẽ bị bỏ qua (không ghi đè). Ví dụ: 0912345678" },
    { cot: "Zalo", bb: "Không", cach: "Số Zalo nếu khác số điện thoại" },
    { cot: "Email", bb: "Không", cach: "Địa chỉ email" },
    { cot: "Ngày sinh", bb: "Không", cach: "Dạng ngày/tháng/năm. Ví dụ: 25/12/1990" },
    { cot: "Giới tính", bb: "Không", cach: "Nữ hoặc Nam" },
    { cot: "Địa chỉ", bb: "Không", cach: "Địa chỉ liên hệ" },
    { cot: "Ghi chú", bb: "Không", cach: "Ghi chú chung về khách" },
    { cot: "Chi nhánh", bb: "Không", cach: "Tên chi nhánh của khách (ví dụ: Vinh). Để trống = dùng chi nhánh chọn trong hộp nhập. Chi nhánh Đà Lạt đã đóng nên khách mới ghi Đà Lạt sẽ báo lỗi, không nhập." },
    { cot: "", bb: "", cach: "Dòng đầu của trang “Khách hàng” là tiêu đề, không xoá. Mỗi dòng sau là một khách. Nguồn khách, người phụ trách, và nhóm khách chọn ngay trong hộp nhập, áp cho cả file; chi nhánh lấy theo cột Chi nhánh (trống thì theo hộp nhập). Tối đa 8 MB." },
  ]);
  hd.getColumn("cach").alignment = { wrapText: true, vertical: "top" };
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="mau-nhap-khach.xlsx"', "Cache-Control": "no-store" } });
}

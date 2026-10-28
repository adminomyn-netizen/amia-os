import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";

/** Xuất Excel bảng lương một kỳ (bản chụp từng dòng). Chặn quyền ở máy chủ; dữ liệu lương rất nhạy cảm. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("luong.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const db = sb();
  const { data: ky } = await db.from("ky_luong").select("*").eq("id", id).maybeSingle();
  if (!ky) return new Response("Không tìm thấy kỳ lương", { status: 404 });
  const [{ data: dong }, { data: nv }] = await Promise.all([db.from("bang_luong_dong").select("*").eq("ky_id", id), db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n]));
  const ds = (dong ?? []).filter((d) => !nd.chiNhanhId || ten.get(d.nhan_vien_id)?.chi_nhanh_id === nd.chiNhanhId).sort((a, b) => (ten.get(a.nhan_vien_id)?.ho_ten ?? "").localeCompare(ten.get(b.nhan_vien_id)?.ho_ten ?? "", "vi"));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Lương ${String(ky.thang).padStart(2, "0")}-${ky.nam}`);
  const cot: [string, string, number][] = [
    ["Mã NV", "ma", 10], ["Họ tên", "ten", 26], ["Tình trạng", "tt", 14], ["Lương cơ bản", "luong_co_ban", 16], ["Công chuẩn", "cong_chuan", 11], ["Công tính", "cong_tinh", 10], ["Lương theo công", "luong_cong", 16],
    ["Giờ OT", "ot_gio", 8], ["Lương OT", "luong_ot", 14], ["Ăn ca", "an_ca", 12], ["Đồng phục", "dong_phuc", 12], ["Nhà ở", "nha_o", 12], ["Hoa hồng", "hoa_hong", 14], ["Cộng khác", "cong_khac", 12],
    ["Tổng thu nhập", "gross", 16], ["BHXH NLĐ", "bhxh_nld", 13], ["Giảm trừ", "giam_tru", 14], ["Thu nhập tính thuế", "thu_nhap_tinh_thue", 18], ["Thuế TNCN", "thue_tncn", 13], ["Trừ khác", "tru_khac", 12],
    ["Trừ vi phạm", "tru_vi_pham", 13], ["Tạm ứng", "tam_ung", 12], ["Thực trả", "thuc_tra", 16],
  ];
  ws.columns = cot.map(([header, key, width]) => ({ header, key, width }));
  for (const d of ds) ws.addRow({ ma: ten.get(d.nhan_vien_id)?.ma_nv, ten: ten.get(d.nhan_vien_id)?.ho_ten, tt: d.tinh_trang === "thu_viec" ? "Thử việc" : d.tinh_trang === "chinh_thuc" ? "Chính thức" : "Cộng tác viên", ...Object.fromEntries(cot.slice(3).map(([, k]) => [k, Number(d[k as keyof typeof d])])) });
  ws.addRow({ ten: "TỔNG", ...Object.fromEntries(cot.slice(6).filter(([, k]) => k !== "ot_gio").map(([, k]) => [k, ds.reduce((a, d) => a + Number(d[k as keyof typeof d]), 0)])) }).font = { bold: true };
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
  for (const [, k] of cot.slice(3)) if (!["cong_chuan", "cong_tinh", "ot_gio"].includes(k)) ws.getColumn(k).numFmt = "#,##0";
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "bang_luong", doi_tuong_id: id || null, chi_tiet: { ky_id: id } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="bang-luong-${ky.nam}-${String(ky.thang).padStart(2, "0")}.xlsx"` } });
}

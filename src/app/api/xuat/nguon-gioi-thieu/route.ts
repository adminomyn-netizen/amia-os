import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { LOAI_DOI_TAC, nhanMucHoaHong } from "@/lib/marketing";


/** Xuất Excel bảng nguồn giới thiệu theo ĐÚNG bộ lọc của /marketing/doi-tac (kỳ, chi nhánh, tìm, mới tạo 7 ngày). Chặn quyền + chi nhánh ở máy chủ, ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("mkt.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const { tu, den } = khoangNgay(u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
  const cnTs = u.searchParams.get("cn");
  const cn = nd.chiNhanhId ?? (cnTs && /^[0-9a-f-]{36}$/i.test(cnTs) ? cnTs : undefined);
  const tuKhoa = boDau((u.searchParams.get("q") ?? "").trim()), moi = u.searchParams.get("moi") === "1";
  const db = sb();
  const [{ data: ds }, { data: so, error }] = await Promise.all([
    db.from("doi_tac_gt").select("*").order("ten"),
    db.rpc("bc_nguon_gioi_thieu", { p_tu: tu, p_den: den, ...(cn ? { p_cn: cn } : {}) }),
  ]);
  if (error) return new Response("Không đọc được số liệu: " + error.message, { status: 500 });
  const soLieu = new Map((so ?? []).map((x) => [x.doi_tac_id, x]));
  const moc7 = congNgay(homNayHCM(), -7);
  const dong = (ds ?? []).filter((r) => (!tuKhoa || boDau(`${r.ten} ${r.ten_hien_thi ?? ""} ${r.ma} ${r.ma_gioi_thieu} ${r.dien_thoai ?? ""}`).includes(tuKhoa)) && (!moi || r.tao_luc.slice(0, 10) >= moc7));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Nguồn giới thiệu");
  ws.columns = [
    { header: "Nguồn giới thiệu", key: "ten", width: 28 }, { header: "Tên hiển thị", key: "hien", width: 22 }, { header: "Mã GT", key: "ma", width: 12 }, { header: "Mã REF (SĐT)", key: "ref", width: 14 },
    { header: "Loại", key: "loai", width: 18 }, { header: "Mức HH mặc định", key: "muc", width: 15 }, { header: "Trạng thái", key: "tt", width: 12 },
    { header: "Số khách giới thiệu", key: "kh", width: 12 }, { header: "Số đơn", key: "don", width: 9 }, { header: "Doanh thu", key: "dt", width: 14 }, { header: "Hoa hồng", key: "hh", width: 13 },
    { header: "Chưa thanh toán", key: "ctt", width: 14 }, { header: "Đang chờ chi", key: "cho", width: 13 }, { header: "Đã chi", key: "chi", width: 13 },
    { header: "Lượt ghé", key: "ghe", width: 9 }, { header: "Lịch hẹn", key: "lich", width: 9 }, { header: "Lead", key: "lead", width: 8 }, { header: "Tạo ngày", key: "tao", width: 12 },
  ];
  for (const r of dong) {
    const s = soLieu.get(r.id);
    ws.addRow({
      ten: r.ten, hien: r.ten_hien_thi ?? "", ma: r.ma_gioi_thieu, ref: r.ma_ref ?? "", loai: LOAI_DOI_TAC[r.loai] ?? r.loai, muc: nhanMucHoaHong(r.hh_kieu, Number(r.hh_gia_tri)), tt: r.hoat_dong ? "Đang hợp tác" : "Ngừng",
      kh: s?.so_khach ?? 0, don: s?.so_don ?? 0, dt: Number(s?.doanh_thu ?? 0), hh: Number(s?.hoa_hong ?? 0), ctt: Number(s?.chua_thanh_toan ?? 0), cho: Number(s?.dang_cho ?? 0), chi: Number(s?.da_chi ?? 0),
      ghe: s?.luot_ghe ?? 0, lich: s?.so_lich ?? 0, lead: s?.so_lead ?? 0, tao: ngayVN(r.tao_luc.slice(0, 10)),
    });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const k of ["J", "K", "L", "M", "N"]) ws.getColumn(k).numFmt = "#,##0";
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "doi_tac_gt", chi_tiet: { tu, den, chi_nhanh_id: cn ?? null, so_dong: dong.length } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="nguon-gioi-thieu-${tu}-${den}.xlsx"` } });
}

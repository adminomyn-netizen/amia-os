import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayCuaIso, ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { moTaLap, nhanNguon } from "@/lib/lich-hen";

const TT: Record<string, string> = { chua_xac_nhan: "Chưa xác nhận", da_xac_nhan: "Đã xác nhận", cho_phuc_vu: "Chờ phục vụ", dang_phuc_vu: "Đang phục vụ", hoan_thanh: "Hoàn thành", huy: "Đã huỷ", khong_den: "Khách không đến" };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const TOI_DA_NGAY = 93, TRANG = 1000;
const COT = `id, ma_dat_lich, bat_dau, ket_thuc, trang_thai, nguon, phong, ghi_chu, ly_do_huy, kieu_lap, lap_khoang, lap_tong, lap_thu_tu, nhan_vien_ten, dich_vu_ten, nguoi_tao_ten, tao_luc,
  khach:khach_hang!lich_hen_khach_id_fkey(ma, ho_ten, dien_thoai), nv:nhan_vien!lich_hen_nhan_vien_id_fkey(ho_ten), cn:chi_nhanh!lich_hen_chi_nhanh_id_fkey(ten), lich_hen_dich_vu(dich_vu(ten))`;

/** Xuất Excel lịch hẹn theo đúng bộ lọc đang xem (khoảng ngày, chi nhánh, nguồn). Chặn quyền + chi nhánh ở máy chủ, ghi nhật ký vì tệp có SĐT khách. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("lich.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const homNay = homNayHCM();
  const tu = NGAY.test(u.searchParams.get("tu") ?? "") ? u.searchParams.get("tu")! : homNay;
  const den = NGAY.test(u.searchParams.get("den") ?? "") ? u.searchParams.get("den")! : tu;
  if (den < tu) return new Response("Ngày cuối trước ngày đầu", { status: 400 });
  if (congNgay(tu, TOI_DA_NGAY) < den) return new Response(`Mỗi lần xuất tối đa ${TOI_DA_NGAY} ngày`, { status: 400 });
  const cn = nd.chiNhanhId ?? (u.searchParams.get("cn") || null);
  const nguon = u.searchParams.get("nguon") || null;
  const db = sb();
  const bd = new Date(`${tu}T00:00:00+07:00`).toISOString(), kt = new Date(`${congNgay(den, 1)}T00:00:00+07:00`).toISOString();
  const loc = () => {
    let q = db.from("lich_hen").select(COT, { count: "exact" }).gte("bat_dau", bd).lt("bat_dau", kt);
    if (cn) q = q.eq("chi_nhanh_id", cn);
    if (nguon) q = q.eq("nguon", nguon);
    return q.order("bat_dau").order("id");
  };
  // PostgREST trả tối đa 1000 dòng một lần → đọc theo trang tới khi đủ tổng đếm.
  const dong: NonNullable<Awaited<ReturnType<typeof loc>>["data"]> = [];
  let tong = 0;
  for (let i = 0; ; i += TRANG) {
    const { data, count, error } = await loc().range(i, i + TRANG - 1);
    if (error) return new Response("Không đọc được lịch hẹn: " + error.message, { status: 500 });
    tong = count ?? 0;
    dong.push(...(data ?? []));
    if (!data?.length || dong.length >= tong) break;
  }
  if (dong.length !== tong) return new Response(`Đọc thiếu dòng (${dong.length}/${tong}), thử lại`, { status: 500 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Lịch hẹn");
  ws.columns = [
    { header: "Ngày", key: "ngay", width: 12 }, { header: "Giờ", key: "gio", width: 13 }, { header: "Mã đặt lịch", key: "ma", width: 14 }, { header: "Khách hàng", key: "kh", width: 26 },
    { header: "Mã khách", key: "mk", width: 12 }, { header: "Điện thoại", key: "sdt", width: 14 }, { header: "Dịch vụ", key: "dv", width: 40 }, { header: "Nhân viên", key: "nv", width: 22 },
    { header: "Phòng", key: "phong", width: 10 }, { header: "Chi nhánh", key: "cn", width: 16 }, { header: "Nguồn đặt", key: "nguon", width: 16 }, { header: "Trạng thái", key: "tt", width: 16 },
    { header: "Lặp", key: "lap", width: 28 }, { header: "Ghi chú", key: "gc", width: 36 }, { header: "Lý do huỷ", key: "ldh", width: 26 }, { header: "Người tạo", key: "nt", width: 20 }, { header: "Tạo lúc", key: "tl", width: 17 },
  ];
  for (const l of dong) {
    const dvs = (l.lich_hen_dich_vu ?? []).map((x) => x.dich_vu?.ten).filter(Boolean).join(", ");
    ws.addRow({
      ngay: ngayVN(ngayCuaIso(l.bat_dau)), gio: `${gioVN(l.bat_dau)}–${gioVN(l.ket_thuc)}`, ma: l.ma_dat_lich ?? "", kh: l.khach?.ho_ten ?? "", mk: l.khach?.ma ?? "", sdt: l.khach?.dien_thoai ?? "",
      dv: dvs || l.dich_vu_ten || "", nv: l.nv?.ho_ten ?? l.nhan_vien_ten ?? "", phong: l.phong ?? "", cn: l.cn?.ten ?? "", nguon: nhanNguon(l.nguon), tt: TT[l.trang_thai] ?? l.trang_thai,
      lap: moTaLap(l), gc: l.ghi_chu ?? "", ldh: l.ly_do_huy ?? "", nt: l.nguoi_tao_ten ?? "", tl: ngayGioVN(l.tao_luc),
    });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: "A1", to: "Q1" };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "lich_hen", chi_tiet: { tu, den, chi_nhanh_id: cn, nguon, so_dong: dong.length } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="lich-hen-${tu}${den !== tu ? `-${den}` : ""}.xlsx"` } });
}

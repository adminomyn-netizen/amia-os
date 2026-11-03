import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";

/** Xuất Excel báo cáo doanh thu theo ngày. Chặn quyền ở máy chủ (không chỉ ẩn nút). */
export async function GET(req: Request) {
  const nd = await kiemQuyen("baocao.tien");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const { tu, den } = khoangNgay(u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
  const cn = nd.chiNhanhId ?? (u.searchParams.get("cn") || undefined);
  const [{ data }, { data: dataVi }] = await Promise.all([sb().rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn as string }), sb().rpc("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: cn as string })]);
  // Cột ví như báo cáo ngày SalonHero (Momo, VNPay, Shopee Pay, GrabPay, Ví khác — 0199); Ship COD chỉ thêm khi có số, như trang Báo cáo.
  const viNgay = new Map((dataVi ?? []).map((r) => [r.ngay, r]));
  const coCod = (dataVi ?? []).some((r) => Number(r.ship_cod) !== 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Doanh thu theo ngày");
  ws.columns = [
    { header: "Ngày", key: "ngay", width: 12 }, { header: "Đơn mới", key: "so_don", width: 10 }, { header: "Doanh thu", key: "doanh_thu", width: 16 }, { header: "Thu đơn mới", key: "thu_don_moi", width: 16 },
    { header: "Thu nợ cũ", key: "thu_no_cu", width: 16 }, { header: "Thực thu", key: "thuc_thu", width: 16 }, { header: "Tiền mặt", key: "tien_mat", width: 16 }, { header: "Chuyển khoản", key: "chuyen_khoan", width: 16 },
    { header: "Quẹt thẻ", key: "quet_the", width: 16 },
    { header: "Momo", key: "momo", width: 14 }, { header: "VNPay", key: "vnpay", width: 14 }, { header: "Shopee Pay", key: "shopee", width: 14 }, { header: "GrabPay", key: "grab", width: 14 }, { header: "Ví điện tử khác", key: "vi_khac", width: 16 },
    ...(coCod ? [{ header: "Ship COD", key: "ship_cod", width: 14 }] : []),
    { header: "Trừ thẻ tiền", key: "tru_the_tien", width: 16 }, { header: "Nợ mới", key: "no_moi", width: 16 }, { header: "Buổi đã làm", key: "so_buoi", width: 12 }, { header: "Doanh thu buổi", key: "doanh_thu_buoi", width: 16 },
  ];
  for (const r of data ?? []) { const v = viNgay.get(r.ngay); ws.addRow({ ...r, ngay: r.ngay.split("-").reverse().join("/"), momo: Number(v?.momo ?? 0), vnpay: Number(v?.vnpay ?? 0), shopee: Number(v?.shopee ?? 0), grab: Number(v?.grab ?? 0), vi_khac: Number(v?.vi_khac ?? 0), ship_cod: Number(v?.ship_cod ?? 0) }); }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const c of ws.columns) if (c.key && !["ngay", "so_don", "so_buoi"].includes(c.key)) c.numFmt = "#,##0";
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "bao_cao", chi_tiet: { tab: "doanh-thu", tu, den, chi_nhanh_id: cn ?? null } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="doanh-thu-${tu}-${den}.xlsx"` } });
}

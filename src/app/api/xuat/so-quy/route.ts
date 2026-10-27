import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";

const NHAN: Record<string, string> = { thu: "Thu vào", chi: "Chi ra", nap: "Nạp tiền", rut: "Rút tiền" };

/** Xuất Excel sổ quỹ (tiền mặt hoặc ngân hàng) theo kỳ. Chặn quyền ở máy chủ. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("quy.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const { tu, den } = khoangNgay(u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
  const loaiQuy = u.searchParams.get("quy") === "ngan-hang" ? "ngan_hang" : "tien_mat";
  const cn = nd.chiNhanhId ?? (u.searchParams.get("cn") || undefined);
  const db = sb();
  let q = db.from("quy").select("id, so_du_dau").eq("loai", loaiQuy);
  if (cn) q = q.eq("chi_nhanh_id", cn);
  const { data: dsQuy } = await q;
  const ids = (dsQuy ?? []).map((x) => x.id);
  const { data: tong } = await db.rpc("so_quy_tong", { p_quy: ids, p_tu: tu, p_den: den });
  const dau = Number(tong?.[0]?.dau ?? 0);
  const { data } = await db.from("v_so_quy").select("*").in("quy_id", ids).gte("ngay", tu).lte("ngay", den).order("ngay").order("tao_luc").limit(20000);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(loaiQuy === "tien_mat" ? "Sổ quỹ tiền mặt" : "Sổ quỹ ngân hàng");
  ws.columns = [
    { header: "Ngày", key: "ngay", width: 12 }, { header: "Mã", key: "ma", width: 16 }, { header: "Loại", key: "loai", width: 12 }, { header: "Phân loại", key: "pl", width: 30 },
    { header: "Nội dung", key: "nd", width: 46 }, { header: "Đối tượng", key: "dt", width: 22 }, { header: "Thu / nạp", key: "vao", width: 16 }, { header: "Chi / rút", key: "ra", width: 16 }, { header: "Số dư", key: "du", width: 18 },
  ];
  let du = dau;
  ws.addRow({ nd: "Tồn quỹ đầu kỳ", du });
  for (const r of data ?? []) {
    du += Number(r.bien_dong);
    ws.addRow({ ngay: (r.ngay ?? "").split("-").reverse().join("/"), ma: r.ma, loai: NHAN[r.loai ?? ""] ?? "", pl: r.loai_thu_chi ?? "", nd: r.noi_dung, dt: r.doi_tuong ?? "", vao: Number(r.bien_dong) > 0 ? Number(r.so_tien) : null, ra: Number(r.bien_dong) < 0 ? Number(r.so_tien) : null, du });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const k of ["G", "H", "I"]) ws.getColumn(k).numFmt = "#,##0";
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="so-quy-${loaiQuy === "tien_mat" ? "tien-mat" : "ngan-hang"}-${tu}-${den}.xlsx"` } });
}

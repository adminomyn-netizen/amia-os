import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { docLocHddt } from "@/lib/hoa-don-dien-tu";
import { layHoaDonHddt } from "@/lib/hoa-don-dien-tu-truy-van";

const TOI_DA_NGAY = 366, TOI_DA_DONG = 20000;

/** Xuất Excel các hoá đơn điện tử ĐÃ ghi số, theo đúng bộ lọc của tab "Đã xuất". Quyền và phạm vi chi nhánh kiểm lại ở máy chủ, có nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("ban.xem");
  if (!nd || !coQuyen(nd, "hd.vat")) return new Response("Không đủ quyền", { status: 403 });
  const loc = docLocHddt(Object.fromEntries(new URL(req.url).searchParams));
  if (loc.den < loc.tu) return new Response("Ngày cuối trước ngày đầu", { status: 400 });
  if (congNgay(loc.tu, TOI_DA_NGAY) < loc.den) return new Response(`Mỗi lần xuất tối đa ${TOI_DA_NGAY} ngày`, { status: 400 });
  const { dong, conNua } = await layHoaDonHddt(nd, { ...loc, tab: "da" }, "da", TOI_DA_DONG);
  if (conNua) return new Response("Quá nhiều dòng, thu hẹp khoảng ngày", { status: 400 });
  const db = sb();
  const idsK = [...new Set(dong.map((d) => d.khach_id).filter(Boolean))] as string[];
  const idsNv = [...new Set(dong.map((d) => d.vat_hd_nguoi_id).filter(Boolean))] as string[];
  const theoLo = async <T,>(ids: string[], doc: (lo: string[]) => PromiseLike<{ data: T[] | null }>) => { const ra: T[] = []; for (let i = 0; i < ids.length; i += 200) ra.push(...((await doc(ids.slice(i, i + 200))).data ?? [])); return ra; };
  const [k, nv] = await Promise.all([
    theoLo(idsK, (lo) => db.from("khach_hang").select("id, ma, ho_ten, ma_so_thue").in("id", lo)),
    theoLo(idsNv, (lo) => db.from("nhan_vien").select("id, ho_ten").in("id", lo)),
  ]);
  const tenK = new Map(k.map((x) => [x.id, x])), tenNv = new Map(nv.map((x) => [x.id, x.ho_ten]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Hoá đơn điện tử");
  ws.columns = [
    { header: "Mã hoá đơn bán", key: "ma", width: 15 }, { header: "Ngày bán", key: "ngay", width: 12 }, { header: "Khách hàng", key: "kh", width: 26 }, { header: "Mã số thuế khách", key: "mst", width: 16 },
    { header: "Số hoá đơn điện tử", key: "so", width: 18 }, { header: "Mẫu số", key: "mau", width: 9 }, { header: "Ký hiệu", key: "ky", width: 12 }, { header: "Ngày xuất", key: "nx", width: 12 },
    { header: "Mã / đường dẫn tra cứu", key: "tc", width: 34 }, { header: "Phải thu", key: "phai", width: 14 }, { header: "Người ghi", key: "ng", width: 22 }, { header: "Ghi lúc", key: "luc", width: 17 },
  ];
  for (const h of dong) {
    const x = h.khach_id ? tenK.get(h.khach_id) : undefined;
    ws.addRow({ ma: h.ma, ngay: ngayVN(h.ngay_hd), kh: h.khach_id ? x?.ho_ten ?? "" : "Khách lẻ", mst: x?.ma_so_thue ?? "", so: h.vat_hd_so ?? "", mau: h.vat_hd_mau_so ?? "", ky: h.vat_hd_ky_hieu ?? "",
      nx: ngayVN(h.vat_hd_ngay ?? h.vat_hd_luc?.slice(0, 10) ?? ""), tc: h.vat_hd_tra_cuu ?? "", phai: Number(h.tong_phai_thu), ng: h.vat_hd_nguoi_id ? tenNv.get(h.vat_hd_nguoi_id) ?? "" : "", luc: ngayGioVN(h.vat_hd_luc) });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: "A1", to: "L1" };
  ws.getColumn("J").numFmt = "#,##0";
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "hoa_don_dien_tu", chi_tiet: { tu: loc.tu, den: loc.den, q: loc.q, chi_nhanh_id: nd.chiNhanhId, so_dong: dong.length } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="hoa-don-dien-tu-${loc.tu}-${loc.den}.xlsx"` } });
}

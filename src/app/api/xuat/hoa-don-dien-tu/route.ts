import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { docLocHddt } from "@/lib/hoa-don-dien-tu";
import { layHet, layHoaDonHddt, layHoaDonTheoIds, layThuTheoDon } from "@/lib/hoa-don-dien-tu-truy-van";
import { docIdsChon, gomDonXuat, type DongHangXuat, type KhachXuat } from "@/lib/hoa-don-dien-tu-xuat";

const TOI_DA_NGAY = 366, TOI_DA_DONG = 20000;

const theoLo = async <T,>(ids: string[], doc: (lo: string[]) => PromiseLike<{ data: T[] | null }>) => { const ra: T[] = []; for (let i = 0; i < ids.length; i += 100) ra.push(...((await doc(ids.slice(i, i + 100))).data ?? [])); return ra; };
const soVN = (n: number) => n.toLocaleString("vi-VN");
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Xuất Excel các hoá đơn ĐÃ CHỌN ở ngăn "Cần xuất" (?ids=…): từng dòng hàng với tên xuất, người mua, MST, địa chỉ, nơi nhận tiền, VAT, tổng.
 *  Id từ trình duyệt chỉ là danh sách muốn xem: máy chủ lọc lại trong phạm vi người này được xem (chi nhánh, quyền xem toàn cơ sở). */
async function layDongHang(ids: string[]) {
  const db = sb(), ra: DongHangXuat[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const lo = ids.slice(i, i + 50);
    ra.push(...(await layHet<DongHangXuat>((tu, den) => db.from("hoa_don_dong").select("id, hoa_don_id, ten, so_luong, don_gia, giam_gia, thanh_tien").in("hoa_don_id", lo).order("tao_luc").order("id").range(tu, den))));
  }
  return ra;
}
async function xuatTheoIds(nd: NonNullable<Awaited<ReturnType<typeof kiemQuyen>>>, raw: string | null) {
  const kt = docIdsChon(raw);
  if ("loi" in kt) return new Response(kt.loi, { status: 400 });
  const { dong: hds, boQua } = await layHoaDonTheoIds(nd, kt.ids);
  if (!hds.length) return new Response("Không có hoá đơn nào trong phạm vi bạn được xem.", { status: 404 });
  const db = sb(), ids = hds.map((h) => h.id), idsK = [...new Set(hds.map((h) => h.khach_id).filter(Boolean))] as string[];
  const [k, dongHang, thu] = await Promise.all([
    theoLo<KhachXuat & { id: string }>(idsK, (lo) => db.from("khach_hang").select("id, ho_ten, cong_ty, ma_so_thue, dia_chi").in("id", lo)),
    layDongHang(ids),
    layThuTheoDon(ids),
  ]);
  const khach = new Map(k.map((x) => [x.id, x])), dongTheoDon = new Map<string, DongHangXuat[]>();
  for (const d of dongHang) (dongTheoDon.get(d.hoa_don_id) ?? dongTheoDon.set(d.hoa_don_id, []).get(d.hoa_don_id)!).push(d);
  const don = hds.map((h) => gomDonXuat(h, h.khach_id ? khach.get(h.khach_id) : undefined, dongTheoDon.get(h.id) ?? [], thu.get(h.id), undefined, undefined, soVN));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Dòng hàng");
  ws.columns = [
    { header: "Mã đơn", key: "ma", width: 14 }, { header: "Ngày bán", key: "ngay", width: 12 }, { header: "Khách hàng", key: "kh", width: 24 }, { header: "Người mua (tên xuất)", key: "nm", width: 30 },
    { header: "Mã số thuế", key: "mst", width: 16 }, { header: "Địa chỉ", key: "dc", width: 34 }, { header: "Ngân hàng nhận tiền", key: "nh", width: 30 },
    { header: "Tên hàng / dịch vụ (tên xuất)", key: "ten", width: 40 }, { header: "Số lượng", key: "sl", width: 9 }, { header: "Đơn giá", key: "dg", width: 14 }, { header: "Giảm giá dòng", key: "gg", width: 14 }, { header: "Thành tiền", key: "tt", width: 14 },
    { header: "VAT (%)", key: "vp", width: 9 }, { header: "Tiền VAT cả đơn", key: "vt", width: 15 }, { header: "Tổng phải thu cả đơn", key: "tong", width: 18 },
  ];
  for (const d of don) {
    const dau = { ma: d.ma, ngay: ngayVN(d.ngay), kh: d.khachHoTen, nm: d.nguoiMua, mst: d.mst, dc: d.diaChi, nh: d.nganHang };
    (d.dong.length ? d.dong : [null]).forEach((x, i) => ws.addRow({ ...dau, ten: x?.ten ?? "(đơn không có dòng hàng)", sl: x?.sl ?? "", dg: x?.donGia ?? "", gg: x?.giamGia ?? "", tt: x?.thanhTien ?? "", vp: i === 0 ? d.vatPct : "", vt: i === 0 ? d.vatTien : "", tong: i === 0 ? d.tongPhaiThu : "" }));
  }
  for (const c of ["mst"]) ws.getColumn(c).numFmt = "@";
  for (const c of ["dg", "gg", "tt", "vt", "tong"]) ws.getColumn(c).numFmt = "#,##0";
  ws.getRow(1).font = { bold: true }; ws.views = [{ state: "frozen", ySplit: 1 }]; ws.autoFilter = { from: "A1", to: "O1" };
  const ws2 = wb.addWorksheet("Theo đơn");
  ws2.columns = [
    { header: "Mã đơn", key: "ma", width: 14 }, { header: "Ngày bán", key: "ngay", width: 12 }, { header: "Khách hàng", key: "kh", width: 24 }, { header: "Người mua (tên xuất)", key: "nm", width: 30 }, { header: "Mã số thuế", key: "mst", width: 16 },
    { header: "Địa chỉ", key: "dc", width: 34 }, { header: "Ngân hàng nhận tiền", key: "nh", width: 30 }, { header: "Tiền hàng", key: "th", width: 14 }, { header: "Giảm giá cả đơn", key: "gd", width: 15 }, { header: "Phụ phí + tip", key: "pp", width: 13 },
    { header: "VAT (%)", key: "vp", width: 9 }, { header: "Tiền VAT", key: "vt", width: 13 }, { header: "Tổng phải thu", key: "tong", width: 15 },
  ];
  for (const d of don) ws2.addRow({ ma: d.ma, ngay: ngayVN(d.ngay), kh: d.khachHoTen, nm: d.nguoiMua, mst: d.mst, dc: d.diaChi, nh: d.nganHang, th: d.tongHang, gd: d.giamDon, pp: d.phuPhiTip, vp: d.vatPct, vt: d.vatTien, tong: d.tongPhaiThu });
  ws2.getColumn("mst").numFmt = "@";
  for (const c of ["th", "gd", "pp", "vt", "tong"]) ws2.getColumn(c).numFmt = "#,##0";
  ws2.getRow(1).font = { bold: true }; ws2.views = [{ state: "frozen", ySplit: 1 }]; ws2.autoFilter = { from: "A1", to: "M1" };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "hoa_don_dien_tu", chi_tiet: { kieu: "da_chon", so_hoa_don: hds.length, bo_qua_ngoai_pham_vi: boQua, chi_nhanh_id: nd.chiNhanhId } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="hoa-don-can-xuat-${homNayHCM()}.xlsx"` } });
}

/** Xuất Excel các hoá đơn điện tử ĐÃ ghi số, theo đúng bộ lọc của tab "Đã xuất"; có ?ids=… thì xuất các hoá đơn đã chọn (xuatTheoIds). Quyền và phạm vi chi nhánh kiểm lại ở máy chủ, có nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("ban.xem");
  if (!nd || !coQuyen(nd, "hd.vat")) return new Response("Không đủ quyền", { status: 403 });
  const tham = new URL(req.url).searchParams;
  if (tham.has("ids")) return xuatTheoIds(nd, tham.get("ids"));
  const loc = docLocHddt(Object.fromEntries(tham));
  if (loc.den < loc.tu) return new Response("Ngày cuối trước ngày đầu", { status: 400 });
  if (congNgay(loc.tu, TOI_DA_NGAY) < loc.den) return new Response(`Mỗi lần xuất tối đa ${TOI_DA_NGAY} ngày`, { status: 400 });
  const { dong, conNua } = await layHoaDonHddt(nd, { ...loc, tab: "da" }, "da", TOI_DA_DONG);
  if (conNua) return new Response("Quá nhiều dòng, thu hẹp khoảng ngày", { status: 400 });
  const db = sb();
  const idsK = [...new Set(dong.map((d) => d.khach_id).filter(Boolean))] as string[];
  const idsNv = [...new Set(dong.map((d) => d.vat_hd_nguoi_id).filter(Boolean))] as string[];
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
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="hoa-don-dien-tu-${loc.tu}-${loc.den}.xlsx"` } });
}

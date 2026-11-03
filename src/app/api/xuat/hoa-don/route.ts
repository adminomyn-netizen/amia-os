import ExcelJS from "exceljs";
import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { apLocHoaDon, docLocHoaDon, traCuuLoc } from "@/lib/loc-hoa-don";

const TT: Record<string, string> = { nhap: "Nháp", hoan_thanh: "Hoàn thành", huy: "Đã huỷ" };
const TOI_DA_NGAY = 366, TRANG = 1000;
const COT = `id, ma, sh_ma, ngay_hd, trang_thai, tong_hang, giam_gia_don, giam_diem, giam_voucher, vat_pct, vat_tien, phu_phi, tip, tong_phai_thu, da_thu, con_no, tien_tru_the,
  vat_hd_luc, vat_hd_so, vat_hd_ky_hieu, ghi_chu, ly_do_huy, la_lich_su, tao_luc, thu_ngan_ten,
  khach:khach_hang!hoa_don_khach_id_fkey(ma, ho_ten, dien_thoai), lap:nhan_vien!hoa_don_nguoi_lap_id_fkey(ho_ten), cn:chi_nhanh!hoa_don_chi_nhanh_id_fkey(ten)`;

/** Xuất Excel hoá đơn theo ĐÚNG bộ lọc của màn /hoa-don (dùng chung lib/loc-hoa-don). Chặn quyền + chi nhánh ở máy chủ, ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("ban.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url);
  const loc = docLocHoaDon(Object.fromEntries(u.searchParams));
  if (loc.den < loc.tu) return new Response("Ngày cuối trước ngày đầu", { status: 400 });
  if (congNgay(loc.tu, TOI_DA_NGAY) < loc.den) return new Response(`Mỗi lần xuất tối đa ${TOI_DA_NGAY} ngày`, { status: 400 });
  const db = sb();
  const tra = await traCuuLoc(db, loc);
  const truyVan = () => apLocHoaDon(db.from("v_hoa_don_loc").select(COT, { count: "exact" }), loc, nd.chiNhanhId, tra).order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).order("id");
  // PostgREST trả tối đa 1000 dòng một lần → đọc theo trang tới khi đủ tổng đếm.
  const dong: NonNullable<Awaited<ReturnType<typeof truyVan>>["data"]> = [];
  let tong = 0;
  for (let i = 0; ; i += TRANG) {
    const { data, count, error } = await truyVan().range(i, i + TRANG - 1);
    if (error) return new Response("Không đọc được hoá đơn: " + error.message, { status: 500 });
    tong = count ?? 0;
    dong.push(...(data ?? []));
    if (!data?.length || dong.length >= tong) break;
  }
  if (dong.length !== tong) return new Response(`Đọc thiếu dòng (${dong.length}/${tong}), thử lại`, { status: 500 });

  const xemSdt = coQuyen(nd, "khach.sdt");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Hoá đơn");
  ws.columns = [
    { header: "Mã", key: "ma", width: 14 }, { header: "Mã SalonHero", key: "sh", width: 13 }, { header: "Ngày", key: "ngay", width: 12 }, { header: "Chi nhánh", key: "cn", width: 14 },
    { header: "Khách hàng", key: "kh", width: 26 }, { header: "Mã khách", key: "mk", width: 14 }, { header: "Điện thoại", key: "sdt", width: 13 }, { header: "Người lập", key: "nl", width: 22 },
    { header: "Tiền hàng", key: "hang", width: 14 }, { header: "Giảm giá đơn", key: "giam", width: 14 }, { header: "Trong đó đổi điểm", key: "diem", width: 14 }, { header: "Giảm voucher", key: "vc", width: 13 },
    { header: "VAT %", key: "vp", width: 7 }, { header: "Tiền VAT", key: "vt", width: 12 }, { header: "Phụ phí", key: "pp", width: 11 }, { header: "Tip", key: "tip", width: 10 },
    { header: "Phải thu", key: "phai", width: 14 }, { header: "Đã thu", key: "thu", width: 14 }, { header: "Trừ thẻ", key: "the", width: 13 }, { header: "Còn nợ", key: "no", width: 13 },
    { header: "Trạng thái", key: "tt", width: 12 }, { header: "HĐ VAT", key: "hdvat", width: 16 }, { header: "Số HĐ VAT", key: "vso", width: 12 }, { header: "Ký hiệu", key: "vkh", width: 11 },
    { header: "Ghi chú", key: "gc", width: 30 }, { header: "Lý do huỷ", key: "ldh", width: 24 }, { header: "Tạo lúc", key: "tl", width: 17 },
  ];
  const n = (v: unknown) => Number(v ?? 0);
  for (const h of dong) {
    const xong = h.trang_thai === "hoan_thanh";
    ws.addRow({
      ma: h.ma, sh: h.sh_ma ?? "", ngay: ngayVN(h.ngay_hd), cn: h.cn?.ten ?? "", kh: h.khach?.ho_ten ?? (h.khach ? "" : "Khách lẻ"), mk: h.khach?.ma ?? "", sdt: xemSdt ? h.khach?.dien_thoai ?? "" : "",
      nl: (h.la_lich_su ? h.thu_ngan_ten : h.lap?.ho_ten) ?? "", hang: n(h.tong_hang), giam: n(h.giam_gia_don), diem: n(h.giam_diem) || null, vc: n(h.giam_voucher) || null, vp: n(h.vat_pct) || null, vt: n(h.vat_tien) || null,
      pp: n(h.phu_phi) || null, tip: n(h.tip) || null, phai: n(h.tong_phai_thu), thu: n(h.da_thu), the: n(h.tien_tru_the) || null, no: xong ? n(h.con_no) : 0, tt: TT[h.trang_thai ?? ""] ?? h.trang_thai,
      hdvat: xong ? (h.vat_hd_luc ? "Đã có hoá đơn" : "Chưa có hoá đơn") : "", vso: h.vat_hd_so ?? "", vkh: h.vat_hd_ky_hieu ?? "", gc: h.ghi_chu ?? "", ldh: h.ly_do_huy ?? "", tl: ngayGioVN(h.tao_luc),
    });
  }
  const cuoi = ws.addRow({ ma: "Tổng (hoá đơn hoàn thành)" });
  const xongHet = dong.filter((h) => h.trang_thai === "hoan_thanh");
  for (const [k, truong] of [["hang", "tong_hang"], ["giam", "giam_gia_don"], ["vt", "vat_tien"], ["phai", "tong_phai_thu"], ["thu", "da_thu"], ["no", "con_no"]] as const) {
    cuoi.getCell(k).value = xongHet.reduce((s, h) => s + n(h[truong]), 0);
  }
  cuoi.font = { bold: true };
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: "A1", to: "AA1" };
  for (const k of ["I", "J", "K", "L", "N", "O", "P", "Q", "R", "S", "T"]) ws.getColumn(k).numFmt = "#,##0";
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xuat_excel", doi_tuong: "hoa_don", chi_tiet: { ...loc, chi_nhanh_id: nd.chiNhanhId, so_dong: dong.length } });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="hoa-don-${loc.tu}-${loc.den}.xlsx"` } });
}

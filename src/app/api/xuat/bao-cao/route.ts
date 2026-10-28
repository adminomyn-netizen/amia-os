import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { docHet, ngayXuat as ngay, phanHoiExcel, type BangXuat as Bang, type Cot } from "@/lib/xuat-excel";
import { khoangNgay } from "@/lib/bao-cao";
import { layTiLeChot, phanTram } from "@/lib/tu-van";
import { chuSao, layDanhGia, tongTheoNhanVien } from "@/lib/bao-cao-danh-gia";
import { dongDoiChieu, layHoaHongGioiThieu, layHoaHongThucThu, NHAN_VAI_HH } from "@/lib/bao-cao-hoa-hong";
import { gomTheoKy, kieuGom, layLichSuDungThe, layCacLanTraNo, layNhanVienSh, laySanPhamDichVu, LOC_LOAI, layTheoChiNhanh, layTheoKhachHang } from "@/lib/bao-cao-gap";
import { chonNhom, layDatLich, layDungDichVu, layThuNgan, tenKy, tenNguon, TRANG_THAI_LICH } from "@/lib/bao-cao-du-lieu";

/** Xuất Excel cho MỌI tab báo cáo theo bộ lọc đang chọn (tab, từ/đến, chi nhánh, gom kỳ).
 *  Quyền chặn ở máy chủ: cần `baocao.xem`; tab có số tiền cần thêm `baocao.tien` (giống trang). Người gắn chi nhánh chỉ xuất được chi nhánh của mình. */
const TAB_KHONG_TIEN = new Set(["dat-lich", "danh-gia", "ti-le-chot"]);
export async function GET(req: Request) {
  const nd = await kiemQuyen("baocao.xem");
  if (!nd) return new Response("Không đủ quyền xem báo cáo", { status: 403 });
  const u = new URL(req.url);
  const tab = u.searchParams.get("tab") ?? "doanh-thu";
  if (!TAB_KHONG_TIEN.has(tab) && !coQuyen(nd, "baocao.tien")) return new Response("Không đủ quyền xem số tiền", { status: 403 });
  const { tu, den } = khoangNgay(u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
  const cn = nd.chiNhanhId ?? (u.searchParams.get("cn") || undefined);
  const db = sb();
  const bangs: Bang[] = [];

  if (tab === "doanh-thu") {
    const { data, error } = await db.rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn as string });
    if (error) return new Response("Lỗi đọc dữ liệu", { status: 500 });
    const gom = kieuGom(u.searchParams.get("gom") ?? undefined);
    const dsGom = gomTheoKy((data ?? []).map((r) => ({ ...r, ngay: r.ngay, so_don: Number(r.so_don), doanh_thu: Number(r.doanh_thu), thu_don_moi: Number(r.thu_don_moi), thu_no_cu: Number(r.thu_no_cu), thuc_thu: Number(r.thuc_thu), tien_mat: Number(r.tien_mat), chuyen_khoan: Number(r.chuyen_khoan), quet_the: Number(r.quet_the), tru_the_tien: Number(r.tru_the_tien), no_moi: Number(r.no_moi), so_buoi: Number(r.so_buoi), doanh_thu_buoi: Number(r.doanh_thu_buoi) })), gom, ["so_don", "doanh_thu", "thu_don_moi", "thu_no_cu", "thuc_thu", "tien_mat", "chuyen_khoan", "quet_the", "tru_the_tien", "no_moi", "so_buoi", "doanh_thu_buoi"]);
    bangs.push({ ten: "Doanh thu theo ngày", dong: dsGom.map((r) => ({ ...r, ngay: r.nhan })), cot: [
      { nhan: "Thời gian", khoa: "ngay", rong: 24 }, { nhan: "Đơn mới", khoa: "so_don", so: true }, { nhan: "Doanh thu", khoa: "doanh_thu", tien: true }, { nhan: "Thu đơn mới", khoa: "thu_don_moi", tien: true },
      { nhan: "Thu nợ cũ", khoa: "thu_no_cu", tien: true }, { nhan: "Thực thu", khoa: "thuc_thu", tien: true }, { nhan: "Tiền mặt", khoa: "tien_mat", tien: true }, { nhan: "Chuyển khoản", khoa: "chuyen_khoan", tien: true },
      { nhan: "Quẹt thẻ", khoa: "quet_the", tien: true }, { nhan: "Trừ thẻ tiền", khoa: "tru_the_tien", tien: true }, { nhan: "Nợ mới", khoa: "no_moi", tien: true }, { nhan: "Buổi đã làm", khoa: "so_buoi", so: true }, { nhan: "Doanh thu buổi", khoa: "doanh_thu_buoi", tien: true }] });
  } else if (tab === "thu-ngan") {
    const { nhom } = chonNhom(u.searchParams.get("nhom") ?? undefined, tu, den, "tong");
    const ds = await layThuNgan(db, tu, den, cn, nhom);
    bangs.push({ ten: "Theo thu ngân", dong: ds.map((r) => ({ ...r, ky: nhom === "tong" ? `${ngay(tu)} – ${ngay(den)}` : tenKy(r.ky, nhom) })), cot: [
      { nhan: "Kỳ", khoa: "ky", rong: 24 }, { nhan: "Thu ngân", khoa: "thu_ngan", rong: 28 }, { nhan: "Các tên của tài khoản", khoa: "cac_ten", rong: 36 }, { nhan: "Số đơn", khoa: "so_don", so: true },
      { nhan: "Doanh số", khoa: "doanh_so", tien: true }, { nhan: "Trừ thẻ tiền", khoa: "tru_the_tien", tien: true }, { nhan: "Doanh thu sau trừ thẻ", khoa: "doanh_thu", tien: true },
      { nhan: "Còn nợ", khoa: "con_no", tien: true }, { nhan: "Đã thu", khoa: "da_thu", tien: true }] });
  } else if (tab === "danh-gia") {
    const ds = await layDanhGia(db, tu, den, cn);
    bangs.push({ ten: "Tổng hợp theo nhân viên", dong: tongTheoNhanVien(ds).map((r) => ({ ten: r.ten, so: r.so, tb: Number(chuSao(r.tb).replace(",", ".")), s5: r.phanBo[4], s4: r.phanBo[3], s3: r.phanBo[2], s2: r.phanBo[1], s1: r.phanBo[0] })), cot: [
      { nhan: "Nhân viên", khoa: "ten", rong: 30 }, { nhan: "Số đánh giá", khoa: "so", so: true }, { nhan: "Trung bình sao", khoa: "tb", rong: 16 }, { nhan: "5 sao", khoa: "s5", so: true }, { nhan: "4 sao", khoa: "s4", so: true },
      { nhan: "3 sao", khoa: "s3", so: true }, { nhan: "2 sao", khoa: "s2", so: true }, { nhan: "1 sao", khoa: "s1", so: true }] });
    bangs.push({ ten: "Đánh giá theo đơn hàng", dong: ds.map((r) => ({ ngay: ngay(r.ngay), ma: r.ma, ten: r.ten, diem: r.diem, y_kien: r.yKien, dich_vu: r.dichVu })), cot: [
      { nhan: "Ngày", khoa: "ngay", rong: 12 }, { nhan: "Mã hóa đơn", khoa: "ma", rong: 16 }, { nhan: "Tên Nhân Viên", khoa: "ten", rong: 28 }, { nhan: "Đánh giá (sao)", khoa: "diem", so: true },
      { nhan: "Ý kiến đánh giá", khoa: "y_kien", rong: 48 }, { nhan: "Dịch vụ đã thực hiện", khoa: "dich_vu", rong: 48 }] });
  } else if (tab === "ti-le-chot") {
    const ds = await layTiLeChot(db, tu, den, cn), xemTien = coQuyen(nd, "baocao.tien");
    bangs.push({ ten: "Tỉ lệ chốt tư vấn", dong: ds.map((r) => ({ ten: r.ten, so: r.soPhieu, cho: r.choChot, chot: r.chot, khong: r.khongChot, tl: phanTram(r.tiLe), gt: r.tongBaoGiaChot, bg: r.tongBaoGia })), cot: [
      { nhan: "Tư vấn viên", khoa: "ten", rong: 30 }, { nhan: "Số phiếu", khoa: "so", so: true }, { nhan: "Chờ chốt", khoa: "cho", so: true }, { nhan: "Chốt", khoa: "chot", so: true }, { nhan: "Không chốt", khoa: "khong", so: true },
      { nhan: "Tỉ lệ chốt (chốt / tổng phiếu)", khoa: "tl", rong: 26 }, ...(xemTien ? [{ nhan: "Tổng báo giá chốt", khoa: "gt", tien: true }, { nhan: "Tổng báo giá mọi phiếu", khoa: "bg", tien: true }] : [])] });
  } else if (tab === "dat-lich") {
    const { nhom } = chonNhom(u.searchParams.get("nhom") ?? undefined, tu, den, "thang");
    const d = await layDatLich(db, tu, den, cn, nhom);
    const cot = (dau: string): Cot[] => [{ nhan: dau, khoa: "nhan", rong: 30 }, { nhan: "Số lịch", khoa: "so_lich", so: true }, { nhan: "Khách đến", khoa: "hoan_thanh", so: true }, { nhan: "Huỷ", khoa: "huy", so: true },
      { nhan: "Không đến", khoa: "khong_den", so: true }, { nhan: "Chưa tới hẹn / chưa chốt", khoa: "chua_den", so: true }];
    bangs.push({ ten: "Theo trạng thái", cot: cot("Trạng thái").slice(0, 2), dong: d.trangThai.map((r) => ({ ...r, nhan: TRANG_THAI_LICH[r.khoa] ?? r.khoa })) });
    bangs.push({ ten: "Theo nguồn đặt", cot: cot("Nguồn"), dong: d.nguon.map((r) => ({ ...r, nhan: tenNguon(r.khoa) })) });
    bangs.push({ ten: nhom === "ngay" ? "Theo ngày" : "Theo tháng", cot: cot(nhom === "ngay" ? "Ngày" : "Tháng"), dong: d.ky.map((r) => ({ ...r, nhan: tenKy(r.khoa, nhom === "ngay" ? "ngay" : "thang") })) });
    bangs.push({ ten: "Theo nhân viên", cot: cot("Nhân viên"), dong: d.nhanVien });
    bangs.push({ ten: "Theo chi nhánh", cot: cot("Chi nhánh"), dong: d.chiNhanh });
  } else if (tab === "dung-dich-vu") {
    const { nhom } = chonNhom(u.searchParams.get("nhom") ?? undefined, tu, den, "thang");
    const d = await layDungDichVu(db, tu, den, cn, nhom);
    const cot = (dau: string): Cot[] => [{ nhan: dau, khoa: "nhan", rong: 40 }, { nhan: "Tổng lượt", khoa: "tong_luot", so: true }, { nhan: "Dùng thẻ", khoa: "luot_the", so: true }, { nhan: "Trả tiền", khoa: "luot_tien", so: true },
      { nhan: "Doanh số (trả tiền)", khoa: "doanh_so", tien: true }, { nhan: "Giá trị buổi từ thẻ", khoa: "gia_tri_the", tien: true }];
    const them = <T extends { luot_the: number; luot_tien: number }>(ds: T[]) => ds.map((r) => ({ ...r, tong_luot: r.luot_the + r.luot_tien }));
    bangs.push({ ten: "Theo dịch vụ", cot: cot("Dịch vụ"), dong: them(d.dichVu) });
    bangs.push({ ten: "Theo nhân viên thực hiện", cot: cot("Nhân viên"), dong: them(d.nhanVien) });
    bangs.push({ ten: nhom === "ngay" ? "Theo ngày" : "Theo tháng", cot: cot(nhom === "ngay" ? "Ngày" : "Tháng"), dong: them(d.ky.map((r) => ({ ...r, nhan: tenKy(r.khoa, nhom === "ngay" ? "ngay" : "thang") }))) });
    bangs.push({ ten: "Theo chi nhánh", cot: cot("Chi nhánh"), dong: them(d.chiNhanh) });
  } else if (tab === "chi-nhanh") {
    const { ds, tong } = await layTheoChiNhanh(db, tu, den, cn);
    bangs.push({ ten: "Theo chi nhánh", dong: [...ds, { ten: "Tổng", soNhanVien: ds.reduce((s, r) => s + r.soNhanVien, 0), soDon: tong.soDon, daThu: tong.daThu, conNo: tong.conNo, doanhThu: tong.doanhThu, tmBan: tong.tmBan, tmNo: tong.tmNo, ckBan: tong.ckBan, ckNo: tong.ckNo }], cot: [
      { nhan: "Chi nhánh", khoa: "ten", rong: 30 }, { nhan: "Số nhân viên", khoa: "soNhanVien", so: true }, { nhan: "Số đơn hàng", khoa: "soDon", so: true }, { nhan: "Đã thu", khoa: "daThu", tien: true }, { nhan: "Còn nợ", khoa: "conNo", tien: true },
      { nhan: "Doanh thu", khoa: "doanhThu", tien: true }, { nhan: "Tiền mặt · bán hàng", khoa: "tmBan", tien: true }, { nhan: "Tiền mặt · thu nợ", khoa: "tmNo", tien: true },
      { nhan: "Quẹt thẻ và chuyển khoản · bán hàng", khoa: "ckBan", tien: true }, { nhan: "Quẹt thẻ và chuyển khoản · thu nợ", khoa: "ckNo", tien: true }] });
  } else if (tab === "khach-hang") {
    const xemSdt = coQuyen(nd, "khach.xem");
    const { rows } = await layTheoKhachHang(db, { tu, den, cn, nhom: u.searchParams.get("nk") || undefined, hang: u.searchParams.get("hang") || undefined, q: u.searchParams.get("q") || undefined }, true);
    bangs.push({ ten: "Theo khách hàng", dong: rows.map((r) => ({ ...r, dienThoai: xemSdt ? r.dienThoai : "", loai: `Hạng ${r.hang} · ${r.laMoi ? "Khách mới" : "Khách quay lại"}` })), cot: [
      { nhan: "Khách hàng", khoa: "ten", rong: 30 }, { nhan: "Mã khách", khoa: "ma", rong: 16 }, { nhan: "Điện thoại", khoa: "dienThoai", rong: 14 }, { nhan: "Loại khách", khoa: "loai", rong: 28 }, { nhan: "Số đơn hàng", khoa: "soDon", so: true },
      { nhan: "Doanh thu hóa đơn", khoa: "doanhThu", tien: true }, { nhan: "Tổng thực thu", khoa: "thucThu", tien: true }, { nhan: "Thu nợ cũ", khoa: "thuNo", tien: true }, { nhan: "Nợ mới", khoa: "noMoi", tien: true }] });
  } else if (tab === "lich-su-the") {
    const xemSdt = coQuyen(nd, "khach.xem");
    const { rows } = await layLichSuDungThe(db, { tu, den, cn, q: u.searchParams.get("q") || undefined, tenThe: u.searchParams.get("tt") || undefined, loai: u.searchParams.get("lt") || undefined }, true);
    bangs.push({ ten: "Lịch sử dùng thẻ", dong: rows.map((r) => ({ ...r, ngayGio: new Date(r.ngay).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }), dienThoai: xemSdt ? r.dienThoai : "", loaiVn: r.loai === "tien" ? "Thẻ tiền" : "Thẻ lần" })), cot: [
      { nhan: "Ngày", khoa: "ngayGio", rong: 20 }, { nhan: "Mã hóa đơn", khoa: "maHd", rong: 14 }, { nhan: "Khách hàng", khoa: "khach", rong: 28 }, { nhan: "Điện thoại", khoa: "dienThoai", rong: 14 }, { nhan: "Chi nhánh", khoa: "chiNhanh", rong: 18 },
      { nhan: "Tên thẻ", khoa: "tenThe", rong: 40 }, { nhan: "Mã thẻ", khoa: "maThe", rong: 12 }, { nhan: "Loại thẻ", khoa: "loaiVn", rong: 10 }, { nhan: "Số lần sử dụng", khoa: "soLan", so: true }, { nhan: "Tiền tương đương trừ thẻ", khoa: "tien", tien: true }] });
  } else if (tab === "nhan-vien") {
    const ds = await layNhanVienSh(db, tu, den, cn);
    bangs.push({ ten: "Theo nhân viên", dong: ds, cot: [
      { nhan: "Nhân viên", khoa: "ten", rong: 40 }, { nhan: "Số lần phục vụ", khoa: "soPhucVu", so: true }, { nhan: "Doanh số dịch vụ", khoa: "dsDichVu", tien: true }, { nhan: "Số sản phẩm đã bán", khoa: "soSanPham", so: true },
      { nhan: "Doanh số sản phẩm", khoa: "dsSanPham", tien: true }, { nhan: "Tổng số thẻ đã bán", khoa: "soThe", so: true }, { nhan: "Doanh số bán thẻ", khoa: "dsThe", tien: true },
      { nhan: "Số lần tư vấn", khoa: "soTuVan", so: true }, { nhan: "Doanh số tư vấn", khoa: "dsTuVan", tien: true }, { nhan: "Tổng doanh số", khoa: "tong", tien: true }] });
  } else if (tab === "dich-vu") {
    const loc1 = LOC_LOAI.find((l) => l.ma === (u.searchParams.get("loai") ?? "")) ?? LOC_LOAI[0];
    const lm = u.searchParams.get("lm");
    const ds = (await laySanPhamDichVu(db, tu, den, cn)).filter((r) => loc1.gom.includes(r.loai) && (!lm || r.loai === lm));
    bangs.push({ ten: "Theo dịch vụ, sản phẩm", dong: ds, cot: [
      { nhan: "Tên", khoa: "ten", rong: 48 }, { nhan: "Mã", khoa: "ma", rong: 16 }, { nhan: "Số lượng", khoa: "soLuong", so: true }, { nhan: "Trước giảm giá", khoa: "truoc", tien: true },
      { nhan: "Sau giảm giá", khoa: "sau", tien: true }, { nhan: "Trừ thẻ tiền", khoa: "truThe", tien: true }, { nhan: "Thực nhận", khoa: "thucNhan", tien: true }] });
  } else if (tab === "no" && u.searchParams.get("nt") === "tra") {
    const xemSdt = coQuyen(nd, "khach.xem");
    const { rows } = await layCacLanTraNo(db, { tu, den, cn, q: u.searchParams.get("q") || undefined }, true);
    bangs.push({ ten: "Các lần trả nợ", dong: rows.map((r) => ({ ...r, ngay: ngay(r.ngay), dienThoai: xemSdt ? r.dienThoai : "" })), cot: [
      { nhan: "Ngày trả nợ", khoa: "ngay", rong: 14 }, { nhan: "Khách hàng", khoa: "khach", rong: 28 }, { nhan: "Điện thoại", khoa: "dienThoai", rong: 14 }, { nhan: "Mã đơn hàng", khoa: "maHd", rong: 14 }, { nhan: "Chi nhánh", khoa: "chiNhanh", rong: 18 },
      { nhan: "Tổng số tiền hóa đơn", khoa: "tongHd", tien: true }, { nhan: "Số tiền trả", khoa: "soTien", tien: true }, { nhan: "Loại thanh toán", khoa: "phuongThuc", rong: 16 }, { nhan: "Người thu", khoa: "nguoiThu", rong: 24 }] });
  } else if (tab === "no") {
    const ds = await docHet((a, b) => {
      let q = db.from("hoa_don").select("id, ma, ngay_hd, tong_phai_thu, da_thu, con_no, khach_id").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd").order("id");
      if (cn) q = q.eq("chi_nhanh_id", cn);
      return q.range(a, b);
    });
    const ids = [...new Set(ds.map((d) => d.khach_id).filter(Boolean))] as string[];
    const ks: { id: string; ho_ten: string; dien_thoai: string | null }[] = [];
    for (let i = 0; i < ids.length; i += 300) ks.push(...((await db.from("khach_hang").select("id, ho_ten, dien_thoai").in("id", ids.slice(i, i + 300))).data ?? []));
    const k = new Map(ks.map((x) => [x.id, x]));
    bangs.push({ ten: "Khách còn nợ", dong: ds.map((r) => ({ ...r, khach: k.get(r.khach_id ?? "")?.ho_ten ?? "", dt: k.get(r.khach_id ?? "")?.dien_thoai ?? "", ngay_hd: ngay(r.ngay_hd) })), cot: [
      { nhan: "Khách", khoa: "khach", rong: 28 }, { nhan: "Điện thoại", khoa: "dt", rong: 14 }, { nhan: "Hoá đơn", khoa: "ma", rong: 16 }, { nhan: "Ngày", khoa: "ngay_hd", rong: 12 },
      { nhan: "Tổng", khoa: "tong_phai_thu", tien: true }, { nhan: "Đã thu", khoa: "da_thu", tien: true }, { nhan: "Còn nợ", khoa: "con_no", tien: true }] });
  } else if (tab === "the") {
    const { data } = await db.rpc("bc_the_con_du", { p_cn: (cn ?? undefined) as string });
    const t = data?.[0];
    bangs.push({ ten: "Thẻ còn dư", cot: [{ nhan: "Chỉ số", khoa: "nhan", rong: 44 }, { nhan: "Giá trị", khoa: "gia_tri", so: true }], dong: t ? [
      { nhan: "Số thẻ liệu trình còn buổi", gia_tri: Number(t.so_the_lan) }, { nhan: "Buổi khách đã trả tiền mà chưa làm", gia_tri: Number(t.so_buoi) },
      { nhan: "Giá trị buổi chưa làm (đồng)", gia_tri: Number(t.gia_tri_buoi) }, { nhan: "Thẻ không giới hạn buổi (không cộng ở trên)", gia_tri: Number(t.so_the_khong_gioi_han) },
      { nhan: "Số thẻ tiền còn dư", gia_tri: Number(t.so_the_tien) }, { nhan: "Số dư thẻ tiền (đồng)", gia_tri: Number(t.du_tien) }] : [] });
  } else if (tab === "hh-thuc-thu") {
    const gomThe = u.searchParams.get("the") === "1", vai = u.searchParams.get("vai") ?? undefined;
    const d = await layHoaHongThucThu(db, { tu, den, cn, vai, gomThe });
    bangs.push({ ten: "Theo nhân viên", dong: d.nhanVien.map((r) => ({ ten: r.ten, pv: r.theoVai.phuc_vu?.hoaHong ?? 0, tv: r.theoVai.tu_van?.hoaHong ?? 0, ban: r.theoVai.ban?.hoaHong ?? 0, ds: r.doanhSo, nocu: r.doanhSoNoCu, hh: r.hoaHong })), cot: [
      { nhan: "Nhân viên", khoa: "ten", rong: 34 }, { nhan: "Hoa hồng phục vụ", khoa: "pv", tien: true }, { nhan: "Hoa hồng tư vấn", khoa: "tv", tien: true }, { nhan: "Hoa hồng bán hàng", khoa: "ban", tien: true },
      { nhan: "Doanh số thực thu", khoa: "ds", tien: true }, { nhan: "Trong đó thu nợ cũ", khoa: "nocu", tien: true }, { nhan: "Hoa hồng", khoa: "hh", tien: true }] });
    bangs.push({ ten: "Theo vai", dong: d.theoVai.map((r) => ({ vai: NHAN_VAI_HH[r.vai], ds: r.doanhSo, hh: r.hoaHong })), cot: [{ nhan: "Vai", khoa: "vai", rong: 16 }, { nhan: "Doanh số thực thu", khoa: "ds", tien: true }, { nhan: "Hoa hồng", khoa: "hh", tien: true }] });
    bangs.push({ ten: "Theo chi nhánh", dong: d.chiNhanh.map((r) => ({ cn: r.ten, ds: r.doanhSo, hh: r.hoaHong })), cot: [{ nhan: "Chi nhánh", khoa: "cn", rong: 24 }, { nhan: "Doanh số thực thu", khoa: "ds", tien: true }, { nhan: "Hoa hồng", khoa: "hh", tien: true }] });
    const dc = dongDoiChieu(d.doiChieu, gomThe);
    bangs.push({ ten: "Đối chiếu theo hoá đơn", dong: [...dc.rows.map((r) => ({ nhan: r.nhan, so: r.so, gc: r.ghiChu })), { nhan: "Hoa hồng theo thực thu (cả ba vai)", so: dc.ket, gc: "" }], cot: [{ nhan: "Khoản", khoa: "nhan", rong: 52 }, { nhan: "Số tiền", khoa: "so", tien: true }, { nhan: "Giải thích", khoa: "gc", rong: 52 }] });
  } else if (tab === "hh-gioi-thieu") {
    const d = await layHoaHongGioiThieu(db, { tu, den, cn, xemSdt: coQuyen(nd, "khach.xem") });
    bangs.push({ ten: "Khách giới thiệu", dong: d.khach, cot: [{ nhan: "Người giới thiệu", khoa: "ten", rong: 30 }, { nhan: "Mã khách", khoa: "ma", rong: 14 }, { nhan: "Điện thoại", khoa: "dt", rong: 14 }, { nhan: "Hoá đơn", khoa: "soHd", so: true }, { nhan: "Doanh số", khoa: "doanhSo", tien: true }, { nhan: "Hoa hồng", khoa: "hoaHong", tien: true }] });
    bangs.push({ ten: "Số SalonHero đã tính", dong: d.sh, cot: [{ nhan: "Người giới thiệu", khoa: "ten", rong: 34 }, { nhan: "Mã nhân viên", khoa: "ma", rong: 14 }, { nhan: "Hoá đơn", khoa: "soHd", so: true }, { nhan: "Doanh số dòng", khoa: "doanhSo", tien: true }, { nhan: "Hoa hồng SalonHero", khoa: "hoaHong", tien: true }] });
  } else {
    return new Response("Không có báo cáo này", { status: 404 });
  }

  return phanHoiExcel(db, nd, bangs, { tenTep: `bao-cao-${tab}-${tu}-${den}`, doiTuong: "bao_cao", chiTiet: { tab, tu, den, chi_nhanh_id: cn ?? null } });
}

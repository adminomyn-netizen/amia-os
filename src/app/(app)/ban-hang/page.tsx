import { coQuyen, duocTruBuoiTrucTiep } from "@/lib/quyen";
import { yeuCauQuyen } from "@/lib/auth";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { ShoppingBag } from "lucide-react";
import { Pos } from "@/components/ban-hang/Pos";
import { gtGoiY, hienThuNgan, nhomNguonGt, type DongDon, type MucBan, type NguonGt, type SuaHoaDon, type TaiKhoanNhan } from "@/lib/ban-hang";
import { thucHienBuoi } from "../the/actions";
import { chotDonBanHang, dsDonCho, dsDonNhap, dsVoucher, layDiemKhach, layTheKhach, layTheTien, layVoucher, luuDonNhap, timKhach, xoaDonNhap, xoaDonCho, boSuaHoaDon } from "./actions";

import { nhanNguon } from "@/lib/lich-hen";
import { docNhomLich } from "@/lib/lich-hen-nhom-may-chu";
import { homNayHCM } from "@/lib/dinh-dang";

export default async function TrangBanHang({ searchParams }: { searchParams: Promise<{ khach?: string; lich?: string; sua?: string }> }) {
  const nd = await yeuCauQuyen("ban.tao");
  const { khach: khachId, lich: lichId, sua: suaId } = await searchParams;
  const db = sb();
  // Đếm "Chờ thanh toán" như SalonHero (đơn đang xử lý, chưa thanh toán): đơn nháp của mọi thu ngân trong chi nhánh + hoá đơn đã mở lại để sửa.
  let qNo = db.from("don_nhap").select("id", { count: "exact", head: true });
  let qSua = db.from("hoa_don").select("id", { count: "exact", head: true }).eq("trang_thai", "nhap").not("mo_lai_luc", "is", null).eq("la_lich_su", false);
  if (nd.chiNhanhId) { qNo = qNo.eq("chi_nhanh_id", nd.chiNhanhId); qSua = qSua.eq("chi_nhanh_id", nd.chiNhanhId); }
  // Mọi truy vấn không phụ thuộc nhau chạy CÙNG LÚC (trước đây xếp hàng nối đuôi): đếm chờ thanh toán, danh mục, ngân hàng nhận, đơn nháp.
  let qTk = db.from("tai_khoan_ngan_hang").select("id, ngan_hang, chu_tai_khoan, so_tai_khoan, chi_nhanh_id, dung_chuyen_khoan, dung_quet_the, mac_dinh").eq("hoat_dong", true).order("tao_luc");
  if (nd.chiNhanhId) qTk = qTk.or(`chi_nhanh_id.is.null,chi_nhanh_id.eq.${nd.chiNhanhId}`);
  const [{ count: demNo }, { count: demSua }, { data: dv }, { data: nhomDv }, { data: goi }, { data: sp }, { data: nv }, { data: cn }, { data: dsTk }, nhapBanDau, { data: gt }, { data: goiDv }] = await Promise.all([
    qNo, qSua,
    db.from("dich_vu").select("id, ma, ten, gia, nhom_id, vat_pct, tao_luc, noi_hien_thi, chi_nhanh_ids, cho_sua_gia").eq("hoat_dong", true).order("ten"),
    db.from("dich_vu_nhom").select("id, ten"),
    db.from("goi_the").select("id, ma, ten, gia, loai, so_buoi, tao_luc, noi_hien_thi, cho_sua_gia").eq("hoat_dong", true).order("ten"),
    db.from("san_pham").select("id, ma, ma_vach, ten, gia_ban, nhom, tao_luc, noi_hien_thi, cho_sua_gia").eq("hoat_dong", true).eq("ban_le", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id").eq("hoat_dong", true).order("ho_ten"),
    dsChiNhanhRutGon(),
    qTk,
    dsDonNhap(),
    db.from("doi_tac_gt").select("id, ma, ma_gioi_thieu, ten, loai, loai_sh, hh_kieu, hh_gia_tri").eq("hoat_dong", true).order("ten"),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id").limit(5000),
  ]);
  const { data: hhMuc } = await db.from("doi_tac_hh_muc").select("doi_tac_id, loai, muc_id, kieu, gia_tri").limit(20000);
  const mucCuaNguon = new Map<string, Record<string, { kieu: "phan_tram" | "tien"; giaTri: number }>>();
  for (const r of hhMuc ?? []) { const m = mucCuaNguon.get(r.doi_tac_id) ?? {}; m[`${r.loai}:${r.muc_id}`] = { kieu: r.kieu === "tien" ? "tien" : "phan_tram", giaTri: Number(r.gia_tri) }; mucCuaNguon.set(r.doi_tac_id, m); }
  const dvCuaGoi = new Map<string, string[]>();
  for (const l of goiDv ?? []) dvCuaGoi.set(l.goi_id, [...(dvCuaGoi.get(l.goi_id) ?? []), l.dich_vu_id]);
  const choThanhToan = (demNo ?? 0) + (demSua ?? 0);
  // Nguồn giới thiệu cho ô "Người giới thiệu" từng dòng (mức hoa hồng mặc định theo nguồn; theo điểm không phải tiền nên mặc định 0%).
  const nguonGt: NguonGt[] = (gt ?? []).map((g) => ({ id: g.id, ten: g.ten, ma: g.ma_gioi_thieu ?? g.ma, nhom: nhomNguonGt(g.loai, g.loai_sh), kieu: g.hh_kieu === "tien" ? "tien" : "phan_tram", giaTri: g.hh_kieu === "diem" ? 0 : Number(g.hh_gia_tri), ...(mucCuaNguon.has(g.id) ? { muc: mucCuaNguon.get(g.id) } : {}) }));
  const tenNhom = new Map((nhomDv ?? []).map((n) => [n.id, n.ten]));
  // "Nơi hiển thị" + "Địa điểm cung cấp" (Danh mục): chỉ ẨN khỏi ô chọn mục; vẫn giữ trong danh sách để dòng cũ (lịch hẹn, đơn nháp) còn tên và giá.
  const anTN = (noi: string) => !hienThuNgan(noi);
  const muc: MucBan[] = [
    ...(dv ?? []).map((d) => ({ loai: "dich_vu" as const, id: d.id, ten: d.ten, gia: d.gia, nhom: tenNhom.get(d.nhom_id) ?? "Khác", tao: d.tao_luc, ma: d.ma, anThuNgan: anTN(d.noi_hien_thi), chiNhanhIds: d.chi_nhanh_ids, choSuaGia: d.cho_sua_gia })),
    ...(goi ?? []).map((g) => ({ loai: "goi_the" as const, id: g.id, ten: g.ten, gia: g.gia, nhom: g.loai === "lan" ? "Liệu trình" : "Thẻ tiền", tao: g.tao_luc, ma: g.ma, anThuNgan: anTN(g.noi_hien_thi), choSuaGia: g.cho_sua_gia, dichVu: dvCuaGoi.get(g.id) ?? [] })),
    ...(sp ?? []).map((s) => ({ loai: "san_pham" as const, id: s.id, ten: s.ten, gia: s.gia_ban, nhom: s.nhom ?? "Sản phẩm", tao: s.tao_luc, ma: s.ma, maVach: s.ma_vach ?? undefined, anThuNgan: anTN(s.noi_hien_thi), choSuaGia: s.cho_sua_gia })),
  ];
  type K = { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string; chi_nhanh_id: string; doi_tac_id: string | null };
  let khach: K | null = null;
  if (khachId) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id, doi_tac_id").eq("id", khachId).maybeSingle()).data;
  let dongBanDau: DongDon[] = [];
  let lichDung: string | null = null;
  let cnLich: string | null = null;
  let nguonLich = "";
  let viTriLich = "";
  let soKhachLich = 1;
  let gtLich: string | null = null;
  if (lichId) {
    const { data: l } = await db.from("lich_hen").select("id, khach_id, nhan_vien_id, chi_nhanh_id, nguon, phong, doi_tac_id").eq("id", lichId).maybeSingle();
    if (l && (!nd.chiNhanhId || l.chi_nhanh_id === nd.chiNhanhId)) {
      lichDung = l.id; cnLich = l.chi_nhanh_id; nguonLich = nhanNguon(l.nguon); viTriLich = l.phong ?? "";
      if (!khach) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id, doi_tac_id").eq("id", l.khach_id).maybeSingle()).data;
      const { data: ld } = await db.from("lich_hen_dich_vu").select("dich_vu_id, so_luong").eq("lich_id", l.id);
      dongBanDau = (ld ?? []).filter((x) => muc.some((m) => m.loai === "dich_vu" && m.id === x.dich_vu_id)).map((x) => ({
        loai: "dich_vu", ref: x.dich_vu_id, sl: x.so_luong, giam: 0,
        nv: { phuc_vu: l.nhan_vien_id ? [{ id: l.nhan_vien_id, ti: 100 }] : [], tu_van: [], ban: khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [] },
      }));
      gtLich = l.doi_tac_id;
      // Lịch nhiều khách (Khách 2, 3… ở lich_hen_khach): gom dịch vụ của CẢ NHÓM vào MỘT hoá đơn của khách chính như SalonHero createOrderBooking;
      // mỗi dòng giữ người thực hiện của khách đó; số khách của hoá đơn = số người trong nhóm.
      const nhom = await docNhomLich(l.id);
      soKhachLich = Math.max(1, nhom.length);
      for (const tv of nhom.filter((x) => !x.laKhachChinh)) {
        const dem = new Map<string, number>();
        for (const d of tv.dichVuIds) if (muc.some((m) => m.loai === "dich_vu" && m.id === d)) dem.set(d, (dem.get(d) ?? 0) + 1);
        for (const [d, sl] of dem) dongBanDau.push({ loai: "dich_vu", ref: d, sl, giam: 0, nv: { phuc_vu: tv.nhanVienId ? [{ id: tv.nhanVienId, ti: 100 }] : [], tu_van: [], ban: khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [] } });
      }
    }
  }
  // Sửa hoá đơn đã chốt (?sua=): chỉ hoá đơn đã được mở lại về nháp (mo_lai_hoa_don); dòng hàng + người hưởng + phần đầu đơn điền sẵn từ hoá đơn cũ.
  // Đơn giá cũ chỉ giữ khi mục bật "Sửa giá khi thanh toán"; không thì lấy giá danh mục hiện tại (máy chủ cũng chỉ nhận giá danh mục).
  let suaHd: SuaHoaDon | null = null;
  if (suaId && /^[0-9a-f-]{36}$/i.test(suaId)) {
    const { data: hs } = await db.from("hoa_don").select("id, ma, chi_nhanh_id, khach_id, lich_hen_id, trang_thai, mo_lai_luc, la_lich_su, ngay_hd, giam_gia_don, vat_pct, phu_phi, tip, ghi_chu, gio_vao, gio_ra, so_khach").eq("id", suaId).maybeSingle();
    if (hs && hs.trang_thai === "nhap" && hs.mo_lai_luc && !hs.la_lich_su && (!nd.chiNhanhId || hs.chi_nhanh_id === nd.chiNhanhId)) {
      const [{ data: dd }, { data: kh }] = await Promise.all([
        db.from("hoa_don_dong").select("id, loai, dich_vu_id, goi_id, san_pham_id, so_luong, don_gia, giam_gia, tao_luc, ghi_chu, gt_doi_tac_id, gt_kieu, gt_gia_tri, dong_nhan_vien(nhan_vien_id, vai, ti_le)").eq("hoa_don_id", hs.id).order("tao_luc"),
        hs.khach_id ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id, doi_tac_id").eq("id", hs.khach_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const gioHHMM = (t: string | null) => (t ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }) : "");
      suaHd = { id: hs.id, ma: hs.ma, ngayHd: hs.ngay_hd, giamDon: Number(hs.giam_gia_don), vatPct: Number(hs.vat_pct), phuPhi: Number(hs.phu_phi), tip: Number(hs.tip), ghiChu: hs.ghi_chu ?? "", gioVao: gioHHMM(hs.gio_vao), gioRa: gioHHMM(hs.gio_ra), soKhach: hs.so_khach ?? 1 };
      khach = kh; lichDung = hs.lich_hen_id; cnLich = hs.chi_nhanh_id;
      dongBanDau = (dd ?? []).flatMap((d) => {
        const ref = d.dich_vu_id ?? d.goi_id ?? d.san_pham_id;
        const m = muc.find((x) => x.loai === d.loai && x.id === ref);
        if (!ref || !m) return [];
        const nvDong = (d.dong_nhan_vien ?? []) as { nhan_vien_id: string; vai: string; ti_le: number }[];
        const nvVai = (vai: string) => nvDong.filter((x) => x.vai === vai).map((x) => ({ id: x.nhan_vien_id, ti: Number(x.ti_le) }));
        return [{ loai: d.loai as DongDon["loai"], ref, sl: d.so_luong, giam: Number(d.giam_gia), nv: { phuc_vu: nvVai("phuc_vu"), tu_van: nvVai("tu_van"), ban: nvVai("ban") }, ...(m.choSuaGia && Number(d.don_gia) !== m.gia ? { gia: Number(d.don_gia) } : {}),
          ...(d.ghi_chu ? { ghiChu: d.ghi_chu } : {}), ...(d.gt_doi_tac_id && (d.gt_kieu === "phan_tram" || d.gt_kieu === "tien") ? { gt: { id: d.gt_doi_tac_id, kieu: d.gt_kieu as "phan_tram" | "tien", giaTri: Number(d.gt_gia_tri ?? 0) } } : {}) }];
      });
    }
  }
  // Gợi ý người giới thiệu (M4): đơn mới từ lịch hẹn / khách có nguồn giới thiệu (đặt qua link REF) → mọi dòng chưa có người giới thiệu mang nguồn đó
  // với mức riêng theo mục hoặc mức chung; thu ngân thấy ở dòng "Người giới thiệu" và sửa / bỏ được. Không áp cho hoá đơn đang sửa.
  if (!suaHd) {
    const goiY = gtLich ?? khach?.doi_tac_id ?? null;
    if (goiY) dongBanDau = dongBanDau.map((x) => (x.gt ? x : { ...x, gt: gtGoiY(nguonGt, goiY, x.loai, x.ref) }));
  }
  // Khoá ở máy chủ: người gắn chi nhánh không mở được khách chi nhánh khác qua ?khach=; không có quyền xem SĐT thì không đưa số xuống trình duyệt.
  if (khach && nd.chiNhanhId && khach.chi_nhanh_id !== nd.chiNhanhId) khach = null;
  if (khach && !coQuyen(nd, "khach.sdt")) khach = { ...khach, dien_thoai: "" };
  // Ngân hàng nhận tiền cho khoản chuyển khoản / quẹt thẻ: tài khoản đang hoạt động (Cài đặt › Ngân hàng); người gắn chi nhánh chỉ nhận tài khoản chung và của chi nhánh mình.
  const taiKhoanNhan: TaiKhoanNhan[] = (dsTk ?? []).map((x) => ({ ten: x.ngan_hang, chiNhanhId: x.chi_nhanh_id, cx: x.dung_chuyen_khoan, qt: x.dung_quet_the, macDinh: x.mac_dinh, id: x.id, chu: x.chu_tai_khoan, so: x.so_tai_khoan.replace(/\D/g, "") }));
  // Chi nhánh của đơn: người có chi nhánh cố định thì khoá theo đó; người xem mọi chi nhánh thì lấy theo lịch hẹn, rồi theo khách; không đoán, để trống bắt chọn.
  // Không bao giờ để trống "Chi nhánh bán" (chị Lâm 11/11/2026): chỉ còn một chi nhánh hoạt động (Vinh) thì chọn sẵn chi nhánh đó;
  // nhiều chi nhánh thì trình duyệt lấy chi nhánh người dùng chọn lần trước.
  const chiNhanhId = nd.chiNhanhId ?? cnLich ?? khach?.chi_nhanh_id ?? ((cn ?? []).length === 1 ? cn![0].id : "");
  return (
    <>
      {/* Điện thoại: đầu trang đã ghi "POS / Bán hàng", bỏ khối tiêu đề lớn để danh mục lên sớm. */}
      <div className="max-lg:hidden"><TieuDeNoi tieuDe="Bán hàng" icon={ShoppingBag} phu="Mở nhiều đơn cùng lúc, chọn khách, thêm dịch vụ, thẻ hoặc sản phẩm, đổi điểm thưởng, ghi người hưởng, thu tiền rồi chốt đơn." /></div>
      <Pos nguoiId={nd.userId} muc={muc} nhanVien={(nv ?? []).map((n) => ({ id: n.id, ten: n.ho_ten, vaiTro: n.vai_tro }))} khachBanDau={khach} choThanhToan={choThanhToan} denNgay={homNayHCM()} dongBanDau={dongBanDau} chiNhanhId={chiNhanhId} chiNhanh={cn ?? []} khoaChiNhanh={!!nd.chiNhanhId} choGiam={coQuyen(nd, "ban.giamgia")} choTip={coQuyen(nd, "ban.tip")} lichId={lichDung} soKhachLich={suaHd ? undefined : soKhachLich} thuNgan={nd.hoTen} nguonLich={nguonLich} viTriLich={viTriLich} taiKhoanNhan={taiKhoanNhan}
        tim={timKhach} layThe={layTheTien} layDiem={layDiemKhach} layTheKh={layTheKhach} chot={chotDonBanHang} buoi={thucHienBuoi} truBuoiTrucTiep={duocTruBuoiTrucTiep(nd)} voucher={layVoucher} dsVoucher={dsVoucher} luuNhap={luuDonNhap} dsNhap={dsDonNhap} dsCho={dsDonCho} nguonGt={nguonGt} taoMoi={coQuyen(nd, "danhmuc.sua")} xoaNhap={xoaDonNhap} xoaCho={xoaDonCho} boSua={boSuaHoaDon} nhapBanDau={nhapBanDau} suaHd={suaHd} />
    </>
  );
}

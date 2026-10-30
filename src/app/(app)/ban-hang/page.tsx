import { coQuyen } from "@/lib/quyen";
import { yeuCauQuyen } from "@/lib/auth";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Pos } from "@/components/ban-hang/Pos";
import type { DongDon, MucBan, TaiKhoanNhan } from "@/lib/ban-hang";
import { chotDonBanHang, dsVoucher, layDiemKhach, layTheKhach, layTheTien, layVoucher, timKhach } from "./actions";

import { nhanNguon } from "@/lib/lich-hen";
import { homNayHCM } from "@/lib/dinh-dang";

export default async function TrangBanHang({ searchParams }: { searchParams: Promise<{ khach?: string; lich?: string }> }) {
  const nd = await yeuCauQuyen("ban.tao");
  const { khach: khachId, lich: lichId } = await searchParams;
  const db = sb();
  // Đếm "Chờ thanh toán" như SalonHero: hoá đơn đã chốt còn nợ. Cùng luật xem với trang Hoá đơn (khoá chi nhánh; không có quyền toàn cơ sở thì chỉ đơn mình lập).
  let qNo = db.from("hoa_don").select("id", { count: "exact", head: true }).eq("trang_thai", "hoan_thanh").gt("con_no", 0);
  if (nd.chiNhanhId) qNo = qNo.eq("chi_nhanh_id", nd.chiNhanhId);
  if (!coQuyen(nd, "ban.toan_co_so")) qNo = qNo.eq("nguoi_lap_id", nd.nhanVienId ?? "");
  const choThanhToan = coQuyen(nd, "ban.xem") ? (await qNo).count ?? 0 : null;
  const [{ data: dv }, { data: nhomDv }, { data: goi }, { data: sp }, { data: nv }, { data: cn }] = await Promise.all([
    db.from("dich_vu").select("id, ten, gia, nhom_id, vat_pct").eq("hoat_dong", true).order("ten"),
    db.from("dich_vu_nhom").select("id, ten"),
    db.from("goi_the").select("id, ten, gia, loai, so_buoi").eq("hoat_dong", true).order("ten"),
    db.from("san_pham").select("id, ten, gia_ban, nhom").eq("hoat_dong", true).eq("ban_le", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id").eq("hoat_dong", true).order("ho_ten"),
    dsChiNhanhRutGon(),
  ]);
  const tenNhom = new Map((nhomDv ?? []).map((n) => [n.id, n.ten]));
  const muc: MucBan[] = [
    ...(dv ?? []).map((d) => ({ loai: "dich_vu" as const, id: d.id, ten: d.ten, gia: d.gia, nhom: tenNhom.get(d.nhom_id) ?? "Khác" })),
    ...(goi ?? []).map((g) => ({ loai: "goi_the" as const, id: g.id, ten: g.ten, gia: g.gia, nhom: g.loai === "lan" ? "Liệu trình" : "Thẻ tiền" })),
    ...(sp ?? []).map((s) => ({ loai: "san_pham" as const, id: s.id, ten: s.ten, gia: s.gia_ban, nhom: s.nhom ?? "Sản phẩm" })),
  ];
  type K = { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string; chi_nhanh_id: string };
  let khach: K | null = null;
  if (khachId) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id").eq("id", khachId).maybeSingle()).data;
  let dongBanDau: DongDon[] = [];
  let lichDung: string | null = null;
  let cnLich: string | null = null;
  let nguonLich = "";
  if (lichId) {
    const { data: l } = await db.from("lich_hen").select("id, khach_id, nhan_vien_id, chi_nhanh_id, nguon").eq("id", lichId).maybeSingle();
    if (l && (!nd.chiNhanhId || l.chi_nhanh_id === nd.chiNhanhId)) {
      lichDung = l.id; cnLich = l.chi_nhanh_id; nguonLich = nhanNguon(l.nguon);
      if (!khach) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id").eq("id", l.khach_id).maybeSingle()).data;
      const { data: ld } = await db.from("lich_hen_dich_vu").select("dich_vu_id, so_luong").eq("lich_id", l.id);
      dongBanDau = (ld ?? []).filter((x) => muc.some((m) => m.loai === "dich_vu" && m.id === x.dich_vu_id)).map((x) => ({
        loai: "dich_vu", ref: x.dich_vu_id, sl: x.so_luong, giam: 0,
        nv: { phuc_vu: l.nhan_vien_id ? [{ id: l.nhan_vien_id, ti: 100 }] : [], tu_van: [], ban: khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [] },
      }));
    }
  }
  // Khoá ở máy chủ: người gắn chi nhánh không mở được khách chi nhánh khác qua ?khach=; không có quyền xem SĐT thì không đưa số xuống trình duyệt.
  if (khach && nd.chiNhanhId && khach.chi_nhanh_id !== nd.chiNhanhId) khach = null;
  if (khach && !coQuyen(nd, "khach.sdt")) khach = { ...khach, dien_thoai: "" };
  // Ngân hàng nhận tiền cho khoản chuyển khoản / quẹt thẻ: tài khoản đang hoạt động (Cài đặt › Ngân hàng); người gắn chi nhánh chỉ nhận tài khoản chung và của chi nhánh mình.
  let qTk = db.from("tai_khoan_ngan_hang").select("ngan_hang, chi_nhanh_id, dung_chuyen_khoan, dung_quet_the, mac_dinh").eq("hoat_dong", true);
  if (nd.chiNhanhId) qTk = qTk.or(`chi_nhanh_id.is.null,chi_nhanh_id.eq.${nd.chiNhanhId}`);
  const taiKhoanNhan: TaiKhoanNhan[] = ((await qTk).data ?? []).map((x) => ({ ten: x.ngan_hang, chiNhanhId: x.chi_nhanh_id, cx: x.dung_chuyen_khoan, qt: x.dung_quet_the, macDinh: x.mac_dinh }));
  // Chi nhánh của đơn: người có chi nhánh cố định thì khoá theo đó; người xem mọi chi nhánh thì lấy theo lịch hẹn, rồi theo khách; không đoán, để trống bắt chọn.
  const chiNhanhId = nd.chiNhanhId ?? cnLich ?? khach?.chi_nhanh_id ?? "";
  return (
    <>
      <TieuDeTrang tieuDe="Bán hàng" phu="Mở nhiều đơn cùng lúc, chọn khách, thêm dịch vụ, thẻ hoặc sản phẩm, đổi điểm thưởng, ghi người hưởng, thu tiền rồi chốt đơn." />
      <Pos muc={muc} nhanVien={(nv ?? []).map((n) => ({ id: n.id, ten: n.ho_ten, vaiTro: n.vai_tro }))} khachBanDau={khach} choThanhToan={choThanhToan} denNgay={homNayHCM()} dongBanDau={dongBanDau} chiNhanhId={chiNhanhId} chiNhanh={cn ?? []} khoaChiNhanh={!!nd.chiNhanhId} choGiam={coQuyen(nd, "ban.giamgia")} choTip={coQuyen(nd, "ban.tip")} lichId={lichDung} thuNgan={nd.hoTen} nguonLich={nguonLich} taiKhoanNhan={taiKhoanNhan}
        tim={timKhach} layThe={layTheTien} layDiem={layDiemKhach} layTheKh={layTheKhach} chot={chotDonBanHang} voucher={layVoucher} dsVoucher={dsVoucher} />
    </>
  );
}

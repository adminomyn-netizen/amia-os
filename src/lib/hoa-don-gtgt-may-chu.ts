import "server-only";
// Đọc dữ liệu để dựng MẪU HOÁ ĐƠN GTGT của một hoá đơn bán (đợt 4). Phạm vi xem đi qua layHoaDonTheoIds (chi nhánh + quyền xem toàn cơ sở) như trang Hoá đơn điện tử.
import { sb } from "@/lib/db";
import type { NguoiDung } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { homNayHCM } from "@/lib/dinh-dang";
import { layHoaDonTheoIds } from "@/lib/hoa-don-dien-tu-truy-van";
import { tenHangXuat } from "@/lib/hoa-don-dien-tu-xuat";
import { dungNoiDung, hinhThucTuThu, nguoiMuaTuKhach, thueSuatHoaDon, type NguoiBan, type NguoiMua, type NoiDungGtgt, type LoaiNguoiMua } from "@/lib/hoa-don-gtgt";

type Nd = Pick<NguoiDung, "chiNhanhId" | "nhanVienId" | "quyen" | "vaiTro">;
export type NguoiBanCaiDat = { chi_nhanh_id: string; ten_don_vi: string | null; ma_so_thue: string | null; dia_chi: string | null; dien_thoai: string | null; email: string | null; so_tai_khoan: string | null; ngan_hang: string | null; mau_so: string; ky_hieu: string | null; thue_suat: string };
export type HoaDonGtgtDaXuat = { id: string; hoa_don_id: string | null; ma_hoa_don: string; trang_thai: string; mau_so: string; ky_hieu: string; so: number; ngay_lap: string; nguoi_ban: NguoiBan; noi_dung: NoiDungGtgt; xml: string | null; ma_so_thue_ban: string; xuat_luc: string; huy_luc: string | null; ly_do_huy: string | null };

export async function docNguoiBan(chiNhanhId: string): Promise<NguoiBanCaiDat | null> {
  const { data } = await sb().from("hddt_nguoi_ban").select("*").eq("chi_nhanh_id", chiNhanhId).maybeSingle();
  return (data as NguoiBanCaiDat | null) ?? null;
}
export const nguoiBanTuCaiDat = (b: NguoiBanCaiDat | null): NguoiBan => ({ ten: b?.ten_don_vi ?? "", mst: b?.ma_so_thue ?? "", dia_chi: b?.dia_chi ?? "", dien_thoai: b?.dien_thoai, email: b?.email, so_tai_khoan: b?.so_tai_khoan, ngan_hang: b?.ngan_hang });

/** Mọi thứ cần để xem / xuất mẫu hoá đơn GTGT của một hoá đơn bán. null = không có hoặc ngoài phạm vi người này được xem. */
export async function layDuLieuGtgt(nd: Nd, hoaDonId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(hoaDonId)) return null;
  const { dong: [goc] } = await layHoaDonTheoIds(nd, [hoaDonId.toLowerCase()]);
  if (!goc) return null;
  const db = sb();
  const [{ data: h }, { data: dong }, { data: nhap }, { data: tc }, { data: tt }, { data: daXuat }, { data: cn }] = await Promise.all([
    db.from("hoa_don").select("id, ma, ngay_hd, chi_nhanh_id, khach_id, trang_thai, vat_pct, vat_tien, giam_gia_don, giam_voucher, giam_diem, phu_phi, tip, tong_phai_thu, tien_tru_the, vat_hd_so, vat_hd_ky_hieu, vat_hd_luc").eq("id", goc.id).single(),
    db.from("hoa_don_dong").select("id, ten, loai, so_luong, don_gia, giam_gia, thanh_tien, san_pham_id").eq("hoa_don_id", goc.id).order("tao_luc").order("id"),
    db.from("hoa_don_gtgt_nhap").select("*").eq("hoa_don_id", goc.id).maybeSingle(),
    db.from("hoa_don_xuat_tuy_chinh").select("ten_nguoi_mua, ma_so_thue, dia_chi").eq("hoa_don_id", goc.id).maybeSingle(),
    db.from("thanh_toan").select("phuong_thuc, loai").eq("hoa_don_id", goc.id),
    db.from("hoa_don_gtgt").select("*").eq("hoa_don_id", goc.id).order("xuat_luc", { ascending: false }),
    db.from("chi_nhanh").select("ten").eq("id", goc.chi_nhanh_id).maybeSingle(),
  ]);
  if (!h) return null;
  const idsDong = (dong ?? []).map((d) => d.id), idsSp = [...new Set((dong ?? []).map((d) => d.san_pham_id).filter(Boolean))] as string[];
  const [{ data: k }, { data: sua }, { data: sp }, nguoiBanCd] = await Promise.all([
    h.khach_id ? db.from("khach_hang").select("ho_ten, cong_ty, ma_so_thue, dia_chi, dien_thoai, email").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    idsDong.length ? db.from("hoa_don_xuat_dong").select("hoa_don_dong_id, ten_xuat").in("hoa_don_dong_id", idsDong) : Promise.resolve({ data: [] }),
    idsSp.length ? db.from("san_pham").select("id, don_vi").in("id", idsSp) : Promise.resolve({ data: [] }),
    docNguoiBan(h.chi_nhanh_id),
  ]);
  // Số điện thoại / email khách chỉ điền sẵn khi người này được xem (cùng luật màn Khách hàng).
  const khach = k ? { ...k, dien_thoai: coQuyen(nd, "khach.sdt") ? k.dien_thoai : null, email: coQuyen(nd, "khach.email") ? k.email : null } : null;
  const macDinh = nguoiMuaTuKhach(khach, tc);
  const nguoiMua: NguoiMua = nhap ? {
    loai: nhap.loai_nguoi_mua as LoaiNguoiMua, ten_don_vi: nhap.ten_don_vi ?? "", mst: nhap.ma_so_thue ?? "", cccd: nhap.cccd ?? "", dia_chi: nhap.dia_chi ?? "",
    ho_ten: nhap.ho_ten_nguoi_mua ?? "", dien_thoai: nhap.dien_thoai ?? "", email: nhap.email ?? "",
  } : macDinh;
  const tenSua = new Map((sua ?? []).map((x) => [x.hoa_don_dong_id, x.ten_xuat]));
  const dvt = new Map((sp ?? []).map((x) => [x.id, x.don_vi]));
  const dongNguon = (dong ?? []).map((d) => ({ ...d, ten: tenHangXuat(d, tenSua), dvt: d.san_pham_id ? dvt.get(d.san_pham_id) ?? null : null }));
  const thueSuat = thueSuatHoaDon(h, nhap?.thue_suat, nguoiBanCd?.thue_suat ?? "10");
  const hinhThuc = nhap?.hinh_thuc_tt || hinhThucTuThu((tt ?? []).filter((x) => x.loai === "thu").map((x) => x.phuong_thuc));
  const noiDung = dungNoiDung(h, dongNguon, { nguoiMua, thueSuat, hinhThuc, ghiChu: nhap?.ghi_chu ?? "" });
  const ds = (daXuat ?? []) as unknown as HoaDonGtgtDaXuat[];
  return {
    hd: h, tenChiNhanh: cn?.ten ?? "", nguoiBanCd, nguoiBan: nguoiBanTuCaiDat(nguoiBanCd), nguoiMua, coNhap: !!nhap, thueSuat, hinhThuc, noiDung,
    dangXuat: ds.find((x) => x.trang_thai === "da_xuat") ?? null, daHuy: ds.filter((x) => x.trang_thai === "da_huy"),
    ghiSoTay: !!(h.vat_hd_so || h.vat_hd_luc) && !ds.some((x) => x.trang_thai === "da_xuat"), homNay: homNayHCM(),
  };
}

/** Đơn này có hoá đơn GTGT ĐANG XUẤT lập trong app không (để trang ghi số tay không gỡ/sửa lén số do app cấp). */
export async function coGtgtDangXuat(hoaDonId: string): Promise<boolean> {
  const { count } = await sb().from("hoa_don_gtgt").select("id", { count: "exact", head: true }).eq("hoa_don_id", hoaDonId).eq("trang_thai", "da_xuat");
  return (count ?? 0) > 0;
}

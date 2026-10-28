import "server-only";
import { sb } from "@/lib/db";
import { coQuyen } from "@/lib/quyen";
import type { NguoiDung } from "@/lib/auth";
import { giayToConThieu, tyLeDienHoSo } from "@/lib/ho-so";

export const KHO_HO_SO = "ho-so-nhan-vien";

/** Quyền với hồ sơ của một nhân viên: người có "hr.hoso" xem và sửa mọi hồ sơ (trong chi nhánh mình nếu bị giới hạn chi nhánh); mọi người xem và tự bổ sung hồ sơ CỦA CHÍNH MÌNH.
 *  Không ai khác đọc được CCCD, thuế, BHXH, tài khoản ngân hàng của người khác. */
export async function quyenHoSo(nd: NguoiDung, nhanVienId: string): Promise<{ xem: boolean; quanTri: boolean; chinhChu: boolean }> {
  const chinhChu = nd.nhanVienId === nhanVienId;
  if (coQuyen(nd, "hr.hoso")) {
    if (nd.chiNhanhId && !chinhChu) {
      const { data } = await sb().from("nhan_vien").select("chi_nhanh_id").eq("id", nhanVienId).maybeSingle();
      if (!data || data.chi_nhanh_id !== nd.chiNhanhId) return { xem: false, quanTri: false, chinhChu };
    }
    return { xem: true, quanTri: true, chinhChu };
  }
  return { xem: chinhChu, quanTri: false, chinhChu };
}

export async function layHoSoDayDu(nhanVienId: string) {
  const db = sb();
  const [nv, hs, tn, tl] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nv, chuc_danh, email, dien_thoai, vai_tro, chi_nhanh_id, phong_ban_id, ngay_vao_lam, ngay_vao_chinh_thuc, ngay_nghi_viec, trang_thai_lam, khung_lam_viec, vai_tro_chuyen_mon, hoat_dong, anh_dai_dien").eq("id", nhanVienId).maybeSingle(),
    db.from("nhan_vien_ho_so").select("*").eq("nhan_vien_id", nhanVienId).maybeSingle(),
    db.from("nhan_vien_than_nhan").select("*").eq("nhan_vien_id", nhanVienId).order("tao_luc"),
    db.from("nhan_vien_tai_lieu").select("id, loai, ten_tep, mime, kich_thuoc, trang_thai, ghi_chu, tao_luc, da_go").eq("nhan_vien_id", nhanVienId).eq("da_go", false).order("tao_luc", { ascending: false }),
  ]);
  if (nv.error) throw nv.error;
  if (!nv.data) return null;
  return { nhanVien: nv.data, hoSo: hs.data, thanNhan: tn.data ?? [], taiLieu: tl.data ?? [] };
}
export type HoSoDayDu = NonNullable<Awaited<ReturnType<typeof layHoSoDayDu>>>;

/** Tóm tắt hồ sơ của mọi nhân viên đang làm: % thông tin đã điền + giấy tờ bắt buộc còn thiếu + giấy tờ chờ xác nhận. */
export async function layTomTatHoSo(ids?: string[]) {
  const db = sb();
  const [hs, tl] = await Promise.all([db.from("nhan_vien_ho_so").select("*"), db.from("nhan_vien_tai_lieu").select("nhan_vien_id, loai, da_go, trang_thai").eq("da_go", false)]);
  const hsTheo = new Map((hs.data ?? []).map((h) => [h.nhan_vien_id, h]));
  const tlTheo = new Map<string, { loai: string; da_go: boolean; trang_thai: string }[]>();
  for (const t of tl.data ?? []) tlTheo.set(t.nhan_vien_id, [...(tlTheo.get(t.nhan_vien_id) ?? []), t]);
  const ra = new Map<string, { tyLe: number; thieu: number; choXacNhan: number; ngaySinh: string | null }>();
  for (const id of ids ?? [...hsTheo.keys()]) {
    const ds = tlTheo.get(id) ?? [];
    const h = hsTheo.get(id) ?? null;
    ra.set(id, { tyLe: tyLeDienHoSo(h), thieu: giayToConThieu(ds).length, choXacNhan: ds.filter((d) => d.trang_thai === "Chờ xác nhận").length, ngaySinh: h?.ngay_sinh ?? null });
  }
  return ra;
}

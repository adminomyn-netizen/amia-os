// Vai trò THEO TỪNG chi nhánh (như SalonHero #/staff "Quyền chi nhánh" + nút đổi chi nhánh làm việc ở đầu trang).
// Hồ sơ nhân viên giữ CHI NHÁNH CHÍNH (chi_nhanh_id) + vai ở đó (vai_tro); bảng nhan_vien_chi_nhanh ghi các chi nhánh THÊM, mỗi nơi một vai.
// - chi_nhanh_id NULL (mọi chi nhánh) hoặc Chủ / Kỹ thuật: bỏ qua chi nhánh thêm, hành vi y như cũ.
// - Có chi nhánh chính: chỉ vào được chính + thêm. Vai, quyền và phạm vi dữ liệu = theo chi nhánh đang làm việc (cookie, kiểm lại MỖI yêu cầu).
// Cùng luật với hàm SQL public.vai_tai_chi_nhanh (migration 0280).

import { laVaiTro, quyenHieuLuc, type Quyen, type VaiTro } from "@/lib/quyen";

export const COOKIE_CHI_NHANH = "amia_cn_lam_viec";

/** Vai không bao giờ gán theo chi nhánh (DB cũng chặn bằng ràng buộc). */
export const VAI_CHI_HO_SO_CHINH: readonly VaiTro[] = ["chu", "ky_thuat"];
export const vaiGanTheoChiNhanh = (v: unknown): v is VaiTro => laVaiTro(v) && !VAI_CHI_HO_SO_CHINH.includes(v);

export type HoSoVai = { vai_tro: VaiTro; chi_nhanh_id: string | null; quyen_rieng: readonly string[] | null };
export type GanThem = { chi_nhanh_id: string; vai_tro: string };
export type CoSoDuocVao = { chiNhanhId: string; vaiTro: VaiTro; chinh: boolean };

export type VaiHieuLuc = {
  vaiTro: VaiTro;
  /** Phạm vi dữ liệu: null = mọi chi nhánh (như cũ). Người có chi nhánh = chi nhánh đang làm việc. */
  chiNhanhId: string | null;
  quyen: Quyen[];
  /** Các chi nhánh được vào (≥ 2 thì đầu trang hiện nút đổi). Rỗng = người mọi chi nhánh. */
  dsCoSo: CoSoDuocVao[];
};

/** Các chi nhánh một người được vào, chi nhánh chính đứng đầu. Rỗng = mọi chi nhánh (không giới hạn). */
export function dsCoSoDuocVao(hs: HoSoVai, them: readonly GanThem[] | null | undefined): CoSoDuocVao[] {
  if (!hs.chi_nhanh_id) return [];
  const ds: CoSoDuocVao[] = [{ chiNhanhId: hs.chi_nhanh_id, vaiTro: hs.vai_tro, chinh: true }];
  if (VAI_CHI_HO_SO_CHINH.includes(hs.vai_tro)) return ds;
  for (const g of them ?? []) {
    if (!g.chi_nhanh_id || !vaiGanTheoChiNhanh(g.vai_tro) || ds.some((d) => d.chiNhanhId === g.chi_nhanh_id)) continue;
    ds.push({ chiNhanhId: g.chi_nhanh_id, vaiTro: g.vai_tro, chinh: false });
  }
  return ds;
}

/** Vai + quyền + phạm vi theo chi nhánh đang chọn. `chon` (cookie) không thuộc danh sách được vào thì bỏ, về chi nhánh chính.
 *  Quyền riêng (Kỹ thuật tích tay) chỉ áp ở chi nhánh chính; chi nhánh thêm dùng quyền mặc định của vai ở đó. */
export function tinhVaiHieuLuc(hs: HoSoVai, them: readonly GanThem[] | null | undefined, chon?: string | null): VaiHieuLuc {
  const ds = dsCoSoDuocVao(hs, them);
  if (ds.length === 0) return { vaiTro: hs.vai_tro, chiNhanhId: null, quyen: quyenHieuLuc(hs.vai_tro, hs.quyen_rieng), dsCoSo: [] };
  const dang = ds.find((d) => d.chiNhanhId === chon) ?? ds[0];
  return { vaiTro: dang.vaiTro, chiNhanhId: dang.chiNhanhId, quyen: quyenHieuLuc(dang.vaiTro, dang.chinh ? hs.quyen_rieng : null), dsCoSo: ds };
}

/** Vai của một người tại MỘT chi nhánh cụ thể (null = không có quyền ở đó) — cho thông báo đẩy, danh sách người nhận. */
export function vaiTaiChiNhanh(hs: HoSoVai, them: readonly GanThem[] | null | undefined, chiNhanhId: string): { vaiTro: VaiTro; quyen: Quyen[] } | null {
  if (!hs.chi_nhanh_id) return { vaiTro: hs.vai_tro, quyen: quyenHieuLuc(hs.vai_tro, hs.quyen_rieng) };
  const d = dsCoSoDuocVao(hs, them).find((x) => x.chiNhanhId === chiNhanhId);
  return d ? { vaiTro: d.vaiTro, quyen: quyenHieuLuc(d.vaiTro, d.chinh ? hs.quyen_rieng : null) } : null;
}

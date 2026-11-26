// Quy trình phê duyệt nhiều bước (bê từ Approval của Lark MSC). Phần thuần: không đụng DB, dùng được ở cả trang lẫn server action.
import { CHUC_DANH_TC } from "@/lib/de-xuat";

export type BuocDuyet = {
  id: string; thu_tu: number; ten: string; nguoi_duyet_loai: string; nguoi_duyet_gia_tri: string | null; du_phong_vai_tro: string[]; kiem_han_muc: boolean;
  trang_thai: "cho" | "da_duyet" | "tu_choi"; nguoi_id: string | null; luc: string | null; ghi_chu: string | null; han_xu_ly: string | null; duyet_thay: boolean;
};
export type NguoiXet = { nhanVienId: string; vaiTro: string; chucDanhTaiChinh: string | null };

export const NHAN_VAI_TRO_DU_PHONG: Record<string, string> = { chu: "Chủ", quan_ly: "Quản lý", ke_toan: "Kế toán", ky_thuat: "Kỹ thuật" };

/** Bước đang chờ duyệt = bước chưa duyệt có số thứ tự nhỏ nhất. */
export const buocHienTai = <T extends { thu_tu: number; trang_thai: string }>(ds: T[]): T | null =>
  ds.filter((b) => b.trang_thai === "cho").sort((a, b) => a.thu_tu - b.thu_tu)[0] ?? null;

/** Mô tả ai duyệt bước này, để hiện trên màn hình ("Kế toán trưởng", "Quản lý đơn vị"…). */
export function moTaNguoiDuyet(b: Pick<BuocDuyet, "nguoi_duyet_loai" | "nguoi_duyet_gia_tri">): string {
  if (b.nguoi_duyet_loai === "chuc_danh") return CHUC_DANH_TC[b.nguoi_duyet_gia_tri ?? ""] ?? (b.nguoi_duyet_gia_tri ?? "");
  if (b.nguoi_duyet_loai === "quan_ly_chi_nhanh") return "Quản lý đơn vị";
  if (b.nguoi_duyet_loai === "vai_tro") return NHAN_VAI_TRO_DU_PHONG[b.nguoi_duyet_gia_tri ?? ""] ?? (b.nguoi_duyet_gia_tri ?? "");
  return "Người được chỉ định";
}

/**
 * Người này có đúng vị trí để duyệt bước không.
 * Chức danh tài chính: người giữ chức danh duyệt; CHƯA AI giữ chức danh thì vai trò dự phòng của bước được duyệt (anh Nam gán chức danh ở Nhân viên là tự siết lại).
 */
export function duocDuyetBuoc(nguoi: NguoiXet, b: Pick<BuocDuyet, "nguoi_duyet_loai" | "nguoi_duyet_gia_tri" | "du_phong_vai_tro">, coNguoiGiuChucDanh: (cd: string) => boolean): boolean {
  const gt = b.nguoi_duyet_gia_tri ?? "";
  switch (b.nguoi_duyet_loai) {
    case "chuc_danh": return nguoi.chucDanhTaiChinh === gt || (!coNguoiGiuChucDanh(gt) && b.du_phong_vai_tro.includes(nguoi.vaiTro));
    case "vai_tro": return nguoi.vaiTro === gt;
    case "quan_ly_chi_nhanh": return nguoi.vaiTro === "quan_ly" || nguoi.vaiTro === "chu";
    case "nhan_vien": return nguoi.nhanVienId === gt;
    default: return false;
  }
}

/**
 * Kiểm cả bộ quy tắc: không tự duyệt đề xuất mình gửi, đúng vị trí của bước. Một người được duyệt nhiều bước của cùng đề xuất (y hệt Lark: kế toán trưởng đứng hai bước ở nhiều phiếu thật).
 * Kỹ thuật được duyệt thay mọi bước (ghi "duyệt thay"), như luật cũ. Trả lỗi tiếng Việt hoặc null; thay = true khi Kỹ thuật duyệt thay.
 */
export function kiemTraDuyet(p: { nguoi: NguoiXet; nguoiGuiId: string; buoc: BuocDuyet; daDuyetBoi?: Set<string>; coNguoiGiuChucDanh: (cd: string) => boolean }): { loi: string | null; thay: boolean } {
  const dung = duocDuyetBuoc(p.nguoi, p.buoc, p.coNguoiGiuChucDanh);
  if (p.nguoi.vaiTro === "ky_thuat") return { loi: null, thay: !dung };
  if (p.nguoiGuiId === p.nguoi.nhanVienId) return { loi: "Người gửi không tự duyệt đề xuất của mình.", thay: false };
  if (!dung) return { loi: `Bước «${p.buoc.ten}» do ${moTaNguoiDuyet(p.buoc)} duyệt.`, thay: false };
  return { loi: null, thay: false };
}

// ─── Số tiền bằng chữ (form Lark có ô "Số tiền bằng chữ") ───
const CHU_SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function docBaSo(n: number, daiDu: boolean): string {
  const tram = Math.floor(n / 100), chuc = Math.floor((n % 100) / 10), dv = n % 10;
  const out: string[] = [];
  if (tram > 0 || daiDu) out.push(`${CHU_SO[tram]} trăm`);
  if (chuc > 1) out.push(`${CHU_SO[chuc]} mươi`);
  else if (chuc === 1) out.push("mười");
  else if ((tram > 0 || daiDu) && dv > 0) out.push("lẻ");
  if (dv === 1 && chuc > 1) out.push("mốt");
  else if (dv === 5 && chuc > 0) out.push("lăm");
  else if (dv > 0) out.push(CHU_SO[dv]);
  return out.join(" ");
}
export function soTienBangChu(so: number | null | undefined): string {
  if (so == null || !Number.isFinite(so)) return "";
  let n = Math.round(Math.abs(so));
  if (n === 0) return "Không đồng";
  const DON_VI = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
  const nhom: number[] = [];
  while (n > 0) { nhom.push(n % 1000); n = Math.floor(n / 1000); }
  const phan: string[] = [];
  for (let i = nhom.length - 1; i >= 0; i--) {
    if (nhom[i] === 0) continue;
    const daiDu = i < nhom.length - 1;
    phan.push(docBaSo(nhom[i], daiDu) + DON_VI[i]);
  }
  const s = `${so < 0 ? "Âm " : ""}${phan.join(" ")} đồng`.replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

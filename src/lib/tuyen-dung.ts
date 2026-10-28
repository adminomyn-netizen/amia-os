// Hằng số và báo cáo tuyển dụng dùng chung cho máy chủ và giao diện (bê từ Omyn HRM, theo Base "Tuyển dụng" của MSC).
export const BUOC_UNG_VIEN = ["Mới nộp", "Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị", "Nhận việc", "Không đạt"] as const;
export const TRANG_THAI_TIN = ["Đang tuyển", "Đang phỏng vấn", "Đã đóng"] as const;
export const NGUON_UNG_VIEN = ["TopCV", "Facebook", "Zalo", "Website", "Người quen giới thiệu", "Khác"] as const;
export const TRANG_THAI_YEU_CAU = ["Chờ tiếp nhận", "Đã tiếp nhận", "Đang đăng tin", "Hoàn thành", "Từ chối", "Huỷ"] as const;
export const LOAI_TUYEN = ["Thay thế", "Trong định biên", "Ngoài định biên", "Thời vụ"] as const;
export const KENH_DANG = ["Facebook", "Zalo", "TopCV", "Website", "LinkedIn", "VietnamWorks", "Nội bộ", "Khác"] as const;
export const LY_DO_KHONG_DAT = ["Không đủ kinh nghiệm", "Không phù hợp văn hoá", "Mức lương kỳ vọng cao", "Không liên hệ được", "Từ chối offer", "Khác"] as const;
export type TrangThaiYeuCau = (typeof TRANG_THAI_YEU_CAU)[number];

/** Yêu cầu chỉ đi tiến theo thứ tự, không nhảy cóc; đã Hoàn thành / Từ chối / Huỷ thì khép lại (không xoá, không mở lại). */
const BUOC_TIEP: Record<TrangThaiYeuCau, readonly TrangThaiYeuCau[]> = {
  "Chờ tiếp nhận": ["Đã tiếp nhận", "Từ chối", "Huỷ"], "Đã tiếp nhận": ["Đang đăng tin", "Huỷ"], "Đang đăng tin": ["Hoàn thành", "Huỷ"], "Hoàn thành": [], "Từ chối": [], "Huỷ": [],
};
export const buocTiepTheoYeuCau = (tt: string): readonly TrangThaiYeuCau[] => BUOC_TIEP[tt as TrangThaiYeuCau] ?? [];

type TinBc = { id: string; vi_tri: string; so_luong_can: number; yeu_cau_id: string | null };
type UvBc = { tin_id: string; trang_thai: string; nguon: string | null; ngay_nhan_viec: string | null };
type KenhBc = { tin_id: string; kenh: string; chi_phi: number };
type YcBc = { id: string; trang_thai: string; tao_luc: string };
const NGAY_MS = 86_400_000;

/** Báo cáo tuyển dụng: phễu theo bước, nguồn ứng viên, chi phí theo kênh và theo tin, chi phí mỗi người nhận việc, số ngày từ yêu cầu đến khi nhận việc. */
export function tinhBaoCaoTuyenDung(d: { tin: TinBc[]; ungVien: UvBc[]; kenh: KenhBc[]; yeuCau: YcBc[] }) {
  const phau = BUOC_UNG_VIEN.map((buoc) => ({ buoc, so: d.ungVien.filter((u) => u.trang_thai === buoc).length }));
  const nhanViec = d.ungVien.filter((u) => u.trang_thai === "Nhận việc");
  const theoNguon = [...new Set(d.ungVien.map((u) => u.nguon || "Chưa ghi nguồn"))].map((nguon) => {
    const ds = d.ungVien.filter((u) => (u.nguon || "Chưa ghi nguồn") === nguon);
    return { nguon, so: ds.length, nhanViec: ds.filter((u) => u.trang_thai === "Nhận việc").length };
  }).sort((a, b) => b.so - a.so);
  const theoKenh = [...new Set(d.kenh.map((k) => k.kenh))].map((kenh) => {
    const ds = d.kenh.filter((k) => k.kenh === kenh);
    return { kenh, soBai: ds.length, chiPhi: ds.reduce((s, k) => s + Number(k.chi_phi), 0) };
  });
  const tongChiPhi = d.kenh.reduce((s, k) => s + Number(k.chi_phi), 0);
  const theoTin = d.tin.map((t) => {
    const uv = d.ungVien.filter((u) => u.tin_id === t.id), nv = uv.filter((u) => u.trang_thai === "Nhận việc").length;
    return { id: t.id, viTri: t.vi_tri, canTuyen: t.so_luong_can, ungVien: uv.length, nhanViec: nv, chiPhi: d.kenh.filter((k) => k.tin_id === t.id).reduce((s, k) => s + Number(k.chi_phi), 0), conThieu: Math.max(t.so_luong_can - nv, 0) };
  });
  const ngay: number[] = [];
  for (const y of d.yeuCau) {
    const tinCuaYc = d.tin.filter((t) => t.yeu_cau_id === y.id).map((t) => t.id);
    const ds = nhanViec.filter((u) => tinCuaYc.includes(u.tin_id) && u.ngay_nhan_viec).map((u) => Date.parse(u.ngay_nhan_viec as string));
    if (ds.length) ngay.push(Math.max(0, Math.round((Math.min(...ds) - Date.parse(y.tao_luc)) / NGAY_MS)));
  }
  return {
    phau, theoNguon, theoKenh, theoTin, tongChiPhi, soNhanViec: nhanViec.length,
    chiPhiMoiNguoi: nhanViec.length ? Math.round(tongChiPhi / nhanViec.length) : null,
    ngayLapDayTb: ngay.length ? Math.round(ngay.reduce((s, x) => s + x, 0) / ngay.length) : null,
    yeuCauTheoTrangThai: TRANG_THAI_YEU_CAU.map((tt) => ({ tt, so: d.yeuCau.filter((y) => y.trang_thai === tt).length })),
  };
}

/** Nội dung bài đăng soạn sẵn để dán lên Facebook/Zalo/TopCV. */
export function soanBaiDang(t: { vi_tri: string; so_luong_can: number; chi_nhanh?: string | null; han_nop?: string | null; mo_ta?: string | null }) {
  return [
    `AMIA TUYỂN DỤNG: ${t.vi_tri.toUpperCase()}`,
    `Số lượng: ${t.so_luong_can}${t.chi_nhanh ? ` · Cơ sở: ${t.chi_nhanh}` : ""}`,
    t.mo_ta?.trim() ? `\nMô tả, yêu cầu:\n${t.mo_ta.trim()}` : "",
    t.han_nop ? `\nHạn nộp hồ sơ: ${t.han_nop.split("-").reverse().join("/")}` : "",
    "\nỨng viên quan tâm gửi CV hoặc liên hệ bộ phận Hành chính nhân sự AMIA.",
  ].filter(Boolean).join("\n");
}

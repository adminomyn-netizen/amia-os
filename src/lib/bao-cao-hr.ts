import { congNgay } from "@/lib/dinh-dang";
import { soNgayGiua } from "@/lib/lich-hr";

/** Phần trăm một chữ số thập phân; mẫu bằng 0 thì 0 (không chia cho 0). */
export const tiLe = (tu: number, mau: number) => (mau > 0 ? Math.round((tu * 1000) / mau) / 10 : 0);

type NvThuViec = { id: string; ngay_vao_lam: string | null; ngay_vao_chinh_thuc: string | null; ngay_nghi_viec: string | null; hoat_dong: boolean };

/** Báo cáo onboarding/thử việc. Đang thử việc = còn làm, chưa có ngày chính thức. Tỉ lệ đạt = lên chính thức / (lên chính thức + nghỉ khi còn thử việc). Hạn thử việc: theo HĐ thử việc, không có thì 60 ngày từ ngày vào làm. */
export function tomTatThuViec(nv: NvThuViec[], hanHd: Map<string, string | null>, hom: string, sapHetNgay = 30) {
  const dangThu = nv.filter((n) => n.hoat_dong && !n.ngay_nghi_viec && n.ngay_vao_lam && !n.ngay_vao_chinh_thuc);
  const daLen = nv.filter((n) => n.ngay_vao_lam && n.ngay_vao_chinh_thuc).length;
  const nghiKhiThu = nv.filter((n) => n.ngay_vao_lam && !n.ngay_vao_chinh_thuc && n.ngay_nghi_viec).length;
  const hetHan = dangThu.map((n) => { const han = hanHd.get(n.id) ?? congNgay(n.ngay_vao_lam!, 60); return { id: n.id, han, conLai: soNgayGiua(hom, han) }; })
    .filter((r) => r.conLai <= sapHetNgay).sort((a, b) => a.conLai - b.conLai);
  return { dangThu: dangThu.length, daLen, nghiKhiThu, tiLeDat: tiLe(daLen, daLen + nghiKhiThu), sapHetHan: hetHan };
}

/** Tiến độ lộ trình onboarding của một người: số mốc xong / tổng, số mốc quá hạn chưa xong. */
export function tienDoOnboarding(ngayVao: string, moc: { id: string; sau_ngay: number }[], xong: Set<string>, hom: string) {
  const daXong = moc.filter((m) => xong.has(m.id)).length;
  const quaHan = moc.filter((m) => !xong.has(m.id) && congNgay(ngayVao, m.sau_ngay) < hom).length;
  return { xong: daXong, tong: moc.length, quaHan };
}

type DongLuong = { nhan_vien_id: string; gross: number | string; hoa_hong: number | string; bhxh_nld: number | string; thuc_tra: number | string };
/** Công lương của một kỳ gộp theo phòng ban (người chưa gán phòng vào nhóm "Chưa gán phòng"). */
export function gopLuongTheoPhong(dong: DongLuong[], phongCua: (nhanVienId: string) => string | null, tenPhong: (id: string) => string) {
  const m = new Map<string, { phong: string; soNguoi: number; gross: number; hoaHong: number; bhxh: number; thucTra: number }>();
  for (const d of dong) {
    const id = phongCua(d.nhan_vien_id), khoa = id ?? "-";
    const g = m.get(khoa) ?? { phong: id ? tenPhong(id) : "Chưa gán phòng", soNguoi: 0, gross: 0, hoaHong: 0, bhxh: 0, thucTra: 0 };
    g.soNguoi += 1; g.gross += Number(d.gross); g.hoaHong += Number(d.hoa_hong); g.bhxh += Number(d.bhxh_nld); g.thucTra += Number(d.thuc_tra);
    m.set(khoa, g);
  }
  return [...m.values()].sort((a, b) => b.thucTra - a.thucTra);
}

/** Quân số và biến động trong khoảng [tu, den]: vào mới, nghỉ việc, tỉ lệ nghỉ trên quân số đầu kỳ (đầu kỳ = quân số cuối kỳ - vào + nghỉ). */
export function bienDongQuanSo(nv: { ngay_vao_lam: string | null; ngay_nghi_viec: string | null }[], tu: string, den: string) {
  const trong = (d: string | null) => !!d && d >= tu && d <= den;
  const vao = nv.filter((n) => trong(n.ngay_vao_lam)).length;
  const nghi = nv.filter((n) => trong(n.ngay_nghi_viec)).length;
  const cuoiKy = nv.filter((n) => (!n.ngay_vao_lam || n.ngay_vao_lam <= den) && (!n.ngay_nghi_viec || n.ngay_nghi_viec > den)).length;
  const dauKy = cuoiKy - vao + nghi;
  return { dauKy, vao, nghi, cuoiKy, tiLeNghi: tiLe(nghi, dauKy) };
}
